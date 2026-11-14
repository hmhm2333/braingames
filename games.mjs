import {GAME_METADATA} from './lib/catalog.mjs';
const chunks={'balloon-winds':'./client.winds.js','regulars-g04':'./client.g04.js','rice-bubbles-g10':'./client.game.js','planks-g02':'./client.g02.js','fish-leap':'./client.fish.js'};
export const GAME_CATALOG=GAME_METADATA.map(game=>({...game,chunk:chunks[game.id]}));
