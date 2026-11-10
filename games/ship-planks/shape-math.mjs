export const SIZE=4;
export function rotateCells(cells,turns=0){let p=cells.map(v=>v.slice());for(let i=0;i<((turns%4)+4)%4;i++)p=p.map(([x,y])=>[SIZE-1-y,x]);return p.sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
export function cellsFromMask(mask){const out=[];for(let i=0;i<16;i++)if(mask>>i&1)out.push([i%4,i>>2]);return out;}
export function maskOf(cells){return cells.reduce((m,[x,y])=>m|1<<(y*4+x),0);}
export function normalMask(cells){const x=Math.min(...cells.map(p=>p[0])),y=Math.min(...cells.map(p=>p[1]));return cells.reduce((m,p)=>m|1<<((p[1]-y)*4+p[0]-x),0);}
export function familyOf(cells){return Math.min(...[0,1,2,3].map(r=>normalMask(rotateCells(cells,r))));}
export function matchingRotations(target,cells){const expected=maskOf(target),out=[];for(let r=0;r<4;r++)if(maskOf(rotateCells(cells,r))===expected)out.push(r);return out;}
export function bitCount(mask){let n=0;for(;mask;mask&=mask-1)n++;return n;}
export function shapeDistance(a,b){const m=normalMask(a);return Math.min(...[0,1,2,3].map(r=>bitCount(m^normalMask(rotateCells(b,r)))));}
