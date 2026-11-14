import Schema from '@deepseek-ai/schemastery';
import {GAME_CATALOG} from './games.mjs';
import {apply as applyResources} from './resources.mjs';
import {applyCapabilities} from './capabilities.mjs';
import {readFile} from 'node:fs/promises';

export const inject=['connection','llm','sessionQuery','agentDefaultModel'];
export const Config=Schema.object({
  enabledGames:Schema.array(Schema.union(GAME_CATALOG.map(game=>game.id))).default(GAME_CATALOG.map(game=>game.id)).volatile(),
  autoInvite:Schema.boolean().default(true).volatile(),
  inviteRequireRunning:Schema.boolean().default(true).volatile(),
  inviteRequireNoUnread:Schema.boolean().default(true).volatile(),
  keepVisibleOnPause:Schema.boolean().default(true).volatile(),
  keepOnRefresh:Schema.boolean().default(true).volatile(),
  modelRecommendation:Schema.boolean().default(false).volatile()
});

export async function apply(ctx,config){
  await applyResources(ctx);
  const {version}=JSON.parse(await readFile(new URL('./package.json',import.meta.url),'utf8'));
  applyCapabilities(ctx,{version,enabledGameIds:()=>config.enabledGames.get(),recommendationEnabled:()=>config.modelRecommendation.get()});
  ctx.inject(['settings'],child=>child.effect(()=>child.settings.configure({auto:false},ctx.fiber)));
}
