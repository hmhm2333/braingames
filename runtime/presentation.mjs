// Three authored pixel-animation frames; wall time here never advances training.
export const RECOVERY_MS=3*1000/16;
export const playableSize=(width,height)=>width>=640&&height>=480;
export const VERDICT_COLORS={edge:0xfff8e4,ink:0x263248,correct:0x94bbb5,incorrect:0xe5a2a1};
export const VERDICT_TICK=[[-5,0],[-3,2],[-1,4],[1,2],[3,0],[5,-2],[7,-4]];
export const VERDICT_CROSS=Array.from({length:5},(_,i)=>i-2).flatMap(i=>[-1,1].map(side=>[i*2,side*i*2]));
