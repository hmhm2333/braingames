export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mix=(a,b,t)=>a+(b-a)*t;
const FALL_ACCELERATION=.4;
const FALL_INITIAL_SPEED=1-FALL_ACCELERATION;

export function sourceGeometry(manifest){
  const frames=new Map(manifest.frames.map(f=>[f.id,f])),extents={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity},contacts=[];
  for(const f of manifest.frames){const a=f.anchor,r=f.rootMotion;extents.left=Math.min(extents.left,f.trim[0]-a[0]+r[0]);extents.right=Math.max(extents.right,f.trim[0]+f.trim[2]-a[0]+r[0]);extents.top=Math.min(extents.top,f.trim[1]-a[1]+r[1]);extents.bottom=Math.max(extents.bottom,f.trim[1]+f.trim[3]-a[1]+r[1]);}
  for(const c of manifest.clips.filter(c=>c.id.startsWith('catch_'))){const event=c.events.find(e=>e.name==='object_grab'),f=frames.get(event.pointSourceFrameId);contacts.push(event.point.map((v,i)=>v-f.anchor[i]+f.rootMotion[i]));}
  return{extents,contacts};
}

export function makePlayfield({width,height,scale,extents,contacts}){
  const padding=12,actor={left:padding-extents.left*scale,right:width-padding-extents.right*scale,top:padding-extents.top*scale,bottom:height-padding-18*scale-extents.bottom*scale};
  const xs=contacts.map(p=>p[0]*scale);
  return{width,height,scale,actor,left:actor.left+Math.max(...xs),right:actor.right+Math.min(...xs),top:40*scale,bottom:height-4*scale};
}

// The response window is the complete visible fall, ending at ground contact.
// Visual footprint is supplied by the renderer; the kernel stays viewport-independent.
export function dropPoint(item,time,field,objectBottom){
  const t=Math.max(0,(time-item.onsetMs)/(item.deadlineMs-item.onsetMs));
  const progress=t*(FALL_INITIAL_SPEED+FALL_ACCELERATION*t);
  return[mix(field.left,field.right,item.spawnU),mix(field.top,field.bottom-objectBottom,progress)];
}
export function floorImpactTime(item){return item.deadlineMs;}
export function fallExitTime(item,field,radius){
  const progress=(field.height+radius-field.top)/(field.bottom-radius-field.top);
  const t=2*progress/(FALL_INITIAL_SPEED+Math.sqrt(FALL_INITIAL_SPEED**2+4*FALL_ACCELERATION*progress));
  return item.onsetMs+t*(item.deadlineMs-item.onsetMs);
}

// A committed choice is visibly locked while the whale approaches. The short
// receiving movement then joins that exact point to the authored hand contact.
// Collection time never consumes the player's remaining response budget.
export function selectedPoint(plan,time){
  const t=clamp((time-plan.pickupStart)/(plan.contactAt-plan.pickupStart),0,1);
  return plan.lockedPoint.map((v,i)=>mix(v,plan.contact[i],t));
}
function receivingTarget(point,field,contactOffset){
  const to=point.map((v,i)=>clamp(v-contactOffset[i]*field.scale,i?field.actor.top:field.actor.left,i?field.actor.bottom:field.actor.right));
  return{to,contact:to.map((v,i)=>v+contactOffset[i]*field.scale)};
}
export function reflowIntercept(plan,{item,from,field,objectBottom,contactOffset,time}){
  const lockedPoint=dropPoint(item,plan.at,field,objectBottom);
  const target=time<plan.contactAt?receivingTarget(lockedPoint,field,contactOffset):{
    to:plan.to.map((v,i)=>clamp(v,i?field.actor.top:field.actor.left,i?field.actor.bottom:field.actor.right))
  };
  if(!target.contact)target.contact=target.to.map((v,i)=>v+contactOffset[i]*field.scale);
  const arcHeight=Math.max(0,Math.min(42*field.scale,(from[1]+target.to[1]-2*field.actor.top)/4));
  return{...plan,...target,lockedPoint,from,arcHeight};
}
export function planIntercept({item,at,from,field,objectBottom,contactOffset,contactMs,pickupMs}){
  const lockedPoint=dropPoint(item,at,field,objectBottom),target=receivingTarget(lockedPoint,field,contactOffset);
  const distance=Math.hypot(target.to[0]-from[0],target.to[1]-from[1]);
  const travelMs=clamp(110+distance/5,180,260),moveEnd=at+travelMs,pickupStart=moveEnd;
  const arcHeight=Math.max(0,Math.min(42*field.scale,(from[1]+target.to[1]-2*field.actor.top)/4));
  return{from:[...from],...target,lockedPoint,direction:target.to[0]<from[0]?'left':'right',at,travelMs,takeoffAt:at+travelMs/8,arcHeight,moveEnd,pickupStart,pickupEnd:pickupStart+pickupMs,contactAt:pickupStart+contactMs,pickupMs};
}

export function interceptPose(plan,time){
  const progress=clamp((time-plan.at)/plan.travelMs,0,1),flightProgress=clamp((progress-1/8)/(7/8),0,1),advance=flightProgress*(2-flightProgress);
  const groundPosition=progress===1?[...plan.to]:plan.from.map((v,i)=>mix(v,plan.to[i],advance)),lift=4*plan.arcHeight*advance*(1-advance);
  return{position:[groundPosition[0],groundPosition[1]-lift],groundPosition,lift,progress,flightProgress,
    phase:time<plan.moveEnd?'dash':time<plan.pickupStart?'ready':time<plan.pickupEnd?'pickup':'done'};
}
