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
    "title": "干饭不吃泡",
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
    "title": "还是老样子",
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
    "title": "这船还能开",
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
    "title": "顺风摘星",
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
function mountControlGuide(root, {device, key, action}) {
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
    mountControlGuide(root, copy.control);
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

const ui={"markup":"<canvas id=\"canvas\" aria-hidden=\"true\"></canvas>\n<span id=\"current\" class=\"pin\" aria-label=\"气球位置\" hidden></span>\n<span id=\"target\" class=\"pin\" aria-label=\"星星位置\" hidden></span>\n<span id=\"heat\" class=\"sr\" role=\"meter\" aria-label=\"气囊热度\" aria-valuemin=\"0\" aria-valuemax=\"100\" hidden></span>\n<span id=\"flight-status\" class=\"sr\"></span>\n<div id=\"clouds\" aria-label=\"可选的云\" role=\"group\"></div>\n<button id=\"pilot\" type=\"button\" aria-label=\"移动鲸鱼娘\" hidden></button>\n<button id=\"resume\" type=\"button\" data-game-resume aria-label=\"点鲸鱼娘继续\" hidden></button>\n<div id=\"lobby\" class=\"lobby\" hidden>\n<canvas id=\"companion\" width=\"200\" height=\"200\" aria-hidden=\"true\"></canvas>\n<section id=\"welcome\" class=\"paper\" aria-label=\"摘星前\" hidden>\n  <div class=\"rules\">\n    <div><canvas id=\"rule-add\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (30,45) 加 (15,0)，飞到 (45,45)\"></canvas><span id=\"rule-a\" data-pixel-text></span></div>\n    <div><canvas id=\"rule-subtract\" width=\"112\" height=\"60\" role=\"img\" aria-label=\"从 (45,45) 减 (5,0)，到 (40,45) 摘星\"></canvas><span id=\"rule-b\" data-pixel-text></span></div>\n  </div>\n  <p data-braingames-controls></p>\n  <button id=\"start\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n<section id=\"result\" class=\"paper\" aria-labelledby=\"result-lead\" role=\"dialog\" hidden>\n  <h2 id=\"result-lead\" data-pixel-text></h2>\n  <p class=\"number\" aria-live=\"polite\"><strong id=\"score\" data-pixel-text>0</strong><span id=\"unit\" data-pixel-text></span></p>\n  <p class=\"best\"><span id=\"best-label\" data-pixel-text></span><span class=\"best-score\"><strong id=\"best-value\" data-pixel-text>0</strong><span data-pixel-text>颗</span></span></p>\n  <div class=\"actions\"><button id=\"replay\" class=\"primary\" type=\"button\" data-pixel-text></button>\n  <button id=\"random\" class=\"secondary\" type=\"button\" data-pixel-text hidden></button></div>\n</section>\n<section id=\"error\" class=\"paper\" role=\"alert\" hidden>\n  <p id=\"load-error\" data-pixel-text></p>\n  <p id=\"error-detail\"></p>\n  <button id=\"reload\" class=\"primary\" type=\"button\" data-pixel-text></button>\n</section>\n</div>\n<span id=\"tip\" hidden></span>\n<p id=\"announce\" class=\"sr\" role=\"status\" aria-live=\"polite\"></p>\n","style":":host {\n  display: block; width: 100%; height: 100%; color-scheme: light dark;\n  --paper: #f6f0dd; --ink: #263248; --gold: #9f8355; --muted: #626974;\n}\n*, *::before, *::after { box-sizing: border-box; }\n[hidden] { display: none !important; }\n.stage { position: absolute; inset: 0; pointer-events: none; user-select: none; overflow: hidden; }\n#canvas { position: absolute; inset: 0; width: 100%; height: 100%; }\ncanvas { image-rendering: pixelated; }\nbutton { cursor: pointer; touch-action: manipulation; pointer-events: auto; }\nbutton:disabled { cursor: default; pointer-events: none; }\n.pin {\n  position: absolute; white-space: nowrap; transform: translate(-50%, -50%);\n  border: 1px solid #a48256; background: var(--paper); color: #42332e;\n  width: var(--pin-width); height: var(--pin-height); text-align: center;\n  padding: 1px 0; font: 700 14px/19px Consolas, monospace;\n}\n#target { background: #fff0c4; border-color: #bd8a43; }\n.cloud {\n  position: absolute; transform: translate(-50%, -50%); border: 0; background: transparent; padding: 0 0 1px;\n  color: #344854; text-shadow: 0 1px #fffae6; font: 700 13px/1 Consolas, monospace;\n}\n.cloud::before {\n  content: \"\"; position: absolute; inset: 3px 0; z-index: -1; pointer-events: none;\n  clip-path: polygon(2% 49%,12% 36%,24% 31%,32% 17%,40% 8%,54% 12%,65% 19%,77% 26%,91% 45%,99% 58%,95% 79%,83% 91%,18% 93%,6% 81%);\n}\n.cloud:hover:not([aria-disabled=\"true\"])::before, .cloud:focus-visible::before { background: #fff6d43a; }\n.cloud:focus-visible { outline: 2px solid #455a60; outline-offset: -4px; }\n.cloud[aria-disabled=\"true\"] { cursor: default; }\n#pilot, #resume {\n  position: absolute; width: 58px; height: 58px; transform: translate(-50%, -50%); background: transparent;\n  border: 0; clip-path: inset(0 round 20%); padding: 0;\n}\n#pilot { cursor: grab; touch-action: none; }\n#pilot[data-dragging] { cursor: grabbing; }\n#pilot:focus-visible, #resume:focus-visible { outline: 2px solid #8d7052; outline-offset: -3px; }\n.lobby { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);\n  display: grid; grid-template-columns: 280px 200px; align-items: center; pointer-events: none; }\n#companion { width: 200px; height: 200px; grid-column: 2; grid-row: 1; }\n.stage[data-compact] .lobby { grid-template-columns: 280px; gap: 4px; justify-items: center; }\n.stage[data-compact] #companion { grid-column: 1; width: 108px; height: 108px; }\n.stage[data-compact] .paper { grid-row: 2; }\n.paper {\n  grid-column: 1; grid-row: 1; width: 280px;\n  padding: 20px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink);\n  box-shadow: inset 2px 2px #fffbed, inset -2px -2px #d8ccb1, 4px 4px #0e172c55;\n  font: 18px/24px \"Whale Wind Pixel\", serif; text-align: center;\n  clip-path: polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px));\n}\n.paper p, .paper h2 { margin: 0; font: inherit; }\n.rules { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0 0 20px; padding: 4px 0 8px; }\n.rules > div { display: flex; flex-direction: column; align-items: center; gap: 12px; white-space: nowrap; }\n.rules > div + div { border-left: 2px solid #e6ddc3; }\n.paper button { display: block; width: 100%; color: var(--ink); font: inherit; }\n.primary { min-height: 42px; padding: 7px 12px; border: 2px solid var(--gold); background: #f3d391;\n  box-shadow: inset 0 2px #ffe9b6, 0 2px var(--gold); }\n.primary:hover:not(:disabled), .primary:focus-visible { background: #f8dc9e; border-color: var(--ink); }\n.primary:active:not(:disabled) { transform: translateY(2px); }\n.paper .secondary { min-height: 36px; padding: 4px 8px; border: 2px solid transparent; color: var(--muted); background: transparent; }\n.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: #c6baa0; background: #e9e0c8; }\n.paper button:disabled { opacity: .58; }\n.actions { display: grid; gap: 8px; }\n#result h2, .best { color: var(--muted); }\n.number { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0 16px; }\n.number > strong, .best-score > strong { font-weight: 400; font-variant-numeric: tabular-nums; }\n.best { display: flex; justify-content: space-between; border-top: 2px solid #e6ddc3; padding: 12px 0 16px; }\n.best-score { display: flex; gap: 6px; }\n#error-detail { font: 13px/18px system-ui, sans-serif; overflow-wrap: anywhere; }\n[data-pixel-text] { position: relative; }\n[data-pixel-ready] { -webkit-text-fill-color: transparent; }\nspan[data-pixel-text], strong[data-pixel-text] { display: inline-block; }\n[data-pixel-ready]::after {\n  content: \"\"; position: absolute; inset: 0; pointer-events: none;\n  background: var(--pixel-label) 0 0 / var(--pixel-label-size) no-repeat; image-rendering: pixelated;\n}\n.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }\n.stage[data-small] > :not(.sr) { visibility: hidden; }\n#tip {\n  position: absolute; transform: translate(-50%, -50%); white-space: nowrap;\n  padding: 1px 5px; color: #475861; background: #fff8e9e0;\n  font: 14px/21px \"Whale Wind Pixel\", serif;\n}\n","font":"AAEAAAASAQAABAAgQkFTRWv7eSkAAAM0AAAA3kdQT1Nzt0peAAAF/AAAAbpHU1VCFpwChgAAAowAAACmT1MvMp/EArsAAAIsAAAAYFNUQVR4kmzdAAABxAAAAC5jbWFw7CzXGAAAC6wAAANtZ2FzcAAAABAAAAE0AAAACGdseWYT6bOtAAAPHAAAepRoZWFkLFRYOwAAAfQAAAA2aGhlYQwOCF0AAAF8AAAAJGhtdHiZuBfSAAAHuAAAAc5sb2Nh0LezlgAABBQAAADybWF4cAC4AmsAAAE8AAAAIG5hbWUsJ0oWAAAJiAAAAiRwb3N0/7gAMgAAAVwAAAAgcHJlcGgGjIUAAAEsAAAAB3ZoZWEMqhctAAABoAAAACR2bXR4GQwTmwAABQgAAADyuAH/hbAEjQAAAQAB//8ADwABAAAAeAJqAD8AAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAABH/+4gAAC7j8G/1TC3EAAQAAAAAAAAAAAAAAAAAAAG8AARAAAfT+DAAAC7j/Qf1oC3EAAAABAAAAAAAAAAAAAAAAAAEAAQABAAgAAQAAABQAAQAAABwAAndnaHQBAQAAAAIAAwAAAAIAAgGQAAACvAAAAAAAAQAAAAIAxeToCIhfDzz1AAMD6AAAAADix6C8AAAAAOLoct/8G/vnC3EHEQAAAAYAAgAAAAAAAAAEA+EBkAAFAAACigJYAAAASwKKAlgAAAFeADIBNAAAAgICAAAAAAAAACAAAIMq3zwQAAAAFgAAAABHT09HAEAAIP8MA3D/iAAABH8BHmAGAQcAAAAAAgIC2QAAACAABgABAAAACgBUAHQABkRGTFQAPGN5cmwAJmdyZWsAJmhhbmkAPGthbmEAPGxhdG4AJgAKAAFaSFMgABoAAP//AAMAAAABAAIABAAAAAD//wACAAEAAgADbG9jbAAadmVydAAUdnJ0MgAUAAAAAQABAAAAAQAAAAIAGgAGAAEAAAABAAgAAQAG//8AAQABAGwAAQAAAAEACAABAAYAbAACAAEAAgALAAAAAAABAAEAagAMAAAAAADAAAQABkRGTFQAOGN5cmwAJmdyZWsAJmhhbmkAOGthbmEAOGxhdG4AJgAGAAAAAAADAAQAKAAiAHwAHgAGAAAAAAACAAQAFgAQAGoADAABAHgAAwO/AAAAAwApAAAAYgAEAAZERkxUADhjeXJsACZncmVrACZoYW5pADhrYW5hADhsYXRuACYABgAAAAAAAwAEACwAJgAiAB4ABgAAAAAAAgAEABoAFAAQAAwAAQAAAAH/iAADA0cAAAAD/7EAAAAEaWNmYmljZnRpZGVvcm9tbgAAAAAAKwArAGEAggDAARQBMwFyAasBwQITAk0CYwJ7ArEC/QM6A4ID8ARPBL4FUQWNBgEGbwcuB/cI7wlsCiYLDwuIDAAMZQz2DUYNww5RD7MQHRCoERIRshI/EsITFxOPE+QUPBTgFWAV/hZwFssXpBhxGXQaLxp/G24b1RxbHQgdYx33HqIfTx/sIDQgoSF9IhgjCCO0JE4k7SW9Jh4mpCdFKBspDCoOKowrJivHLFotJS40Lx8vxjBdMP4xojJzMtMzWDSHNVM1tTZcN0k3wTgmOOg5nDrLOus7CjstO2M7hDvCPBU8NDxxPKc8vT0RPUoAAAPoAAADcACJAI4AiQCJAI0AmACJAJgAiQCJAckBbgBBAD0AKwBNAEwARAArACYAKAArAD8AIwAhACwALwA8ACoALQApADAAIgApACsAJgApACkAKQAvACUAKQAvAC8AQwAqAFcAHQAtADkAMQArACoAJQAoACsALAAmAD4APQA5ACgANAAqACYALABEACcANgAoACkALgBEAEgALgBFADwAKwAoACcAKAAtADAALAAqACoAKQArAC8ALAAuAC4AMQBFACkAIgAoADgAPgAwADkASgApAB8AKQBZAvoBUACjAKcAowCjAKgAsQCjALEAowCjAAAAAQAAAAoASACeAAZERkxUACZjeXJsACZncmVrACZoYW5pACZrYW5hACZsYXRuACYABAAAAAD//wAHAAEAAgADAAUABgAAAAQAB2Nod3MAUGhhbHQASmtlcm4ARHBhbHQAPnZjaHcAOHZoYWwAMnZwYWwALAAAAAEABAAAAAEAAwAAAAEABgAAAAEAAgAAAAEAAQAAAAEAAAAAAAEABQAHAPQAtACgAH4AWAA0ABAAAgAAAAEACAACAIIACAAAANgAFAABAAIAAP4MAAEAawABAAEAAgAAAAEACAACAMoABAAAALQAFAABAAIAAP4MAAEAbAABAAEAAQAAAAMAHAAwAAwAAQAKAAoAh/7s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"};
const manifest={"fps":20,"end":36,"dockFrame":9,"pushFrame":12,"landingFrame":26,"smileFrame":33,"layers":{"balloon":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[669,499,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[753,499,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[837,499,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[921,499,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[0,661,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[84,661,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,661,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,661,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,661,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-39,-145.25],"rect":[420,661,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-36,-145.25],"rect":[504,661,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[-0.499,-35.246],"hearts":[[-8.548,3.471],[0.152,3.471],[8.852,3.471]],"tilt":-0.0142,"offset":[-34,-146.25],"rect":[502,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[-1.689,-35.21],"hearts":[[-8.186,3.89],[0.514,3.89],[9.214,3.89]],"tilt":-0.0479,"offset":[-32,-147.25],"rect":[0,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[-3.106,-35.113],"hearts":[[-7.755,4.421],[0.945,4.421],[9.645,4.421]],"tilt":-0.0882,"offset":[-29,-148.25],"rect":[343,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[-4.289,-34.988],"hearts":[[-7.395,4.943],[1.305,4.943],[10.005,4.943]],"tilt":-0.122,"offset":[-30,-148.25],"rect":[826,0,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[-4.784,-34.924],"hearts":[[-7.244,5.354],[1.456,5.354],[10.156,5.354]],"tilt":-0.1361,"offset":[-30,-148.25],"rect":[913,0,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[-3.988,-35.024],"hearts":[[-7.487,5.556],[1.213,5.556],[9.913,5.556]],"tilt":-0.1134,"offset":[-30,-149.25],"rect":[326,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[-1.99,-35.194],"hearts":[[-8.094,5.302],[0.606,5.302],[9.306,5.302]],"tilt":-0.0565,"offset":[-29,-149.25],"rect":[0,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[0.615,-35.245],"hearts":[[-8.887,4.554],[-0.187,4.554],[8.513,4.554]],"tilt":0.0175,"offset":[-29,-149.25],"rect":[426,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[3.217,-35.103],"hearts":[[-9.679,3.518],[-0.979,3.518],[7.721,3.518]],"tilt":0.0914,"offset":[-31,-150.25],"rect":[413,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[5.208,-34.863],"hearts":[[-10.285,2.452],[-1.585,2.452],[7.115,2.452]],"tilt":0.1483,"offset":[-32,-150.25],"rect":[0,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[6,-34.736],"hearts":[[-10.525,1.649],[-1.825,1.649],[6.875,1.649]],"tilt":0.171,"offset":[-34,-150.25],"rect":[81,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[5.046,-34.887],"hearts":[[-10.235,1.39],[-1.535,1.39],[7.165,1.39]],"tilt":0.1436,"offset":[-37,-149.25],"rect":[494,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[2.756,-35.142],"hearts":[[-9.539,1.936],[-0.839,1.936],[7.861,1.936]],"tilt":0.0783,"offset":[-40,-148.25],"rect":[508,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[0.009,-35.25],"hearts":[[-8.703,3],[-0.003,3],[8.697,3]],"tilt":0.0003,"offset":[-44,-147.25],"rect":[166,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[-2.293,-35.175],"hearts":[[-8.002,4.009],[0.698,4.009],[9.398,4.009]],"tilt":-0.0651,"offset":[-46,-145.25],"rect":[585,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[-3.256,-35.099],"hearts":[[-7.709,4.454],[0.991,4.454],[9.691,4.454]],"tilt":-0.0925,"offset":[-47,-145.25],"rect":[669,335,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[-2.518,-35.16],"hearts":[[-7.934,4.421],[0.766,4.421],[9.466,4.421]],"tilt":-0.0715,"offset":[-46,-145.25],"rect":[753,335,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[-0.892,-35.239],"hearts":[[-8.429,4.309],[0.271,4.309],[8.971,4.309]],"tilt":-0.0253,"offset":[-44,-145.25],"rect":[588,661,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[0.736,-35.242],"hearts":[[-8.924,4.118],[-0.224,4.118],[8.476,4.118]],"tilt":0.0209,"offset":[-42,-145.25],"rect":[671,661,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[1.476,-35.219],"hearts":[[-9.149,3.891],[-0.449,3.891],[8.251,3.891]],"tilt":0.0419,"offset":[-40,-145.25],"rect":[755,661,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[1.323,-35.225],"hearts":[[-9.102,3.672],[-0.402,3.672],[8.298,3.672]],"tilt":0.0375,"offset":[-39,-145.25],"rect":[839,661,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[0.957,-35.237],"hearts":[[-8.991,3.484],[-0.291,3.484],[8.409,3.484]],"tilt":0.0271,"offset":[-39,-145.25],"rect":[923,661,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[0.52,-35.246],"hearts":[[-8.858,3.35],[-0.158,3.35],[8.542,3.35]],"tilt":0.0147,"offset":[-40,-145.25],"rect":[0,822,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[0.154,-35.25],"hearts":[[-8.747,3.3],[-0.047,3.3],[8.653,3.3]],"tilt":0.0044,"offset":[-41,-145.25],"rect":[84,822,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[168,822,82,159],"canopy":[-145.65,-69.15]}],"cloud":[{"frame":1,"offset":[-28,-18],"rect":[685,1305,58,30]},{"frame":2,"offset":[-29,-17],"rect":[805,1305,60,29]},{"frame":3,"offset":[-30,-16],"rect":[0,1466,62,27]},{"frame":4,"offset":[-31,-16],"rect":[64,1466,63,27]},{"frame":5,"offset":[-31,-16],"rect":[129,1466,64,27]},{"frame":6,"offset":[-31,-16],"rect":[195,1466,63,27]},{"frame":7,"offset":[-30,-16],"rect":[260,1466,62,27]},{"frame":8,"offset":[-29,-17],"rect":[867,1305,60,29]},{"frame":9,"offset":[-28,-18],"rect":[745,1305,58,30]},{"frame":10,"offset":[-27,-13],"rect":[350,1466,55,22]},{"frame":11,"offset":[-17,-5],"rect":[0,1495,36,8]},{"frame":12,"offset":[-3,-1],"rect":[38,1495,3,1]}],"gust":[{"frame":10,"offset":[-58,-23.5],"rect":[598,1466,9,21]},{"frame":11,"offset":[-58,-25.5],"rect":[324,1466,24,25]},{"frame":12,"offset":[-58,-27.5],"rect":[929,1305,47,28]},{"frame":13,"offset":[-57,-28.5],"rect":[614,1305,69,31]},{"frame":14,"offset":[-57,-29.5],"rect":[336,1305,86,34]},{"frame":15,"offset":[-56,-29.5],"rect":[424,1305,93,33]},{"frame":16,"offset":[-56,-29.5],"rect":[519,1305,93,33]},{"frame":17,"offset":[-57,-18.5],"rect":[407,1466,94,22]},{"frame":18,"offset":[-57,-18.5],"rect":[503,1466,93,22]},{"frame":19,"offset":[-58,-18.5],"rect":[609,1466,92,21]},{"frame":20,"offset":[-56,-17.5],"rect":[703,1466,86,20]},{"frame":21,"offset":[-51,-16.5],"rect":[817,1466,73,18]},{"frame":22,"offset":[-42,-14.5],"rect":[892,1466,55,15]},{"frame":23,"offset":[-35,-13.5],"rect":[949,1466,39,13]},{"frame":24,"offset":[-26,-11.5],"rect":[990,1466,19,11]},{"frame":25,"offset":[-19,-1.5],"rect":[43,1495,5,1]}],"star":[{"frame":1,"offset":[-12,-11],"rect":[791,1466,24,20]}],"balloonLeft":[{"frame":1,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[252,822,82,159],"canopy":[-145.65,-69.15]},{"frame":2,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[336,822,82,159],"canopy":[-145.65,-69.15]},{"frame":3,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[420,822,82,159],"canopy":[-145.65,-69.15]},{"frame":4,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[504,822,82,159],"canopy":[-145.65,-69.15]},{"frame":5,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[588,822,82,159],"canopy":[-145.65,-69.15]},{"frame":6,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[672,822,82,159],"canopy":[-145.65,-69.15]},{"frame":7,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[756,822,82,159],"canopy":[-145.65,-69.15]},{"frame":8,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[840,822,82,159],"canopy":[-145.65,-69.15]},{"frame":9,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[924,822,82,159],"canopy":[-145.65,-69.15]},{"frame":10,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-43,-145.25],"rect":[0,983,82,159],"canopy":[-145.666,-69.062]},{"frame":11,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-46,-145.25],"rect":[84,983,82,159],"canopy":[-145.667,-68.899]},{"frame":12,"pilot":[0.499,-35.246],"hearts":[[-8.852,3.471],[-0.152,3.471],[8.548,3.471]],"tilt":0.0142,"offset":[-47,-146.25],"rect":[836,335,81,160],"canopy":[-146.575,-69.119]},{"frame":13,"pilot":[1.689,-35.21],"hearts":[[-9.214,3.89],[-0.514,3.89],[8.186,3.89]],"tilt":0.0479,"offset":[-49,-147.25],"rect":[83,335,81,162],"canopy":[-147.315,-69.221]},{"frame":14,"pilot":[3.106,-35.113],"hearts":[[-9.645,4.421],[-0.945,4.421],[7.755,4.421]],"tilt":0.0882,"offset":[-52,-148.25],"rect":[590,169,81,163],"canopy":[-147.87,-69.164]},{"frame":15,"pilot":[4.289,-34.988],"hearts":[[-10.005,4.943],[-1.305,4.943],[7.395,4.943]],"tilt":0.122,"offset":[-55,-148.25],"rect":[84,169,85,164],"canopy":[-148.274,-69.068]},{"frame":16,"pilot":[4.784,-34.924],"hearts":[[-10.156,5.354],[-1.456,5.354],[7.244,5.354]],"tilt":0.1361,"offset":[-56,-148.25],"rect":[171,169,86,164],"canopy":[-148.613,-69.039]},{"frame":17,"pilot":[3.988,-35.024],"hearts":[[-9.913,5.556],[-1.213,5.556],[7.487,5.556]],"tilt":0.1134,"offset":[-55,-149.25],"rect":[576,0,85,165],"canopy":[-148.938,-69.116]},{"frame":18,"pilot":[1.99,-35.194],"hearts":[[-9.306,5.302],[-0.606,5.302],[8.094,5.302]],"tilt":0.0565,"offset":[-53,-149.25],"rect":[259,169,82,164],"canopy":[-149.315,-69.377]},{"frame":19,"pilot":[-0.615,-35.245],"hearts":[[-8.513,4.554],[0.187,4.554],[8.887,4.554]],"tilt":-0.0175,"offset":[-51,-149.25],"rect":[673,169,80,163],"canopy":[-149.747,-69.835]},{"frame":20,"pilot":[-3.217,-35.103],"hearts":[[-7.721,3.518],[0.979,3.518],[9.679,3.518]],"tilt":-0.0914,"offset":[-48,-150.25],"rect":[663,0,79,165],"canopy":[-150.121,-70.37]},{"frame":21,"pilot":[-5.208,-34.863],"hearts":[[-7.115,2.452],[1.585,2.452],[10.285,2.452]],"tilt":-0.1483,"offset":[-47,-150.25],"rect":[163,0,79,167],"canopy":[-150.294,-70.811]},{"frame":22,"pilot":[-6,-34.736],"hearts":[[-6.875,1.649],[1.825,1.649],[10.525,1.649]],"tilt":-0.171,"offset":[-46,-150.25],"rect":[244,0,80,167],"canopy":[-150.143,-71.06]},{"frame":23,"pilot":[-5.046,-34.887],"hearts":[[-7.165,1.39],[1.535,1.39],[10.235,1.39]],"tilt":-0.1436,"offset":[-43,-149.25],"rect":[744,0,80,165],"canopy":[-149.532,-71.025]},{"frame":24,"pilot":[-2.756,-35.142],"hearts":[[-7.861,1.936],[0.839,1.936],[9.539,1.936]],"tilt":-0.0783,"offset":[-40,-148.25],"rect":[755,169,80,163],"canopy":[-148.333,-70.571]},{"frame":25,"pilot":[-0.009,-35.25],"hearts":[[-8.697,3],[0.003,3],[8.703,3]],"tilt":-0.0003,"offset":[-38,-147.25],"rect":[250,335,82,161],"canopy":[-146.831,-69.531]},{"frame":26,"pilot":[2.293,-35.175],"hearts":[[-9.398,4.009],[-0.698,4.009],[8.002,4.009]],"tilt":0.0651,"offset":[-36,-145.25],"rect":[919,335,82,160],"canopy":[-145.313,-68.492]},{"frame":27,"pilot":[3.256,-35.099],"hearts":[[-9.691,4.454],[-0.991,4.454],[7.709,4.454]],"tilt":0.0925,"offset":[-35,-145.25],"rect":[0,499,82,160],"canopy":[-145.086,-68.219]},{"frame":28,"pilot":[2.518,-35.16],"hearts":[[-9.466,4.421],[-0.766,4.421],[7.934,4.421]],"tilt":0.0715,"offset":[-35,-145.25],"rect":[84,499,81,160],"canopy":[-145.108,-68.28]},{"frame":29,"pilot":[0.892,-35.239],"hearts":[[-8.971,4.309],[-0.271,4.309],[8.429,4.309]],"tilt":0.0253,"offset":[-37,-145.25],"rect":[168,983,81,159],"canopy":[-145.168,-68.451]},{"frame":30,"pilot":[-0.736,-35.242],"hearts":[[-8.476,4.118],[0.224,4.118],[8.924,4.118]],"tilt":-0.0209,"offset":[-40,-145.25],"rect":[251,983,82,159],"canopy":[-145.252,-68.698]},{"frame":31,"pilot":[-1.476,-35.219],"hearts":[[-8.251,3.891],[0.449,3.891],[9.149,3.891]],"tilt":-0.0419,"offset":[-42,-145.25],"rect":[335,983,82,159],"canopy":[-145.375,-68.776]},{"frame":32,"pilot":[-1.323,-35.225],"hearts":[[-8.298,3.672],[0.402,3.672],[9.102,3.672]],"tilt":-0.0375,"offset":[-43,-145.25],"rect":[419,983,82,159],"canopy":[-145.488,-68.831]},{"frame":33,"pilot":[-0.957,-35.237],"hearts":[[-8.409,3.484],[0.291,3.484],[8.991,3.484]],"tilt":-0.0271,"offset":[-43,-145.25],"rect":[503,983,82,159],"canopy":[-145.579,-68.945]},{"frame":34,"pilot":[-0.52,-35.246],"hearts":[[-8.542,3.35],[0.158,3.35],[8.858,3.35]],"tilt":-0.0147,"offset":[-42,-145.25],"rect":[587,983,82,159],"canopy":[-145.639,-69.057]},{"frame":35,"pilot":[-0.154,-35.25],"hearts":[[-8.653,3.3],[0.047,3.3],[8.747,3.3]],"tilt":-0.0044,"offset":[-41,-145.25],"rect":[671,983,82,159],"canopy":[-145.655,-69.129]},{"frame":36,"pilot":[0,-35.25],"hearts":[[-8.7,3.3],[0,3.3],[8.7,3.3]],"tilt":0,"offset":[-41,-145.25],"rect":[755,983,82,159],"canopy":[-145.65,-69.15]}],"collect":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[10.068,-4.441],"offset":[-40,-148.25],"rect":[837,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[11.322,-5.709],"offset":[-44,-147.25],"rect":[334,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[13.975,-8.143],"offset":[-46,-145.25],"rect":[167,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[15.885,-10.446],"offset":[-47,-145.25],"rect":[251,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[16.751,-10.951],"offset":[-46,-145.25],"rect":[335,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[17.56,-12.235],"offset":[-44,-145.25],"rect":[839,983,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[18.135,-16.394],"offset":[-42,-145.25],"rect":[922,983,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[17.691,-18.938],"offset":[-40,-145.25],"rect":[0,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[16.537,-17.73],"offset":[-39,-145.25],"rect":[84,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[13.631,-14.729],"offset":[-39,-145.25],"rect":[168,1144,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[10.07,-11.812],"offset":[-40,-145.25],"rect":[252,1144,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[9.662,-7.555],"offset":[-41,-145.25],"rect":[336,1144,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[8.654,-4.406],"offset":[-41,-145.25],"rect":[420,1144,82,159]}],"blink":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[504,1144,82,159]}],"loss":[{"frame":1,"canopy":[-145.65,-69.15],"palm":[8.42,-4.49],"offset":[-41,-145.25],"rect":[588,1144,82,159]}],"collectLeft":[{"frame":24,"canopy":[-148.333,-70.571],"palm":[-8.378,-4.827],"offset":[-40,-148.25],"rect":[919,169,80,163]},{"frame":25,"canopy":[-146.831,-69.531],"palm":[-9.886,-5.844],"offset":[-38,-147.25],"rect":[418,335,82,161]},{"frame":26,"canopy":[-145.313,-68.492],"palm":[-12.777,-7.986],"offset":[-36,-145.25],"rect":[418,499,82,160]},{"frame":27,"canopy":[-145.086,-68.219],"palm":[-15.216,-10.279],"offset":[-35,-145.25],"rect":[502,499,82,160]},{"frame":28,"canopy":[-145.108,-68.28],"palm":[-16.245,-10.838],"offset":[-35,-145.25],"rect":[586,499,81,160]},{"frame":29,"canopy":[-145.168,-68.451],"palm":[-16.992,-12.179],"offset":[-37,-145.25],"rect":[672,1144,81,159]},{"frame":30,"canopy":[-145.252,-68.698],"palm":[-17.435,-16.423],"offset":[-40,-145.25],"rect":[755,1144,82,159]},{"frame":31,"canopy":[-145.375,-68.776],"palm":[-16.952,-18.997],"offset":[-42,-145.25],"rect":[839,1144,82,159]},{"frame":32,"canopy":[-145.488,-68.831],"palm":[-15.666,-17.778],"offset":[-43,-145.25],"rect":[923,1144,82,159]},{"frame":33,"canopy":[-145.579,-68.945],"palm":[-12.542,-14.806],"offset":[-43,-145.25],"rect":[0,1305,82,159]},{"frame":34,"canopy":[-145.639,-69.057],"palm":[-9.432,-11.921],"offset":[-42,-145.25],"rect":[84,1305,82,159]},{"frame":35,"canopy":[-145.655,-69.129],"palm":[-8.477,-7.999],"offset":[-41,-145.25],"rect":[168,1305,82,159]},{"frame":36,"canopy":[-145.65,-69.15],"palm":[-8.019,-4.493],"offset":[-41,-145.25],"rect":[252,1305,82,159]}]},"atlas":[1024,1503],"image":"winds/e43208c3ca0a0d3888ef.png"};
return {mountBundledStage(container,options){return __entry.mountStage(container,{...options,ui:{...ui,fontBytes:Uint8Array.from(atob(ui.font),c=>c.charCodeAt(0)).buffer},manifest,loadAtlas:async name=>{const r=await options.loadResource(name);if(r.type!=="image/png"||!ArrayBuffer.isView(r.bytes))throw Error("像素资源格式无效");return createImageBitmap(new Blob([r.bytes],{type:r.type}),{premultiplyAlpha:"none"});}});}};
}});
