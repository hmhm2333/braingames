
// Transparent scene: only explicit game controls own mouse input.
export function createTransparentStage(container,options={}){
  if(!(container instanceof HTMLElement))throw TypeError('Stage container must be an HTMLElement');
  if(container.querySelector(':scope > [data-braingames-stage]'))throw Error('Stage is already mounted');
  const wrapper=document.createElement('div');wrapper.dataset.braingamesStage='';wrapper.tabIndex=-1;
  Object.assign(wrapper.style,{position:'absolute',inset:0,isolation:'isolate',overflow:'hidden',pointerEvents:'none',visibility:'hidden'});
  wrapper.inert=true;wrapper.setAttribute('aria-hidden','true');
  const shadow=wrapper.attachShadow({mode:'open'}),gameHost=document.createElement('div');
  Object.assign(gameHost.style,{position:'absolute',inset:0,pointerEvents:'none'});shadow.append(gameHost);container.append(wrapper);
  const listeners=[],heldKeys=new Set(),uncertainKeys=new Set(),heldPointers=new Set(),clickTails=new Set(),events=[],modifiers=new Set();
  const frozenTabStops=new Map();
  let shortcutYield=false;
  let visible=false,retainVisible=options.keepVisibleOnPause===true;
  const gameKeys=options.keys, suppressContextMenu=options.suppressContextMenu===true;
  let menuPointer=null;
  let foreground=false,disposed=false,disposing=false,activation=0,previousFocus=null,disposePromise=null,game;
  const keyId=e=>e.code||({' ':'Space',Escape:'Escape',Enter:'Enter',Tab:'Tab'}[e.key]??e.key);
  const inside=e=>e.composedPath().includes(wrapper);
  const on=(target,type,fn,opts)=>{target.addEventListener(type,fn,opts);listeners.push(()=>target.removeEventListener(type,fn,opts));};
  const record=(type,reason)=>{events.push({type,reason,at:Date.now()});if(events.length>64)events.shift();};
  const notifyGuard=()=>options.onInputGuardChange?.({foreground,heldCodes:[...heldKeys],ownedKeys:gameKeys});
  function show(){visible=true;wrapper.style.visibility='visible';wrapper.inert=false;wrapper.removeAttribute('aria-hidden');}
  function conceal(){visible=false;wrapper.style.visibility='hidden';wrapper.inert=true;wrapper.setAttribute('aria-hidden','true');}
  function freezeInputs(active){
    game.setFrozen?.(active);
    if(active){
      game.paintStatic?.();
      for(const node of game.getRoot().querySelectorAll('button,a[href],input,select,textarea,[tabindex]')){
        if(node.hasAttribute('data-game-resume')||frozenTabStops.has(node))continue;
        frozenTabStops.set(node,node.getAttribute('tabindex'));node.tabIndex=-1;
      }
    }else{
      for(const [node,value]of frozenTabStops)if(value===null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',value);
      frozenTabStops.clear();
    }
  }
  function background(reason='task-pointer',{restoreFocus=true,visible:keepVisible=retainVisible&&['playing','paused'].includes(game.getRunState().view)}={}){
    ++activation;const wasForeground=foreground;foreground=false;
    if(wasForeground||visible)game.suspend(reason);
    if(keepVisible&&visible){gameHost.dataset.presentation='frozen';freezeInputs(true);}
    else{freezeInputs(false);conceal();}
    notifyGuard();options.onModeChange?.('background',reason);record('background',reason);
    if(restoreFocus&&document.hasFocus()&&previousFocus?.isConnected&&!previousFocus.inert)previousFocus.focus({preventScroll:true});
    return{mode:'background',visible};
  }
  function preview(reason='preview'){
    ++activation;foreground=false;show();gameHost.dataset.presentation='waiting';game.preview(reason);
    notifyGuard();options.onModeChange?.('background',reason);record('preview',reason);return{mode:'background',visible};
  }
  async function bringToForeground({resume=true,start=false}={}){
    const ticket=++activation;
    if(!await ready||disposed||disposing||ticket!==activation)return{mode:'background'};
    if(game.snapshot().viewportBlocked)return{mode:'background',reason:'viewport'};
    if(foreground)return{mode:'foreground'};
    if(document.activeElement!==wrapper)previousFocus=options.getReturnFocus?options.getReturnFocus():document.activeElement;
    foreground=true;show();gameHost.dataset.presentation='active';freezeInputs(false);
    try{notifyGuard();options.onModeChange?.('foreground','manual');wrapper.focus({preventScroll:true});await game.present({resume,start});}
    catch(error){background('activation-error');throw error;}
    if(!foreground||ticket!==activation)return{mode:'background'};
    record('foreground','manual');return{mode:'foreground'};
  }
  function consume(e){e.preventDefault();e.stopImmediatePropagation();}
  on(window,'keydown',e=>{
    const key=keyId(e);
    const modifier=/^(Control|Alt|Meta)(Left|Right)?$/.test(key);
    if(modifier)modifiers.add(key);
    if(!foreground){
      if(uncertainKeys.has(key)&&!e.repeat){uncertainKeys.delete(key);heldKeys.delete(key);notifyGuard();}
      else if(heldKeys.has(key))consume(e);
      return;
    }
    // Give the host its normal shortcuts before native command arbitration.
    // A modifier-triggered yield is remembered only for that held chord, so
    // the foreground toggle closes this stage instead of reopening it.
    if(modifier){shortcutYield=true;background('task-shortcut');return;}
    if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||![...gameKeys,'ShiftLeft','ShiftRight'].includes(key)){
      background('task-keyboard');return;
    }
    if(key.startsWith('Shift'))return;
    uncertainKeys.delete(key);
    heldKeys.add(key);
    if(!inside(e))consume(e);
  },{capture:true});
  on(window,'keyup',e=>{
    const key=keyId(e),owned=heldKeys.delete(key);uncertainKeys.delete(key);
    modifiers.delete(key);if(!modifiers.size)shortcutYield=false;
    if(owned&&!foreground)consume(e);
    if(owned)notifyGuard();
  },{capture:true});
  on(window,'pointerdown',e=>{
    shortcutYield=false;
    // A fresh down proves that an earlier sequence (possibly released while
    // the window was blurred) has ended. Do not swallow this new task click.
    heldPointers.delete(e.pointerId);clickTails.delete(e.pointerId);
    const inStage=inside(e);
    if(suppressContextMenu)menuPointer=inStage&&e.button===2?e.pointerId:null;
    if(inStage){if(document.activeElement!==wrapper)previousFocus=document.activeElement;if(foreground)heldPointers.add(e.pointerId);return;}
    if(!foreground)return;
    // Pass the same trusted event to the actual task: never replay a click.
    background('task-pointer',{restoreFocus:false});
  },{capture:true});
  on(window,'pointerup',e=>{
    if(!heldPointers.delete(e.pointerId))return;
    if(!foreground){clickTails.add(e.pointerId);consume(e);}
  },{capture:true});
  on(window,'pointercancel',e=>{heldPointers.delete(e.pointerId);clickTails.delete(e.pointerId);if(menuPointer===e.pointerId)menuPointer=null;},{capture:true});
  on(window,'click',e=>{if(clickTails.delete(e.pointerId))consume(e);},{capture:true});
  if(suppressContextMenu)on(window,'contextmenu',e=>{
    // The menu can arrive after pointer-up, with the task as its target.
    const startedOnStage=e.button===2&&e.pointerId===menuPointer;
    menuPointer=null;
    if(inside(e))e.preventDefault();
    else if(startedOnStage)consume(e);
  },{capture:true});
  on(window,'wheel',e=>{if(foreground&&!inside(e))background('task-scroll',{restoreFocus:false});},{capture:true,passive:true});
  on(document,'focusin',e=>{if(foreground&&e.target instanceof HTMLElement&&!inside(e))background('task-focus',{restoreFocus:false});},{capture:true});
  // iframe focus also blurs the parent window. Electron webview exposes its
  // focus on the embedding element; neither path needs guest-page access.
  on(document,'focus',e=>{if(foreground&&['IFRAME','WEBVIEW'].includes(e.target?.tagName)&&!inside(e))background('embedded-focus',{restoreFocus:false});},{capture:true});
  on(window,'blur',()=>{modifiers.clear();shortcutYield=false;for(const key of heldKeys)uncertainKeys.add(key);background('window-blur',{restoreFocus:false});});
  on(window,'compositionstart',()=>{if(foreground)background('composition');},{capture:true});
  on(document,'visibilitychange',()=>{if(document.hidden){for(const key of heldKeys)uncertainKeys.add(key);background('hidden',{restoreFocus:false});}});
  for(const type of['keydown','keyup','pointerdown','pointerup','click','dblclick','auxclick','contextmenu','beforeinput','input'])on(wrapper,type,e=>{if(foreground||(suppressContextMenu&&type==='contextmenu'))e.stopPropagation();});
  game=options.mountGame(gameHost,{assetsBase:options.assetsBase,ui:options.ui,manifest:options.manifest,loadAtlas:options.loadAtlas,checkpoint:options.checkpoint,presented:false,qa:options.qa===true,
    onResume:()=>bringToForeground({resume:true,start:false}),
    beforePlay:async()=>{if(!foreground)await bringToForeground({resume:false});return foreground&&!disposing;},
    isVisible:()=>visible,canRandom:options.canRandom,onRandom:options.onRandom,
    onReload:options.onReload,onViewChange(){options.onGameChange?.();},
    onExit:()=>background('manual',{visible:false})});
  const style=document.createElement('style');
  style.textContent=options.stageStyle+':host([data-presentation="frozen"]) *,:host([data-presentation="frozen"]) button{pointer-events:none!important}:host([data-presentation="frozen"]) [data-game-resume]{pointer-events:auto!important;cursor:pointer!important}:host([data-presentation="frozen"]) [data-game-resume]::after{content:"";position:absolute;right:0;top:0;width:12px;height:12px;pointer-events:none;background:linear-gradient(90deg,#fff8e4 0 3px,transparent 3px);clip-path:polygon(0 0,30% 0,30% 100%,0 100%,0 0,65% 0,95% 0,95% 100%,65% 100%);opacity:.8}';
  gameHost.shadowRoot.append(style);
  const ready=(async()=>{
    const success=await game.ready;
    if(success)for(const node of game.getRoot().querySelectorAll('[aria-modal]'))node.removeAttribute('aria-modal');
    return success;
  })();
  async function freezeVisible(reason='restored'){
    if(!await ready||disposed||disposing)return false;
    const state=game.getRunState();if(!['playing','paused'].includes(state.view))return false;
    foreground=false;show();gameHost.dataset.presentation='frozen';freezeInputs(true);notifyGuard();options.onModeChange?.('background',reason);return true;
  }
  function getDiagnostics(){return{kind:options.kind,visible,mode:foreground?'foreground':'background',resident:!disposed,disposed,
    initError:game.snapshot().errors.join('\n'),rafActive:game.snapshot().rafPending,heldKeys:[...heldKeys],heldPointers:[...heldPointers],
    backgroundInertCount:0,game:game.snapshot(),events:structuredClone(events)};}
  async function dispose(){
    if(disposePromise)return disposePromise;
    disposing=true;background('unload',{restoreFocus:false,visible:false});++activation;
    disposePromise=(async()=>{await ready;await game.dispose();for(const remove of listeners)remove();heldKeys.clear();uncertainKeys.clear();heldPointers.clear();clickTails.clear();notifyGuard();wrapper.remove();disposed=true;record('disposed','unload');return getDiagnostics();})();
    return disposePromise;
  }
  return{ready,foreground:bringToForeground,background,preview,freezeVisible,checkpoint:()=>game.checkpoint?.()??null,isVisible:()=>visible,dispose,getDiagnostics,getMode:()=>foreground?'foreground':'background',getRunState:()=>game.getRunState(),setKeepVisible:value=>{retainVisible=value;},setAvailability:value=>game.setAvailability(value),consumeShortcutYield(){const yielded=shortcutYield;shortcutYield=false;return yielded;},
    ...(options.qa===true?{review:game.review,configure:game.configure}:{})};
}
