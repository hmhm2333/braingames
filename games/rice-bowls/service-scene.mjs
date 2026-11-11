import {SERVE_MS,COUNTER_FLOW} from './regulars-core.mjs';
import {viewportLayout,motionRoute,planVisitMotion,travelPose,ARRIVAL_TURN_MS,DEPARTURE_TURN_MS,STEP_IN_MS,TOP_STEP_CYCLES} from './layout.mjs';
import {loadSprites} from './scene.mjs';
import {mealName,guestName} from './content.mjs';
import {VERDICT_COLORS,VERDICT_TICK,VERDICT_CROSS} from '../../runtime/presentation.mjs';
export {loadSprites,guestName,mealName};
const clamp=t=>Math.max(0,Math.min(1,t));
export function verdictGeometry(layout,motion,correct,age,bodyRoot){
  const x=Math.round(bodyRoot[0]+(motion.mirror?76:-82)),y=Math.round(bodyRoot[1]-128-3*(1-clamp(age/100)));
  return{x,y,cell:3,alpha:clamp((600-age)/100),bounds:{left:x-(correct?19:16),top:y-16,width:correct?50:38,height:38}};
}
export class ServiceScene{
  constructor(canvas,sprites){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.sprites=sprites;this.drawCount=0;}
  resize(cssWidth,cssHeight,mealCount=this.mealCount??4,anchor=null){
    this.mealCount=mealCount;this.viewport=viewportLayout(cssWidth,cssHeight,mealCount,anchor);this.layout=this.viewport.scene;
    if(this.canvas.width!==this.layout.width)this.canvas.width=this.layout.width;
    if(this.canvas.height!==this.layout.height)this.canvas.height=this.layout.height;
    this.canvas.style.width=this.canvas.width*this.viewport.pixelScale+'px';this.canvas.style.height=this.canvas.height*this.viewport.pixelScale+'px';return this.viewport;
  }
  planMotion(visit,seed,preferredLane=null){return planVisitMotion(this.layout,this.sprites.manifest.guests[visit.guest],visit.id,seed,preferredLane);}
  whaleGeometry(clip,ms,root=this.layout.whale){
    const c=this.sprites.manifest.clips[clip],step=c.durationMs/(c.loop?c.frames.length:c.frames.length-1);
    const index=c.loop?Math.floor(ms/step)%c.frames.length:Math.min(c.frames.length-1,Math.floor(ms/step));
    const id=c.frames[index],f=this.sprites.manifest.frames[id],p=root;
    const point=v=>[p[0]+v[0]-f.anchor[0],p[1]+v[1]-f.anchor[1]];
    return{id,frame:f,root,bodyRoot:[p[0]+f.stageOffset[0],p[1]+f.stageOffset[1]],palm:point(f.hand),tray:point(f.potHand)};
  }
  whale(g,food=null){
    const ctx=this.ctx,p=g.root,f=g.frame;
    const body=()=>this.sprites.crop(ctx,g.id,p[0]+f.trim[0]-f.anchor[0],p[1]+f.trim[1]-f.anchor[1],f.trim[2],f.trim[3]);
    const held=()=>{this.sprites.fit(ctx,'prop/tray',g.tray[0]-23,g.tray[1]-11,46,16);if(food)this.dish(food.id,food.point,food.size);};
    if(Math.abs(f.facingDeg)>90){held();body();}else{body();held();}
  }
  frameFor(guest,clip,phase,loop=false){
    const ids=this.sprites.manifest.guests[guest].clips[clip],i=loop?Math.floor(phase*ids.length)%ids.length:Math.min(ids.length-1,Math.floor(clamp(phase)*(ids.length-1)));
    if(!ids[i])throw Error(`Invalid animation frame: ${guest}/${clip}, phase=${phase}, index=${i}, loop=${loop}`);
    return ids[i];
  }
  guestHand(a){
    const f=this.sprites.manifest.frames[a.frame],scale=this.sprites.manifest.guests[a.guest].nativeScale,p=a.p.map(Math.round);
    return[p[0]+(f.hand[0]-f.anchor[0])*scale*(a.mirror?-1:1),p[1]+(f.hand[1]-f.anchor[1])*scale];
  }
  guest(a){
    const f=this.sprites.manifest.frames[a.frame],scale=this.sprites.manifest.guests[a.guest].nativeScale,ctx=this.ctx,p=a.p.map(Math.round),sh=f.shadow;
    const sx=p[0]+(sh[0][0]-f.anchor[0])*scale*(a.mirror?-1:1),sy=p[1]+(sh[0][1]-f.anchor[1])*scale;
    ctx.fillStyle='#2934461c';ctx.beginPath();ctx.ellipse(sx,sy,sh[1]*scale/2,sh[2]*scale/2,0,0,Math.PI*2);ctx.fill();
    ctx.save();if(a.mirror){ctx.translate(p[0]*2,0);ctx.scale(-1,1);}
    this.sprites.crop(ctx,a.frame,p[0]+(f.trim[0]-f.anchor[0])*scale,p[1]+(f.trim[1]-f.anchor[1])*scale,f.trim[2]*scale,f.trim[3]*scale);ctx.restore();
  }
  dish(id,p,size){this.sprites.fit(this.ctx,'meal/'+id,p[0]-size/2,p[1]-size*.77,size,size*.82);}
  counter(layer,root){
    const id='counter/'+layer,f=this.sprites.manifest.frames[id];
    this.sprites.crop(this.ctx,id,root[0]+f.trim[0]-f.anchor[0],root[1]+f.trim[1]-f.anchor[1],f.trim[2],f.trim[3]);
  }
  verdict(motion,correct,age,bodyRoot){
    const g=verdictGeometry(this.layout,motion,correct,age,bodyRoot),c=this.ctx,s=g.cell;
    const points=correct?VERDICT_TICK:VERDICT_CROSS,color=name=>'#'+VERDICT_COLORS[name].toString(16).padStart(6,'0');
    c.save();c.globalAlpha=g.alpha;
    for(const [dx,dy] of points){c.fillStyle=color('edge');c.fillRect(g.x+(dx-1)*s-1,g.y+(dy-1)*s-1,4*s+2,4*s+2);}
    for(const [dx,dy] of points){c.fillStyle=color('ink');c.fillRect(g.x+(dx-1)*s,g.y+(dy-1)*s,4*s,4*s);}
    for(const [dx,dy] of points){c.fillStyle=color(correct?'correct':'incorrect');c.fillRect(g.x+dx*s,g.y+dy*s,2*s,2*s);}
    c.restore();
  }
  actor(s){
    if(!s.visit||['welcome','summary'].includes(s.phase))return null;
    const v=s.visit,meta=this.sprites.manifest.guests[v.guest],sv=s.service,t=sv?.elapsedMs??0,incoming=motionRoute(this.layout,meta,v.motion.lane);
    const upper=v.motion.face==='back',empty=sv&&!sv.outcome.correct;
    let a={guest:v.guest,p:incoming.waiting,mirror:incoming.mirror,frame:this.frameFor(v.guest,'pet-idle',(s.clockMs%1000)/1000,true)};
    if(sv?.removed){
      const elapsed=t-SERVE_MS;if(elapsed>=v.motion.departureMs)return null;
      a.p=empty?incoming.waiting:incoming.contact;
      if(elapsed<DEPARTURE_TURN_MS)a.frame=this.frameFor(v.guest,empty?'turn-empty-'+incoming.view:upper?'upper-turn-out':'turn-out-'+incoming.view,elapsed/DEPARTURE_TURN_MS);
      else{
        const outgoing=motionRoute(this.layout,meta,v.motion.lane,empty?'waiting':true),walk=travelPose(outgoing,meta,elapsed-DEPARTURE_TURN_MS,v.motion.departureMs-DEPARTURE_TURN_MS);
        a.p=walk.point;
        if(empty){a.mirror=outgoing.mirror;a.frame=this.frameFor(v.guest,'walk-'+outgoing.view,walk.phase,true);}
        else a.frame=this.frameFor(v.guest,upper?'upper-carry':'carry-'+incoming.view,walk.phase,true);
      }
    }else if(s.arrival){
      const duration=v.motion.arrivalMs-ARRIVAL_TURN_MS;
      if(s.arrival.elapsedMs<duration){const walk=travelPose(incoming,meta,s.arrival.elapsedMs,duration);a.p=walk.point;a.frame=this.frameFor(v.guest,'walk-'+incoming.view,walk.phase,true);}
      else a.frame=this.frameFor(v.guest,'turn-in-'+incoming.view,(s.arrival.elapsedMs-duration)/ARRIVAL_TURN_MS);
    }else if(sv){
      if(empty){
        if(sv.outcome.reason!=='timeout'&&t>=COUNTER_FLOW.refuseMs&&t<COUNTER_FLOW.refuseMs+600)a.frame=this.frameFor(v.guest,'refuse',(t-COUNTER_FLOW.refuseMs)/600);
        return a;
      }
      const walkMs=meta.cycleMs*TOP_STEP_CYCLES;
      if(t<COUNTER_FLOW.homeMs)return a;
      if(t<COUNTER_FLOW.homeMs+walkMs){
        const walk=travelPose({start:incoming.waiting,end:incoming.contact,cycles:TOP_STEP_CYCLES},meta,t-COUNTER_FLOW.homeMs,walkMs);
        a.p=walk.point;a.frame=this.frameFor(v.guest,'walk-side',walk.phase,true);return a;
      }
      a.p=incoming.contact;
      if(t<COUNTER_FLOW.homeMs+walkMs+ARRIVAL_TURN_MS)a.frame=this.frameFor(v.guest,upper?'upper-step-turn':'turn-in-side',(t-COUNTER_FLOW.homeMs-walkMs)/ARRIVAL_TURN_MS);
      else a.frame=this.frameFor(v.guest,t>=COUNTER_FLOW.receiveMs?(upper?'upper-receive':'receive'):(upper?'upper-idle':'pet-idle'),t>=COUNTER_FLOW.receiveMs?(t-COUNTER_FLOW.receiveMs)/COUNTER_FLOW.receiveDurationMs:(s.clockMs%1000)/1000,t<COUNTER_FLOW.receiveMs);
    }
    return a;
  }
  whalePresentation(s){
    const sv=s.service,t=sv?.elapsedMs??0;
    if(!sv)return{clip:'idle',ms:s.clockMs};
    if(sv.outcome.reason==='timeout')return t<SERVE_MS?{clip:'miss',ms:t}:{clip:'idle',ms:s.clockMs};
    const clip='place-'+s.visit.motion.dock;
    if(!sv.outcome.correct&&t>=SERVE_MS&&t<SERVE_MS+COUNTER_FLOW.cleanupMs)return{clip,ms:COUNTER_FLOW.homeMs-(t-SERVE_MS)*COUNTER_FLOW.homeMs/COUNTER_FLOW.cleanupMs};
    if(!sv.outcome.correct&&t>=SERVE_MS+COUNTER_FLOW.cleanupMs)return{clip:'idle',ms:0};
    if(t<COUNTER_FLOW.homeMs)return{clip,ms:t};
    if(sv.outcome.correct&&t>=COUNTER_FLOW.handoffMs&&t<COUNTER_FLOW.handoffMs+600)return{clip:'ack',ms:t-COUNTER_FLOW.handoffMs};
    if(!sv.outcome.correct&&t>=COUNTER_FLOW.refuseMs&&t<COUNTER_FLOW.refuseMs+600)return{clip:'refuse',ms:t-COUNTER_FLOW.refuseMs};
    return{clip:'idle',ms:s.clockMs};
  }
  foodPose(s){
    const sv=s.service;if(!sv||sv.outcome.reason==='timeout')return null;
    const out=sv.outcome,t=sv.elapsedMs,clip='place-'+s.visit.motion.dock,c=this.sprites.manifest.clips[clip],size=this.sprites.manifest.guests[out.guest].mealSize;
    if(out.correct&&t>=COUNTER_FLOW.handoffMs){const a=this.actor(s);return a?{id:out.chosen,point:this.guestHand(a),size,owner:'guest'}:null;}
    const cleanup=!out.correct&&t>=SERVE_MS,poseMs=cleanup?Math.max(0,c.durationMs-(t-SERVE_MS)*c.durationMs/COUNTER_FLOW.cleanupMs):Math.min(t,c.durationMs);
    if(t>=c.tableMs&&(!cleanup||poseMs>c.tableMs))return{id:out.chosen,point:this.sprites.manifest.docks[s.visit.motion.dock].map((v,i)=>v+this.layout.whale[i]),size,owner:'counter'};
    const g=this.whaleGeometry(clip,poseMs);
    if(poseMs<c.pickupMs||cleanup&&poseMs<=c.pickupMs)return{id:out.chosen,point:g.tray.map((v,i)=>v+c.trayOffset[i]),size,owner:'tray'};
    return{id:out.chosen,point:g.palm,size,owner:'whale'};
  }

  whaleFor(s,moving=false){
    const pose=moving?{clip:'idle',ms:0}:this.whalePresentation(s),root=['welcome','summary'].includes(s.phase)?this.lobbyRoot:this.layout.whale;
    return this.whaleGeometry(pose.clip,pose.ms,root);
  }
  dragBounds(s,moving=false){
    const g=this.whaleFor(s,moving),f=g.frame,scale=this.viewport.pixelScale;
    return{left:(g.root[0]+f.trim[0]-f.anchor[0])*scale,top:(g.root[1]+f.trim[1]-f.anchor[1])*scale,width:f.trim[2]*scale,height:f.trim[3]*scale};
  }
  draw(s,{moving=false}={}){
    this.drawCount++;const ctx=this.ctx,sv=moving?null:s.service,t=sv?.elapsedMs??0,a=moving?null:this.actor(s),playing=['running','paused'].includes(s.phase);
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.imageSmoothingEnabled=false;
    const topGuest=a&&s.visit.motion.face==='back';
    const behind=a&&(topGuest||a.p[1]<this.layout.whale[1]-78);
    if(behind&&!topGuest)this.guest(a);
    const g=this.whaleFor(s,moving),root=g.root;
    if(playing)this.counter('back',root);
    else{ctx.fillStyle='#29344610';ctx.fillRect(Math.round(root[0]-30),Math.round(root[1]),60,2);}
    if(topGuest)this.guest(a);
    const food=moving?null:this.foodPose(s),held=food&&(food.owner==='whale'||food.owner==='tray');
    this.whale(g,held?food:null);
    if(playing)this.counter('front',root);
    if(a&&!behind)this.guest(a);
    if(food&&!held)this.dish(food.id,food.point,food.size);
    if(sv){const start=sv.outcome.reason==='timeout'?600:sv.outcome.correct?COUNTER_FLOW.handoffMs:COUNTER_FLOW.refuseMs,age=t-start;if(age>=0&&age<600)this.verdict(s.visit.motion,sv.outcome.correct,age,g.bodyRoot);}
  }
}
