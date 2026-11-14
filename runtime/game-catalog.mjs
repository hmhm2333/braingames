// Game labels, rules and feedback shared by the standalone and bundled clients.
export const SHARED_COPY={
  "appLabel": "dsh-braingames",
  "headerStart": "来一局",
  "headerContinue": "继续本局",
  "headerPlaying": "游戏中",
  "invite": "任务在跑，顺手来一局？",
  "inviteIdle": "歇一小会儿，来一局？",
  "inviteAccept": "来一局",
  "inviteDismiss": "先不玩",
  "selecting": "正在挑游戏",
  "chooseError": "没挑出来，再试下",
  "chooseRetry": "再挑一次",
  "chooseRandom": "随机开局",
  "retry": "重试",
  "discardSavedRound": "放弃本局，重新开始",
  "next": "换个玩",
  "reload": "重新加载",
  "freezeHint": "忙完点鲸鱼娘继续",
  "bestLabel": "最高记录",
  "viewportError": "当前游戏需要更大画面，请放大窗口后再试。"
};
export const GAME_COPY={
  "rice-bubbles-g10": {
    "title": "吃白饭吐泡泡",
    "shortTitle": "接饭",
    "invite": "鱼饿了，帮我接两口饭？",
    "start": "开饭",
    "replay": "再吃一顿",
    "loading": "正在端碗过来",
    "loadError": "碗没端稳，重新加载下",
    "resultLead": "这顿坚持了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": {
      "device": "键盘",
      "key": "空格键",
      "action": "接食物"
    },
    "rules": [
      "裸露的食物",
      "单独的泡泡",
      "包着食物的泡泡",
      "红牌标出的食物"
    ],
    "ruleNote": "按空格只接裸露食物。空泡泡、包食物的泡泡、红牌画的食物都不按。",
    "pickyHint": "这顿忌口{food}，泡泡也别接。",
    "feedback": {
      "rice_caught": "稳稳接住。",
      "bubble_mistake": "误接泡泡了。",
      "bubble_pass": "放过泡泡了。",
      "rice_miss": "这口漏掉了。",
      "food_refused": "忌口的食物，放过去了。",
      "food_mistake": "这顿忌口这个，放下吧。",
      "interrupted": "游戏已暂停，当前食物不计入成绩。",
      "meal": "团好一颗饭球，收妥了。"
    }
  },
  "regulars-g04": {
    "title": "大肥鱼茶餐厅",
    "shortTitle": "上菜",
    "invite": "熟客上门了，帮我记下菜？",
    "start": "上菜",
    "replay": "再开一桌",
    "loading": "正在擦桌子",
    "loadError": "后厨卡住了，重新加载下",
    "resultLead": "本局完成了",
    "resultUnit": "单",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点菜品"
    },
    "rules": [
      "新点单要记牢",
      "没改口照旧单"
    ],
    "ruleNote": "等客人站定再上菜",
    "feedback": {
      "timeout": "这单慢了，客人空手走了。",
      "correct": "给{guest}的菜上对了。",
      "wrong": "{guest}退回了这份菜。",
      "lives": "还能失误 {lives} 次。",
      "last": "累计失误 {max} 次，送走这位就打烊。"
    }
  },
  "planks-g02": {
    "title": "忒修斯之渔船",
    "shortTitle": "补船",
    "invite": "船又漏了，搭把手呗？",
    "start": "补船",
    "replay": "再补一程",
    "loading": "正在找木板",
    "loadError": "木板卡住了，重新加载下",
    "resultLead": "这趟补好了",
    "resultUnit": "块船板",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点破口"
    },
    "rules": [
      "木板可旋转对齐",
      "点匹配的破口"
    ],
    "feedback": {
      "correct": "补好了，这处不再漏水。",
      "wrong": "边缘没对齐，留意发亮的破口。",
      "lives": "还剩 {lives} 次机会"
    }
  },
  "balloon-winds": {
    "title": "大肥鱼热气球",
    "shortTitle": "摘星",
    "invite": "风正好，去摘一颗星？",
    "start": "出发摘星",
    "replay": "再飞一趟",
    "loading": "正在给气球充气",
    "loadError": "气球没准备好，重新加载下",
    "resultLead": "这趟摘到了",
    "resultUnit": "颗星",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键·右键",
      "action": "加风·减风"
    },
    "rules": [
      "左键加云坐标",
      "右键减云坐标"
    ],
    "moveNote": "长按移动气球会换云",
    "feedback": {
      "controls": "左键加风，右键减风",
      "edge": "往这吹会出界",
      "cold": "气囊冷却了",
      "spent": "风力用尽",
      "timeout": "气囊冷透，扣一颗心",
      "empty": "风力耗尽，扣一颗心",
      "add": "云飞向气球，左键加云坐标",
      "subtract": "云飞向气球，右键减云坐标",
      "moved": "气球飘至 {point}，新云朵已浮现",
      "needsWind": "要借风力去摘星星",
      "unreachable": "剩余风力不够从这吹到星星",
      "star": "摘得星星，抵达 {point}",
      "landed": "停在 {point}"
    }
  },
  "fish-leap": {
    "title": "快逮住小金鱼",
    "shortTitle": "捞鱼",
    "invite": "金鱼要变身了，帮我捞一条？",
    "start": "开捞",
    "replay": "再捞一局",
    "loading": "正在准备网兜",
    "loadError": "网兜没准备好，重新加载下",
    "resultLead": "本局存活了",
    "resultUnit": "秒",
    "bestLabel": "最高记录",
    "control": {
      "device": "鼠标",
      "key": "左键",
      "action": "点金鱼"
    },
    "rules": [
      "同批入水先观察\n等普通鱼游走",
      "普通鱼走不扣灯\n漏变身鱼会扣灯"
    ],
    "ruleNote": "冷却时记好入水顺序，专捞久留不走的鱼",
    "netCooling": "网兜冷却中",
    "netReady": "网兜就绪",
    "netLoss": "漏掉变身鱼扣灯",
    "netCasting": "正在下网",
    "feedback": {
      "evolving": "赶在变身前捞起了金鱼。",
      "ordinary": "捞到了普通金鱼。"
    }
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
    "description": "记住每位小动物最新的点单；未重新点单时按旧单上菜，新订单替换旧偏好。"
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
    "description": "随机位置竖直落下食物与泡泡，按空格接裸露食物。泡泡、包着食物的泡泡和红牌标出的食物都要放过。持续答对会逐步加快节奏并增加干扰。"
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
    "description": "想象手持木板旋转后的形状，从船体多个破口中选出匹配处；点击前不显示旋转过程。"
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
    "description": "根据热气球与星星的坐标差，挑选云朵组合位移。左键加坐标，右键减坐标，逐步飞抵目标位置。"
  },
  {
    "id": "fish-leap",
    "icon": "goldfish",
    "trainingProcesses": [
      "多目标追踪",
      "进场顺序记忆",
      "行动优先级判断"
    ],
    "interaction": "鼠标单击金鱼",
    "description": "追踪外观相同的金鱼进场顺序。普通鱼游走不扣灯，部分鱼停留久了会变身，漏掉扣灯；趁网兜就绪优先捞停留最久的变身鱼。"
  }
].map(game=>({...game,name:GAME_COPY[game.id].title,hint:GAME_COPY[game.id].invite,action:GAME_COPY[game.id].start}));
