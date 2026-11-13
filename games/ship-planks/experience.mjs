import {GAME_COPY,SHARED_COPY} from '../../runtime/game-catalog.mjs';
import {applyCopy} from '../../runtime/apply-copy.mjs';
import {mountControlGuide} from '../../runtime/control-guide.mjs';
const copy=GAME_COPY['planks-g02'];
import {RepairSession,INTRO_PATCH,MAX_LIVES,CONTACT_MS,ANSWER_MS,WARNING_MS,randomSource,rotateCells} from './core.mjs';
import {RepairScene,LAYOUT,drawWood,siteBox,leakPoint,loadWhale} from './scene.mjs';
import {hullClip,VOYAGE_MS,voyageTarget,voyagePose,fitVoyage,LIFE_POINTS,MAST} from './sampan.mjs';
import * as navigation from './sampan.mjs';
import {createPixelText} from '../../runtime/pixel-text.mjs';
import {createMoveHandle} from '../../runtime/move-handle.mjs';
import {RECOVERY_MS,playableSize} from '../../runtime/presentation.mjs';

export function mountGame(host,options={}){
 if(!(host instanceof HTMLElement))throw TypeError('Game host must be an HTMLElement');
 const shadow=host.attachShadow({mode:'open'}),root=document.createElement('main'),style=document.createElement(options.ui?'style':'link');
 root.className='stage';root.dataset.view='loading';root.innerHTML='<p role="status">'+copy.loading+'</p>';
 const styleReady=options.ui?Promise.resolve():new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=()=>reject(Error('补船样式加载失败'));});
 if(options.ui)style.textContent=options.ui.style;else{style.rel='stylesheet';style.href=new URL('./style.css',import.meta.url).href;}
 shadow.append(style,root);
 const face=new FontFace('Whale G02 Pixel',options.ui?options.ui.fontBytes:'url("'+new URL('./ui/song-subset.ttf',import.meta.url).href+'")',{weight:'400'});
 const $=id=>root.querySelector('#'+id),listeners=[],errors=[];
 const bestKey='braingames.g02.bestBuilt.v1',positionKey='braingames.g02.position.v1';
 let frozenVisible=false,frozenDragged=false,ready=false,disposed=false,presented=options.presented!==false,view='loading',session=null,scene=null,pixelText=null,move=null;
 let raf=null,dragRaf=null,lastWall=null,recoveryUntil=0,hover=null,press=null,grab=null,layout={x:0,y:0};
 let voyage=null,completedVoyages=0,navRandom=null,heading=0;
 let answerTimer=null,answerStartedAt=null,answerWakeups=0,clockAnimation=null;
 let canReplay=options.canReplay!==false,canRandom=options.canRandom===true,pending=false,best=0,qaSetup=null,position=null;
 let width=host.clientWidth,height=host.clientHeight,resizeObserver=null,drawsAtDispose=null;
 const on=(target,type,fn,capture=false)=>{target.addEventListener(type,fn,capture);listeners.push(()=>target.removeEventListener(type,fn,capture));};
 const small=()=>!playableSize(width,height);
 const blocked=()=>!ready||!presented||small()||disposed||!!grab||!!voyage||recoveryUntil!==0;
 const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
 function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastWall=null;}
 function paintClock(){
  clockAnimation?.cancel();clockAnimation=null;const clock=$('clock-progress');if(!clock)return;
  const elapsed=session?.task?.elapsedMs??ANSWER_MS;clock.style.strokeDashoffset=String(264*elapsed/ANSWER_MS);
 }
 function stopAnswer(commit=true){
  if(answerTimer!==null)clearTimeout(answerTimer);answerTimer=null;
  const started=answerStartedAt;answerStartedAt=null;if(commit&&started!==null)session.elapseAnswer(Math.max(0,performance.now()-started));
  root.dataset.answerActive='false';paintClock();
 }
 function armAnswer(){
  if(answerTimer!==null||blocked()||view!=='playing'||!session.canAct())return;
  const remaining=ANSWER_MS-session.task.elapsedMs;root.dataset.urgent=String(remaining<=WARNING_MS);answerStartedAt=performance.now();root.dataset.answerActive='true';paintClock();
  clockAnimation=$('clock-progress').animate([{strokeDashoffset:String(264*session.task.elapsedMs/ANSWER_MS)},{strokeDashoffset:'264'}],{duration:remaining,easing:'steps('+Math.max(1,Math.ceil(32*remaining/ANSWER_MS))+', end)',fill:'forwards'});
  answerTimer=setTimeout(()=>{answerWakeups++;stopAnswer();if(session.motion){hover=null;press=null;sync();render();lastWall=performance.now();schedule();}else armAnswer();},remaining>WARNING_MS?remaining-WARNING_MS:remaining);
 }
 function render(){if(!scene)return;if(['welcome','finished'].includes(view))scene.drawLobby(view);else scene.draw(session.snapshot(),{hover,heading,sailing:!!voyage});}
 function text(id,value){const node=$(id);if(node.textContent!==String(value))node.textContent=value;}
 function setView(next){root.dataset.view=next;if(view!==next){view=next;options.onViewChange?.(next);}sync();}
 function sync(){
  if(!scene)return;
  root.dataset.viewportBlocked=String(small());
  root.dataset.urgent=String(!!session.task&&ANSWER_MS-session.task.elapsedMs<=WARNING_MS&&!session.motion&&!session.growth&&!voyage);
  for(const name of ['loading','welcome','result','error'])$(name).hidden=!(view===name||name==='result'&&view==='finished');
  const playing=['playing','paused'].includes(view);
  $('core').hidden=!playing;$('lobby').hidden=playing;
  $('sites').hidden=!playing;$('lives').hidden=!playing;
  $('boat-hit').hidden=!playing;$('move-whale').hidden=!playing;
  $('start').disabled=!canReplay||small();$('replay').disabled=!canReplay||small();
  $('random').hidden=!options.onRandom;$('random').disabled=!canRandom||small();
  $('lives').setAttribute('aria-label','还剩'+session.lives+'次机会');
  for(let i=0;i<MAX_LIVES;i++)$('lives').children[i].dataset.lost=String(i>=session.lives);
  // Controls keep ownership during recovery/animation. Ignored clicks must not
  // fall through to DSH merely because the current placement is still animating.
  for(const button of $('sites').children){
   const slot=Number(button.dataset.site),site=session.sites[slot];button.hidden=!site;button.disabled=!site;button.setAttribute('aria-label','补第'+(slot+1)+'处破口');
   if(site){const box=siteBox(site),drop=leakPoint(site.cells);Object.assign(button.style,{left:box.x+'px',top:box.y+'px'});Object.assign(button.firstChild.style,{left:(drop[0]*LAYOUT.cell+6)+'px',top:(drop[1]*LAYOUT.cell+10)+'px',animationDelay:-((site.x+site.y)*137%900)+'ms'});button.dataset.sealed=String(session.motion?.correct&&session.motion.slot===slot&&session.motion.elapsedMs>=CONTACT_MS);}
  }
 }
 function finish(){
  stopAnswer(false);stop();if(session.stats.built>best){best=session.stats.built;if(!options.qa)localStorage.setItem(bestKey,String(best));}
  text('result-value',session.stats.built);text('best-value',best);hover=null;setView('finished');render();pixelText?.flush();$('replay').focus({preventScroll:true});
 }
 function needed(){return recoveryUntil!==0||!!session?.motion||!!session?.growth||!!voyage;}
 function schedule(){if(raf===null&&presented&&!disposed&&!small()&&!grab&&view==='playing'&&needed())raf=requestAnimationFrame(frame);}
 function recover(){stopAnswer();stop();if(!presented||small()||view!=='playing')return;recoveryUntil=performance.now()+RECOVERY_MS;root.dataset.recovering='true';schedule();}
 function frame(){
  const now=performance.now();raf=null;if(disposed||!presented||small()||grab||view!=='playing')return;
  try{
   if(recoveryUntil){lastWall=now;if(now<recoveryUntil){schedule();return;}recoveryUntil=0;delete root.dataset.recovering;lastWall=now;}
   const delta=lastWall===null?0:now-lastWall;lastWall=now;
   if(delta>250){recover();return;}
   if(voyage){
    voyage.elapsedMs=Math.min(VOYAGE_MS,voyage.elapsedMs+delta);paintVoyage();
    if(voyage.elapsedMs===VOYAGE_MS){
     layout={x:voyage.to.x,y:voyage.to.y};voyage=null;completedVoyages++;$('core').style.transform='';$('core').style.left=layout.x+'px';$('core').style.top=layout.y+'px';
     delete $('core').dataset.voyaging;delete root.dataset.voyaging;position={x:(layout.x+LAYOUT.width/2)/width,y:(layout.y+LAYOUT.height/2)/height};session.land();sync();render();
    }
    if(needed())schedule();else{lastWall=null;armAnswer();}return;
   }
   const built=session.stats.built,revision=session.revision,changed=session.advance(delta);
   if(changed||session.revision!==revision){if(session.phase==='finished'){finish();return;}if(session.stats.built>built)beginVoyage();sync();}
   render();if(needed())schedule();else{lastWall=null;armAnswer();}
  }catch(error){fail(error);}
 }
 function fail(error){
  if(disposed)return;stopAnswer(false);stop();errors.push(error.stack??String(error));console.error(error);session?.pause();
  if(!$('error')){root.replaceChildren();const panel=document.createElement('p');panel.setAttribute('role','alert');panel.textContent=error.message;root.append(panel);view='error';options.onViewChange?.(view);return;}
  text('error-detail',error.message??String(error));setView('error');pixelText?.flush();
 }
 function clampPosition(x,y){return navigation.clampPosition(x,y,width,height);}
 function voyagePosition(){return voyage?voyagePose(voyage):{...layout,heading};}
 function setHeading(angle){const a=Math.round(angle/15)*15;if(a===heading)return;heading=a;$('core').style.setProperty('--heading',heading+'deg');render();}
 function paintVoyage(){if(!voyage)return;const p=voyagePosition();setHeading(p.heading);$('core').style.transform=`translate(${p.x-voyage.from.x}px,${p.y-voyage.from.y}px)`;}
 function beginVoyage(){const from={...layout,heading};voyage={from,to:voyageTarget(from,width,height,navRandom),elapsedMs:0};hover=null;press=null;root.dataset.voyaging='true';$('core').dataset.voyaging='true';}
 function placeCore(){
  if(voyage){voyage=fitVoyage(voyage,width,height);layout={x:voyage.from.x,y:voyage.from.y};$('core').style.left=layout.x+'px';$('core').style.top=layout.y+'px';paintVoyage();return;}
  const p=position?{x:position.x*width-LAYOUT.width/2,y:position.y*height-LAYOUT.height/2}:{x:(width-LAYOUT.width)/2,y:(height-LAYOUT.height)/2};
  layout=clampPosition(p.x,p.y);$('core').style.left=layout.x+'px';$('core').style.top=layout.y+'px';
 }
 function cancelDragFrame(){if(dragRaf!==null)cancelAnimationFrame(dragRaf);dragRaf=null;}
 function dragTransform(){dragRaf=null;if(!grab)return;const p=clampPosition(grab.x+grab.dx,grab.y+grab.dy);$('core').style.transform=`translate(${p.x-grab.x}px,${p.y-grab.y}px)`;}
 function endGrab(commit){
  if(!grab)return;cancelDragFrame();const p=commit?clampPosition(grab.x+grab.dx,grab.y+grab.dy):{x:grab.x,y:grab.y};grab=null;
  $('core').style.transform='';delete $('core').dataset.moving;
  layout=p;$('core').style.left=p.x+'px';$('core').style.top=p.y+'px';
  if(commit){position={x:(p.x+LAYOUT.width/2)/width,y:(p.y+LAYOUT.height/2)/height};if(!options.qa)localStorage.setItem(positionKey,JSON.stringify(position));}
  if(presented&&!small()&&session.phase==='running'){session.resume();recover();}
 }
 async function start(){
  if(!ready||disposed||pending||small()||!canReplay||!['welcome','finished'].includes(view))return false;
  pending=true;try{
   if(options.beforePlay&&await options.beforePlay()===false)return false;
   if(disposed||!presented||small())return false;
   stopAnswer(false);stop();const roundSeed=qaSetup?.seed??seed();session=new RepairSession({seed:roundSeed});session.start();navRandom=randomSource(roundSeed^0x9e3779b9);voyage=null;completedVoyages=0;answerWakeups=0;heading=0;$('core').style.setProperty('--heading','0deg');delete root.dataset.voyaging;delete $('core').dataset.voyaging;$('core').style.transform='';
   if(qaSetup?.lives)session.lives=qaSetup.lives;
   hover=null;press=null;recoveryUntil=0;delete root.dataset.recovering;
   setView('playing');render();pixelText?.flush();armAnswer();return true;
  }catch(error){fail(error);return false;}finally{pending=false;}
 }
 function clickControl(event){
  const button=event.target.closest('button');if(!button)return;
  if(event.detail!==0){const p=press;press=null;if(!p||p.button!==button||p.revision!==session.revision||!p.released){event.preventDefault();return;}}
  if(button.id==='start'||button.id==='replay'){void start();return;}
  if(button.id==='random'){if(!blocked()&&canRandom&&view==='finished')Promise.resolve(options.onRandom?.()).catch(fail);return;}
  if(button.id==='reload'){if(options.onReload)Promise.resolve(options.onReload()).catch(fail);return;}
  if(blocked()||view!=='playing'||!session.canAct())return;
  if(button.dataset.site===undefined)return;
  stopAnswer();if(!session.canAct()){sync();render();lastWall=performance.now();schedule();return;}
  const out=session.place(Number(button.dataset.site));hover=null;
  if(out.ok)$('announcement').textContent=out.correct?'补上了，这处不漏了。':'边缘没合上，看看亮起的破口。';
  sync();render();lastWall=performance.now();schedule();
 }
 function suspend(){
  presented=false;root.dataset.presented='false';stopAnswer();move?.cancel({untilRelease:true});endGrab(false);stop();session?.pause();press=null;hover=null;recoveryUntil=0;delete root.dataset.recovering;
  if(view==='playing')setView('paused');pixelText?.suspend();
 }
 async function present({resume=true,start:directStart=false}={}){
  if(disposed)return false;presented=true;root.dataset.presented='true';if(!ready)return false;
  width=host.clientWidth;height=host.clientHeight;placeCore();pixelText?.present();
  if(directStart&&view==='welcome')return start();
  if(view==='paused'&&resume&&!small()){session.resume();setView('playing');render();recover();}else{sync();render();armAnswer();}
  pixelText?.flush();return true;
 }
 function resize(){
  const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;
  stopAnswer();move?.cancel({untilRelease:true});endGrab(false);stop();session?.pause();width=w;height=h;hover=null;press=null;recoveryUntil=0;delete root.dataset.recovering;placeCore();
  if(presented&&!small()&&view==='playing'){session.resume();recover();}sync();render();pixelText?.flush();
 }
 function legends(){
  drawWood($('rule-brick').getContext('2d'),INTRO_PATCH.cells,12,8,12);
  const c=$('rule-sites').getContext('2d');c.fillStyle='#253d49';for(const [x,y]of rotateCells(INTRO_PATCH.cells,1))c.fillRect(12+x*12,8+y*12,12,12);
 }
 const initialization=(async()=>{
  const [markup,,font,whale]=await Promise.all([options.ui?options.ui.markup:fetch(new URL('./markup.html',import.meta.url)).then(r=>{if(!r.ok)throw Error('补船界面加载失败');return r.text();}),styleReady,face.load(),loadWhale(options)]);
  if(disposed){whale.image.close?.();return false;}
  document.fonts.add(font);root.innerHTML=markup;
  applyCopy(root,{'#welcome .rules>div:first-child span':copy.rules[0],'#welcome .rules>div:last-child span':copy.rules[1],'#start':copy.start,'#result-lead':copy.resultLead,'#result .number>span':copy.resultUnit,'#result .best>span:first-child':copy.bestLabel,'#replay':copy.replay,'#random':SHARED_COPY.next,'#loading p':copy.loading,'#error p:first-child':copy.loadError,'#reload':SHARED_COPY.reload});
  mountControlGuide(root,copy);
  session=new RepairSession();scene=new RepairScene($('scene'),whale,$('companion'),$('clock-occluder'));
  for(let i=0;i<MAX_LIVES;i++){
   const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 9 8');icon.setAttribute('aria-hidden','true');Object.assign(icon.style,{left:(LIFE_POINTS[i][0]-MAST.x+40-9)+'px',top:(LIFE_POINTS[i][1]-MAST.y+40-8)+'px'});
   for(const [name,d]of [['heart-edge','M0 1H1V0H4V1H5V0H8V1H9V4H8V5H7V6H6V7H5V8H4V7H3V6H2V5H1V4H0Z'],['heart-fill','M1 2H2V1H3V2H6V1H7V2H8V4H7V5H6V6H5V7H4V6H3V5H2V4H1Z'],['heart-glint','M2 2H3V3H2Z']]){const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('class',name);path.setAttribute('d',d);icon.append(path);} $('lives').append(icon);
  }
  $('boat-hit').style.clipPath=hullClip();
  const storedBest=localStorage.getItem(bestKey);if(storedBest!==null){const n=Number(storedBest);if(!Number.isSafeInteger(n)||n<0)throw Error('补船记录格式无效');best=n;}
  const storedPosition=localStorage.getItem(positionKey);if(storedPosition!==null){position=JSON.parse(storedPosition);if(!Number.isFinite(position.x)||!Number.isFinite(position.y)||position.x<0||position.x>1||position.y<0||position.y>1)throw Error('补船位置格式无效');}
  for(let i=0;i<5;i++){const b=document.createElement('button');b.type='button';b.dataset.site=i;const drop=document.createElement('span');drop.className='leak-drop';drop.setAttribute('aria-hidden','true');b.append(drop);Object.assign(b.style,{width:'46px',height:'46px'});$('sites').append(b);
   on(b,'pointerenter',()=>{if(!blocked()&&session.canAct()){hover=i;render();}});on(b,'pointerleave',()=>{if(hover===i){hover=null;render();}});
  }
  on(root,'pointerdown',e=>{const b=e.target.closest('button');if(e.button===0&&b&&b.id!=='move-whale')press={button:b,id:e.pointerId,revision:session.revision,released:false};});
  on(root,'pointerup',e=>{if(press?.id!==e.pointerId)return;const b=press.button,r=b.getBoundingClientRect();press.released=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});
  on(root,'pointercancel',()=>{press=null;});on(root,'click',clickControl);
  on(root,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();move.cancel({untilRelease:true});return;}if(e.key==='Enter'&&e.target.matches('button')&&blocked())e.preventDefault();});
  move=createMoveHandle($('move-whale'),{
   canMove:()=>!disposed&&ready&&(presented||frozenVisible)&&['playing',...(frozenVisible?['paused']:[])].includes(view)&&!small()&&!grab&&!recoveryUntil&&(frozenVisible?!session.motion&&!session.growth&&!session.needsLanding:session.canAct())&&!voyage,
   onGrab(){stopAnswer();stop();session.pause();hover=null;press=null;grab={...layout,dx:0,dy:0};},
   onActivate(){frozenDragged=frozenVisible;$('core').dataset.moving='true';},
   onMove(dx,dy){grab.dx=dx;grab.dy=dy;if(dragRaf===null)dragRaf=requestAnimationFrame(dragTransform);},
   onDrop(active,dx,dy){if(grab){grab.dx=dx;grab.dy=dy;}endGrab(active);},onCancel(){endGrab(false);},onTap(){},onError:fail
  });
  $('move-whale').dataset.gameResume='';
  on($('move-whale'),'click',event=>{if(!frozenVisible)return;event.preventDefault();event.stopImmediatePropagation();if(frozenDragged){frozenDragged=false;return;}void options.onResume();},true);
  const clockPath=Array.from({length:33},(_,i)=>{const a=Math.PI+i*Math.PI/32,x=32+Math.round(15*Math.cos(a))*2,y=34+Math.round(15*Math.sin(a))*2;return i?'H'+x+'V'+y:'M'+x+' '+y;}).join('');$('clock-track').setAttribute('d',clockPath);$('clock-progress').setAttribute('d',clockPath);
  legends();
  if(options.checkpoint){const saved=options.checkpoint;if(saved.version!==1)throw Error('Invalid G02 experience checkpoint');session=RepairSession.restore(saved.session);session.pause();position=saved.position;layout=saved.layout;voyage=saved.voyage;heading=saved.heading;completedVoyages=saved.completedVoyages;navRandom=randomSource(1);if(saved.navigation!==null)navRandom.restore(saved.navigation);$('core').style.setProperty('--heading',heading+'deg');if(voyage){root.dataset.voyaging='true';$('core').dataset.voyaging='true';}view=saved.view==='playing'?'paused':saved.view;}
  placeCore();pixelText=createPixelText(root);ready=true;setView(options.checkpoint?view:'welcome');if(view==='finished'){text('result-value',session.stats.built);text('best-value',best);}render();pixelText.flush();if(!presented)pixelText.suspend();
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);return true;
 })().catch(error=>{fail(error);return false;});
 function checkpoint(){if(!ready||errors.length)return null;return{version:1,view,session:session.checkpoint(),position,layout,voyage,heading,completedVoyages,navigation:navRandom?.getState()??null};}
 function setFrozen(active){frozenVisible=active;frozenDragged=false;}
 function snapshot(){return{ready,view,disposed,presented,recovering:recoveryUntil!==0,relocating:!!grab,voyaging:!!voyage,voyage:structuredClone(voyage),completedVoyages,viewportBlocked:small(),rafPending:raf!==null,dragRafPending:dragRaf!==null,answerTimerPending:answerTimer!==null,answerWakeups,answerRemainingMs:session?.task?Math.max(0,ANSWER_MS-session.task.elapsedMs-(answerStartedAt===null?0:performance.now()-answerStartedAt)):null,errors:[...errors],session:session?.snapshot()??null,scene:{drawCount:scene?.drawCount??drawsAtDispose??0,width:LAYOUT.width,height:LAYOUT.height,viewport:{width,height},position:voyagePosition()},best};}
 function configure({seed:fixedSeed=1,lives=MAX_LIVES}={}){
  if(!options.qa||!ready||!['welcome','finished'].includes(view))throw Error('QA setup requires a fresh round');
  new RepairSession({seed:fixedSeed});
  if(!Number.isInteger(lives)||lives<1||lives>MAX_LIVES)throw Error('Invalid QA lives');qaSetup={seed:fixedSeed,lives};
 }
 async function dispose(){
  if(disposed)return;disposed=true;presented=false;stopAnswer(false);move?.dispose();endGrab(false);stop();voyage=null;cancelDragFrame();resizeObserver?.disconnect();for(const remove of listeners)remove();
  await initialization;drawsAtDispose=scene?.drawCount;scene?.dispose();pixelText?.dispose();document.fonts.delete(face);shadow.replaceChildren();ready=false;
 }
 return{ready:initialization,snapshot,suspend,present,checkpoint,setFrozen,preview(){suspend();return ready;},paintStatic(){pixelText?.flush();},dispose,getRoot:()=>root,
  getRunState:()=>({view,hasRound:!!session&&session.phase!=='welcome'}),setAvailability(next){canReplay=next.canReplay;canRandom=next.canRandom;if(ready)sync();},...(options.qa?{configure}: {})};
}
