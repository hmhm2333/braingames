import {createRandom} from '../../runtime/random-state.mjs';
import {LEAK_ORIGINS,DECK_CELLS,separated,walkPath} from './sampan.mjs';
import {SIZE,rotateCells,familyOf,matchingRotations,shapeDistance} from './shape-math.mjs';
import {PATCHES,chooseChain,taskLoad} from './materials.mjs';
import {Progression,STAGES} from './progression.mjs';
export {SIZE,rotateCells,familyOf,matchingRotations,shapeDistance,PATCHES,STAGES};
export const CONTACT_MS=420;
export const MOTION_MS=780;
export const GROW_MS=240;
export const ANSWER_MS=7000;
export const WARNING_MS=2000;
export const MAX_LIVES=3;
export const INTRO_PATCH=PATCHES.find(p=>p.cells.length===STAGES[0].cells);
const weighted=(weights,random)=>{let roll=random();for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<0)return i;}return weights.length-1;};
export function randomSource(seed){return createRandom(seed);}
export class RepairSession{
 constructor({seed=1}={}){
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid seed');
  this.random=randomSource(seed);this.phase='welcome';this.paused=false;this.clockMs=0;this.revision=0;this.sites=[];this.task=null;this.motion=null;this.growth=null;this.needsLanding=false;this.lives=MAX_LIVES;this.recent=[];this.nextSiteId=0;this.progress=new Progression();
  this.deck=DECK_CELLS.map(([x,y])=>({x,y,repairs:0,stamp:0}));this.deckIndex=new Map(this.deck.map(p=>[p.x+','+p.y,p]));this.stats={placed:0,built:0,mistakes:0,timeouts:0,assisted:0,tasks:0,installedCells:0,loads:[0,0,0],complexityBands:[0,0,0]};
 }
 wantedLoad(){return weighted(this.progress.weights(),this.random);}
 makeSite(previous=null){
  const n=this.progress.current.cells,wanted={load:this.wantedLoad(),complexity:weighted(this.progress.complexityWeights(),this.random)},chain=chooseChain(n,this.sites,wanted,this.recent,this.random),material=chain[n];
  const origins=LEAK_ORIGINS.filter(p=>this.sites.every(s=>separated(p,s))&&(!previous||separated(p,previous))).map(p=>({...p,age:material.cells.reduce((sum,[x,y])=>sum+this.deckIndex.get((p.x+x*10)+','+(p.y+y*10)).repairs,0),tie:this.random()})).sort((a,b)=>a.age-b.age||a.tie-b.tie);
  for(const origin of origins){const site={id:this.nextSiteId,x:origin.x,y:origin.y,...material,chain,wait:0},sites=[...this.sites,site];if(sites.every(s=>walkPath(s,sites))){this.nextSiteId++;return site;}}
  throw Error('No reachable space for another leak');
 }
 start(){if(this.phase!=='welcome')return false;this.phase='running';while(this.sites.length<2)this.sites.push(this.makeSite());this.deal();this.revision++;return true;}
 deal(){
  const intro=this.stats.tasks===0;for(const site of this.sites)site.wait++;
  const overdue=this.sites.filter(s=>s.wait>=this.sites.length*2+2),available=overdue.length?overdue:this.sites,wanted=this.wantedLoad();
  const load=site=>taskLoad(site,this.sites.filter(s=>s!==site)),closest=Math.min(...available.map(s=>Math.abs(load(s)-wanted))),pool=available.filter(s=>Math.abs(load(s)-wanted)===closest),weights=pool.map(s=>1+.35*s.wait);
  let rollAnswer=this.random()*weights.reduce((n,w)=>n+w,0),hole=pool.at(-1);for(let i=0;i<pool.length;i++){rollAnswer-=weights[i];if(rollAnswer<0){hole=pool[i];break;}}
  const answer=this.sites.indexOf(hole),roll=this.random(),rotation=intro?0:roll<.1?0:roll<.5?1:roll<.6?2:3,actual=load(hole);
  this.task={id:this.stats.tasks++,answer,rotation,cells:rotateCells(hole.cells,4-rotation),installed:hole.cells.map(v=>v.slice()),family:hole.family,intro,assisted:intro,elapsedMs:0,requestedLoad:wanted,actualLoad:actual,complexityBand:hole.band};
  this.stats.loads[actual]++;this.stats.complexityBands[hole.band]++;this.recent.push(hole.family);if(this.recent.length>12)this.recent.shift();
 }
 canAct(){return this.phase==='running'&&!this.paused&&!this.motion&&!this.growth&&!this.needsLanding;}
 place(slot){
  if(!this.canAct()||!Number.isInteger(slot)||!this.sites[slot])return{ok:false,reason:'not-ready'};
  const site=this.sites[slot],correct=slot===this.task.answer;
  this.motion={kind:'repair',slot,x:site.x,y:site.y,path:walkPath(site,this.sites),correct,judged:false,assisted:this.task.assisted,rotation:this.task.rotation,cells:this.task.installed.map(v=>v.slice()),holeCells:site.cells.map(v=>v.slice()),elapsedMs:0,durationMs:MOTION_MS};
  this.revision++;return{ok:true,correct};
 }
 elapseAnswer(ms){
  if(!Number.isFinite(ms)||ms<0)throw RangeError('Invalid answer time');if(!this.canAct())return false;
  const step=Math.min(ms,ANSWER_MS-this.task.elapsedMs);this.task.elapsedMs+=step;this.clockMs+=step;
  if(this.task.elapsedMs<ANSWER_MS)return false;
  this.motion={kind:'timeout',correct:false,judged:false,assisted:this.task.assisted,elapsedMs:0,durationMs:MOTION_MS};this.revision++;return true;
 }
 advance(ms){
  if(!Number.isFinite(ms)||ms<0)throw RangeError('Invalid active time');if(!this.canAdvance())return false;
  if(this.growth){const step=Math.min(ms,GROW_MS-this.growth.elapsedMs);this.growth.elapsedMs+=step;this.clockMs+=step;if(this.growth.elapsedMs<GROW_MS)return false;this.growth=null;this.revision++;return true;}
  const m=this.motion,step=Math.min(ms,m.durationMs-m.elapsedMs);m.elapsedMs+=step;this.clockMs+=step;
  if(!m.judged&&m.elapsedMs>=CONTACT_MS){m.judged=true;if(!m.correct){this.lives--;this.stats.mistakes++;if(m.kind==='timeout')this.stats.timeouts++;}this.revision++;}
  if(m.elapsedMs<m.durationMs)return false;
  this.progress.record(m.correct,m.assisted);
  if(m.correct){
   for(const[x,y]of m.cells){const cell=this.deckIndex.get((m.x+x*10)+','+(m.y+y*10));cell.repairs++;cell.stamp=this.stats.built+1;}
   this.stats.built++;this.stats.installedCells+=m.cells.length;if(m.assisted)this.stats.assisted++;else this.stats.placed++;
   this.sites.splice(m.slot,1);this.sites.splice(m.slot,0,this.makeSite(m));this.needsLanding=true;
  }
  this.motion=null;if(this.lives===0)this.phase='finished';else if(!this.needsLanding)this.deal();this.revision++;return true;
 }
 land(){
  if(!this.needsLanding||this.paused)return false;
  const previous=this.progress.promote(),current=this.progress.current;
  if(previous&&previous.cells!==current.cells){
   const additions=[];for(const site of this.sites){const old=new Set(site.cells.map(p=>p.join(','))),next=site.chain[current.cells];for(const[x,y]of next.cells)if(!old.has([x,y].join(',')))additions.push([site.x+x*10,site.y+y*10]);Object.assign(site,next);}
   this.growth={elapsedMs:0,additions};
  }
  while(this.sites.length<current.holes)this.sites.push(this.makeSite());
  this.needsLanding=false;this.deal();this.revision++;return true;
 }
 canAdvance(){return this.phase==='running'&&!this.paused&&!!(this.motion||this.growth);}
 pause(){if(this.phase!=='running'||this.paused)return false;this.paused=true;return true;}
 resume(){if(!this.paused)return false;this.paused=false;return true;}
 checkpoint(){const{random,deckIndex,progress,...state}=this;return structuredClone({version:1,state,random:random.getState(),progress:{...progress}});}
 static restore(checkpoint){
  if(checkpoint?.version!==1||!checkpoint.state||!checkpoint.progress)throw Error('Invalid G02 checkpoint');
  const state=checkpoint.state,p=checkpoint.progress,s=new RepairSession();
  if(!['welcome','running','finished'].includes(state.phase)||!Number.isFinite(state.clockMs)||state.clockMs<0||!Number.isInteger(state.lives)||state.lives<0||state.lives>MAX_LIVES||!Array.isArray(state.sites)||state.sites.length>5||!Array.isArray(state.deck)||state.deck.length!==DECK_CELLS.length||!Number.isInteger(p.index)||!STAGES[p.index])throw Error('Invalid G02 checkpoint state');
  for(const key of Object.keys(s).filter(key=>!['random','deckIndex','progress'].includes(key))){if(!Object.hasOwn(state,key))throw Error('Missing G02 checkpoint field '+key);s[key]=structuredClone(state[key]);}
  for(const key of Object.keys(s.progress)){if(!Object.hasOwn(p,key))throw Error('Missing G02 progression field '+key);s.progress[key]=structuredClone(p[key]);}
  s.deckIndex=new Map(s.deck.map(cell=>[cell.x+','+cell.y,cell]));s.random.restore(checkpoint.random);return s;
 }
 snapshot(){return structuredClone({phase:this.phase,paused:this.paused,sites:this.sites.map(({chain,...site})=>site),deck:this.deck,originalLeft:this.deck.filter(p=>p.repairs===0).length,task:this.task,motion:this.motion,growth:this.growth,needsLanding:this.needsLanding,lives:this.lives,clockMs:this.clockMs,revision:this.revision,stats:this.stats,progress:this.progress.snapshot()});}
}
