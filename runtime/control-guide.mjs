// Shared input instructions for the welcome panels, inside each game's shadow.
export function mountControlGuide(root, {title, control: {device, key, action}}) {
  for (const heading of root.querySelectorAll('[data-braingames-title]')) heading.textContent = title;
  const guide = root.querySelector('[data-braingames-controls]');
  const labels = [['span', device], ['kbd', key], ['span', action]];
  guide.replaceChildren(...labels.map(([tag, text]) => {
    const label = document.createElement(tag);
    label.dataset.pixelText = '';
    label.textContent = text;
    return label;
  }));

  const style = document.createElement('style');
  style.textContent = `
    #game-title, #game-result-title {
      margin: 0 0 12px; font: inherit; text-align: center; color: var(--ink);
    }
    [data-braingames-controls] {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin: 0 0 12px; line-height: 24px; white-space: nowrap;
    }
    [data-braingames-controls] kbd {
      box-sizing: border-box; width: auto; height: auto; padding: 0 6px;
      font: inherit; color: #263248; background: #fff8e4;
      border: 2px solid #9f8355; border-radius: 0; box-shadow: 0 2px 0 #9f8355;
    }

    [data-game-record-notice]:not([hidden]) {
      display: grid; justify-items: center; gap: 4px; margin-top: 8px;
      font: 400 12px/17px system-ui, sans-serif; text-align: center;
    }
    [data-game-record-notice] button:not([hidden]) {
      max-width: 100%; min-height: 24px; padding: 2px 6px; color: inherit; font: inherit;
      background: transparent; border: 1px solid currentColor; cursor: pointer;
    }
    [data-game-record-notice] button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  `;
  root.prepend(style);
}
