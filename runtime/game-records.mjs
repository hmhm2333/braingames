import {SHARED_COPY} from './game-catalog.mjs';

function parseScore(value) {
  const score = Number(value);
  return value.trim() !== '' && Number.isSafeInteger(score) && score >= 0 ? score : null;
}

function parsePosition(value) {
  let position;
  try {
    position = JSON.parse(value);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
  const {x, y} = position ?? {};
  return Number.isFinite(x) && x >= 0 && x <= 1 && Number.isFinite(y) && y >= 0 && y <= 1 ? {x, y} : null;
}

export function createRecordStore(onChange = () => {}, getStorage = () => localStorage) {
  const damaged = new Map();
  let unavailable = false;

  function access(operation) {
    try {
      return operation(getStorage());
    } catch (error) {
      if (!(error instanceof DOMException) || !['SecurityError', 'QuotaExceededError'].includes(error.name)) throw error;
      unavailable = true;
      onChange();
      return null;
    }
  }

  function read(key, parse) {
    const raw = access(storage => storage.getItem(key));
    if (raw === null) return null;
    const value = parse(raw);
    if (value === null) {
      damaged.set(key, raw);
      onChange();
    }
    return value;
  }

  function write(key, value) {
    const written = access(storage => {
      storage.setItem(key, value);
      return true;
    });
    if (written && damaged.delete(key)) onChange();
  }

  function clearDamaged() {
    access(storage => {
      for (const [key, original] of damaged) {
        if (storage.getItem(key) === original) storage.removeItem(key);
        damaged.delete(key);
      }
    });
    onChange();
  }

  return {
    status: () => ({damaged: damaged.size > 0, unavailable}),
    readScore: key => read(key, parseScore) ?? 0,
    readPosition: key => read(key, parsePosition),
    saveScore(key, score) {
      const highest = Math.max(score, read(key, parseScore) ?? 0);
      write(key, String(highest));
      return highest;
    },
    savePosition: (key, position) => write(key, JSON.stringify(position)),
    clearDamaged
  };
}

export function mountGameRecords(root, ...panelSelectors) {
  const notices = [];
  const store = createRecordStore(update);
  function update() {
    const {damaged, unavailable} = store.status();
    const message = unavailable ? SHARED_COPY.storageUnavailable : damaged ? SHARED_COPY.badRecord : '';
    for (const {notice, text, clear} of notices) {
      if (text.textContent !== message) text.textContent = message;
      clear.hidden = !damaged || unavailable;
      notice.hidden = message === '';
    }
  }
  for (const selector of panelSelectors) {
    const notice = document.createElement('div');
    const text = document.createElement('span');
    const clear = document.createElement('button');
    notice.dataset.gameRecordNotice = '';
    notice.hidden = true;
    text.setAttribute('role', 'status');
    clear.type = 'button';
    clear.textContent = SHARED_COPY.clearRecord;
    clear.addEventListener('click', () => {
      const panel = notice.parentElement;
      store.clearDamaged();
      if (clear.hidden) panel.querySelector('button:not([hidden]):not(:disabled)')?.focus({preventScroll: true});
    });
    notice.append(text, clear);
    root.querySelector(selector).append(notice);
    notices.push({notice, text, clear});
  }
  update();
  return store;
}
