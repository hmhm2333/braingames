import {createRandom} from '../../runtime/random-state.mjs';
import {difficultyAt, ROUND_MS} from './difficulty.mjs';

export const MIN_VIEW = {width: 320, height: 400};
export const FLIGHT_BOUNDS = {left: 14, right: 86, bottom: 14, top: 74};
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

export const same = (a, b) => a.x === b.x && a.y === b.y;
export const plus = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
export const signedWind = (wind, direction) => ({x: wind.x * direction, y: wind.y * direction});
const difference = (target, point) => ({x: target.x - point.x, y: target.y - point.y});
const fitsStep = ({x, y}, unit) => x % unit === 0 && y % unit === 0;

export function inside({x, y}, bounds = FLIGHT_BOUNDS) {
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

export class ScreenFlight {
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
