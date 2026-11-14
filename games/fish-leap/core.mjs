import {createRandom} from '../../runtime/random-state.mjs';
import {COMPACT_VIEWPORT} from '../../runtime/game-catalog.mjs';
import {NET_CD_MS, EVOLUTION_MS, TIER_MIN_MS, OPENING_FISH, TIERS} from './difficulty.mjs';

export const STARTING_LIVES = 3;
export const ACTOR_SCALE = 1.42;
export const FISH_SCALE = 1.28;
export const FISH_HIT_GRACE_MS = 200;
export const POSE_MS = 1000 / 16;
export const EVOLUTION_ANIMATION_MS = 28 * POSE_MS;
export const DEPARTURE_ANIMATION_MS = 320;
export const CONTACT_FRAME = 4;
export const SCOOP_FRAMES = 12;
export const REACTION_FRAMES = 12;
export const MIN_VIEW = COMPACT_VIEWPORT;

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

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (start, end, amount) => start + (end - start) * amount;
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

export function actorStart(width, height) {
  return {x: Math.max(width / 2, width - 82), y: Math.max(height / 2, height - ACTOR_FOOT_ROOM),
    direction: 'left'};
}

export function clampActor(x, y, width, height) {
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

export class FishSchool {
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
