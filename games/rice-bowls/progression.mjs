// One content axis at a time. Interval mixtures use only 5, 4 and 3.
const content=[[3,4],[3,5],[3,6],[4,6],[4,7],[5,7],[5,8],[6,8],[6,9]];
const updates=[[5,5,5,4],[5,4],[5,4,4,4],[4],[4,4,4,3],[4,3],[4,3,3,3],[3]];
export const DIFFICULTY=Object.freeze([
  ...content.map(([guests,meals])=>({guests,meals,intervals:[5],axis:'content'})),
  ...updates.map(intervals=>({guests:6,meals:9,intervals,axis:'updating'}))
].map((s,i)=>Object.freeze({...s,level:i+1,intervals:Object.freeze(s.intervals),evidence:i===0?8:Math.max(6,s.guests+2)})));
