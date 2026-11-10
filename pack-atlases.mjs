import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const align=n=>Math.ceil(n/16)*16;

// Lossless offline packing. Anchors, trims, events and all animation timings
// remain untouched. Identical cel pixels can share one texture rectangle.
export async function packAtlases(sourceDir,outDir){
  const m=JSON.parse(await readFile(resolve(sourceDir,'g10-clip-manifest.json'),'utf8'));
  const sourcePages=await Promise.all(m.atlases.map(p=>sharp(resolve(sourceDir,p.image)).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  const unique=new Map(),byFrame=new Map();
  for(const f of m.frames){
    const[x,y,w,h]=f.rect,page=sourcePages[f.page],bytes=Buffer.alloc(w*h*4);
    for(let row=0;row<h;row++)page.data.copy(bytes,row*w*4,((y+row)*page.info.width+x)*4,((y+row)*page.info.width+x+w)*4);
    const key=w+':'+h+':'+hash(bytes);if(!unique.has(key))unique.set(key,{key,w,h,bytes});byFrame.set(f.id,key);
  }
  const cels=[...unique.values()].sort((a,b)=>b.h-a.h||b.w-a.w||a.key.localeCompare(b.key));
  function layout(width){
    const pages=[];const placements=new Map();
    for(const cel of cels){
      let selected=null;
      for(let i=0;i<pages.length;i++)for(const shelf of pages[i].shelves)if(cel.h+2<=shelf.h&&shelf.x+cel.w+2<=width&&(!selected||width-shelf.x<selected.space))selected={i,shelf,space:width-shelf.x};
      if(!selected){let i=pages.findIndex(p=>p.height+cel.h+2<=2048);if(i<0){i=pages.length;pages.push({height:0,width:0,shelves:[]});}const p=pages[i],shelf={x:0,y:p.height,h:cel.h+2};p.shelves.push(shelf);p.height+=shelf.h;selected={i,shelf};}
      const p=pages[selected.i],s=selected.shelf;placements.set(cel.key,{page:selected.i,x:s.x+1,y:s.y+1});s.x+=cel.w+2;p.width=Math.max(p.width,s.x);
    }
    for(const p of pages){p.width=align(p.width);p.height=align(p.height);}return{pages,placements,area:pages.reduce((s,p)=>s+p.width*p.height,0)};
  }
  const packed=[layout(1024),layout(2048)].sort((a,b)=>a.area-b.area)[0];
  const atlases=[],outputPages=[];await mkdir(resolve(outDir,'atlas'),{recursive:true});
  for(let i=0;i<packed.pages.length;i++){
    const p=packed.pages[i],bytes=Buffer.alloc(p.width*p.height*4);
    for(const cel of cels){const at=packed.placements.get(cel.key);if(at.page!==i)continue;for(let row=0;row<cel.h;row++)cel.bytes.copy(bytes,((at.y+row)*p.width+at.x)*4,row*cel.w*4,(row+1)*cel.w*4);}
    const png=await sharp(bytes,{raw:{width:p.width,height:p.height,channels:4}}).png({compressionLevel:9}).toBuffer();
    const image='atlas/'+hash(png).slice(0,20)+'.png';await writeFile(resolve(outDir,image),png);atlases.push({image,width:p.width,height:p.height});
    outputPages.push(await sharp(png).ensureAlpha().raw().toBuffer());
  }
  for(const cel of cels){const at=packed.placements.get(cel.key),page=packed.pages[at.page],bytes=outputPages[at.page];for(let row=0;row<cel.h;row++)if(!cel.bytes.subarray(row*cel.w*4,(row+1)*cel.w*4).equals(bytes.subarray(((at.y+row)*page.width+at.x)*4,((at.y+row)*page.width+at.x+cel.w)*4)))throw Error('Repacked pixels differ');}
  const frames=m.frames.map(f=>{const at=packed.placements.get(byFrame.get(f.id));return{...f,page:at.page,rect:[at.x,at.y,f.rect[2],f.rect[3]]};});
  const report={sourceFrames:m.frames.length,uniqueCels:cels.length,rgbaExact:true,sourceDecodedBytes:m.atlases.reduce((s,p)=>s+p.width*p.height*4,0),packedDecodedBytes:packed.area*4,pages:atlases};
  return{manifest:{schema:m.schema,assetVersion:m.assetVersion,pixel:m.pixel,atlases,frames,clips:m.clips},report};
}
