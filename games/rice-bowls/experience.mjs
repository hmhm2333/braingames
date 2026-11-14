import {GAME_COPY,SHARED_COPY} from '../../runtime/game-catalog.mjs';
import {applyCopy} from '../../runtime/apply-copy.mjs';
import {mountControlGuide} from '../../runtime/control-guide.mjs';
const copy=GAME_COPY['regulars-g04'];
import {RegularsSession,MAX_MISTAKES,RESPONSE_MS} from './regulars-core.mjs';
import {ServiceScene,loadSprites,guestName,mealName} from './service-scene.mjs';
import {menuSlot,orderCueRect,viewportLayout} from './layout.mjs';
import {readPlacement,savePlacement,placementBounds,clampAnchor} from './placement.mjs';
import {createMoveHandle} from '../../runtime/move-handle.mjs';
import {createDragPreview,previewRect} from './drag-preview.mjs';
import {createPixelText} from '../../runtime/pixel-text.mjs';
import {RECOVERY_MS,playableSize} from '../../runtime/presentation.mjs';
const GUEST_NAME_MS=800;

export function mountGame(host,options={}){
  if(!(host instanceof HTMLElement))throw TypeError('Game host must be an HTMLElement');
  const shadow=host.attachShadow({mode:'open'}),root=document.createElement('main');root.id='game';root.className='stage';root.dataset.phase='loading';root.setAttribute('aria-label',copy.title);
  const style=document.createElement(options.ui?'style':'link');
  const styleReady=options.ui?Promise.resolve():new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=()=>reject(Error('游戏样式加载失败'));});
  if(options.ui)style.textContent=options.ui.style;else{style.rel='stylesheet';style.href=new URL('./service.css',import.meta.url).href;}
  shadow.append(style,root);
  const pixelFace=new FontFace('Whale G04 Pixel',options.ui?options.ui.fontBytes:'url("'+new URL('./ui/song-subset.ttf',import.meta.url).href+'")');
  const $=id=>root.querySelector('#'+id),params=new URLSearchParams(options.onExit?'':location.search);
  let presented=options.presented!==false,ready=false,lastView=null,menuKey='',canReplay=options.canReplay!==false,canRandom=options.canRandom===true;
  const errors=[];
  const bestKey='braingames.g04.bestCustomers.v1';
  let bestCustomers=0,recoveryUntil=0;
  const mealUrl=id=>options.ui?options.ui.mealImages[id]:new URL('./assets/'+sprites.manifest.mealImages[id],import.meta.url).href;
let frozenVisible=false,frozenDragged=false,session,sprites,scene,pixelText,timer=null,raf=null,lastWall=null,disposed=false,uiKey='',pointer=null,announcedVisit=0;
let preferredPlacement=null,dragAnchor=null,dragOrigin=null,relocating=false,dragPreview=false,moveFrame=null,moveGesture=null,dragSurface=null,placementGeometry=null,dragGeometry=null,sessionSeed=0,layoutPhase=null,handleKey='';
const listeners=[];
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
function on(target,event,fn,options){target.addEventListener(event,fn,options);listeners.push(()=>target.removeEventListener(event,fn,options));}
function canvas(w,h,label){const c=document.createElement('canvas');c.width=w;c.height=h;c.setAttribute('role','img');c.setAttribute('aria-label',label);return c;}
function textLabel(text){const span=document.createElement('span');span.dataset.pixelText='';span.textContent=text;return span;}
function mealImage(id,label=''){
  const img=document.createElement('img');img.src=mealUrl(id);img.alt=label;img.draggable=false;return img;
}
function fitStage(){
  const width=root.clientWidth,height=root.clientHeight,count=session?.activeMeals.length??4,base=viewportLayout(width,height,count),phase=session?.phase??'welcome';
  root.style.setProperty('--panel-width',base.panel.width+'px');
  const dialog=['welcome','summary'].includes(phase)?$(phase).getBoundingClientRect().height:0;
  const requested=dragAnchor??(preferredPlacement?[preferredPlacement.x*width,preferredPlacement.y*height]:base.scene.whale);
  const bounds=placementBounds(phase,base,dialog),anchor=clampAnchor(requested,bounds,width,height);placementGeometry={width,height,bounds};
  const v=scene.resize(width,height,count,anchor),vars={'ui-font':v.fontSize,'ui-line':v.lineHeight,'menu-left':v.menu.left,'menu-top':v.menu.top,'menu-width':v.menu.width,'menu-height':v.menu.height,'hud-left':v.hudLeft,'panel-left':v.panel.left,'panel-width':v.panel.width,'core-offset-y':v.offset[1]};
  for(const [name,value] of Object.entries(vars))root.style.setProperty('--'+name,value+'px');
  root.style.setProperty('--menu-columns',v.menu.columns);root.style.setProperty('--menu-rows',v.menu.rows);
}
function stop(){if(timer!==null)clearTimeout(timer);if(raf!==null)cancelAnimationFrame(raf);timer=null;raf=null;lastWall=null;}
function showError(error){
  console.error(error);errors.push(error.message);stop();cancelMoveFrame();dragSurface?.end();moveGesture?.cancel();root.dataset.phase='error';pixelText?.suspend();
  const box=document.createElement('section');box.className='window status-dialog';box.setAttribute('role','alert');
  const title=textLabel(copy.loadError),text=document.createElement('p'),reload=document.createElement('button');
  text.id='error-detail';text.textContent=error.message;reload.id='reload';reload.className='primary';reload.append(textLabel(SHARED_COPY.reload));
  on(reload,'click',()=>{void options.onReload().catch(showError);});box.append(title,text,reload);
  root.replaceChildren(box);pixelText?.present();pixelText?.flush();reload.focus({preventScroll:true});options.onViewChange?.('error');
}
function token(){return`${session.phase}:${session.visit?.id}:${session.canSelect()}`;}
function updateResponse(){
  const canRespond=(session.phase==='running'||frozenVisible&&session.phase==='paused')&&!!session.visit&&!session.arrival&&!session.service&&!session.finishRequested;
  const visible=(session.phase==='running'||frozenVisible&&session.phase==='paused')&&(canRespond||session.service?.outcome.reason==='timeout'&&!session.service.removed);
  if($('response').hidden===visible)$('response').hidden=!visible;
  if(!visible)return;
  const remaining=canRespond?session.responseRemainingMs:0,seconds=Math.ceil(remaining/1000),width=Math.ceil(56*remaining/RESPONSE_MS)+'px';
  if($('response').dataset.seconds!==String(seconds)){
    $('response').dataset.seconds=String(seconds);$('response').dataset.urgency=seconds<=1?'last':seconds<=2?'soon':'calm';
    $('response').setAttribute('aria-label',`剩余${seconds}秒`);$('response-seconds').textContent=String(seconds);
  }
  if($('response-fill').style.width!==width)$('response-fill').style.width=width;
}
function updateUI(force=false){
  syncMenu();updateResponse();
  const showName=!!session.arrival&&session.arrival.elapsedMs<GUEST_NAME_MS;
  const key=`${session.phase}:${session.revision}:${showName}`;if(!force&&key===uiKey)return;uiKey=key;const s=session.snapshot();if(frozenVisible&&s.phase==='paused')s.phase='running';
  root.dataset.phase=s.phase;
  for(const id of ['welcome','summary','loading'])$(id).hidden=id!==s.phase;
  const phaseChanged=layoutPhase!==s.phase;
  if(phaseChanged){layoutPhase=s.phase;fitStage();}
  const handle=$('move-whale'),moveHint=frozenVisible?SHARED_COPY.freezeHint:'长按鲸鱼娘移动餐台';
  handle.setAttribute('aria-label',moveHint);handle.title=moveHint;
  $('menu').hidden=s.phase!=='running';
  $('lives').hidden=s.phase!=='running';
  $('lives').setAttribute('aria-label',`还能失误 ${s.lives} 次`);
  if(s.service&&s.service.outcome.visitId!==announcedVisit){
    const out=s.service.outcome;announcedVisit=out.visitId;
    const {feedback}=copy,guest=guestName(out.guest);
    const tail=s.lives?feedback.lives.replace('{lives}',s.lives):feedback.last.replace('{max}',MAX_MISTAKES);
    $('announcement').textContent=out.reason==='timeout'?feedback.timeout+tail:out.correct?feedback.correct.replace('{guest}',guest):feedback.wrong.replace('{guest}',guest)+tail;
  }
  for(const [i,heart] of [...$('lives').children].entries())heart.dataset.lost=String(i>=s.lives);
  // An occupied menu slot keeps the click inside the game even while a dish is being served.
  const selected=s.service?.outcome.chosen;
  for(const button of $('menu').children){
    button.disabled=relocating||session.phase!=='running';
    button.setAttribute('aria-disabled',String(!s.canSelect||button.disabled));
    button.dataset.selected=String(selected===button.dataset.meal);
  }
  const showMeal=s.visit?.hinted&&!s.service&&!s.finishRequested;
  const order=s.phase==='running'&&(showName||showMeal)?s.visit:null;
  $('order').hidden=!order;
  if(order){
    const name=guestName(order.guest);
    $('order').setAttribute('aria-label',showMeal?`${name}要${mealName(order.meal)}`:name);
    $('order').dataset.kind=order.kind;
    const caption=$('order-caption');
    caption.style.visibility=showName?'visible':'hidden';
    if(caption.textContent!==name)caption.textContent=name;
    $('order-icon').hidden=!showMeal;$('order-label').textContent=showMeal?mealName(order.meal):'';
    const icon=$('order-icon');
    if(showMeal){const url=mealUrl(order.meal);if(icon.getAttribute('src')!==url)icon.src=url;}
    else icon.removeAttribute('src');
    const cue=orderCueRect(scene.layout,order.motion);
    for(const [name,value] of Object.entries(cue))$('order').style.setProperty('--order-'+name,value+'px');
  }else{$('order').removeAttribute('aria-label');$('order-label').textContent='';$('order-icon').removeAttribute('src');}
  const front=s.visit?.guest;
  $('front-name').hidden=!front||s.phase!=='running';
  if(front){$('front-name').textContent=`先给${guestName(front)}`;$('menu').setAttribute('aria-label',`给${guestName(front)}上菜`);}
  else $('menu').setAttribute('aria-label','选一份，上菜');
  if(s.phase==='summary'){
    if(phaseChanged&&presented&&canReplay)$('replay').focus({preventScroll:true});
    const customers=s.stats.customersServed;
    if(customers>bestCustomers){bestCustomers=customers;if(!options.qa)localStorage.setItem(bestKey,String(bestCustomers));}
    $('customer-value').textContent=customers;$('best-value').textContent=bestCustomers;
  }
}
function positionLobby(){
  if(!['welcome','summary'].includes(session.phase))return;
  const panel=$(session.phase).getBoundingClientRect(),stage=root.getBoundingClientRect(),v=scene.viewport;
  scene.lobbyRoot=[panel.right-stage.left+v.companionWidth/2,panel.bottom-stage.top-8];
}
function syncMoveHandle(){
  const button=$('move-whale');button.hidden=!['welcome','running','summary',...(frozenVisible?['paused']:[])].includes(session.phase)||!!errors.length;
  if(button.hidden)return;
  const box=scene.dragBounds(session,dragPreview),key=Object.values(box).join(':');if(key===handleKey)return;handleKey=key;
  for(const [name,value]of Object.entries(box))button.style[name]=value+'px';
}
function draw(){positionLobby();scene.draw(session,{moving:dragPreview});syncMoveHandle();const view=runView();if(view!==lastView){lastView=view;options.onViewChange?.(view);}}
function runView(){return errors.length?'error':session?.phase==='running'?'playing':session?.phase==='summary'?'finished':session?.phase==='paused'?'paused':session?.phase??'loading';}
function schedule(){
  if(disposed||!presented||relocating||!playableSize(root.clientWidth,root.clientHeight)||session.phase!=='running')return;
  if(recoveryUntil||session.service||session.arrival)raf=requestAnimationFrame(tick);
  else timer=setTimeout(tick,1000/12);
}
function tick(){
  if(!playableSize(root.clientWidth,root.clientHeight)){stop();return;}
  timer=null;raf=null;const now=performance.now();
  if(recoveryUntil){lastWall=now;if(now<recoveryUntil){schedule();return;}clearRecovery();}
  const delta=lastWall===null?0:now-lastWall;lastWall=now;
  try{if(delta>250){recover();return;}session.advance(delta);updateUI();draw();schedule();}
  catch(error){showError(error);}
}
function run(){stop();lastWall=null;updateUI(true);draw();schedule();pixelText.flush();}
function clearRecovery(){recoveryUntil=0;delete root.dataset.recovering;const small=!playableSize(root.clientWidth,root.clientHeight);$('menu').inert=small;$('move-whale').inert=small;}
function recover(){recoveryUntil=performance.now()+RECOVERY_MS;root.dataset.recovering='true';const small=!playableSize(root.clientWidth,root.clientHeight);$('menu').inert=small;$('move-whale').inert=small;stop();schedule();}
function pause(reason='background'){if(!session?.pause(reason))return;moveGesture?.cancel();stop();}
function resume(){if(session.resume()){pointer=null;run();recover();}}
function serve(meal){
  if(relocating||recoveryUntil||!playableSize(root.clientWidth,root.clientHeight)||!session.canSelect())return;
  const now=performance.now(),delta=lastWall===null?0:now-lastWall;
  if(delta>250){recover();return;}
  session.advance(delta);session.serve(meal);
  stop();lastWall=now;updateUI();draw();schedule();
}
function createSession(value){sessionSeed=value;return new RegularsSession({seed:value,guestIds:Object.keys(sprites.manifest.guests),planMotion:visit=>scene.planMotion(visit,value)});}
function replay(){if(!canReplay||!playableSize(root.clientWidth,root.clientHeight))return;clearRecovery();session=createSession(seed());session.start();uiKey='';pointer=null;announcedVisit=0;$('announcement').textContent='';run();}

function cancelMoveFrame(){if(moveFrame!==null)cancelAnimationFrame(moveFrame);moveFrame=null;}
function repositionVisit(){if(session?.visit)session.reposition(scene.planMotion(session.visit,sessionSeed,session.visit.motion.lane));}
function moveCore(dx,dy){
  dragAnchor=clampAnchor([dragOrigin[0]+dx,dragOrigin[1]+dy],dragGeometry.bounds,dragGeometry.width,dragGeometry.height);if(moveFrame!==null)return;
  moveFrame=requestAnimationFrame(()=>{moveFrame=null;dragSurface.move(dragAnchor[0]-dragOrigin[0],dragAnchor[1]-dragOrigin[1]);});
}
function finishMoving(active,dx,dy){
  cancelMoveFrame();dragSurface.end();
  if(active){
    dragAnchor=[dragOrigin[0]+dx,dragOrigin[1]+dy];fitStage();const anchor=[...scene.layout.whale];
    if(anchor.some((value,i)=>value!==dragOrigin[i])){
      preferredPlacement=savePlacement(localStorage,anchor,root.clientWidth,root.clientHeight);
      repositionVisit();
    }
  }
  relocating=false;dragPreview=false;dragAnchor=null;delete root.dataset.moving;
  if(disposed||errors.length)return;if(!presented){if(frozenVisible){fitStage();updateUI(true);draw();pixelText.flush();}return;}pixelText.present();fitStage();run();if(active)recover();
}
function cancelMoving(){
  cancelMoveFrame();dragSurface.end();relocating=false;dragPreview=false;dragAnchor=null;delete root.dataset.moving;
  if(disposed||errors.length)return;if(!presented){if(frozenVisible){fitStage();updateUI(true);draw();pixelText.flush();}return;}pixelText.present();fitStage();
  if(session.phase==='running')run();else{updateUI(true);draw();pixelText.flush();}
}


function syncMenu(){
  const key=session.activeMeals.join(',');if(key===menuKey)return;menuKey=key;pointer=null;
  $('menu').dataset.mealCount=String(session.activeMeals.length);
  $('menu').replaceChildren();
  const slots=session.activeMeals.map((id,index)=>({id,...menuSlot(index)})).sort((a,b)=>a.row-b.row||a.column-b.column);
  for(const {id,row,column} of slots){
    const button=document.createElement('button');button.className='meal-choice';button.dataset.meal=id;button.dataset.gameControl='';button.setAttribute('aria-label',mealName(id));button.style.gridRow=String(row);button.style.gridColumn=String(column);
    button.append(mealImage(id,mealName(id)),textLabel(mealName(id)));$('menu').append(button);
  }
  fitStage();
}
function availability(){if(!session)return;const small=!playableSize(root.clientWidth,root.clientHeight);$('start').disabled=!canReplay||small;$('replay').disabled=!canReplay||small;$('random').hidden=!options.onRandom;$('random').disabled=!canRandom;}
async function init(){
  const markup=options.ui?options.ui.markup:await (async()=>{const response=await fetch(new URL('./service-markup.html',import.meta.url));if(!response.ok)throw Error('游戏界面加载失败 ('+response.status+')');return response.text();})();
  root.innerHTML=markup;
  applyCopy(root,{'#welcome .rule:first-child>span':copy.rules[0],'#welcome .rule:last-child>span':copy.rules[1],'#start span':copy.start,'#arrival-hint':copy.ruleNote,'#result-lead':copy.resultLead,'#summary .customer-result>span':copy.resultUnit,'#summary .best-result>span:first-child':copy.bestLabel,'#replay span':copy.replay,'#random span':SHARED_COPY.next,'#loading p':copy.loading,'#error p:first-child':copy.loadError,'#reload span':SHARED_COPY.reload});
  mountControlGuide(root,copy);
  await styleReady;await pixelFace.load();document.fonts.add(pixelFace);pixelText=createPixelText(root);
  sprites=await loadSprites({manifest:options.manifest,loadAtlas:options.loadAtlas});
  if(disposed)return false;
  preferredPlacement=readPlacement(localStorage);scene=new ServiceScene($('scene'),sprites);fitStage();session=createSession(params.has('seed')?Number(params.get('seed')):seed());
  if(options.checkpoint){const saved=options.checkpoint;if(saved.version!==1)throw Error('Invalid G04 experience checkpoint');sessionSeed=saved.seed;preferredPlacement=saved.placement;announcedVisit=saved.announcedVisit;session=RegularsSession.restore(saved.session,{seed:sessionSeed,guestIds:Object.keys(sprites.manifest.guests),planMotion:visit=>scene.planMotion(visit,sessionSeed)});if(session.phase==='running')session.pause('refresh');fitStage();if(saved.viewport.width!==root.clientWidth||saved.viewport.height!==root.clientHeight)repositionVisit();}
  if(!options.qa){const saved=localStorage.getItem(bestKey);if(saved!==null){bestCustomers=Number(saved);if(!Number.isSafeInteger(bestCustomers)||bestCustomers<0)throw Error('最佳记录数据无效');}}
  syncMenu();
  await Promise.all([...$('menu').querySelectorAll('img')].map(img=>img.decode()));
  const tutorial=Object.values(sprites.manifest.guests)[0];
  for(const [id,sprite] of [['rule-new-guest',tutorial.clips['pet-idle'][0]],['rule-old-guest',tutorial.heldFrame],['rule-plate','empty/baozi']])sprites.icon($(id),sprite,1);
  $('rule-meal').src=mealUrl('baozi');
  dragSurface=createDragPreview($('move-layer'),$('move-plane'),$('move-preview'),$('scene'));
  moveGesture=createMoveHandle($('move-whale'),{
    canMove:()=>ready&&(presented||frozenVisible)&&!disposed&&!errors.length&&!recoveryUntil&&playableSize(root.clientWidth,root.clientHeight)&&['welcome','running','summary',...(frozenVisible?['paused']:[])].includes(session.phase),
    onGrab(){relocating=true;dragOrigin=[...scene.layout.whale];pointer=null;stop();pixelText.suspend();updateUI(true);draw();dragGeometry=placementGeometry;},
    onActivate(){frozenDragged=frozenVisible;dragPreview=true;root.dataset.moving='true';draw();dragSurface.begin(previewRect(dragOrigin,dragGeometry.bounds,dragGeometry.width,dragGeometry.height),dragGeometry.width,dragGeometry.height);},onMove:moveCore,onDrop:finishMoving,onCancel:cancelMoving,
    onTap:()=>{},onError:showError
  });
  $('move-whale').dataset.gameResume='';
  on($('move-whale'),'click',event=>{if(!frozenVisible)return;event.preventDefault();event.stopImmediatePropagation();if(frozenDragged){frozenDragged=false;return;}void options.onResume();},true);
  on($('start'),'click',async()=>{if(!canReplay||!playableSize(root.clientWidth,root.clientHeight))return;if(options.beforePlay&&!await options.beforePlay())return;if(session.start())run();});
  on($('menu'),'click',event=>{const button=event.target.closest('button[data-meal]');if(button)serve(button.dataset.meal);});
  on($('replay'),'click',replay);
  on($('random'),'click',()=>{if(canRandom)void options.onRandom().catch(showError);});
  on($('reload'),'click',()=>{void options.onReload().catch(showError);});
  on(shadow,'pointerdown',event=>{
    if(event.button!==0)return;const button=event.target.closest('[data-game-control]');
    pointer=button&&root.contains(button)?{id:event.pointerId,button,token:button.dataset.meal?token():null,allow:false}:null;
  },true);
  on(window,'pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;const rect=pointer.button.getBoundingClientRect();
    pointer.allow=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom&&(pointer.token===null||pointer.token===token());
  },true);
  on(window,'click',event=>{if(!pointer||event.detail===0)return;const current=pointer;pointer=null;if(!current.allow||!current.button.contains(event.composedPath()[0])){event.preventDefault();event.stopImmediatePropagation();}},true);
  on(window,'pointercancel',()=>{pointer=null;},true);
  on(window,'keydown',event=>{if(presented&&event.code==='Escape'){event.preventDefault();if(!event.repeat&&moveGesture.isPressed())moveGesture.cancel({untilRelease:true});}},true);
  if(!options.onExit){
    on(window,'blur',()=>pause('away'));on(window,'focus',resume);on(document,'visibilitychange',()=>{if(document.hidden)pause('away');else resume();});
    on(window,'pagehide',()=>{void dispose();});
  }
  let measured=root.clientWidth+':'+root.clientHeight;
  const resize=new ResizeObserver(()=>{const size=root.clientWidth+':'+root.clientHeight;if(size===measured||disposed||!ready||errors.length)return;measured=size;moveGesture.cancel({untilRelease:presented});stop();fitStage();repositionVisit();availability();if(presented||frozenVisible){updateUI(true);draw();pixelText.flush();if(presented)recover();}});resize.observe(root);listeners.push(()=>resize.disconnect());
  ready=true;availability();
  if(presented)run();else{updateUI(true);draw();pixelText.suspend();}
  return true;
}
function suspend(reason='background'){
  presented=false;pointer=null;moveGesture?.cancel();cancelMoveFrame();session?.pause(reason);stop();pixelText?.suspend();recoveryUntil=0;delete root.dataset.recovering;
}
async function present({resume:continueRound=true,start=false}={}){
  if(disposed)return false;await initialization;presented=true;pixelText?.present();
  if(errors.length){pixelText?.flush();$('reload').focus({preventScroll:true});return true;}
  const resuming=continueRound&&session.phase==='paused';
  clearRecovery();fitStage();repositionVisit();
  if(start&&session.phase==='welcome'&&canReplay&&playableSize(root.clientWidth,root.clientHeight))session.start();else if(resuming)session.resume();
  availability();run();if(resuming)recover();return true;
}
function checkpoint(){if(!ready||errors.length)return null;return{version:1,seed:sessionSeed,session:session.checkpoint(),placement:preferredPlacement,announcedVisit,viewport:{width:root.clientWidth,height:root.clientHeight}};}
function setFrozen(active){frozenVisible=active;frozenDragged=false;}
function snapshot(){return{view:runView(),ready,disposed,presented,relocating,dragPreview,recovering:recoveryUntil!==0,viewportBlocked:!playableSize(root.clientWidth,root.clientHeight),session:session?.snapshot()??null,scene:scene?{drawCount:scene.drawCount,anchor:[...scene.layout.whale]}:null,rafPending:raf!==null||moveFrame!==null,timerPending:timer!==null,errors:[...errors]};}
async function dispose(){if(disposed)return;disposed=true;presented=false;stop();cancelMoveFrame();moveGesture?.cancel();await initialization;moveGesture?.dispose();for(const remove of listeners)remove();pixelText?.dispose();sprites?.image.close?.();document.fonts.delete(pixelFace);root.remove();style.remove();}
const initialization=init().catch(error=>{showError(error);return false;});
return{ready:initialization,snapshot,suspend,present,dispose,checkpoint,setFrozen,getRoot:()=>root,
  getRunState:()=>({view:runView(),hasRound:!!session&&session.phase!=='welcome'}),
  setAvailability(value){canReplay=value.canReplay;canRandom=value.canRandom;if(ready&&!errors.length)availability();},
  preview(){suspend('preview');updateUI(true);draw();return true;},paintStatic(){if(ready){updateUI(true);draw();pixelText.flush();}}
};
}
