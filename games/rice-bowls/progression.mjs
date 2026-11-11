import {DIFFICULTY_CONFIG} from './difficulty.mjs';

export const RESPONSE_MS=DIFFICULTY_CONFIG.responseMs;
export const TEACHING_GAP_VISITS=DIFFICULTY_CONFIG.teachingGapVisits;
if(!Number.isInteger(RESPONSE_MS)||RESPONSE_MS<1)throw new RangeError('上菜 difficulty.mjs 的 responseMs 须为正整数');
if(!Number.isInteger(TEACHING_GAP_VISITS)||TEACHING_GAP_VISITS<1)throw new RangeError('上菜 difficulty.mjs 的教学须至少隔一位顾客');
export const DIFFICULTY=Object.freeze(DIFFICULTY_CONFIG.stages.map((stage,index)=>
  Object.freeze({...stage,level:index+1,intervals:Object.freeze([...stage.intervals])})
));
