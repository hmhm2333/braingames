import {createMoveHandle} from '../../runtime/move-handle.mjs';
import {RECOVERY_MS} from '../../runtime/presentation.mjs';
import {GAME_COPY, SHARED_COPY} from '../../runtime/game-catalog.mjs';
import {applyCopy} from '../../runtime/apply-copy.mjs';
import {mountControlGuide} from '../../runtime/control-guide.mjs';
import {createPixelText} from '../../runtime/pixel-text.mjs';
import {ScreenFlight, MIN_VIEW, same, signedWind} from './core.mjs';
import {placeClouds, placeCoordinatePins, balloonScale, CLOUD_W, CLOUD_H, PIN_W, PIN_H} from './layout.mjs';
import {ROUND_MS} from './difficulty.mjs';
import {drawRuleArt, flightDuration, hoveringCloud, loadMotion, makeScene, motionSample, MISS_MS} from './scene.mjs';

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
  const response = await fetch(new URL(file, import.meta.url));
  if (!response.ok) throw Error('摘星文件加载失败 ' + file);
  return response.text();
}

export function mountGame(host, options) {
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
    'url("' + new URL('./ui/song-subset.ttf', import.meta.url).href + '")');
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
