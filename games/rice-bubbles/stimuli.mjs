import {FOOD_TYPES,FOOD_IDS} from './rules.mjs';
const INK=0x263248,PAPER=0xfff8e4;
const SHAPES={
  baozi:['.......###.......','......#####......','....#########....','...###########...','..#############..','.###############.','#################','#################','#################','.###############.','.###############.','..#############..','...###########...','.....#######.....'],
  jiaozi:['...###...###...###..','..###############..','.#################.','###################','###################','.#################.','..###############..','...#############...','....###########....','......#######......','........###........'],
  corn:['....#####....','...#######...','...#######...','...#######...','...#######...','...#######...','...#######...','...#######...','...#######...','...#######...','.#.#######.#.','#############','.###########.','..#########..','...#######...','....#####....','.....###.....','......#......'],
  zongzi:['........#........','.......###.......','......#####......','.....#######.....','....#########....','...###########...','..#############..','.###############.','#################','#################','.###############.','..#############..','...###########...','....#########....','.....#######.....','......#####......'],
  tanghulu:['.....###.....','....#####....','...#######...','...#######...','....#####....','.....###.....','......#......','....#####....','...#######...','...#######...','....#####....','.....###.....','......#......','....#####....','...#######...','...#######...','....#####....','.....###.....','......#......','......#......','......#......','......#......'],
  sweetpotato:['............###....','.........#######...','.......##########..','.....#############.','...################','..#################','.##################','##################.','#################..','.##############....','..###########......','...########........','....####...........'],
  youtiao:['..###...###..','.#####.#####.','.#####.#####.','######.######','.#####.#####.','.#####.#####.','######.######','######.######','.#####.#####.','.#####.#####.','######.######','######.######','.#####.#####.','.#####.#####.','######.######','.#####.#####.','.#####.#####.','..###...###..'],
  mooncake:['.....#######.....','...###########...','..#############..','.###############.','.###############.','#################','#################','#################','#################','#################','#################','#################','.###############.','.###############.','..#############..','...###########...','.....#######.....']
};
const BASE={baozi:0xffedc8,jiaozi:0xfff4d7,corn:0xf0c455,zongzi:0x6d9771,tanghulu:0xd55554,sweetpotato:0xa65d78,youtiao:0xe7ad53,mooncake:0xc78a45};
const SHADE={baozi:0xd9b989,jiaozi:0xd9b989,corn:0x477b57,zongzi:0x446c57,tanghulu:0xa73945,sweetpotato:0x713d5e,youtiao:0xa56a30,mooncake:0x955e33};
function commandsFor(id){
 const rows=SHAPES[id],w=Math.max(...rows.map(row=>row.length)),h=rows.length,mask=new Set(),pixels=new Map();
 const key=(x,y)=>x+','+y;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rows[y][x]==='#')mask.add(key(x,y));
 for(const k of mask){const[x,y]=k.split(',').map(Number);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.abs(dx)+Math.abs(dy)<=2)pixels.set(key(x+dx,y+dy),PAPER);}
 for(const k of mask){const[x,y]=k.split(',').map(Number);for(const[dx,dy]of[[0,0],[-1,0],[1,0],[0,-1],[0,1]])pixels.set(key(x+dx,y+dy),INK);}
 for(const k of mask){const[x,y]=k.split(',').map(Number);pixels.set(k,y>=h-3?SHADE[id]:BASE[id]);}
 const rect=(x,y,ww,hh,color)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(mask.has(key(xx,yy)))pixels.set(key(xx,yy),color);};
 if(id==='baozi'){
  rect(7,1,3,2,0xe3c38e);for(const[x,y]of[[4,4],[6,3],[9,3],[11,4]]){rect(x,y,1,3,0xc7a474);rect(x+1,y+1,1,2,0xfffbdf);}rect(4,10,8,1,0xfff6dd);
 }else if(id==='jiaozi'){
  for(let x=3;x<17;x+=3){rect(x,1,1,4,0xc2a178);rect(x+1,2,1,3,0xfffcdf);}rect(6,7,7,1,0xe5c69d);
 }else if(id==='corn'){
  for(let y=1;y<11;y+=3)for(let x=4;x<10;x+=3){rect(x,y,2,2,0xffe99a);rect(x,y+2,2,1,0xbc8c39);}
  for(let y=10;y<h;y++){rect(y-10,y,3,1,0x527e5c);rect(10-(y-10),y,3,1,0x72995b);}rect(6,13,1,4,0xc0d18b);
 }else if(id==='zongzi'){
  for(let y=3;y<14;y++){rect(3+Math.floor((y-3)/2),y,1,1,0xa8bf85);rect(9+Math.floor((y-3)/3),y,1,1,0x416d59);}
  rect(2,9,13,1,0xe7d9ad);rect(7,2,1,12,0xf5e9c4);rect(7,9,2,2,0xa18c64);
 }else if(id==='tanghulu'){
  for(const y of[0,7,13]){rect(4,y+1,2,2,0xffd2a1);rect(8,y+2,1,3,0xa83245);rect(5,y+4,3,1,0xe77b65);}rect(6,18,1,4,0xd6af77);
 }else if(id==='sweetpotato'){
  rect(6,4,6,1,0xd98a90);rect(3,7,8,1,0x854761);rect(5,10,5,1,0x713d5e);
  rect(14,2,3,1,0xe6a563);rect(13,3,5,1,0xf3ba6f);rect(13,4,5,2,0xf0a755);rect(14,6,4,1,0xcf7b43);rect(15,3,1,2,0xffd38c);
 }else if(id==='youtiao'){
  for(let y=2;y<16;y+=4){rect(2,y,2,2,0xffd987);rect(3,y+2,2,1,0xb87934);rect(8,y+1,2,2,0xffd987);rect(8,y+3,3,1,0xb87934);}
 }else if(id==='mooncake'){
  rect(3,3,11,1,0xe9b86c);rect(3,12,11,1,0x965d32);
  for(const x of[5,11])rect(x,5,1,7,0x92542f);for(const y of[5,8,11])rect(5,y,7,1,0x92542f);
  rect(7,6,2,1,0xf1c77e);rect(7,9,2,1,0xf1c77e);
 }
 const result=[];
 for(let y=-2;y<h+2;y++){
  let x=-2;while(x<w+2){const color=pixels.get(key(x,y));if(color===undefined){x++;continue;}let end=x+1;while(end<w+2&&pixels.get(key(end,y))===color)end++;result.push([x-Math.floor(w/2),y-Math.floor(h/2),end-x,1,color]);x=end;}
 }
 return Object.freeze(result);
}
const FOOD_COMMANDS=Object.fromEntries(FOOD_IDS.map(id=>[id,commandsFor(id)]));
const WRAPPED_RADII=Object.fromEntries(FOOD_IDS.map(id=>[id,Math.ceil(Math.max(...FOOD_COMMANDS[id].map(([x,y,w,h])=>Math.max(Math.hypot(x,y),Math.hypot(x+w,y),Math.hypot(x,y+h),Math.hypot(x+w,y+h)))))+2]));
export const STIMULUS_VARIANTS=Object.freeze({rice:Object.freeze(FOOD_TYPES.map(f=>f.label)),bubble:Object.freeze(['圆泡','扁泡','长泡','大圆泡','斜长泡','方圆泡']),wrapped:Object.freeze(FOOD_TYPES.map(f=>f.label+'泡泡'))});
export const STIMULUS_RADIUS=14;
export function stimulusRadius(item){return item.wrapped?WRAPPED_RADII[item.foodId]+2:STIMULUS_RADIUS;}
export function foodCrumbColor(id){return BASE[id];}
export function paintFood(g,x,y,scale=2,foodId='baozi',alpha=1){
 const commands=FOOD_COMMANDS[foodId];if(!commands)throw Error('Unknown food '+foodId);
 for(const[xx,yy,w,h,color]of commands)g.rect(Math.round(x+xx*scale),Math.round(y+yy*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))).fill({color,alpha});
}
// Kept as the existing painter API for legends and geometry probes.
export function paintRice(g,x,y,scale=2,variant=0,alpha=1){paintFood(g,x,y,scale,FOOD_IDS[variant%FOOD_IDS.length],alpha);}
function bubblePixels(draw,variant){
  function ring(rx,ry,boxy=false,tilted=false){
    for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++){
      const xx=tilted?x*.866+y*.5:x,yy=tilted?-x*.5+y*.866:y;
      const radius=boxy?((Math.abs(xx/rx)**4+Math.abs(yy/ry)**4)**.25):Math.hypot(xx/rx,yy/ry);
      if(radius>=.78&&radius<=1.16)draw(x,y,1,1,INK);
      if(radius>=.88&&radius<=1.04)draw(x,y,1,1,0xc1e6e3);
      if(radius>=.88&&radius<=1.04&&x<-1&&y<-ry*.3)draw(x,y,1,1,0xffffff);
    }
  }
  ring(variant===1?9:variant===2?6:variant===3?10:variant===4?9:8,variant===1?6:variant===2?9:variant===3?10:variant===4?6:8,variant===5,variant===4);
}

function paintBubbleUncached(g,x,y,scale=2,variant=0,alpha=1){
 bubblePixels((xx,yy,w,h,color)=>g.rect(Math.round(x+xx*scale),Math.round(y+yy*scale),w*scale,h*scale).fill({color,alpha}),variant);
}
function paintWrappedUncached(g,x,y,scale,foodId,alpha){
 // Keep the complete shell visible from onset, with a readable food icon inside.
 paintFood(g,x,y,scale,foodId,alpha);
 const radius=WRAPPED_RADII[foodId],limit=radius+2;
 for(let yy=-limit;yy<=limit;yy++)for(let xx=-limit;xx<=limit;xx++){
  const r=Math.hypot(xx,yy);
  if(r>=radius-.75&&r<=radius+1.5)g.rect(Math.round(x+xx*scale),Math.round(y+yy*scale),scale,scale).fill({color:INK,alpha});
  if(r>=radius-.25&&r<=radius+.75)g.rect(Math.round(x+xx*scale),Math.round(y+yy*scale),scale,scale).fill({color:xx<-2&&yy<-radius*.25?0xffffff:0xc1e6e3,alpha});
 }
}
// Raster geometry is built once; active frames only replay small pixel runs.
function collectPixels(paint){const out=[],g={rect(...rect){this.pending=rect;return this;},fill({color}){out.push([...this.pending,color]);return this;}};paint(g);return out;}
const BUBBLE_COMMANDS=Array.from({length:6},(_,variant)=>collectPixels(g=>paintBubbleUncached(g,0,0,1,variant)));
const WRAPPED_COMMANDS=Object.fromEntries(FOOD_IDS.map(id=>[id,collectPixels(g=>paintWrappedUncached(g,0,0,1,id,1))]));
function replay(g,commands,x,y,scale,alpha){for(const[xx,yy,w,h,color]of commands)g.rect(Math.round(x+xx*scale),Math.round(y+yy*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))).fill({color,alpha});}
export function paintBubble(g,x,y,scale=2,variant=0,alpha=1){replay(g,BUBBLE_COMMANDS[variant],x,y,scale,alpha);}
function paintWrapped(g,x,y,scale,foodId,alpha){replay(g,WRAPPED_COMMANDS[foodId],x,y,scale,alpha);}
export function paintStimulus(g,item,x,y,scale=2,alpha=1){
 if(item.kind==='rice')paintFood(g,x,y,scale,item.foodId,alpha);
 else if(item.wrapped)paintWrapped(g,x,y,scale,item.foodId,alpha);
 else paintBubble(g,x,y,scale,item.variant,alpha);
}
export function stimulusBottom(kind,variant=0,scale=2){
 let bottom=-Infinity;const probe={rect(x,y,w,h){bottom=Math.max(bottom,y+h);return this;},fill(){return this;}};
 (kind==='rice'?paintRice:paintBubble)(probe,0,0,scale,variant);return bottom;
}
const FOOTPRINT_BOTTOMS=new Map();
export function itemBottom(item,scale=2){
 const key=(item.kind==='rice'?'food:'+item.foodId:item.wrapped?'wrapped:'+item.foodId:'bubble:'+item.variant)+':'+scale;
 if(FOOTPRINT_BOTTOMS.has(key))return FOOTPRINT_BOTTOMS.get(key);
 let bottom=-Infinity;const probe={rect(x,y,w,h){bottom=Math.max(bottom,y+h);return this;},fill(){return this;}};
 paintStimulus(probe,item,0,0,scale);FOOTPRINT_BOTTOMS.set(key,bottom);return bottom;
}
export function paintPickyBadge(g,foodId,introStep=10){
 const rise=[8,5,2,-2,0,0,0,0,0,0,0][Math.min(10,introStep)];
 const put=(x,y,w,h,color,alpha=1)=>g.rect(x,y+rise,w,h).fill({color,alpha});
 put(-23,-24,46,48,0x32202b);put(-25,-22,50,44,0x32202b);
 put(-23,-22,46,44,0xe5a2a1);put(-21,-20,42,40,0x803c4b);put(-19,-18,38,2,0xa85a68);
 paintFood({rect(x,y,w,h){g.rect(x,y+rise,w,h);return this;},fill:style=>{g.fill(style);return g;}},0,0,1.5,foodId);
 if(introStep<9){const d=28+introStep*2;for(const side of[-1,1]){put(side*d,-9,2,6,0xf3d391,1-introStep/10);put(side*(d-4),-18,5,2,0xfff8e4,1-introStep/10);}}
}
function pixelSVG(svg,width,height,paint){
 const paths=new Map(),probe={rect(x,y,w,h){this.pending=[x,y,w,h];return this;},fill({color,alpha=1}){const k='#'+color.toString(16).padStart(6,'0');const[x,y,w,h]=this.pending;paths.set(k,(paths.get(k)??'')+`M${x} ${y}h${w}v${h}h${-w}z`);return this;}};
 paint(probe);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('shape-rendering','crispEdges');svg.innerHTML=[...paths].map(([color,d])=>`<path fill="${color}" d="${d}"/>`).join('');
}
export function paintLegend(svg,kind){
 const legends={
  rice:g=>paintFood(g,24,24,2,'baozi'),
  bubble:g=>paintBubble(g,24,24,1.25,0),
  wrapped:g=>paintWrapped(g,24,24,22/(WRAPPED_RADII.corn+2),'corn',1),
  picky:g=>paintPickyBadge({rect(x,y,w,h){g.rect(x+27,y+27,w,h);return this;},fill:style=>g.fill(style)},'baozi'),
 };
 const size=kind==='picky'?54:48;
 pixelSVG(svg,size,size,legends[kind]);
}
export function paintInputHint(svg){
 pixelSVG(svg,112,28,g=>{paintFood(g,13,14,1,'baozi');g.rect(32,5,34,18).fill({color:INK});g.rect(34,6,30,14).fill({color:0xf6f0dd});g.rect(39,16,20,2).fill({color:0x626974});paintWrapped(g,87,14,12/(WRAPPED_RADII.corn+2),'corn',1);});
}
