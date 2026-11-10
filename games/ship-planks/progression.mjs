export const STAGES=[
 [6,1,2],[6,1,3],[6,2,3],[7,2,3],[8,2,3],
 [8,2,4],[8,3,4],[9,3,4],[10,3,4],[10,3,5]
].map(([cells,discrimination,holes],i)=>({stage:i+1,cells,discrimination,holes}));
export const TRIALS_PER_STAGE=12;
export const LOAD_WEIGHTS=[[.6,.35,.05],[.25,.6,.15],[.1,.55,.35]];
export const COMPLEXITY_WEIGHTS=[[.25,.7,.05],[.05,.65,.3],[0,.35,.65]];
export class Progression{
 constructor(){this.index=0;this.credits=0;this.recent=[];this.streak=0;this.blendCorrect=4;this.from=1;}
 get current(){return STAGES[this.index];}
 record(correct,assisted){if(assisted)return;this.recent.push(correct);if(this.recent.length>6)this.recent.shift();if(correct){this.credits=Math.min(TRIALS_PER_STAGE,this.credits+1);this.streak=Math.min(6,this.streak+1);this.blendCorrect=Math.min(4,this.blendCorrect+1);}else this.streak=0;}
 promote(){
  if(this.index===STAGES.length-1||this.credits<TRIALS_PER_STAGE||this.recent.length<6||this.recent.filter(Boolean).length<5||this.streak<3)return null;
  const previous=this.current;this.index++;this.credits=0;this.recent=[];this.from=previous.discrimination;this.blendCorrect=previous.discrimination===this.current.discrimination?4:0;return previous;
 }
 weights(){const a=LOAD_WEIGHTS[this.from-1],b=LOAD_WEIGHTS[this.current.discrimination-1],t=Math.min(1,(this.blendCorrect+1)/4);return b.map((v,i)=>a[i]+(v-a[i])*t);}
 complexityWeights(){const a=COMPLEXITY_WEIGHTS[this.from-1],b=COMPLEXITY_WEIGHTS[this.current.discrimination-1],t=Math.min(1,(this.blendCorrect+1)/4);return b.map((v,i)=>a[i]+(v-a[i])*t);}
 snapshot(){return{...this.current,credits:this.credits,recent:[...this.recent],streak:this.streak,blendCorrect:this.blendCorrect,weights:this.weights(),complexityWeights:this.complexityWeights()};}
}
