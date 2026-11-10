export const LAYOUT={width:400,height:272,cell:10,whale:[130,176],source:[140,140,10]};
export const MAST={x:200,y:136,radius:40};
export const LIFE_POINTS=[[178,152],[200,162],[222,152]];
export const TURN_MS=240;
export const VOYAGE_MS=600;
export const HULL=[[30,16],[282,16],[282,20],[300,20],[300,28],[314,28],[314,36],[330,36],[330,48],[344,48],[344,64],[358,64],[358,82],[372,82],[372,102],[384,102],[384,118],[392,118],[392,146],[384,146],[384,162],[372,162],[372,182],[358,182],[358,200],[344,200],[344,216],[330,216],[330,228],[314,228],[314,236],[300,236],[300,244],[282,244],[282,248],[30,248],[30,244],[18,244],[18,234],[10,234],[10,220],[6,220],[6,44],[10,44],[10,30],[18,30],[18,20],[30,20]];
export function panelBox(site){return{x:site.x,y:site.y,width:40,height:40};}
export function siteBox(site){return{x:site.x-3,y:site.y-3,width:46,height:46};}
export function hullClip(){return'polygon('+HULL.map(([x,y])=>(x/LAYOUT.width*100)+'% '+(y/LAYOUT.height*100)+'%').join(',')+')';}
export function insideHull(x,y){let inside=false;for(let i=0,j=HULL.length-1;i<HULL.length;j=i++){const a=HULL[i],b=HULL[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
const HANDS={x:100,y:96,width:86,height:84};
const within=(p,b)=>p[0]>=b.x&&p[0]<=b.x+b.width&&p[1]>=b.y&&p[1]<=b.y+b.height;
export function separated(a,b){return Math.abs(a.x-b.x)>=50||Math.abs(a.y-b.y)>=50;}
function floor(x,y){return [[x-10,y],[x+10,y],[x,y-10],[x,y+10]].every(p=>insideHull(...p));}
function overlaps(a,b){return a.x<b.x+b.width&&a.x+40>b.x&&a.y<b.y+b.height&&a.y+40>b.y;}
// The whole usable deck supplies positions at a ten-pixel pitch; these are not
// named slots. Only permanent furniture and the held reference remain clear.
export const LEAK_ORIGINS=[];
for(let y=26;y<=216;y+=10)for(let x=16;x<=346;x+=10){
 const b={x,y},toWhale=Math.hypot(Math.max(x,Math.min(x+40,LAYOUT.whale[0]))-LAYOUT.whale[0],Math.max(y,Math.min(y+40,LAYOUT.whale[1]))-LAYOUT.whale[1]);
 const toMast=Math.hypot(Math.max(x,Math.min(x+40,MAST.x))-MAST.x,Math.max(y,Math.min(y+40,MAST.y))-MAST.y);
 if([[x,y],[x+40,y],[x,y+40],[x+40,y+40]].every(p=>floor(...p))&&!overlaps(b,HANDS)&&toWhale>82&&toMast>MAST.radius+4)LEAK_ORIGINS.push(b);
}
const deck=new Map();for(const p of LEAK_ORIGINS)for(let y=0;y<4;y++)for(let x=0;x<4;x++){const cell=[p.x+x*10,p.y+y*10];deck.set(cell.join(','),cell);}
export const DECK_CELLS=[...deck.values()].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
const walkable=new Set();for(let y=16;y<256;y+=10)for(let x=10;x<390;x+=10)if(floor(x,y)&&Math.hypot(x-MAST.x,y-MAST.y)>MAST.radius)walkable.add(x+','+y);
export function walkPath(site,sites){
 const candidates=[[site.x-6,site.y+30],[site.x+44,site.y+30],[site.x+24,site.y+50],[site.x+24,site.y-10]];
 const safe=p=>walkable.has(p.join(','))&&sites.every(s=>!within(p,panelBox(s)));
 const goals=new Set(candidates.filter(safe).map(p=>p.join(','))),start=LAYOUT.whale,queue=[start],previous=new Map([[start.join(','),null]]);
 for(let index=0;index<queue.length;index++){
  const p=queue[index],key=p.join(',');if(goals.has(key)){
   const path=[];for(let k=key;k!==null;k=previous.get(k))path.push(k.split(',').map(Number));return path.reverse();
  }
  for(const [dx,dy]of [[10,0],[0,-10],[-10,0],[0,10]]){const n=[p[0]+dx,p[1]+dy],key=n.join(',');if(!previous.has(key)&&safe(n)){previous.set(key,p.join(','));queue.push(n);}}
 }
 return null;
}
export function actorPath(path,progress,returning=false){
 if(path.length===1)return{root:[...path[0]],direction:returning?'up':'down'};
 const at=Math.max(0,Math.min(1,progress))*(path.length-1),i=Math.min(path.length-2,Math.floor(at)),a=path[i],b=path[i+1],t=at-i;
 const root=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];let direction=b[0]!==a[0]?(b[0]<a[0]?'left':'right'):(b[1]<a[1]?'up':'down');
 if(returning)direction={left:'right',right:'left',up:'down',down:'up'}[direction];return{root,direction};
}
export const SHIP_RADIUS=Math.ceil(Math.max(...HULL.map(([x,y])=>Math.hypot(x-200,y-136))))+4;
export function clampPosition(x,y,width,height){return{x:Math.round(Math.max(SHIP_RADIUS+8,Math.min(width-SHIP_RADIUS-8,x+200))-200),y:Math.round(Math.max(SHIP_RADIUS+8,Math.min(height-SHIP_RADIUS-8,y+136))-136)};}
export function worldPoint(point,heading){const a=heading*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=point[0]-200,y=point[1]-136;return[200+x*c-y*s,136+x*s+y*c];}
export function worldDirection(direction,heading){const angle={right:0,down:90,left:180,up:270}[direction]+heading;return['right','down','left','up'][((Math.round(angle/90)%4)+4)%4];}
export function fitVoyage(voyage,width,height){
 const from={...voyage.from,...clampPosition(voyage.from.x,voyage.from.y,width,height)},a=voyage.to.heading*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),radius=SHIP_RADIUS+8,x=from.x+200,y=from.y+136;
 const roomX=Math.abs(dx)<1e-8?Infinity:((dx>0?width-radius:radius)-x)/dx,roomY=Math.abs(dy)<1e-8?Infinity:((dy>0?height-radius:radius)-y)/dy,distance=Math.max(0,Math.min(voyage.to.distance,roomX,roomY));
 return{...voyage,from,to:{...voyage.to,x:Math.round(from.x+dx*distance),y:Math.round(from.y+dy*distance),distance}};
}
export function voyageTarget(position,width,height,random){
 const radius=SHIP_RADIUS+8,x=position.x+200,y=position.y+136,candidates=[];
 for(let heading=0;heading<360;heading+=45){const a=heading*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
  const roomX=Math.abs(dx)<1e-8?Infinity:((dx>0?width-radius:radius)-x)/dx,roomY=Math.abs(dy)<1e-8?Infinity:((dy>0?height-radius:radius)-y)/dy;
  const room=Math.min(roomX,roomY);if(room>=12)candidates.push({heading,dx,dy,room});
 }
 const p=candidates[Math.floor(random()*candidates.length)],distance=Math.min(p.room,80+Math.floor(random()*65)),from=position.heading??0;
 return{x:Math.round(position.x+p.dx*distance),y:Math.round(position.y+p.dy*distance),heading:p.heading,distance,turnDegrees:((p.heading-from+540)%360)-180};
}
export function voyagePose(voyage){const p=voyage.elapsedMs<TURN_MS?0:(voyage.elapsedMs-TURN_MS)/(VOYAGE_MS-TURN_MS),u=Math.max(0,Math.min(1,p)),t=u*u*(3-2*u),turn=Math.min(1,voyage.elapsedMs/TURN_MS);return{x:Math.round(voyage.from.x+(voyage.to.x-voyage.from.x)*t),y:Math.round(voyage.from.y+(voyage.to.y-voyage.from.y)*t),heading:voyage.elapsedMs<TURN_MS?voyage.from.heading+voyage.to.turnDegrees*turn:voyage.to.heading};}
