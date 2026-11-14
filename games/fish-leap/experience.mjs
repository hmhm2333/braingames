import {createMoveHandle} from '../../runtime/move-handle.mjs';
import {RECOVERY_MS} from '../../runtime/presentation.mjs';
import {GAME_COPY, SHARED_COPY} from '../../runtime/game-catalog.mjs';
import {applyCopy} from '../../runtime/apply-copy.mjs';
import {mountControlGuide} from '../../runtime/control-guide.mjs';
import {mountGameRecords} from '../../runtime/game-records.mjs';
import {createPixelText} from '../../runtime/pixel-text.mjs';
import {FISH_HIT_GRACE_MS, FishSchool, MIN_VIEW, clampActor} from './core.mjs';
import {HIT_HALF_HEIGHT, HIT_HALF_WIDTH, Scene, drawRuleArt, hitsFish, loadMotion} from './scene.mjs';

const copy = GAME_COPY['fish-leap'];
const positionKey = 'braingames.fish-leap.position.v1';
const MAX_FRAME_GAP_MS = 250;
const hide = (element, value) => { if (element.hidden !== value) element.hidden = value; };
const FEEDBACK_MS = 900;
const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };
function place(element, area) {
  for (const [property, value] of Object.entries(area)) {
    const pixels = Math.round(value) + 'px';
    if (element.style[property] !== pixels) element.style[property] = pixels;
  }
}

function setFishAccess(button, live, enabled) {
  if (live && button.hasAttribute('aria-hidden')) button.removeAttribute('aria-hidden');
  else if (!live && !button.hasAttribute('aria-hidden')) button.setAttribute('aria-hidden', 'true');
  if (button.getAttribute('aria-disabled') !== String(!enabled)) {
    button.setAttribute('aria-disabled', String(!enabled));
    button.tabIndex = enabled ? 0 : -1;
  }
}

async function source(file) {
  const response = await fetch(new URL(file, import.meta.url));
  if (!response.ok) throw Error('捞鱼文件加载失败 ' + file);
  return response.text();
}

export function mountGame(host, options) {
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  const root = document.createElement('main');
  root.className = 'stage';
  shadow.append(style, root);
  const $ = id => root.querySelector('#' + id);
  const font = new FontFace('Whale Fish Pixel', options.ui ? options.ui.fontBytes :
    'url("' + new URL('./ui/song-subset.ttf', import.meta.url).href + '")');
  const buttons = new Map();
  const errors = [];
  const initialTier = options.practiceTier ?? 0;
  const bestKey = 'braingames.fish-leap.bestSeconds.v1' + (initialTier ? '.tier-' + (initialTier + 1) : '');
  let art, scene, netOffsets, pixelText, observer, school, hold, drag, position, records;
  let saved = options.checkpoint;
  let width = 0, height = 0, small = false, ready = false, disposed = false, pending = false;
  let presented = false, frozen = false, recovery = 0, raf = null, last = null;
  let canReplay = true, canRandom = Boolean(options.canRandom), best = 0, moveFrame = null;
  let spot = null, blockedUntil = 0, reportedLives = 3, netWasReady = true, readyUntil = 0;

  function playing() { return school && school.phase !== 'ended'; }
  function canAct() {
    return ready && presented && !frozen && !small && !recovery && !errors.length && school?.phase === 'playing';
  }
  function available() {
    return canAct() && !hold.isPressed() && !school.capture && school.netRemaining === 0;
  }
  function canMove() {
    return canAct() && !school.capture;
  }

  function view() {
    if (errors.length) return 'error';
    if (!ready) return 'loading';
    if (!school && !saved) return 'welcome';
    if (school?.phase === 'ended') return 'finished';
    return presented ? 'playing' : 'paused';
  }

  function updateInputs() {
    if (!ready) return;
    $('start').disabled = $('replay').disabled = !presented || small || !canReplay || pending;
    hide($('random'), !canRandom);
    $('random').disabled = !presented || small || pending;
  }

  function updateWhale() {
    const whale = $('move-whale');
    const resume = Boolean(playing() && frozen && !small && !errors.length);
    const show = resume || Boolean(playing() && presented && !small && !school.capture && !errors.length);
    hide(whale, !show);
    if (whale.hasAttribute('data-game-resume') !== resume) {
      whale.toggleAttribute('data-game-resume', resume);
      whale.setAttribute('aria-label', resume ? '点鲸鱼娘继续' : '长按鲸鱼娘移动');
      whale.tabIndex = resume ? 0 : -1;
    }
    whale.toggleAttribute('data-movable', canMove());
    if (show) place(whale, scene.actorHit(school));
  }

  function placeFishButton(controls, key, item, live, enabled) {
    let entry = buttons.get(key);
    if (!entry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fish';
      if (live) {
        button.dataset.fish = item.id;
        button.setAttribute('aria-label', '捞这条金鱼');
      } else button.dataset.fishEffect = item.id;
      controls.append(button);
      entry = {button};
      buttons.set(key, entry);
    }
    const {button} = entry;
    const halfWidth = item.halfWidth ?? HIT_HALF_WIDTH;
    const halfHeight = item.halfHeight ?? HIT_HALF_HEIGHT;
    const transform = 'translate(' + Math.round(item.x - halfWidth) + 'px,' +
      Math.round(item.y - halfHeight) + 'px) rotate(' + item.angle.toFixed(3) + 'rad)';
    if (entry.halfWidth !== halfWidth || entry.halfHeight !== halfHeight) {
      place(button, {width: halfWidth * 2, height: halfHeight * 2});
      Object.assign(entry, {halfWidth, halfHeight});
    }
    if (entry.transform !== transform) { button.style.transform = transform; entry.transform = transform; }
    setFishAccess(button, live, enabled);
    entry.drawn = true;
    entry.missingSince = null;
  }

  function syncFish(fading = []) {
    const controls = $('fish-controls');
    const active = playing() && presented && !frozen && !small && !errors.length;
    const guard = $('cast-guard');
    const casting = active && Boolean(school.capture);
    if (controls.inert === active) controls.inert = !active;
    hide(guard, !casting);
    if (!playing() || errors.length) {
      for (const {button} of buttons.values()) button.remove();
      buttons.clear();
    }
    if (!active) return;
    if (casting) {
      place(guard, scene.actorHit(school));
    }
    const enabled = available();
    for (const entry of buttons.values()) entry.drawn = false;
    for (const fish of school.fish) placeFishButton(controls, fish.id, fish, true, enabled && !fish.locked);
    for (const fish of fading) placeFishButton(controls, 'effect-' + fish.id, fish, false, false);
    for (const [key, entry] of buttons) {
      if (entry.drawn) continue;
      // Keep the last drawn position briefly as a mouse target without a catch action.
      entry.missingSince ??= school.time;
      if (school.time - entry.missingSince >= FISH_HIT_GRACE_MS) {
        entry.button.remove();
        buttons.delete(key);
      } else setFishAccess(entry.button, false, false);
    }
  }

  function drawRound() {
    updateWhale();
    syncFish(scene.draw(school, Boolean(drag)));
    const {lives, time, effects, capture, netRemaining} = school;
    const netReady = !capture && netRemaining === 0;
    const net = capture ? copy.netCasting : netReady ? copy.netReady : copy.netCooling;
    if (netReady && !netWasReady) readyUntil = time + FEEDBACK_MS;
    netWasReady = netReady;
    if (lives < reportedLives) {
      const missed = effects.findLast(effect => effect.kind === 'evolution');
      spot = missed ? {x: missed.x, y: missed.y, until: time + FEEDBACK_MS} : null;
    }
    reportedLives = lives;
    const tip = $('fish-tip');
    const atLoss = spot && time < spot.until;
    const show = presented && !frozen && !drag && (atLoss || time < blockedUntil || netReady && time < readyUntil);
    hide(tip, !show);
    if (show) {
      const point = atLoss ? spot : school.actor;
      setText(tip, atLoss ? copy.netLoss : net);
      const x = Math.max(68, Math.min(width - 68, point.x));
      place(tip, {left: x, top: Math.max(30, point.y - (atLoss ? 32 : 80))});
    }
    setText($('round-status'), '剩余 ' + lives + ' 盏灯。' + (atLoss ? copy.netLoss + '。' : '') + net + '。' + (copy.feedback[school.reaction] ?? ''));
  }

  function redraw() {
    if (!ready || small) return;
    const current = view();
    const showRound = Boolean(school && (current === 'playing' || current === 'paused'));
    hide($('lobby'), showRound || current === 'paused');
    hide($('welcome'), current !== 'welcome');
    hide($('result'), current !== 'finished');
    hide($('error'), current !== 'error');
    hide($('companion'), current === 'error');
    hide($('canvas'), !showRound);
    hide($('fish-controls'), !showRound);
    updateInputs();
    if (showRound) drawRound();
    else {
      hide($('fish-tip'), true);
      updateWhale();
      syncFish();
      setText($('round-status'), '');
      if (current !== 'error') scene.drawLobby($('companion'), current === 'finished');
      if (current === 'finished') {
        const seconds = Math.floor(school.frozenAt / 1000);
        if (seconds > best) {
          best = records.saveScore(bestKey, seconds);
        }
        setText($('score'), String(seconds));
        setText($('best-value'), String(best));
      }
    }
  }

  function clickedFish(event, button) {
    if (event.detail === 0) return Number(button.dataset.fish);
    const bounds = root.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    let closest = Infinity;
    let id;
    for (const fish of school.fish) {
      if (fish.locked || !hitsFish(fish, x, y)) continue;
      const distance = (fish.x - x) ** 2 + (fish.y - y) ** 2;
      if (distance < closest) {
        closest = distance;
        id = fish.id;
      }
    }
    return id;
  }

  function schedule() {
    if (raf === null && presented && !frozen && !small && !disposed && !errors.length && playing() && !hold.isPressed()) {
      raf = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = last = null;
  }

  function beginMove() {
    drag = {origin: {...school.actor}, point: null};
    const preview = $('move-preview');
    place(preview, scene.drawMovePreview(preview, school));
    hide(preview, false);
    drawRound();
  }

  function moveWhale(dx, dy) {
    const {x, y} = drag.origin;
    drag.point = clampActor(x + dx, y + dy, width, height);
    if (moveFrame !== null) return;
    moveFrame = requestAnimationFrame(() => {
      moveFrame = null;
      const {point, origin} = drag;
      const transform = `translate3d(${point.x - origin.x}px, ${point.y - origin.y}px, 0)`;
      $('move-preview').style.transform = $('move-whale').style.transform = transform;
    });
  }

  function finishMove(commit, dx, dy) {
    if (moveFrame !== null) cancelAnimationFrame(moveFrame);
    moveFrame = null;
    hide($('move-preview'), true);
    $('move-preview').style.transform = $('move-whale').style.transform = '';
    const origin = drag?.origin;
    drag = null;
    if (commit) {
      const point = clampActor(origin.x + dx, origin.y + dy, width, height);
      if (point.x !== origin.x || point.y !== origin.y) {
        Object.assign(school.actor, point);
        position = {x: point.x / width, y: point.y / height};
        records.savePosition(positionKey, position);
      }
      recovery = performance.now() + RECOVERY_MS;
    }
    if (presented && !small && !disposed && !errors.length) drawRound();
    schedule();
  }

  function tick(now) {
    raf = null;
    try {
      if (now < recovery) { schedule(); return; }
      recovery = 0;
      if (last !== null) {
        if (now - last > MAX_FRAME_GAP_MS) {
          recovery = now + RECOVERY_MS;
          last = null;
        } else {
          school.advance(now - last);
        }
      }
      if (!recovery) last = now;
      if (playing()) drawRound();
      else {
        redraw();
        pixelText.flush();
        if (!$('replay').disabled) $('replay').focus({preventScroll: true});
        options.onViewChange();
      }
      schedule();
    } catch (error) { fail(error); }
  }

  function fit() {
    const nextWidth = root.clientWidth;
    const nextHeight = root.clientHeight;
    small = nextWidth < MIN_VIEW.width || nextHeight < MIN_VIEW.height;
    root.toggleAttribute('data-small', small);
    root.toggleAttribute('data-compact', nextWidth < 500);
    root.toggleAttribute('data-short', nextHeight < 450);
    if (small || width !== nextWidth || height !== nextHeight) hold.cancel({untilRelease: presented});
    if (small) {
      stop();
      syncFish();
      updateWhale();
    } else {
      if (width !== nextWidth || height !== nextHeight) {
        width = nextWidth;
        height = nextHeight;
        scene.resize(width, height);
        if (saved) {
          school = new FishSchool(width, height, {netOffsets, saved});
          saved = null;
        } else school?.resize(width, height);
      } else if (scene.scale !== Math.min(1.5, devicePixelRatio)) scene.resize(width, height);
      redraw();
      schedule();
    }
    options.onViewChange();
  }

  function fail(error) {
    errors.push(error.message);
    hold?.cancel({untilRelease: true});
    stop();
    if (ready) {
      setText($('error-detail'), SHARED_COPY.loadedError);
      redraw();
    }
    options.onViewChange();
    console.error(error);
  }

  function suspend() {
    presented = false;
    recovery = 0;
    hold?.cancel({untilRelease: true});
    stop();
    pixelText?.suspend();
    redraw();
  }

  async function start() {
    if (pending || !ready || small || !canReplay || !['welcome', 'finished'].includes(view())) return;
    pending = true;
    updateInputs();
    try {
      if (!await options.beforePlay() || !presented || disposed || small) return;
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      school = new FishSchool(width, height, {tier: initialTier, seed, netOffsets});
      spot = null;
      blockedUntil = readyUntil = 0;
      reportedLives = school.lives;
      netWasReady = true;
      if (position) Object.assign(school.actor, clampActor(position.x * width, position.y * height, width, height));
      redraw();
      schedule();
      options.onViewChange();
    } catch (error) { fail(error); }
    finally { pending = false; updateInputs(); }
  }

  async function present({resume = true, start: directStart = false} = {}) {
    if (playing() && resume && !presented) recovery = performance.now() + RECOVERY_MS;
    presented = true;
    pixelText.present();
    if (directStart && view() === 'welcome') await start();
    redraw();
    pixelText.flush();
    schedule();
  }

  const initialization = (async () => {
    const [css, html, motion] = await Promise.all([options.ui?.style ?? source('./style.css'),
      options.ui?.markup ?? source('./markup.html'), loadMotion(options), font.load()]);
    if (disposed) { motion.image.close?.(); return false; }
    art = motion;
    document.fonts.add(font);
    style.textContent = css;
    root.innerHTML = html;
    applyCopy(root, {'#rule-a': copy.rules[0], '#rule-b': copy.rules[1], '#fish-instruction': copy.ruleNote,
      '#start': copy.start, '#result-lead': copy.resultLead, '#unit': copy.resultUnit,
      '#best-label': copy.bestLabel, '#best-unit': copy.resultUnit, '#replay': copy.replay, '#random': SHARED_COPY.next,
      '#load-error': copy.loadError, '#reload': SHARED_COPY.reload});
    mountControlGuide(root, copy);
    records = mountGameRecords(root, '#welcome', '#result');
    if (initialTier) {
      setText($('practice'), '第 ' + (initialTier + 1) + ' 档试玩');
      hide($('practice'), false);
    }
    drawRuleArt($('rule-scoop'), $('rule-evolve'), art);
    scene = new Scene($('canvas'), art);
    netOffsets = scene.netOffsets;
    best = records.readScore(bestKey);
    position = records.readPosition(positionKey);
    hold = createMoveHandle($('move-whale'), {
      canMove,
      onGrab() { stop(); drawRound(); },
      onActivate: beginMove,
      onMove: moveWhale,
      onDrop: finishMove,
      onCancel: () => finishMove(false),
      onTap() {},
      onError: fail,
    });
    $('fish-controls').addEventListener('pointerdown', event => {
      if (event.target.closest('#cast-guard, .fish[aria-disabled="true"]')) event.preventDefault();
    });
    $('fish-controls').addEventListener('click', event => {
      const button = event.target.closest('.fish[data-fish]');
      if (!button || !canAct() || hold.isPressed()) return;
      const id = clickedFish(event, button);
      if (id === undefined) return;
      if (available()) {
        if (school.scoop(id)) drawRound();
      } else if (school.time >= blockedUntil) {
        blockedUntil = school.time + FEEDBACK_MS;
        drawRound();
      }
    });
    $('move-whale').addEventListener('click', () => {
      if (frozen) Promise.resolve(options.onResume()).catch(fail);
    });
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
    return true;
  })().catch(error => { fail(error); return false; });

  return {
    ready: initialization, present, suspend, preview: suspend,
    getRoot: () => root,
    getRunState: () => ({view: view(), hasRound: Boolean(school || saved)}),
    snapshot: () => ({view: view(), ready, presented, viewportBlocked: small, rafPending: raf !== null,
      recovering: Boolean(recovery), relocating: Boolean(drag), best, errors: [...errors], session: school?.checkpoint().state ?? null,
      viewport: {width, height}}),
    checkpoint: () => !ready || errors.length ? null : saved ?? school?.checkpoint() ?? null,
    setFrozen(value) { frozen = value; if (ready) updateWhale(); },
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
      art?.image.close?.();
      shadow.replaceChildren();
    },
  };
}
