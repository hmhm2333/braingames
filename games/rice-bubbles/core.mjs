import {createRandom} from '../../runtime/random-state.mjs';
import {BUBBLE_PROFILES,bubbleChance} from './bubble-prd.mjs';
import {ENDLESS,DIFFICULTY,FOOD_IDS,PICKY_CUE_MS,difficultyForCorrect} from './rules.mjs';
export {ENDLESS,DIFFICULTY};
export const MEAL_PRESENTATION=Object.freeze({storedMs:625,durationMs:750});
const QA_KINDS=['rice','bubble','forbidden','wrapped'];

/** Deterministic kernel: appearance, food identity and the response rule are separate. */
export function createSession({seed=1,sequence=null,checkpoint=null}={}){
  if(checkpoint){if(checkpoint.version!==3||!checkpoint.state||!Array.isArray(checkpoint.random)||checkpoint.random.length!==6)throw Error('Invalid G10 checkpoint');seed=checkpoint.seed;sequence=checkpoint.sequence;}
  if(!Number.isInteger(seed)||seed<0||seed>0xFFFFFFFF)throw RangeError('seed must be a uint32');
  if(sequence!==null&&(!Array.isArray(sequence)||!sequence.length||sequence.some(kind=>!QA_KINDS.includes(kind))))throw TypeError('sequence must contain rice/bubble/forbidden/wrapped');
  const supplied=sequence?.slice()??null;
  const random=[0x1349,0x2567,0x47AB,0x59CD,0x6DEF,0x7EF1].map(salt=>createRandom(seed,salt));
  const [kinds,positions,variants,gaps,foods,wrapping]=random;
  let forbiddenFoodId=FOOD_IDS[Math.floor(createRandom(seed,0x8AB2)()*FOOD_IDS.length)];
  let allowedFoods=FOOD_IDS.filter(id=>id!==forbiddenFoodId);
  const id=`rice-bubbles-${seed}`;
  let status='idle',clockMs=0,current=null,slot=0,bowlFill=0,inputHeld=false,pauseReason=null,events=[],lives=3,settlementAtMs=null,finishReason=null,survivalEndMs=null,pickyActive=false,pickyIntro=null,bubbleWait=BUBBLE_PROFILES.intro.initialWait,bubbleStreak=0;
  const stats={riceCaught:0,bubblesPassed:0,bubbleMistakes:0,riceMissed:0,foodRefused:0,foodMistakes:0,interruptions:0,meals:0,activeMs:0,foodPresented:0,forbiddenPresented:0,emptyBubblePresented:0,wrappedPresented:0,wrappedPassed:0,wrappedMistakes:0};
  const correctCount=()=>stats.riceCaught+stats.bubblesPassed+stats.foodRefused;
  const emit=(type,fields={})=>events.push({type,atMs:clockMs,id:current?.id??id,...fields});
  const result=(ok,reason,fields={})=>({ok,reason,...fields});
  const pickFood=pool=>pool[Math.floor(foods()*pool.length)];
  function end(reason){status='finished';pauseReason=null;finishReason=reason;pickyIntro=null;emit('finish',{reason,stats:{...stats},bowlFill,lives});}
  function viewCurrent(){
    if(!current)return null;
    const {deadlineProcessed,mealFormed,mealCollected,...data}=current;
    return{...data,progress:Math.min(1,Math.max(0,(clockMs-current.onsetMs)/(current.deadlineMs-current.onsetMs))),stage:clockMs<current.deadlineMs?'flying':'gap'};
  }
  function spawn(){
    if(supplied&&slot>=supplied.length){end('sequence_complete');return;}
    const config=difficultyForCorrect(correctCount()),previous=current;
    const draw=kinds(),appearance=variants(),wrap=wrapping(),forced=supplied?.[slot];
    const profile=BUBBLE_PROFILES[config.picky?'picky':'intro'],chance=bubbleChance(profile,bubbleWait,bubbleStreak);
    let material=draw<chance?'bubble':'food';
    if(material==='food'&&config.picky&&(draw-chance)/(1-chance)<.10/(1-profile.target))material='forbidden';
    if(forced)material=forced==='rice'?'food':forced==='forbidden'?'forbidden':'bubble';
    if(material==='bubble'){bubbleWait=0;bubbleStreak=Math.min(2,bubbleStreak+1);}else{bubbleWait++;bubbleStreak=0;}
    if(material==='forbidden'&&!config.picky)throw Error('A forbidden QA item requires the picky rule');
    const wrapped=material==='bubble'&&(forced?forced==='wrapped':wrap<config.wrappedFraction);
    const kind=material==='bubble'?'bubble':'rice';
    const foodId=material==='forbidden'?forbiddenFoodId:wrapped?pickFood(FOOD_IDS):material==='food'?pickFood(config.picky?allowedFoods:FOOD_IDS):null;
    if(material==='bubble')material=wrapped?'wrapped':'emptyBubble';
    const gapMs=config.gapMinMs+Math.floor(gaps()*(config.gapMaxMs-config.gapMinMs+1));
    current={id:`${id}:${++slot}`,slot,level:config.level,kind,foodId,material,wrapped,shouldCatch:material==='food',variant:kind==='rice'?FOOD_IDS.indexOf(foodId):Math.floor(appearance*6),onsetMs:clockMs,deadlineMs:clockMs+config.flightMs,nextAtMs:clockMs+config.flightMs+gapMs,gapMs,responded:false,result:null,spawnU:positions(),mealReady:false,mealFormAtMs:null,mealCollectAtMs:null,presentationEndAtMs:null,deadlineProcessed:false,mealFormed:false,mealCollected:false};
    stats[material==='food'?'foodPresented':material==='forbidden'?'forbiddenPresented':material==='wrapped'?'wrappedPresented':'emptyBubblePresented']++;
    if(previous&&previous.level!==config.level)emit('level_changed',{level:config.level,correct:correctCount()});
    emit('item_spawn',{item:viewCurrent(),cadence:previous?{previousLevel:previous.level,previousMaterial:previous.material,requestedGapMs:previous.gapMs,onsetIntervalMs:clockMs-previous.onsetMs,pickyIntroIncluded:previous.level===1&&config.level===2}:null});
  }
  function nextSupply(){
    if(supplied&&slot>=supplied.length){end('sequence_complete');return;}
    if(difficultyForCorrect(correctCount()).picky&&!pickyActive){
      pickyActive=true;pickyIntro={startAtMs:clockMs,endAtMs:clockMs+PICKY_CUE_MS};
      emit('picky_intro',{foodId:forbiddenFoodId,...pickyIntro});return;
    }
    spawn();
  }
  function outcome(value){
    current.result=value;
    const counter={rice_caught:'riceCaught',rice_miss:'riceMissed',bubble_pass:'bubblesPassed',bubble_mistake:'bubbleMistakes',food_refused:'foodRefused',food_mistake:'foodMistakes'}[value];
    stats[counter]++;
    if(current.wrapped)stats[value==='bubble_pass'?'wrappedPassed':'wrappedMistakes']++;
    const lostLife=['bubble_mistake','food_mistake','rice_miss'].includes(value);
    if(lostLife){lives--;if(lives===0){settlementAtMs=current.nextAtMs;survivalEndMs=clockMs;}}
    emit('outcome',{outcome:value,kind:current.kind,material:current.material,foodId:current.foodId,wrapped:current.wrapped,nextAtMs:current.nextAtMs});
    if(value==='rice_caught'){
      bowlFill++;
      if(bowlFill===6){current.mealReady=true;current.mealFormAtMs=current.deadlineMs;current.mealCollectAtMs=current.mealFormAtMs+MEAL_PRESENTATION.storedMs;current.nextAtMs=Math.max(current.nextAtMs,current.mealFormAtMs+MEAL_PRESENTATION.durationMs);emit('meal_ready',{bowlFill});}
    }
    if(lostLife)emit('life_lost',{lives,outcome:value});
  }
  if(checkpoint){
    const s=structuredClone(checkpoint.state);
    if(!['idle','running','paused','finished'].includes(s.status)||!Number.isFinite(s.clockMs)||s.clockMs<0||!Number.isInteger(s.lives)||s.lives<0||s.lives>3||!Number.isInteger(s.slot)||s.slot<0||!s.stats||!Array.isArray(s.events)||!FOOD_IDS.includes(s.forbiddenFoodId)||typeof s.pickyActive!=='boolean'||!Number.isInteger(s.bubbleWait)||s.bubbleWait<0||!Number.isInteger(s.bubbleStreak)||s.bubbleStreak<0||s.bubbleStreak>2)throw Error('Invalid G10 checkpoint state');
    ({status,clockMs,current,slot,bowlFill,inputHeld,pauseReason,events,lives,settlementAtMs,finishReason,survivalEndMs,pickyActive,pickyIntro,forbiddenFoodId,bubbleWait,bubbleStreak}=s);
    for(const key of Object.keys(stats)){if(!Number.isFinite(s.stats[key])||s.stats[key]<0)throw Error('Invalid G10 checkpoint counter '+key);stats[key]=s.stats[key];}
    allowedFoods=FOOD_IDS.filter(id=>id!==forbiddenFoodId);random.forEach((r,i)=>r.restore(checkpoint.random[i]));
  }
  return{
    checkpoint(){return structuredClone({version:3,seed,sequence:supplied,random:random.map(r=>r.getState()),state:{status,clockMs,current,slot,bowlFill,inputHeld,pauseReason,events,lives,settlementAtMs,finishReason,survivalEndMs,pickyActive,pickyIntro,forbiddenFoodId,bubbleWait,bubbleStreak,stats}});},
    start(){if(status!=='idle')return result(false,'already_started');status='running';emit('start',{seed});spawn();return result(true,'started');},
    advance(deltaMs){
      if(!Number.isFinite(deltaMs)||deltaMs<0)throw RangeError('deltaMs must be finite and nonnegative');
      if(status!=='running')return result(false,status);
      const target=clockMs+deltaMs;if(!Number.isFinite(target))throw RangeError('active clock overflow');
      while(status==='running'){
        const boundary=Math.min(settlementAtMs??Infinity,pickyIntro?.endAtMs??Infinity,!current.deadlineProcessed?current.deadlineMs:Infinity,current.mealReady&&!current.mealFormed?current.mealFormAtMs:Infinity,current.mealReady&&!current.mealCollected?current.mealCollectAtMs:Infinity,lives>0&&!pickyIntro?current.nextAtMs:Infinity);
        if(boundary>target)break;clockMs=boundary;stats.activeMs=clockMs;
        if(settlementAtMs!==null&&boundary===settlementAtMs)end('lives_exhausted');
        else if(pickyIntro&&boundary===pickyIntro.endAtMs){pickyIntro=null;spawn();}
        else if(!current.deadlineProcessed&&boundary===current.deadlineMs){current.deadlineProcessed=true;if(current.result===null)outcome(current.shouldCatch?'rice_miss':current.kind==='bubble'?'bubble_pass':'food_refused');}
        else if(current.mealReady&&!current.mealFormed&&boundary===current.mealFormAtMs){current.mealFormed=true;emit('meal_form_start',{bowlFill});}
        else if(current.mealReady&&!current.mealCollected&&boundary===current.mealCollectAtMs){current.mealCollected=true;stats.meals++;bowlFill=0;emit('meal_collected',{meals:stats.meals,bowlFill});}
        else nextSupply();
      }
      if(status==='running'){clockMs=target;stats.activeMs=clockMs;}
      return result(true,status==='finished'?'finished':'advanced');
    },
    press(){
      if(inputHeld)return result(false,'held');inputHeld=true;
      if(status!=='running')return result(false,status);
      if(pickyIntro||clockMs>=current.deadlineMs||current.result!==null)return result(false,'no_answerable_item');
      current.responded=true;emit('response',{kind:current.kind,latencyMs:clockMs-current.onsetMs});
      outcome(current.shouldCatch?'rice_caught':current.kind==='bubble'?'bubble_mistake':'food_mistake');return result(true,'responded',{outcome:current.result,id:current.id});
    },
    release(){const held=inputHeld;inputHeld=false;return result(held,held?'released':'not_held');},
    scheduleMeal(formAtMs){
      if(status!=='running'||!current.mealReady||current.mealFormed)return result(false,'no_pending_meal');
      if(!Number.isFinite(formAtMs)||formAtMs<Math.max(clockMs,current.deadlineMs,current.presentationEndAtMs??0))throw RangeError('Meal must follow the decision window and its presentation');
      current.mealFormAtMs=formAtMs;current.mealCollectAtMs=formAtMs+MEAL_PRESENTATION.storedMs;current.nextAtMs=Math.max(current.deadlineMs+current.gapMs,formAtMs+MEAL_PRESENTATION.durationMs);return result(true,'meal_scheduled');
    },
    schedulePresentation(endAtMs){
      if(status!=='running'||current.result===null)return result(false,'no_pending_presentation');
      if(!Number.isFinite(endAtMs)||endAtMs<clockMs)throw RangeError('Presentation must end after the current active time');
      current.presentationEndAtMs=endAtMs;current.nextAtMs=Math.max(current.deadlineMs+current.gapMs,endAtMs,current.mealReady?current.mealFormAtMs+MEAL_PRESENTATION.durationMs:0);if(lives===0)settlementAtMs=Math.max(current.deadlineMs,endAtMs);return result(true,'presentation_scheduled');
    },
    scheduleSettlement(atMs){
      if(status!=='running'||lives!==0)return result(false,'no_pending_settlement');
      if(!Number.isFinite(atMs)||atMs<Math.max(clockMs,current.deadlineMs))throw RangeError('Settlement must follow the final decision window');settlementAtMs=atMs;return result(true,'settlement_scheduled');
    },
    pause(reason='manual'){if(typeof reason!=='string'||!reason.length)throw TypeError('pause reason must be a nonempty string');if(status!=='running')return result(false,status);if(current.result===null)stats.interruptions++;status='paused';pauseReason=reason;emit('pause',{reason});return result(true,'paused');},
    resume(){if(status!=='paused')return result(false,status);status='running';pauseReason=null;emit('resume');return result(true,'resumed');},
    finish(){if(status==='finished')return result(false,'finished');end(lives===0?'lives_exhausted':'manual');return result(true,'finished');},
    snapshot(){const correct=correctCount();return{status,id,mode:'endless',rulesVersion:46,clockMs,survivedMs:survivalEndMs??clockMs,current:viewCurrent(),bowlFill,inputHeld,pauseReason,lives,maxLives:3,settlementAtMs,finishReason,pickyActive,forbiddenFoodId,pickyIntro:structuredClone(pickyIntro),progression:{correctTotal:correct,correctInLevel:correct-((current?.level??1)-1)*ENDLESS.trialsPerStep,nextLevel:difficultyForCorrect(correct).level},stats:{...stats}};},
    drainEvents(){const out=events;events=[];return out;}
  };
}
