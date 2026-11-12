import {VERDICT_CROSS} from '../../runtime/presentation.mjs';
import {ROUND_MS} from './difficulty.mjs';

const ART_URL = new URL('./assets/motion.json', import.meta.url);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

export async function loadMotion({manifest, loadAtlas} = {}) {
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

export function flightDuration(motion, hit) {
  return ((hit ? motion.end : motion.landingFrame + 3) - 1) * 1000 / motion.fps;
}

export function motionSample(motion, flight) {
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

export function hoveringCloud(point, id, clock, batchAge, animate) {
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
export const MISS_MS = 650;

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

export function drawRuleArt(add, subtract, art) {
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

export function makeScene(canvas, art) {
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
