import {mountGame} from './experience.mjs';
import {createTransparentStage} from '../../runtime/transparent-stage.mjs';

export function mountStage(container,options={}){
  return createTransparentStage(container,{...options,mountGame,kind:'rice-bubbles-g10',keys:['Space','Enter','Escape','Tab'],
    stageStyle:':host,.game-root,#scene-root,#scene-root canvas,.paper{pointer-events:none!important}.game-root button:not(:disabled){pointer-events:auto!important}.game-root button:disabled{pointer-events:none!important}'
  });
}
