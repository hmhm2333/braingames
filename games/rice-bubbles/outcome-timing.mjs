// One complete character feedback cycle, excluding the preceding travel.
export const FEEDBACK_MS=600;
export const PICKUP_MS=200;
export const IMPACT_MS=300;
export const RICE_GRAB_MS=75;
export const RICE_HIT_MS=350;

// Keep the initial reach quick, then give the bring-to-bowl and recovery cels
// room to read. No single peak cel is frozen for the rest of the feedback.
export function riceSourceTime(time,clip){
  const grab=clip.events.find(e=>e.name==='object_grab').visibleAtMs;
  const hit=clip.events.find(e=>e.name==='rice_hit').visibleAtMs;
  if(time<=RICE_GRAB_MS)return time/RICE_GRAB_MS*grab;
  if(time<=RICE_HIT_MS)return grab+(time-RICE_GRAB_MS)/(RICE_HIT_MS-RICE_GRAB_MS)*(hit-grab);
  return hit+(time-RICE_HIT_MS)/(FEEDBACK_MS-RICE_HIT_MS)*(clip.durationMs-hit);
}

export function outcomeTiming(outcome,startAtMs){
  if(!['rice_caught','bubble_mistake','bubble_pass','rice_miss','food_mistake','food_refused'].includes(outcome))throw Error('Unknown outcome '+outcome);
  // Character motion remains 600ms. A late check/cross gets its full 300ms
  // before the next item or final result replaces the scene.
  return{outcome,startAtMs,endAtMs:startAtMs+FEEDBACK_MS+(['rice_caught','bubble_mistake','food_mistake'].includes(outcome)?50:0),
    pickupMs:outcome==='rice_caught'?FEEDBACK_MS:PICKUP_MS,
    reactionAtMs:['bubble_mistake','food_mistake'].includes(outcome)?startAtMs+PICKUP_MS:startAtMs,
    reactionMs:['bubble_mistake','food_mistake'].includes(outcome)?FEEDBACK_MS-PICKUP_MS:FEEDBACK_MS};
}
