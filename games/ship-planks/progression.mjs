import {DIFFICULTY_CONFIG} from './difficulty.mjs';

const {stages,loadWeights,complexityWeights,promotion}=DIFFICULTY_CONFIG;
const {correctPerStage,recentAnswers,recentCorrect,correctStreak,blendAfterCorrect}=promotion;
const integerIn=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const validWeights=table=>table.length>0&&table.every(row=>
  row.length===3&&row.every(n=>Number.isFinite(n)&&n>=0)&&Math.abs(row.reduce((sum,n)=>sum+n,0)-1)<1e-6
);
if(!stages.length||stages.some((stage,index)=>
  !integerIn(stage.cells,stages[index-1]?.cells??5,10)||
  !integerIn(stage.holes,stages[index-1]?.holes??2,5)||
  !integerIn(stage.discrimination,1,loadWeights.length)
)){
  throw new RangeError('补船 difficulty.mjs 的格数、破口数或辨形档超出支持范围');
}
if(!Object.values(promotion).every(value=>Number.isInteger(value)&&value>0)||recentCorrect>recentAnswers||loadWeights.length!==complexityWeights.length||
  !validWeights(loadWeights)||!validWeights(complexityWeights)){
  throw new RangeError('补船 difficulty.mjs 的晋级或负荷权重配置无效');
}
export const STAGES=Object.freeze(stages.map((stage,index)=>Object.freeze({stage:index+1,...stage})));
export const TRIALS_PER_STAGE=correctPerStage;
export const LOAD_WEIGHTS=loadWeights;
export const COMPLEXITY_WEIGHTS=complexityWeights;

function blend(table, from, to, correct) {
  const previous=table[from-1], target=table[to-1];
  const mix=Math.min(1,(correct+1)/blendAfterCorrect);
  return target.map((value,index)=>previous[index]+(value-previous[index])*mix);
}
export class Progression{
 constructor(){this.index=0;this.credits=0;this.recent=[];this.streak=0;this.blendCorrect=blendAfterCorrect;this.from=this.current.discrimination;}
 get current(){return STAGES[this.index];}
 record(correct,assisted){
  if(assisted)return;
  this.recent.push(correct);
  if(this.recent.length>recentAnswers)this.recent.shift();
  if(correct){
   this.credits=Math.min(TRIALS_PER_STAGE,this.credits+1);
   this.streak=Math.min(Math.max(recentAnswers,correctStreak),this.streak+1);
   this.blendCorrect=Math.min(blendAfterCorrect,this.blendCorrect+1);
  }else this.streak=0;
 }
 promote(){
  if(this.index===STAGES.length-1||this.credits<TRIALS_PER_STAGE||this.recent.length<recentAnswers||
     this.recent.filter(Boolean).length<recentCorrect||this.streak<correctStreak)return null;
  const previous=this.current;this.index++;this.credits=0;this.recent=[];this.from=previous.discrimination;
  this.blendCorrect=previous.discrimination===this.current.discrimination?blendAfterCorrect:0;
  return previous;
 }
 weights(){return blend(LOAD_WEIGHTS,this.from,this.current.discrimination,this.blendCorrect);}
 complexityWeights(){return blend(COMPLEXITY_WEIGHTS,this.from,this.current.discrimination,this.blendCorrect);}
 snapshot(){return{...this.current,credits:this.credits,recent:[...this.recent],streak:this.streak,blendCorrect:this.blendCorrect,weights:this.weights(),complexityWeights:this.complexityWeights()};}
}
