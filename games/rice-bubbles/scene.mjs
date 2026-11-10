import * as PIXI from './pixi.mjs';
import {paintFood,paintStimulus,itemBottom,stimulusRadius,paintPickyBadge} from './stimuli.mjs';
import {PixelFeedback,reactionCue} from './pixel-feedback.mjs';
import {MEAL_PRESENTATION} from './core.mjs';
import {clamp,sourceGeometry,makePlayfield,dropPoint,selectedPoint,floorImpactTime,planIntercept,reflowIntercept,interceptPose} from './chase-motion.mjs';
import {FEEDBACK_MS,PICKUP_MS,IMPACT_MS,RICE_GRAB_MS,RICE_HIT_MS,riceSourceTime,outcomeTiming} from './outcome-timing.mjs';

export class WhaleScene{
  constructor(host,{assetsBase=new URL('./assets/g10/',import.meta.url),manifest=null,loadAtlas=null,bounds=()=>({width:innerWidth,height:innerHeight})}={}){
    this.host=host;this.assetsBase=assetsBase;this.bounds=bounds;this.clips=new Map();this.frames=new Map();this.textures=new Map();this.pages=[];this.loadedUrls=[];
    this.manifest=manifest;this.loadAtlas=loadAtlas;
    this.visualFill=0;this.visualLives=3;this.item=null;this.chase=null;this.selected=null;this.formPlan=null;this.reactionPlan=null;this.travelCues=[];this.pickupCues=[];this.packCues=[];this.judgmentCues=[];this.busy=null;
    this.foodReturnPlan=null;this.badgeKey=null;this.uncollected=[];this.impactCues=[];this.presentation=null;this.failureAt=null;this.feedback=new PixelFeedback();this.feedbackEvents=[];this.last=null;this.renderCount=0;this.disposed=false;this.resetPosition=true;
  }
  async init(){
    this.loadPhase='manifest';
    if(!this.manifest){const response=await fetch(new URL('g10-clip-manifest.json',this.assetsBase));if(!response.ok)throw Error('角色动作包加载失败 ('+response.status+')');this.manifest=await response.json();}const m=this.manifest;
    if(m.schema!=='braingames-g10-actionpack-v1')throw Error('不是G10动作包');
    for(const f of m.frames)this.frames.set(f.id,f);for(const c of m.clips)this.clips.set(c.id,c);
    const meal=this.clip('meal_pack');
    if(meal.durationMs!==MEAL_PRESENTATION.durationMs||meal.events.find(e=>e.name==='riceball_stowed')?.visibleAtMs!==MEAL_PRESENTATION.storedMs)throw Error('团饭动作时序与训练合同不一致');
    this.geometry=sourceGeometry(m);this.loadPhase='renderer';this.app=new PIXI.Application();
    await this.app.init({width:Math.max(1,this.bounds().width),height:Math.max(1,this.bounds().height),resolution:1,autoDensity:true,antialias:false,backgroundAlpha:0,preference:'webgl',powerPreference:'low-power',autoStart:false});
    this.app.ticker.stop();this.app.stage.eventMode='none';
    // Input belongs to DOM controls and the DSH stage. Remove Pixi's pointer
    // listeners and its system interaction ticker, including while backgrounded.
    this.app.renderer.events.setTargetElement(null);
    // Pixi's scheduler starts its system ticker even with autoStart:false.
    // This private game bundle owns its Pixi instance. Run housekeeping from
    // our visible draws instead, so it cannot leave a second 60Hz RAF behind.
    this.systemTicker=PIXI.Ticker.system;this.systemTicker.autoStart=false;this.systemTicker.stop();
    this.host.appendChild(this.app.canvas);this.app.canvas.setAttribute('aria-hidden','true');this.loadPhase='atlas';
    for(const page of m.atlases){
      const texture=this.loadAtlas?PIXI.Texture.from(await this.loadAtlas(page.image)):await PIXI.Assets.load(new URL(page.image,this.assetsBase).href);
      if(!this.loadAtlas)this.loadedUrls.push(new URL(page.image,this.assetsBase).href);
      texture.source.scaleMode='nearest';texture.source.autoGenerateMipmaps=false;this.pages.push(texture);
    }
    for(const f of m.frames){const[x,y,w,h]=f.rect,[tx,ty]=f.trim,[sw,sh]=f.sourceSize;this.textures.set(f.id,new PIXI.Texture({source:this.pages[f.page].source,frame:new PIXI.Rectangle(x,y,w,h),orig:new PIXI.Rectangle(0,0,sw,sh),trim:new PIXI.Rectangle(tx,ty,w,h)}));}
    this.shadow=new PIXI.Graphics();this.motion=new PIXI.Graphics();this.object=new PIXI.Graphics();this.falling=new PIXI.Graphics();this.falling.alpha=.7;this.character=new PIXI.Sprite();this.sparks=new PIXI.Graphics();this.ruleBadge=new PIXI.Graphics();
    this.outlines=[[-2,0],[2,0],[0,-2],[0,2],[-1,0],[1,0],[0,-1],[0,1]].map(([x,y],i)=>{const sprite=new PIXI.Sprite();sprite.tint=i<4?0xf6f0dd:0x1b2543;sprite.alpha=i<4?.45:.9;return{sprite,x,y};});
    this.app.stage.addChild(this.shadow,this.motion,...this.outlines.map(o=>o.sprite),this.character,this.falling,this.object,this.sparks,this.ruleBadge);
    this.layout('welcome');this.play('idle_0',0);this.draw(0,null,'welcome');this.loadPhase='ready';return this;
  }
  layout(view){
    const previous=this.field,oldBase=this.base;this.viewport=this.bounds();this.width=Math.max(1,Math.floor(this.viewport.width));this.height=Math.max(1,Math.floor(this.viewport.height));
    this.scale=1;
    this.field=makePlayfield({width:this.width,height:this.height,scale:this.scale,...this.geometry});
    Object.assign(this.host.style,{width:this.width+'px',height:this.height+'px',top:'0px',left:'0px',bottom:'auto',transform:'none'});this.app.renderer.resize(this.width,this.height);
    const rect=this.field.actor,reproject=p=>{const a=previous.actor;return[rect.left+clamp((p[0]-a.left)/(a.right-a.left),0,1)*(rect.right-rect.left),rect.top+clamp((p[1]-a.top)/(a.bottom-a.top),0,1)*(rect.bottom-rect.top)];};
    if(view==='welcome'||view==='finished')this.base=[clamp(this.width/2+(this.width>900?180:140),rect.left,rect.right),rect.bottom-8*this.scale];
    else if(this.resetPosition||!oldBase)this.base=[this.width/2,Math.max(rect.top,rect.bottom-56*this.scale)];
    else this.base=reproject(oldBase);
    if(this.chase&&previous){
      const previousPlan=this.chase;
      this.chase=reflowIntercept({...previousPlan,to:reproject(previousPlan.to)},{item:this.item,from:reproject(previousPlan.from),field:this.field,objectBottom:itemBottom(this.item,2*this.scale),contactOffset:previousPlan.contactOffset,time:this.last.clockMs});
      const delay=this.chase.pickupStart-previousPlan.pickupStart;
      for(const cue of this.pickupCues)cue.at+=delay;
      if(this.foodReturnPlan){this.foodReturnPlan.startAtMs+=delay;this.foodReturnPlan.endAtMs+=delay;this.foodReturnPlan.from=reproject(this.foodReturnPlan.from);for(const cue of this.impactCues)if(cue.returned)cue.at+=delay;}

      if(['bubble_mistake','food_mistake'].includes(this.reactionPlan?.outcome))this.reactionPlan.at=this.chase.pickupEnd;
      this.presentation=outcomeTiming(this.presentation.outcome,this.chase.pickupStart);
      if(['bubble_mistake','food_mistake'].includes(this.presentation.outcome))this.failureAt=this.presentation.endAtMs;
      this.selected.contactAt=this.chase.contactAt;
      if(delay&&this.active.clip.id===this.chase.pickupId)this.active.start=this.chase.pickupStart;
      for(const cue of this.travelCues)cue.point=[...(cue.kind==='launch'?this.chase.from:this.chase.to)];
    }
    for(const item of this.uncollected){
      item.impactAtMs=this.impactTime(item);
      const cue=this.impactCues.find(c=>c.item.id===item.id);if(cue)cue.at=item.impactAtMs;
      if(this.reactionPlan?.outcome===item.result){
        this.reactionPlan.at=Math.max(this.last.clockMs,item.impactAtMs);
        this.presentation=outcomeTiming(item.result,this.reactionPlan.at);
        if(item.result==='rice_miss')this.failureAt=this.presentation.endAtMs;
      }
    }
    this.resetPosition=false;return this.layoutSnapshot();
  }
  layoutSnapshot(){return{width:this.width,height:this.height,scale:this.scale,anchor:[...this.base],screenLeft:0,screenTop:0,controlsAnchor:[this.width-52,this.height-48],dropBounds:{left:this.field.left,right:this.field.right,top:this.field.top,bottom:this.field.bottom},actorBounds:{...this.field.actor}};}
  placeMenuAvatar(x,y){const r=this.field.actor,bottom=this.height-12-this.geometry.extents.bottom*this.scale;this.base=[Math.round(clamp(x,r.left,r.right)),Math.round(clamp(y,r.top,bottom))];}
  clip(id){const c=this.clips.get(id);if(!c)throw Error('缺少角色动作 '+id);return c;}
  play(id,at,durationMs=this.clip(id).durationMs){
    const clip=this.clip(id);this.active={clip,start:at,durationMs};
    this.packCues=id==='meal_pack'?clip.events.map(e=>({...e,at:at+e.visibleAtMs/clip.durationMs*durationMs})):[];
    return clip;
  }
  frameAt(time){
    const{clip,start,durationMs}=this.active,elapsed=Math.max(0,time-start),phase=clip.loop?elapsed%durationMs:Math.min(elapsed,durationMs-.0001);
    const local=clip.id.startsWith('catch_')&&durationMs===FEEDBACK_MS?riceSourceTime(phase,clip):phase/durationMs*clip.durationMs;
    const index=Math.min(clip.frameIds.length-1,Math.floor(local*clip.fps/1000+1e-9));
    return{frame:this.frames.get(clip.frameIds[index]),clip,elapsed,index,ended:!clip.loop&&elapsed>=durationMs};
  }
  fallPoint(item,time){return dropPoint(item,time,this.field,itemBottom(item,2*this.scale));}
  impactTime(item){return floorImpactTime(item);}
  worldPoint(point,frame){return point.map((v,i)=>this.base[i]+(v-frame.anchor[i]+frame.rootMotion[i])*this.scale);}
  setItem(item){
    if(this.chase){this.base=[...this.chase.to];this.visualFill=this.chase.after;}this.chase=null;this.selected=null;this.reactionPlan=null;this.judgmentCues=[];this.item={...item};this.foodReturnPlan=null;this.busy=null;this.failureAt=null;this.presentation=null;
    this.play('idle_'+this.visualFill,item.onsetMs);
  }
  react(outcome,snapshot){
    const item=snapshot.current;
    if(['rice_caught','bubble_mistake','food_mistake'].includes(outcome)){
      const x=this.fallPoint(item,snapshot.clockMs)[0],side=x<this.base[0]?'left':'right',before=outcome==='rice_caught'?snapshot.bowlFill-1:snapshot.bowlFill;
      const id=(outcome==='rice_caught'?'catch_':'mistake_')+side+'_'+before,clip=this.clip(id),event=clip.events.find(e=>e.name==='object_grab');
      if(!event)throw Error('接取动作缺少真实伸手抓取事件');
      const frame=this.frames.get(event.pointSourceFrameId),contactOffset=event.point.map((v,i)=>v-frame.anchor[i]+frame.rootMotion[i]);
      const plan=planIntercept({item,at:snapshot.clockMs,from:this.base,field:this.field,objectBottom:itemBottom(item,2*this.scale),contactOffset,contactMs:outcome==='rice_caught'?RICE_GRAB_MS:event.visibleAtMs/clip.durationMs*PICKUP_MS,pickupMs:outcome==='rice_caught'?FEEDBACK_MS:PICKUP_MS});
      this.presentation=outcomeTiming(outcome,plan.pickupStart);
      this.chase={...plan,itemId:item.id,pickupId:id,dashId:'dash_'+plan.direction+'_'+before,before,after:snapshot.bowlFill,contactOffset,phase:null};
      this.selected={itemId:item.id,contactAt:plan.contactAt};
      this.travelCues=[{at:plan.takeoffAt,kind:'launch',point:[...plan.from]},{at:plan.moveEnd,kind:'land',point:[...plan.to]}];
      this.pickupCues=clip.events.filter(e=>e.name==='object_grab'||e.name==='rice_hit').map(e=>({...e,at:plan.pickupStart+(outcome==='rice_caught'?(e.name==='rice_hit'?RICE_HIT_MS:RICE_GRAB_MS):e.visibleAtMs/clip.durationMs*PICKUP_MS),kind:e.name==='rice_hit'?'catch':outcome==='rice_caught'||outcome==='food_mistake'?'grasp':'bubble-mistake'}));
      if(outcome==='bubble_mistake'||outcome==='food_mistake'){
        this.reactionPlan={id:(outcome==='food_mistake'?'regret_':'oops_')+before,at:plan.pickupEnd,durationMs:this.presentation.reactionMs,outcome,livesAfter:snapshot.lives};
        this.failureAt=this.presentation.endAtMs;
        if(outcome==='food_mistake'){
          const releaseFrame=this.frames.get(clip.frameIds[clip.frameIds.length-2]),point=releaseFrame.handGrabPoint;
          if(!point)throw Error('Wrong-food release has no authored hand contact');
          const from=point.map((v,i)=>plan.to[i]+(v-releaseFrame.anchor[i]+releaseFrame.rootMotion[i])*this.scale);
          this.foodReturnPlan={item:{...item},from,startAtMs:plan.pickupEnd,endAtMs:plan.pickupEnd+150};
          this.impactCues.push({at:this.foodReturnPlan.endAtMs,item:{...item},returned:true});
          this.presentation.endAtMs=Math.max(this.presentation.endAtMs,this.foodReturnPlan.endAtMs+IMPACT_MS);this.failureAt=this.presentation.endAtMs;
        }
      }
    }else if(['bubble_pass','rice_miss','food_refused'].includes(outcome)){
      const impactAtMs=this.impactTime(item);
      this.presentation=outcomeTiming(outcome,impactAtMs);
      this.reactionPlan={id:(outcome==='bubble_pass'||outcome==='food_refused'?'approve_':'regret_')+snapshot.bowlFill,at:impactAtMs,durationMs:FEEDBACK_MS,outcome,livesAfter:snapshot.lives};
      this.uncollected.push({...item,impactAtMs});
      this.impactCues.push({at:impactAtMs,item:{...item}});
      if(outcome==='rice_miss')this.failureAt=this.presentation.endAtMs;
    }
    return this.presentation.endAtMs;
  }
  introPicky(at){
    if(this.chase){this.base=[...this.chase.to];this.visualFill=this.chase.after;}
    this.chase=null;this.selected=null;this.reactionPlan=null;this.presentation=null;this.item=null;this.foodReturnPlan=null;
    this.play('approve_'+this.visualFill,at,FEEDBACK_MS);
  }
  drawPickyBadge(snapshot,time,view){
    const visible=['playing','paused'].includes(view)&&snapshot?.pickyActive;
    this.ruleBadge.visible=!!visible;if(!visible)return null;
    const anchor=[Math.round(clamp(this.base[0]+72,30,this.width-30)),Math.round(clamp(this.base[1]-26,30,this.height-30))];
    const step=snapshot.pickyIntro?Math.min(10,Math.floor((time-snapshot.pickyIntro.startAtMs)/60)):10,key=snapshot.forbiddenFoodId+':'+step;
    if(key!==this.badgeKey){this.ruleBadge.clear();paintPickyBadge(this.ruleBadge,snapshot.forbiddenFoodId,step);this.badgeKey=key;}
    this.ruleBadge.position.set(...anchor);return{foodId:snapshot.forbiddenFoodId,anchor,step};
  }
  updateChase(time){
    if(!this.chase)return null;const c=this.chase,p=interceptPose(c,time);this.base=p.position;
    if(p.phase!==c.phase){c.phase=p.phase;
      if(p.phase==='dash')this.play(c.dashId,c.at,c.travelMs);
      else if(p.phase==='ready'||p.phase==='pickup')this.play(c.pickupId,c.pickupStart,c.pickupMs);
      else{this.visualFill=c.after;this.play('idle_'+c.after,c.pickupEnd);}
    }
    return p;
  }
  mealStartAt(snapshot){return Math.max(snapshot.current.deadlineMs,this.presentation.endAtMs);}
  failureEndAt(time){if(this.failureAt===null)throw Error('没有待完成的失误反馈');return Math.max(time,this.failureAt,this.item.deadlineMs,...this.uncollected.map(item=>item.impactAtMs+IMPACT_MS));}
  scheduleMeal(snapshot,at=snapshot.current.mealFormAtMs){this.formPlan={at};}
  collectMeal(){if(this.chase)this.base=[...this.chase.to];this.chase=null;this.visualFill=0;this.formPlan=null;}
  adjust(){this.chase=null;}
  ready(fill,time){this.visualFill=fill;this.visualLives=3;this.foodReturnPlan=null;this.badgeKey=null;this.item=null;this.formPlan=null;this.reactionPlan=null;this.judgmentCues=[];this.chase=null;this.selected=null;this.travelCues=[];this.pickupCues=[];this.busy=null;this.uncollected=[];this.impactCues=[];this.presentation=null;this.failureAt=null;this.feedback.clear();this.feedbackEvents=[];this.resetPosition=true;this.play('idle_'+fill,time);}
  drainFeedback(){const result=this.feedbackEvents;this.feedbackEvents=[];return result;}
  draw(time,snapshot,view){
    this.systemTicker.update(performance.now());
    if(this.disposed)return;const leap=this.updateChase(time);
    if(this.reactionPlan&&time>=this.reactionPlan.at){const plan=this.reactionPlan,clip=this.play(plan.id,plan.at,plan.durationMs);this.judgmentCues.push({...reactionCue(clip,this.frames,plan.at,plan.outcome,plan.durationMs),livesAfter:plan.livesAfter});this.reactionPlan=null;}
    if(this.formPlan&&time>=this.formPlan.at){const plan=this.formPlan;this.chase=null;this.play('meal_pack',plan.at);this.formPlan=null;this.visualFill=0;}
    while(this.travelCues.length&&time>=this.travelCues[0].at){const cue=this.travelCues.shift();this.feedback.emit(cue.kind,cue.at,cue.point,this.base,this.scale);}
    while(this.impactCues.length&&time>=this.impactCues[0].at){
      const cue=this.impactCues.shift(),point=cue.returned?[this.foodReturnPlan.from[0],this.height]:this.fallPoint(cue.item,cue.at);point[1]=this.height-4*this.scale;
      const kind=cue.item.kind==='rice'?'food-impact':'bubble-impact';
      this.feedback.emit(kind,cue.at,point,this.base,this.scale,IMPACT_MS,2,{foodId:cue.item.foodId});if(cue.item.wrapped)this.feedback.emit('wrapped-pop',cue.at,point,this.base,this.scale,IMPACT_MS,2,{foodId:cue.item.foodId});
      this.feedbackEvents.push({type:kind,atMs:cue.at});
    }
    while(this.pickupCues.length&&time>=this.pickupCues[0].at){
      const cue=this.pickupCues.shift(),f=this.frames.get(cue.pointSourceFrameId);
      const point=this.worldPoint(cue.point,f);
      this.feedback.emit(cue.kind,cue.at,point,this.base,this.scale);if(cue.kind==='bubble-mistake'&&this.item?.wrapped)this.feedback.emit('wrapped-pop',cue.at,point,this.base,this.scale,200,2,{foodId:this.item.foodId});
      if(cue.kind==='catch'){
        const verdict=this.worldPoint([f.trim[0]+f.trim[2]+30,f.faceBounds[1]+f.faceBounds[3]/2-8],f);
        if(verdict[0]>this.width-32*this.scale)verdict[0]=this.worldPoint([f.trim[0]-42,0],f)[0];
        this.feedback.emit('correct',cue.at,verdict,this.base,this.scale,300,3);
      }
      this.feedbackEvents.push({type:cue.kind,atMs:cue.at});
    }
    while(this.judgmentCues.length&&time>=this.judgmentCues[0].at){
      const cue=this.judgmentCues.shift(),f=this.frames.get(cue.pointSourceFrameId);
      const point=this.worldPoint(cue.point,f);
      if(point[0]>this.width-32*this.scale)point[0]-=124*this.scale;
      this.feedback.emit(cue.kind,cue.at,point,this.base,this.scale,cue.duration,cue.pixelScale);
      if(cue.kind==='incorrect'){
        this.visualLives=cue.livesAfter;
        this.feedback.emit('life-lost',cue.at,[this.base[0]+(cue.livesAfter*12-13)*this.scale,this.base[1]+13*this.scale],this.base,this.scale,cue.duration);
      }
      this.feedbackEvents.push({type:cue.kind,outcome:cue.outcome,atMs:cue.at});
    }
    while(this.packCues.length&&time>=this.packCues[0].at){
      const cue=this.packCues.shift();if(cue.name==='riceball_formed'||cue.name==='riceball_stowed'){
        const f=this.frames.get(cue.pointSourceFrameId??cue.visibleFrameId),point=cue.point??f.riceballCenter;if(!point)throw Error('团饭动作缺少真实饭球反馈位置');
        this.feedback.emit(cue.name==='riceball_formed'?'meal':'stow',cue.at,this.worldPoint(point,f),this.base,this.scale);if(cue.name==='riceball_formed')this.feedbackEvents.push({type:'meal',atMs:cue.at});
      }
    }
    let sample=this.frameAt(time);if(sample.ended){this.play('idle_'+this.visualFill,this.active.start+this.active.durationMs);sample=this.frameAt(time);}
    const f=sample.frame,a=f.anchor,r=f.rootMotion,s=this.scale;
    this.character.texture=this.textures.get(f.id);this.character.scale.set(s);this.character.position.set(Math.round(this.base[0]+(r[0]-a[0])*s),Math.round(this.base[1]+(r[1]-a[1])*s));
    for(const o of this.outlines){o.sprite.texture=this.character.texture;o.sprite.scale.set(s);o.sprite.position.set(this.character.x+o.x*s,this.character.y+o.y*s);}
    const ground=leap?.groundPosition??this.base,air=(leap?.lift??0)/(42*s),shadowScale=1-air*.28,shadowAlpha=1-air*.6;
    this.shadow.clear().rect(ground[0]-28*s*shadowScale,ground[1]+2*s,56*s*shadowScale,2*s).fill({color:0x0a0e10,alpha:.18*shadowAlpha}).rect(ground[0]-22*s*shadowScale,ground[1]+s,44*s*shadowScale,4*s).fill({color:0x0a0e10,alpha:.08*shadowAlpha});
    this.motion.clear();if(this.chase?.phase==='dash'&&leap.lift>0)this.feedback.drawDash(this.motion,this.base,this.chase.from,this.chase.to,this.chase.at,time,s);
    this.falling.clear();const uncollected=[];
    if(view==='playing')this.uncollected=this.uncollected.filter(item=>time<item.impactAtMs);
    if(view==='playing'||view==='paused')for(const item of this.uncollected){
      const point=this.fallPoint(item,time);paintStimulus(this.falling,item,...point,2*s);
      uncollected.push({id:item.id,kind:item.kind,point,scale:2*s,alpha:this.falling.alpha,impactAtMs:item.impactAtMs});
    }
    this.object.clear();let objectPoint=null,objectDrawn=false,resolved=false,objectScale=2*s;const item=snapshot?.current;
    if(['playing','paused'].includes(view)&&item&&item.result!=='interrupted'){
      const selected=this.selected?.itemId===item.id;
      if(selected?time<this.selected.contactAt:!item.responded&&time<item.deadlineMs){
        objectPoint=selected?selectedPoint(this.chase,time):this.fallPoint(item,time);objectDrawn=true;
        if(selected)objectScale=s*(1+Math.min(1,Math.ceil((this.selected.contactAt-time)/31.25)/4));
      }
      if(objectDrawn){const[x,y]=objectPoint;paintStimulus(this.object,item,x,y,objectScale);if(selected)this.feedback.drawSelected(this.object,x,y,objectScale,stimulusRadius(item));}
      else if(!selected){const continuing=uncollected.find(f=>f.id===item.id);if(continuing){objectPoint=continuing.point;objectDrawn=true;resolved=true;}}
    }
    let heldFood=null,returnedFood=null;
    if(['playing','paused'].includes(view)&&this.chase&&this.item.kind==='rice'&&time>=this.chase.contactAt){
      const c=this.chase,heldItem=this.item;
      const until=c.pickupStart+(this.presentation?.outcome==='rice_caught'?RICE_HIT_MS:c.pickupMs);
      const point=f.heldRiceCenter??f.handGrabPoint;
      if(time<until&&point){const world=this.worldPoint(point,f);paintStimulus(this.object,heldItem,...world,s);heldFood={foodId:heldItem.foodId,point:world,wrapped:heldItem.wrapped};}
    }
    if(['playing','paused'].includes(view)&&this.foodReturnPlan&&time>=this.foodReturnPlan.startAtMs&&time<this.foodReturnPlan.endAtMs){
      const plan=this.foodReturnPlan,t=(time-plan.startAtMs)/(plan.endAtMs-plan.startAtMs),bottom=this.height-4*s-itemBottom(plan.item,s),point=[plan.from[0],plan.from[1]+(bottom-plan.from[1])*t];
      paintFood(this.object,...point,s,plan.item.foodId);returnedFood={foodId:plan.item.foodId,point};
    }
    const pickyBadge=this.drawPickyBadge(snapshot,time,view);
    this.sparks.clear();if(view==='playing'||view==='paused')this.feedback.drawLives(this.sparks,this.base,this.visualLives,s);this.feedback.draw(this.sparks,time,this.base,s);const bowlPoint=this.worldPoint(f.bowlContact,f);
    if(snapshot?.bowlFill===6&&sample.clip.id==='idle_6')this.feedback.drawFull(this.sparks,time,bowlPoint,s);
    if(this.busy&&time<this.busy.endsAt){if(time>=this.busy.startsAt)this.feedback.drawBusy(this.sparks,time,this.busy.startsAt,this.busy.endsAt,bowlPoint,s);else this.sparks.rect(Math.round(bowlPoint[0]+18*s),Math.round(bowlPoint[1]-12*s),2*s,3*s).fill({color:0xe5efea,alpha:.7});}
    const renderStart=performance.now();this.app.renderer.render(this.app.stage);
    this.last={clockMs:time,pickyBadge,heldFood,returnedFood,clip:sample.clip.id,clipDurationMs:this.active.durationMs,frameId:f.id,root:[...r],actor:[...this.base],bowlContact:bowlPoint,visualLives:this.visualLives,heldRiceCenter:f.heldRiceCenter?this.worldPoint(f.heldRiceCenter,f):null,
      object:item?{id:item.id,kind:item.kind,drawn:objectDrawn,resolved,point:objectPoint,scale:objectScale,selected:this.selected?.itemId===item.id}:null,uncollected,presentation:this.presentation?{...this.presentation}:null,
      chase:this.chase?{lockedPoint:[...this.chase.lockedPoint],phase:this.chase.phase,from:[...this.chase.from],to:[...this.chase.to],at:this.chase.at,takeoffAt:this.chase.takeoffAt,arcHeight:this.chase.arcHeight,lift:leap.lift,groundPosition:[...ground],moveEnd:this.chase.moveEnd,pickupStart:this.chase.pickupStart,pickupEnd:this.chase.pickupEnd,contactAt:this.chase.contactAt,contact:[...this.chase.contact]}:null,
      pixelFeedback:this.feedback.snapshot(time),busy:this.busy?time>=this.busy.startsAt&&time<this.busy.endsAt:false,renderCount:++this.renderCount,renderMs:performance.now()-renderStart};
  }
  characterBounds(){
    // Sprite bounds include the original export canvas, including transparent padding.
    const {trim}=this.character.texture,s=this.scale;
    return{left:this.character.x+trim.x*s,top:this.character.y+trim.y*s,width:trim.width*s,height:trim.height*s};
  }
  checkpoint(){
    const keys=['visualFill','visualLives','item','chase','selected','formPlan','reactionPlan','travelCues','pickupCues','packCues','judgmentCues','busy','uncollected','impactCues','presentation','failureAt','base','field','resetPosition','foodReturnPlan'];
    return structuredClone({version:3,width:this.width,height:this.height,active:{id:this.active.clip.id,start:this.active.start,durationMs:this.active.durationMs},state:Object.fromEntries(keys.map(key=>[key,this[key]])),feedback:this.feedback.events,time:this.last.clockMs});
  }
  restore(checkpoint){
    if(checkpoint?.version!==3||!checkpoint.state||!Array.isArray(checkpoint.feedback))throw Error('Invalid G10 animation checkpoint');
    const keys=['visualFill','visualLives','item','chase','selected','formPlan','reactionPlan','travelCues','pickupCues','packCues','judgmentCues','busy','uncollected','impactCues','presentation','failureAt','base','field','resetPosition','foodReturnPlan'];
    for(const key of keys){if(!Object.hasOwn(checkpoint.state,key))throw Error('Missing G10 animation field '+key);this[key]=structuredClone(checkpoint.state[key]);}
    this.active={clip:this.clip(checkpoint.active.id),start:checkpoint.active.start,durationMs:checkpoint.active.durationMs};
    this.feedback.events=structuredClone(checkpoint.feedback);this.feedbackEvents=[];this.last={clockMs:checkpoint.time};
    if(this.bounds().width!==checkpoint.width||this.bounds().height!==checkpoint.height)this.layout('paused');
  }
  metrics(){return{source:this.manifest.source,pages:this.pages.length,frames:this.frames.size,clips:this.clips.size,clipDurations:Object.fromEntries([...this.clips].map(([id,c])=>[id,c.durationMs])),decodedTextureBytes:this.manifest.atlases.reduce((n,a)=>n+a.width*a.height*4,0),independentTickers:{application:this.app.ticker.started,system:this.systemTicker.started},renderCount:this.renderCount,layout:this.layoutSnapshot(),last:this.last};}
  async dispose(){if(this.disposed)return;this.disposed=true;if(this.app?.renderer)this.app.destroy(true,{children:true,texture:false,textureSource:false});for(const t of this.textures.values())t.destroy(false);if(this.loadAtlas)for(const p of this.pages){p.source.resource?.close?.();p.destroy(true);}await Promise.all(this.loadedUrls.map(url=>PIXI.Assets.unload(url)));this.textures.clear();this.pages=[];this.loadedUrls=[];}
}
