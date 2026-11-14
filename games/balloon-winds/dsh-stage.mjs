import {mountGame} from './experience.mjs';
import {createTransparentStage} from '../../runtime/transparent-stage.mjs';

export function mountStage(container, options = {}) {
  const stage = createTransparentStage(container, {
    ...options, mountGame, kind: 'balloon-winds', keys: [],
    suppressContextMenu: true,
    stageStyle: ':host,.stage,canvas,.paper{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}',
  });
  container.querySelector(':scope > [data-braingames-stage]').style.outline = 'none';
  return stage;
}
