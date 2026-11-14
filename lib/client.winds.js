// Generated; 2D animation and bundled font.
window.__ModuleLoader__.load({id:'dsh-braingames/client.winds.js',factory:require=>{
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
__defs["games/balloon-winds/difficulty.mjs"]=()=>{
const ROUND_MS = 30000;

const STARS_PER_STAGE = 5;

const DIFFICULTY = [
  {clouds: 3, steps: 2, axes: 1, operations: 2, mixed: [0, 1], unit: 5, regroups: [0, 0], thinkMs: 4000},
  {clouds: 3, steps: 2, axes: 2, operations: 2, mixed: [0, 1], unit: 5, regroups: [0, 1], thinkMs: 4800},
  {clouds: 3, steps: 2, axes: 2, operations: 2, mixed: [0, 1], unit: 2, regroups: [0, 1], thinkMs: 5200},
  {clouds: 3, steps: 2, axes: 2, operations: 3, mixed: [0, 1], unit: 2, regroups: [0, 1], thinkMs: 5500},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 2, regroups: [0, 1], thinkMs: 5800},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 1, regroups: [0, 1], thinkMs: 6000},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6200},
  {clouds: 4, steps: 3, axes: 2, operations: 4, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6300},
  {clouds: 4, steps: 3, axes: 2, operations: 5, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6500},
  {clouds: 4, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [1, 2], thinkMs: 7000},
  {clouds: 5, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [1, 2], thinkMs: 7400},
  {clouds: 5, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [2, 3]},
].map((level, index) => ({...level, stars: index * STARS_PER_STAGE}));

function difficultyAt(stars) {
  const index = DIFFICULTY.findLastIndex(level => stars >= level.stars);
  return {...DIFFICULTY[index], stage: index + 1};
}

return {ROUND_MS,DIFFICULTY,difficultyAt};
};
__defs["games/balloon-winds/core.mjs"]=()=>{
const {createRandom}=__get("runtime/random-state.mjs");
const {difficultyAt, ROUND_MS}=__get("games/balloon-winds/difficulty.mjs");
const MIN_VIEW = {width: 320, height: 400};
const FLIGHT_BOUNDS = {left: 14, right: 86, bottom: 14, top: 74};
const GOALS = {left: 20, right: 80, bottom: 18, top: 70};
const START = {x: 30, y: 45};
const FIRST_STAR_X = 40;
const ORIGIN = {x: 0, y: 0};
// With both axes active, the operation count determines the wind shapes.
const AXIS_ORDERS = {
  2: [['x', 'y'], ['y', 'x']],
  3: [['xy', 'x'], ['x', 'xy'], ['xy', 'y'], ['y', 'xy']],
  4: [['xy', 'x', 'y'], ['xy', 'y', 'x'], ['x', 'xy', 'y'], ['y', 'xy', 'x'], ['x', 'y', 'xy'], ['y', 'x', 'xy']],
  5: [['x', 'xy', 'xy'], ['xy', 'x', 'xy'], ['xy', 'xy', 'x'], ['y', 'xy', 'xy'], ['xy', 'y', 'xy'], ['xy', 'xy', 'y']],
  6: [['xy', 'xy', 'xy']],
};

const same = (a, b) => a.x === b.x && a.y === b.y;
const plus = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
const signedWind = (wind, direction) => ({x: wind.x * direction, y: wind.y * direction});
const difference = (target, point) => ({x: target.x - point.x, y: target.y - point.y});
const fitsStep = ({x, y}, unit) => x % unit === 0 && y % unit === 0;

function inside({x, y}, bounds = FLIGHT_BOUNDS) {
  return x >= bounds.left && x <= bounds.right && y >= bounds.bottom && y <= bounds.top;
}

function shuffle(items, random) {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function range(min, max, unit, anchor = 0) {
  const values = [];
  const start = anchor + Math.ceil((min - anchor) / unit) * unit;
  for (let value = start; value <= max; value += unit) values.push(value);
  return values;
}

function canUse(point, wind) {
  return inside(plus(point, wind)) || inside(plus(point, signedWind(wind, -1)));
}

function regroups(position, amount, sign) {
  const currentOnes = position % 10;
  const windOnes = amount % 10;
  return sign === 1 ? currentOnes + windOnes >= 10 : currentOnes < windOnes;
}

function routePlans(level, tutorial, flexible, random) {
  const {steps, operations, mixed: [minimum, maximum]} = level;
  const orders = tutorial ? [Array(steps).fill('x')] : [...AXIS_ORDERS[operations]];
  if (flexible && !tutorial && operations < 2 * steps) orders.push(Array(steps).fill('xy'));
  const signsByStep = steps === 2
    ? [[1, 1], [-1, -1], [1, -1], [-1, 1]]
    : [[1, 1, 1], [-1, -1, -1], [1, 1, -1], [1, -1, 1], [-1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
  const plans = [];
  for (const order of orders) {
    for (const signs of signsByStep) {
      const additions = order.reduce((count, axes, index) => count + (signs[index] === 1 ? axes.length : 0), 0);
      const mixed = Math.min(additions, operations - additions);
      if (!flexible && (mixed < minimum || mixed > maximum)) continue;
      plans.push({signs, movesX: order.map(axes => axes.includes('x')), movesY: order.map(axes => axes.includes('y'))});
    }
  }
  return shuffle(plans, random);
}

// Solve one component for a fixed target. The last magnitude follows from the
// remaining difference, so only the first one or two moves are enumerated.
function* axisRoutes(from, target, min, max, signs, values, active, regroupLimit, flexible, maximum) {
  function* visit(position, index, amounts, regroupCount) {
    const sign = signs[index];
    const last = index === signs.length - 1;
    const onlyZero = !active[index];
    const allowZero = flexible || onlyZero;
    const options = last ? [(target - position) * sign] : onlyZero ? [0] : values;
    for (const amount of options) {
      if (amount < 0 || amount > maximum || (amount === 0 && !allowZero) || (onlyZero && amount !== 0)) continue;
      const next = position + amount * sign;
      if (next < min || next > max) continue;
      const nextRegroups = regroupCount + Number(regroups(position, amount, sign));
      if (nextRegroups > regroupLimit) continue;
      const nextAmounts = [...amounts, amount];
      if (last) yield {amounts: nextAmounts, regroups: nextRegroups};
      else yield* visit(next, index + 1, nextAmounts, nextRegroups);
    }
  }
  yield* visit(from, 0, [], 0);
}

function reaches(winds, target, steps, first = 0) {
  if (same(target, ORIGIN)) return true;
  if (steps === 0) return false;
  for (let index = first; index < winds.length; index++) {
    for (const sign of [1, -1]) {
      if (reaches(winds, difference(target, signedWind(winds[index], sign)), steps - 1, index + 1)) return true;
    }
  }
  return false;
}

function* routesTo(position, target, level, plan, values, flexible, maximum) {
  const {signs, movesX, movesY} = plan;
  const [minimum, limit] = flexible ? [0, 2 * level.steps] : level.regroups;
  const delta = difference(target, position);
  if (!fitsStep(delta, level.unit)) return;
  const xRoutes = axisRoutes(position.x, target.x, FLIGHT_BOUNDS.left, FLIGHT_BOUNDS.right,
    signs, values, movesX, limit, flexible, maximum);
  let yRoutes;
  for (const x of xRoutes) {
    yRoutes ??= [...axisRoutes(position.y, target.y, FLIGHT_BOUNDS.bottom, FLIGHT_BOUNDS.top,
      signs, values, movesY, limit, flexible, maximum)];
    if (!yRoutes.length) return;
    for (const y of yRoutes) {
      const total = x.regroups + y.regroups;
      if (total < minimum || total > limit) continue;
      const winds = x.amounts.map((amount, index) => ({x: amount, y: y.amounts[index]}));
      if (winds.some((wind, index) => same(wind, ORIGIN) || winds.slice(0, index).some(other => same(wind, other)))) continue;
      if (!reaches(winds, delta, level.steps - 1)) yield winds;
    }
  }
}

function addCandidates(route, position, target, level, random, includeDetour) {
  const winds = [...route];
  const delta = difference(target, position);
  const {unit, steps} = level;
  function add(wind) {
    if (!fitsStep(wind, unit) || wind.x < 0 || wind.y < 0 || same(wind, ORIGIN) ||
      winds.some(other => same(other, wind)) || !canUse(position, wind)) return false;
    for (const sign of [1, -1]) {
      if (steps > 1 && reaches(winds, difference(delta, signedWind(wind, sign)), steps - 2)) return false;
    }
    winds.push(wind);
    return true;
  }
  // Splitting a move in the reference route creates a longer legal route.
  // Both moves use the original sign and stay between its two endpoints.
  if (includeDetour && winds.length + 2 <= level.clouds) {
    const candidateCount = winds.length;
    for (const original of route) {
      const half = {x: Math.floor(original.x / (2 * unit)) * unit, y: Math.floor(original.y / (2 * unit)) * unit};
      for (const offset of [{x: 0, y: 0}, {x: unit, y: 0}, {x: 0, y: unit}]) {
        const first = plus(half, offset);
        const second = difference(original, first);
        if (add(first) && add(second)) break;
        winds.length = candidateCount;
      }
      if (winds.length > candidateCount) break;
    }
  }

  const extras = [];
  const values = range(0, level.axes === 1 ? 20 : 40, unit);
  for (const x of values) {
    for (const y of level.axes === 1 ? [0] : values) {
      if (level.operations === steps && x && y) continue;
      if (x || y) extras.push({x, y});
    }
  }
  for (const wind of shuffle(extras, random)) {
    if (winds.length === level.clouds) break;
    add(wind);
  }
  return winds.length === level.clouds ? shuffle(winds, random) : null;
}

function nextPuzzle(position, level, random, serial, fixedTarget, relaxed = false) {
  const flexible = Boolean(fixedTarget) || relaxed;
  const tutorial = level.axes === 1 && (!fixedTarget || fixedTarget.y === position.y);
  const largestWind = tutorial ? 20 : 40;
  const maximum = flexible ? 100 : largestWind;
  const values = shuffle(range(flexible ? 0 : level.unit, largestWind, level.unit), random);
  const plans = routePlans(level, tutorial, flexible, random);
  const xs = fixedTarget ? [fixedTarget.x] : tutorial && serial === 0 ? [FIRST_STAR_X]
    : shuffle(range(GOALS.left, GOALS.right, level.unit, position.x), random);
  const ys = fixedTarget ? [fixedTarget.y] : tutorial ? [position.y]
    : shuffle(range(GOALS.bottom, GOALS.top, level.unit, position.y), random);

  for (const plan of plans) {
    const firstX = plan.signs[plan.movesX.indexOf(true)] ?? 0;
    const firstY = plan.signs[plan.movesY.indexOf(true)] ?? 0;
    if (!flexible && !inside(plus(position, {x: firstX * level.unit, y: firstY * level.unit}))) continue;
    for (const x of xs) {
      for (const y of ys) {
        const target = {x, y};
        if (same(target, position)) continue;
        if (!fixedTarget && !tutorial) {
          const delta = difference(target, position);
          if (!delta.x || !delta.y || Math.abs(delta.x) + Math.abs(delta.y) < 15) continue;
        }
        for (const route of routesTo(position, target, level, plan, values, flexible, maximum)) {
          const winds = addCandidates(route, position, target, level, random, !flexible && serial % 3 === 2);
          if (winds) return {target, winds};
        }
      }
    }
  }
  return null;
}

class ScreenFlight {
  constructor({seed = 0, saved} = {}) {
    this.random = createRandom(seed);
    if (saved) {
      if (saved.version !== 2 && saved.version !== 3) throw Error('摘星存档版本无效');
      this.random.restore(saved.random);
      const {origin, windsLeft, ...state} = structuredClone(saved.state);
      if (saved.version === 2) {
        state.position.y = 100 - state.position.y;
        state.target.y = 100 - state.target.y;
        // A suspended board keeps its clouds and pending flight until it is resolved.
        for (const wind of state.clouds) wind.y = wind.y === 0 ? 0 : -wind.y;
      }
      this.state = state;
      const {unit, stage} = difficultyAt(state.stars);
      // An in-progress board from an older tier stays intact through its next landing.
      if (stage === state.stage && unit > 1 && state.hearts && !state.loss &&
        (!fitsStep(difference(state.target, state.position), unit) ||
          state.clouds.some(wind => !fitsStep(wind, unit)))) {
        this.#deal(state.remainingMs);
      }
      return;
    }
    this.state = {position: {...START}, stars: 0, hearts: 3, serial: 0};
    this.#deal();
  }

  #place({target, winds}, minimum) {
    const s = this.state;
    s.serial++;
    s.target = target;
    s.minimum = minimum;
    s.clouds = winds.map((wind, index) => ({...wind, id: s.serial + '-' + index}));
  }

  #deal(remainingMs = ROUND_MS) {
    const s = this.state;
    const level = difficultyAt(s.stars);
    const puzzle = nextPuzzle(s.position, level, this.random, s.serial) ??
      nextPuzzle(s.position, level, this.random, s.serial, null, true);
    if (!puzzle) throw Error('当前坐标无法生成本关路线');
    s.stage = level.stage;
    s.remainingMs = remainingMs;
    s.loss = null;
    this.#place(puzzle, level.steps);
  }

  draftPosition(point) {
    const s = this.state;
    const level = difficultyAt(s.stars);
    const snap = (value, anchor, min, max) => {
      const unit = level.unit;
      const offset = Math.round((value - anchor) / unit);
      return anchor + unit * Math.max(Math.ceil((min - anchor) / unit), Math.min(Math.floor((max - anchor) / unit), offset));
    };
    return {
      x: snap(point.x, s.target.x, FLIGHT_BOUNDS.left, FLIGHT_BOUNDS.right),
      y: level.axes === 1 && s.position.y === s.target.y
        ? s.position.y : snap(point.y, s.target.y, FLIGHT_BOUNDS.bottom, FLIGHT_BOUNDS.top),
    };
  }

  relocate(point) {
    const s = this.state;
    const next = this.draftPosition(point);
    if (!s.hearts || s.loss || same(next, s.position) || same(next, s.target)) return false;
    const level = difficultyAt(s.stars);
    const previousRandom = this.random.getState();
    const puzzle = nextPuzzle(next, level, this.random, s.serial, s.target);
    if (!puzzle) {
      this.random.restore(previousRandom);
      return false;
    }
    s.position = next;
    this.#place(puzzle, level.steps);
    return true;
  }

  endpoint(id, direction = 1) {
    const s = this.state;
    const selected = s.clouds.find(wind => wind.id === id);
    if (!selected || !s.hearts || s.loss || (direction !== -1 && direction !== 1)) return null;
    const point = plus(s.position, signedWind(selected, direction));
    return inside(point) ? point : null;
  }

  #lose(reason) {
    const s = this.state;
    s.hearts--;
    s.loss = reason;
    s.clouds = [];
    s.remainingMs = 0;
  }

  elapse(ms) {
    const s = this.state;
    if (!s.hearts || s.loss) return false;
    s.remainingMs = Math.max(0, s.remainingMs - ms);
    if (s.remainingMs > 0) return false;
    this.#lose('timeout');
    return true;
  }

  land(id, direction = 1) {
    const point = this.endpoint(id, direction);
    if (!point) throw Error('该风无法抵达屏幕内的落点');
    const s = this.state;
    s.position = point;
    s.clouds = s.clouds.filter(wind => wind.id !== id);
    if (same(point, s.target)) {
      s.stars++;
      this.#deal();
      return 'star';
    }
    if (!s.clouds.length) {
      this.#lose('wind');
      return 'miss';
    }
    return 'wind';
  }

  afterLoss() {
    if (!this.state.loss || !this.state.hearts) return;
    this.#deal();
  }

  checkpoint() {
    return {version: 3, random: this.random.getState(), state: structuredClone(this.state)};
  }
}

return {MIN_VIEW,FLIGHT_BOUNDS,same,plus,signedWind,inside,ScreenFlight};
};
__defs["games/balloon-winds/layout.mjs"]=()=>{
const {createRandom}=__get("runtime/random-state.mjs");
const CLOUD_W = 70;
const CLOUD_H = 43;
const SLOT_W = CLOUD_W + 8;
const SLOT_H = CLOUD_H + 10;
const PIN_W = 72;
const PIN_H = 23;

function balloonScale(width, height) {
  return Math.min(1, width / 430, height / 610);
}

function intersects(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

function balloonFootprint(position, scale) {
  const top = 154 * scale;
  return {x: position.x, y: position.y + (55 - top) / 2, w: 124, h: top + 55};
}

function pinAt(width, height, x, y) {
  const left = Math.ceil(PIN_W / 2) + 3;
  const top = Math.ceil(PIN_H / 2) + 3;
  return {
    x: Math.max(left, Math.min(width - left, Math.round(x))),
    y: Math.max(top, Math.min(height - top, Math.round(y))),
    w: PIN_W, h: PIN_H,
  };
}

function nearestClearPin(width, height, preferred, obstacles) {
  const clear = pin => obstacles.every(obstacle => !intersects(pin, obstacle));
  if (clear(preferred)) return preferred;

  // The nearest free center lies on a viewport or expanded obstacle edge.
  const xs = new Set([preferred.x, 0, width]);
  const ys = new Set([preferred.y, 0, height]);
  for (const {x, y, w, h} of obstacles) {
    const dx = (w + PIN_W) / 2 + 3;
    const dy = (h + PIN_H) / 2 + 3;
    xs.add(Math.floor(x - dx)).add(Math.ceil(x + dx));
    ys.add(Math.floor(y - dy)).add(Math.ceil(y + dy));
  }
  let best;
  let bestDistance = Infinity;
  for (const x of xs) for (const y of ys) {
    const pin = pinAt(width, height, x, y);
    const distance = (pin.x - preferred.x) ** 2 + (pin.y - preferred.y) ** 2;
    if (distance < bestDistance && clear(pin)) {
      best = pin;
      bestDistance = distance;
    }
  }
  return best;
}

function placeCoordinatePins(width, height, position, star, scale, cloudSlots) {
  const current = pinAt(width, height, position.x, position.y + 11 + 17 * scale);
  const preferred = pinAt(width, height, star.x, star.y + 28);
  const landmarks = [current, balloonFootprint(position, scale), {x: star.x, y: star.y, w: 30, h: 30}];
  const target = nearestClearPin(width, height, preferred, [...landmarks, ...cloudSlots]) ??
    nearestClearPin(width, height, preferred, landmarks);
  return {current, target};
}

function slotAxis(size, padding, gap) {
  const intervals = Math.floor((size - 2 * padding) / gap);
  return Array.from({length: intervals + 1}, (_, index) => padding + index * (size - 2 * padding) / intervals);
}

function placeClouds(width, height, {position, target, serial, clouds}, previous = new Map()) {
  const block = [
    balloonFootprint(position, balloonScale(width, height)),
    {x: target.x, y: target.y + 3, w: 110, h: 92},
  ];
  const random = createRandom(serial, 3598);
  const xs = slotAxis(width, 40, Math.max(SLOT_W, Math.floor(width / 14)));
  const ys = slotAxis(height, 25, Math.max(SLOT_H, Math.floor(height / 15)));
  const slots = [];
  for (const y of ys) {
    for (const x of xs) {
      const slot = {x, y, w: SLOT_W, h: SLOT_H, tie: random() * 9000};
      if (!block.some(other => intersects(slot, other))) slots.push(slot);
    }
  }

  const result = new Map();
  for (const wind of clouds) {
    const old = previous.get(wind.id);
    const retained = old && slots.find(slot => slot.x === old.x && slot.y === old.y);
    if (!retained) continue;
    result.set(wind.id, retained);
    slots.splice(slots.indexOf(retained), 1);
  }

  for (const wind of clouds) {
    if (result.has(wind.id)) continue;
    const neighbors = [position, target, ...result.values()];
    let winner = -1;
    let best = -Infinity;
    for (const [index, slot] of slots.entries()) {
      const gap = Math.min(...neighbors.map(other => (slot.x - other.x) ** 2 + (slot.y - other.y) ** 2));
      const margin = Math.min(slot.x, width - slot.x, slot.y, height - slot.y);
      const score = Math.min(gap, 35000) + 51 * margin + slot.tie;
      if (score > best) { best = score; winner = index; }
    }
    if (winner === -1) throw Error('当前窗口放不下云朵');
    result.set(wind.id, slots.splice(winner, 1)[0]);
  }
  return result;
}

return {CLOUD_W,CLOUD_H,PIN_W,PIN_H,balloonScale,placeCoordinatePins,placeClouds};
};
__defs["games/balloon-winds/scene.mjs"]=()=>{
const {VERDICT_CROSS}=__get("runtime/presentation.mjs");
const {ROUND_MS}=__get("games/balloon-winds/difficulty.mjs");
const ART_URL = new URL('./assets/motion.json', "braingames:/scene.mjs");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

async function loadMotion({manifest, loadAtlas} = {}) {
  let motion = manifest;
  if (!motion) {
    const response = await fetch(ART_URL);
    if (!response.ok) throw Error('动作清单加载失败');
    motion = await response.json();
  }
  const atlas = loadAtlas ? await loadAtlas(motion.image) : new Image();
  if (!loadAtlas) {
    atlas.src = new URL('./motion.png', ART_URL).href;
    await atlas.decode();
  }
  if (atlas.width !== motion.atlas[0] || atlas.height !== motion.atlas[1]) {
    atlas.close?.();
    throw Error('动作图集尺寸不符');
  }
  return {...motion, atlas};
}

function flightDuration(motion, hit) {
  return ((hit ? motion.end : motion.landingFrame + 3) - 1) * 1000 / motion.fps;
}

function motionSample(motion, flight) {
  const end = flight.hit ? motion.end : motion.landingFrame + 3;
  const elapsed = clamp(flight.elapsed, 0, flightDuration(motion, flight.hit));
  let frame = 1 + elapsed * motion.fps / 1000;
  if (flight.hit) {
    const dockMs = (motion.dockFrame - 1) * 1000 / motion.fps;
    const contactMs = (motion.landingFrame - 1) * 1000 / motion.fps - 150;
    if (elapsed >= contactMs) {
      const t = (elapsed - contactMs) / (flightDuration(motion, true) - contactMs);
      frame = mix(motion.landingFrame, motion.end, t);
    } else if (elapsed > dockMs) {
      frame = mix(motion.dockFrame, motion.landingFrame, (elapsed - dockMs) / (contactMs - dockMs));
    }
  }
  const cel = Math.floor(frame);
  const progress = ease(clamp((frame - (motion.pushFrame - 1)) /
    (motion.landingFrame - (motion.pushFrame - 1)), 0, 1));
  const position = {x: mix(flight.from.x, flight.to.x, progress),
    y: mix(flight.from.y, flight.to.y, progress)};
  const angle = Math.atan2(flight.wind.y, flight.wind.x);
  const approach = clamp((frame - 1) / (motion.dockFrame - 1), 0, 1);
  const tuck = clamp((frame - motion.dockFrame) / 4, 0, 1);
  const dock = {x: flight.from.x - Math.cos(angle) * (51 - 13 * tuck),
    y: flight.from.y - Math.sin(angle) * (51 - 13 * tuck) - 11};
  const t = ease(approach);
  const cloud = {x: mix(flight.cloudAt.x, dock.x, t),
    y: mix(flight.cloudAt.y, dock.y, t) - Math.sin(Math.PI * approach) * 15};
  return {cel, frame, position, angle, cloud, left: flight.wind.x < 0,
    atTarget: frame >= motion.landingFrame, done: frame >= end};
}

function hoveringCloud(point, id, clock, batchAge, animate) {
  if (!animate) return {...point, scale: 1, opacity: 1};
  const phase = id.split('-').map(Number).reduce((a, b) => a * 1.31 + b, 0);
  const phaseClock = clock / 950 + phase;
  const reveal = ease(clamp((batchAge - (phase % 3) * 37) / 250, 0, 1));
  return {
    x: point.x + Math.sin(phaseClock * .81) * 2.5,
    y: point.y + Math.cos(phaseClock) * 3.5,
    scale: mix(.76, 1, reveal) * (1 + Math.sin(phaseClock) * .024),
    opacity: mix(.42, 1, reveal),
  };
}

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const MISS_MS = 650;

function sprite(ctx, atlas, cell, point, {angle = 0, scaleX = 1, scaleY = 1, opacity = 1} = {}) {
  if (!cell?.rect) return;
  const [sx, sy, w, h] = cell.rect;
  const [ox, oy] = cell.offset;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(Math.round(point.x), Math.round(point.y));
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(atlas, sx, sy, w, h, Math.round(ox), Math.round(oy), w, h);
  ctx.restore();
}

function drawRuleArt(add, subtract, art) {
  const steps = [
    {canvas: add, wind: '(15,0)', left: '(30,45)', right: '(45,45)', direction: 1},
    {canvas: subtract, wind: '(5,0)', left: '(40,45)', right: '(45,45)', direction: -1},
  ];
  for (const {canvas, wind, left, right, direction} of steps) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = 'center';
    sprite(ctx, art.atlas, art.layers.cloud[0], {x: 56, y: 22}, {scaleX: 1.13, scaleY: 1.14});
    ctx.fillStyle = '#344854';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(wind, 56, 27);

    if (direction < 0) sprite(ctx, art.atlas, art.layers.star[0], {x: 25, y: 39}, {scaleX: .55, scaleY: .55});
    ctx.fillStyle = '#42332e';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(left, 25, 57);
    ctx.fillText(right, 87, 57);
    ctx.fillRect(49, 52, 14, 2);
    const tip = 56 + direction * 7;
    for (let offset = 0; offset < 4; offset++) {
      ctx.fillRect(tip - direction * offset, 51 - offset, 1, 4 + 2 * offset);
    }
  }
}

function makeScene(canvas, art) {
  const ctx = canvas.getContext('2d');
  const stand = art.layers.balloon[0];
  const cloudRest = art.layers.cloud[0];
  const star = art.layers.star[0];
  const cel = (cell, point, options) => sprite(ctx, art.atlas, cell, point, options);
  // Reuse one small surface so heat colouring affects the envelope's alpha only.
  const craft = document.createElement('canvas');
  const craftCtx = craft.getContext('2d');
  const actorCells = ['balloon', 'balloonLeft', 'collect', 'collectLeft', 'blink', 'loss']
    .flatMap(name => art.layers[name]);
  craft.width = Math.max(...actorCells.map(cell => cell.rect[2]));
  craft.height = Math.max(...actorCells.map(cell => cell.rect[3]));
  craftCtx.imageSmoothingEnabled = false;

  function drawCraft(cell, point, scale, angle, heat, breath) {
    const [sx, sy, w, h] = cell.rect;
    const [ox, oy] = cell.offset;
    const fabric = clamp(Math.ceil(cell.canopy[1] - oy), 1, h - 1);
    const inflated = Math.min(fabric, Math.round(fabric * (.81 + .19 * heat + breath)));
    const top = fabric - inflated;
    craftCtx.clearRect(0, 0, w, h);
    craftCtx.drawImage(art.atlas, sx, sy + fabric, w, h - fabric, 0, fabric, w, h - fabric);
    craftCtx.drawImage(art.atlas, sx, sy, w, fabric, 0, top, w, inflated);
    const cooled = Math.round(inflated * (1 - heat));
    if (cooled > 0) {
      craftCtx.globalCompositeOperation = 'source-atop';
      craftCtx.fillStyle = 'rgba(83,111,148,.62)';
      craftCtx.fillRect(0, top, w, cooled);
      craftCtx.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.translate(Math.round(point.x), Math.round(point.y));
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.drawImage(craft, 0, 0, w, h, Math.round(ox), Math.round(oy), w, h);
    ctx.restore();
  }

  function drawHearts(position, hearts, actorScale) {
    const x = clamp(Math.round(position.x) - 25, 3, canvas.width - 53);
    const y = Math.min(canvas.height - 18, Math.round(position.y + 28 + 17 * actorScale));
    ctx.fillStyle = '#faedcf';
    ctx.fillRect(x, y, 50, 17);
    ctx.strokeStyle = '#806746';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, 49, 16);
    for (let index = 0; index < 3; index++) {
      for (const [row, pixels] of HEART.entries()) {
        for (const [column, mark] of [...pixels].entries()) {
          if (mark !== '#') continue;
          const cx = x + 4 + 16 * index + 2 * column;
          const cy = y + 3 + 2 * row;
          ctx.fillStyle = index < hearts ? '#a44746' : '#c8b89a';
          ctx.fillRect(cx, cy, 2, 2);
        }
      }
    }
  }

  function glint(x, y, size, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#d5a35f';
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - size, 3, size * 2 + 1);
    ctx.fillRect(Math.round(x) - size, Math.round(y) - 1, size * 2 + 1, 3);
    ctx.fillStyle = '#fff5c8';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    ctx.restore();
  }

  function pickUpStar(cell, frame, position, target, actorScale, animate) {
    const reach = ease(clamp((frame - art.landingFrame) / (30 - art.landingFrame), 0, 1));
    const stow = ease(clamp((frame - 32) / (art.end - 32), 0, 1));
    const hand = {x: position.x + cell.palm[0] * actorScale, y: position.y + cell.palm[1] * actorScale};
    const carried = {x: mix(target.x, hand.x, reach),
      y: mix(target.y, hand.y, reach) - 13 * Math.sin(Math.PI * reach) * actorScale};
    const size = (1 - .45 * reach - .19 * stow) * Math.max(.78, actorScale);
    cel(star, carried, {scaleX: size, scaleY: size, opacity: 1 - stow});
    const shine = clamp((frame - 29.3) / 4.7, 0, 1);
    if (shine > 0 && shine < 1) {
      for (let i = 0; i < (animate ? 5 : 1); i++) {
        const angle = i * Math.PI * .4;
        const radius = (5 + 15 * shine) * actorScale;
        glint(hand.x + Math.cos(angle) * radius, hand.y + Math.sin(angle) * radius, 2, 1 - shine);
      }
    }
  }

  function missMark(position, age, animate) {
    const x = Math.round(position.x + 33);
    const y = Math.round(position.y - 43 - (animate ? age / 68 : 0));
    ctx.save();
    ctx.globalAlpha = animate ? clamp((MISS_MS - age) / 150, 0, 1) : 1;
    for (const [dx, dy] of VERDICT_CROSS) {
      ctx.fillStyle = '#fff8e4';
      ctx.fillRect(x + dx * 2 - 3, y + dy * 2 - 3, 10, 10);
    }
    for (const [dx, dy] of VERDICT_CROSS) {
      ctx.fillStyle = '#263248';
      ctx.fillRect(x + dx * 2 - 2, y + dy * 2 - 2, 8, 8);
    }
    for (const [dx, dy] of VERDICT_CROSS) {
      ctx.fillStyle = '#e5a2a1';
      ctx.fillRect(x + dx * 2, y + dy * 2, 4, 4);
    }
    ctx.restore();
  }

  return {
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;
    },
    clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); },
    paint(state, places, {flight, sample, position, target, actorScale, clock, animate, missAge, dragging}) {
      this.clear();
      for (const wind of state.clouds) {
        if (wind.id === flight?.id) continue;
        const point = places.get(wind.id);
        cel(cloudRest, point, {scaleX: 1.13 * point.scale, scaleY: 1.14 * point.scale, opacity: point.opacity});
      }
      const catching = flight?.hit && sample.cel >= art.layers.collect[0].frame;
      const blink = animate && clock % 3700 > 3410 && clock % 3700 < 3550;
      let balloon = missAge !== null ? art.layers.loss[0] : blink ? art.layers.blink[0] : stand;
      if (flight) {
        const poses = catching ? art.layers[sample.left ? 'collectLeft' : 'collect']
          : art.layers[sample.left ? 'balloonLeft' : 'balloon'];
        balloon = poses[sample.cel - poses[0].frame];
      }
      const sway = animate && !flight ? Math.sin(clock / 570) * (dragging ? .036 : .030) : 0;
      const dip = animate && missAge !== null ? 6 * Math.sin(Math.PI * missAge / MISS_MS) : 0;
      const actorPosition = dip ? {x: position.x, y: position.y + dip} : position;
      const breath = animate ? -.015 * (1 + Math.sin(clock / 310)) : 0;
      drawCraft(balloon, actorPosition, actorScale, sway, state.remainingMs / ROUND_MS, breath);
      if (!flight || !sample.atTarget || !flight.hit) {
        const pulse = animate ? (Math.sin(clock / 245) + 1) / 2 : 0;
        const scale = 1 + .085 * pulse;
        cel(star, target, {scaleX: scale, scaleY: scale});
        if (pulse > .2) glint(target.x + 14, target.y - 10, pulse > .74 ? 3 : 2, pulse * .72);
      }
      if (flight) {
        cel(art.layers.cloud[sample.cel - 1], sample.cloud, {scaleX: 1.13, scaleY: 1.14});
        cel(art.layers.gust[sample.cel - 10], position, {angle: sample.angle});
      }
      if (catching && sample.atTarget) pickUpStar(balloon, sample.frame, position, target, actorScale, animate);
      drawHearts(position, state.hearts, actorScale);
      if (missAge !== null) missMark(position, missAge, animate);
    },
    drawLobby(companion, finished) {
      const paint = companion.getContext('2d');
      paint.imageSmoothingEnabled = false;
      paint.clearRect(0, 0, companion.width, companion.height);
      const point = {x: 100, y: 171};
      const pose = finished ? art.layers.collect.find(cell => cell.frame === 31) : stand;
      sprite(paint, art.atlas, pose, point);
      if (finished) sprite(paint, art.atlas, star,
        {x: point.x + pose.palm[0], y: point.y + pose.palm[1]}, {scaleX: .72, scaleY: .72});
    },
    pilotAt(position, scale) {
      return {x: position.x + stand.pilot[0] * scale, y: position.y + stand.pilot[1] * scale};
    },
  };
}

return {loadMotion,flightDuration,motionSample,hoveringCloud,MISS_MS,drawRuleArt,makeScene};
};
__defs["games/balloon-winds/experience.mjs"]=()=>{
const {createMoveHandle}=__get("runtime/move-handle.mjs");
const {RECOVERY_MS}=__get("runtime/presentation.mjs");
const {GAME_COPY, SHARED_COPY}=__get("runtime/game-catalog.mjs");
const {applyCopy}=__get("runtime/apply-copy.mjs");
const {mountControlGuide}=__get("runtime/control-guide.mjs");
const {createPixelText}=__get("runtime/pixel-text.mjs");
const {ScreenFlight, MIN_VIEW, same, signedWind}=__get("games/balloon-winds/core.mjs");
const {placeClouds, placeCoordinatePins, balloonScale, CLOUD_W, CLOUD_H, PIN_W, PIN_H}=__get("games/balloon-winds/layout.mjs");
const {ROUND_MS}=__get("games/balloon-winds/difficulty.mjs");
const {drawRuleArt, flightDuration, hoveringCloud, loadMotion, makeScene, motionSample, MISS_MS}=__get("games/balloon-winds/scene.mjs");
const copy = GAME_COPY['balloon-winds'];
const bestKey = 'braingames.balloon-winds.best.v2';
const MAX_FRAME_GAP_MS = 250;
const coordinates = ({x, y}) => '(' + Math.round(x) + ',' + Math.round(y) + ')';
const at = (element, x, y) => {
  const left = Math.round(x) + 'px', top = Math.round(y) + 'px';
  if (element.style.left !== left) element.style.left = left;
  if (element.style.top !== top) element.style.top = top;
};
const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };
const hide = (element, value) => { if (element.hidden !== value) element.hidden = value; };
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];

async function source(file) {
  const response = await fetch(new URL(file, "braingames:/experience.mjs"));
  if (!response.ok) throw Error('摘星文件加载失败 ' + file);
  return response.text();
}

function mountGame(host, options) {
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  const root = document.createElement('main');
  root.className = 'stage';
  root.style.setProperty('--pin-width', PIN_W + 'px');
  root.style.setProperty('--pin-height', PIN_H + 'px');
  shadow.append(style, root);
  const $ = id => root.querySelector('#' + id);
  const errors = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const font = new FontFace('Whale Wind Pixel', options.ui ? options.ui.fontBytes :
    'url("' + new URL('./ui/song-subset.ttf', "braingames:/experience.mjs").href + '")');
  let art, scene, pixelText, session, hold, observer, flight, drag, missStart = null;
  let saved = options.checkpoint;
  let places = new Map(), visualPlaces = new Map(), buttons = [];
  let width = 0, height = 0, small = false, ready = false, disposed = false, pending = false;
  let presented = false, frozen = false, recovery = 0, raf = null, last = null;
  let canReplay = true, canRandom = Boolean(options.canRandom), best = 0;
  let answerSince = null, clock = 0, lastPaint = 0, batchAt = 0, batchSerial = 0, edgeUntil = 0;
  const toScreen = ({x, y}) => ({x: x * width / 100, y: (100 - y) * height / 100});
  const toScreenWind = ({x, y}) => ({x: x * width / 100, y: -y * height / 100});
  const toBoard = ({x, y}) => ({x: x * 100 / width, y: 100 - y * 100 / height});

  function playing() { return Boolean(session?.state.hearts || missStart !== null); }
  function available() {
    return Boolean(session?.state.hearts && presented && !frozen && !small && !recovery &&
      !flight && !drag && missStart === null && !errors.length);
  }

  function updateInputs() {
    if (!ready) return;
    const blocked = !available();
    for (const button of buttons) {
      button.disabled = !presented || frozen || small;
      button.setAttribute('aria-disabled', String(blocked));
      hide(button, button.dataset.wind === flight?.id);
    }
    hide($('pilot'), !playing() || !presented || frozen || Boolean(flight));
    $('pilot').disabled = !presented || frozen || small;
    $('pilot').setAttribute('aria-disabled', String(!available()));
    hide($('resume'), !playing() || presented || !frozen);
    $('start').disabled = $('replay').disabled = !presented || small || !canReplay || pending;
    hide($('random'), !canRandom);
    $('random').disabled = !presented || small || pending;
  }

  function view() {
    if (errors.length) return 'error';
    if (!ready) return 'loading';
    if (!session && !saved) return 'welcome';
    if (session && !playing()) return 'finished';
    return presented ? 'playing' : 'paused';
  }

  function redraw() {
    if (!ready || small) return;
    const currentView = view();
    hide($('welcome'), currentView !== 'welcome');
    hide($('result'), currentView !== 'finished');
    hide($('error'), currentView !== 'error');
    const showScene = currentView === 'playing' || currentView === 'paused';
    hide($('clouds'), !showScene);
    hide($('lobby'), showScene);
    hide($('heat'), !showScene);
    hide($('flight-status'), !showScene);
    if (!showScene || !session) {
      scene.clear();
      const card = currentView === 'welcome' || currentView === 'finished';
      hide($('companion'), !card);
      if (card) scene.drawLobby($('companion'), currentView === 'finished');
      for (const id of ['current', 'target', 'tip', 'pilot', 'resume']) hide($(id), true);
      if (currentView === 'finished') {
        setText($('score'), String(session.state.stars));
        setText($('best-value'), String(best));
      }
      return;
    }

    const state = session.state;
    const target = toScreen(state.target);
    const actorScale = balloonScale(width, height);
    const sample = flight ? motionSample(art, {...flight, from: toScreen(flight.from), to: toScreen(flight.to), wind: toScreenWind(flight.wind)}) : null;
    const point = sample?.position ?? toScreen(drag?.draft ?? state.position);
    const animate = !reduced.matches;
    visualPlaces = new Map(state.clouds.map(wind => [
      wind.id, hoveringCloud(places.get(wind.id), wind.id, clock, clock - batchAt, animate),
    ]));
    scene.paint(state, visualPlaces, {flight, sample, position: point, target, actorScale, clock, animate,
      missAge: missStart === null ? null : clock - missStart, dragging: Boolean(drag)});
    for (const button of buttons) {
      const cloud = visualPlaces.get(button.dataset.wind);
      at(button, cloud.x, cloud.y);
      const opacity = String(Math.round(cloud.opacity * 100) / 100);
      if (button.style.opacity !== opacity) button.style.opacity = opacity;
    }
    setText($('current'), coordinates(toBoard(point)));
    setText($('target'), coordinates(state.target));
    const heat = String(Math.ceil(100 * state.remainingMs / ROUND_MS));
    if ($('heat').getAttribute('aria-valuenow') !== heat) $('heat').setAttribute('aria-valuenow', heat);
    setText($('flight-status'), state.hearts + ' 颗心');
    const pins = placeCoordinatePins(width, height, point, target, actorScale, places.values());
    at($('current'), pins.current.x, pins.current.y);
    at($('target'), pins.target.x, pins.target.y);
    hide($('target'), Boolean(sample?.atTarget && flight.hit));
    hide($('current'), false);
    const pilot = scene.pilotAt(point, actorScale);
    at($('pilot'), pilot.x, pilot.y);
    at($('resume'), pilot.x, pilot.y);

    const tip = state.loss === 'timeout' ? copy.feedback.cold : state.loss === 'wind' ? copy.feedback.spent : edgeUntil > clock ? copy.feedback.edge : '';
    hide($('tip'), !tip || !presented || Boolean(flight || drag));
    if (!$('tip').hidden) {
      setText($('tip'), tip);
      const tipX = Math.max(76, Math.min(width - 76, point.x));
      at($('tip'), tipX, point.y + 72 < height - 13 ? point.y + 72 : point.y - 68);
    }
  }

  function rebuildClouds() {
    const state = session.state;
    if (batchSerial !== state.serial) {
      batchSerial = state.serial;
      batchAt = clock;
    }
    places = placeClouds(width, height, {...state, position: toScreen(state.position), target: toScreen(state.target)}, places);
    buttons = state.clouds.map(wind => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cloud';
      button.dataset.wind = wind.id;
      button.tabIndex = -1;
      button.textContent = coordinates(wind);
      button.setAttribute('aria-label', '点云 ' + coordinates(wind));
      button.title = copy.feedback.controls;
      button.style.width = CLOUD_W + 'px';
      button.style.height = CLOUD_H + 'px';
      button.addEventListener('click', event => {
        if (event.detail > 0) launch(wind, 1);
      });
      button.addEventListener('auxclick', event => {
        if (event.button !== 2) return;
        event.preventDefault();
        launch(wind, -1);
      });
      return button;
    });
    $('clouds').replaceChildren(...buttons);
    updateInputs();
  }

  function newFlight(wind, direction, elapsed = 0) {
    const to = session.endpoint(wind.id, direction);
    if (!to) return null;
    return {id: wind.id, direction, wind: signedWind(wind, direction), from: {...session.state.position},
      to, hit: same(to, session.state.target), cloudAt: visualPlaces.get(wind.id), elapsed};
  }

  function launch(wind, direction) {
    if (!available() || hold.isPressed()) return;
    if (countAnswer()) { redraw(); return; }
    flight = newFlight(wind, direction);
    if (!flight) {
      edgeUntil = clock + 1300;
      setText($('announce'), copy.feedback.edge);
      redraw();
      schedule();
      return;
    }
    answerSince = null;
    edgeUntil = 0;
    setText($('announce'), direction === 1 ? copy.feedback.add : copy.feedback.subtract);
    updateInputs();
    redraw();
    schedule();
  }

  function beginDrag() {
    if (!available()) return;
    if (countAnswer()) { redraw(); return; }
    answerSince = null;
    const origin = {...session.state.position};
    drag = {origin, draft: origin};
    $('pilot').setAttribute('data-dragging', '');
    edgeUntil = 0;
    updateInputs();
    redraw();
    schedule();
  }

  function movedPoint(dx, dy) {
    const {x, y} = toScreen(drag.origin);
    return session.draftPosition(toBoard({x: x + dx, y: y + dy}));
  }

  function moveDrag(dx, dy) {
    if (!drag) return;
    drag.draft = movedPoint(dx, dy);
    schedule();
  }

  function endDrag(active, dx, dy) {
    if (!active || !drag) return;
    const point = movedPoint(dx, dy);
    drag = null;
    $('pilot').removeAttribute('data-dragging');
    if (session.relocate(point)) {
      rebuildClouds();
      setText($('announce'), copy.feedback.moved.replace('{point}', coordinates(point)));
    } else if (!same(point, session.state.position)) {
      setText($('announce'), same(point, session.state.target) ? copy.feedback.needsWind : copy.feedback.unreachable);
    }
    updateInputs();
    armAnswer();
    redraw();
  }

  function cancelDrag() {
    if (!drag) return;
    drag = null;
    $('pilot').removeAttribute('data-dragging');
    updateInputs();
    armAnswer();
    redraw();
  }

  function schedule() {
    if (raf === null && presented && !frozen && !small && !disposed && !errors.length && playing()) {
      raf = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    last = null;
    answerSince = null;
  }

  function settleBest() {
    if (session.state.stars <= best) return;
    localStorage.setItem(bestKey, String(session.state.stars));
    best = session.state.stars;
  }

  function armAnswer(now = performance.now()) {
    answerSince = available() ? now : null;
  }

  function showLoss() {
    missStart = clock;
    answerSince = null;
    hold?.cancel({untilRelease: true});
    rebuildClouds();
    const message = session.state.loss === 'timeout' ? copy.feedback.timeout : copy.feedback.empty;
    setText($('announce'), message);
  }

  function recoverFromLongFrame(now) {
    if (last === null || now - last <= MAX_FRAME_GAP_MS) return false;
    recovery = now + RECOVERY_MS;
    last = null;
    answerSince = null;
    updateInputs();
    schedule();
    return true;
  }

  function countAnswer(now = performance.now()) {
    if (recoverFromLongFrame(now)) return true;
    const elapsed = answerSince === null ? 0 : Math.max(0, now - answerSince);
    answerSince = Math.max(now, answerSince ?? now);
    if (!session.elapse(elapsed)) return false;
    showLoss();
    return true;
  }

  function tick(now) {
    raf = null;
    try {
      if (recovery && now < recovery) { schedule(); return; }
      if (recovery) { recovery = 0; last = null; updateInputs(); armAnswer(now); }
      if (recoverFromLongFrame(now)) return;
      const dt = last === null ? 0 : Math.min(85, now - last);
      last = now;
      clock += dt;
      let changed = available() && countAnswer(now);
      if (flight) {
        flight.elapsed += dt;
        if (flight.elapsed >= flightDuration(art, flight.hit)) {
          const result = session.land(flight.id, flight.direction);
          flight = null;
          if (result === 'miss') showLoss();
          else {
            rebuildClouds();
            const point = coordinates(session.state.position);
            setText($('announce'), result === 'star' ? copy.feedback.star.replace('{point}', point) : copy.feedback.landed.replace('{point}', point));
            armAnswer();
          }
          changed = true;
        }
      }
      if (missStart !== null && clock - missStart >= MISS_MS) {
        missStart = null;
        if (session.state.hearts) {
          session.afterLoss();
          rebuildClouds();
          armAnswer();
        } else settleBest();
        updateInputs();
        options.onViewChange();
        changed = true;
      }
      if (edgeUntil && edgeUntil <= clock) { edgeUntil = 0; changed = true; }
      if (changed || now - lastPaint >= 31) {
        redraw();
        if (changed && !playing() && !$('replay').disabled) $('replay').focus({preventScroll: true});
        lastPaint = now;
      }
      schedule();
      if (raf === null) last = null;
    } catch (error) { fail(error); }
  }

  function restore() {
    if (saved.version !== 2) throw Error('摘星存档版本无效');
    session = new ScreenFlight({saved: saved.session});
    if (saved.missAge !== null) {
      if (!(saved.missAge >= 0 && saved.missAge < MISS_MS)) throw Error('摘星失手进度无效');
      missStart = clock - saved.missAge;
    }
    rebuildClouds();
    redraw();
    if (saved.flight) {
      const {id, direction, elapsed} = saved.flight;
      const wind = session.state.clouds.find(candidate => candidate.id === id);
      if (wind) {
        if (!(elapsed >= 0 && elapsed < art.end * 1000 / art.fps)) throw Error('摘星飞行进度无效');
        flight = newFlight(wind, direction, elapsed);
      }
    }
    saved = null;
  }

  function fit() {
    const nextWidth = root.clientWidth;
    const nextHeight = root.clientHeight;
    const wasSmall = small;
    const nextSmall = nextWidth < MIN_VIEW.width || nextHeight < MIN_VIEW.height;
    if (nextSmall && available()) countAnswer();
    small = nextSmall;
    root.toggleAttribute('data-small', small);
    root.toggleAttribute('data-compact', nextWidth < 500);
    if (small) {
      hold?.cancel({untilRelease: true});
      stop();
    } else if (width !== nextWidth || height !== nextHeight) {
      hold?.cancel({untilRelease: true});
      width = nextWidth;
      height = nextHeight;
      scene.resize(width, height);
      if (saved) restore();
      else if (session) {
        rebuildClouds();
        if (flight) flight.cloudAt = places.get(flight.id);
      }
    }
    if (wasSmall && !small) armAnswer();
    updateInputs();
    redraw();
    schedule();
    options.onViewChange();
  }

  function fail(error) {
    errors.push(error.message);
    hold?.cancel({untilRelease: true});
    stop();
    updateInputs();
    if (ready) {
      setText($('error-detail'), error.message);
      redraw();
    }
    options.onViewChange();
    console.error(error);
  }

  function suspend() {
    if (available()) countAnswer();
    presented = false;
    recovery = 0;
    hold?.cancel({untilRelease: true});
    stop();
    pixelText?.suspend();
    updateInputs();
    redraw();
  }

  async function start() {
    if (pending || !ready || small || !canReplay || !['welcome', 'finished'].includes(view())) return;
    pending = true;
    try {
      if (!await options.beforePlay() || !presented || disposed || small) return;
      session = new ScreenFlight({seed: seed()});
      flight = null;
      missStart = null;
      edgeUntil = 0;
      places = new Map();
      batchSerial = 0;
      rebuildClouds();
      redraw();
      armAnswer();
      schedule();
      setText($('announce'), '');
      options.onViewChange();
    } catch (error) { fail(error); }
    finally { pending = false; updateInputs(); }
  }

  async function present({resume = true, start: directStart = false} = {}) {
    const continuing = playing() && resume && !presented;
    presented = true;
    if (continuing) recovery = performance.now() + RECOVERY_MS;
    pixelText.present();
    if (directStart && view() === 'welcome') await start();
    updateInputs();
    redraw();
    pixelText.flush();
    if (answerSince === null) armAnswer();
    schedule();
  }

  function onMotionChange() { redraw(); schedule(); }

  const initialization = (async () => {
    const [css, html, motion] = await Promise.all([options.ui?.style ?? source('./style.css'),
      options.ui?.markup ?? source('./markup.html'), loadMotion(options), font.load()]);
    if (disposed) { motion.atlas.close?.(); return false; }
    art = motion;
    document.fonts.add(font);
    style.textContent = css;
    root.innerHTML = html;
    $('pilot').title = copy.moveNote;
    $('pilot').setAttribute('aria-label', copy.moveNote);
    applyCopy(root, {'#rule-a': copy.rules[0], '#rule-b': copy.rules[1],
      '#start': copy.start, '#result-lead': copy.resultLead, '#unit': copy.resultUnit,
      '#best-label': copy.bestLabel, '#replay': copy.replay, '#random': SHARED_COPY.next,
      '#load-error': copy.loadError, '#reload': SHARED_COPY.reload});
    mountControlGuide(root, copy);
    drawRuleArt($('rule-add'), $('rule-subtract'), art);
    scene = makeScene($('canvas'), art);
    const stored = localStorage.getItem(bestKey);
    if (stored !== null) {
      best = Number(stored);
      if (!Number.isSafeInteger(best) || best < 0) throw Error('摘星记录格式无效');
    }
    hold = createMoveHandle($('pilot'), {
      canMove: available, onGrab() {}, onActivate: beginDrag, onMove: moveDrag,
      onDrop: endDrag, onCancel: cancelDrag, onTap() {}, onError: fail,
    });
    $('resume').addEventListener('click', () => Promise.resolve(options.onResume()).catch(fail));
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
    reduced.addEventListener('change', onMotionChange);
    return true;
  })().catch(error => { fail(error); return false; });

  return {
    ready: initialization, suspend, present, preview: suspend,
    getRoot: () => root,
    getRunState: () => ({view: view(), hasRound: Boolean(session || saved)}),
    snapshot: () => ({view: view(), ready, presented, viewportBlocked: small, rafPending: raf !== null,
      recovering: Boolean(recovery), relocating: Boolean(drag), flight: flight ? structuredClone(flight) : null,
      miss: missStart !== null, errors: [...errors], session: session ? structuredClone(session.state) : null,
      viewport: {width, height}, best}),
    checkpoint: () => !ready || errors.length ? null : saved ?? (session ? {version: 2,
      session: session.checkpoint(), missAge: missStart === null ? null : clock - missStart,
      flight: flight ? {id: flight.id, direction: flight.direction, elapsed: flight.elapsed} : null} : null),
    setFrozen(value) {
      frozen = value;
      if (value) hold?.cancel({untilRelease: true});
      updateInputs();
    },
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
      art?.atlas.close?.();
      reduced.removeEventListener('change', onMotionChange);
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
__defs["games/balloon-winds/dsh-stage.mjs"]=()=>{
const {mountGame}=__get("games/balloon-winds/experience.mjs");
const {createTransparentStage}=__get("runtime/transparent-stage.mjs");
function mountStage(container, options = {}) {
  const stage = createTransparentStage(container, {
    ...options, mountGame, kind: 'balloon-winds', keys: [],
    suppressContextMenu: true,
    stageStyle: ':host,.stage,canvas,.paper{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}',
  });
  container.querySelector(':scope > [data-braingames-stage]').style.outline = 'none';
  return stage;
}

return {mountStage};
};
const __entry=__get("games/balloon-winds/dsh-stage.mjs");

const ui={"markup":"<canvas id=\"canvas\" aria-hidden=\"true\"></canvas>\n<span id=\"current\" class=\"pin\" aria-label=\"气球位置\" hidden></span>\n<span id=\"target\" class=\"pin\" aria-label=\"星星位置\" hidden></span>\n<span id=\"heat\" class=\"sr\" role=\"meter\" aria-label=\"气囊热度\" aria-valuemin=\"0\" aria-valuemax=\"100\" hidden></span>\n<span id=\"flight-status\" class=\"sr\"></span>\n<div id=\"clouds\" aria-label=\"可选的云\" role=\"group\"></div>\n<button id=\"pilot\" type=\"button\" tabindex=\"-1\" aria-label=\"移动鲸鱼娘\" hidden></button>\n<button id=\"resume\" type=\"button\" tabindex=\"-1\" data-game-resume aria-label=\"点鲸鱼娘继续\" hidden></button>\n<div id=\"lobby\" class=\"lobby\" hidden>\n<canvas id=\"companion\" width=\"200\" height=\"200\" aria-hidden=\"true\"></canvas>\n<section id=\"welcome\" class=\"paper\" aria-labelledby=\"game-title\" hidden>\n  <h1 id=\"game-title\" data-braingames-title data-pixel-text></h1>\n  <div class=\"rules\">\n    <div><canvas id=\"rule-add\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (30,45) 加 (15,0)，飞到 (45,45)\"></canvas><span id=\"rule-a\" data-pixel-text></span></div>\n    <div><canvas id=\"rule-subtract\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (45,45) 减 (5,0)，到 (40,45) 摘星\"></canvas><span id=\"rule-b\" data-pixel-text></span></div>\n  </div>\n  <p data-braingames-controls></p>\n  <button id=\"start\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n<section id=\"result\" class=\"paper\" aria-labelledby=\"game-result-title\" role=\"dialog\" hidden>\n  <h2 id=\"game-result-title\" data-braingames-title data-pixel-text></h2>\n  <p id=\"result-lead\" data-pixel-text></p>\n  <p class=\"number\" aria-live=\"polite\"><strong id=\"score\" data-pixel-text>0</strong><span id=\"unit\" data-pixel-text></span></p>\n  <p class=\"best\"><span id=\"best-label\" data-pixel-text></span><span class=\"best-score\"><strong id=\"best-value\" data-pixel-text>0</strong><span data-pixel-text>颗</span></span></p>\n  <div class=\"actions\"><button id=\"replay\" class=\"primary\" type=\"button\" data-pixel-text></button>\n  <button id=\"random\" class=\"secondary\" type=\"button\" data-pixel-text hidden></button></div>\n</section>\n<section id=\"error\" class=\"paper\" role=\"alert\" hidden>\n  <p id=\"load-error\" data-pixel-text></p>\n  <p id=\"error-detail\"></p>\n  <button id=\"reload\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n</div>\n<span id=\"tip\" hidden></span>\n<p id=\"announce\" class=\"sr\" role=\"status\" aria-live=\"polite\"></p>\n","style":":host {\n  display: block; width: 100%; height: 100%; color-scheme: light dark;\n  --paper: #f6f0dd; --ink: #263248; --gold: #9f8355; --muted: #626974;\n}\n*, *::before, *::after { box-sizing: border-box; }\n[hidden] { display: none !important; }\n.stage { position: absolute; inset: 0; pointer-events: none; user-select: none; overflow: hidden; }\n#canvas { position: absolute; inset: 0; width: 100%; height: 100%; }\ncanvas { image-rendering: pixelated; }\nbutton { cursor: pointer; touch-action: manipulation; pointer-events: auto; }\nbutton:disabled { cursor: default; pointer-events: none; }\n.pin {\n  position: absolute; white-space: nowrap; transform: translate(-50%, -50%);\n  border: 1px solid #a48256; background: var(--paper); color: #42332e;\n  width: var(--pin-width); height: var(--pin-height); text-align: center;\n  padding: 1px 0; font: 700 14px/19px Consolas, monospace;\n}\n#target { background: #fff0c4; border-color: #bd8a43; }\n.cloud {\n  position: absolute; transform: translate(-50%, -50%); border: 0; background: transparent; padding: 0 0 1px;\n  color: #344854; text-shadow: 0 1px #fffae6; font: 700 13px/1 Consolas, monospace;\n}\n.cloud::before {\n  content: \"\"; position: absolute; inset: 3px 0; z-index: -1; pointer-events: none;\n  clip-path: polygon(2% 49%,12% 36%,24% 31%,32% 17%,40% 8%,54% 12%,65% 19%,77% 26%,91% 45%,99% 58%,95% 79%,83% 91%,18% 93%,6% 81%);\n}\n.cloud:hover:not([aria-disabled=\"true\"])::before, .cloud:focus-visible::before { background: #fff6d43a; }\n.cloud:focus-visible { outline: 2px solid #455a60; outline-offset: -4px; }\n.cloud[aria-disabled=\"true\"] { cursor: default; }\n#pilot, #resume {\n  position: absolute; width: 58px; height: 58px; transform: translate(-50%, -50%); background: transparent;\n  border: 0; clip-path: inset(0 round 20%); padding: 0;\n}\n#pilot { cursor: grab; touch-action: none; }\n#pilot[data-dragging] { cursor: grabbing; }\n#pilot:focus-visible, #resume:focus-visible { outline: 2px solid #8d7052; outline-offset: -3px; }\n.lobby { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);\n  display: grid; grid-template-columns: 280px 200px; align-items: center; pointer-events: none; }\n#companion { width: 200px; height: 200px; grid-column: 2; grid-row: 1; }\n.stage[data-compact] .lobby { grid-template-columns: 280px; gap: 4px; justify-items: center; }\n.stage[data-compact] #companion { grid-column: 1; width: 108px; height: 108px; }\n.stage[data-compact] .paper { grid-row: 2; }\n.paper {\n  grid-column: 1; grid-row: 1; width: 280px;\n  padding: 20px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink);\n  box-shadow: inset 2px 2px #fffbed, inset -2px -2px #d8ccb1, 4px 4px #0e172c55;\n  font: 18px/24px \"Whale Wind Pixel\", serif; text-align: center;\n  clip-path: polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px));\n}\n.paper p, .paper h1, .paper h2 { margin: 0; font: inherit; }\n.rules { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0 0 20px; padding: 4px 0 8px; }\n.rules > div { display: flex; flex-direction: column; align-items: center; gap: 12px; white-space: nowrap; }\n.rules > div + div { border-left: 2px solid #e6ddc3; }\n.paper button { display: block; width: 100%; color: var(--ink); font: inherit; }\n.primary { min-height: 42px; padding: 7px 12px; border: 2px solid var(--gold); background: #f3d391;\n  box-shadow: inset 0 2px #ffe9b6, 0 2px var(--gold); }\n.primary:hover:not(:disabled), .primary:focus-visible { background: #f8dc9e; border-color: var(--ink); }\n.primary:active:not(:disabled) { transform: translateY(2px); }\n.paper .secondary { min-height: 36px; padding: 4px 8px; border: 2px solid transparent; color: var(--muted); background: transparent; }\n.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: #c6baa0; background: #e9e0c8; }\n.paper button:disabled { opacity: .58; }\n.actions { display: grid; gap: 8px; }\n#result-lead, .best { color: var(--muted); }\n.number { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0 16px; }\n.number > strong, .best-score > strong { font-weight: 400; font-variant-numeric: tabular-nums; }\n.best { display: flex; justify-content: space-between; border-top: 2px solid #e6ddc3; padding: 12px 0 16px; }\n.best-score { display: flex; gap: 6px; }\n#error-detail { font: 13px/18px system-ui, sans-serif; overflow-wrap: anywhere; }\n[data-pixel-text] { position: relative; }\n[data-pixel-ready] { -webkit-text-fill-color: transparent; }\nspan[data-pixel-text], strong[data-pixel-text] { display: inline-block; }\n[data-pixel-ready]::after {\n  content: \"\"; position: absolute; inset: 0; pointer-events: none;\n  background: var(--pixel-label) 0 0 / var(--pixel-label-size) no-repeat; image-rendering: pixelated;\n}\n.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }\n.stage[data-small] > :not(.sr) { visibility: hidden; }\n#tip {\n  position: absolute; transform: translate(-50%, -50%); white-space: nowrap;\n  padding: 1px 5px; color: #475861; background: #fff8e9e0;\n  font: 14px/21px \"Whale Wind Pixel\", serif;\n}\n","font":"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"};
const manifest={"fps":20,"end":36,"dockFrame":9,"pushFrame":12,"landingFrame":26,"smileFrame":33,"layers":{"balloon":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[669,499,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[753,499,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[837,499,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[921,499,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[0,661,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[84,661,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,661,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,661,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,661,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-39,-145.25],"rect":[420,661,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-36,-145.25],"rect":[504,661,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[-0.499,-35.246],"hearts":[[-8.548,3.471],[0.152,3.471],[8.852,3.471]],"tilt":-0.0142,"offset":[-34,-146.25],"rect":[502,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[-1.689,-35.21],"hearts":[[-8.186,3.89],[0.514,3.89],[9.214,3.89]],"tilt":-0.0479,"offset":[-32,-147.25],"rect":[0,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[-3.106,-35.113],"hearts":[[-7.755,4.421],[0.945,4.421],[9.645,4.421]],"tilt":-0.0882,"offset":[-29,-148.25],"rect":[343,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[-4.289,-34.988],"hearts":[[-7.395,4.943],[1.305,4.943],[10.005,4.943]],"tilt":-0.122,"offset":[-30,-148.25],"rect":[826,0,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[-4.784,-34.924],"hearts":[[-7.244,5.354],[1.456,5.354],[10.156,5.354]],"tilt":-0.1361,"offset":[-30,-148.25],"rect":[913,0,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[-3.988,-35.024],"hearts":[[-7.487,5.556],[1.213,5.556],[9.913,5.556]],"tilt":-0.1134,"offset":[-30,-149.25],"rect":[326,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[-1.99,-35.194],"hearts":[[-8.094,5.302],[0.606,5.302],[9.306,5.302]],"tilt":-0.0565,"offset":[-29,-149.25],"rect":[0,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[0.615,-35.245],"hearts":[[-8.887,4.554],[-0.187,4.554],[8.513,4.554]],"tilt":0.0175,"offset":[-29,-149.25],"rect":[426,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[3.217,-35.103],"hearts":[[-9.679,3.518],[-0.979,3.518],[7.721,3.518]],"tilt":0.0914,"offset":[-31,-150.25],"rect":[413,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[5.208,-34.863],"hearts":[[-10.285,2.452],[-1.585,2.452],[7.115,2.452]],"tilt":0.1483,"offset":[-32,-150.25],"rect":[0,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[6,-34.736],"hearts":[[-10.525,1.649],[-1.825,1.649],[6.875,1.649]],"tilt":0.171,"offset":[-34,-150.25],"rect":[81,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[5.046,-34.887],"hearts":[[-10.235,1.39],[-1.535,1.39],[7.165,1.39]],"tilt":0.1436,"offset":[-37,-149.25],"rect":[494,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[2.756,-35.142],"hearts":[[-9.539,1.936],[-0.839,1.936],[7.861,1.936]],"tilt":0.0783,"offset":[-40,-148.25],"rect":[508,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[0.009,-35.25],"hearts":[[-8.703,3],[-0.003,3],[8.697,3]],"tilt":0.0003,"offset":[-44,-147.25],"rect":[166,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[-2.293,-35.175],"hearts":[[-8.002,4.009],[0.698,4.009],[9.398,4.009]],"tilt":-0.0651,"offset":[-46,-145.25],"rect":[585,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[-3.256,-35.099],"hearts":[[-7.709,4.454],[0.991,4.454],[9.691,4.454]],"tilt":-0.0925,"offset":[-47,-145.25],"rect":[669,335,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[-2.518,-35.16],"hearts":[[-7.934,4.421],[0.766,4.421],[9.466,4.421]],"tilt":-0.0715,"offset":[-46,-145.25],"rect":[753,335,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[-0.892,-35.239],"hearts":[[-8.429,4.309],[0.271,4.309],[8.971,4.309]],"tilt":-0.0253,"offset":[-44,-145.25],"rect":[588,661,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[0.736,-35.242],"hearts":[[-8.924,4.118],[-0.224,4.118],[8.476,4.118]],"tilt":0.0209,"offset":[-42,-145.25],"rect":[671,661,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[1.476,-35.219],"hearts":[[-9.149,3.891],[-0.449,3.891],[8.251,3.891]],"tilt":0.0419,"offset":[-40,-145.25],"rect":[755,661,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[1.323,-35.225],"hearts":[[-9.102,3.672],[-0.402,3.672],[8.298,3.672]],"tilt":0.0375,"offset":[-39,-145.25],"rect":[839,661,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[0.957,-35.237],"hearts":[[-8.991,3.484],[-0.291,3.484],[8.409,3.484]],"tilt":0.0271,"offset":[-39,-145.25],"rect":[923,661,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[0.52,-35.246],"hearts":[[-8.858,3.35],[-0.158,3.35],[8.542,3.35]],"tilt":0.0147,"offset":[-40,-145.25],"rect":[0,822,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[0.154,-35.25],"hearts":[[-8.747,3.3],[-0.047,3.3],[8.653,3.3]],"tilt":0.0044,"offset":[-41,-145.25],"rect":[84,822,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,822,82,159],"canopy":[-145.65,-69.15]}],"cloud":[{"frame":1,"offset":[-28,-18],"rect":[685,1305,58,30]},{"frame":2,"offset":[-29,-17],"rect":[805,1305,60,29]},{"frame":3,"offset":[-30,-16],"rect":[0,1466,62,27]},{"frame":4,"offset":[-31,-16],"rect":[64,1466,63,27]},{"frame":5,"offset":[-31,-16],"rect":[129,1466,64,27]},{"frame":6,"offset":[-31,-16],"rect":[195,1466,63,27]},{"frame":7,"offset":[-30,-16],"rect":[260,1466,62,27]},{"frame":8,"offset":[-29,-17],"rect":[867,1305,60,29]},{"frame":9,"offset":[-28,-18],"rect":[745,1305,58,30]},{"frame":10,"offset":[-27,-13],"rect":[350,1466,55,22]},{"frame":11,"offset":[-17,-5],"rect":[0,1495,36,8]},{"frame":12,"offset":[-3,-1],"rect":[38,1495,3,1]}],"gust":[{"frame":10,"offset":[-58,-23.5],"rect":[598,1466,9,21]},{"frame":11,"offset":[-58,-25.5],"rect":[324,1466,24,25]},{"frame":12,"offset":[-58,-27.5],"rect":[929,1305,47,28]},{"frame":13,"offset":[-57,-28.5],"rect":[614,1305,69,31]},{"frame":14,"offset":[-57,-29.5],"rect":[336,1305,86,34]},{"frame":15,"offset":[-56,-29.5],"rect":[424,1305,93,33]},{"frame":16,"offset":[-56,-29.5],"rect":[519,1305,93,33]},{"frame":17,"offset":[-57,-18.5],"rect":[407,1466,94,22]},{"frame":18,"offset":[-57,-18.5],"rect":[503,1466,93,22]},{"frame":19,"offset":[-58,-18.5],"rect":[609,1466,92,21]},{"frame":20,"offset":[-56,-17.5],"rect":[703,1466,86,20]},{"frame":21,"offset":[-51,-16.5],"rect":[817,1466,73,18]},{"frame":22,"offset":[-42,-14.5],"rect":[892,1466,55,15]},{"frame":23,"offset":[-35,-13.5],"rect":[949,1466,39,13]},{"frame":24,"offset":[-26,-11.5],"rect":[990,1466,19,11]},{"frame":25,"offset":[-19,-1.5],"rect":[43,1495,5,1]}],"star":[{"frame":1,"offset":[-12,-11],"rect":[791,1466,24,20]}],"balloonLeft":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,822,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,822,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[420,822,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[504,822,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[588,822,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[672,822,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[756,822,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[840,822,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[924,822,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-43,-145.25],"rect":[0,983,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-46,-145.25],"rect":[84,983,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[0.499,-35.246],"hearts":[[-8.852,3.471],[-0.152,3.471],[8.548,3.471]],"tilt":0.0142,"offset":[-47,-146.25],"rect":[836,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[1.689,-35.21],"hearts":[[-9.214,3.89],[-0.514,3.89],[8.186,3.89]],"tilt":0.0479,"offset":[-49,-147.25],"rect":[83,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[3.106,-35.113],"hearts":[[-9.645,4.421],[-0.945,4.421],[7.755,4.421]],"tilt":0.0882,"offset":[-52,-148.25],"rect":[590,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[4.289,-34.988],"hearts":[[-10.005,4.943],[-1.305,4.943],[7.395,4.943]],"tilt":0.122,"offset":[-55,-148.25],"rect":[84,169,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[4.784,-34.924],"hearts":[[-10.156,5.354],[-1.456,5.354],[7.244,5.354]],"tilt":0.1361,"offset":[-56,-148.25],"rect":[171,169,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[3.988,-35.024],"hearts":[[-9.913,5.556],[-1.213,5.556],[7.487,5.556]],"tilt":0.1134,"offset":[-55,-149.25],"rect":[576,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[1.99,-35.194],"hearts":[[-9.306,5.302],[-0.606,5.302],[8.094,5.302]],"tilt":0.0565,"offset":[-53,-149.25],"rect":[259,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[-0.615,-35.245],"hearts":[[-8.513,4.554],[0.187,4.554],[8.887,4.554]],"tilt":-0.0175,"offset":[-51,-149.25],"rect":[673,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[-3.217,-35.103],"hearts":[[-7.721,3.518],[0.979,3.518],[9.679,3.518]],"tilt":-0.0914,"offset":[-48,-150.25],"rect":[663,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[-5.208,-34.863],"hearts":[[-7.115,2.452],[1.585,2.452],[10.285,2.452]],"tilt":-0.1483,"offset":[-47,-150.25],"rect":[163,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[-6,-34.736],"hearts":[[-6.875,1.649],[1.825,1.649],[10.525,1.649]],"tilt":-0.171,"offset":[-46,-150.25],"rect":[244,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[-5.046,-34.887],"hearts":[[-7.165,1.39],[1.535,1.39],[10.235,1.39]],"tilt":-0.1436,"offset":[-43,-149.25],"rect":[744,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[-2.756,-35.142],"hearts":[[-7.861,1.936],[0.839,1.936],[9.539,1.936]],"tilt":-0.0783,"offset":[-40,-148.25],"rect":[755,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[-0.009,-35.25],"hearts":[[-8.697,3],[0.003,3],[8.703,3]],"tilt":-0.0003,"offset":[-38,-147.25],"rect":[250,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[2.293,-35.175],"hearts":[[-9.398,4.009],[-0.698,4.009],[8.002,4.009]],"tilt":0.0651,"offset":[-36,-145.25],"rect":[919,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[3.256,-35.099],"hearts":[[-9.691,4.454],[-0.991,4.454],[7.709,4.454]],"tilt":0.0925,"offset":[-35,-145.25],"rect":[0,499,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[2.518,-35.16],"hearts":[[-9.466,4.421],[-0.766,4.421],[7.934,4.421]],"tilt":0.0715,"offset":[-35,-145.25],"rect":[84,499,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[0.892,-35.239],"hearts":[[-8.971,4.309],[-0.271,4.309],[8.429,4.309]],"tilt":0.0253,"offset":[-37,-145.25],"rect":[168,983,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[-0.736,-35.242],"hearts":[[-8.476,4.118],[0.224,4.118],[8.924,4.118]],"tilt":-0.0209,"offset":[-40,-145.25],"rect":[251,983,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[-1.476,-35.219],"hearts":[[-8.251,3.891],[0.449,3.891],[9.149,3.891]],"tilt":-0.0419,"offset":[-42,-145.25],"rect":[335,983,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[-1.323,-35.225],"hearts":[[-8.298,3.672],[0.402,3.672],[9.102,3.672]],"tilt":-0.0375,"offset":[-43,-145.25],"rect":[419,983,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[-0.957,-35.237],"hearts":[[-8.409,3.484],[0.291,3.484],[8.991,3.484]],"tilt":-0.0271,"offset":[-43,-145.25],"rect":[503,983,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[-0.52,-35.246],"hearts":[[-8.542,3.35],[0.158,3.35],[8.858,3.35]],"tilt":-0.0147,"offset":[-42,-145.25],"rect":[587,983,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[-0.154,-35.25],"hearts":[[-8.653,3.3],[0.047,3.3],[8.747,3.3]],"tilt":-0.0044,"offset":[-41,-145.25],"rect":[671,983,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[755,983,82,159],"canopy":[-145.65,-69.15]}],"collect":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[10.068,-4.441],"offset":[-40,-148.25],"rect":[837,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[11.322,-5.709],"offset":[-44,-147.25],"rect":[334,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[13.975,-8.143],"offset":[-46,-145.25],"rect":[167,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[15.885,-10.446],"offset":[-47,-145.25],"rect":[251,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[16.751,-10.951],"offset":[-46,-145.25],"rect":[335,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[17.56,-12.235],"offset":[-44,-145.25],"rect":[839,983,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[18.135,-16.394],"offset":[-42,-145.25],"rect":[922,983,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[17.691,-18.938],"offset":[-40,-145.25],"rect":[0,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[16.537,-17.73],"offset":[-39,-145.25],"rect":[84,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[13.631,-14.729],"offset":[-39,-145.25],"rect":[168,1144,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[10.07,-11.812],"offset":[-40,-145.25],"rect":[252,1144,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[9.662,-7.555],"offset":[-41,-145.25],"rect":[336,1144,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[8.654,-4.406],"offset":[-41,-145.25],"rect":[420,1144,82,159]}],"blink":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[504,1144,82,159]}],"loss":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[588,1144,82,159]}],"collectLeft":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[-8.378,-4.827],"offset":[-40,-148.25],"rect":[919,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[-9.886,-5.844],"offset":[-38,-147.25],"rect":[418,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[-12.777,-7.986],"offset":[-36,-145.25],"rect":[418,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[-15.216,-10.279],"offset":[-35,-145.25],"rect":[502,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[-16.245,-10.838],"offset":[-35,-145.25],"rect":[586,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[-16.992,-12.179],"offset":[-37,-145.25],"rect":[672,1144,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[-17.435,-16.423],"offset":[-40,-145.25],"rect":[755,1144,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[-16.952,-18.997],"offset":[-42,-145.25],"rect":[839,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[-15.666,-17.778],"offset":[-43,-145.25],"rect":[923,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[-12.542,-14.806],"offset":[-43,-145.25],"rect":[0,1305,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[-9.432,-11.921],"offset":[-42,-145.25],"rect":[84,1305,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[-8.477,-7.999],"offset":[-41,-145.25],"rect":[168,1305,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[-8.019,-4.493],"offset":[-41,-145.25],"rect":[252,1305,82,159]}]},"atlas":[1024,1503],"image":"winds/e43208c3ca0a0d3888ef.png"};
return {mountBundledStage(container,options){return __entry.mountStage(container,{...options,ui:{...ui,fontBytes:Uint8Array.from(atob(ui.font),c=>c.charCodeAt(0)).buffer},manifest,loadAtlas:async name=>{const r=await options.loadResource(name);if(r.type!=="image/png"||!ArrayBuffer.isView(r.bytes))throw Error("像素资源格式无效");return createImageBitmap(new Blob([r.bytes],{type:r.type}),{premultiplyAlpha:"none"});}});}};
}});
