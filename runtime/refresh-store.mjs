const KEY='braingames.round.refresh.v1',LIMIT=256*1024;
// sessionStorage is tab-local; host identity rejects a restarted desktop/Host.
// Only an actual document reload may consume a checkpoint.
export function createRefreshStore({storage,runtimeId,navigationType}){
  if(typeof runtimeId!=='string'||!runtimeId)throw Error('Missing BrainGames runtime identity');
  return{
    clear(){storage.removeItem(KEY);},
    read(){
      const raw=storage.getItem(KEY);if(!raw)return null;
      if(navigationType!=='reload'){storage.removeItem(KEY);return null;}
      if(raw.length>LIMIT)throw Error('保存的游戏状态超出大小限制');
      let saved;try{saved=JSON.parse(raw);}catch(cause){throw Error('保存的游戏状态无法读取',{cause});}
      if(saved.runtimeId!==runtimeId){storage.removeItem(KEY);return null;}
      if(saved.version!==1||typeof saved.round?.gameId!=='string'||typeof saved.round.wasVisible!=='boolean'||!saved.round.game)throw Error('保存的游戏状态不完整');
      return saved.round;
    },
    save(round){
      if(!round){storage.removeItem(KEY);return;}
      const raw=JSON.stringify({version:1,runtimeId,round});if(raw.length>LIMIT)throw Error('本局游戏状态超出保存大小限制');storage.setItem(KEY,raw);
    }
  };
}
