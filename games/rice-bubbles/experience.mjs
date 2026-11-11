import {GAME_COPY,SHARED_COPY} from '../../runtime/game-catalog.mjs';
import {applyCopy} from '../../runtime/apply-copy.mjs';
import {mountControlGuide} from '../../runtime/control-guide.mjs';
const copy=GAME_COPY['rice-bubbles-g10'];
import {createSession} from './core.mjs';
import {FOOD_TYPES} from './rules.mjs';
import {WhaleScene} from './scene.mjs';
import {GameAudio} from './audio.mjs';
import {paintLegend} from './stimuli.mjs';
import {createPixelText} from '../../runtime/pixel-text.mjs';
import {RECOVERY_MS,playableSize} from '../../runtime/presentation.mjs';

export function mountGame(host,options={}){
if(!(host instanceof HTMLElement))throw TypeError('Game host must be an HTMLElement');
const shadow=host.attachShadow({mode:'open'}),ui=options.ui;
const styleLink=document.createElement(ui?'style':'link');
const styleReady=ui?Promise.resolve():new Promise((resolve,reject)=>{styleLink.onload=resolve;styleLink.onerror=()=>reject(Error('游戏样式加载失败'));});
if(ui)styleLink.textContent=ui.style;else{styleLink.rel='stylesheet';styleLink.href=new URL('./style.css',import.meta.url).href;}shadow.append(styleLink);
const pixelFace=new FontFace('Whale G10 Pixel',ui?ui.fontBytes:'url("'+new URL('./ui/song-subset.ttf',import.meta.url).href+'")',{weight:'400',style:'normal'});
const root=document.createElement('main');root.id='experience';root.className='game-root';root.dataset.view='loading';root.innerHTML='<section class="paper status-panel" role="status"><h1>'+copy.loading+'</h1><span class="loading-mark" aria-hidden="true"><i></i><i></i><i></i></span></section>';shadow.append(root);
let frozenVisible=false,pixelText=null,scene=null,disposedSnapshot=null,disposePromise=null,playPending=false,markupLoaded=false;
const sound=new GameAudio();
let session=null,view='loading',raf=null,lobbyTimer=null,lastWall=null,lobbyClock=0,externalAttention=false,disposed=false,ready=false;
let presented=options.presented!==false;
let recoveryUntil=0;
let canReplay=options.canReplay!==false,canRandom=options.canRandom===true;
let physicalSpace=false,releaseUncertain=false,qaSequence=null,qaSeed=null,qaFrozen=false;
const qa=options.qa===true;
const bestKey='braingames.g10.bestSeconds.picky.v3';
let bestSeconds=0;
const logs=[],errors=[],frameTimes=[];
const listeners=[];
const $=id=>root.querySelector(`#${id}`);
const panels=['loading','welcome','result','error'];

function on(target,type,fn,options){target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));}
function log(event){logs.push(event);if(logs.length>512)logs.splice(0,logs.length-512);}
function setView(next){
  view=next;root.dataset.view=next;$('scene-root').inert=['finished','error'].includes(next);
  for(const name of panels)$(name+'-panel').hidden=!((next==='finished'&&name==='result')||next===name);
  if(next==='welcome'||next==='finished')announce('');
  scene.layout(next);
  placeControls();
  options.onViewChange?.(next);
}
function placeControls(){
  const l=scene.layoutSnapshot();
  root.style.setProperty('--companion-width',200*l.scale+'px');
  if(view==='welcome'||view==='finished'){
    const panel=$(view==='welcome'?'welcome-panel':'result-panel'),p=panel.getBoundingClientRect(),r=root.getBoundingClientRect();
    const companionWidth=parseFloat(getComputedStyle(panel).getPropertyValue('--companion-width'));
    scene.placeMenuAvatar(p.right-r.left+companionWidth/2,p.bottom-r.top-8*l.scale);
  }
}
function announce(text){$('feedback').textContent=text;}
function handleEvents(){
  for(const e of session.drainEvents()){
    log(e);const s=session.snapshot();
    if(e.type==='item_spawn')scene.setItem(e.item);
    if(e.type==='picky_intro'){scene.introPicky(e.atMs);announce('这顿先不吃'+FOOD_TYPES.find(food=>food.id===e.foodId).label+'，泡泡也别接。');}
    if(e.type==='outcome'){
      if(e.outcome!=='interrupted')session.schedulePresentation(scene.react(e.outcome,s));
      announce({rice_caught:'接住了。',bubble_mistake:'接到泡泡了。',bubble_pass:'泡泡放过去了。',rice_miss:'这口没接着。',food_refused:'这顿不吃的，放过去了。',food_mistake:'这顿不吃这个，放下。',interrupted:'游戏已暂停，当前物体不计结果。'}[e.outcome]);
    }
    if(e.type==='life_lost'&&e.lives===0)session.scheduleSettlement(scene.failureEndAt(s.clockMs));
    if(e.type==='meal_ready')session.scheduleMeal(scene.mealStartAt(s));
    if(e.type==='meal_form_start')scene.scheduleMeal(s,e.atMs);
    if(e.type==='meal_collected'){scene.collectMeal(e.atMs);announce('团好一颗饭球，已经收好。');}
    if(e.type==='finish'&&view==='playing')showResult();
  }
}
function cancelLoop(){if(raf!==null)cancelAnimationFrame(raf);if(lobbyTimer!==null)clearTimeout(lobbyTimer);raf=null;lobbyTimer=null;lastWall=null;}
function render(){
  const s=session?.snapshot();const t=['playing','paused'].includes(view)?s.clockMs:lobbyClock;
  scene.draw(t,s,view);
  for(const event of scene.drainFeedback()){log({type:'pixel_feedback',feedback:event.type,outcome:event.outcome,atMs:event.atMs});if(event.type!=='grasp')sound.play(event.type==='bubble-mistake'?'pop':event.type);}
}
function frame(rafTime){
  raf=null;if(disposed||!presented||!['playing','welcome','finished'].includes(view))return;
  if(isSmall()){cancelLoop();return;}
  const now=performance.now();
  if(recoveryUntil){
    lastWall=now;
    if(now<recoveryUntil){scheduleFrame();return;}
    recoveryUntil=0;delete root.dataset.recovering;
  }
  const previousWall=lastWall,delta=lastWall===null?0:now-lastWall;lastWall=now;
  if(qa&&view==='playing'&&frameTimes.length<4)log({type:'frame_clock_probe',rafTime,wallTime:now,previousWall,delta});
  try{
    if(view==='playing'){
      if(delta>250){recover();return;}
      frameTimes.push(delta);if(frameTimes.length>720)frameTimes.shift();
      session.advance(delta);handleEvents();if(view!=='playing')return;
    }else lobbyClock+=delta;
    render();scheduleFrame();
  }catch(error){fail(error);}
}
// Menu poses are authored at the clip's cel rate. Gameplay keeps a full RAF
// cadence for continuous falling and locomotion; the idle menu needs no 60Hz GPU work.
function scheduleFrame(){if(view==='playing')raf=requestAnimationFrame(frame);else lobbyTimer=setTimeout(()=>{lobbyTimer=null;frame(performance.now());},1000/scene.active.clip.fps);}
// A resumed renderer may wait for its first frame. Start measuring from that
// frame (or the first real key), rather than counting renderer wake-up as lag.
function runLoop(){cancelLoop();if(qaFrozen||!presented||isSmall()||view==='paused'||view==='error')return;scheduleFrame();}
function recover(){recoveryUntil=performance.now()+RECOVERY_MS;root.dataset.recovering='true';runLoop();}
function nextSeed(){const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0];}
async function startGame(){
  if(!ready||disposed||(!presented&&!options.beforePlay)||playPending||externalAttention||isSmall()||!canReplay||!['welcome','finished'].includes(view))return false;
  const requestedView=view;playPending=true;
  try{
    if(options.beforePlay&&await options.beforePlay()===false)return false;
    if(disposed||!presented||externalAttention||isSmall()||view!==requestedView)return false;
    await sound.unlock();
    if(disposed||!presented||externalAttention||isSmall()||view!==requestedView)return false;
    session=createSession({seed:qaSeed??nextSeed(),sequence:qaSequence});qaFrozen=false;recoveryUntil=0;delete root.dataset.recovering;
    lobbyClock=0;scene.ready(0,0);
    setView('playing');session.start();handleEvents();
    $('scene-root').focus({preventScroll:true});render();runLoop();return true;
  }catch(error){fail(error);return false;}finally{playPending=false;}
}
function pauseGame(reason='background'){
  if(disposed||view!=='playing')return false;
  cancelLoop();sound.stop();session.pause(reason);handleEvents();
  // Keep the actually displayed pose; no unsampled animation time is added.
  view='paused';$('scene-root').inert=true;recoveryUntil=0;delete root.dataset.recovering;
  options.onViewChange?.('paused');return true;
}
async function resumeGame(){
  if(disposed||(!presented&&!options.beforePlay)||playPending||view!=='paused'||externalAttention||isSmall())return false;
  playPending=true;
  try{
    if(options.beforePlay&&await options.beforePlay()===false)return false;
    if(disposed||!presented||view!=='paused'||externalAttention||isSmall())return false;
    await sound.unlock();
    if(disposed||!presented||view!=='paused'||externalAttention||isSmall())return false;
    session.resume();handleEvents();
    const resumed=session.snapshot();
    if(scene.presentation&&scene.presentation.endAtMs>=resumed.clockMs)session.schedulePresentation(scene.presentation.endAtMs);
    if(resumed.current.mealReady&&scene.chase&&resumed.clockMs<resumed.current.mealFormAtMs){const at=scene.mealStartAt(resumed);session.scheduleMeal(at);scene.scheduleMeal(session.snapshot(),at);}
    if(resumed.lives===0)session.scheduleSettlement(scene.failureEndAt(resumed.clockMs));
    view='playing';root.dataset.view=view;$('scene-root').inert=false;
    $('scene-root').focus({preventScroll:true});placeControls();render();recover();options.onViewChange?.('playing');return true;
  }catch(error){fail(error);return false;}finally{playPending=false;}
}
function showResult(){
  cancelLoop();sound.stop();const s=session.snapshot();
  const seconds=Math.floor(s.survivedMs/1000);
  if(seconds>bestSeconds){bestSeconds=seconds;if(!qa)localStorage.setItem(bestKey,String(bestSeconds));}
  $('elapsed-value').textContent=seconds;$('best-value').textContent=bestSeconds;
  lobbyClock=0;scene.ready(s.bowlFill,0);setView('finished');render();runLoop();$('again-button').focus({preventScroll:true});
}
function finishGame(){if(disposed||!session||!['playing','paused'].includes(view))return;session.finish();handleEvents();if(view!=='finished')showResult();}
function goWelcome(){cancelLoop();session=null;lobbyClock=0;scene.ready(0,0);setView('welcome');render();runLoop();$('start-button').focus({preventScroll:true});}
function keydown(e){
  if(disposed||!presented)return;
  if(e.key==='Escape'){e.preventDefault();return;}
  if(view==='finished'&&(e.key===' '||e.key==='Enter')){
    if(e.key===' '&&releaseUncertain&&!e.repeat){session.release();physicalSpace=false;releaseUncertain=false;}
    // A key held through the last mistake is not an explicit retry.
    if(e.repeat||(e.key===' '&&physicalSpace)){e.preventDefault();return;}
  }
  if(e.key==='Tab'&&view==='finished'){trapFocus(e);return;}
  if(e.key!==' '||!['playing','paused'].includes(view))return;
  if(e.composedPath().some(node=>node instanceof Element&&node.matches('button,summary,input,select,textarea')))return;
  e.preventDefault();
  if(e.repeat)return;
  if(releaseUncertain){session.release();physicalSpace=false;releaseUncertain=false;log({type:'fresh_nonrepeat_edge_after_blur',atMs:session.snapshot().clockMs});}
  if(physicalSpace)return;physicalSpace=true;
  if(view!=='playing'||recoveryUntil||isSmall())return;
  const now=performance.now(),delta=lastWall===null?0:now-lastWall;
  if(delta>250){recover();return;}
  session.advance(delta);lastWall=now;handleEvents();if(view!=='playing')return;
  const before=session.snapshot();
  // An object cannot be answered before its first real visible draw.
  if(scene.last?.object?.id!==before.current?.id||!scene.last?.object?.drawn){log({type:'input_before_visible_draw_ignored',atMs:before.clockMs});return;}
  session.press();handleEvents();render();
}
function keyup(e){if(e.key!==' '||(!presented&&!physicalSpace&&!releaseUncertain))return;if(view==='finished'&&(physicalSpace||releaseUncertain))e.preventDefault();physicalSpace=false;releaseUncertain=false;session?.release();}
function fail(error){
  if(disposed)return;
  cancelLoop();sound.stop();errors.push(error.stack??String(error));console.error(error);
  view='error';root.dataset.view=view;$('scene-root').inert=true;
  for(const name of panels)$(name+'-panel').hidden=name!=='error';
  $('error-message').textContent=error.message??String(error);$('feedback').hidden=true;$('reload-button').focus({preventScroll:true});options.onViewChange?.('error');
}


function isSmall(){return !playableSize(host.clientWidth,host.clientHeight);}
function updateStart(){ $('start-button').disabled=externalAttention||isSmall()||!canReplay;$('again-button').disabled=externalAttention||isSmall()||!canReplay;if(options.onRandom)$('back-button').disabled=!canRandom; }
function exitGame(){if(disposed)return;if(options.onExit)options.onExit();else goWelcome();}
function trapFocus(event){const items=[...$('result-panel').querySelectorAll('button:not(:disabled)')];const active=shadow.activeElement,index=items.indexOf(active);if(event.shiftKey&&(index<=0)){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&(index<0||index===items.length-1)){event.preventDefault();items[0]?.focus();}}
function suspend(reason='background'){presented=false;root.dataset.presented='false';pauseGame(reason);cancelLoop();pixelText?.suspend();sound.stop();physicalSpace=false;releaseUncertain=false;session?.release();recoveryUntil=0;delete root.dataset.recovering;}
function paintStatic(){pixelText?.flush();}
function preview(reason='preview'){
  suspend(reason);if(!ready||disposed)return false;
  if(['welcome','finished'].includes(view)){scene.layout(view);placeControls();render();}
  updateStart();paintStatic();return true;
}
async function present({resume=true,start=false}={}){
  if(disposed)return false;presented=true;root.dataset.presented='true';pixelText?.present();if(!ready)return false;
  const drawn=scene.layoutSnapshot();
  if(drawn.width!==host.clientWidth||drawn.height!==host.clientHeight)scene.layout(view);
  placeControls();updateStart();
  if(view==='welcome'&&start)return startGame();
  if(view==='paused'&&resume)return resumeGame();
  if(view==='paused'){paintStatic();return true;}
  render();runLoop();$(view==='welcome'?'start-button':view==='finished'?'again-button':view==='error'?'reload-button':'scene-root').focus({preventScroll:true});return true;
}
function checkpoint(){if(!ready||!session||view==='error')return null;return{version:3,view,lobbyClock,session:session.checkpoint(),scene:scene.checkpoint()};}
function setFrozen(active){
  frozenVisible=active;const button=$('resume-whale');if(!button||!ready)return;button.hidden=!active;button.title=SHARED_COPY.freezeHint;
  if(active)for(const [name,value]of Object.entries(scene.characterBounds()))button.style[name]=value+'px';
}
function snapshot(){if(disposed)return structuredClone(disposedSnapshot);return{view,ready,disposed,presented,recovering:recoveryUntil!==0,viewportBlocked:isSmall(),loading:scene?.loadPhase??'ui',session:session?.snapshot()??null,scene:ready?scene.metrics():null,feedback:root?.querySelector('#feedback')?.hidden===false?$('feedback').textContent:null,attention:externalAttention,sound:sound.enabled,audioActive:sound.active.size,rafPending:raf!==null,lobbyTimerPending:lobbyTimer!==null,frameTimes:[...frameTimes],errors:[...errors],events:structuredClone(logs)};}
async function dispose(){if(disposed)return disposePromise;disposedSnapshot=snapshot();disposed=true;ready=false;cancelLoop();for(const remove of listeners)remove();disposedSnapshot={...disposedSnapshot,ready:false,disposed:true,rafPending:false};disposePromise=(async()=>{await initialization;await sound.dispose();if(scene)await scene.dispose();pixelText?.dispose();document.fonts.delete(pixelFace);root?.remove();styleLink.remove();})();return disposePromise;}
function configure({sequence=null,seed=1}={}){if(disposed||!ready||!['welcome','finished'].includes(view))throw Error('Configure before a run');createSession({sequence,seed});qaSequence=sequence;qaSeed=seed;}
function reviewStep(deltaMs){
  if(!qaFrozen||view!=='playing')throw Error('Freeze the review clock first');
  if(!Number.isFinite(deltaMs)||deltaMs<0)throw RangeError('Review time must be finite and nonnegative');
  const target=session.snapshot().clockMs+deltaMs;
  while(view==='playing'&&session.snapshot().clockMs<target){session.advance(Math.min(1000/60,target-session.snapshot().clockMs));handleEvents();render();}
  if(deltaMs===0)render();return snapshot();
}

const initialization=(async()=>{
 try{
  const [text]=await Promise.all([ui?ui.markup:fetch(new URL('./markup.html',import.meta.url)).then(response=>{if(!response.ok)throw Error(`游戏界面加载失败 (${response.status})`);return response.text();}),pixelFace.load(),styleReady]);
  if(disposed)return false;const template=document.createElement('template');template.innerHTML=text;root.replaceChildren(...template.content.firstElementChild.childNodes);markupLoaded=true;
  applyCopy(root,{'#loading-panel h1':copy.loading,'#start-button span':copy.start,'#welcome-panel .rule:first-child .rule-action':copy.rules[0],'#welcome-panel .rule:last-child .rule-action':copy.rules[1],'#result-title':copy.resultLead,'#result-panel .survival-result>span':copy.resultUnit,'#result-panel .best-label':copy.bestLabel,'#again-button':copy.replay,'#back-button':SHARED_COPY.next,'#error-title':copy.loadError,'#reload-button':SHARED_COPY.reload});
  mountControlGuide(root,copy.control);
  document.fonts.add(pixelFace);pixelText=createPixelText(root);root.dataset.font='loaded';
  for(const img of root.querySelectorAll('img[src]'))img.src=ui?ui.icons[img.getAttribute('src')]:new URL(img.getAttribute('src'),import.meta.url).href;
  const resumeButton=document.createElement('button');resumeButton.id='resume-whale';resumeButton.type='button';resumeButton.tabIndex=-1;resumeButton.hidden=true;resumeButton.dataset.gameResume='';resumeButton.setAttribute('aria-label','点击鲸鱼娘继续游戏');Object.assign(resumeButton.style,{position:'absolute',border:'none',padding:'0',background:'transparent',cursor:'pointer',zIndex:'12'});root.append(resumeButton);
  on(resumeButton,'pointerdown',event=>event.preventDefault());on(resumeButton,'click',event=>{event.preventDefault();if(frozenVisible)void options.onResume();});
  scene=new WhaleScene($('scene-root'),{assetsBase:options.assetsBase??new URL('./assets/g10/',import.meta.url),manifest:options.manifest,loadAtlas:options.loadAtlas,bounds:()=>({width:host.clientWidth,height:host.clientHeight})});
on($('start-button'),'click',startGame);on($('again-button'),'click',startGame);
on($('back-button'),'click',()=>{if(canRandom)void options.onRandom().catch(fail);});on($('reload-button'),'click',()=>{void options.onReload().catch(fail);});
if(!options.onRandom)$('back-button').hidden=true;
if(options.onRandom){$('back-button').textContent=SHARED_COPY.next;$('back-button').disabled=!options.canRandom;}
on(root,'keydown',keydown);on(window,'keyup',keyup,{capture:true});
if(!options.beforePlay){
on(window,'blur',()=>{releaseUncertain=physicalSpace;if(view==='playing')pauseGame('blur');else cancelLoop();});
on(window,'focus',()=>{if(view==='paused')void resumeGame();else if(['welcome','finished'].includes(view))runLoop();});
on(document,'visibilitychange',()=>{if(document.hidden){releaseUncertain=physicalSpace;if(view==='playing')pauseGame('hidden');else cancelLoop();}else if(view==='paused')void resumeGame();else if(['welcome','finished'].includes(view))runLoop();});
}
const observer=new ResizeObserver(()=>{
  if(!ready||disposed||(!presented&&options.isVisible?.()!==true))return;
  const drawn=scene.layoutSnapshot();
  if(drawn.width===host.clientWidth&&drawn.height===host.clientHeight)return;
  if(view==='playing')pauseGame('resize');
  scene.layout(view);placeControls();updateStart();render();if(!presented){paintStatic();setFrozen(frozenVisible);}else if(view==='paused')void resumeGame();
});observer.observe(host);listeners.push(()=>observer.disconnect());

  paintLegend($('rice-legend'),'rice');paintLegend($('bubble-legend'),'bubble');
  if(!qa){const saved=localStorage.getItem(bestKey);if(saved!==null){bestSeconds=Number(saved);if(!Number.isSafeInteger(bestSeconds)||bestSeconds<0)throw Error('最佳记录数据无效');}}
  await scene.init();
  if(disposed)return false;
  ready=true;root.dataset.presented=String(presented);
  if(options.checkpoint){
    const saved=options.checkpoint;if(saved.version!==3)throw Error('Invalid G10 experience checkpoint');
    session=createSession({checkpoint:saved.session});lobbyClock=saved.lobbyClock;scene.restore(saved.scene);view=saved.view==='playing'?'paused':saved.view;root.dataset.view=view;
    for(const name of panels)$(name+'-panel').hidden=!((view==='finished'&&name==='result')||view===name);
    if(view==='finished'){$('elapsed-value').textContent=String(Math.floor(session.snapshot().survivedMs/1000));$('best-value').textContent=String(bestSeconds);}
    render();placeControls();
  }else setView('welcome');updateStart();if(presented)runLoop();else pixelText.suspend();return true;
 }catch(error){if(!disposed){if(markupLoaded)fail(error);else{errors.push(error.stack??String(error));view='error';root.dataset.view='error';root.replaceChildren();const panel=document.createElement('section');panel.className='paper dialog-panel';const title=document.createElement('h2');title.textContent='游戏界面加载失败';const message=document.createElement('p');message.textContent=error.message;const reload=document.createElement('button');reload.id='reload-button';reload.className='primary';reload.textContent=SHARED_COPY.reload;on(reload,'click',()=>{void options.onReload().catch(fail);});panel.append(title,message,reload);root.append(panel);console.error(error);}}return false;}
})();
return {ready:initialization,snapshot,pause:pauseGame,resume:resumeGame,suspend,present,preview,paintStatic,finish:finishGame,
  getRunState:()=>({view,hasRound:session!==null}),
  setAvailability(value){canReplay=value.canReplay;canRandom=value.canRandom;if(markupLoaded){updateStart();if(!presented)paintStatic();}},
  notifyAttention(active){if(typeof active!=='boolean')throw TypeError('Attention flag must be boolean');if(disposed)return;const changed=externalAttention!==active;externalAttention=active;if(active){if(view==='playing')pauseGame('attention');else cancelLoop();}else if(changed&&ready&&presented){if(view==='paused')void resumeGame();else if(['welcome','finished'].includes(view))runLoop();}if(markupLoaded)updateStart();},dispose,checkpoint,setFrozen,getRoot:()=>root,...(qa?{configure,review:{freeze(){if(view!=='playing')throw Error('Start a game before sampling');qaFrozen=true;cancelLoop();return snapshot();},step:reviewStep,press(){if(!qaFrozen||view!=='playing')throw Error('Freeze the review clock first');session.press();handleEvents();render();return snapshot();},release(){session.release();}}}:{})};
}



