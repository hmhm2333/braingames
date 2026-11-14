import {ACTOR_SCALE, FISH_SCALE, POSE_MS, STARTING_LIVES, clamp, lerp} from './core.mjs';
import {NET_CD_MS} from './difficulty.mjs';

const FISH_CENTER_OFFSET = 4;
export const HIT_HALF_WIDTH = 48;
export const HIT_HALF_HEIGHT = 32;
const FULL_CIRCLE = Math.PI * 2;
const NET_PIXELS = [
  '...#####...', '..#..#..#..', '.#.#.#.#.#.', '.#..#.#..#.', '..#######..',
  '.....#.....', '....#......', '...#.......', '..#........', '..#........',
];

export async function loadMotion({manifest, loadAtlas} = {}) {
  if (manifest) return {...manifest, image: await loadAtlas(manifest.image)};
  const image = new Image();
  image.src = new URL('./assets/motion.png', import.meta.url).href;
  const [index] = await Promise.all([
    fetch(new URL('./assets/motion.json', import.meta.url)).then(response => {
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

export function drawRuleArt(scoop, evolution, art) {
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

export function hitsFish(fish, x, y) {
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

export class Scene {
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
