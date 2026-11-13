import {createRandom} from '../../runtime/random-state.mjs';

export const CLOUD_W = 70;
export const CLOUD_H = 43;
const SLOT_W = CLOUD_W + 8;
const SLOT_H = CLOUD_H + 10;
export const PIN_W = 72;
export const PIN_H = 23;

export function balloonScale(width, height) {
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

export function placeCoordinatePins(width, height, position, star, scale, cloudSlots) {
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

export function placeClouds(width, height, {position, target, serial, clouds}, previous = new Map()) {
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
