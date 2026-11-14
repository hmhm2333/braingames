import React from 'react';
import {createPixelText} from './runtime/pixel-text.mjs';
import {gameIconUrl} from './runtime/game-icons.mjs';
import {SHARED_COPY} from './runtime/game-catalog.mjs';

const h = React.createElement;

export function GameIcon({icon = 'brain'} = {}) {
  return h('img', {width: 20, height: 20, src: gameIconUrl(icon), alt: '', 'aria-hidden': true,
    style: {imageRendering: 'pixelated', flexShrink: 0}});
}

export function PixelPopup({children, ...attributes}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    // The invitation subset's thinnest horizontal stroke rasterizes at alpha 24.
    const text = createPixelText(ref.current, {alphaThreshold: 24});
    text.flush();
    void document.fonts.ready.then(() => text.flush());
    return text.dispose;
  }, []);
  return h('aside', {...attributes, ref, className: 'braingames-popup'}, children);
}

const groups = [
  {
    title: '邀请',
    settings: [
      ['autoInvite', '游戏邀请', '自动弹出邀请', '只从任务标题栏打开'],
      ['inviteRequireRunning', '自动邀请的时机', '有任务运行才邀请', '空闲时也可邀请'],
      ['inviteRequireNoUnread', '有未读完成提醒时', '看完提醒再邀请', '仍可弹出邀请']
    ]
  },
  {
    title: '开局与继续',
    settings: [
      ['modelRecommendation', '首次打开时怎么选游戏', '按最近对话标题推荐', '从勾选的游戏中随机',
        '默认在本地随机选游戏。主动开启模型推荐后，仅在打开游戏时向 DSH 默认模型服务发送最近至多 10 个主对话标题（每条最多 64 个 UTF-16 代码单元），可能产生费用。最多等待 5 秒，超时或无标题时改为本地随机。'],
      ['keepVisibleOnPause', '切回任务时', '保留画面，点鲸鱼娘继续', '收起画面，从标题栏继续'],
      ['keepOnRefresh', '刷新页面后', '保留本局', '下次打开从头开始', '当前对局仅在本次 DSH 运行期间保留。']
    ]
  }
];
export const SETTINGS_FIELDS = groups.flatMap(group => group.settings.map(([field]) => field));

export function GameSettings({catalog, state, saving, error, onChange}) {
  const {value, writable} = state;
  if (state.status !== 'ready') {
    return h('p', {role: 'status'}, state.status === 'loading' ? '设置加载中…' : 'dsh-braingames 设置不可用。');
  }
  return h('section', {'data-braingames-settings': true},
    h('fieldset', {className: 'braingames-settings-form', disabled: !writable || saving},
      h('legend', null, '游戏设置'),
      h('p', {className: 'braingames-setting-note'}, SHARED_COPY.openingGuide),
      h('h4', null, '游戏池'),
      h('div', {className: 'braingames-game-pool'}, ...catalog.map(game =>
        h('label', {key: game.id},
          h('input', {
            type: 'checkbox', 'data-braingames-game': game.id, checked: value.enabledGames.includes(game.id),
            onChange: event => {
              const ids = event.target.checked ? [...value.enabledGames, game.id] : value.enabledGames.filter(id => id !== game.id);
              void onChange('enabledGames', ids);
            }
          }),
          h(GameIcon, {icon: game.icon}), game.name)
      )),
      h('p', {className: 'braingames-setting-note'}, '仅从勾选的游戏中开新局。至少勾选两款，结算时才能切换游戏。'),
      ...groups.map(group => h('div', {key: group.title, className: 'braingames-settings-group'},
        h('h4', null, group.title),
        ...group.settings.map(([field, label, on, off, note]) =>
          h('fieldset', {key: field, className: 'braingames-setting'},
            h('legend', null, label),
            h('div', {className: 'braingames-setting-options'},
              ...[[true, on], [false, off]].map(([enabled, text]) =>
                h('label', {key: String(enabled)},
                  h('input', {
                    type: 'radio', name: 'braingames-' + field, value: String(enabled),
                    'data-braingames-setting': field, checked: value[field] === enabled,
                    onChange: () => { void onChange(field, enabled); }
                  }), h('span', null, text))
              )
            ),
            note ? h('p', {className: 'braingames-setting-note'}, note) : null
          )
        )
      ))
    ),
    saving ? h('p', {role: 'status'}, '保存中…') : null,
    !writable ? h('p', {role: 'status'}, '当前设置为只读状态。') : null,
    error ? h('p', {role: 'alert', className: 'braingames-settings-error'}, error) : null
  );
}
