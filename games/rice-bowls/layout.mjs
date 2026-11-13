const even=n=>Math.round(n/2)*2;
export const ARRIVAL_TURN_MS=160;
export const DEPARTURE_TURN_MS=160;
export const STEP_IN_MS=180;
export const TOP_STEP_CYCLES=3;
export const ARRIVAL_MS=1250;
export const DEPARTURE_MS=950;
const MENU_COLUMN_STEP=130;
export const MAX_MENU_HALF_WIDTH=(3*MENU_COLUMN_STEP+2)/2;
export function menuGrid(count){
  if(!Number.isInteger(count)||count<4||count>9)throw RangeError('Meal grid supports 4 to 9 choices');
  return{rows:count===4?2:3,columns:count<=6?2:3};
}
export function menuSlot(index){if(!Number.isInteger(index)||index<0||index>8)throw RangeError('Invalid meal slot');return index<6?{row:Math.floor(index/2)+1,column:index%2+1}:{row:index-5,column:3};}
export function viewportLayout(width,height,mealCount=4,anchor=null){
  const pixelScale=1,margin=16,gap=24,grid=menuGrid(mealCount);
  const menuHeight=grid.rows*42+(grid.rows-1)*2+6+22;
  const menuWidth=grid.columns*MENU_COLUMN_STEP+2;
  const maxMenuHeight=3*42+4+6+22;
  const heroX=width/2,ground=Math.floor(Math.min((height+232-maxMenuHeight-gap)/2,height-margin-maxMenuHeight-gap));
  const offset=anchor?[Math.round(anchor[0]-heroX),Math.round(anchor[1]-ground)]:[0,0];
  const menu={left:Math.round((width-menuWidth)/2)+offset[0],top:ground+gap+offset[1],width:menuWidth,height:menuHeight,...grid};
  const hudLeft=Math.round(heroX-MENU_COLUMN_STEP-1)+offset[0];
  const panelWidth=280,companionWidth=200;
  const panelLeft=Math.max(margin,(width-panelWidth-companionWidth)/2);
  return{width,height,pixelScale,fontSize:18,lineHeight:24,menu,hudLeft,companionWidth,offset,
    panel:{left:even(panelLeft)+offset[0],width:panelWidth},
    scene:{width:Math.ceil(width/pixelScale),height:Math.ceil(height/pixelScale),whale:[heroX+offset[0],ground+offset[1]],controls:{left:menu.left,top:menu.top,width:menu.width,height:menu.height}}};
}
export function orderCueRect(layout,motion){
  const [x,y]=layout.whale;
  // The tile sits on the inside of the guest's route, clear of both sprites.
  return{left:Math.round(x+(motion.mirror?-104:104)-28),top:Math.round(y-(motion.face==='back'?166:114)),width:56,height:52};
}
const LANES=[['left','side',true],['left','down',true],['right','side',false],['right','down',false],['back','down',true],['back','down',false]];
export function motionRoute(layout,meta,lane,departure=false){
  const [face,incomingView,incomingMirror]=LANES[lane];
  const view=departure?({side:'side',up:'down',down:'up'})[incomingView]:incomingView;
  const mirror=departure?!incomingMirror:incomingMirror;
  const direction=meta.directions[view],length=Math.hypot(...direction.unit),unit=[direction.unit[0]*(mirror?-1:1)/length,direction.unit[1]/length];
  const side=incomingMirror?-1:1,dock=face==='back'?(incomingMirror?'upper-left':'upper-right'):face,offset=meta.serviceOffsets[dock],contact=[layout.whale[0]+offset[0],layout.whale[1]+offset[1]];
  const step=meta.directions.side.stridePx*meta.nativeScale;
  const waiting=[contact[0]+side*step*TOP_STEP_CYCLES,contact[1]],stop=departure&&departure!=='waiting'?contact:waiting;
  const ray=unit.map(v=>v*(departure?1:-1)),bounds=[[-32,layout.width+32],[-8,layout.height+68]];
  const distanceToEdge=Math.min(...ray.map((v,i)=>Math.abs(v)<1e-6?Infinity:(bounds[i][v>0?1:0]-stop[i])/v));
  const stride=direction.stridePx*meta.nativeScale,cycles=Math.ceil(distanceToEdge/stride),distance=cycles*stride;
  const outside=stop.map((v,i)=>v+ray[i]*distance);
  const durationMs=departure?DEPARTURE_MS-DEPARTURE_TURN_MS:ARRIVAL_MS-ARRIVAL_TURN_MS;
  return{start:departure?stop:outside,end:departure?outside:stop,stop,waiting,contact,view,mirror,face,dock,cycles,durationMs};
}
export function availableLanes(layout,meta){
  return LANES.map((_,lane)=>lane).filter(lane=>{
    const route=motionRoute(layout,meta,lane),half=meta.bodyHalfWidthPx,rise=meta.bodyRisePx;
    return[route.waiting,route.contact].every(p=>p[0]-half>=8&&p[0]+half<=layout.width-8&&p[1]-rise>=8&&p[1]<=layout.height-8);
  });
}
export function planVisitMotion(layout,meta,id,seed,preferredLane=null){
  const lanes=availableLanes(layout,meta);if(!lanes.length)throw Error('餐台周围没有可用的来客路线');
  const lane=preferredLane!==null&&lanes.includes(preferredLane)?preferredLane:lanes[(id+seed%6)%lanes.length],incoming=motionRoute(layout,meta,lane),outgoing=motionRoute(layout,meta,lane,true),withdrawal=motionRoute(layout,meta,lane,'waiting');
  return{lane,face:incoming.face,dock:incoming.dock,mirror:incoming.mirror,arrivalCycles:incoming.cycles,departureCycles:outgoing.cycles,withdrawalCycles:withdrawal.cycles,arrivalMs:incoming.durationMs+ARRIVAL_TURN_MS,departureMs:outgoing.durationMs+DEPARTURE_TURN_MS,withdrawalMs:withdrawal.durationMs+DEPARTURE_TURN_MS,rejectionMs:withdrawal.durationMs+DEPARTURE_TURN_MS,rejectFromWaiting:true};
}
export function travelPose(route,meta,elapsedMs,durationMs){
  const t=Math.max(0,Math.min(1,elapsedMs/durationMs)),total=t*route.cycles,cycle=Math.floor(total),phase=t===1?0:total-cycle;
  const frame=Math.min(7,Math.floor(phase*8)),fraction=phase*8-frame;
  const advance=meta.advance[frame]+(meta.advance[frame+1]-meta.advance[frame])*fraction;
  const progress=t===1?1:(cycle+advance)/route.cycles;
  return{point:route.start.map((v,i)=>v+(route.end[i]-v)*progress),phase,frame};
}
