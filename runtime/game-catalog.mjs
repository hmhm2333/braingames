// Shared game copy and metadata.
export const SHARED_COPY={
  "appLabel": "BrainGames",
  "headerStart": "来一局",
  "headerContinue": "接着玩",
  "headerPlaying": "摸鱼中",
  "invite": "任务在跑，顺手摸把鱼？",
  "inviteIdle": "歇一小会儿，来一局？",
  "inviteAccept": "来一局",
  "inviteDismiss": "先不玩",
  "selecting": "正在挑游戏",
  "chooseError": "没挑出来，再试下",
  "chooseRetry": "再挑一次",
  "chooseRandom": "随便开局",
  "retry": "重试",
  "discardSavedRound": "放弃存档，重新开始",
  "next": "换个玩",
  "reload": "重新加载",
  "freezeHint": "忙完点鱼接着玩",
  "bestLabel": "最高记录"
};
export const GAME_COPY={
  "rice-bubbles-g10": {
    "title": "干饭不吃泡",
    "shortTitle": "接饭",
    "invite": "鱼饿了，帮我接两口饭？",
    "start": "开饭",
    "replay": "再吃一顿",
    "loading": "正端着碗过来",
    "loadError": "碗没端稳，重新加载下",
    "resultLead": "这顿吃了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": { "device": "键盘", "key": "空格键", "action": "接食物" },
    "rules": [
      "食物接住",
      "泡泡放过"
    ]
  },
  "regulars-g04": {
    "title": "还是老样子",
    "shortTitle": "上菜",
    "invite": "熟客上门了，帮我记下菜？",
    "start": "上菜",
    "replay": "再开一桌",
    "loading": "正在擦桌子",
    "loadError": "后厨卡住了，重新加载下",
    "resultLead": "这次招待了",
    "resultUnit": "位顾客",
    "bestLabel": "最高记录",
    "control": { "device": "鼠标", "key": "左键", "action": "点菜品" },
    "rules": [
      "说新菜，记住",
      "没说，照旧上"
    ]
  },
  "planks-g02": {
    "title": "这船还能开",
    "shortTitle": "补船",
    "invite": "船又漏了，搭把手呗？",
    "start": "补船",
    "replay": "再补一程",
    "loading": "正到处找木板",
    "loadError": "木板卡住了，重新加载下",
    "resultLead": "这趟补好了",
    "resultUnit": "块船板",
    "bestLabel": "最高记录",
    "control": { "device": "鼠标", "key": "左键", "action": "点破口" },
    "rules": [
      "看准手头木板",
      "点同形状破洞"
    ]
  },
  "balloon-winds": {
    "title": "顺风摘星",
    "shortTitle": "摘星",
    "invite": "风正好，去摘一颗星？",
    "start": "出发摘星",
    "replay": "再飞一趟",
    "loading": "正在吹起热气球",
    "loadError": "气球没准备好",
    "resultLead": "这趟摘到了",
    "resultUnit": "颗星",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键·右键",
      "action": "加风·减风"
    },
    "rules": [
      "左键加风",
      "右键减风"
    ]
  }
};
export const GAME_METADATA=[
  {
    "id": "regulars-g04",
    "icon": "regulars",
    "trainingProcesses": [
      "工作记忆更新",
      "人物与偏好绑定",
      "延迟回忆"
    ],
    "interaction": "鼠标单击菜品",
    "description": "记住普通小动物最新的点单；未重新点单时按原偏好上菜，新点单替换旧偏好。"
  },
  {
    "id": "rice-bubbles-g10",
    "icon": "rice",
    "trainingProcesses": [
      "反应抑制",
      "选择性注意",
      "规则监测"
    ],
    "interaction": "按空格或不按键",
    "description": "随机位置竖直落下食物与泡泡，按空格接食物。泡泡和本顿禁接食物都要放过。持续答对会逐步调整节奏、反应时间和干扰。"
  },
  {
    "id": "planks-g02",
    "icon": "planks",
    "trainingProcesses": [
      "心理旋转",
      "形状匹配",
      "空间表征"
    ],
    "interaction": "鼠标单击破口",
    "description": "想象手持木板旋转后的轮廓，从船上多个不同破口中选出同形者；选择前不显示旋转放置过程。"
  },
  {
    "id": "balloon-winds",
    "icon": "balloon",
    "trainingProcesses": [
      "带符号心算",
      "横纵坐标差计算",
      "多步位移规划"
    ],
    "interaction": "鼠标左键加位移，右键减位移",
    "description": "根据热气球和星星的坐标差，在几朵云里选择多次横纵位移。左键加风，右键减风，逐步算到目标坐标。"
  }
].map(game=>({...game,name:GAME_COPY[game.id].title,hint:GAME_COPY[game.id].invite,action:GAME_COPY[game.id].start}));
