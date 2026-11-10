import React from 'react';
import {createReadinessTracker,createStateSnapshot,readRows} from './task-state.mjs';
import {createTaskAttentionMonitor} from './task-attention.mjs';
import {createGameRuntime} from './runtime/session-runtime.mjs';
import {GAME_CATALOG} from './games.mjs';
import {SHARED_COPY} from './runtime/game-catalog.mjs';
import {gameIconUrl} from './runtime/game-icons.mjs';
import {createRefreshStore} from './runtime/refresh-store.mjs';

export const inject=['slots','sessions','uiSession','connection','remote','shortcuts','configForms'];
const h=React.createElement,PACKAGE='dsh-braingames';

export function apply(ctx){
  let container=null,unloaded=false,resolveHost;
  const hostReady=new Promise(resolve=>{resolveHost=resolve;});
  let revision=0,openError='',guardDispose=null,guardSequence=0,guardUpdating=false,guardSignature='',guardBindings=[];
  let guardState={foreground:false,heldCodes:[],ownedKeys:[]},errors=[];
  const listeners=new Set(),readiness=createReadinessTracker(),attention=createTaskAttentionMonitor();
  const resourceAbort=new AbortController(),preferences=ctx.configForms.get('braingames');
  let hasRunning=false,preferencesReady=false,preferenceSignature='',saving=false,settingsError='',returnFocus=null;
  let currentSessionId=null,refreshStore=null,bootSettled=false,bootError='',resumeError=false,resolvePreferences;
  const preferencesLoaded=new Promise(resolve=>{resolvePreferences=resolve;});
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
  function report(error){if(unloaded)return;openError=error.message;refresh();}
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
    const owns=b=>b.modifiers.length===0&&guardState.ownedKeys.some(key=>key===b.code||key===b.secondCode)||b.code==='Tab'&&b.modifiers.length===1&&b.modifiers[0]==='shift';
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
  const run=action=>{openError='';void action().catch(report);};
  const button={font:'inherit',fontSize:13,padding:'5px 10px',border:'1px solid color-mix(in srgb,currentColor 22%,transparent)',borderRadius:6,background:'transparent',color:'inherit',cursor:'pointer'};
  function GameIcon({icon='brain'}={}){return h('img',{width:20,height:20,src:gameIconUrl(icon),alt:'','aria-hidden':true,style:{imageRendering:'pixelated',flexShrink:0}});}
  function TaskEntry({sessionId}={}){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    React.useEffect(()=>{currentSessionId=sessionId??null;return()=>{if(currentSessionId===sessionId)currentSessionId=null;};},[sessionId]);
    const s=api.status(),active=s.resident?GAME_CATALOG.find(game=>game.id===s.gameId):null;
    const label=s.selecting?SHARED_COPY.selecting:s.loading?'正在准备':s.hasRound?SHARED_COPY.headerContinue:SHARED_COPY.headerStart;
    return h('div',{'data-braingames-task-entry':true,style:{position:'relative',display:'flex',alignItems:'center'}},
      s.mode==='foreground'?h('span',{'data-braingames-active':true,style:{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',fontSize:13,opacity:.65}},h(GameIcon,{icon:active?.icon}),SHARED_COPY.headerPlaying):h('button',{'data-braingames-entry':true,type:'button',style:{...button,display:'flex',alignItems:'center',gap:6},
        disabled:s.loading||!s.ready||!s.canStart&&!s.hasRound,
        title:!s.canStart&&!s.hasRound?'请在插件设置中勾选游戏':active?.name??SHARED_COPY.appLabel,
        onClick:()=>run(()=>api.open())},h(GameIcon,{icon:active?.icon}),label),
      s.presentation==='waiting'?h('aside',{'data-braingames-invitation':true,'aria-label':'BrainGames 邀请',style:{position:'absolute',top:'calc(100% + 8px)',right:0,width:248,padding:14,border:'1px solid #c5aa75',borderRadius:6,background:'Canvas',color:'CanvasText',boxShadow:'0 4px 14px #0002',zIndex:9600}},
        h('p',{style:{margin:'0 0 12px',fontSize:14}},hasRunning?SHARED_COPY.invite:'歇一小会儿，来一局？'),
        h('div',{style:{display:'flex',gap:8}},h('button',{'data-braingames-accept':true,type:'button',style:button,onClick:()=>run(()=>api.open())},SHARED_COPY.inviteAccept),
          h('button',{'data-braingames-dismiss':true,type:'button',style:button,onClick:()=>runtime.dismissInvitation()},SHARED_COPY.inviteDismiss))):null);
  }
  async function savePreference(field,value){
    saving=true;settingsError='';refresh();
    try{if(!await preferences.set(field,value))throw Error('设置未保存，请重新操作。');}
    catch(error){settingsError=error.message;}
    finally{saving=false;refresh();}
  }
  const switches=[
    ['autoInvite','自动弹出游戏邀请','关闭后仍可从任务标题栏打开游戏。'],
    ['inviteRequireRunning','只有任务正在运行时才邀请','仅限制自动邀请；不限制手动打开。'],
    ['inviteRequireNoUnread','有未读的任务完成提醒时不邀请','使用 DSH 当前客户端的任务完成提醒。'],
    ['keepVisibleOnPause','操作 DSH 时保留凝滞的游戏画面','游戏不计时、不接收操作；点鲸鱼娘继续。关闭后收起舞台，从标题栏继续。'],
    ['keepOnRefresh','刷新页面后保留本局','只保留到当前 DSH 运行结束；重启后重新开始。'],
    ['recommendByTask','用默认模型根据当前任务选择游戏','新开一局或换游戏时调用一次 DSH 默认模型；读取当前任务最近六条用户文字，最多四千字。关闭后随机选择，续局不调用。']
  ];
  function Settings(){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    const state=preferences.getSnapshot(),value=state.value;
    if(state.status!=='ready')return h('p',{role:'status'},state.status==='loading'?'设置加载中…':'BrainGames 设置不可用。');
    return h('section',{'data-braingames-settings':true,style:{maxWidth:560,lineHeight:1.7}},
      h('h3',{style:{fontSize:16,margin:'0 0 16px'}},'游戏设置'),
      h('fieldset',{disabled:!state.writable||saving,style:{border:0,padding:0,margin:0}},
        h('legend',{style:{padding:0,marginBottom:10}},'允许开始的游戏'),
        ...GAME_CATALOG.map(game=>h('label',{key:game.id,style:{display:'flex',alignItems:'center',gap:10,marginBottom:10}},
          h('input',{type:'checkbox','data-braingames-game':game.id,checked:value.enabledGames.includes(game.id),onChange:event=>{
            const ids=event.target.checked?[...value.enabledGames,game.id]:value.enabledGames.filter(id=>id!==game.id);
            void savePreference('enabledGames',ids);
          }}),h(GameIcon,{icon:game.icon}),game.name)),
        h('p',{style:{fontSize:12,opacity:.7,margin:'8px 0 22px'}},'至少勾选两款，结算后才能“换个玩”。不勾选时不再开新局；已经开始的一局可以继续。'),
        ...switches.map(([field,label,description])=>h('div',{key:field,style:{marginBottom:18}},
          h('label',{style:{display:'flex',alignItems:'center',gap:10}},h('input',{type:'checkbox','data-braingames-setting':field,...(field==='autoInvite'?{'data-braingames-auto-invite':true}:{}),checked:value[field],onChange:event=>{void savePreference(field,event.target.checked);}}),label),
          h('p',{style:{fontSize:12,opacity:.7,margin:'4px 0 0 24px'}},description)))),
      saving?h('p',{role:'status'},'保存中…'):null,
      !state.writable?h('p',{role:'status'},'当前设置为只读。'):null,
      settingsError?h('p',{role:'alert',style:{color:'#b33'}},settingsError):null);
  }
  function StageHost(){
    React.useSyncExternalStore(store.subscribe,store.getSnapshot);
    const ref=React.useRef(null);
    React.useEffect(()=>{container=ref.current;resolveHost(container);return()=>{container=null;};},[]);
    const s=runtime.status(),error=bootError||openError||s.error;
    return h('div',{'data-braingames-overlay':true,style:{position:'absolute',inset:0,pointerEvents:'none',zIndex:9500}},h('div',{ref,style:{position:'absolute',inset:0}}),error?h('aside',{'data-braingames-error':true,role:'alert',style:{position:'absolute',right:24,top:24,maxWidth:320,padding:16,background:'#f6f0dd',color:'#764b45',pointerEvents:'auto',border:'2px solid #9c8060',fontSize:13}},
      s.selectionFailed?h('p',{style:{margin:'0 0 8px'}},SHARED_COPY.chooseError):null,
      h('p',{style:{margin:'0 0 12px'}},error),
      h('div',{style:{display:'flex',gap:8}},
        h('button',{'data-braingames-action':true,type:'button',style:button,onClick:()=>run(()=>bootError?resumeError?api.discardSavedRound():api.retryBoot():api.retrySelection())},bootError?resumeError?'放弃存档，重新开始':'重试':s.selectionFailed?SHARED_COPY.chooseRetry:SHARED_COPY.reload),
        !bootError&&s.selectionFailed?h('button',{'data-braingames-action':true,type:'button',style:button,onClick:()=>run(()=>api.retrySelection({random:true}))},SHARED_COPY.chooseRandom):null)) :null);
  }
  const runtime=createGameRuntime({games:GAME_CATALOG,enabledGameIds:[],autoInvite:false,onChange:refresh,onInputGuardChange:setGuard,
    async chooseGame(candidates,{signal}){
      const response=await fetch(new URL('api/braingames/recommend',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:currentSessionId,gameIds:candidates.map(game=>game.id)}),signal});
      const result=await response.json();if(!response.ok)throw Error(result.error.message);return result.gameId;
    },
    async loadStage(game,callbacks){
      const host=container??await hostReady;if(unloaded)return null;
      const mod=await require.async(game.chunk);if(unloaded)return null;
      return mod.mountBundledStage(host,{...callbacks,getReturnFocus:()=>returnFocus,onModeChange(mode,reason){
        if(mode==='foreground'){openError='';const baseline=snapshot('activation-baseline');attention.observe(baseline,baseline.readiness.generation);}
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
    bootSettled=false;bootError='';resumeError=false;refresh();await preferencesLoaded;
    const response=await fetch(new URL('api/braingames/runtime',document.baseURI),{signal:resourceAbort.signal});
    if(!response.ok)throw Error('游戏运行信息读取失败 ('+response.status+')');
    const {runtimeId}=await response.json();
    refreshStore=createRefreshStore({storage:window.sessionStorage,runtimeId,navigationType:performance.getEntriesByType('navigation')[0]?.type});
    if(preferences.getSnapshot().value.keepOnRefresh){
      try{const saved=refreshStore.read();if(saved)await runtime.restore(saved);}
      catch(error){resumeError=true;throw error;}
    }else refreshStore.clear();
    bootSettled=true;changed('bootstrap');refresh();
  }
  function startBootstrap(){return bootstrap().then(()=>true,error=>{if(!unloaded){bootError=error.message;bootSettled=true;refresh();}return false;});}
  const api={
    status(){return{installed:!unloaded,version:__BRAINGAMES_VERSION__,preferencesReady,ready:preferencesReady&&bootSettled&&!bootError,...runtime.status()};},
    diagnostics(){return{...api.status(),taskState:snapshot(),inputGuard:{foreground:guardState.foreground,reserved:guardBindings.length,heldCodes:guardState.heldCodes},stage:runtime.diagnostics().stage,preferences:{status:preferences.getSnapshot().status,value:preferences.getSnapshot().value,writable:preferences.getSnapshot().writable,saving,error:settingsError},error:bootError||openError,restoreFailed:resumeError};},
    async open(options){if(!await api.ready)throw Error(bootError||'BrainGames 设置尚未就绪');const baseline=snapshot('activation-baseline');attention.observe(baseline,baseline.readiness.generation);return runtime.open(options);},
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
      resolvePreferences();const signature=JSON.stringify(state.value);
      if(signature!==preferenceSignature){preferenceSignature=signature;const value=state.value;runtime.configure({enabledGameIds:value.enabledGames,...Object.fromEntries(switches.map(([field])=>[field,value[field]]))});if(!value.keepOnRefresh)refreshStore?.clear();}
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
