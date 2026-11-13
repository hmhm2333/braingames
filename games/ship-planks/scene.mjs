import {CONTACT_MS,MOTION_MS,GROW_MS,INTRO_PATCH} from './core.mjs';
import {LAYOUT,HULL,MAST,panelBox,siteBox,actorPath,worldPoint,worldDirection} from './sampan.mjs';
import {VERDICT_TICK,VERDICT_CROSS} from '../../runtime/presentation.mjs';
export {LAYOUT,panelBox,siteBox};
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t;
const WOOD={ink:'#65482e',face:'#d79a50',light:'#f4c783'};
export function leakPoint(cells){const bottom=Math.max(...cells.map(p=>p[1]));return cells.filter(p=>p[1]===bottom).sort((a,b)=>Math.abs(a[0]-1.5)-Math.abs(b[0]-1.5))[0];}
export function drawWood(c,cells,x,y,unit,alpha=1){
 const occupied=new Set(cells.map(v=>v.join(','))),line=2;c.save();c.globalAlpha=alpha;
 for(const [dx,dy]of cells){
  const px=Math.round(x+dx*unit),py=Math.round(y+dy*unit);c.fillStyle=WOOD.face;c.fillRect(px,py,unit,unit);
  c.fillStyle='#b47b3e';c.fillRect(px+3,py+Math.round(unit*.6),Math.max(2,unit-6),1);
  c.fillStyle=WOOD.ink;if(!occupied.has([dx-1,dy].join(',')))c.fillRect(px,py,line,unit);if(!occupied.has([dx+1,dy].join(',')))c.fillRect(px+unit-line,py,line,unit);if(!occupied.has([dx,dy+1].join(',')))c.fillRect(px,py+unit-line,unit,line);
  if(!occupied.has([dx,dy-1].join(','))){c.fillStyle=WOOD.ink;c.fillRect(px,py,unit,line);c.fillStyle=WOOD.light;c.fillRect(px+line,py+line,unit-line*2,line);}
 }c.restore();
}
function traceHull(c,inset=0){c.beginPath();for(const [i,[x,y]]of HULL.entries()){const px=Math.round(x+(200-x)*inset/190),py=Math.round(y+(132-y)*inset/116);i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}
function bracket(c,b,color){c.fillStyle=color;for(const[x,y,dx,dy]of [[b.x,b.y,1,1],[b.x+b.width,b.y,-1,1],[b.x,b.y+b.height,1,-1],[b.x+b.width,b.y+b.height,-1,-1]]){c.fillRect(x+(dx<0?-5:0),y+(dy<0?-1:0),5,1);c.fillRect(x+(dx<0?-1:0),y+(dy<0?-5:0),1,5);}}
function hole(c,cells,x,y){
 const unit=LAYOUT.cell,set=new Set(cells.map(v=>v.join(',')));c.fillStyle='#253d49';
 for(const [dx,dy]of cells)c.fillRect(x+dx*unit,y+dy*unit,unit,unit);
 for(const [dx,dy]of cells){const px=x+dx*unit,py=y+dy*unit;c.fillStyle='#182c37';if(!set.has([dx,dy-1].join(',')))c.fillRect(px,py,unit,2);if(!set.has([dx-1,dy].join(',')))c.fillRect(px,py,1,unit);c.fillStyle='#82aab4';if(!set.has([dx,dy+1].join(',')))c.fillRect(px+1,py+unit-1,unit-2,1);}
}
export async function loadWhale(options){
 const manifest=options.manifest??await fetch(new URL('./assets/whale.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('鲸鱼娘像素清单加载失败');return r.json();});
 let image;if(options.loadAtlas)image=await options.loadAtlas(manifest.image);else{image=new Image();image.src=new URL('./assets/'+manifest.image,import.meta.url).href;await image.decode();}
 if(image.width!==manifest.width||image.height!==manifest.height)throw Error('鲸鱼娘图集尺寸不符');return{manifest,image};
}
function paintMastRig(c,black=false){
 const color=value=>black?'#000':value;
 c.fillStyle=color('#795f43');c.fillRect(34,50,12,14);c.fillStyle=color('#d5b581');c.fillRect(36,52,8,10);
 c.fillStyle=color('#65513c');c.fillRect(36,12,8,44);c.fillStyle=color('#d5b581');c.fillRect(38,14,4,40);c.fillStyle=color('#f0d5a0');c.fillRect(38,14,2,38);
 for(let y=18;y<48;y+=2){const w=24-Math.floor((y-18)/3)*2;c.fillStyle=color('#9f8355');c.fillRect(44,y,w,2);if(w>2){c.fillStyle=color(y<32?'#f6f0dd':'#e6ddc3');c.fillRect(44,y,w-2,2);}}
 c.fillStyle=color('#65513c');c.fillRect(32,12,16,4);c.fillStyle=color('#f3d391');c.fillRect(34,12,12,2);
}
function createMast(){
 const image=document.createElement('canvas');image.width=80;image.height=96;const c=image.getContext('2d');
 // A solid wooden mast foot carries the hearts along its front edge.
 for(let y=-34;y<34;y+=2)for(let x=-34;x<34;x+=2){const r=Math.hypot(x+1,y+1);if(r>34)continue;c.fillStyle=r>30?'#795f43':r>27?(y<0?'#eed1a0':'#9f784c'):'#b68b57';c.fillRect(40+x,62+y,2,2);}
 c.fillStyle='#a77b4a';c.fillRect(14,56,52,2);c.fillRect(16,74,48,2);
 paintMastRig(c);return image;
}
export class RepairScene{
 constructor(canvas,whale,companion,occluder){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});this.companion=companion;this.lobbyCtx=companion.getContext('2d',{alpha:true});this.whale=whale;this.mast=createMast();this.drawCount=0;this.heading=0;const mask=document.createElement('canvas');mask.width=80;mask.height=96;paintMastRig(mask.getContext('2d'),true);occluder.setAttribute('href',mask.toDataURL());mask.width=0;mask.height=0;}
 drawLobby(view){
  const c=this.lobbyCtx,m=this.whale.manifest,f=m.frames[m.clips[view==='welcome'?'lobby_hold':'lobby_idle'].frames[0]],root=[100,190];
  c.clearRect(0,0,200,200);c.imageSmoothingEnabled=false;c.drawImage(this.whale.image,...f.rect,root[0]+f.trim[0]-f.anchor[0],root[1]+f.trim[1]-f.anchor[1],f.trim[2],f.trim[3]);
  if(view==='welcome'){const socket=[root[0]+f.socket[0]-f.anchor[0],root[1]+f.socket[1]-f.anchor[1]];drawWood(c,INTRO_PATCH.cells,socket[0]-24,socket[1]-24,12);}
 }
 actor(clip,t,root=LAYOUT.whale){
  const c=this.ctx,m=this.whale.manifest,sequence=m.clips[clip],id=sequence.frames[Math.min(sequence.frames.length-1,Math.floor(clamp(t)*sequence.frames.length))],f=m.frames[id];
  const p=worldPoint(root,this.heading);c.imageSmoothingEnabled=false;c.drawImage(this.whale.image,...f.rect,Math.round(p[0]+f.trim[0]-f.anchor[0]),Math.round(p[1]+f.trim[1]-f.anchor[1]),f.trim[2],f.trim[3]);
  return f.socket?[p[0]+f.socket[0]-f.anchor[0],p[1]+f.socket[1]-f.anchor[1]]:[p[0]+10,p[1]-16];
 }
 verdict(correct,t,root){
  const c=this.ctx,p=worldPoint(root,this.heading),x=p[0]+38,y=p[1]-64,alpha=Math.min(1,t*8,(1-t)*8);
  for(const [dx,dy]of correct?VERDICT_TICK:VERDICT_CROSS){c.globalAlpha=alpha;c.fillStyle='#fff8e4';c.fillRect(x+(dx-1)*3-1,y+(dy-1)*3-1,14,14);c.fillStyle='#263248';c.fillRect(x+(dx-1)*3,y+(dy-1)*3,12,12);c.fillStyle=correct?'#94bbb5':'#e5a2a1';c.fillRect(x+dx*3,y+dy*3,6,6);}c.globalAlpha=1;
 }
 boat(s){
  const c=this.ctx;
  for(const [inset,color]of [[0,'#49473f'],[2,'#c6aa7d'],[6,'#9f8355'],[10,'#c6aa7d']]){traceHull(c,inset);c.fillStyle=color;c.fill();}
  c.save();traceHull(c,11);c.clip();
  for(let yy=24;yy<244;yy+=20){c.fillStyle=(yy/20|0)%2?'#c6aa7d':'#c1a377';c.fillRect(12,yy,376,19);c.fillStyle='#a98d62';for(let x=24+(yy/20|0)%2*42;x<390;x+=84)c.fillRect(x,yy+8,16,1);}
  const patches=new Map();for(const p of s.deck){if(!p.stamp)continue;if(!patches.has(p.stamp))patches.set(p.stamp,[]);patches.get(p.stamp).push([(p.x-16)/10,(p.y-26)/10]);}
  for(const cells of patches.values())drawWood(c,cells,16,26,10,.4);
  for(const site of s.sites)hole(c,site.cells,site.x,site.y);
  if(s.growth){c.fillStyle='#f3d391';c.globalAlpha=1-s.growth.elapsedMs/GROW_MS;for(const[x,y]of s.growth.additions)c.fillRect(x+2,y+2,6,6);c.globalAlpha=1;}
  if(s.motion?.correct&&s.motion.elapsedMs>=CONTACT_MS)drawWood(c,s.motion.cells,s.motion.x,s.motion.y,10);
  if(s.lives<3){c.fillStyle='#94bbb54d';c.fillRect(18,232-(3-s.lives)*3,284,(3-s.lives)*3);}
  c.restore();
  c.drawImage(this.mast,MAST.x-40,MAST.y-56);
  c.fillStyle='#78654e';for(const x of [115,254]){c.fillRect(x,20,20,5);c.fillRect(x,239,20,5);}
  c.fillStyle='#ae9063';c.fillRect(104,12,128,4);c.fillRect(104,249,128,4);c.fillStyle='#d4b887';c.fillRect(224,9,37,9);c.fillRect(224,246,37,9);
  c.fillStyle='#94bbb5';for(const [x,y,w,h]of [[0,114,3,3],[0,140,3,2],[17,255,8,2],[280,256,6,2],[398,121,2,3]])c.fillRect(x,y,w,h);
 }
 draw(s,{hover=null,heading=0,sailing=false}={}){
  this.heading=heading;this.drawCount++;const c=this.ctx;c.clearRect(0,0,250,250);c.imageSmoothingEnabled=false;c.save();c.scale(.5,.5);c.translate(50,114);c.save();c.translate(200,136);c.rotate(heading*Math.PI/180);c.translate(-200,-136);this.boat(s);
  const m=s.motion,t=m?.elapsedMs??0;
  for(let slot=0;slot<s.sites.length;slot++){
   const hint=s.task.answer===slot&&(!m&&s.task.assisted||m&&!m.correct&&t>=CONTACT_MS);if(!hint&&hover!==slot)continue;
   const b=siteBox(s.sites[slot]);bracket(c,b,hint?'#e7c778':'#f3dfb5');if(hint){c.fillStyle='#f3d391';c.fillRect(b.x+b.width/2-2,b.y-4,4,2);}
  }
  c.restore();
  const piece=(cells,center,angle)=>{c.save();c.translate(Math.round(center[0]),Math.round(center[1]));c.rotate(angle);drawWood(c,cells,-20,-20,10);c.restore();};
  if(s.phase!=='running'||sailing){this.actor('idle_'+worldDirection('right',heading),0);c.restore();return;}
  if(!m){const hand=this.actor('hold',0);piece(s.task.cells,hand,heading*Math.PI/180);c.restore();return;}
  if(m.kind==='timeout'){const hand=this.actor('reject_down',t/MOTION_MS);piece(s.task.cells,hand,heading*Math.PI/180);if(t>=CONTACT_MS)this.verdict(false,(t-CONTACT_MS)/(MOTION_MS-CONTACT_MS),LAYOUT.whale);c.restore();return;}
  let root,socket;
  const b=panelBox(m),goal=worldPoint([b.x+20,b.y+20],heading);
  if(t<180||t>=600){
   const returning=t>=600,travel=returning?1-ease((t-600)/(MOTION_MS-600)):ease(t/180),pose=actorPath(m.path,travel,returning);root=pose.root;const d=worldDirection(pose.direction,heading);socket=this.actor(returning&&m.correct?'walk_empty_'+d:'carry_'+d,(t%150)/150,root);
  }else{root=actorPath(m.path,1).root;const p=worldPoint(root,heading),d=['right','down','left','up'][((Math.round(Math.atan2(goal[1]-p[1],goal[0]-p[0])*2/Math.PI)%4)+4)%4];socket=this.actor((t<CONTACT_MS?'press':m.correct?'seal':'reject')+'_'+d,t<CONTACT_MS?(t-180)/(CONTACT_MS-180):(t-CONTACT_MS)/(600-CONTACT_MS),root);}
  if(t<CONTACT_MS){
   const align=ease((t-180)/(CONTACT_MS-180)),center=[lerp(socket[0],goal[0],align),lerp(socket[1],goal[1],align)];
   piece(s.task.cells,center,heading*Math.PI/180+m.rotation*Math.PI/2*align);
  }else{
   if(!m.correct){
    const returning=ease((t-CONTACT_MS)/(600-CONTACT_MS)),center=[lerp(goal[0],socket[0],returning),lerp(goal[1],socket[1],returning)];
    piece(s.task.cells,center,heading*Math.PI/180+m.rotation*Math.PI/2*(1-returning));
    if(t<600){const holeSet=new Set(m.holeCells.map(p=>p.join(',')));for(const [x,y]of m.cells)if(!holeSet.has([x,y].join(','))){const p=worldPoint([b.x+x*10+1,b.y+y*10+1],heading);c.save();c.translate(...p);c.rotate(heading*Math.PI/180);c.fillStyle='#e5a2a1';c.fillRect(0,0,8,2);c.fillRect(0,0,2,8);c.restore();}}
   }else if(t<610){
    c.fillStyle='#f6e0ae';for(const [x,y]of [m.cells[0],m.cells.at(-1)]){const p=worldPoint([b.x+x*10+4,b.y+y*10+4],heading);c.fillRect(p[0]-2,p[1]-2,4,4);}
   }
   this.verdict(m.correct,(t-CONTACT_MS)/(MOTION_MS-CONTACT_MS),root);
  }
  c.restore();
 }
 dispose(){this.whale.image.close?.();this.mast.width=0;this.mast.height=0;this.lobbyCtx.clearRect(0,0,200,200);}
}

