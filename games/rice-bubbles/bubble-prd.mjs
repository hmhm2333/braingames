import {DIFFICULTY_CONFIG} from './difficulty.mjs';

// PRD with a maximum two-bubble run. Calibrate the base hazard against the
// renewal cycle: a cluster has mean 1+C bubbles, followed by at least one
// non-bubble and hazards 2C, 3C, ... . This retains the intended long-run rate.
function rate(base){
  let zeros=1,survival=1;
  for(let n=2;n*base<1;n++){survival*=1-n*base;zeros+=survival;}
  return(1+base)/(1+base+zeros);
}
function profile(target){
  if(target===0)return Object.freeze({target,base:0,initialWait:0});
  let lo=0,hi=1;
  for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(rate(mid)<target)lo=mid;else hi=mid;}
  const base=(lo+hi)/2;
  return Object.freeze({target,base,initialWait:Math.max(0,Math.round(target/base)-1)});
}
const {beforePicky,withPicky,forbiddenFood}=DIFFICULTY_CONFIG.probabilities;
const validBubbleRate=rate=>Number.isFinite(rate)&&(rate===0||(rate>=0.01&&rate<=2/3));
if(!validBubbleRate(beforePicky)||!validBubbleRate(withPicky)||
  !Number.isFinite(forbiddenFood)||forbiddenFood<0||forbiddenFood+withPicky>1){
  throw new RangeError('接饭 difficulty.mjs 的泡泡或禁接食物概率超出范围');
}
export const FORBIDDEN_FOOD_RATE=forbiddenFood;
export const BUBBLE_PROFILES=Object.freeze({intro:profile(beforePicky),picky:profile(withPicky)});
export function bubbleChance(profile,wait,streak){return streak>=2?0:Math.min(1,profile.base*(wait+1));}
