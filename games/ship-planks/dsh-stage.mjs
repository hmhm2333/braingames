import {mountGame} from './experience.mjs';
import {createTransparentStage} from '../../runtime/transparent-stage.mjs';
export function mountStage(container,options={}){
 const stage=createTransparentStage(container,{...options,mountGame,kind:'planks-g02',keys:['Enter','Escape','Tab'],stageStyle:':host,.stage,#scene,.paper{pointer-events:none!important}.stage button:not(:disabled){pointer-events:auto!important}.stage button:disabled,.stage [inert] button{pointer-events:none!important}'});
 // Style only the wrapper just created by our runtime, never the host UI.
 container.querySelector(':scope > [data-braingames-stage]').style.outline='none';return stage;
}
