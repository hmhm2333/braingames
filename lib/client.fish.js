// Generated; 2D animation and bundled font.
window.__ModuleLoader__.load({id:'dsh-braingames/client.fish.js',factory:require=>{
const __defs=Object.create(null),__cache=Object.create(null);const __get=id=>__cache[id]??(__cache[id]=__defs[id]());
__defs["runtime/move-handle.mjs"]=()=>{
// Shared long-press gesture; each game owns placement and rendering.
const HOLD_TO_MOVE_MS=450;
function createMoveHandle(button,callbacks){
  let press=null,timer=null,tap=false,disposed=false,cancelledPointer=null;
  const listeners=[];
  const on=(name,fn)=>{button.addEventListener(name,fn);listeners.push(()=>button.removeEventListener(name,fn));};
  const eat=e=>{e.preventDefault();e.stopPropagation();};
  function releaseTail(){const id=cancelledPointer;cancelledPointer=null;if(id!==null&&button.hasPointerCapture(id))button.releasePointerCapture(id);}
  function release(keepCapture=false){
    const current=press;press=null;if(timer!==null)clearTimeout(timer);timer=null;
    delete button.dataset.holding;delete button.dataset.dragging;
    if(current&&button.hasPointerCapture(current.id)){if(keepCapture)cancelledPointer=current.id;else button.releasePointerCapture(current.id);}
    return current;
  }
  function cancel({untilRelease=false}={}){tap=false;if(!press){if(!untilRelease)releaseTail();return false;}release(untilRelease);if(!untilRelease)releaseTail();callbacks.onCancel();return true;}
  function fail(error){release();releaseTail();tap=false;callbacks.onError(error);}
  on('pointerdown',e=>{
    if(disposed||press||e.button!==0||e.isPrimary===false||!callbacks.canMove())return;
    eat(e);tap=false;releaseTail();press={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,active:false};
    try{
      const current=press;button.setPointerCapture(e.pointerId);button.dataset.holding='true';callbacks.onGrab();
      if(press!==current)return;
      timer=setTimeout(()=>{
        timer=null;if(press!==current)return;press.active=true;button.dataset.dragging='true';
        try{callbacks.onActivate();if(press===current)callbacks.onMove(current.lastX-current.x,current.lastY-current.y);}catch(error){fail(error);}
      },HOLD_TO_MOVE_MS);
    }catch(error){fail(error);}
  });
  on('pointermove',e=>{
    if(!press||press.id!==e.pointerId)return;eat(e);press.lastX=e.clientX;press.lastY=e.clientY;
    if(press.active)try{callbacks.onMove(e.clientX-press.x,e.clientY-press.y);}catch(error){fail(error);}
  });
  on('pointerup',e=>{
    if(cancelledPointer===e.pointerId){eat(e);releaseTail();return;}
    if(!press||press.id!==e.pointerId)return;eat(e);
    const current=release(),dx=e.clientX-current.x,dy=e.clientY-current.y,rect=button.getBoundingClientRect();
    tap=!current.active&&Math.hypot(dx,dy)<=6&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
    try{callbacks.onDrop(current.active,dx,dy);}catch(error){fail(error);}
  });
  on('pointercancel',()=>{cancel();});on('lostpointercapture',e=>{if(press?.id===e.pointerId||cancelledPointer===e.pointerId)cancel();});
  // Keep the original game-owned click; never replay it onto the task beneath.
  on('click',e=>{eat(e);const shortTap=tap;tap=false;if(shortTap)callbacks.onTap();});
  on('contextmenu',e=>{if(press)eat(e);});
  return{cancel,isPressed:()=>!!press,dispose(){if(disposed)return;disposed=true;cancel();for(const remove of listeners)remove();}};
}

return {HOLD_TO_MOVE_MS,createMoveHandle};
};
__defs["runtime/presentation.mjs"]=()=>{
// Three authored pixel-animation frames; wall time here never advances training.
const RECOVERY_MS=3*1000/16;
const playableSize=(width,height)=>width>=640&&height>=480;
const VERDICT_COLORS={edge:0xfff8e4,ink:0x263248,correct:0x94bbb5,incorrect:0xe5a2a1};
const VERDICT_TICK=[[-5,0],[-3,2],[-1,4],[1,2],[3,0],[5,-2],[7,-4]];
const VERDICT_CROSS=Array.from({length:5},(_,i)=>i-2).flatMap(i=>[-1,1].map(side=>[i*2,side*i*2]));

return {RECOVERY_MS,playableSize,VERDICT_COLORS,VERDICT_TICK,VERDICT_CROSS};
};
__defs["runtime/game-catalog.mjs"]=()=>{
// Game labels, rules and feedback shared by the standalone and bundled clients.
const SHARED_COPY={
  "appLabel": "dsh-braingames",
  "headerStart": "来一局",
  "headerContinue": "继续本局",
  "headerPlaying": "游戏中",
  "invite": "任务在跑，顺手来一局？",
  "inviteIdle": "歇一小会儿，来一局？",
  "inviteAccept": "来一局",
  "inviteDismiss": "先不玩",
  "selecting": "正在挑游戏",
  "chooseError": "没挑出来，再试下",
  "chooseRetry": "再挑一次",
  "chooseRandom": "随机开局",
  "retry": "重试",
  "discardSavedRound": "放弃本局，重新开始",
  "next": "换个玩",
  "reload": "重新加载",
  "freezeHint": "忙完点鲸鱼娘继续",
  "bestLabel": "最高记录",
  "viewportError": "当前游戏需要更大画面，请放大窗口后再试。"
};
const GAME_COPY={
  "rice-bubbles-g10": {
    "title": "吃白饭吐泡泡",
    "shortTitle": "接饭",
    "invite": "鱼饿了，帮我接两口饭？",
    "start": "开饭",
    "replay": "再吃一顿",
    "loading": "正在端碗过来",
    "loadError": "碗没端稳，重新加载下",
    "resultLead": "这顿坚持了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": {
      "device": "键盘",
      "key": "空格键",
      "action": "接食物"
    },
    "rules": [
      "裸露的食物",
      "单独的泡泡",
      "包着食物的泡泡",
      "红牌标出的食物"
    ],
    "ruleNote": "按空格只接裸露食物。空泡泡、包食物的泡泡、红牌画的食物都不按。",
    "pickyHint": "这顿忌口{food}，泡泡也别接。",
    "feedback": {
      "rice_caught": "稳稳接住。",
      "bubble_mistake": "误接泡泡了。",
      "bubble_pass": "放过泡泡了。",
      "rice_miss": "这口漏掉了。",
      "food_refused": "忌口的食物，放过去了。",
      "food_mistake": "这顿忌口这个，放下吧。",
      "interrupted": "游戏已暂停，当前食物不计入成绩。",
      "meal": "团好一颗饭球，收妥了。"
    }
  },
  "regulars-g04": {
    "title": "大肥鱼茶餐厅",
    "shortTitle": "上菜",
    "invite": "熟客上门了，帮我记下菜？",
    "start": "上菜",
    "replay": "再开一桌",
    "loading": "正在擦桌子",
    "loadError": "后厨卡住了，重新加载下",
    "resultLead": "本局完成了",
    "resultUnit": "单",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点菜品"
    },
    "rules": [
      "新点单要记牢",
      "没改口照旧单"
    ],
    "ruleNote": "等客人站定再上菜",
    "feedback": {
      "timeout": "这单慢了，客人空手走了。",
      "correct": "给{guest}的菜上对了。",
      "wrong": "{guest}退回了这份菜。",
      "lives": "还能失误 {lives} 次。",
      "last": "累计失误 {max} 次，送走这位就打烊。"
    }
  },
  "planks-g02": {
    "title": "忒修斯之渔船",
    "shortTitle": "补船",
    "invite": "船又漏了，搭把手呗？",
    "start": "补船",
    "replay": "再补一程",
    "loading": "正在找木板",
    "loadError": "木板卡住了，重新加载下",
    "resultLead": "这趟补好了",
    "resultUnit": "块船板",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点破口"
    },
    "rules": [
      "木板可旋转对齐",
      "点匹配的破口"
    ],
    "feedback": {
      "correct": "补好了，这处不再漏水。",
      "wrong": "边缘没对齐，留意发亮的破口。",
      "lives": "还剩 {lives} 次机会"
    }
  },
  "balloon-winds": {
    "title": "大肥鱼热气球",
    "shortTitle": "摘星",
    "invite": "风正好，去摘一颗星？",
    "start": "出发摘星",
    "replay": "再飞一趟",
    "loading": "正在给气球充气",
    "loadError": "气球没准备好，重新加载下",
    "resultLead": "这趟摘到了",
    "resultUnit": "颗星",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键·右键",
      "action": "加风·减风"
    },
    "rules": [
      "左键加云坐标",
      "右键减云坐标"
    ],
    "moveNote": "长按移动气球会换云",
    "feedback": {
      "controls": "左键加风，右键减风",
      "edge": "往这吹会出界",
      "cold": "气囊冷却了",
      "spent": "风力用尽",
      "timeout": "气囊冷透，扣一颗心",
      "empty": "风力耗尽，扣一颗心",
      "add": "云飞向气球，左键加云坐标",
      "subtract": "云飞向气球，右键减云坐标",
      "moved": "气球飘至 {point}，新云朵已浮现",
      "needsWind": "要借风力去摘星星",
      "unreachable": "剩余风力不够从这吹到星星",
      "star": "摘得星星，抵达 {point}",
      "landed": "停在 {point}"
    }
  },
  "fish-leap": {
    "title": "快逮住小金鱼",
    "shortTitle": "捞鱼",
    "invite": "金鱼要变身了，帮我捞一条？",
    "start": "开捞",
    "replay": "再捞一局",
    "loading": "正在准备网兜",
    "loadError": "网兜没准备好，重新加载下",
    "resultLead": "本局存活了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点金鱼"
    },
    "rules": [
      "同批入水先观察\n等普通鱼游走",
      "普通鱼走不扣灯\n漏变身鱼会扣灯"
    ],
    "ruleNote": "冷却时记好入水顺序，专捞久留不走的鱼",
    "netCooling": "网兜冷却中",
    "netReady": "网兜就绪",
    "netLoss": "漏掉变身鱼扣灯",
    "netCasting": "正在下网",
    "feedback": {
      "evolving": "赶在变身前捞起了金鱼。",
      "ordinary": "捞到了普通金鱼。"
    }
  }
};
const GAME_METADATA=[
  {
    "id": "regulars-g04",
    "icon": "regulars",
    "trainingProcesses": [
      "工作记忆更新",
      "人物与偏好绑定",
      "延迟回忆"
    ],
    "interaction": "鼠标单击菜品",
    "description": "记住每位小动物最新的点单；未重新点单时按旧单上菜，新订单替换旧偏好。"
  },
  {
    "id": "rice-bubbles-g10",
    "icon": "rice",
    "trainingProcesses": [
      "反应抑制",
      "选择性注意",
      "规则监测"
    ],
    "interaction": "按空格或不按键",
    "description": "随机位置竖直落下食物与泡泡，按空格接裸露食物。泡泡、包着食物的泡泡和红牌标出的食物都要放过。持续答对会逐步加快节奏并增加干扰。"
  },
  {
    "id": "planks-g02",
    "icon": "planks",
    "trainingProcesses": [
      "心理旋转",
      "形状匹配",
      "空间表征"
    ],
    "interaction": "鼠标单击破口",
    "description": "想象手持木板旋转后的形状，从船体多个破口中选出匹配处；点击前不显示旋转过程。"
  },
  {
    "id": "balloon-winds",
    "icon": "balloon",
    "trainingProcesses": [
      "带符号心算",
      "横纵坐标差计算",
      "多步位移规划"
    ],
    "interaction": "鼠标左键加位移，右键减位移",
    "description": "根据热气球与星星的坐标差，挑选云朵组合位移。左键加坐标，右键减坐标，逐步飞抵目标位置。"
  },
  {
    "id": "fish-leap",
    "icon": "goldfish",
    "trainingProcesses": [
      "多目标追踪",
      "进场顺序记忆",
      "行动优先级判断"
    ],
    "interaction": "鼠标单击金鱼",
    "description": "追踪外观相同的金鱼进场顺序。普通鱼游走不扣灯，部分鱼停留久了会变身，漏掉扣灯；趁网兜就绪优先捞停留最久的变身鱼。"
  }
].map(game=>({...game,name:GAME_COPY[game.id].title,hint:GAME_COPY[game.id].invite,action:GAME_COPY[game.id].start}));

return {SHARED_COPY,GAME_COPY,GAME_METADATA};
};
__defs["runtime/apply-copy.mjs"]=()=>{
function applyCopy(root,labels){
  for(const [selector,text]of Object.entries(labels)){
    const node=root.querySelector(selector);if(!node)throw Error('Missing UI copy target '+selector);node.textContent=text;
  }
}

return {applyCopy};
};
__defs["runtime/control-guide.mjs"]=()=>{
// Shared input instructions for the welcome panels, inside each game's shadow.
function mountControlGuide(root, {title, control: {device, key, action}}) {
  for (const heading of root.querySelectorAll('[data-braingames-title]')) heading.textContent = title;
  const guide = root.querySelector('[data-braingames-controls]');
  const labels = [['span', device], ['kbd', key], ['span', action]];
  guide.replaceChildren(...labels.map(([tag, text]) => {
    const label = document.createElement(tag);
    label.dataset.pixelText = '';
    label.textContent = text;
    return label;
  }));

  const style = document.createElement('style');
  style.textContent = `
    #game-title, #game-result-title {
      margin: 0 0 12px; font: inherit; text-align: center; color: var(--ink);
    }
    [data-braingames-controls] {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin: 0 0 12px; line-height: 24px; white-space: nowrap;
    }
    [data-braingames-controls] kbd {
      box-sizing: border-box; width: auto; height: auto; padding: 0 6px;
      font: inherit; color: #263248; background: #fff8e4;
      border: 2px solid #9f8355; border-radius: 0; box-shadow: 0 2px 0 #9f8355;
    }
  `;
  root.prepend(style);
}

return {mountControlGuide};
};
__defs["runtime/pixel-text.mjs"]=()=>{
// Shared pixel labels keep their real text for layout and accessibility.
// Only their painted glyphs are replaced by a native 12px, one-bit bitmap.
function createPixelText(root,{alphaThreshold=48}={}){
  let pending=null,disposed=false,presented=true;
  function paint(label){
    if(!label.getClientRects().length||!label.firstChild)return;
    const style=getComputedStyle(label),scale=parseFloat(style.fontSize)/12;
    const box=label.getBoundingClientRect(),borderX=parseFloat(style.borderLeftWidth),borderY=parseFloat(style.borderTopWidth);
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(label.clientWidth/scale);canvas.height=Math.ceil(label.clientHeight/scale);
    if(!canvas.width||!canvas.height)return;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.font='12px '+style.fontFamily;ctx.fillStyle=style.color;ctx.textBaseline='alphabetic';
    const glyph=ctx.measureText('饭'),lines=[];
    const node=label.firstChild,range=document.createRange();
    let offset=0;
    for(const char of node.textContent){
      range.setStart(node,offset);offset+=char.length;range.setEnd(node,offset);
      const rect=range.getBoundingClientRect(),last=lines.at(-1);
      if(last&&Math.abs(last.top-rect.top)<1)last.text+=char;
      else lines.push({text:char,left:rect.left,top:rect.top,height:rect.height});
    }
    for(const line of lines){
      const x=Math.round((line.left-box.left-borderX)/scale);
      const y=Math.round((line.top-box.top-borderY+line.height/2)/scale+(glyph.actualBoundingBoxAscent-glyph.actualBoundingBoxDescent)/2);
      ctx.fillText(line.text,x,y);
    }
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    // This bundled serif has thin anti-aliased strokes at 12px. Preserve them
    // when quantizing to one bit (128 erased most of the Chinese strokes).
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=alphaThreshold?255:0;
    ctx.putImageData(pixels,0,0);
    label.style.setProperty('--pixel-label','url("'+canvas.toDataURL()+'")');
    label.style.setProperty('--pixel-label-size',canvas.width*scale+'px '+canvas.height*scale+'px');
    label.dataset.pixelReady='true';
  }
  function repaint(){
    if(disposed||!presented||pending!==null)return;
    pending=requestAnimationFrame(()=>{
      pending=null;
      for(const label of root.querySelectorAll('[data-pixel-text]'))paint(label);
    });
  }
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.type!=='attributes'||r.attributeName==='hidden'||r.target===root))repaint();
  });
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','style']});
  const resize=new ResizeObserver(repaint);resize.observe(root);
  const events=['pointerover','pointerout','focusin','focusout'];
  for(const event of events)root.addEventListener(event,repaint);
  repaint();
  return{flush(){if(disposed)return;if(pending!==null)cancelAnimationFrame(pending);pending=null;for(const label of root.querySelectorAll('[data-pixel-text]'))paint(label);},suspend(){presented=false;if(pending!==null)cancelAnimationFrame(pending);pending=null;},present(){presented=true;repaint();},dispose(){disposed=true;observer.disconnect();resize.disconnect();for(const event of events)root.removeEventListener(event,repaint);if(pending!==null)cancelAnimationFrame(pending);}};
}

return {createPixelText};
};
__defs["runtime/random-state.mjs"]=()=>{
// Mulberry32, with a compact state for a page-refresh checkpoint.
function createRandom(seed,salt=0){
  let value=(seed^salt)>>>0;
  const next=()=>{
    value=(value+0x6d2b79f5)>>>0;
    let n=Math.imul(value^value>>>15,1|value);n^=n+Math.imul(n^n>>>7,61|n);
    return((n^n>>>14)>>>0)/4294967296;
  };
  next.getState=()=>value;
  next.restore=state=>{if(!Number.isInteger(state)||state<0||state>0xffffffff)throw Error('Invalid random checkpoint');value=state;};
  return next;
}

return {createRandom};
};
__defs["games/fish-leap/difficulty.mjs"]=()=>{
const NET_CD_MS = 600;
const EVOLUTION_MS = 12500;
const TIER_MIN_MS = 37000;
const OPENING_FISH = 3;

const TIER_COUNT = 12;

function interpolateRange(start, end, progress) {
  return start.map((value, i) => Math.round(value + (end[i] - value) * progress));
}

const TIERS = Array.from({length: TIER_COUNT}, (_, index) => {
  const progress = index / (TIER_COUNT - 1);
  if (index === TIER_COUNT - 1) {
    return {birth: [1250, 1700], ordinaryStay: [8900, 10900], evolutionWait: [5800, 7100]};
  }
  return {
    birth: interpolateRange([2100, 2800], [1250, 1700], progress),
    ordinaryStay: interpolateRange([6200, 8500], [8900, 11100], progress),
    evolutionWait: interpolateRange([9000, 10300], [5600, 6900], progress),
  };
});

return {NET_CD_MS,EVOLUTION_MS,TIER_MIN_MS,OPENING_FISH,TIERS};
};
__defs["games/fish-leap/core.mjs"]=()=>{
const {createRandom}=__get("runtime/random-state.mjs");
const {NET_CD_MS, EVOLUTION_MS, TIER_MIN_MS, OPENING_FISH, TIERS}=__get("games/fish-leap/difficulty.mjs");
const STARTING_LIVES = 3;
const ACTOR_SCALE = 1.42;
const FISH_SCALE = 1.28;
const FISH_HIT_GRACE_MS = 200;
const POSE_MS = 1000 / 16;
const EVOLUTION_ANIMATION_MS = 28 * POSE_MS;
const DEPARTURE_ANIMATION_MS = 320;
const CONTACT_FRAME = 4;
const SCOOP_FRAMES = 12;
const REACTION_FRAMES = 12;
const MIN_VIEW = {width: 320, height: 400};

const ACTOR_SIDE_ROOM = Math.ceil(48 * ACTOR_SCALE);
const ACTOR_DRAG_SIDE_ROOM = Math.ceil(50 * ACTOR_SCALE);
const FISH_EDGE_INSET = 34;
const ACTOR_HEAD_ROOM = 108;
const ACTOR_FOOT_ROOM = 36;
const STEP_MS = 1000 / 120;
const SCOOP_MS = POSE_MS * SCOOP_FRAMES;
const REACTION_MS = POSE_MS * REACTION_FRAMES;
const CONTACT_MS = POSE_MS * CONTACT_FRAME;
const RUN_START_MS = 125;
const RUN_STOP_MS = 150;
const RUN_CYCLE_FRAMES = 8;
const TURN_DELAYS_MS = [900, 2100];
const TURN_TIMES_MS = [200, 350];
const RANDOM_STREAMS = {arrivalRandom: 0xf5a261, evolutionRandom: 0x414f25, lifetimeRandom: 0x52ade1, pathRandom: 0xbac164};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const ease = amount => amount * amount * (3 - 2 * amount);
const direction = angle => Math.cos(angle) < 0 ? 'left' : 'right';
const radians = degrees => degrees * Math.PI / 180;

function sampleInteger(random, [min, max]) {
  return min + Math.floor(random() * (max - min + 1));
}

function boundsFor(width, height) {
  const left = Math.min(FISH_EDGE_INSET, width / 2);
  const top = Math.min(ACTOR_HEAD_ROOM, height / 2);
  return {left, right: width - left, top, bottom: Math.max(top, height - ACTOR_FOOT_ROOM - 4)};
}

function speedFor({left, right, top, bottom}) {
  const shortSide = Math.min(right - left, bottom - top);
  return clamp(112 * Math.sqrt(shortSide / 720), 82, 148);
}

function actorStart(width, height) {
  return {x: Math.max(width / 2, width - 82), y: Math.max(height / 2, height - ACTOR_FOOT_ROOM),
    direction: 'left'};
}

function clampActor(x, y, width, height) {
  const side = Math.min(ACTOR_DRAG_SIDE_ROOM, width / 2);
  return {x: clamp(x, side, width - side), y: clamp(y, ACTOR_HEAD_ROOM, height - ACTOR_FOOT_ROOM)};
}

function rescale(value, oldMin, oldMax, min, max) {
  const progress = oldMax > oldMin ? (value - oldMin) / (oldMax - oldMin) : .5;
  return lerp(min, max, clamp(progress, 0, 1));
}

function interpolatePoint(from, to, amount) {
  return {x: lerp(from.x, to.x, amount), y: lerp(from.y, to.y, amount)};
}

function reflectHeading(angle, hitX, hitY) {
  if (hitX) angle = Math.PI - angle;
  if (hitY) angle = -angle;
  return angle;
}

class FishSchool {
  time = 0;
  lives = STARTING_LIVES;
  fish = [];
  effects = [];
  phase = 'playing';
  readyAt = 0;
  nextId = 0;
  finishAt = Infinity;
  frozenAt = Infinity;
  savedInTier = false;
  tierStarted = 0;
  capture = null;

  constructor(width, height, {
    seed = Math.floor(Math.random() * 2 ** 32),
    tier = 0,
    netOffsets,
    saved,
  }) {
    this.netOffsets = netOffsets;
    for (const [name, salt] of Object.entries(RANDOM_STREAMS)) this[name] = createRandom(seed, salt);
    if (saved) {
      this.restore(saved);
      if (width !== this.width || height !== this.height) this.resize(width, height);
      return;
    }
    this.width = width;
    this.height = height;
    this.bounds = boundsFor(width, height);
    this.speed = speedFor(this.bounds);
    this.tier = tier;
    this.actor = actorStart(width, height);
    const spec = TIERS[this.tier];
    const firstEvolver = sampleInteger(this.evolutionRandom, [0, OPENING_FISH - 1]);
    for (let index = 0; index < OPENING_FISH; index++) {
      this.addFish(spec, index === firstEvolver);
    }
    this.birthAt = sampleInteger(this.arrivalRandom, spec.birth);
  }

  checkpoint() {
    const {width, height, tier, time, lives, fish, effects, phase, readyAt, nextId,
      birthAt, evolutionEligibleAt, tierStarted, savedInTier, actor, capture, finishAt, frozenAt} = this;
    const random = Object.fromEntries(Object.keys(RANDOM_STREAMS).map(name => [name, this[name].getState()]));
    const state = {tier, time, lives, fish, effects, phase, readyAt, nextId, birthAt, evolutionEligibleAt,
      tierStarted, savedInTier, actor, capture, finishAt: Number.isFinite(finishAt) ? finishAt : null,
      frozenAt: Number.isFinite(frozenAt) ? frozenAt : null};
    return {version: 1, width, height, state: structuredClone(state), random};
  }

  restore(saved) {
    const {version, width, height, state, random} = saved;
    if (version !== 1 || !(width >= MIN_VIEW.width && height >= MIN_VIEW.height) ||
      ![width, height].every(Number.isFinite) || !state || !random) throw Error('捞鱼存档格式无效');
    const {tier, time, lives, fish, effects, phase, readyAt, nextId, birthAt, evolutionEligibleAt,
      tierStarted, savedInTier, actor, capture, finishAt, frozenAt} = structuredClone(state);
    if (!Number.isInteger(tier) || !TIERS[tier] || !Number.isInteger(lives) ||
      lives < 0 || lives > STARTING_LIVES || !['playing', 'settling', 'ended'].includes(phase) ||
      ![time, readyAt, nextId, birthAt, evolutionEligibleAt, tierStarted, actor?.x, actor?.y].every(Number.isFinite) ||
      !Array.isArray(fish) || !Array.isArray(effects) ||
      (phase === 'playing' ? lives === 0 || birthAt <= time || finishAt !== null || frozenAt !== null ||
        fish.some(item => !Number.isFinite(item.deadline) || (!item.locked && item.deadline <= time))
        : lives !== 0 || !Number.isFinite(finishAt) || !Number.isFinite(frozenAt) ||
          frozenAt > time || finishAt < time || (phase === 'ended' && finishAt !== time))) {
      throw Error('捞鱼存档状态无效');
    }
    if (capture?.fish?.locked) {
      capture.fish = fish.find(item => item.id === capture.fish.id && item.locked);
      if (!capture.fish || !(capture.contactAt > time)) throw Error('捞鱼存档动作无效');
    }
    if (capture && (!capture.fish || ![capture.scoopAt, capture.contactAt, capture.reactionAt, capture.end].every(Number.isFinite) ||
      capture.end <= time)) throw Error('捞鱼存档动作无效');
    for (const name of Object.keys(RANDOM_STREAMS)) this[name].restore(random[name]);
    Object.assign(this, {width, height, tier, time, lives, fish, effects, phase, readyAt, nextId, birthAt,
      evolutionEligibleAt, tierStarted, savedInTier, actor, capture,
      finishAt: finishAt ?? Infinity, frozenAt: frozenAt ?? Infinity});
    this.bounds = boundsFor(width, height);
    this.speed = speedFor(this.bounds);
  }

  get netRemaining() {
    return Math.max(0, this.readyAt - this.time);
  }

  get swimTime() {
    return Math.min(this.frozenAt, this.time);
  }

  get reaction() {
    if (!this.capture || this.time < this.capture.reactionAt) return null;
    return this.capture.fish.evolves ? 'evolving' : 'ordinary';
  }

  resize(width, height) {
    const old = this.bounds;
    const next = boundsFor(width, height);
    const resizeFish = fish => {
      fish.x = rescale(fish.x, old.left, old.right, next.left, next.right);
      fish.y = rescale(fish.y, old.top, old.bottom, next.top, next.bottom);
    };
    const resizeActor = actor => {
      const side = Math.min(ACTOR_SIDE_ROOM, width / 2);
      actor.x = clamp(rescale(actor.x, 0, this.width, 0, width), side, width - side);
      actor.y = clamp(rescale(actor.y, 0, this.height, 0, height), next.top, Math.max(next.top, height - ACTOR_FOOT_ROOM));
    };
    for (const fish of this.fish) resizeFish(fish);
    for (const effect of this.effects) resizeFish(effect);
    resizeActor(this.actor);
    if (this.capture) {
      resizeActor(this.capture.from);
      resizeActor(this.capture.approach);
      if (!this.capture.fish.locked) resizeFish(this.capture.fish);
    }
    this.width = width;
    this.height = height;
    this.bounds = next;
    this.speed = speedFor(next);
    this.updateActor();
  }

  scoop(id) {
    if (this.phase !== 'playing' || this.capture || this.netRemaining) return false;
    const fish = this.fish.find(item => item.id === id);
    if (!fish || fish.deadline <= this.time) return false;
    const side = this.scoopSide(fish);
    const [netX, netY] = this.netOffsets[side][CONTACT_FRAME];
    const distance = Math.hypot(fish.x - netX - this.actor.x, fish.y - netY - this.actor.y);
    const diagonal = Math.hypot(this.width, this.height);
    const chaseSpeed = clamp(diagonal * .70, 520, 1100);
    const chaseMs = clamp(distance / chaseSpeed * 1000 + 130, 360, 1400);
    fish.locked = true;
    if (fish.evolves) this.savedInTier = true;
    const reactionAt = this.time + chaseMs + SCOOP_MS;
    this.capture = {
      fish,
      from: {...this.actor},
      approach: {...this.actor},
      start: this.time,
      scoopAt: this.time + chaseMs,
      contactAt: this.time + chaseMs + CONTACT_MS,
      reactionAt,
      end: reactionAt + REACTION_MS,
      side,
    };
    this.readyAt = this.capture.end + NET_CD_MS;
    this.updateActor();
    return true;
  }

  advance(delta) {
    const until = this.time + delta;
    while (this.phase === 'playing' && this.time < until) {
      let departureAt = Infinity;
      for (const fish of this.fish) {
        if (!fish.locked) departureAt = Math.min(departureAt, fish.deadline);
      }
      const contactAt = this.capture?.fish.locked ? this.capture.contactAt : Infinity;
      const scoopAt = this.capture && this.capture.scoopAt > this.time ? this.capture.scoopAt : Infinity;
      const captureEnd = this.capture?.end ?? Infinity;
      const next = Math.min(until, this.time + STEP_MS, this.birthAt, departureAt, scoopAt, contactAt, captureEnd);
      this.swim(next);
      this.time = next;
      this.resolveCapture();
      if (next === departureAt) this.resolveDepartures();
      if (this.phase === 'playing' && next === this.birthAt) this.spawn();
    }
    if (this.phase === 'settling') {
      if (this.capture?.fish.locked && until >= this.capture.contactAt) {
        this.time = this.capture.contactAt;
        this.resolveCapture();
      }
      this.time = Math.min(until, this.finishAt);
      this.resolveCapture();
      if (this.time === this.finishAt) this.phase = 'ended';
    }
    this.effects = this.effects.filter(effect => this.time < effect.at + effect.duration);
  }

  resolveDepartures() {
    const expired = this.fish.filter(fish => !fish.locked && fish.deadline === this.time);
    for (const fish of expired) {
      this.fish.splice(this.fish.indexOf(fish), 1);
      const duration = fish.evolves ? EVOLUTION_ANIMATION_MS : DEPARTURE_ANIMATION_MS;
      this.effects.push({...fish, kind: fish.evolves ? 'evolution' : 'leave', at: this.time, duration});
      if (fish.evolves) this.lives -= 1;
      if (this.lives === 0) {
        this.phase = 'settling';
        this.frozenAt = this.time;
        this.finishAt = Math.max(this.time + EVOLUTION_ANIMATION_MS, this.capture?.end ?? 0) + FISH_HIT_GRACE_MS;
        break;
      }
    }
  }

  resolveCapture() {
    if (!this.capture) return;
    this.updateActor();
    const {fish, contactAt, end} = this.capture;
    if (fish.locked && this.time >= contactAt) {
      this.fish.splice(this.fish.indexOf(fish), 1);
      fish.locked = false;
    }
    if (this.time >= end) this.capture = null;
  }

  spawn() {
    if (this.tier < TIERS.length - 1 && this.time - this.tierStarted >= TIER_MIN_MS && this.savedInTier) {
      this.tier += 1;
      this.tierStarted = this.time;
      this.savedInTier = false;
    }
    const spec = TIERS[this.tier];
    this.addFish(spec, this.time >= this.evolutionEligibleAt);
    this.birthAt = this.time + sampleInteger(this.arrivalRandom, spec.birth);
  }

  addFish(spec, evolves) {
    const duration = evolves ? EVOLUTION_MS : sampleInteger(this.lifetimeRandom, spec.ordinaryStay);
    if (evolves) {
      this.evolutionEligibleAt = this.time + sampleInteger(this.evolutionRandom, spec.evolutionWait);
    }

    const {left, right, top, bottom} = this.bounds;
    let location;
    let separation = -1;
    for (let attempt = 0; attempt < 6; attempt++) {
      const x = lerp(left, right, this.pathRandom());
      const y = lerp(top, bottom, this.pathRandom());
      const nearest = Math.min(...this.fish.map(fish => Math.hypot(fish.x - x, fish.y - y)));
      if (nearest > separation) {
        location = {x, y};
        separation = nearest;
      }
      if (separation >= 90) break;
    }

    this.fish.push({
      ...location,
      id: this.nextId++,
      born: this.time,
      deadline: this.time + duration,
      evolves,
      locked: false,
      angle: this.pathRandom() * Math.PI * 2,
      turn: null,
      nextTurn: this.time + sampleInteger(this.pathRandom, TURN_DELAYS_MS),
    });
  }

  swim(next) {
    const seconds = (next - this.time) / 1000;
    const {left, right, top, bottom} = this.bounds;
    for (const fish of this.fish) {
      if (!fish.turn && next >= fish.nextTurn) {
        const sign = this.pathRandom() < .5 ? -1 : 1;
        const angle = radians(sampleInteger(this.pathRandom, [20, 95]));
        const duration = sampleInteger(this.pathRandom, TURN_TIMES_MS);
        fish.turn = {from: fish.angle, to: fish.angle + sign * angle, at: fish.nextTurn, duration};
        fish.nextTurn += sampleInteger(this.pathRandom, TURN_DELAYS_MS);
      }
      if (fish.turn) {
        const {from, to, at, duration} = fish.turn;
        const progress = clamp((next - at) / duration, 0, 1);
        fish.angle = lerp(from, to, ease(progress));
        if (progress === 1) fish.turn = null;
      }

      const x = fish.x + Math.cos(fish.angle) * this.speed * seconds;
      const y = fish.y + Math.sin(fish.angle) * this.speed * seconds;
      const hitX = x < left || x > right;
      const hitY = y < top || y > bottom;
      if (hitX || hitY) {
        const inside = reflectHeading(fish.angle, hitX, hitY);
        const inward = hitX ? (x < left ? 0 : Math.PI) : (y < top ? Math.PI / 2 : -Math.PI / 2);
        const veer = radians(sampleInteger(this.pathRandom, [-19, 19]));
        const signX = x < left ? 1 : -1;
        const signY = y < top ? 1 : -1;
        const turned = inside + veer;
        fish.angle = (!hitX || Math.cos(turned) * signX > .12) && (!hitY || Math.sin(turned) * signY > .12)
          ? turned
          : hitX && hitY ? Math.atan2(signY, signX) : inward + veer;
        fish.turn = null;
      }
      fish.x = clamp(x, left, right);
      fish.y = clamp(y, top, bottom);
    }
  }

  updateActor() {
    const capture = this.capture;
    if (!capture) return;
    if (this.time === capture.scoopAt) capture.side = this.scoopSide(capture.fish, capture.side);
    const {fish, from, start, scoopAt, contactAt, side} = capture;
    const [netX, netY] = this.netOffsets[side][CONTACT_FRAME];
    const aim = {x: fish.x - netX, y: fish.y - netY};
    if (this.time < scoopAt) {
      const elapsed = this.time - start;
      const total = scoopAt - start;
      const ramp = Math.min(1, elapsed / RUN_START_MS);
      const braking = Math.min(1, (total - elapsed) / RUN_STOP_MS);
      const accelerate = RUN_START_MS * (ramp * ramp / 2);
      const stride = Math.max(0, Math.min(elapsed, total - RUN_STOP_MS) - RUN_START_MS);
      const decelerate = elapsed > total - RUN_STOP_MS ? RUN_STOP_MS * (1 - braking * braking) / 2 : 0;
      const progress = clamp((accelerate + stride + decelerate) / (total - (RUN_START_MS + RUN_STOP_MS) / 2), 0, 1);
      const inset = Math.min(ACTOR_SIDE_ROOM, this.width / 2);
      const top = this.bounds.top;
      const to = {
        x: clamp(aim.x + Math.cos(fish.angle) * this.speed * .17, inset, this.width - inset),
        y: clamp(aim.y + Math.sin(fish.angle) * this.speed * .17, top, Math.max(top, this.height - ACTOR_FOOT_ROOM)),
      };
      const position = interpolatePoint(from, to, progress);
      const movedX = position.x - this.actor.x;
      if (Math.abs(movedX) >= .08) this.actor.direction = movedX < 0 ? 'left' : 'right';
      Object.assign(this.actor, position);
      capture.approach = {...this.actor};
    } else if (this.time <= contactAt) {
      const progress = ease(clamp((this.time - scoopAt) / CONTACT_MS, 0, 1));
      Object.assign(this.actor, interpolatePoint(capture.approach, aim, progress), {direction: side});
    }
  }

  scoopSide(fish, fallback = fish.x >= this.actor.x ? 'right' : 'left') {
    const edge = Math.min(this.width / 2, 94 * ACTOR_SCALE + this.speed * CONTACT_MS / 1000);
    if (fish.x < edge) return 'left';
    if (fish.x > this.width - edge) return 'right';
    return fallback;
  }

  actorPose() {
    if (!this.capture) return {clip: 'idle-' + this.actor.direction, index: 0};
    const {start, scoopAt, side, contactAt, reactionAt} = this.capture;
    if (this.time < scoopAt) {
      const elapsed = this.time - start;
      return {clip: 'run-' + this.actor.direction, index: Math.floor(elapsed / POSE_MS) % RUN_CYCLE_FRAMES};
    }
    const reaction = this.reaction;
    if (reaction) {
      const index = Math.min(REACTION_FRAMES - 1, Math.floor((this.time - reactionAt) / POSE_MS));
      return {clip: 'react-' + reaction + '-' + side, index};
    }
    const frame = Math.floor((this.time - scoopAt) / POSE_MS);
    const index = this.time < contactAt ? clamp(frame, 0, CONTACT_FRAME - 1)
      : clamp(frame, CONTACT_FRAME, SCOOP_FRAMES - 1);
    return {clip: 'scoop-' + side, index};
  }
}

return {STARTING_LIVES,ACTOR_SCALE,FISH_SCALE,FISH_HIT_GRACE_MS,POSE_MS,EVOLUTION_ANIMATION_MS,DEPARTURE_ANIMATION_MS,CONTACT_FRAME,SCOOP_FRAMES,REACTION_FRAMES,MIN_VIEW,clamp,lerp,actorStart,clampActor,FishSchool};
};
__defs["games/fish-leap/scene.mjs"]=()=>{
const {ACTOR_SCALE, FISH_SCALE, POSE_MS, STARTING_LIVES, clamp, lerp}=__get("games/fish-leap/core.mjs");
const {NET_CD_MS}=__get("games/fish-leap/difficulty.mjs");
const FISH_CENTER_OFFSET = 4;
const HIT_HALF_WIDTH = 48;
const HIT_HALF_HEIGHT = 32;
const FULL_CIRCLE = Math.PI * 2;
const NET_PIXELS = [
  '...#####...', '..#..#..#..', '.#.#.#.#.#.', '.#..#.#..#.', '..#######..',
  '.....#.....', '....#......', '...#.......', '..#........', '..#........',
];

async function loadMotion({manifest, loadAtlas} = {}) {
  if (manifest) return {...manifest, image: await loadAtlas(manifest.image)};
  const image = new Image();
  image.src = new URL('./assets/motion.png', "braingames:/scene.mjs").href;
  const [index] = await Promise.all([
    fetch(new URL('./assets/motion.json', "braingames:/scene.mjs")).then(response => {
      if (!response.ok) throw Error('动画索引加载失败');
      return response.json();
    }),
    image.decode(),
  ]);
  return {...index, image};
}

function guideFrame(ctx, art, clip, index, x, y, maxWidth, maxHeight) {
  const [sx, sy, width, height] = art.clips[clip].at(index).rect;
  const scale = Math.min(maxWidth / width, maxHeight / height);
  ctx.drawImage(art.image, sx, sy, width, height, x - Math.round(width * scale / 2),
    y - Math.round(height * scale / 2), Math.round(width * scale), Math.round(height * scale));
}

function drawRuleArt(scoop, evolution, art) {
  const net = scoop.getContext('2d');
  net.imageSmoothingEnabled = false;
  guideFrame(net, art, 'scoop-right', art.contactFrame, 56, 31, 98, 58);
  const change = evolution.getContext('2d');
  change.imageSmoothingEnabled = false;
  guideFrame(change, art, 'swim', 0, 22, 32, 38, 24);
  change.fillStyle = '#9f8355';
  change.fillRect(44, 31, 15, 2);
  change.fillRect(55, 28, 2, 8);
  change.fillRect(57, 30, 2, 4);
  guideFrame(change, art, 'evolve-right', -1, 87, 31, 47, 57);
}

function hitsFish(fish, x, y) {
  const angle = fish.angle;
  const dx = x - fish.x;
  const dy = y - fish.y;
  const along = Math.cos(angle) * dx + Math.sin(angle) * dy;
  const across = -Math.sin(angle) * dx + Math.cos(angle) * dy;
  return (along / HIT_HALF_WIDTH) ** 2 + (across / HIT_HALF_HEIGHT) ** 2 <= 1;
}

function poseFrame(time, length) {
  return clamp(Math.floor(time / POSE_MS), 0, length - 1);
}

class Scene {
  constructor(canvas, motion) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.motion = motion;
  }

  get netOffsets() {
    return Object.fromEntries(['left', 'right'].map(side => [
      side, this.motion.clips['scoop-' + side].map(frame => frame.net.map(value => value * ACTOR_SCALE)),
    ]));
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.scale = Math.min(1.5, devicePixelRatio);
    this.canvas.width = Math.round(width * this.scale);
    this.canvas.height = Math.round(height * this.scale);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  sprite(clip, index, x, y, scale = 1, ctx = this.ctx) {
    const frame = this.motion.clips[clip][index];
    const [sx, sy, width, height] = frame.rect;
    const [dx, dy] = frame.offset;
    ctx.drawImage(this.motion.image, sx, sy, width, height, x + dx * scale, y + dy * scale,
      width * scale, height * scale);
  }

  ripple(x, y, amount, color = '#a4e4db') {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= .5 * (1 - amount);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + amount * 18, 3 + amount * 8, 0, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.restore();
  }

  drawFish(fish, time, scale = FISH_SCALE) {
    const ctx = this.ctx;
    const age = time - fish.born;
    const swim = Math.floor((age + fish.id * 77) / POSE_MS) % 6;
    if (age < 180) this.ripple(fish.x, fish.y + 3, clamp(age / 180, 0, 1));
    ctx.save();
    ctx.translate(Math.round(fish.x), Math.round(fish.y));
    if (Math.cos(fish.angle) < 0) {
      ctx.rotate(fish.angle - Math.PI);
      ctx.scale(-1, 1);
    } else {
      ctx.rotate(fish.angle);
    }
    this.sprite('swim', swim, FISH_CENTER_OFFSET * scale, 0, scale);
    ctx.restore();
  }

  drawDeparture(effect, time) {
    const ctx = this.ctx;
    const progress = clamp((time - effect.at) / effect.duration, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    const fish = {...effect,
      x: effect.x + Math.cos(effect.angle) * 16 * progress,
      y: effect.y + Math.sin(effect.angle) * 16 * progress + progress * 5};
    this.drawFish(fish, time);
    ctx.restore();
    this.ripple(effect.x, effect.y + 6, progress);
    return fish;
  }

  drawEvolution(effect, time) {
    const ctx = this.ctx;
    const elapsed = time - effect.at;
    const side = Math.cos(effect.angle) < 0 ? 'left' : 'right';
    const sign = side === 'left' ? -1 : 1;
    const clip = 'evolve-' + side;
    const frames = this.motion.clips[clip];
    const index = poseFrame(elapsed, frames.length);
    const {rect: [, , width, height], offset: [dx, dy]} = frames[index];
    const shift = sign * FISH_CENTER_OFFSET;
    const x = Math.round(clamp(effect.x, 3 - (dx + shift) * FISH_SCALE, this.width - 3 - (dx + shift + width) * FISH_SCALE));
    const y = Math.round(clamp(effect.y, 4 - dy * FISH_SCALE, this.height - 6 - (dy + height) * FISH_SCALE));
    const splashAge = (elapsed - 16 * POSE_MS) / (9 * POSE_MS);
    if (splashAge > 0 && splashAge < 1) {
      this.ripple(x + sign * 37, Math.min(y + 32, this.height - 12), splashAge, '#aaf0e7');
    }
    const angle = effect.angle - (sign < 0 ? Math.PI : 0);
    const turn = Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - clamp(elapsed / (4 * POSE_MS), 0, 1));
    ctx.save();
    ctx.globalAlpha = clamp((effect.duration - elapsed) / (3 * POSE_MS), 0, 1);
    ctx.translate(x, y);
    ctx.rotate(turn);
    this.sprite(clip, index, shift * FISH_SCALE, 0, FISH_SCALE);
    ctx.restore();
    const centerX = (dx + shift + width / 2) * FISH_SCALE;
    const centerY = (dy + height / 2) * FISH_SCALE;
    return {
      id: effect.id,
      x: x + Math.cos(turn) * centerX - Math.sin(turn) * centerY,
      y: y + Math.sin(turn) * centerX + Math.cos(turn) * centerY,
      angle: turn,
      halfWidth: Math.max(HIT_HALF_WIDTH, width * FISH_SCALE / 2),
      halfHeight: Math.max(HIT_HALF_HEIGHT, height * FISH_SCALE / 2),
    };
  }

  fishingPlateBox(school) {
    const width = 76;
    return {left: clamp(Math.round(school.actor.x) - width / 2, 3, this.width - width - 3),
      top: Math.min(Math.round(school.actor.y) + 4, this.height - 30), width, height: 28};
  }

  drawFishingPlate(school, ctx = this.ctx) {
    const {left: x, top: y, width} = this.fishingPlateBox(school);
    const remaining = Math.min(NET_CD_MS, school.netRemaining);
    const ready = remaining === 0;

    ctx.fillStyle = '#382f29';
    ctx.fillRect(x + 3, y, width - 6, 28);
    ctx.fillRect(x, y + 3, width, 22);
    ctx.fillStyle = '#9d704c';
    ctx.fillRect(x + 2, y + 3, width - 4, 22);
    ctx.fillStyle = '#d3ac7b';
    ctx.fillRect(x + 4, y + 2, width - 8, 17);
    ctx.fillStyle = '#f2cc93';
    ctx.fillRect(x + 6, y + 2, width - 12, 1);

    ctx.fillStyle = ready ? '#27483e' : '#6c573e';
    for (const [row, pixels] of NET_PIXELS.entries()) {
      for (let column = 0; column < pixels.length; column++) {
        if (pixels[column] === '#') ctx.fillRect(x + 8 + column, y + 6 + row, 1, 1);
      }
    }
    for (let index = 0; index < STARTING_LIVES; index++) {
      const left = x + 26 + 14 * index;
      const lit = index < school.lives;
      ctx.fillStyle = '#634638';
      ctx.fillRect(left + 2, y + 5, 6, 11);
      ctx.fillRect(left, y + 7, 10, 7);
      ctx.fillStyle = lit ? '#f9bd66' : '#776b58';
      ctx.fillRect(left + 2, y + 7, 6, 7);
      ctx.fillStyle = lit ? '#fff0a2' : '#8d8068';
      ctx.fillRect(left + 3, y + 7, 4, 2);
    }
    ctx.fillStyle = '#514335';
    ctx.fillRect(x + 6, y + 19, width - 12, 6);
    ctx.fillStyle = '#2d433e';
    ctx.fillRect(x + 7, y + 20, width - 14, 4);
    ctx.fillStyle = ready ? '#b7e1bf' : '#f4c777';
    ctx.fillRect(x + 7, y + 20, Math.round((width - 14) * (1 - remaining / NET_CD_MS)), 4);
  }

  drawActor(school) {
    const pose = school.actorPose();
    const {x, y} = school.actor;
    this.sprite(pose.clip, pose.index, x, y, ACTOR_SCALE);
    const active = school.capture;
    if (!active || active.fish.locked) return;
    const after = clamp((school.time - active.contactAt) / 375, 0, 1);
    if (after === 1) return;
    const net = this.motion.clips[pose.clip][pose.index].net;
    const netX = x + net[0] * ACTOR_SCALE;
    const netY = y + net[1] * ACTOR_SCALE;
    const ctx = this.ctx;
    ctx.save();
    const direction = Math.atan2(Math.sin(active.fish.angle), Math.cos(active.fish.angle));
    const horizontal = Math.abs(direction) > Math.PI / 2 ? Math.sign(direction) * Math.PI : 0;
    const angle = lerp(direction, horizontal, clamp(after * 3, 0, 1));
    const fish = {...active.fish, x: netX, y: netY + lerp(0, 6, after), angle};
    this.drawFish(fish, school.time, FISH_SCALE * (1 - after));
    ctx.restore();
    if (after < .7) this.ripple(active.fish.x, active.fish.y + 6, after / .7, '#eed69e');
    return fish;
  }

  actorHit(school) {
    const {clip, index} = school.actorPose();
    const {rect: [, , width, height], offset: [dx, dy]} = this.motion.clips[clip][index];
    const x = school.actor.x + dx * ACTOR_SCALE;
    const y = school.actor.y + dy * ACTOR_SCALE;
    const left = clamp(x, 0, this.width);
    const top = clamp(y, 0, this.height);
    return {left, top, width: clamp(x + width * ACTOR_SCALE, 0, this.width) - left,
      height: clamp(y + height * ACTOR_SCALE, 0, this.height) - top};
  }

  drawMovePreview(canvas, school) {
    const actor = this.actorHit(school);
    const plate = this.fishingPlateBox(school);
    const left = Math.floor(Math.min(actor.left, plate.left));
    const top = Math.floor(Math.min(actor.top, plate.top));
    const width = Math.ceil(Math.max(actor.left + actor.width, plate.left + plate.width)) - left;
    const height = Math.ceil(Math.max(actor.top + actor.height, plate.top + plate.height)) - top;
    canvas.width = Math.ceil(width * this.scale);
    canvas.height = Math.ceil(height * this.scale);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(this.scale, 0, 0, this.scale, -left * this.scale, -top * this.scale);
    ctx.imageSmoothingEnabled = false;
    const {clip, index} = school.actorPose();
    this.sprite(clip, index, school.actor.x, school.actor.y, ACTOR_SCALE, ctx);
    this.drawFishingPlate(school, ctx);
    return {left, top, width, height};
  }

  drawLobby(canvas, finished) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    guideFrame(ctx, this.motion, finished ? 'react-ordinary-left' : 'idle-left', finished ? 6 : 0,
      100, 100, 176, 176);
  }

  draw(school, moving = false) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const fading = [];
    for (const effect of school.effects) {
      if (effect.kind === 'leave') fading.push(this.drawDeparture(effect, school.time));
    }
    if (!moving) {
      const netted = this.drawActor(school);
      if (netted) fading.push(netted);
      this.drawFishingPlate(school);
    }
    for (const effect of school.effects) {
      if (effect.kind === 'evolution') fading.push(this.drawEvolution(effect, school.time));
    }
    for (const fish of school.fish) this.drawFish(fish, school.swimTime);
    return fading;
  }
}

return {HIT_HALF_WIDTH,HIT_HALF_HEIGHT,loadMotion,drawRuleArt,hitsFish,Scene};
};
__defs["games/fish-leap/experience.mjs"]=()=>{
const {createMoveHandle}=__get("runtime/move-handle.mjs");
const {RECOVERY_MS}=__get("runtime/presentation.mjs");
const {GAME_COPY, SHARED_COPY}=__get("runtime/game-catalog.mjs");
const {applyCopy}=__get("runtime/apply-copy.mjs");
const {mountControlGuide}=__get("runtime/control-guide.mjs");
const {createPixelText}=__get("runtime/pixel-text.mjs");
const {FISH_HIT_GRACE_MS, FishSchool, MIN_VIEW, clampActor}=__get("games/fish-leap/core.mjs");
const {HIT_HALF_HEIGHT, HIT_HALF_WIDTH, Scene, drawRuleArt, hitsFish, loadMotion}=__get("games/fish-leap/scene.mjs");
const copy = GAME_COPY['fish-leap'];
const positionKey = 'braingames.fish-leap.position.v1';
const MAX_FRAME_GAP_MS = 250;
const hide = (element, value) => { if (element.hidden !== value) element.hidden = value; };
const FEEDBACK_MS = 900;
const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };
function place(element, area) {
  for (const [property, value] of Object.entries(area)) {
    const pixels = Math.round(value) + 'px';
    if (element.style[property] !== pixels) element.style[property] = pixels;
  }
}

function setFishAccess(button, live, enabled) {
  if (live && button.hasAttribute('aria-hidden')) button.removeAttribute('aria-hidden');
  else if (!live && !button.hasAttribute('aria-hidden')) button.setAttribute('aria-hidden', 'true');
  if (button.getAttribute('aria-disabled') !== String(!enabled)) {
    button.setAttribute('aria-disabled', String(!enabled));
    button.tabIndex = enabled ? 0 : -1;
  }
}

async function source(file) {
  const response = await fetch(new URL(file, "braingames:/experience.mjs"));
  if (!response.ok) throw Error('捞鱼文件加载失败 ' + file);
  return response.text();
}

function mountGame(host, options) {
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  const root = document.createElement('main');
  root.className = 'stage';
  shadow.append(style, root);
  const $ = id => root.querySelector('#' + id);
  const font = new FontFace('Whale Fish Pixel', options.ui ? options.ui.fontBytes :
    'url("' + new URL('./ui/song-subset.ttf', "braingames:/experience.mjs").href + '")');
  const buttons = new Map();
  const errors = [];
  const initialTier = options.practiceTier ?? 0;
  const bestKey = 'braingames.fish-leap.bestSeconds.v1' + (initialTier ? '.tier-' + (initialTier + 1) : '');
  let art, scene, netOffsets, pixelText, observer, school, hold, drag, position;
  let saved = options.checkpoint;
  let width = 0, height = 0, small = false, ready = false, disposed = false, pending = false;
  let presented = false, frozen = false, recovery = 0, raf = null, last = null;
  let canReplay = true, canRandom = Boolean(options.canRandom), best = 0, moveFrame = null;
  let spot = null, blockedUntil = 0, reportedLives = 3, netWasReady = true, readyUntil = 0;

  function playing() { return school && school.phase !== 'ended'; }
  function canAct() {
    return ready && presented && !frozen && !small && !recovery && !errors.length && school?.phase === 'playing';
  }
  function available() {
    return canAct() && !hold.isPressed() && !school.capture && school.netRemaining === 0;
  }
  function canMove() {
    return canAct() && !school.capture;
  }

  function view() {
    if (errors.length) return 'error';
    if (!ready) return 'loading';
    if (!school && !saved) return 'welcome';
    if (school?.phase === 'ended') return 'finished';
    return presented ? 'playing' : 'paused';
  }

  function updateInputs() {
    if (!ready) return;
    $('start').disabled = $('replay').disabled = !presented || small || !canReplay || pending;
    hide($('random'), !canRandom);
    $('random').disabled = !presented || small || pending;
  }

  function updateWhale() {
    const whale = $('move-whale');
    const resume = Boolean(playing() && frozen && !small && !errors.length);
    const show = resume || Boolean(playing() && presented && !small && !school.capture && !errors.length);
    hide(whale, !show);
    if (whale.hasAttribute('data-game-resume') !== resume) {
      whale.toggleAttribute('data-game-resume', resume);
      whale.setAttribute('aria-label', resume ? '点鲸鱼娘继续' : '长按鲸鱼娘移动');
      whale.tabIndex = resume ? 0 : -1;
    }
    whale.toggleAttribute('data-movable', canMove());
    if (show) place(whale, scene.actorHit(school));
  }

  function placeFishButton(controls, key, item, live, enabled) {
    let entry = buttons.get(key);
    if (!entry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fish';
      if (live) {
        button.dataset.fish = item.id;
        button.setAttribute('aria-label', '捞这条金鱼');
      } else button.dataset.fishEffect = item.id;
      controls.append(button);
      entry = {button};
      buttons.set(key, entry);
    }
    const {button} = entry;
    const halfWidth = item.halfWidth ?? HIT_HALF_WIDTH;
    const halfHeight = item.halfHeight ?? HIT_HALF_HEIGHT;
    const transform = 'translate(' + Math.round(item.x - halfWidth) + 'px,' +
      Math.round(item.y - halfHeight) + 'px) rotate(' + item.angle.toFixed(3) + 'rad)';
    if (entry.halfWidth !== halfWidth || entry.halfHeight !== halfHeight) {
      place(button, {width: halfWidth * 2, height: halfHeight * 2});
      Object.assign(entry, {halfWidth, halfHeight});
    }
    if (entry.transform !== transform) { button.style.transform = transform; entry.transform = transform; }
    setFishAccess(button, live, enabled);
    entry.drawn = true;
    entry.missingSince = null;
  }

  function syncFish(fading = []) {
    const controls = $('fish-controls');
    const active = playing() && presented && !frozen && !small && !errors.length;
    const guard = $('cast-guard');
    const casting = active && Boolean(school.capture);
    if (controls.inert === active) controls.inert = !active;
    hide(guard, !casting);
    if (!playing() || errors.length) {
      for (const {button} of buttons.values()) button.remove();
      buttons.clear();
    }
    if (!active) return;
    if (casting) {
      place(guard, scene.actorHit(school));
    }
    const enabled = available();
    for (const entry of buttons.values()) entry.drawn = false;
    for (const fish of school.fish) placeFishButton(controls, fish.id, fish, true, enabled && !fish.locked);
    for (const fish of fading) placeFishButton(controls, 'effect-' + fish.id, fish, false, false);
    for (const [key, entry] of buttons) {
      if (entry.drawn) continue;
      // Keep the last drawn position briefly as a mouse target without a catch action.
      entry.missingSince ??= school.time;
      if (school.time - entry.missingSince >= FISH_HIT_GRACE_MS) {
        entry.button.remove();
        buttons.delete(key);
      } else setFishAccess(entry.button, false, false);
    }
  }

  function drawRound() {
    updateWhale();
    syncFish(scene.draw(school, Boolean(drag)));
    const {lives, time, effects, capture, netRemaining} = school;
    const netReady = !capture && netRemaining === 0;
    const net = capture ? copy.netCasting : netReady ? copy.netReady : copy.netCooling;
    if (netReady && !netWasReady) readyUntil = time + FEEDBACK_MS;
    netWasReady = netReady;
    if (lives < reportedLives) {
      const missed = effects.findLast(effect => effect.kind === 'evolution');
      spot = missed ? {x: missed.x, y: missed.y, until: time + FEEDBACK_MS} : null;
    }
    reportedLives = lives;
    const tip = $('fish-tip');
    const atLoss = spot && time < spot.until;
    const show = presented && !frozen && !drag && (atLoss || time < blockedUntil || netReady && time < readyUntil);
    hide(tip, !show);
    if (show) {
      const point = atLoss ? spot : school.actor;
      setText(tip, atLoss ? copy.netLoss : net);
      const x = Math.max(68, Math.min(width - 68, point.x));
      place(tip, {left: x, top: Math.max(30, point.y - (atLoss ? 32 : 80))});
    }
    setText($('round-status'), '剩余 ' + lives + ' 盏灯。' + (atLoss ? copy.netLoss + '。' : '') + net + '。' + (copy.feedback[school.reaction] ?? ''));
  }

  function redraw() {
    if (!ready || small) return;
    const current = view();
    const showRound = Boolean(school && (current === 'playing' || current === 'paused'));
    hide($('lobby'), showRound || current === 'paused');
    hide($('welcome'), current !== 'welcome');
    hide($('result'), current !== 'finished');
    hide($('error'), current !== 'error');
    hide($('companion'), current === 'error');
    hide($('canvas'), !showRound);
    hide($('fish-controls'), !showRound);
    updateInputs();
    if (showRound) drawRound();
    else {
      hide($('fish-tip'), true);
      updateWhale();
      syncFish();
      setText($('round-status'), '');
      if (current !== 'error') scene.drawLobby($('companion'), current === 'finished');
      if (current === 'finished') {
        const seconds = Math.floor(school.frozenAt / 1000);
        if (seconds > best) {
          localStorage.setItem(bestKey, String(seconds));
          best = seconds;
        }
        setText($('score'), String(seconds));
        setText($('best-value'), String(best));
      }
    }
  }

  function clickedFish(event, button) {
    if (event.detail === 0) return Number(button.dataset.fish);
    const bounds = root.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    let closest = Infinity;
    let id;
    for (const fish of school.fish) {
      if (fish.locked || !hitsFish(fish, x, y)) continue;
      const distance = (fish.x - x) ** 2 + (fish.y - y) ** 2;
      if (distance < closest) {
        closest = distance;
        id = fish.id;
      }
    }
    return id;
  }

  function schedule() {
    if (raf === null && presented && !frozen && !small && !disposed && !errors.length && playing() && !hold.isPressed()) {
      raf = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = last = null;
  }

  function beginMove() {
    drag = {origin: {...school.actor}, point: null};
    const preview = $('move-preview');
    place(preview, scene.drawMovePreview(preview, school));
    hide(preview, false);
    drawRound();
  }

  function moveWhale(dx, dy) {
    const {x, y} = drag.origin;
    drag.point = clampActor(x + dx, y + dy, width, height);
    if (moveFrame !== null) return;
    moveFrame = requestAnimationFrame(() => {
      moveFrame = null;
      const {point, origin} = drag;
      const transform = `translate3d(${point.x - origin.x}px, ${point.y - origin.y}px, 0)`;
      $('move-preview').style.transform = $('move-whale').style.transform = transform;
    });
  }

  function finishMove(commit, dx, dy) {
    if (moveFrame !== null) cancelAnimationFrame(moveFrame);
    moveFrame = null;
    hide($('move-preview'), true);
    $('move-preview').style.transform = $('move-whale').style.transform = '';
    const origin = drag?.origin;
    drag = null;
    if (commit) {
      const point = clampActor(origin.x + dx, origin.y + dy, width, height);
      if (point.x !== origin.x || point.y !== origin.y) {
        Object.assign(school.actor, point);
        position = {x: point.x / width, y: point.y / height};
        localStorage.setItem(positionKey, JSON.stringify(position));
      }
      recovery = performance.now() + RECOVERY_MS;
    }
    if (presented && !small && !disposed && !errors.length) drawRound();
    schedule();
  }

  function tick(now) {
    raf = null;
    try {
      if (now < recovery) { schedule(); return; }
      recovery = 0;
      if (last !== null) {
        if (now - last > MAX_FRAME_GAP_MS) {
          recovery = now + RECOVERY_MS;
          last = null;
        } else {
          school.advance(now - last);
        }
      }
      if (!recovery) last = now;
      if (playing()) drawRound();
      else {
        redraw();
        pixelText.flush();
        if (!$('replay').disabled) $('replay').focus({preventScroll: true});
        options.onViewChange();
      }
      schedule();
    } catch (error) { fail(error); }
  }

  function fit() {
    const nextWidth = root.clientWidth;
    const nextHeight = root.clientHeight;
    small = nextWidth < MIN_VIEW.width || nextHeight < MIN_VIEW.height;
    root.toggleAttribute('data-small', small);
    root.toggleAttribute('data-compact', nextWidth < 500);
    root.toggleAttribute('data-short', nextHeight < 450);
    if (small || width !== nextWidth || height !== nextHeight) hold.cancel({untilRelease: presented});
    if (small) {
      stop();
      syncFish();
      updateWhale();
    } else {
      if (width !== nextWidth || height !== nextHeight) {
        width = nextWidth;
        height = nextHeight;
        scene.resize(width, height);
        if (saved) {
          school = new FishSchool(width, height, {netOffsets, saved});
          saved = null;
        } else school?.resize(width, height);
      } else if (scene.scale !== Math.min(1.5, devicePixelRatio)) scene.resize(width, height);
      redraw();
      schedule();
    }
    options.onViewChange();
  }

  function fail(error) {
    errors.push(error.message);
    hold?.cancel({untilRelease: true});
    stop();
    if (ready) {
      setText($('error-detail'), error.message);
      redraw();
    }
    options.onViewChange();
    console.error(error);
  }

  function suspend() {
    presented = false;
    recovery = 0;
    hold?.cancel({untilRelease: true});
    stop();
    pixelText?.suspend();
    redraw();
  }

  async function start() {
    if (pending || !ready || small || !canReplay || !['welcome', 'finished'].includes(view())) return;
    pending = true;
    updateInputs();
    try {
      if (!await options.beforePlay() || !presented || disposed || small) return;
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      school = new FishSchool(width, height, {tier: initialTier, seed, netOffsets});
      spot = null;
      blockedUntil = readyUntil = 0;
      reportedLives = school.lives;
      netWasReady = true;
      if (position) Object.assign(school.actor, clampActor(position.x * width, position.y * height, width, height));
      redraw();
      schedule();
      options.onViewChange();
    } catch (error) { fail(error); }
    finally { pending = false; updateInputs(); }
  }

  async function present({resume = true, start: directStart = false} = {}) {
    if (playing() && resume && !presented) recovery = performance.now() + RECOVERY_MS;
    presented = true;
    pixelText.present();
    if (directStart && view() === 'welcome') await start();
    redraw();
    pixelText.flush();
    schedule();
  }

  const initialization = (async () => {
    const [css, html, motion] = await Promise.all([options.ui?.style ?? source('./style.css'),
      options.ui?.markup ?? source('./markup.html'), loadMotion(options), font.load()]);
    if (disposed) { motion.image.close?.(); return false; }
    art = motion;
    document.fonts.add(font);
    style.textContent = css;
    root.innerHTML = html;
    applyCopy(root, {'#rule-a': copy.rules[0], '#rule-b': copy.rules[1], '#fish-instruction': copy.ruleNote,
      '#start': copy.start, '#result-lead': copy.resultLead, '#unit': copy.resultUnit,
      '#best-label': copy.bestLabel, '#best-unit': copy.resultUnit, '#replay': copy.replay, '#random': SHARED_COPY.next,
      '#load-error': copy.loadError, '#reload': SHARED_COPY.reload});
    mountControlGuide(root, copy);
    if (initialTier) {
      setText($('practice'), '第 ' + (initialTier + 1) + ' 档试玩');
      hide($('practice'), false);
    }
    drawRuleArt($('rule-scoop'), $('rule-evolve'), art);
    scene = new Scene($('canvas'), art);
    netOffsets = scene.netOffsets;
    const storedBest = localStorage.getItem(bestKey);
    if (storedBest !== null) {
      best = Number(storedBest);
      if (!Number.isSafeInteger(best) || best < 0) throw Error('捞鱼记录格式无效');
    }
    const storedPosition = localStorage.getItem(positionKey);
    if (storedPosition !== null) {
      position = JSON.parse(storedPosition);
      if (![position?.x, position?.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
        throw Error('捞鱼位置格式无效');
      }
    }
    hold = createMoveHandle($('move-whale'), {
      canMove,
      onGrab() { stop(); drawRound(); },
      onActivate: beginMove,
      onMove: moveWhale,
      onDrop: finishMove,
      onCancel: () => finishMove(false),
      onTap() {},
      onError: fail,
    });
    $('fish-controls').addEventListener('pointerdown', event => {
      if (event.target.closest('#cast-guard, .fish[aria-disabled="true"]')) event.preventDefault();
    });
    $('fish-controls').addEventListener('click', event => {
      const button = event.target.closest('.fish[data-fish]');
      if (!button || !canAct() || hold.isPressed()) return;
      const id = clickedFish(event, button);
      if (id === undefined) return;
      if (available()) {
        if (school.scoop(id)) drawRound();
      } else if (school.time >= blockedUntil) {
        blockedUntil = school.time + FEEDBACK_MS;
        drawRound();
      }
    });
    $('move-whale').addEventListener('click', () => {
      if (frozen) Promise.resolve(options.onResume()).catch(fail);
    });
    for (const id of ['start', 'replay']) $(id).addEventListener('click', () => void start());
    $('random').addEventListener('click', () => {
      if (canRandom && view() === 'finished') Promise.resolve(options.onRandom()).catch(fail);
    });
    $('reload').addEventListener('click', () => Promise.resolve(options.onReload()).catch(fail));
    pixelText = createPixelText(root, {alphaThreshold: 24});
    pixelText.suspend();
    ready = true;
    fit();
    observer = new ResizeObserver(() => { try { fit(); } catch (error) { fail(error); } });
    observer.observe(root);
    return true;
  })().catch(error => { fail(error); return false; });

  return {
    ready: initialization, present, suspend, preview: suspend,
    getRoot: () => root,
    getRunState: () => ({view: view(), hasRound: Boolean(school || saved)}),
    snapshot: () => ({view: view(), ready, presented, viewportBlocked: small, rafPending: raf !== null,
      recovering: Boolean(recovery), relocating: Boolean(drag), best, errors: [...errors], session: school?.checkpoint().state ?? null,
      viewport: {width, height}}),
    checkpoint: () => !ready || errors.length ? null : saved ?? school?.checkpoint() ?? null,
    setFrozen(value) { frozen = value; if (ready) updateWhale(); },
    setAvailability(next) { canReplay = next.canReplay; canRandom = next.canRandom; updateInputs(); },
    paintStatic: redraw,
    async dispose() {
      disposed = true;
      stop();
      await initialization;
      observer?.disconnect();
      hold?.dispose();
      pixelText?.dispose();
      document.fonts.delete(font);
      art?.image.close?.();
      shadow.replaceChildren();
    },
  };
}

return {mountGame};
};
__defs["runtime/transparent-stage.mjs"]=()=>{

// Transparent scene: only explicit game controls own mouse input.
function createTransparentStage(container,options={}){
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

return {createTransparentStage};
};
__defs["games/fish-leap/dsh-stage.mjs"]=()=>{
const {mountGame}=__get("games/fish-leap/experience.mjs");
const {createTransparentStage}=__get("runtime/transparent-stage.mjs");
function mountStage(container, options = {}) {
  const stage = createTransparentStage(container, {
    ...options,
    mountGame: (host, callbacks) => mountGame(host, {...callbacks, practiceTier: options.practiceTier}),
    kind: 'fish-leap',
    keys: ['Space', 'Enter', 'Tab'],
    stageStyle: ':host,.stage,canvas,.paper{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}',
  });
  container.querySelector(':scope > [data-braingames-stage]').style.outline = 'none';
  return stage;
}

return {mountStage};
};
const __entry=__get("games/fish-leap/dsh-stage.mjs");

const ui={"markup":"<canvas id=\"canvas\" aria-hidden=\"true\"></canvas>\n<output id=\"fish-tip\" class=\"fish-tip\" aria-hidden=\"true\" hidden></output>\n<canvas id=\"move-preview\" aria-hidden=\"true\" hidden></canvas>\n<div id=\"fish-controls\" role=\"group\" aria-label=\"游动的金鱼\" inert>\n  <div id=\"cast-guard\" aria-hidden=\"true\" hidden></div>\n</div>\n<button id=\"move-whale\" type=\"button\" aria-label=\"长按鲸鱼娘移动\" tabindex=\"-1\" hidden></button>\n<div id=\"lobby\" class=\"lobby\" hidden>\n  <canvas id=\"companion\" width=\"200\" height=\"200\" aria-hidden=\"true\"></canvas>\n  <section id=\"welcome\" class=\"paper\" aria-labelledby=\"game-title\" hidden>\n    <h1 id=\"game-title\" data-braingames-title data-pixel-text></h1>\n    <p id=\"practice\" data-pixel-text hidden></p>\n    <div class=\"rules\">\n      <div><canvas id=\"rule-scoop\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"鲸鱼娘用网捞金鱼\"></canvas><span id=\"rule-a\" data-pixel-text></span></div>\n      <div><canvas id=\"rule-evolve\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"金鱼变成 Claude 娘\"></canvas><span id=\"rule-b\" data-pixel-text></span></div>\n    </div>\n    <p id=\"fish-instruction\" class=\"rule-note\"></p>\n    <p data-braingames-controls></p>\n    <button id=\"start\" class=\"primary\" type=\"button\" data-pixel-text></button>\n  </section>\n  <section id=\"result\" class=\"paper\" aria-labelledby=\"game-result-title\" role=\"dialog\" hidden>\n    <h2 id=\"game-result-title\" data-braingames-title data-pixel-text></h2>\n    <p id=\"result-lead\" data-pixel-text></p>\n    <p class=\"number\" aria-live=\"polite\"><strong id=\"score\" data-pixel-text></strong><span id=\"unit\" data-pixel-text></span></p>\n    <p class=\"best\"><span id=\"best-label\" data-pixel-text></span><span class=\"best-score\"><strong id=\"best-value\" data-pixel-text></strong><span id=\"best-unit\" data-pixel-text></span></span></p>\n    <div class=\"actions\">\n      <button id=\"replay\" class=\"primary\" type=\"button\" data-pixel-text></button>\n      <button id=\"random\" class=\"secondary\" type=\"button\" data-pixel-text hidden></button>\n    </div>\n  </section>\n  <section id=\"error\" class=\"paper\" role=\"alert\" hidden>\n    <p id=\"load-error\" data-pixel-text></p>\n    <p id=\"error-detail\"></p>\n    <button id=\"reload\" class=\"primary\" type=\"button\" data-pixel-text></button>\n  </section>\n</div>\n<p id=\"round-status\" class=\"sr\" role=\"status\" aria-live=\"polite\"></p>\n","style":":host {\n  display: block; width: 100%; height: 100%; color-scheme: light dark;\n  --paper: #f6f0dd; --ink: #263248; --gold: #9f8355; --muted: #626974;\n}\n*, *::before, *::after { box-sizing: border-box; }\n[hidden] { display: none !important; }\n.stage { position: absolute; inset: 0; pointer-events: none; user-select: none; overflow: hidden; }\n#canvas { position: absolute; inset: 0; width: 100%; height: 100%; }\ncanvas { image-rendering: pixelated; }\nbutton { cursor: pointer; touch-action: manipulation; pointer-events: auto; }\nbutton:disabled { cursor: default; pointer-events: none; }\n.fish {\n  position: absolute; top: 0; left: 0; padding: 0; border: 0; border-radius: 50%; background: transparent;\n}\n.fish:not([aria-hidden]) { z-index: 1; }\n.fish[aria-disabled=\"true\"] { cursor: default; }\n.fish:focus-visible, #move-whale:focus-visible { outline: 2px solid #8d7052; outline-offset: -3px; }\n#cast-guard { position: absolute; pointer-events: auto; }\n#move-preview { position: absolute; pointer-events: none; }\n#move-whale { position: absolute; padding: 0; border: 0; background: transparent; cursor: default; touch-action: none; }\n#move-whale[data-movable] { cursor: grab; }\n#move-whale[data-dragging] { cursor: grabbing; }\n.lobby { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);\n  display: grid; grid-template-columns: 280px 200px; align-items: center; pointer-events: none; }\n#companion { width: 200px; height: 200px; grid-column: 2; grid-row: 1; }\n.stage[data-compact] .lobby { grid-template-columns: 280px; gap: 4px; justify-items: center; }\n.stage[data-compact] #companion { grid-column: 1; width: 108px; height: 108px; }\n.stage[data-compact] .paper { grid-row: 2; }\n.paper {\n  grid-column: 1; grid-row: 1; width: 280px;\n  padding: 20px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink);\n  box-shadow: inset 2px 2px #fffbed, inset -2px -2px #d8ccb1, 4px 4px #0e172c55;\n  font: 18px/24px \"Whale Fish Pixel\", serif; text-align: center;\n  clip-path: polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px));\n}\n.paper p, .paper h1, .paper h2 { margin: 0; font: inherit; }\n.rules { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0 0 20px; padding: 4px 0 8px; }\n.rules > div { display: flex; flex-direction: column; align-items: center; gap: 8px; white-space: pre-line; font-size: 15px; line-height: 21px; }\n.paper .rule-note { font: 14px/20px system-ui, sans-serif; color: var(--ink); margin: 0 0 8px; }\n.fish-tip { position: absolute; z-index: 2; transform: translate(-50%, -100%); pointer-events: none;\n  padding: 3px 7px; border: 1px solid var(--gold); background: var(--paper); color: var(--ink);\n  font: 14px/20px system-ui, sans-serif; white-space: nowrap; }\n.rules > div > canvas { width: 112px; max-width: 100%; }\n.rules > div + div { border-left: 2px solid #e6ddc3; }\n.paper button { display: block; width: 100%; color: var(--ink); font: inherit; }\n.primary { min-height: 42px; padding: 7px 12px; border: 2px solid var(--gold); background: #f3d391;\n  box-shadow: inset 0 2px #ffe9b6, 0 2px var(--gold); }\n.primary:hover:not(:disabled), .primary:focus-visible { background: #f8dc9e; border-color: var(--ink); }\n.primary:active:not(:disabled) { transform: translateY(2px); }\n.paper .secondary { min-height: 36px; padding: 4px 8px; border: 2px solid transparent; color: var(--muted); background: transparent; }\n.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: #c6baa0; background: #e9e0c8; }\n.paper button:disabled { opacity: .58; }\n.actions { display: grid; gap: 8px; }\n#result-lead, .best { color: var(--muted); }\n.paper .number { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0 16px; }\n.number > strong, .best-score > strong { font-weight: 400; font-variant-numeric: tabular-nums; }\n.paper .best { display: flex; justify-content: space-between; border-top: 2px solid #e6ddc3; padding: 12px 0 16px; }\n.best-score { display: flex; gap: 6px; }\n.paper #practice { color: var(--muted); font-size: 15px; line-height: 21px; }\n.paper [data-braingames-controls] { margin-bottom: 12px; }\n.stage[data-compact] .rules { margin-bottom: 8px; }\n.stage[data-compact][data-short] #companion { width: 64px; height: 64px; }\n.stage[data-compact][data-short] .rules { padding: 1px 0 5px; }\n.stage[data-compact][data-short] .rule-note { margin-bottom: 4px; }\n.stage[data-compact][data-short] #welcome { padding-block: 11px; }\n.stage[data-compact][data-short] .paper { padding-block: 16px; }\n#error-detail { font: 13px/18px system-ui, sans-serif; overflow-wrap: anywhere; }\n[data-pixel-text] { position: relative; }\n[data-pixel-ready] { -webkit-text-fill-color: transparent; }\nspan[data-pixel-text], strong[data-pixel-text] { display: inline-block; }\n[data-pixel-ready]::after {\n  content: \"\"; position: absolute; inset: 0; pointer-events: none;\n  background: var(--pixel-label) 0 0 / var(--pixel-label-size) no-repeat; image-rendering: pixelated;\n}\n.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }\n.stage[data-small] > :not(.sr) { visibility: hidden; }\n","font":"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"};
const manifest={"fps":16,"contactFrame":4,"clips":{"idle-left":[{"rect":[1,1,95,73],"offset":[-50,-72.92],"net":[-31.71,-31.2]}],"run-left":[{"rect":[98,1,93,68],"offset":[-50,-67.92],"net":[-31.38,-33.31]},{"rect":[193,1,94,67],"offset":[-52,-66.92],"net":[-33.5,-31.18]},{"rect":[289,1,95,68],"offset":[-53,-67.92],"net":[-34.28,-30.26]},{"rect":[386,1,94,68],"offset":[-52,-70.92],"net":[-33.5,-31.18]},{"rect":[482,1,93,68],"offset":[-50,-67.92],"net":[-31.38,-33.31]},{"rect":[577,1,90,67],"offset":[-46,-66.92],"net":[-28.95,-35.28]},{"rect":[669,1,89,68],"offset":[-45,-67.92],"net":[-27.85,-36.04]},{"rect":[1,76,90,68],"offset":[-46,-70.92],"net":[-28.95,-35.28]}],"scoop-left":[{"rect":[93,76,95,73],"offset":[-50,-72.92],"net":[-31.71,-31.2]},{"rect":[190,76,98,72],"offset":[-53,-71.92],"net":[-34.34,-26.8]},{"rect":[290,76,104,68],"offset":[-59,-67.92],"net":[-39.02,-16.86]},{"rect":[396,76,107,68],"offset":[-62,-63.92],"net":[-42.16,-6.85]},{"rect":[505,76,107,71],"offset":[-62,-61.92],"net":[-43.08,-2.37]},{"rect":[614,76,108,64],"offset":[-63,-63.92],"net":[-42.83,-10.57]},{"rect":[1,151,102,69],"offset":[-57,-68.92],"net":[-38.25,-28.66]},{"rect":[105,151,89,73],"offset":[-44,-72.92],"net":[-28.48,-44.86]},{"rect":[196,151,82,74],"offset":[-37,-73.92],"net":[-22.65,-51.02]},{"rect":[280,151,86,74],"offset":[-41,-73.92],"net":[-25.74,-46.57]},{"rect":[368,151,93,73],"offset":[-48,-72.92],"net":[-30.17,-36.94]},{"rect":[463,151,95,73],"offset":[-50,-72.92],"net":[-31.71,-31.2]}],"idle-right":[{"rect":[560,151,97,73],"offset":[-47,-72.92],"net":[31.71,-31.2]}],"run-right":[{"rect":[659,151,96,68],"offset":[-47,-67.92],"net":[31.38,-33.31]},{"rect":[1,227,99,67],"offset":[-47,-66.92],"net":[33.5,-31.18]},{"rect":[102,227,100,68],"offset":[-47,-67.92],"net":[34.28,-30.26]},{"rect":[204,227,99,68],"offset":[-47,-70.92],"net":[33.5,-31.18]},{"rect":[305,227,96,68],"offset":[-47,-67.92],"net":[31.38,-33.31]},{"rect":[403,227,94,67],"offset":[-48,-66.92],"net":[28.95,-35.28]},{"rect":[499,227,92,68],"offset":[-48,-67.92],"net":[27.85,-36.04]},{"rect":[593,227,94,68],"offset":[-48,-70.92],"net":[28.95,-35.28]}],"scoop-right":[{"rect":[1,297,97,73],"offset":[-47,-72.92],"net":[31.71,-31.2]},{"rect":[100,297,100,72],"offset":[-47,-71.92],"net":[34.34,-26.8]},{"rect":[202,297,105,68],"offset":[-47,-67.92],"net":[39.02,-16.86]},{"rect":[309,297,108,68],"offset":[-47,-63.92],"net":[42.16,-6.85]},{"rect":[419,297,109,71],"offset":[-47,-61.92],"net":[43.08,-2.37]},{"rect":[530,297,109,64],"offset":[-47,-63.92],"net":[42.83,-10.57]},{"rect":[641,297,104,69],"offset":[-47,-68.92],"net":[38.25,-28.66]},{"rect":[1,372,91,73],"offset":[-47,-72.92],"net":[28.48,-44.86]},{"rect":[94,372,83,74],"offset":[-47,-73.92],"net":[22.65,-51.02]},{"rect":[179,372,88,74],"offset":[-47,-73.92],"net":[25.74,-46.57]},{"rect":[269,372,95,73],"offset":[-47,-72.92],"net":[30.17,-36.94]},{"rect":[366,372,97,73],"offset":[-47,-72.92],"net":[31.71,-31.2]}],"swim":[{"rect":[465,372,47,25],"offset":[-29,-14.85]},{"rect":[514,372,47,27],"offset":[-29,-15.85]},{"rect":[563,372,47,26],"offset":[-29,-14.85]},{"rect":[612,372,48,25],"offset":[-30,-14.85]},{"rect":[662,372,48,27],"offset":[-30,-13.85]},{"rect":[712,372,48,26],"offset":[-30,-13.85]}],"evolve-left":[{"rect":[1,448,48,25],"offset":[-19,-14.85]},{"rect":[51,448,57,20],"offset":[-22,-9.85]},{"rect":[110,448,57,21],"offset":[-22,-10.85]},{"rect":[169,448,48,25],"offset":[-20,-22.85]},{"rect":[219,448,46,25],"offset":[-20,-29.85]},{"rect":[267,448,46,27],"offset":[-22,-34.85]},{"rect":[315,448,54,48],"offset":[-32,-51.85]},{"rect":[371,448,80,68],"offset":[-48,-64.85]},{"rect":[453,448,83,68],"offset":[-52,-68.85]},{"rect":[538,448,86,70],"offset":[-55,-73.85]},{"rect":[626,448,88,71],"offset":[-58,-76.85]},{"rect":[1,521,86,73],"offset":[-59,-77.85]},{"rect":[89,521,86,72],"offset":[-60,-74.85]},{"rect":[177,521,59,68],"offset":[-49,-66.85]},{"rect":[238,521,49,68],"offset":[-48,-60.85]},{"rect":[289,521,49,81],"offset":[-47,-53.85]},{"rect":[340,521,47,67],"offset":[-42,-41.85]},{"rect":[389,521,49,65],"offset":[-43,-38.85]},{"rect":[440,521,52,67],"offset":[-47,-41.85]},{"rect":[494,521,55,68],"offset":[-51,-44.85]},{"rect":[551,521,62,68],"offset":[-55,-44.85]},{"rect":[615,521,70,68],"offset":[-59,-44.85]},{"rect":[687,521,78,68],"offset":[-63,-44.85]},{"rect":[1,604,50,69],"offset":[-45,-44.85]},{"rect":[53,604,48,68],"offset":[-45,-44.85]},{"rect":[103,604,48,68],"offset":[-45,-44.85]},{"rect":[153,604,48,68],"offset":[-45,-44.85]},{"rect":[203,604,48,68],"offset":[-45,-44.85]}],"evolve-right":[{"rect":[253,604,48,25],"offset":[-30,-14.85]},{"rect":[303,604,58,20],"offset":[-36,-9.85]},{"rect":[363,604,58,21],"offset":[-36,-10.85]},{"rect":[423,604,48,25],"offset":[-29,-22.85]},{"rect":[473,604,46,25],"offset":[-26,-29.85]},{"rect":[521,604,45,27],"offset":[-24,-34.85]},{"rect":[568,604,54,42],"offset":[-23,-49.85]},{"rect":[624,604,71,64],"offset":[-25,-63.85]},{"rect":[1,675,73,66],"offset":[-24,-68.85]},{"rect":[76,675,83,68],"offset":[-27,-73.85]},{"rect":[161,675,91,72],"offset":[-29,-76.85]},{"rect":[254,675,97,77],"offset":[-30,-77.85]},{"rect":[353,675,98,80],"offset":[-29,-76.85]},{"rect":[453,675,67,68],"offset":[-12,-66.85]},{"rect":[522,675,53,68],"offset":[-5,-60.85]},{"rect":[577,675,52,81],"offset":[-4,-53.85]},{"rect":[631,675,50,68],"offset":[-5,-42.85]},{"rect":[683,675,48,66],"offset":[-5,-39.85]},{"rect":[1,758,52,68],"offset":[-5,-42.85]},{"rect":[55,758,56,68],"offset":[-5,-44.85]},{"rect":[113,758,63,68],"offset":[-8,-44.85]},{"rect":[178,758,71,68],"offset":[-12,-44.85]},{"rect":[251,758,79,68],"offset":[-16,-44.85]},{"rect":[332,758,51,69],"offset":[-4,-44.85]},{"rect":[385,758,51,68],"offset":[-4,-44.85]},{"rect":[438,758,51,68],"offset":[-4,-44.85]},{"rect":[491,758,51,68],"offset":[-4,-44.85]},{"rect":[544,758,51,68],"offset":[-4,-44.85]}],"react-ordinary-left":[{"rect":[597,758,95,73],"offset":[-50,-72.92]},{"rect":[1,833,95,73],"offset":[-50,-72.92]},{"rect":[98,833,96,73],"offset":[-51,-72.92]},{"rect":[196,833,96,72],"offset":[-51,-71.92]},{"rect":[294,833,97,70],"offset":[-52,-69.92]},{"rect":[393,833,97,68],"offset":[-52,-67.92]},{"rect":[492,833,97,68],"offset":[-52,-67.92]},{"rect":[591,833,97,70],"offset":[-52,-69.92]},{"rect":[1,908,96,72],"offset":[-51,-71.92]},{"rect":[99,908,96,73],"offset":[-51,-72.92]},{"rect":[197,908,95,73],"offset":[-50,-72.92]},{"rect":[294,908,95,73],"offset":[-50,-72.92]}],"react-evolving-left":[{"rect":[391,908,95,73],"offset":[-50,-72.92]},{"rect":[488,908,91,74],"offset":[-47,-73.92]},{"rect":[581,908,79,68],"offset":[-40,-67.92]},{"rect":[662,908,74,68],"offset":[-38,-67.92]},{"rect":[1,984,76,71],"offset":[-40,-70.92]},{"rect":[79,984,78,73],"offset":[-42,-72.92]},{"rect":[159,984,79,72],"offset":[-43,-71.92]},{"rect":[240,984,79,71],"offset":[-43,-70.92]},{"rect":[321,984,79,71],"offset":[-43,-70.92]},{"rect":[402,984,84,72],"offset":[-45,-71.92]},{"rect":[488,984,93,73],"offset":[-49,-72.92]},{"rect":[583,984,95,73],"offset":[-50,-72.92]}],"react-ordinary-right":[{"rect":[1,1059,97,73],"offset":[-47,-72.92]},{"rect":[100,1059,97,73],"offset":[-47,-72.92]},{"rect":[199,1059,97,73],"offset":[-47,-72.92]},{"rect":[298,1059,98,72],"offset":[-47,-71.92]},{"rect":[398,1059,98,70],"offset":[-47,-69.92]},{"rect":[498,1059,99,68],"offset":[-47,-67.92]},{"rect":[599,1059,99,68],"offset":[-47,-67.92]},{"rect":[1,1134,98,70],"offset":[-47,-69.92]},{"rect":[101,1134,98,72],"offset":[-47,-71.92]},{"rect":[201,1134,97,73],"offset":[-47,-72.92]},{"rect":[300,1134,97,73],"offset":[-47,-72.92]},{"rect":[399,1134,97,73],"offset":[-47,-72.92]}],"react-evolving-right":[{"rect":[498,1134,97,73],"offset":[-47,-72.92]},{"rect":[597,1134,92,74],"offset":[-46,-73.92]},{"rect":[1,1210,81,69],"offset":[-41,-68.92]},{"rect":[84,1210,74,69],"offset":[-37,-68.92]},{"rect":[160,1210,76,73],"offset":[-37,-72.92]},{"rect":[238,1210,79,74],"offset":[-37,-73.92]},{"rect":[319,1210,80,71],"offset":[-37,-70.92]},{"rect":[401,1210,80,71],"offset":[-37,-70.92]},{"rect":[483,1210,80,71],"offset":[-37,-70.92]},{"rect":[565,1210,86,72],"offset":[-41,-71.92]},{"rect":[653,1210,94,73],"offset":[-46,-72.92]},{"rect":[1,1286,97,73],"offset":[-47,-72.92]}]},"atlas":[768,1360],"image":"fish/b7bbc1bc0c93242a736e.png"};
return {mountBundledStage(container,options){return __entry.mountStage(container,{...options,ui:{...ui,fontBytes:Uint8Array.from(atob(ui.font),c=>c.charCodeAt(0)).buffer},manifest,loadAtlas:async name=>{const r=await options.loadResource(name);if(r.type!=="image/png"||!ArrayBuffer.isView(r.bytes))throw Error("像素资源格式无效");return createImageBitmap(new Blob([r.bytes],{type:r.type}),{premultiplyAlpha:"none"});}});}};
}});
