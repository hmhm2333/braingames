  function createReadinessTracker(){
    let initialized=false,generation,listRevision=0,requiredRevision=0;
    return (connection,nextGeneration,phase,source)=>{
      if(source==='list')listRevision++;
      if(!initialized){initialized=true;generation=nextGeneration;}
      else if(generation!==nextGeneration){generation=nextGeneration;requiredRevision=listRevision+1;}
      const baselineReady=phase==='ready'&&listRevision>=requiredRevision&&generation!==undefined;
      return {transport:connection,list:phase,generation,baselineReady,awaitingListAfterGeneration:listRevision<requiredRevision,
        syncState:connection!=='connected'?'disconnected':baselineReady?'ready':'unknown'};
    };
  }
  function createStateSnapshot(m){
    const rows=m.rows,idsWhere=f=>rows.filter(f).map(r=>r.id);
    const runningSessionIds=idsWhere(r=>r.running===true);
    const unreadSessionIds=idsWhere(r=>r.completionUnread===true);
    const nativeAttention=rows.filter(r=>r.pendingInteraction).map(r=>({sessionId:r.id,kind:r.pendingInteraction.kind,eventId:r.pendingInteraction.id,source:'official-ui-carrier'}));
    const durableAttention=rows.flatMap(r=>r.pendingQuestions.filter(q=>q.requiresAttention!==false).map(q=>({sessionId:r.id,kind:'question',eventId:q.callId,source:'durable-question-projection',state:q.state,answerability:q.requiresAttention===true?'pending':'unknown-until-inbox-baseline'})));
    const errorAttention=m.errors.map(e=>({sessionId:e.id,kind:'error',eventId:String(e.at),source:'plugin-observed-error'}));
    const attention=[...nativeAttention,...durableAttention.filter(q=>!nativeAttention.some(n=>n.sessionId===q.sessionId&&n.kind==='question')),...errorAttention];
    const missingNativeStatus=idsWhere(r=>!r.nativeStatusPresent);
    const missingQuestions=idsWhere(r=>!r.questionProjectionCoverage.complete);
    const uncertainRunning=idsWhere(r=>r.running===undefined);
    const knownChildIds=idsWhere(r=>r.scope==='known-child');
    const nativeBlockers=[...(unreadSessionIds.length?['completion-unread']:[]),...(nativeAttention.length?['ui-pending-interaction']:[])];
    const eligibility=(blockers,unknowns)=>({state:blockers.length?'blocked':m.readiness.syncState!=='ready'||unknowns.length?'unknown':runningSessionIds.length?'eligible':'ineligible',blockers,unknowns});
    const nativeUnknowns=[...(missingNativeStatus.length?['missing-official-session-status']:[]),...(uncertainRunning.length?['running-status-incomplete']:[])];
    const clientEligibility=eligibility(nativeBlockers,nativeUnknowns);
    const knownEligibility=eligibility([...nativeBlockers,...(durableAttention.some(q=>q.answerability==='pending')?['durable-question-active']:[]),...(errorAttention.length?['plugin-observed-error']:[])],[...nativeUnknowns,...(missingQuestions.length?['question-projection-coverage-incomplete']:[])]);
    // The product contract is this application's current generation and complete
    // published task directory/status union. Older/cross-device read history is
    // a semantic limitation, not a permanent denial of the current-app rule.
    const globalEligibility=knownEligibility;
    return {observedAt:m.observedAt,syncState:m.readiness.syncState,readiness:m.readiness,stageEntry:m.stageEntry,
      scope:'current DSH application / current generation / complete published directory and sessionStatus union including known children',
      runningSessionIds,unreadSessionIds,attention,
      coverage:{catalogIds:m.catalogIds,topLevelIds:idsWhere(r=>r.scope==='top-level'),knownChildIds,statusOnlyIds:idsWhere(r=>r.scope==='status-only'),
        nativeStatus:{state:missingNativeStatus.length?'partial':'complete-known-union',missingIds:missingNativeStatus},
        running:{unknownIds:uncertainRunning,unretainedChildIds:idsWhere(r=>r.scope==='known-child'&&!r.bound)},
        pendingQuestions:{state:missingQuestions.length?'partial':'complete-known-union',missingIds:missingQuestions,hostGlobal:'not-verified',validation:'projection normalization and restoration tested in isolated fixtures; live Host coverage not established by this adapter'},
        applicationDirectory:{state:m.readiness.syncState==='ready'&&globalEligibility.unknowns.length===0?'complete-published-union':'incomplete-or-not-ready',generation:m.generation,ids:rows.map(r=>r.id)},
        outsideCurrentApplicationContract:{allServerDescendants:'not-verified; no claim about descendants absent from the published application directory',historicalUnread:'not-requested; native client lifecycle semantics only'},
        unread:{source:'official uiSession.sessionStatus.completionUnread',semantics:'current-client completion reminders; not message-read or durable cross-client read state',reset:'new UiSession starts empty; reconnect cannot reconstruct missed completion transitions'}},
      currentClientEligibility:{contract:'official current-client UI states over complete known union',...clientEligibility},
      knownScopeEligibility:{contract:'known union plus available durable question projections and plugin error observations',...knownEligibility},
      strictGlobalEligibility:{contract:'current DSH application, current generation: full published task directory/status union including known children has no native completion reminders or pending attention',...globalEligibility},
      recommendationEligible:globalEligibility.state==='eligible',pendingQuestions:rows.flatMap(r=>r.pendingQuestions.map(q=>({sessionId:r.id,...q})))};
  }
  function readRows(ctx,list,status){
    const byId=list.byId||{},catalog=new Set(list.ids||[]);
    const ids=new Set([...catalog,...Object.keys(byId),...status.keys()]);
    return [...ids].map(id=>{
      const row=byId[id],s=status.get(id),binding=ctx.sessions.binding?.(id);
      const projected=list.projectionsBySession?.[id]?.values;
      const values={...projected,...row?.projectionValues};
      // A present binding is read only. Never obtain one by retain/openSession.
      const readProjection=key=>values[key]!==undefined?values[key]:binding?.session?.projections?.faceOf(key).getSnapshot();
      const questions=readProjection('userQuestions'),inbox=readProjection('inbox');
      const hasQuestions=Array.isArray(questions?.active),hasInbox=inbox!==undefined&&inbox!==null&&typeof inbox==='object';
      const queued=new Set();
      for(const message of [...inbox?.['next-step']??[],...inbox?.['next-turn']??[]]){
        if(message?.source?.kind==='user-question-reply'&&typeof message.source.callId==='string')queued.add(message.source.callId);
      }
      const scope=row?.parentId||row?.origin==='subagent'?'known-child':catalog.has(id)?'top-level':row?'known-directory':'status-only';
      const running=s?.running!==undefined?s.running:scope==='top-level'?row?.running:undefined;
      return {id,title:row?.title||row?.displayTitle,scope,parentId:row?.parentId,bound:!!binding,
        running,runningSource:s?.running!==undefined?'official-session-status':scope==='top-level'&&row?.running!==undefined?'directory-baseline':'unknown',directoryReportedRunning:row?.running,
        nativeStatusPresent:status.has(id),completionUnread:s?.completionUnread,
        pendingInteraction:s?.pendingInteraction?{kind:s.pendingInteraction.kind,id:s.pendingInteraction.key}:null,retainedBy:row?.retainedBy,
        questionProjectionCoverage:{questions:hasQuestions,inbox:hasInbox,complete:hasQuestions&&hasInbox},
        pendingQuestions:hasQuestions?questions.active.filter(q=>q.state==='open'||q.state==='continued').map(q=>({callId:q.callId,state:q.state,queuedReply:hasInbox?queued.has(q.callId):null,requiresAttention:q.state==='continued'?hasInbox?!queued.has(q.callId):null:true})):[]};
    });
  }

export {createReadinessTracker,createStateSnapshot,readRows};
