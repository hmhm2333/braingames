import {DIFFICULTY_CONFIG} from './difficulty.mjs';

export const FOOD_TYPES=Object.freeze([
  Object.freeze({id:'baozi',label:'包子'}),Object.freeze({id:'jiaozi',label:'饺子'}),
  Object.freeze({id:'corn',label:'玉米'}),Object.freeze({id:'zongzi',label:'粽子'}),
  Object.freeze({id:'tanghulu',label:'糖葫芦'}),Object.freeze({id:'sweetpotato',label:'红薯'}),
  Object.freeze({id:'youtiao',label:'油条'}),Object.freeze({id:'mooncake',label:'月饼'})
]);
export const FOOD_IDS=Object.freeze(FOOD_TYPES.map(food=>food.id));
const {correctPerStage, pickyCueMs, stages, probabilities}=DIFFICULTY_CONFIG;
if (!Number.isInteger(correctPerStage) || correctPerStage < 1 || !Number.isInteger(pickyCueMs) || pickyCueMs < 1) {
  throw new RangeError('接饭 difficulty.mjs 的升档题数和挑食提示时间须为正整数');
}
if (!stages.length || stages[0].picky || stages.some((stage, index) =>
  !Number.isInteger(stage.flightMs) || stage.flightMs < 1 ||
  !Number.isInteger(stage.gapMinMs) || stage.gapMinMs < 0 ||
  !Number.isInteger(stage.gapMaxMs) || stage.gapMaxMs < stage.gapMinMs ||
  !Number.isFinite(stage.wrappedFraction) || stage.wrappedFraction < 0 || stage.wrappedFraction > 1 ||
  typeof stage.picky !== 'boolean' || (stages[index - 1]?.picky && !stage.picky)
)) {
  throw new RangeError('接饭 difficulty.mjs 的档位无效。首档须关闭挑食，且开启后不能关回去。');
}
export const PICKY_CUE_MS=pickyCueMs;
export const DIFFICULTY=Object.freeze(stages.map((stage,index)=>Object.freeze({level:index+1,...stage})));
export const ENDLESS=Object.freeze({
  trialsPerStep:correctPerStage,
  firstWindowMs:DIFFICULTY[0].flightMs,
  lastWindowMs:DIFFICULTY.at(-1).flightMs,
  noGoProbability:probabilities.beforePicky
});
export function difficultyForCorrect(correct){return DIFFICULTY[Math.min(DIFFICULTY.length-1,Math.floor(correct/ENDLESS.trialsPerStep))];}
