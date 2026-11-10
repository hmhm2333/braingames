import {mountGame} from './experience.mjs';
import {createTransparentStage} from '../../runtime/transparent-stage.mjs';
export function mountStage(container,options={}){
  return createTransparentStage(container,{...options,mountGame,kind:'regulars-g04',keys:['Enter','Escape','Tab'],
    stageStyle:':host,.stage,#scene,.window{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}'
  });
}
