import React from 'react';
import {createReadinessTracker,createStateSnapshot,readRows} from './task-state.mjs';
import {createTaskAttentionMonitor} from './task-attention.mjs';
import {createGameRuntime} from './runtime/session-runtime.mjs';
import {GAME_CATALOG} from './games.mjs';
import {SHARED_COPY} from './runtime/game-catalog.mjs';
import {createRefreshStore} from './runtime/refresh-store.mjs';
import {GameIcon,GameSettings,PixelPopup,SETTINGS_FIELDS} from './host-ui.mjs';

export const inject=['slots','sessions','uiSession','connection','remote','shortcuts','configForms'];
const h=React.createElement,PACKAGE='dsh-braingames';
const hostUiCss=__BRAINGAMES_HOST_UI_CSS__;

export function apply(ctx){
  let container=null,unloaded=false,resolveHost;
  const hostReady=new Promise(resolve=>{resolveHost=resolve;});
  let revision=0,openError='',guardDispose=null,guardSequence=0,guardUpdating=false,guardSignature='',guardBindings=[];
  let guardState={foreground:false,heldCodes:[],ownedKeys:[]},errors=[];
  const listeners=new Set(),readiness=createReadinessTracker(),attention=createTaskAttentionMonitor();
  const resourceAbort=new AbortController(),preferences=ctx.configForms.get('braingames');
  let hasRunning=false,preferencesReady=false,preferenceSignature='',saving=false,settingsError='',returnFocus=null;
  let currentSessionId=null,refreshStore=null,bootSettled=false,bootError='',resumeError=false,bootstrapJob=null,viewportFailure=null;
  const canFit=game=>!container||(
    container.clientWidth>=game.minimumSize.width&&container.clientHeight>=game.minimumSize.height);
  const bindingKey=b=>JSON.stringify([b.code,[...b.modifiers].sort(),b.secondCode??null]);
  const isForeground=()=>runtime.status().mode==='foreground';
  function snapshot(source){
    const list=ctx.sessions.list.getSnapshot(),status=ctx.uiSession.sessionStatus.getSnapshot();
    const connection=ctx.connection.state.getSnapshot(),generation=ctx.connection.generation.getSnapshot()?.id;
    return createStateSnapshot({observedAt:Date.now(),readiness:readiness(connection,generation,list.phase,source),generation,
      rows:readRows(ctx,list,status),catalogIds:[...list.ids],errors});
  }
  function refresh(){revision++;for(const listener of listeners)listener();}
  function changed(source){
    if(unloaded)return;
    const list=ctx.sessions.list.getSnapshot(),status=ctx.uiSession.sessionStatus.getSnapshot();
    const state=ctx.connection.state.getSnapshot(),generation=ctx.connection.generation.getSnapshot()?.id;
    const rows=new Map(Object.entries(list.byId??{}));
    for(const [id,value]of status)rows.set(id,{...rows.get(id),...value});
    const ready=state==='connected'&&list.phase==='ready'&&generation!==undefined;
    const running=[...rows.values()].some(row=>row.running===true);
    const pending=[...status.values()].some(row=>!!row.pendingInteraction);
    if(hasRunning!==running){hasRunning=running;refresh();}
    const unread=[...status.values()].some(row=>row.completionUnread===true);
    runtime.observe({running,ready:ready&&preferencesReady&&bootSettled&&!bootError,attention:pending,unread}).catch(report);
    if(isForeground()||runtime.status().loading&&runtime.status().presentation==='active'){
      const s=snapshot(source),signal=attention.observe(s,s.readiness.generation);
      if(signal)runtime.background(signal.reason);
    }
  }
  function report(error){if(unloaded)return;console.error(error);openError=error.message;refresh();}
  const store={getSnapshot:()=>revision,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  function releaseGuard(){
    guardState={foreground:false,heldCodes:[],ownedKeys:[]};guardBindings=[];guardSignature='';
    const dispose=guardDispose;guardDispose=null;dispose?.();
  }
  function reconcileGuard(){
    if(guardUpdating||unloaded)return;
    const catalog=ctx.shortcuts.catalog.getSnapshot();
    if(!Array.isArray(catalog))throw Error('DSH快捷键目录尚未准备好');
    const held=new Set(guardState.heldCodes);
    const owns=b=>b.modifiers.length===0&&guardState.ownedKeys.some(key=>key===b.code||key===b.secondCode)||guardState.ownedKeys.includes('Tab')&&b.code==='Tab'&&b.modifiers.length===1&&b.modifiers[0]==='shift';
    const bindings=[...new Map(catalog.filter(row=>row.binding&&row.issue===null&&
      (guardState.foreground&&owns(row.binding)||row.binding.modifiers.length===0&&(held.has(row.binding.code)||held.has(row.binding.secondCode)))).map(row=>[bindingKey(row.binding),row.binding])).values()]
      .sort((a,b)=>bindingKey(a).localeCompare(bindingKey(b)));
    const signature=JSON.stringify(bindings.map(bindingKey));
    if(signature===guardSignature)return;
    guardUpdating=true;
    try{
      const old=guardDispose;
      const next=bindings.length?ctx.shortcuts.registerFixed({id:'braingames.input.'+(++guardSequence),label:()=> 'BrainGames input',
        bindings:bindings.map(b=>({...b,modifiers:[...b.modifiers]})),keys:[],group:'BrainGames'}):null;
      guardDispose=next;guardBindings=bindings;guardSignature=signature;old?.();
    }finally{guardUpdating=false;}
  }
  function setGuard(state){guardState=state;reconcileGuard();}
  for(const [name,source]of [['list',ctx.sessions.list],['status',ctx.uiSession.sessionStatus],['connection',ctx.connection.state],['generation',ctx.connection.generation]]){
    ctx.effect(()=>source.subscribe(()=>changed(name)),'BrainGames task state '+name);
  }
  ctx.effect(()=>ctx.remote.$on('api-session/error',id=>{errors.push({id,at:Date.now()});errors=errors.slice(-64);changed('task-error');}),'BrainGames task errors');
  for(const source of[ctx.shortcuts.catalog,ctx.shortcuts.config])ctx.effect(()=>source.subscribe(()=>{reconcileGuard();refresh();}),'BrainGames input bindings');
  let dismissErrors=false;
  const run=action=>{openError='';viewportFailure=null;dismissErrors=false;refresh();void action().catch(report);};
  const button={font:'inherit',fontSize:13,padding:'5px 10px',border:'1px solid color-mix(in srgb,currentColor 22%,transparent)',borderRadius:6,background:'transparent',color:'inherit',cursor:'pointer'};
  const pixelLabel=text=>h('span',{'data-pixel-text':true},text);
  function TaskEntry({sessionId}={}){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    React.useEffect(()=>{
      const id=sessionId??null;
      if(id!==currentSessionId&&runtime.status().selecting)runtime.background('task-changed');
      currentSessionId=id;
      return()=>{
        if(currentSessionId!==id)return;
        if(runtime.status().selecting)runtime.background('task-changed');
        currentSessionId=null;
      };
    },[sessionId]);
    const s=api.status(),active=s.resident?GAME_CATALOG.find(game=>game.id===s.gameId):null;
    const canChoose=s.ready&&!s.loading&&!['playing','paused'].includes(s.view)&&s.enabledGameIds.length>1;
    const label=s.selecting?SHARED_COPY.selecting:s.loading||!s.ready&&!bootError?SHARED_COPY.loading:s.hasRound?SHARED_COPY.headerContinue:SHARED_COPY.headerStart;
    const choices=GAME_CATALOG.filter(game=>s.enabledGameIds.includes(game.id)&&canFit(game));
    return h('div',{'data-braingames-task-entry':true,style:{position:'relative',display:'flex',alignItems:'center'}},
      s.mode==='foreground'?h('span',{'data-braingames-active':true,style:{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',fontSize:13,opacity:.65}},h(GameIcon,{icon:active?.icon}),SHARED_COPY.headerPlaying):h('button',{'data-braingames-entry':true,type:'button',style:{...button,display:'flex',alignItems:'center',gap:6},
        disabled:s.loading||!s.ready&&!bootError||s.ready&&!s.canStart&&!s.hasRound,
        title:!s.canStart&&!s.hasRound?SHARED_COPY.noGames:active?.name??SHARED_COPY.appLabel,
        onClick:()=>{if(bootError){dismissErrors=false;refresh();}else run(()=>api.open());}},h(GameIcon,{icon:active?.icon}),label),
      canChoose&&choices.length?h('select',{'data-braingames-select':true,'aria-label':SHARED_COPY.selectGame,value:'',style:{...button,marginLeft:4,maxWidth:118},
        onChange:event=>{const gameId=event.target.value;if(gameId)run(()=>api.open({gameId}));}},
        h('option',{value:''},SHARED_COPY.selectGame),
        ...choices.map(game=>h('option',{key:game.id,value:game.id},game.name))):null,
      s.presentation==='waiting'?h(PixelPopup,{'data-braingames-invitation':true,'aria-label':'BrainGames 邀请'},
        h('p',{className:'braingames-popup-message'},h(GameIcon),pixelLabel(hasRunning?SHARED_COPY.invite:SHARED_COPY.inviteIdle)),
        h('div',{className:'braingames-popup-actions'},
          h('button',{'data-braingames-accept':true,type:'button',onClick:()=>run(()=>api.open())},pixelLabel(SHARED_COPY.inviteAccept)),
          h('button',{'data-braingames-dismiss':true,type:'button',onClick:()=>runtime.dismissInvitation()},pixelLabel(SHARED_COPY.inviteDismiss)))):null);
  }
  async function savePreference(field,value){
    saving=true;settingsError='';refresh();
    try{if(!await preferences.set(field,value))throw Error('设置未保存，请重新操作。');}
    catch(error){settingsError=error.message;}
    finally{saving=false;refresh();}
  }
  function Settings(){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    return h(GameSettings,{catalog:GAME_CATALOG,state:preferences.getSnapshot(),saving,error:settingsError,onChange:savePreference});
  }
  function StageHost(){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    const ref=React.useRef(null);
    React.useEffect(()=>{
      container=ref.current;resolveHost(container);
      const observer=new ResizeObserver(()=>{
        if(viewportFailure?.fromResize&&canFit(viewportFailure.game))viewportFailure=null;
        if(!viewportFailure&&isForeground()){
          const game=GAME_CATALOG.find(item=>item.id===runtime.status().gameId);
          if(game&&!canFit(game))viewportFailure={game,fromResize:true};
        }
        runtime.refreshAvailability();
        refresh();
      });
      observer.observe(container);
      return()=>{observer.disconnect();container=null;};
    },[]);
    const s=runtime.status(),error=bootError||openError||s.error;
    const displayError=bootError?SHARED_COPY.bootError:s.selectionFailed?error:SHARED_COPY.loadedError;
    const requirement=viewportFailure?.game.minimumSize;
    const retryGameId=viewportFailure?.game.id;
    const retryFit=viewportFailure&&canFit(viewportFailure.game);
    const fitChoices=viewportFailure&&!['playing','paused'].includes(s.view)?GAME_CATALOG.filter(game=>game.id!==retryGameId&&s.enabledGameIds.includes(game.id)&&canFit(game)):[];
    return h('div',{'data-braingames-overlay':true,style:{position:'absolute',inset:0,pointerEvents:'none',zIndex:9500}},
      h('style',null,hostUiCss),h('div',{ref,style:{position:'absolute',inset:0}}),
      viewportFailure?h(PixelPopup,{'data-braingames-error':true,'data-braingames-viewport':true,role:'alert'},
        h('p',{className:'braingames-popup-detail'},SHARED_COPY.viewportError.replace('{width}',requirement.width).replace('{height}',requirement.height)),
        h('div',{className:'braingames-popup-actions'},
          retryFit?h('button',{'data-braingames-action':true,type:'button',onClick:()=>run(()=>api.open(s.gameId===retryGameId&&s.hasRound?undefined:{gameId:retryGameId}))},pixelLabel(SHARED_COPY.retry)):null,
          ...fitChoices.map(game=>h('button',{key:game.id,'data-braingames-action':true,type:'button',onClick:()=>run(()=>api.open({gameId:game.id}))},game.name)),
          h('button',{'data-braingames-action':true,type:'button',onClick:()=>{viewportFailure=null;refresh();}},pixelLabel(SHARED_COPY.inviteDismiss)))):
      error&&!dismissErrors?h(PixelPopup,{'data-braingames-error':true,role:'alert'},
        s.selectionFailed?h('p',{className:'braingames-popup-message'},pixelLabel(SHARED_COPY.chooseError)):null,
        h('p',{className:'braingames-popup-detail'},displayError),
        h('div',{className:'braingames-popup-actions'},
          h('button',{'data-braingames-action':true,type:'button',onClick:()=>run(()=>bootError?(resumeError?api.discardSavedRound():api.retryBoot()):api.retrySelection())},
            pixelLabel(bootError?(resumeError?SHARED_COPY.discardSavedRound:SHARED_COPY.retry):s.selectionFailed?SHARED_COPY.chooseRetry:SHARED_COPY.reload)),
          !bootError&&s.selectionFailed?h('button',{'data-braingames-action':true,type:'button',onClick:()=>run(()=>api.retrySelection({random:true}))},pixelLabel(SHARED_COPY.chooseRandom)):null,
          h('button',{'data-braingames-action':true,type:'button',onClick:()=>{dismissErrors=true;refresh();}},pixelLabel(SHARED_COPY.inviteDismiss)))):null);
  }
  const runtime=createGameRuntime({games:GAME_CATALOG,canFit,enabledGameIds:[],autoInvite:false,onChange:refresh,onInputGuardChange:setGuard,
    async chooseGame(candidates,{signal}){
      const response=await fetch(new URL('api/braingames/recommend',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:currentSessionId,gameIds:candidates.map(game=>game.id)}),signal});
      const result=await response.json();if(!response.ok)throw Error(result.error.message);return result.gameId;
    },
    async loadStage(game,callbacks){
      const host=container??await hostReady;if(unloaded)return null;
      const mod=await require.async(game.chunk);if(unloaded)return null;
      return mod.mountBundledStage(host,{...callbacks,getReturnFocus:()=>returnFocus,onModeChange(mode,reason){
        if(mode==='foreground'){openError='';viewportFailure=null;const baseline=snapshot('activation-baseline');attention.observe(baseline,baseline.readiness.generation);}
        callbacks.onModeChange(mode,reason);
      },loadResource:async name=>{
        const url=new URL('api/braingames/resource',document.baseURI);url.searchParams.set('name',name);
        const response=await fetch(url,{signal:resourceAbort.signal});
        if(!response.ok)throw Error('角色资源加载失败 ('+response.status+')');
        return{type:response.headers.get('Content-Type'),bytes:new Uint8Array(await response.arrayBuffer())};
      }});
    }
  });
  async function bootstrap(){
    bootSettled=false;bootError='';resumeError=false;refresh();
    const deadline=AbortSignal.any([resourceAbort.signal,AbortSignal.timeout(10000)]);
    if(!preferencesReady){
      void ctx.configForms.describe().ensure();
      await new Promise((resolve,reject)=>{
        const finished=()=>{stop();deadline.removeEventListener('abort',aborted);};
        const aborted=()=>{finished();reject(deadline.reason);};
        const check=()=>{
          const state=preferences.getSnapshot().status;
          if(state==='loading')return;
          finished();
          if(state==='ready')resolve();else reject(Error('dsh-braingames 设置不可用。'));
        };
        const stop=preferences.subscribe(check);
        deadline.addEventListener('abort',aborted,{once:true});
        check();
      });
    }
    const response=await fetch(new URL('api/braingames/runtime',document.baseURI),{signal:deadline});
    if(!response.ok)throw Error('游戏运行信息读取失败 ('+response.status+')');
    const {runtimeId}=await response.json();
    refreshStore=createRefreshStore({storage:window.sessionStorage,runtimeId,navigationType:performance.getEntriesByType('navigation')[0]?.type});
    if(preferences.getSnapshot().value.keepOnRefresh){
      try{const saved=refreshStore.read();if(saved)await runtime.restore(saved);}
      catch(error){resumeError=true;throw error;}
    }else refreshStore.clear();
    bootSettled=true;changed('bootstrap');refresh();
  }
  function startBootstrap(){
    if(bootstrapJob)return bootstrapJob;
    bootstrapJob=bootstrap().then(()=>true,error=>{
      if(!unloaded){console.error(error);bootError=error.message;bootSettled=true;refresh();}
      return false;
    }).finally(()=>{bootstrapJob=null;});
    return bootstrapJob;
  }
  const api={
    status(){return{installed:!unloaded,version:__BRAINGAMES_VERSION__,preferencesReady,ready:preferencesReady&&bootSettled&&!bootError,...runtime.status()};},
    diagnostics(){return{...api.status(),taskState:snapshot(),inputGuard:{foreground:guardState.foreground,reserved:guardBindings.length,heldCodes:guardState.heldCodes},stage:runtime.diagnostics().stage,preferences:{status:preferences.getSnapshot().status,value:preferences.getSnapshot().value,writable:preferences.getSnapshot().writable,saving,error:settingsError},error:bootError||openError,restoreFailed:resumeError};},
    async open(options){
      if(!await api.ready)throw Error(bootError||'dsh-braingames 设置尚未就绪');
      const baseline=snapshot('activation-baseline');attention.observe(baseline,baseline.readiness.generation);
      const result=await runtime.open(options);
      if(result.reason==='viewport'){
        const game=GAME_CATALOG.find(item=>item.id===result.gameId);
        viewportFailure={game,fromResize:false};refresh();
      }
      return result;
    },
    retrySelection(options){return runtime.status().view==='finished'?runtime.random(options):api.open(options);},
    retryBoot(){api.ready=startBootstrap();return api.ready;},
    async discardSavedRound(){refreshStore.clear();runtime.abandonRestore();resumeError=false;bootError='';bootSettled=true;api.ready=Promise.resolve(true);return api.open();},
    background:reason=>runtime.background(reason),random:options=>runtime.random(options)
  };
  ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'braingames.overlay'},StageHost));
  ctx.slots.inject('conversation.session.header.utilities',()=>ctx.slots.register({name:'conversation.session.header.utilities',id:'braingames.runtime',order:-20},TaskEntry));
  ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:PACKAGE},Settings));
  ctx.effect(()=>{
    const cancel=reason=>{const s=runtime.status();if(s.loading&&s.presentation==='active')runtime.background(reason);};
    const pointer=event=>{
      const path=event.composedPath();
      if(path.some(node=>node?.dataset?.braingamesTaskEntry!==undefined)&&!isForeground()){
        const focused=document.activeElement;if(focused instanceof HTMLElement&&!focused.closest('[data-braingames-task-entry]'))returnFocus=focused;
      }
      if(!path.some(node=>node?.dataset?.braingamesTaskEntry!==undefined||node?.dataset?.braingamesAction!==undefined))cancel('task-pointer');
    },blur=()=>cancel('window-blur'),hidden=()=>{if(document.hidden)cancel('hidden');};
    const pagehide=()=>{
      const round=runtime.checkpoint();
      if(!bootSettled||!refreshStore||resumeError)return;
      if(preferences.getSnapshot().value.keepOnRefresh)refreshStore.save(round);else refreshStore.clear();
    };
    window.addEventListener('pointerdown',pointer,{capture:true});window.addEventListener('blur',blur);window.addEventListener('pagehide',pagehide);document.addEventListener('visibilitychange',hidden);
    return()=>{window.removeEventListener('pointerdown',pointer,{capture:true});window.removeEventListener('blur',blur);window.removeEventListener('pagehide',pagehide);document.removeEventListener('visibilitychange',hidden);};
  },'BrainGames pending activation and refresh');
  function syncPreferences(){
    const state=preferences.getSnapshot();
    preferencesReady=state.status==='ready';
    if(preferencesReady){
      if(bootSettled&&bootError&&refreshStore===null)api.ready=startBootstrap();
      const signature=JSON.stringify(state.value);
      if(signature!==preferenceSignature){preferenceSignature=signature;const value=state.value;runtime.configure({enabledGameIds:value.enabledGames,...Object.fromEntries(SETTINGS_FIELDS.filter(field=>field!=='modelRecommendation').map(field=>[field,value[field]])),recommendByTask:value.modelRecommendation===true});if(!value.keepOnRefresh)refreshStore?.clear();}
    }
    changed('preferences');refresh();
  }
  ctx.effect(()=>preferences.subscribe(syncPreferences),'BrainGames preferences');
  window.brainGames=api;syncPreferences();api.ready=startBootstrap();
  ctx.effect(()=>async()=>{
    unloaded=true;resolveHost(null);resourceAbort.abort();await runtime.dispose();releaseGuard();
    if(window.brainGames===api)delete window.brainGames;
  },'BrainGames unload');
}
