// Generated wind game; directional 2D animation and bundled font.
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
// Shared game copy and metadata.
const SHARED_COPY={
  "appLabel": "BrainGames",
  "headerStart": "来一局",
  "headerContinue": "接着玩",
  "headerPlaying": "摸鱼中",
  "invite": "任务在跑，顺手摸把鱼？",
  "inviteIdle": "歇一小会儿，来一局？",
  "inviteAccept": "来一局",
  "inviteDismiss": "先不玩",
  "selecting": "正在挑游戏",
  "chooseError": "没挑出来，再试下",
  "chooseRetry": "再挑一次",
  "chooseRandom": "随便开局",
  "retry": "重试",
  "discardSavedRound": "放弃存档，重新开始",
  "next": "换个玩",
  "reload": "重新加载",
  "freezeHint": "忙完点鱼接着玩",
  "bestLabel": "最高记录"
};
const GAME_COPY={
  "rice-bubbles-g10": {
    "title": "吃白饭吐泡泡",
    "shortTitle": "接饭",
    "invite": "鱼饿了，帮我接两口饭？",
    "start": "开饭",
    "replay": "再吃一顿",
    "loading": "正端着碗过来",
    "loadError": "碗没端稳，重新加载下",
    "resultLead": "这顿吃了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": { "device": "键盘", "key": "空格键", "action": "接食物" },
    "rules": [
      "食物接住",
      "泡泡放过"
    ]
  },
  "regulars-g04": {
    "title": "大肥鱼茶餐厅",
    "shortTitle": "上菜",
    "invite": "熟客上门了，帮我记下菜？",
    "start": "上菜",
    "replay": "再开一桌",
    "loading": "正在擦桌子",
    "loadError": "后厨卡住了，重新加载下",
    "resultLead": "这次招待了",
    "resultUnit": "位顾客",
    "bestLabel": "最高记录",
    "control": { "device": "鼠标", "key": "左键", "action": "点菜品" },
    "rules": [
      "说新菜，记住",
      "没说，照旧上"
    ]
  },
  "planks-g02": {
    "title": "忒修斯之渔船",
    "shortTitle": "补船",
    "invite": "船又漏了，搭把手呗？",
    "start": "补船",
    "replay": "再补一程",
    "loading": "正到处找木板",
    "loadError": "木板卡住了，重新加载下",
    "resultLead": "这趟补好了",
    "resultUnit": "块船板",
    "bestLabel": "最高记录",
    "control": { "device": "鼠标", "key": "左键", "action": "点破口" },
    "rules": [
      "看准手头木板",
      "点同形状破洞"
    ]
  },
  "balloon-winds": {
    "title": "大肥鱼热气球",
    "shortTitle": "摘星",
    "invite": "风正好，去摘一颗星？",
    "start": "出发摘星",
    "replay": "再飞一趟",
    "loading": "正在吹起热气球",
    "loadError": "气球没准备好",
    "resultLead": "这趟摘到了",
    "resultUnit": "颗星",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键·右键",
      "action": "加风·减风"
    },
    "rules": [
      "左键加风",
      "右键减风"
    ]
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
    "description": "记住普通小动物最新的点单；未重新点单时按原偏好上菜，新点单替换旧偏好。"
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
    "description": "随机位置竖直落下食物与泡泡，按空格接食物。泡泡和本顿禁接食物都要放过。持续答对会逐步调整节奏、反应时间和干扰。"
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
    "description": "想象手持木板旋转后的轮廓，从船上多个不同破口中选出同形者；选择前不显示旋转放置过程。"
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
    "description": "根据热气球和星星的坐标差，在几朵云里选择多次横纵位移。左键加风，右键减风，逐步算到目标坐标。"
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

const STARS_PER_STAGE = 4;

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
      const {unit} = difficultyAt(state.stars);
      if (unit > 1 && state.hearts && !state.loss &&
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
  element.style.left = Math.round(x) + 'px';
  element.style.top = Math.round(y) + 'px';
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
      button.tabIndex = blocked ? -1 : 0;
      hide(button, button.dataset.wind === flight?.id);
    }
    hide($('pilot'), !playing() || !presented || frozen || Boolean(flight));
    $('pilot').disabled = !presented || frozen || small;
    $('pilot').setAttribute('aria-disabled', String(!available()));
    $('pilot').tabIndex = available() ? 0 : -1;
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
      button.style.opacity = cloud.opacity;
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

    const tip = state.loss === 'timeout' ? '气囊冷了' : state.loss === 'wind' ? '风用尽' : edgeUntil > clock ? '这边会吹出画面' : '';
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
      button.textContent = coordinates(wind);
      button.setAttribute('aria-label', '点云 ' + coordinates(wind));
      button.title = '左键加，右键减';
      button.style.width = CLOUD_W + 'px';
      button.style.height = CLOUD_H + 'px';
      button.addEventListener('click', () => launch(wind, 1));
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
      setText($('announce'), '这边会吹出画面');
      redraw();
      schedule();
      return;
    }
    answerSince = null;
    edgeUntil = 0;
    setText($('announce'), direction === 1 ? '云飞向气球，正向起风' : '云飞向气球，反向起风');
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
      setText($('announce'), '气球移到 ' + coordinates(point) + '，新的云已出现');
    } else if (!same(point, session.state.position)) {
      setText($('announce'), same(point, session.state.target) ? '星星要靠风飞到' : '剩下的风从这里到不了星星');
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
    const message = session.state.loss === 'timeout' ? '气囊冷了，少了一颗心' : '风用尽，少了一颗心';
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
            setText($('announce'), result === 'star' ? '摘到星星，抵达 ' + point : '落在 ' + point);
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
    ...options, mountGame, kind: 'balloon-winds', keys: ['Space', 'Enter', 'Tab'],
    suppressContextMenu: true,
    stageStyle: ':host,.stage,canvas,.paper{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}',
  });
  container.querySelector(':scope > [data-braingames-stage]').style.outline = 'none';
  return stage;
}

return {mountStage};
};
const __entry=__get("games/balloon-winds/dsh-stage.mjs");

const ui={"markup":"<canvas id=\"canvas\" aria-hidden=\"true\"></canvas>\n<span id=\"current\" class=\"pin\" aria-label=\"气球位置\" hidden></span>\n<span id=\"target\" class=\"pin\" aria-label=\"星星位置\" hidden></span>\n<span id=\"heat\" class=\"sr\" role=\"meter\" aria-label=\"气囊热度\" aria-valuemin=\"0\" aria-valuemax=\"100\" hidden></span>\n<span id=\"flight-status\" class=\"sr\"></span>\n<div id=\"clouds\" aria-label=\"可选的云\" role=\"group\"></div>\n<button id=\"pilot\" type=\"button\" aria-label=\"移动鲸鱼娘\" hidden></button>\n<button id=\"resume\" type=\"button\" data-game-resume aria-label=\"点鲸鱼娘继续\" hidden></button>\n<div id=\"lobby\" class=\"lobby\" hidden>\n<canvas id=\"companion\" width=\"200\" height=\"200\" aria-hidden=\"true\"></canvas>\n<section id=\"welcome\" class=\"paper\" aria-labelledby=\"game-title\" hidden>\n  <h1 id=\"game-title\" data-braingames-title data-pixel-text></h1>\n  <div class=\"rules\">\n    <div><canvas id=\"rule-add\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (30,45) 加 (15,0)，飞到 (45,45)\"></canvas><span id=\"rule-a\" data-pixel-text></span></div>\n    <div><canvas id=\"rule-subtract\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (45,45) 减 (5,0)，到 (40,45) 摘星\"></canvas><span id=\"rule-b\" data-pixel-text></span></div>\n  </div>\n  <p data-braingames-controls></p>\n  <button id=\"start\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n<section id=\"result\" class=\"paper\" aria-labelledby=\"game-result-title\" role=\"dialog\" hidden>\n  <h2 id=\"game-result-title\" data-braingames-title data-pixel-text></h2>\n  <p id=\"result-lead\" data-pixel-text></p>\n  <p class=\"number\" aria-live=\"polite\"><strong id=\"score\" data-pixel-text>0</strong><span id=\"unit\" data-pixel-text></span></p>\n  <p class=\"best\"><span id=\"best-label\" data-pixel-text></span><span class=\"best-score\"><strong id=\"best-value\" data-pixel-text>0</strong><span data-pixel-text>颗</span></span></p>\n  <div class=\"actions\"><button id=\"replay\" class=\"primary\" type=\"button\" data-pixel-text></button>\n  <button id=\"random\" class=\"secondary\" type=\"button\" data-pixel-text hidden></button></div>\n</section>\n<section id=\"error\" class=\"paper\" role=\"alert\" hidden>\n  <p id=\"load-error\" data-pixel-text></p>\n  <p id=\"error-detail\"></p>\n  <button id=\"reload\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n</div>\n<span id=\"tip\" hidden></span>\n<p id=\"announce\" class=\"sr\" role=\"status\" aria-live=\"polite\"></p>\n","style":":host {\n  display: block; width: 100%; height: 100%; color-scheme: light dark;\n  --paper: #f6f0dd; --ink: #263248; --gold: #9f8355; --muted: #626974;\n}\n*, *::before, *::after { box-sizing: border-box; }\n[hidden] { display: none !important; }\n.stage { position: absolute; inset: 0; pointer-events: none; user-select: none; overflow: hidden; }\n#canvas { position: absolute; inset: 0; width: 100%; height: 100%; }\ncanvas { image-rendering: pixelated; }\nbutton { cursor: pointer; touch-action: manipulation; pointer-events: auto; }\nbutton:disabled { cursor: default; pointer-events: none; }\n.pin {\n  position: absolute; white-space: nowrap; transform: translate(-50%, -50%);\n  border: 1px solid #a48256; background: var(--paper); color: #42332e;\n  width: var(--pin-width); height: var(--pin-height); text-align: center;\n  padding: 1px 0; font: 700 14px/19px Consolas, monospace;\n}\n#target { background: #fff0c4; border-color: #bd8a43; }\n.cloud {\n  position: absolute; transform: translate(-50%, -50%); border: 0; background: transparent; padding: 0 0 1px;\n  color: #344854; text-shadow: 0 1px #fffae6; font: 700 13px/1 Consolas, monospace;\n}\n.cloud::before {\n  content: \"\"; position: absolute; inset: 3px 0; z-index: -1; pointer-events: none;\n  clip-path: polygon(2% 49%,12% 36%,24% 31%,32% 17%,40% 8%,54% 12%,65% 19%,77% 26%,91% 45%,99% 58%,95% 79%,83% 91%,18% 93%,6% 81%);\n}\n.cloud:hover:not([aria-disabled=\"true\"])::before, .cloud:focus-visible::before { background: #fff6d43a; }\n.cloud:focus-visible { outline: 2px solid #455a60; outline-offset: -4px; }\n.cloud[aria-disabled=\"true\"] { cursor: default; }\n#pilot, #resume {\n  position: absolute; width: 58px; height: 58px; transform: translate(-50%, -50%); background: transparent;\n  border: 0; clip-path: inset(0 round 20%); padding: 0;\n}\n#pilot { cursor: grab; touch-action: none; }\n#pilot[data-dragging] { cursor: grabbing; }\n#pilot:focus-visible, #resume:focus-visible { outline: 2px solid #8d7052; outline-offset: -3px; }\n.lobby { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);\n  display: grid; grid-template-columns: 280px 200px; align-items: center; pointer-events: none; }\n#companion { width: 200px; height: 200px; grid-column: 2; grid-row: 1; }\n.stage[data-compact] .lobby { grid-template-columns: 280px; gap: 4px; justify-items: center; }\n.stage[data-compact] #companion { grid-column: 1; width: 108px; height: 108px; }\n.stage[data-compact] .paper { grid-row: 2; }\n.paper {\n  grid-column: 1; grid-row: 1; width: 280px;\n  padding: 20px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink);\n  box-shadow: inset 2px 2px #fffbed, inset -2px -2px #d8ccb1, 4px 4px #0e172c55;\n  font: 18px/24px \"Whale Wind Pixel\", serif; text-align: center;\n  clip-path: polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px));\n}\n.paper p, .paper h1, .paper h2 { margin: 0; font: inherit; }\n.rules { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0 0 20px; padding: 4px 0 8px; }\n.rules > div { display: flex; flex-direction: column; align-items: center; gap: 12px; white-space: nowrap; }\n.rules > div + div { border-left: 2px solid #e6ddc3; }\n.paper button { display: block; width: 100%; color: var(--ink); font: inherit; }\n.primary { min-height: 42px; padding: 7px 12px; border: 2px solid var(--gold); background: #f3d391;\n  box-shadow: inset 0 2px #ffe9b6, 0 2px var(--gold); }\n.primary:hover:not(:disabled), .primary:focus-visible { background: #f8dc9e; border-color: var(--ink); }\n.primary:active:not(:disabled) { transform: translateY(2px); }\n.paper .secondary { min-height: 36px; padding: 4px 8px; border: 2px solid transparent; color: var(--muted); background: transparent; }\n.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: #c6baa0; background: #e9e0c8; }\n.paper button:disabled { opacity: .58; }\n.actions { display: grid; gap: 8px; }\n#result-lead, .best { color: var(--muted); }\n.number { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0 16px; }\n.number > strong, .best-score > strong { font-weight: 400; font-variant-numeric: tabular-nums; }\n.best { display: flex; justify-content: space-between; border-top: 2px solid #e6ddc3; padding: 12px 0 16px; }\n.best-score { display: flex; gap: 6px; }\n#error-detail { font: 13px/18px system-ui, sans-serif; overflow-wrap: anywhere; }\n[data-pixel-text] { position: relative; }\n[data-pixel-ready] { -webkit-text-fill-color: transparent; }\nspan[data-pixel-text], strong[data-pixel-text] { display: inline-block; }\n[data-pixel-ready]::after {\n  content: \"\"; position: absolute; inset: 0; pointer-events: none;\n  background: var(--pixel-label) 0 0 / var(--pixel-label-size) no-repeat; image-rendering: pixelated;\n}\n.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }\n.stage[data-small] > :not(.sr) { visibility: hidden; }\n#tip {\n  position: absolute; transform: translate(-50%, -50%); white-space: nowrap;\n  padding: 1px 5px; color: #475861; background: #fff8e9e0;\n  font: 14px/21px \"Whale Wind Pixel\", serif;\n}\n","font":"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"};
const manifest={"fps":20,"end":36,"dockFrame":9,"pushFrame":12,"landingFrame":26,"smileFrame":33,"layers":{"balloon":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[669,499,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[753,499,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[837,499,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[921,499,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[0,661,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[84,661,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,661,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,661,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,661,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-39,-145.25],"rect":[420,661,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-36,-145.25],"rect":[504,661,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[-0.499,-35.246],"hearts":[[-8.548,3.471],[0.152,3.471],[8.852,3.471]],"tilt":-0.0142,"offset":[-34,-146.25],"rect":[502,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[-1.689,-35.21],"hearts":[[-8.186,3.89],[0.514,3.89],[9.214,3.89]],"tilt":-0.0479,"offset":[-32,-147.25],"rect":[0,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[-3.106,-35.113],"hearts":[[-7.755,4.421],[0.945,4.421],[9.645,4.421]],"tilt":-0.0882,"offset":[-29,-148.25],"rect":[343,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[-4.289,-34.988],"hearts":[[-7.395,4.943],[1.305,4.943],[10.005,4.943]],"tilt":-0.122,"offset":[-30,-148.25],"rect":[826,0,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[-4.784,-34.924],"hearts":[[-7.244,5.354],[1.456,5.354],[10.156,5.354]],"tilt":-0.1361,"offset":[-30,-148.25],"rect":[913,0,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[-3.988,-35.024],"hearts":[[-7.487,5.556],[1.213,5.556],[9.913,5.556]],"tilt":-0.1134,"offset":[-30,-149.25],"rect":[326,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[-1.99,-35.194],"hearts":[[-8.094,5.302],[0.606,5.302],[9.306,5.302]],"tilt":-0.0565,"offset":[-29,-149.25],"rect":[0,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[0.615,-35.245],"hearts":[[-8.887,4.554],[-0.187,4.554],[8.513,4.554]],"tilt":0.0175,"offset":[-29,-149.25],"rect":[426,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[3.217,-35.103],"hearts":[[-9.679,3.518],[-0.979,3.518],[7.721,3.518]],"tilt":0.0914,"offset":[-31,-150.25],"rect":[413,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[5.208,-34.863],"hearts":[[-10.285,2.452],[-1.585,2.452],[7.115,2.452]],"tilt":0.1483,"offset":[-32,-150.25],"rect":[0,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[6,-34.736],"hearts":[[-10.525,1.649],[-1.825,1.649],[6.875,1.649]],"tilt":0.171,"offset":[-34,-150.25],"rect":[81,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[5.046,-34.887],"hearts":[[-10.235,1.39],[-1.535,1.39],[7.165,1.39]],"tilt":0.1436,"offset":[-37,-149.25],"rect":[494,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[2.756,-35.142],"hearts":[[-9.539,1.936],[-0.839,1.936],[7.861,1.936]],"tilt":0.0783,"offset":[-40,-148.25],"rect":[508,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[0.009,-35.25],"hearts":[[-8.703,3],[-0.003,3],[8.697,3]],"tilt":0.0003,"offset":[-44,-147.25],"rect":[166,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[-2.293,-35.175],"hearts":[[-8.002,4.009],[0.698,4.009],[9.398,4.009]],"tilt":-0.0651,"offset":[-46,-145.25],"rect":[585,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[-3.256,-35.099],"hearts":[[-7.709,4.454],[0.991,4.454],[9.691,4.454]],"tilt":-0.0925,"offset":[-47,-145.25],"rect":[669,335,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[-2.518,-35.16],"hearts":[[-7.934,4.421],[0.766,4.421],[9.466,4.421]],"tilt":-0.0715,"offset":[-46,-145.25],"rect":[753,335,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[-0.892,-35.239],"hearts":[[-8.429,4.309],[0.271,4.309],[8.971,4.309]],"tilt":-0.0253,"offset":[-44,-145.25],"rect":[588,661,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[0.736,-35.242],"hearts":[[-8.924,4.118],[-0.224,4.118],[8.476,4.118]],"tilt":0.0209,"offset":[-42,-145.25],"rect":[671,661,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[1.476,-35.219],"hearts":[[-9.149,3.891],[-0.449,3.891],[8.251,3.891]],"tilt":0.0419,"offset":[-40,-145.25],"rect":[755,661,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[1.323,-35.225],"hearts":[[-9.102,3.672],[-0.402,3.672],[8.298,3.672]],"tilt":0.0375,"offset":[-39,-145.25],"rect":[839,661,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[0.957,-35.237],"hearts":[[-8.991,3.484],[-0.291,3.484],[8.409,3.484]],"tilt":0.0271,"offset":[-39,-145.25],"rect":[923,661,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[0.52,-35.246],"hearts":[[-8.858,3.35],[-0.158,3.35],[8.542,3.35]],"tilt":0.0147,"offset":[-40,-145.25],"rect":[0,822,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[0.154,-35.25],"hearts":[[-8.747,3.3],[-0.047,3.3],[8.653,3.3]],"tilt":0.0044,"offset":[-41,-145.25],"rect":[84,822,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,822,82,159],"canopy":[-145.65,-69.15]}],"cloud":[{"frame":1,"offset":[-28,-18],"rect":[685,1305,58,30]},{"frame":2,"offset":[-29,-17],"rect":[805,1305,60,29]},{"frame":3,"offset":[-30,-16],"rect":[0,1466,62,27]},{"frame":4,"offset":[-31,-16],"rect":[64,1466,63,27]},{"frame":5,"offset":[-31,-16],"rect":[129,1466,64,27]},{"frame":6,"offset":[-31,-16],"rect":[195,1466,63,27]},{"frame":7,"offset":[-30,-16],"rect":[260,1466,62,27]},{"frame":8,"offset":[-29,-17],"rect":[867,1305,60,29]},{"frame":9,"offset":[-28,-18],"rect":[745,1305,58,30]},{"frame":10,"offset":[-27,-13],"rect":[350,1466,55,22]},{"frame":11,"offset":[-17,-5],"rect":[0,1495,36,8]},{"frame":12,"offset":[-3,-1],"rect":[38,1495,3,1]}],"gust":[{"frame":10,"offset":[-58,-23.5],"rect":[598,1466,9,21]},{"frame":11,"offset":[-58,-25.5],"rect":[324,1466,24,25]},{"frame":12,"offset":[-58,-27.5],"rect":[929,1305,47,28]},{"frame":13,"offset":[-57,-28.5],"rect":[614,1305,69,31]},{"frame":14,"offset":[-57,-29.5],"rect":[336,1305,86,34]},{"frame":15,"offset":[-56,-29.5],"rect":[424,1305,93,33]},{"frame":16,"offset":[-56,-29.5],"rect":[519,1305,93,33]},{"frame":17,"offset":[-57,-18.5],"rect":[407,1466,94,22]},{"frame":18,"offset":[-57,-18.5],"rect":[503,1466,93,22]},{"frame":19,"offset":[-58,-18.5],"rect":[609,1466,92,21]},{"frame":20,"offset":[-56,-17.5],"rect":[703,1466,86,20]},{"frame":21,"offset":[-51,-16.5],"rect":[817,1466,73,18]},{"frame":22,"offset":[-42,-14.5],"rect":[892,1466,55,15]},{"frame":23,"offset":[-35,-13.5],"rect":[949,1466,39,13]},{"frame":24,"offset":[-26,-11.5],"rect":[990,1466,19,11]},{"frame":25,"offset":[-19,-1.5],"rect":[43,1495,5,1]}],"star":[{"frame":1,"offset":[-12,-11],"rect":[791,1466,24,20]}],"balloonLeft":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,822,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,822,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[420,822,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[504,822,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[588,822,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[672,822,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[756,822,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[840,822,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[924,822,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-43,-145.25],"rect":[0,983,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-46,-145.25],"rect":[84,983,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[0.499,-35.246],"hearts":[[-8.852,3.471],[-0.152,3.471],[8.548,3.471]],"tilt":0.0142,"offset":[-47,-146.25],"rect":[836,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[1.689,-35.21],"hearts":[[-9.214,3.89],[-0.514,3.89],[8.186,3.89]],"tilt":0.0479,"offset":[-49,-147.25],"rect":[83,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[3.106,-35.113],"hearts":[[-9.645,4.421],[-0.945,4.421],[7.755,4.421]],"tilt":0.0882,"offset":[-52,-148.25],"rect":[590,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[4.289,-34.988],"hearts":[[-10.005,4.943],[-1.305,4.943],[7.395,4.943]],"tilt":0.122,"offset":[-55,-148.25],"rect":[84,169,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[4.784,-34.924],"hearts":[[-10.156,5.354],[-1.456,5.354],[7.244,5.354]],"tilt":0.1361,"offset":[-56,-148.25],"rect":[171,169,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[3.988,-35.024],"hearts":[[-9.913,5.556],[-1.213,5.556],[7.487,5.556]],"tilt":0.1134,"offset":[-55,-149.25],"rect":[576,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[1.99,-35.194],"hearts":[[-9.306,5.302],[-0.606,5.302],[8.094,5.302]],"tilt":0.0565,"offset":[-53,-149.25],"rect":[259,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[-0.615,-35.245],"hearts":[[-8.513,4.554],[0.187,4.554],[8.887,4.554]],"tilt":-0.0175,"offset":[-51,-149.25],"rect":[673,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[-3.217,-35.103],"hearts":[[-7.721,3.518],[0.979,3.518],[9.679,3.518]],"tilt":-0.0914,"offset":[-48,-150.25],"rect":[663,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[-5.208,-34.863],"hearts":[[-7.115,2.452],[1.585,2.452],[10.285,2.452]],"tilt":-0.1483,"offset":[-47,-150.25],"rect":[163,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[-6,-34.736],"hearts":[[-6.875,1.649],[1.825,1.649],[10.525,1.649]],"tilt":-0.171,"offset":[-46,-150.25],"rect":[244,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[-5.046,-34.887],"hearts":[[-7.165,1.39],[1.535,1.39],[10.235,1.39]],"tilt":-0.1436,"offset":[-43,-149.25],"rect":[744,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[-2.756,-35.142],"hearts":[[-7.861,1.936],[0.839,1.936],[9.539,1.936]],"tilt":-0.0783,"offset":[-40,-148.25],"rect":[755,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[-0.009,-35.25],"hearts":[[-8.697,3],[0.003,3],[8.703,3]],"tilt":-0.0003,"offset":[-38,-147.25],"rect":[250,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[2.293,-35.175],"hearts":[[-9.398,4.009],[-0.698,4.009],[8.002,4.009]],"tilt":0.0651,"offset":[-36,-145.25],"rect":[919,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[3.256,-35.099],"hearts":[[-9.691,4.454],[-0.991,4.454],[7.709,4.454]],"tilt":0.0925,"offset":[-35,-145.25],"rect":[0,499,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[2.518,-35.16],"hearts":[[-9.466,4.421],[-0.766,4.421],[7.934,4.421]],"tilt":0.0715,"offset":[-35,-145.25],"rect":[84,499,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[0.892,-35.239],"hearts":[[-8.971,4.309],[-0.271,4.309],[8.429,4.309]],"tilt":0.0253,"offset":[-37,-145.25],"rect":[168,983,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[-0.736,-35.242],"hearts":[[-8.476,4.118],[0.224,4.118],[8.924,4.118]],"tilt":-0.0209,"offset":[-40,-145.25],"rect":[251,983,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[-1.476,-35.219],"hearts":[[-8.251,3.891],[0.449,3.891],[9.149,3.891]],"tilt":-0.0419,"offset":[-42,-145.25],"rect":[335,983,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[-1.323,-35.225],"hearts":[[-8.298,3.672],[0.402,3.672],[9.102,3.672]],"tilt":-0.0375,"offset":[-43,-145.25],"rect":[419,983,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[-0.957,-35.237],"hearts":[[-8.409,3.484],[0.291,3.484],[8.991,3.484]],"tilt":-0.0271,"offset":[-43,-145.25],"rect":[503,983,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[-0.52,-35.246],"hearts":[[-8.542,3.35],[0.158,3.35],[8.858,3.35]],"tilt":-0.0147,"offset":[-42,-145.25],"rect":[587,983,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[-0.154,-35.25],"hearts":[[-8.653,3.3],[0.047,3.3],[8.747,3.3]],"tilt":-0.0044,"offset":[-41,-145.25],"rect":[671,983,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[755,983,82,159],"canopy":[-145.65,-69.15]}],"collect":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[10.068,-4.441],"offset":[-40,-148.25],"rect":[837,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[11.322,-5.709],"offset":[-44,-147.25],"rect":[334,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[13.975,-8.143],"offset":[-46,-145.25],"rect":[167,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[15.885,-10.446],"offset":[-47,-145.25],"rect":[251,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[16.751,-10.951],"offset":[-46,-145.25],"rect":[335,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[17.56,-12.235],"offset":[-44,-145.25],"rect":[839,983,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[18.135,-16.394],"offset":[-42,-145.25],"rect":[922,983,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[17.691,-18.938],"offset":[-40,-145.25],"rect":[0,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[16.537,-17.73],"offset":[-39,-145.25],"rect":[84,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[13.631,-14.729],"offset":[-39,-145.25],"rect":[168,1144,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[10.07,-11.812],"offset":[-40,-145.25],"rect":[252,1144,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[9.662,-7.555],"offset":[-41,-145.25],"rect":[336,1144,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[8.654,-4.406],"offset":[-41,-145.25],"rect":[420,1144,82,159]}],"blink":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[504,1144,82,159]}],"loss":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[588,1144,82,159]}],"collectLeft":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[-8.378,-4.827],"offset":[-40,-148.25],"rect":[919,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[-9.886,-5.844],"offset":[-38,-147.25],"rect":[418,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[-12.777,-7.986],"offset":[-36,-145.25],"rect":[418,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[-15.216,-10.279],"offset":[-35,-145.25],"rect":[502,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[-16.245,-10.838],"offset":[-35,-145.25],"rect":[586,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[-16.992,-12.179],"offset":[-37,-145.25],"rect":[672,1144,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[-17.435,-16.423],"offset":[-40,-145.25],"rect":[755,1144,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[-16.952,-18.997],"offset":[-42,-145.25],"rect":[839,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[-15.666,-17.778],"offset":[-43,-145.25],"rect":[923,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[-12.542,-14.806],"offset":[-43,-145.25],"rect":[0,1305,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[-9.432,-11.921],"offset":[-42,-145.25],"rect":[84,1305,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[-8.477,-7.999],"offset":[-41,-145.25],"rect":[168,1305,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[-8.019,-4.493],"offset":[-41,-145.25],"rect":[252,1305,82,159]}]},"atlas":[1024,1503],"image":"winds/e43208c3ca0a0d3888ef.png"};
return {mountBundledStage(container,options){return __entry.mountStage(container,{...options,ui:{...ui,fontBytes:Uint8Array.from(atob(ui.font),c=>c.charCodeAt(0)).buffer},manifest,loadAtlas:async name=>{const r=await options.loadResource(name);if(r.type!=="image/png"||!ArrayBuffer.isView(r.bytes))throw Error("像素资源格式无效");return createImageBitmap(new Blob([r.bytes],{type:r.type}),{premultiplyAlpha:"none"});}});}};
}});
