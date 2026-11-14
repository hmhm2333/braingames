// One resident round across all host tasks. Host selection is injected.
export function createGameRuntime({games,loadStage,chooseGame,canFit=()=>true,onChange=()=>{},onInputGuardChange=()=>{},enabledGameIds=games.map(game=>game.id),autoInvite=true,recommendByTask=false,keepVisibleOnPause=false,inviteRequireRunning=true,inviteRequireNoUnread=true}){
  if(!games.length||new Set(games.map(game=>game.id)).size!==games.length)throw Error('Game IDs must be nonempty and unique');
  let current=games[0],stage=null,loading=null,closing=null,opening=null,reloading=null,changing=null,selection=null,restorePromise=null,restoreCheckpoint=null;
  let intent=0,disposed=false,disposePromise=null,roundChosen=false;
  let enabled=new Set(enabledGameIds),invitationEnabled=autoInvite,useRecommendation=recommendByTask,keepVisible=keepVisibleOnPause,requireRunning=inviteRequireRunning,requireNoUnread=inviteRequireNoUnread;
  let presentation='hidden',busy=false,eligible=false,invited=false,error='',selectionFailed=false;
  const notify=()=>onChange();
  const runState=()=>stage?.getRunState()??{view:null,hasRound:false};
  const playable=()=>games.filter(game=>enabled.has(game.id)&&canFit(game));
  const alternatives=(exclude=current.id)=>playable().filter(game=>game.id!==exclude);
  const randomGame=candidates=>{const value=new Uint32Array(1);crypto.getRandomValues(value);return candidates[value[0]%candidates.length];};
  function status(){return{gameId:current.id,presentation,mode:stage?.getMode()??'background',resident:stage!==null,loading:loading!==null||closing!==null||changing!==null||reloading!==null||selection!==null||restorePromise!==null,selecting:selection!==null,selectionFailed,error,
    ...runState(),canStart:enabled.size>0,canReplay:enabled.has(current.id),canRandom:alternatives().length>0,autoInvite:invitationEnabled,enabledGameIds:[...enabled],recommendByTask:useRecommendation,keepVisibleOnPause:keepVisible,inviteRequireRunning:requireRunning,inviteRequireNoUnread:requireNoUnread};}
  function availability(){stage?.setKeepVisible?.(keepVisible);stage?.setAvailability({canReplay:enabled.has(current.id),canRandom:alternatives().length>0});}
  function modeChanged(mode){if(disposed)return;presentation=mode==='foreground'?'active':stage?.isVisible()?'frozen':'hidden';notify();}
  function cancelIntent(){++intent;const previous=selection;selection=null;previous?.controller.abort();}
  function closeStage(){
    if(closing)return closing;
    if(!stage)return Promise.resolve();
    const previous=stage;stage=null;
    // The old renderer still owns the overlay until its disposal has finished.
    closing=Promise.resolve().then(()=>previous.dispose()).finally(()=>{closing=null;notify();});
    notify();return closing;
  }
  async function pick(candidates,forceRandom=false){
    if(!candidates.length)throw Error('请先勾选至少一款游戏');
    if(forceRandom||!useRecommendation||candidates.length===1)return randomGame(candidates);
    if(typeof chooseGame!=='function')throw Error('默认模型推荐尚未接入');
    const job={controller:new AbortController()};selection=job;notify();
    try{const id=await chooseGame(candidates,{signal:job.controller.signal});const game=candidates.find(game=>game.id===id);if(!game)throw Error('模型选择了游戏池以外的游戏');return game;}
    catch(failure){if(!job.controller.signal.aborted)selectionFailed=true;throw failure;}
    finally{if(selection===job)selection=null;notify();}
  }
  async function ensure(){
    if(stage)return stage;if(loading)return loading;
    const pending=(async()=>{
      const mounted=await loadStage(current,{onModeChange:modeChanged,onInputGuardChange,onGameChange:notify,onRandom:random,onReload:reload,keepVisibleOnPause:keepVisible,canRandom:alternatives().length>0,checkpoint:restoreCheckpoint});
      if(mounted===null&&disposed)return null;stage=mounted;
      if(!await mounted.ready)throw Error('BrainGames加载失败：'+mounted.getDiagnostics().initError);
      restoreCheckpoint=null;availability();return mounted;
    })();loading=pending;notify();
    try{return await pending;}catch(failure){error=failure.message;await closeStage();throw failure;}
    finally{if(loading===pending)loading=null;notify();}
  }
  async function present({start=false,random:forceRandom=false,gameId}={}){
    if(disposed)return{opened:false,reason:'unloaded'};
    const state=runState();
    const hasActiveRound=['playing','paused'].includes(state.view);
    if(!enabled.size&&!state.hasRound)return{opened:false,reason:'no-enabled-game'};
    const requested=gameId&&games.find(game=>game.id===gameId&&enabled.has(game.id));
    if(gameId&&!requested)return{opened:false,reason:'no-enabled-game'};
    if(requested&&requested!==current&&hasActiveRound)return{opened:false,reason:'round-in-progress'};
    const fits=canFit(current);
    const blocked=requested&&!canFit(requested)||!requested&&!fits&&(hasActiveRound||!playable().length);
    if(blocked)return{opened:false,reason:'viewport',gameId:requested?.id??current.id};
    const mustSwitch=requested?requested!==current:
      !state.hasRound&&(!enabled.has(current.id)||!fits)||state.view==='finished'&&!fits;
    const ticket=++intent;error='';selectionFailed=false;presentation='active';notify();
    try{
      if(stage&&mustSwitch){
        roundChosen=false;await closeStage();
      }
      else if(closing)await closing;
      if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};
      if(!stage&&!enabled.size){presentation='hidden';notify();return{opened:false,reason:'no-enabled-game'};}
      if(!stage&&!loading&&(requested||!roundChosen||!enabled.has(current.id)||!canFit(current))){
        const candidates=playable();
        if(!candidates.length){presentation='hidden';notify();return{opened:false,reason:'viewport',gameId:current.id};}
        const selected=requested??await pick(candidates,forceRandom);
        if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};
        current=selected;roundChosen=true;
      }
      const mounted=await ensure();
      if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};
      if(!enabled.has(current.id)&&!mounted.getRunState().hasRound){
        background('setting');return{opened:false,reason:'settings-changed'};
      }
      const activation=await mounted.foreground({start});
      if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};
      presentation=mounted.getMode()==='foreground'?'active':mounted.isVisible()?'frozen':'hidden';notify();return{opened:mounted.getMode()==='foreground',presentation,...(activation?.reason?{reason:activation.reason,gameId:current.id}:{})};
    }catch(failure){if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};error=failure.message;presentation='hidden';notify();throw failure;}
  }
  function background(reason='task-pointer'){
    cancelIntent();invited=true;
    const show=keepVisible&&['playing','paused'].includes(runState().view);
    stage?.background(reason,{restoreFocus:false,visible:show});presentation=show&&stage?.isVisible()?'frozen':'hidden';notify();return status();
  }
  function hide(reason='manual'){cancelIntent();invited=true;stage?.background(reason,{visible:false});presentation='hidden';notify();return status();}
  function dismissInvitation(){if(presentation==='waiting'){invited=true;presentation='hidden';notify();}}
  function observe({running,ready,attention=false,unread=false}){
    if(disposed)return Promise.resolve();
    if(!ready||attention){eligible=false;dismissInvitation();return Promise.resolve();}
    const ended=busy&&!running;busy=running;
    if(ended&&(presentation==='active'||stage?.getMode()==='foreground'))background('task-finished');
    const next=(!requireRunning||running)&&(!requireNoUnread||!unread);
    if(!next){eligible=false;invited=false;dismissInvitation();return Promise.resolve();}
    if(!eligible){eligible=true;invited=false;}
    if(invitationEnabled&&enabled.size&&!invited&&!stage&&!loading&&!closing&&!selection&&presentation==='hidden'){invited=true;presentation='waiting';notify();}
    return Promise.resolve();
  }
  function configure(next){
    const{enabledGameIds,autoInvite}=next;
    if(enabledGameIds.some(id=>!games.some(game=>game.id===id))||new Set(enabledGameIds).size!==enabledGameIds.length||typeof autoInvite!=='boolean')throw TypeError('Invalid BrainGames preferences');
    const selectionChanged=JSON.stringify([...enabled])!==JSON.stringify(enabledGameIds)||next.recommendByTask!==undefined&&useRecommendation!==next.recommendByTask;
    if(selection&&selectionChanged)background('setting');
    enabled=new Set(enabledGameIds);invitationEnabled=autoInvite;
    if(next.recommendByTask!==undefined)useRecommendation=next.recommendByTask;
    if(next.keepVisibleOnPause!==undefined){keepVisible=next.keepVisibleOnPause;if(!keepVisible&&presentation==='frozen')hide('setting');}
    if(next.inviteRequireRunning!==undefined&&requireRunning!==next.inviteRequireRunning){requireRunning=next.inviteRequireRunning;eligible=false;}
    if(next.inviteRequireNoUnread!==undefined&&requireNoUnread!==next.inviteRequireNoUnread){requireNoUnread=next.inviteRequireNoUnread;eligible=false;}
    if(!stage&&!loading&&enabled.size&&!enabled.has(current.id)){current=games.find(game=>enabled.has(game.id));roundChosen=false;}
    if(!invitationEnabled||!enabled.size)dismissInvitation();
    if((stage||loading)&&!enabled.has(current.id)&&!runState().hasRound)background('setting');
    availability();notify();
  }
  function random(){
    if(changing)return changing;
    if(stage?.getRunState().view!=='finished')return Promise.reject(Error('Finish the current round before changing games'));
    const previous=current.id;
    if(!alternatives(previous).length)return Promise.resolve({changed:false,reason:'no-other-enabled-game'});
    const ticket=++intent;error='';selectionFailed=false;notify();
    const pending=(async()=>{
      await closeStage();
      if(disposed)return{changed:false,reason:'superseded'};
      const others=alternatives(previous);
      if(!others.length){roundChosen=false;presentation='hidden';notify();return{changed:false,reason:'no-other-enabled-game'};}
      current=randomGame(others);roundChosen=true;
      if(disposed||ticket!==intent)return{changed:false,reason:'superseded'};
      return present({random:true});
    })();
    changing=pending.finally(()=>{changing=null;notify();});
    return changing;
  }
  function reload(){
    if(reloading)return reloading;if(stage?.getRunState().view!=='error')return Promise.reject(Error('Only a failed game instance can be reloaded'));
    const ticket=++intent;
    const pending=(async()=>{await closeStage();if(disposed||ticket!==intent)return{opened:false,reason:'superseded'};return present();})();
    reloading=pending.finally(()=>{reloading=null;notify();});notify();return reloading;
  }
  function checkpoint(){
    cancelIntent();if(!stage)return null;const wasVisible=stage.isVisible();stage.background('refresh',{restoreFocus:false,visible:false});presentation='hidden';
    const game=stage.checkpoint?.();return game?{gameId:current.id,game,wasVisible}:null;
  }
  function restore(saved){
    if(stage||loading||closing||restorePromise)throw Error('Cannot restore over a game instance');
    const game=games.find(game=>game.id===saved.gameId);if(!game||!saved.game)throw Error('保存的游戏不在当前游戏池中');
    current=game;roundChosen=true;restoreCheckpoint=saved.game;
    const pending=(async()=>{const mounted=await ensure();if(disposed)return;if(keepVisible&&saved.wasVisible)await mounted.freezeVisible('refresh');presentation=mounted.isVisible()?'frozen':'hidden';notify();})();
    restorePromise=pending;notify();return pending.finally(()=>{if(restorePromise===pending)restorePromise=null;notify();});
  }
  function abandonRestore(){if(stage||loading||closing||restorePromise)throw Error('Cannot discard an active game instance');restoreCheckpoint=null;roundChosen=false;error='';notify();}
  async function dispose(){
    if(disposePromise)return disposePromise;disposed=true;cancelIntent();presentation='hidden';
    disposePromise=(async()=>{try{if(loading)await loading;if(reloading)await reloading;if(changing)await changing;}finally{await closeStage();notify();}})();return disposePromise;
  }
  function open(options={}){
    if(restorePromise)return restorePromise.then(()=>open(options));if(reloading)return reloading;if(changing)return changing;
    if(opening&&presentation==='active'){
      if(options.gameId&&loading)return opening;
      if(!options.random&&!options.gameId)return opening;
    }
    if((options.random||options.gameId)&&selection)cancelIntent();
    const pending=present(options);opening=pending;return pending.finally(()=>{if(opening===pending)opening=null;});
  }
  return{status,open,observe,background,hide,dismissInvitation,configure,random,reload,checkpoint,restore,abandonRestore,dispose,refreshAvailability:availability,diagnostics:()=>({...status(),stage:stage?.getDiagnostics()??null})};
}
