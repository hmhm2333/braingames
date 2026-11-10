# BrainGames for DSH

任务在跑，顺手摸把鱼。三款低强度、单人认知小游戏，叠在 DSH 的透明舞台上，任务仍然看得见。操作任务时游戏凝滞，回来接着玩。

当前版本 **0.24.0**，匹配 **DeepSeek Harness 0.2.2-rc.1**。安装包通用于 Windows、macOS 桌面端和 DSH 网页端，无须安装 Blender 或另启游戏服务。它是 DSH 插件，不能直接装到 Codex、Claude Code 或作为独立网页运行。

## 安装

从 [Releases](https://github.com/hmhm2333/braingames/releases/latest) 下载 `.tgz` 和 `SHA256SUMS`。只安装本仓库提供的文件，不要下载 GitHub 的 Source code 压缩包当作插件。安装需要访问 DSH 配置的包源以解析依赖；游戏资源随包提供。

### Windows / macOS 桌面端

先在 DSH 应用菜单的 **Manage dsh Command… / 管理 dsh 命令**中注册桌面端配套命令，打开新终端，确认 `dsh --version` 为 `0.2.2-rc.1`。npm 安装的独立 CLI 不能管理桌面端 profile。

结束需要保留的任务后，**完全退出** DSH，再执行以下命令（Windows PowerShell 和 macOS Terminal 相同）：

```sh
dsh plugin --profile desktop add 'https://github.com/hmhm2333/braingames/releases/download/v0.24.0/braingames-dsh-plugin-0.24.0.tgz' --ignore-scripts
```

重新打开 DSH，在“插件”页面确认 `@braingames/dsh-plugin` 已启用。关闭窗口可能只是隐藏应用：Windows 用托盘菜单退出，macOS 用 ⌘Q。

也可以先下载 `.tgz`，将上述 URL 替换为文件的**绝对路径**。包不包含安装脚本或原生二进制依赖。不要添加 DSH 版本兼容豁免来强行安装其他版本。

### DSH 网页端

插件装在提供网页的 **DSH Host 所在电脑或服务器**上，不是在浏览器内安装扩展。停止该 web profile 的 Host 后执行：

```sh
npx @deepseek-ai/dsh@0.2.2-rc.1 plugin --profile web add 'https://github.com/hmhm2333/braingames/releases/download/v0.24.0/braingames-dsh-plugin-0.24.0.tgz' --ignore-scripts
npx @deepseek-ai/dsh@0.2.2-rc.1 web
```

已有匹配版本的 `dsh` 命令也可以直接执行 `dsh plugin --profile web add '安装包 URL 或绝对路径' --ignore-scripts`，再启动 `dsh web`。使用自定义 profile 时，将 `web` 换成实际名称。桌面端和网页端的 profile 独立，需要分别安装。

远程部署沿用 DSH 自身的认证和网络配置；插件不新增端口、外部资源服务器或认证入口。

### 校验、升级与卸载

Windows 下载后：

```powershell
Get-FileHash -Algorithm SHA256 .\braingames-dsh-plugin-0.24.0.tgz
```

macOS 下载后：

```sh
shasum -a 256 braingames-dsh-plugin-0.24.0.tgz
```

结果应与同一 Release 的 `SHA256SUMS` 一致。升级时完全退出相应 Host，再用目标版本 URL 执行同一 `add` 命令。插件未发布到 npm；不使用 `npm install @braingames/dsh-plugin`。

卸载：停止对应 Host，执行 `dsh plugin --profile desktop remove @braingames/dsh-plugin`（网页端改为 `web`，并使用对应 CLI）。本机最佳记录和位置不会随卸载自动删除。

## 怎么玩

| 游戏 | 操作 | 本局成绩 |
| --- | --- | --- |
| 干饭不吃泡 | 按空格接食物；泡泡和红牌上的食物都不接 | 坚持的秒数 |
| 还是老样子 | 记住小动物最近点的菜；没有重新点菜时照旧，点击菜品 | 成功招待的顾客数 |
| 这船还能开 | 在脑中旋转木板，点击同形破口 | 补好的船板数 |

每局三颗心，难度逐步增加。默认静音。游戏不是诊断或治疗工具，训练效果尚未作有效性验证。

入口位于**任务标题栏、文件按钮左侧**，没有运行任务时也能手动打开。没玩完就继续，跨任务保持同一局；结算后可以重玩，或“换个玩”。**至少勾选两款游戏才可换另一款**，不会在半局中更换。

点击后面的任务、在任务中输入、切换窗口或任务结束时，游戏凝滞。默认画面保留，只能点鲸鱼娘恢复；恢复的第一次点击不作答，短暂停留后继续。关闭“保留凝滞画面”后，从标题栏继续。空白区域的鼠标操作交给 DSH；窗口不足 640×480 CSS 像素时暂停训练计时。

上菜和补船可长按鲸鱼娘移动位置；接饭在全舞台下落，不需要拖动角色。

## 设置与数据

在 DSH“插件”中打开 `@braingames/dsh-plugin` 详情，可以勾选游戏，开关自动邀请、仅任务运行时邀请、有未读完成提醒时不邀请、保留凝滞画面、刷新续局和默认模型推荐。三款游戏默认全部勾选，开关默认开启。邀请条件只控制自动邀请，不限制手动打开。

**模型推荐**开启且有多款候选时，新开局或“换个玩”会调用一次已配置的默认模型。只读取当前任务最近六条用户文字，总计最多四千字、每条最多一千二百字；不读助手回复、工具结果、图片或附件。调用可能产生模型服务费用。关闭该开关即可仅用本地随机选择。模型未配置或调用失败会显示原因，可以重试或明确选择随机开始。

插件不管理 API 密钥，不上传成绩，不在存档中保存聊天正文。续局、恢复和刷新不调用模型。

**刷新续局**限同一标签页、同一次 DSH Host 运行。刷新后先凝滞；重启 Host、新开页面或重新加载插件不承诺续局。本机最高记录和位置单独保留。后台停止游戏动画和训练时钟。

## 兼容范围

| 环境 | 当前证据 |
| --- | --- |
| Windows 桌面端，DSH 0.2.2-rc.1 | 固定原生客户端实际安装、输入交接和刷新续局测试 |
| DSH 网页端，匹配版本 | web profile 安装；浏览器内三款打包游戏、全部跨游戏切换与资源加载测试；完整远程认证部署未验收 |
| macOS 桌面端，匹配版本 | 同一跨平台包；代码及官方公开接口审查支持，尚无 macOS 真机测试 |

透明舞台位于 **DSH 窗口内部**，不覆盖系统桌面或其他应用。网页建议使用有硬件加速的 Chromium 浏览器；Safari、手机和平板未验收。DSH 预览版本可能改变接口，当前兼容范围不自动扩展到未来版本。

平台与命令依据：[官方桌面端文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/apps/desktop/README.md)、[官方 CLI 文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/apps/cli/README.md)。

## 分发边界

本仓库仅分发安装包、校验值、安装使用说明及许可声明。源码、策划、测试记录、建模工程和制作资料保持私有。安装包含运行必需的 JavaScript 和像素资源；公开安装包不等于实现不可被查看。

原创程序的使用许可见 [LICENSE.txt](LICENSE.txt)，第三方署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
