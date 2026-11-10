// Task state can request a single trip to the background, never a permanent gate.
export function createTaskAttentionMonitor(){
  let health=null,generation=null,active=new Set();
  return{observe(snapshot,nextGeneration){
    const reason=snapshot.syncState!=='ready'?snapshot.syncState:snapshot.strictGlobalEligibility.unknowns.length?'unknown':null;
    if(reason){const next=JSON.stringify([nextGeneration,reason]),changed=health!==next;health=next;return changed?{reason}:null;}
    if(nextGeneration!==generation){generation=nextGeneration;active.clear();}
    health='ready';
    const items=snapshot.attention.filter(item=>['question','approval','error'].includes(item.kind));
    const key=item=>JSON.stringify([item.sessionId,item.kind,item.eventId]);
    const fresh=items.find(item=>!active.has(key(item)));active=new Set(items.map(key));
    return fresh?{reason:fresh.kind,sessionId:fresh.sessionId}:null;
  }};
}
