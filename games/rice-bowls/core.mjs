import {createRandom} from '../../runtime/random-state.mjs';
export const GUEST_IDS = Array.from({length:6}, (_,i)=>`guest-${i}`);
export const BOWL_IDS = ['wave','flower','stripe','check','dot','triangle'];
export const TRANSITION_MS = 700;
export const NEXT_GUEST_MS = 240;
export const FEEDBACK_MS = 1000;

export function randomSource(seed){return createRandom(seed);}

function shuffled(values,random){
  const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
const fingerprint=pairs=>pairs.map(p=>`${p.guest}:${p.bowl}`).sort().join('|');

export function createBatch({size,random,previous=null}){
  if(!Number.isInteger(size)||size<3||size>6)throw RangeError('配对数量应为3至6。');
  const guests=shuffled(GUEST_IDS,random).slice(0,size);
  const bowls=shuffled(BOWL_IDS,random).slice(0,size);
  const assigned=shuffled(bowls,random);
  // Some guests can choose the same style; ownership is not one-to-one.
  if(random()<.35)assigned[size-1]=assigned[0];
  let pairs=guests.map((guest,i)=>({guest,bowl:assigned[i]}));
  if(previous&&fingerprint(pairs)===fingerprint(previous.pairs)){
    pairs=pairs.map(p=>({...p,bowl:bowls[(bowls.indexOf(p.bowl)+1)%bowls.length]}));
  }
  // Cover every guest, then mix in extra requests. No compulsory A-B-A-B.
  const requests=shuffled([...guests,...Array.from({length:size},()=>guests[Math.floor(random()*size)])],random);
  return{size,guests,bowls,pairs,requests};
}

export class BowlSession{
  constructor({seed=1,initialPairs=4}={}){
    if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid seed');
    if(!Number.isInteger(initialPairs)||initialPairs<3||initialPairs>6)throw RangeError('Invalid initial pairs');
    this.random=randomSource(seed);this.seed=seed;this.size=initialPairs;this.phase='study';
    this.clockMs=0;this.elapsedMs=0;this.batchNumber=0;this.events=[];this.records=[];this.window=[];
    this.stats={answered:0,correct:0,firstAnswered:0,firstCorrect:0,repeatedAnswered:0,repeatedCorrect:0,assistedAnswered:0,assistedCorrect:0,batches:0,highestPairs:initialPairs};
    this.newBatch();
  }
  newBatch(){
    const previous=this.batch;this.batch=createBatch({size:this.size,random:this.random,previous});
    this.batchNumber++;this.requestIndex=0;this.seen=new Set();this.batchFirst={answered:0,correct:0};
    this.assisted=false;this.needsReview=false;this.studyKind='new';this.question=null;this.outcome=null;
    this.phase='study';this.elapsedMs=0;this.stats.highestPairs=Math.max(this.stats.highestPairs,this.size);
    this.emit('batch-start',{size:this.size,batch:this.batchNumber});
  }
  emit(type,data={}){this.events.push({type,...data,clockMs:this.clockMs});if(this.events.length>128)this.events.shift();}
  drainEvents(){return this.events.splice(0);}
  makeQuestion(){
    const guest=this.batch.requests[this.requestIndex],correct=this.batch.pairs.find(p=>p.guest===guest).bowl;
    const distractors=shuffled(this.batch.bowls.filter(b=>b!==correct),this.random).slice(0,3);
    this.question={guest,correct,choices:shuffled([correct,...distractors],this.random),first:!this.seen.has(guest)};
  }
  start(){
    if(this.phase!=='study')return false;
    this.makeQuestion();this.phase='transition';this.transitionMs=TRANSITION_MS;this.elapsedMs=0;this.outcome=null;
    this.emit('study-close',{review:this.studyKind==='review'});return true;
  }
  choose(bowl){
    if(this.phase!=='recall'||!this.question.choices.includes(bowl))return false;
    const correct=bowl===this.question.correct,first=this.question.first;
    const category=this.assisted?'assisted':first?'first':'repeated';
    this.stats.answered++;if(correct)this.stats.correct++;
    const prefix={assisted:'assisted',first:'first',repeated:'repeated'}[category];
    this.stats[prefix+'Answered']++;if(correct)this.stats[prefix+'Correct']++;
    if(first&&!this.assisted){this.batchFirst.answered++;if(correct)this.batchFirst.correct++;}
    this.seen.add(this.question.guest);
    this.outcome={guest:this.question.guest,chosen:bowl,correctBowl:this.question.correct,correct,category,requestIndex:this.requestIndex};
    this.phase='feedback';this.elapsedMs=0;this.emit('choice',this.outcome);return structuredClone(this.outcome);
  }
  advance(ms){
    if(!Number.isFinite(ms)||ms<0)throw RangeError('Time must be finite and non-negative');
    if(this.phase==='paused'||this.phase==='summary')return false;
    this.clockMs+=ms;
    if(this.phase!=='transition'&&this.phase!=='feedback')return false;
    this.elapsedMs+=ms;
    if(this.phase==='transition'&&this.elapsedMs>=this.transitionMs){this.phase='recall';this.elapsedMs=0;this.emit('request',{guest:this.question.guest});return true;}
    if(this.phase==='feedback'&&this.elapsedMs>=FEEDBACK_MS){
      this.requestIndex++;this.elapsedMs=0;
      if(this.requestIndex===this.batch.requests.length)this.completeBatch();
      else if(this.needsReview){this.phase='study';this.studyKind='review';this.question=null;this.outcome=null;this.needsReview=false;}
      else{this.makeQuestion();this.phase='transition';this.transitionMs=NEXT_GUEST_MS;this.outcome=null;}
      return true;
    }
    return false;
  }
  completeBatch(){
    const record={batch:this.batchNumber,size:this.size,assisted:this.assisted,firstAnswered:this.batchFirst.answered,firstCorrect:this.batchFirst.correct};
    this.records.push(record);if(this.records.length>12)this.records.shift();this.stats.batches++;
    let nextSize=this.size;
    if(!record.assisted&&record.firstAnswered===this.size){
      this.window.push(record);
      if(this.window.length===2){
        const answered=this.window.reduce((n,r)=>n+r.firstAnswered,0),correct=this.window.reduce((n,r)=>n+r.firstCorrect,0);
        if(correct/answered>=.8)nextSize=Math.min(6,this.size+1);
        else if(correct/answered<.6)nextSize=Math.max(3,this.size-1);
        this.window=[];
      }
    }
    const before=this.size;this.size=nextSize;this.newBatch();
    this.levelChange=nextSize-before;this.emit('batch-complete',{...record,nextSize});
  }
  pause(reason='manual'){
    if(this.phase==='paused'||this.phase==='summary')return false;
    this.resumePhase=this.phase;this.phase='paused';this.pauseReason=reason;
    if(this.resumePhase==='feedback'&&this.requestIndex+1<this.batch.requests.length){this.needsReview=true;this.assisted=true;}
    this.emit('pause',{reason});return true;
  }
  resume(){
    if(this.phase!=='paused')return false;
    if(this.resumePhase==='recall'||this.resumePhase==='transition'){
      this.phase='study';this.studyKind='review';this.assisted=true;this.question=null;this.outcome=null;this.elapsedMs=0;
    }else this.phase=this.resumePhase;
    this.emit('resume',{review:this.studyKind==='review'});return true;
  }
  finish(){
    if(this.phase!=='paused')return false;
    this.phase='summary';this.emit('finish');return true;
  }
  snapshot(){
    return structuredClone({phase:this.phase,clockMs:this.clockMs,elapsedMs:this.elapsedMs,size:this.size,batchNumber:this.batchNumber,batch:this.batch,
      requestIndex:this.requestIndex,question:this.question,outcome:this.outcome,studyKind:this.studyKind,assisted:this.assisted,
      levelChange:this.levelChange??0,stats:this.stats,records:this.records,window:this.window,pauseReason:this.pauseReason??null});
  }
}
