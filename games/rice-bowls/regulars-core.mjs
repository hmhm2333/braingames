import {randomSource} from './core.mjs';
import {GUEST_IDS,MEAL_IDS} from './content.mjs';
import {DIFFICULTY} from './progression.mjs';
export {MEAL_IDS,DIFFICULTY};
export const SERVE_MS=1800;
export const MAX_MISTAKES=3;
export const RESPONSE_MS=8000;
export const COUNTER_FLOW=Object.freeze({placeMs:600,homeMs:900,receiveMs:1420,receiveDurationMs:360,handoffMs:1600,refuseMs:1000,cleanupMs:750});
const OPENING=[0,0,1,0,1,0,1,2];

export class RegularsSession{
  constructor({seed=1,guestIds=GUEST_IDS,planMotion,stages=DIFFICULTY}={}){
    if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid seed');
    if(!stages.length||stages.some((s,i)=>!Number.isInteger(s.guests)||s.guests<3||s.guests>6||!Number.isInteger(s.meals)||s.meals<4||s.meals>9||!s.intervals.length||s.intervals.some(k=>![3,4,5].includes(k))||!Number.isInteger(s.evidence)||s.evidence<1||i&&(s.guests<stages[i-1].guests||s.guests>stages[i-1].guests+1||s.meals<stages[i-1].meals||s.meals>stages[i-1].meals+1||s.guests!==stages[i-1].guests&&s.meals!==stages[i-1].meals)))throw RangeError('Invalid progression');
    if(guestIds.length<Math.max(...stages.map(s=>s.guests))||new Set(guestIds).size!==guestIds.length)throw RangeError('Not enough distinct guest models');
    if(typeof planMotion!=='function')throw TypeError('A motion planner is required');
    this.planMotion=planMotion;this.stages=stages;this.random=randomSource(seed);this.guestOrder=[...this.shuffle(guestIds.slice(0,3)),...this.shuffle(guestIds.slice(3))];
    this.levelIndex=0;this.difficulty=stages[0];this.activeMeals=MEAL_IDS.slice(0,this.difficulty.meals);
    this.pool=this.guestOrder.slice(0,this.difficulty.guests).map(guest=>this.record(guest));
    this.phase='welcome';this.pauseReason=null;this.clockMs=0;this.survivalEndMs=null;this.revision=0;this.nextId=1;this.round=0;this.recent=[];this.openingIndex=0;this.openingComplete=false;
    this.visit=null;this.arrival=null;this.service=null;this.responseElapsedMs=0;this.finishRequested=false;this.endReason=null;this.intro=null;
    this.progressDecisions=0;this.formalRecalls=0;this.completedVisits=0;this.recallsSinceChange=0;this.windowCount=0;this.windowGuests=new Set();this.resetIntervals();
    this.stats={served:0,customersServed:0,missed:0,learning:0,recallAttempts:0,correct:0,assisted:0,independent:0,mistakes:0,errors:{'old-preference':0,'other-guest':0,'other-choice':0,timeout:0}};
  }
  record(guest){return{guest,meal:null,previousMeal:null,version:0,reviewed:false,recallsSinceOrder:0,recallLoad:0,lastVisit:null,lastResponseMs:null};}
  get lives(){return MAX_MISTAKES-this.stats.mistakes;}
  get survivedMs(){return this.survivalEndMs??this.clockMs;}
  get responseRemainingMs(){return RESPONSE_MS-this.responseElapsedMs;}
  shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  pick(values){if(!values.length)throw Error('No eligible visitor');return values[Math.floor(this.random()*values.length)];}
  canServe(){return this.phase==='running'&&!!this.visit&&!this.arrival&&!this.service&&!this.finishRequested;}
  resetWindow(){this.windowCount=0;this.windowGuests.clear();}
  resetIntervals(){this.intervalPattern=this.shuffle(this.difficulty.intervals);this.intervalIndex=0;this.updateBlocks=0;this.nextChangeEvery=this.intervalPattern[0];this.recallsSinceChange=0;}
  advanceInterval(){
    this.intervalIndex++;
    if(this.intervalIndex===this.intervalPattern.length){this.intervalIndex=0;this.updateBlocks++;this.intervalPattern=this.shuffle(this.difficulty.intervals);}
    this.nextChangeEvery=this.intervalPattern[this.intervalIndex];
  }
  start(){if(this.phase!=='welcome')return false;this.phase='running';this.prepare();return true;}
  assign(record,meal){record.previousMeal=record.meal;record.meal=meal;record.version++;record.reviewed=false;record.recallsSinceOrder=0;}
  chooseMeal(record,distinct=false){return this.pick(this.activeMeals.filter(meal=>meal!==record.meal&&this.pool.filter(p=>p!==record&&p.meal===meal).length<(distinct?1:2)));}
  recall(exclude=null){
    const available=this.pool.filter(p=>p.meal!==null&&!this.recent.includes(p.guest)&&p.guest!==exclude);
    const load=Math.min(...available.map(p=>p.recallLoad));return this.pick(available.filter(p=>p.recallLoad===load));
  }
  windowReady(){return this.windowCount>=this.difficulty.evidence&&this.windowGuests.size===this.pool.length;}
  blockReady(){return this.difficulty.axis!=='updating'||this.updateBlocks>0&&this.intervalIndex===0;}
  canPromote(){return this.levelIndex<this.stages.length-1;}
  enterNextLevel(){
    const old=this.difficulty;this.difficulty=this.stages[++this.levelIndex];this.activeMeals=MEAL_IDS.slice(0,this.difficulty.meals);this.resetWindow();this.resetIntervals();
    for(const p of this.pool)p.recallLoad=0;
    if(this.difficulty.guests>old.guests){
      const p=this.record(this.guestOrder[this.pool.length]);this.pool.push(p);this.assign(p,this.chooseMeal(p));
      this.intro={type:'guest',guest:p.guest,cuesNeeded:2,recallsNeeded:2,cues:0,recalls:0,due:this.completedVisits};
    }else if(this.difficulty.meals>old.meals){
      const p=this.pick(this.pool.filter(p=>!this.recent.includes(p.guest)));this.assign(p,this.activeMeals.at(-1));
      this.intro={type:'meal',guest:p.guest,cuesNeeded:1,recallsNeeded:1,cues:0,recalls:0,due:this.completedVisits};
    }
  }
  prepare(){
    let record,kind,stage='regular',changeInterval=null;
    if(!this.openingComplete){
      const ids=this.pool.length===3?OPENING:this.pool.map((_,i)=>i);
      if(this.openingIndex<ids.length){record=this.pool[ids[this.openingIndex++]];kind=record.meal===null?'new':'recall';stage='familiarize';if(kind==='new')this.assign(record,this.chooseMeal(record,this.pool.filter(p=>p.meal!==null).length<3));}
      else{this.openingComplete=true;for(const p of this.pool)p.recallLoad=0;}
    }
    if(!record){
      if(!this.intro&&this.canPromote()&&this.windowReady()&&this.blockReady()&&this.pool.every(p=>p.recallsSinceOrder>0))this.enterNextLevel();
      if(this.intro){
        const intro=this.intro;stage='teach-'+intro.type;
        if(this.completedVisits>=intro.due&&!this.recent.includes(intro.guest)){
          record=this.pool.find(p=>p.guest===intro.guest);kind=intro.cues<intro.cuesNeeded?(intro.cues===0?'new':'hint'):'recall';
        }else{record=this.recall(intro.guest);kind='recall';}
      }else{
        const settling=this.canPromote()&&this.windowReady()&&this.blockReady();
        if(!settling&&this.recallsSinceChange>=this.nextChangeEvery){
          record=this.pick(this.pool.filter(p=>p.recallsSinceOrder>0&&!this.recent.includes(p.guest)));kind='change';changeInterval=this.nextChangeEvery;
          this.assign(record,this.chooseMeal(record));this.recallsSinceChange=0;this.advanceInterval();
        }else{
          const untested=settling?this.pool.filter(p=>p.recallsSinceOrder===0&&!this.recent.includes(p.guest)):[];
          record=untested.length?this.pick(untested):this.recall();kind='recall';
        }
      }
    }
    this.visit={id:this.nextId++,guest:record.guest,meal:record.meal,kind,hinted:kind!=='recall',stage,level:this.difficulty.level,version:record.version,changeInterval,gapVisits:record.lastVisit===null?null:this.nextId-1-record.lastVisit};
    this.visit.motion=this.planMotion(this.visit);
    if(['arrivalMs','departureMs','withdrawalMs','rejectionMs'].some(key=>!Number.isFinite(this.visit.motion[key])||this.visit.motion[key]<=0))throw RangeError('Motion durations must be positive');
    this.arrival={elapsedMs:0};this.responseElapsedMs=0;this.revision++;
  }
  serve(meal){if(!this.canServe()||!this.activeMeals.includes(meal))return false;return this.commit(meal,'choice');}
  commit(meal,reason){
    const v=this.visit,record=this.pool.find(p=>p.guest===v.guest),correct=meal===v.meal;
    const errorType=correct?null:reason==='timeout'?'timeout':meal===record.previousMeal?'old-preference':this.pool.some(p=>p!==record&&p.meal===meal)?'other-guest':'other-choice';
    const out={visitId:v.id,guest:v.guest,ordered:v.meal,chosen:meal,correct,reason,errorType,responseMs:this.responseElapsedMs,kind:v.kind,independent:v.kind==='recall'&&!record.reviewed,teaching:v.stage!=='regular',gapVisits:v.gapVisits,sincePreviousResponseMs:record.lastResponseMs===null?null:this.clockMs-record.lastResponseMs};
    if(reason==='timeout'){this.stats.missed++;v.motion.departureMs=v.motion.withdrawalMs;}
    else{this.stats.served++;if(!correct)v.motion.departureMs=v.motion.rejectionMs;}
    if(!correct){this.stats.mistakes++;this.stats.errors[errorType]++;this.resetWindow();if(this.lives===0){this.finishRequested=true;this.endReason='mistakes';this.survivalEndMs=this.clockMs;}}
    if(v.kind==='recall'){
      this.stats.recallAttempts++;if(correct)this.stats.correct++;
      if(out.independent)this.stats.independent++;else this.stats.assisted++;
      record.recallsSinceOrder++;record.recallLoad++;record.reviewed=false;
      if(v.stage==='regular'){
        this.recallsSinceChange++;this.formalRecalls++;
        if(out.independent){this.progressDecisions++;if(correct){this.windowCount++;this.windowGuests.add(v.guest);}}
      }
    }else this.stats.learning++;
    if(this.intro?.guest===v.guest){
      const intro=this.intro;
      if(correct){if(v.hinted)intro.cues++;else if(out.independent)intro.recalls++;}
      else{intro.cues=Math.max(0,intro.cuesNeeded-1);intro.recalls=0;}
      intro.due=this.completedVisits+1+(intro.recalls>0?3:2);
      if(intro.cues>=intro.cuesNeeded&&intro.recalls>=intro.recallsNeeded){this.intro=null;this.resetWindow();this.resetIntervals();for(const p of this.pool)p.recallLoad=0;}
    }
    record.lastVisit=v.id;record.lastResponseMs=this.clockMs;
    const endMs=SERVE_MS+Math.max(v.motion.departureMs,reason==='choice'&&!correct?COUNTER_FLOW.cleanupMs:0);
    this.service={outcome:out,elapsedMs:0,removed:false,endMs};this.revision++;return structuredClone(out);
  }
  advance(ms){
    if(!Number.isFinite(ms)||ms<0)throw RangeError('Time must be finite and non-negative');
    if(this.phase!=='running')return false;
    let left=ms,changed=false;
    while(left>0&&this.phase==='running'){
      const a=this.arrival,s=this.service;
      const boundary=a?this.visit.motion.arrivalMs-a.elapsedMs:s?(s.removed?s.endMs:SERVE_MS)-s.elapsedMs:this.responseRemainingMs;
      const step=Math.min(left,boundary);left-=step;this.clockMs+=step;
      if(a)a.elapsedMs+=step;else if(s)s.elapsedMs+=step;else this.responseElapsedMs+=step;
      if(step!==boundary)continue;
      if(a)this.arrival=null;
      else if(!s)this.commit(null,'timeout');
      else if(!s.removed)s.removed=true;
      else{
        if(s.outcome.correct)this.stats.customersServed++;
        this.recent=[this.visit.guest];this.completedVisits++;this.round=Math.floor(this.formalRecalls/this.pool.length);
        this.service=null;this.visit=null;if(this.finishRequested)this.phase='summary';else this.prepare();
      }
      this.revision++;changed=true;
    }
    return changed;
  }
  pause(reason='background',{review=false}={}){
    if(this.phase!=='running')return false;this.phase='paused';this.pauseReason=reason;
    if(review)for(const p of this.pool)if(p.meal&&p.guest!==this.service?.outcome.guest)p.reviewed=true;
    this.revision++;return true;
  }
  resume(){if(this.phase!=='paused')return false;this.phase='running';this.revision++;return true;}
  reposition(motion){
    if(!this.visit)return false;
    const old=this.visit.motion;
    // Moving the table changes geometry, never this visit's already-started clocks.
    this.visit.motion={...motion,arrivalMs:old.arrivalMs,departureMs:old.departureMs,withdrawalMs:old.withdrawalMs,rejectionMs:old.rejectionMs};
    this.revision++;return true;
  }
  finish(){if(this.phase!=='paused')return false;this.endReason??='manual';if(this.service){this.finishRequested=true;this.phase='running';}else{this.phase='summary';this.arrival=null;}this.revision++;return true;}
  checkpoint(){const{random,planMotion,stages,windowGuests,...state}=this;return structuredClone({version:1,state,random:random.getState(),windowGuests:[...windowGuests]});}
  static restore(checkpoint,options){
    if(checkpoint?.version!==1||!checkpoint.state||!Array.isArray(checkpoint.windowGuests))throw Error('Invalid G04 checkpoint');
    const state=checkpoint.state,s=new RegularsSession(options);
    if(!['welcome','running','paused','summary'].includes(state.phase)||!Number.isFinite(state.clockMs)||state.clockMs<0||!Number.isInteger(state.levelIndex)||!s.stages[state.levelIndex]||!Number.isInteger(state.stats?.mistakes)||state.stats.mistakes<0||state.stats.mistakes>MAX_MISTAKES||!Array.isArray(state.pool)||state.pool.length>6)throw Error('Invalid G04 checkpoint state');
    for(const key of Object.keys(s).filter(key=>!['random','planMotion','stages','windowGuests'].includes(key))){if(!Object.hasOwn(state,key))throw Error('Missing G04 checkpoint field '+key);s[key]=structuredClone(state[key]);}
    s.difficulty=s.stages[s.levelIndex];s.windowGuests=new Set(checkpoint.windowGuests);s.random.restore(checkpoint.random);return s;
  }
  snapshot(){return structuredClone({phase:this.phase,clockMs:this.clockMs,survivedMs:this.survivedMs,revision:this.revision,round:this.round,pool:this.pool,activeMeals:this.activeMeals,intro:this.intro,visit:this.visit,arrival:this.arrival,service:this.service,responseElapsedMs:this.responseElapsedMs,responseRemainingMs:this.responseRemainingMs,responseLimitMs:RESPONSE_MS,difficulty:this.difficulty,progressDecisions:this.progressDecisions,recallsSinceChange:this.recallsSinceChange,nextChangeEvery:this.nextChangeEvery,window:{count:this.windowCount,guests:[...this.windowGuests]},stats:this.stats,lives:this.lives,endReason:this.endReason,canServe:this.canServe(),finishRequested:this.finishRequested});}
}
