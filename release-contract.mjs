
// Runtime projections are explicit: artist provenance stays in the source tree.
export const GAME_ASSET_FIELDS={
  winds:['fps','end','dockFrame','pushFrame','landingFrame','smileFrame','layers','atlas'],
  fish:['fps','contactFrame','clips','atlas'],
  g04:['version','image','width','height','decodedBytes','frames','groups','clips','guests','mealImages','docks','counter'],
  g02:['image','width','height','clips','frames']
};
export function publicManifest(source,fields){
  return Object.fromEntries(fields.map(key=>{
    if(!Object.hasOwn(source,key))throw Error('Missing runtime asset field '+key);
    return [key,source[key]];
  }));
}
