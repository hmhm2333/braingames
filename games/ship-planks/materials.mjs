import {MATERIAL_ROWS} from './materials.generated.mjs';
import {cellsFromMask,rotateCells,normalMask,bitCount} from './shape-math.mjs';
const nodes=new Map(),roots=new Map(),variants=new Map();
for(const[n,rows]of Object.entries(MATERIAL_ROWS)){
 const families=new Map();for(const[mask,family,complexity,band,next]of rows){const node={mask,family,complexity,band,next};nodes.set(mask,node);families.set(family,node);if(!variants.has(family))variants.set(family,[0,1,2,3].map(r=>normalMask(rotateCells(cellsFromMask(family),r))));}
 roots.set(Number(n),[...families.values()]);
}
export const PATCHES=[...roots.values()].flat().map(p=>({...p,cells:cellsFromMask(p.mask)})).sort((a,b)=>a.cells.length-b.cells.length||a.band-b.band||a.complexity-b.complexity||a.family-b.family);
const joint=[[0,0,1],[0,1,2],[1,2,2]];
function distance(a,b){return Math.min(...variants.get(b).map(mask=>bitCount(a^mask)));}
export function taskLoad(node,others){if(!others.length)return joint[node.band][0];const k=Math.min(...others.map(o=>distance(node.family,o.family)))/2;return joint[node.band][k>=3?0:k===2?1:2];}
const shuffled=(values,random)=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function chooseChain(n,others,wanted,recent,random){
 const at=(level)=>others.map(p=>p.chain[level]).filter(Boolean);
 const compare=(a,b,present)=>Math.abs(a.band-wanted.complexity)-Math.abs(b.band-wanted.complexity)||Math.abs(taskLoad(a,present)-wanted.load)-Math.abs(taskLoad(b,present)-wanted.load);
 function grow(node,level){
  const present=at(level);if(present.some(p=>p.family===node.family))return null;
  if(level===10)return{[level]:node};
  const children=shuffled(node.next.map(mask=>nodes.get(mask)),random).sort((a,b)=>compare(a,b,at(level+1)));
  for(const child of children){const rest=grow(child,level+1);if(rest)return{[level]:node,...rest};}return null;
 }
 const pool=shuffled(roots.get(n),random).sort((a,b)=>compare(a,b,at(n))||Number(recent.includes(a.family))-Number(recent.includes(b.family)));
 for(const node of pool){const chain=grow(node,n);if(chain){const turns=Math.floor(random()*4),out={};for(const[level,p]of Object.entries(chain))out[level]={family:p.family,complexity:p.complexity,band:p.band,cells:rotateCells(cellsFromMask(p.mask),turns)};return out;}}
 throw Error('No unique repair growth chain');
}
