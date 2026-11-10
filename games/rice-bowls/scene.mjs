const NAMES=['小鸥','小蟹','海豹','企鹅','白兔','小猫'];
export const guestName=id=>NAMES[Number(id.split('-')[1])];
export const bowlName=id=>({wave:'波纹碗',flower:'花边碗',stripe:'条纹碗',check:'格子碗',dot:'圆点碗',triangle:'三角碗'})[id];
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};

export async function loadSprites(options={}){
  let manifest=options.manifest;
  if(!manifest){const response=await fetch(new URL('./assets/sprites.json',import.meta.url));if(!response.ok)throw Error(`像素清单载入失败 (${response.status})`);manifest=await response.json();}
  let image;
  if(options.loadAtlas)image=await options.loadAtlas(manifest.image);
  else{image=new Image();image.src=new URL('./assets/'+manifest.image,import.meta.url).href;await image.decode();}
  if(image.width!==manifest.width||image.height!==manifest.height)throw Error('像素图集尺寸不符');
  return new Sprites(manifest,image);
}
class Sprites{
  constructor(manifest,image){this.manifest=manifest;this.image=image;}
  crop(ctx,id,x,y,w,h){const f=this.manifest.frames[id];if(!f)throw Error('Missing sprite '+id);ctx.imageSmoothingEnabled=false;ctx.drawImage(this.image,...f.rect,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  fit(ctx,id,x,y,w,h){
    const f=this.manifest.frames[id],bounds=this.manifest.groups[f.group];
    const scale=Math.min(w/(bounds[2]-bounds[0]),h/(bounds[3]-bounds[1]));
    const left=x+(w-(bounds[2]-bounds[0])*scale)/2,top=y+(h-(bounds[3]-bounds[1])*scale)/2;
    this.crop(ctx,id,left+(f.trim[0]-bounds[0])*scale,top+(f.trim[1]-bounds[1])*scale,f.trim[2]*scale,f.trim[3]*scale);
  }
  icon(canvas,id,padding=4){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);this.fit(ctx,id,padding,padding,canvas.width-padding*2,canvas.height-padding*2);}
}

export class BowlScene{
  constructor(canvas,sprites){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.sprites=sprites;this.drawCount=0;this.guestAnchor=[246,64];}
  whale(clip,t){
    const c=this.sprites.manifest.clips[clip],index=c.loop?Math.floor(t/1000*c.frames.length)%c.frames.length:Math.min(c.frames.length-1,Math.floor(clamp(t/1000)*c.frames.length));
    const id=c.frames[index],f=this.sprites.manifest.frames[id],root=[80,200];
    this.sprites.crop(this.ctx,id,root[0]+f.trim[0]-f.anchor[0],root[1]+f.trim[1]-f.anchor[1],f.trim[2],f.trim[3]);
    return{hand:[root[0]+f.hand[0]-f.anchor[0],root[1]+f.hand[1]-f.anchor[1]],pot:[root[0]+f.potHand[0]-f.anchor[0],root[1]+f.potHand[1]-f.anchor[1]]};
  }
  draw(snapshot){
    this.drawCount++;const ctx=this.ctx;ctx.clearRect(0,0,360,220);ctx.imageSmoothingEnabled=false;
    const phase=snapshot.phase==='paused'?snapshot.resumePhase:snapshot.phase;
    const feedback=snapshot.outcome&&(phase==='feedback'||snapshot.phase==='paused'&&snapshot.outcome),t=snapshot.elapsedMs;
    const pose=feedback?(snapshot.outcome.correct?'serve':'wrong'):'idle',points=this.whale(pose,feedback?t:snapshot.clockMs);
    this.sprites.fit(ctx,'prop/pot',points.pot[0]-24,points.pot[1]-32,48,34);
    if(feedback){
      const p=clamp(t/1000),out=snapshot.outcome,approach=Math.sin(Math.PI*p);
      const guestX=this.guestAnchor[0]-(this.guestAnchor[0]-points.hand[0]-34)*approach;
      const guestY=this.guestAnchor[1]+Math.max(0,points.hand[1]+18-this.guestAnchor[1])*approach-3*Math.abs(Math.sin(4*Math.PI*p));
      const guestPose=!out.correct&&p>.2&&p<.5?'refuse':p>.68?'accept':'idle';
      this.sprites.fit(ctx,out.guest+'/'+guestPose,guestX-26,guestY-52,52,52);
      if(p>.15){
        const chosen=!out.correct&&p<.5?out.chosen:out.correctBowl;
        let bowlX=points.hand[0],bowlY=points.hand[1];
        if(p>.70){const f=ease((p-.70)/.12);bowlX+=(guestX-bowlX)*f;bowlY+=(guestY-8-bowlY)*f;}
        this.sprites.fit(ctx,'bowl/'+chosen,bowlX-16,bowlY-20,32,23);
      }
      if(!out.correct&&p>.32&&p<.74){
        // The answer is revealed only after commitment, beside the recipient.
        const hintX=Math.round(this.guestAnchor[0]+32),hintY=Math.round(this.guestAnchor[1]-34);
        ctx.fillStyle='#f5efdf';ctx.fillRect(hintX,hintY,34,29);ctx.strokeStyle='#a88a69';ctx.lineWidth=1;ctx.strokeRect(hintX+.5,hintY+.5,33,28);
        this.sprites.fit(ctx,'bowl/'+out.correctBowl,hintX+3,hintY+3,28,23);
      }
    }
  }
}
