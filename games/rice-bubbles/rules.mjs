// v45 keeps the v44 progression; every response window ends at floor contact.
export const FOOD_TYPES=Object.freeze([
  Object.freeze({id:'baozi',label:'包子'}),Object.freeze({id:'jiaozi',label:'饺子'}),
  Object.freeze({id:'corn',label:'玉米'}),Object.freeze({id:'zongzi',label:'粽子'}),
  Object.freeze({id:'tanghulu',label:'糖葫芦'}),Object.freeze({id:'sweetpotato',label:'红薯'}),
  Object.freeze({id:'youtiao',label:'油条'}),Object.freeze({id:'mooncake',label:'月饼'})
]);
export const FOOD_IDS=Object.freeze(FOOD_TYPES.map(food=>food.id));
export const PICKY_CUE_MS=600;
export const ENDLESS=Object.freeze({trialsPerStep:24,firstWindowMs:900,lastWindowMs:450,noGoProbability:.25});
export const DIFFICULTY=Object.freeze([
{"level":1,"flightMs":900,"gapMinMs":800,"gapMaxMs":1000,"wrappedFraction":0,"picky":false},
{"level":2,"flightMs":900,"gapMinMs":800,"gapMaxMs":1000,"wrappedFraction":0,"picky":true},
{"level":3,"flightMs":900,"gapMinMs":800,"gapMaxMs":1000,"wrappedFraction":0.15,"picky":true},
{"level":4,"flightMs":900,"gapMinMs":700,"gapMaxMs":1100,"wrappedFraction":0.15,"picky":true},
{"level":5,"flightMs":750,"gapMinMs":700,"gapMaxMs":1100,"wrappedFraction":0.15,"picky":true},
{"level":6,"flightMs":750,"gapMinMs":700,"gapMaxMs":1100,"wrappedFraction":0.3,"picky":true},
{"level":7,"flightMs":750,"gapMinMs":600,"gapMaxMs":1200,"wrappedFraction":0.3,"picky":true},
{"level":8,"flightMs":600,"gapMinMs":600,"gapMaxMs":1200,"wrappedFraction":0.3,"picky":true},
{"level":9,"flightMs":600,"gapMinMs":600,"gapMaxMs":1200,"wrappedFraction":0.45,"picky":true},
{"level":10,"flightMs":600,"gapMinMs":500,"gapMaxMs":1300,"wrappedFraction":0.45,"picky":true},
{"level":11,"flightMs":600,"gapMinMs":500,"gapMaxMs":1300,"wrappedFraction":0.6,"picky":true},
{"level":12,"flightMs":450,"gapMinMs":500,"gapMaxMs":1300,"wrappedFraction":0.6,"picky":true},
{"level":13,"flightMs":450,"gapMinMs":400,"gapMaxMs":1400,"wrappedFraction":0.6,"picky":true},
{"level":14,"flightMs":450,"gapMinMs":400,"gapMaxMs":1400,"wrappedFraction":0.75,"picky":true}
].map(Object.freeze));
export function difficultyForCorrect(correct){return DIFFICULTY[Math.min(DIFFICULTY.length-1,Math.floor(correct/ENDLESS.trialsPerStep))];}
