<div align="center">

<h1>BrainGames</h1>

<p>在 DeepSeek Harness（DSH）里，等 Agent 执行任务时做几分钟认知训练。</p>

<p>
  <a href="#安装"><img src="assets/readme/badge-dsh.svg" alt="DeepSeek Harness 0.2.2-rc.1" /></a>
  <a href="https://github.com/hmhm2333/braingames/blob/HEAD/LICENSE.txt"><img src="assets/readme/badge-mit.svg" alt="MIT License" /></a>
</p>

<p>
  <a href="#安装"><strong>安装</strong></a> ·
  <a href="#我是谁">我是谁</a> ·
  <a href="#为什么做认知训练">为什么做认知训练</a> ·
  <a href="#游戏与训练目标">游戏与训练目标</a> ·
  <a href="#设置">设置</a> ·
  <a href="https://github.com/hmhm2333/braingames/issues">问题反馈</a>
</p>

</div>

**Agent 跑任务 → 做几轮练习 → 切回工作时暂停 → 下个空档继续。** 游戏叠在 DSH 的透明舞台上，点击空白处仍能操作工作区。

<p align="center">
  <img src="assets/readme/workspace.webp" alt="BrainGames 在 DeepSeek Harness 中的界面" width="900" />
  <br />
  <sub>DeepSeek Harness 实机画面 · 大肥鱼热气球</sub>
</p>

## 我是谁

- 我是哼哼。我曾在一家<strong>头部教育科技公司</strong>为 3 到 12 岁儿童设计认知训练。相关训练在一线教育教学产品中覆盖了大量学生，也为面向人大附早早培、早培和八素八少的冲刺班提供过训练支持。
- 我曾在一家<strong>头部脑科学公司</strong>为儿童、成年人和老年人设计专项认知训练。相关项目开展过临床试验。我参与研发的认知训练评估和产品取得过**第二类医疗器械注册证**。项目采用的 AI 数字疗法技术路线已提交，供第三类医疗器械相关标准的前期论证参考。
- 目前，我在一线教育服务中把学习成长与认知训练结合起来，也在开发与学习相关的**亲子认知游戏**。

## 为什么做认知训练

认知训练把一个认知过程变成可重复的任务，例如及时抑制已经准备好的动作，或把刚记下的信息换成新信息。在训练任务上进步、在相近的测评里进步、在日常生活中用得上，需要分别验证。

**认知老化与能力维持。** ACTIVE 随机试验中，接受推理训练或加工速度训练的老年参与者，十年后在各自的目标能力上仍可测到训练效果。

**痴呆风险。** WHO 2026 年指南将认知训练和认知刺激纳入降低痴呆风险的建议，面向认知正常或有轻度认知障碍的成年人。ACTIVE 的 20 年随访发现，完成特定加工速度训练及加强训练的老年参与者，痴呆诊断风险低于对照组。后续重分析提示结果受统计方法影响。BrainGames 的游戏分数反映当局表现，长期健康效果需要另行验证。

**怎么练。** 类似健身，每组先确定练哪个动作，然后反复做、看反馈，再增加难度。这里加的可以是要记住的顾客数，也可以是更短的作答时间。等 Agent 的几分钟里，可以做完一小组，再接着工作。

## 游戏与训练目标

<p align="center">
  <img src="assets/readme/gameplay.webp" alt="吃白饭吐泡泡、大肥鱼茶餐厅、忒修斯之渔船和大肥鱼热气球的实机画面" width="900" />
</p>

| 游戏 | 主要认知能力 | 几分钟里反复做什么 |
| --- | --- | --- |
| **吃白饭吐泡泡** | 反应抑制、选择性注意 | 用空格接食物，遇到泡泡或红牌上标出的食物时忍住不按。越往后，留给你判断的时间越短。 |
| **大肥鱼茶餐厅** | 工作记忆更新、间隔回忆 | 记住每位顾客各自的点单，隔几轮后凭记忆上菜。顾客换口味时更新旧单。难度上升后，要同时记住更多顾客。 |
| **忒修斯之渔船** | 视觉空间表征、心理旋转 | 在脑中转动木板，选出形状匹配的破口。后面会有更复杂的轮廓和更多备选破口。 |
| **大肥鱼热气球** | 带符号的心算、多步规划 | 计算气球和星星的横纵坐标差，组合几次加减位移抵达星星。后续关卡需要规划更多步。 |

## 安装

目标宿主为 **DeepSeek Harness `0.2.2-rc.1`**。从本仓库安装的是包含四款游戏的 **BrainGames `0.28.8`**。在 DSH 中发送下面这句即可安装并启用插件。

> 请安装并启用 dsh-braingames，来源：https://github.com/hmhm2333/braingames

也可以在 DSH 的「插件」页面填写同一个来源。装好后，点击**任务标题栏中文件按钮左侧的游戏图标**。没有正在运行的任务时也能手动开局。

<details>
<summary>使用命令行（CLI）安装</summary>

- 桌面端先从 DSH 应用菜单注册配套 CLI，退出桌面客户端后执行命令，再重新打开客户端。
- Web 端在运行 DSH Host 的电脑上执行命令，安装后重启 Host。

```bash
# 桌面端
dsh plugin --profile desktop add github:hmhm2333/braingames --ignore-scripts

# Web 端
dsh plugin --profile web add github:hmhm2333/braingames --ignore-scripts
```

</details>

## 设置

设置入口位于 **DSH「插件」页面 → `dsh-braingames` 详情页**。

| 选项 | 行为与数据说明 |
| --- | --- |
| **游戏池** | 在勾选的游戏里开局。勾选至少两款后，可在结算时换另一款。 |
| **自动邀请** | 自动邀请或手动打开。可设为仅在任务运行时邀请，也可设为先看完未读的任务完成提醒。 |
| **开局选游戏** | 用 DSH 默认模型推荐，或在勾选的游戏里本地随机。 |
| **切回工作** | 保留暂停画面，点鲸鱼娘续玩。也可收起画面，从标题栏续玩。 |
| **刷新续局** | 可在同一标签页、同一次 Host 运行中保留本局。 |

模型推荐使用最近至多 10 个主对话标题，每个最多 64 字，并可能产生调用费用。启用推荐后，插件可在 DSH 启动时预选。结算后「换个玩」在本地随机。

## 许可

原创代码采用 MIT 许可。角色、字体和其他第三方素材按各自许可分发。 [MIT 许可](https://github.com/hmhm2333/braingames/blob/HEAD/LICENSE.txt) · [第三方许可与署名](https://github.com/hmhm2333/braingames/blob/HEAD/THIRD_PARTY_NOTICES.md)
