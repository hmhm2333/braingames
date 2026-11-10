export const PLACEMENT_KEY='braingames.g04.stage-anchor.v1';
export function readPlacement(storage){
  const raw=storage.getItem(PLACEMENT_KEY);if(raw===null)return null;
  const value=JSON.parse(raw);
  if(!value||Array.isArray(value)||!['x','y'].every(key=>Number.isFinite(value[key])&&value[key]>=0&&value[key]<=1))throw Error('餐台位置记录无效');
  return{x:value.x,y:value.y};
}
export function savePlacement(storage,anchor,width,height){
  const value={x:anchor[0]/width,y:anchor[1]/height};storage.setItem(PLACEMENT_KEY,JSON.stringify(value));return value;
}
export function placementBounds(phase,viewport,dialogHeight=0){
  if(!['welcome','summary'].includes(phase))return{left:-131,right:261,top:-176,bottom:182};
  const left=viewport.panel.left-viewport.scene.whale[0],right=left+viewport.panel.width,lobbyX=right+viewport.companionWidth/2;
  const centre=viewport.height/2-viewport.scene.whale[1],bottom=centre+dialogHeight/2;
  return{left:Math.min(left,lobbyX-80),right:Math.max(right,lobbyX+80),top:Math.min(centre-dialogHeight/2,bottom-184),bottom};
}
export function clampAnchor(anchor,bounds,width,height){
  const axis=(value,min,max)=>Math.round(min>max?(min+max)/2:Math.max(min,Math.min(max,value)));
  return[axis(anchor[0],16-bounds.left,width-16-bounds.right),axis(anchor[1],16-bounds.top,height-16-bounds.bottom)];
}
