# RAID OPS

独立的 Nuxt 4 浏览器横版射击游戏。品牌为 **RAID OPS**，正式域名为 **https://runandgun.games**。

## 本地开发

需要 Node.js 24 和 npm。执行 `npm install` 后运行 `npm run dev`，默认预览地址为 http://localhost:3400。`npm test` 运行站点边界、Vue 编译和定向引擎校验。

本项目不依赖 tools-admin 的 node_modules、登录服务、后台 API 或数据库。游戏逻辑位于 `app/utils/`，实际组件位于 `app/components/game/RaidOpsGame.vue`，资源及字体授权文件位于 `public/iron-front/`。

## 页面与 SEO

- `/`：直接加载游戏主菜单，保留 SSR 游戏介绍和 VideoGame 结构化数据。
- `/how-to-play`：键盘、角色、武器、交互设施和首领机制指南。
- `/privacy`：本地存档及当前数据处理说明。
- `/robots.txt`、`/sitemap.xml`：由独立站路由生成，可随站点一起预渲染。

本地开发与默认预览保持 noindex。公开上线时显式使用 `SITE_INDEXABLE=true npm run generate`，生成 `.output/public` 静态站点。此命令仅在明确授权构建或上线后执行。静态文件可以部署到现有后台服务器的独立 Nginx 站点目录，不需要新建数据库或 Node 进程。正式 HTTPS 和 www 重定向应在服务器配置。

## 存档

访客存档使用 `raid-ops-progress-v1`，偏好使用 `raid-ops-preferences-v1`。数据保留在当前域名、当前浏览器。后台账号存档不会自动迁移，未接入云同步。退出任务仍返回游戏内选关页面。

## 本次本地验证

- 49项定向检查通过，教程独立正文1,188英文词。
- 浏览器检查了桌面和390px首页、手机指南无横向溢出、游戏启动、角色切换、移动/跳跃输入、全屏入口、暂停退出返回选关，以及离开游戏页。
- 本地SEO路由响应正常、robots禁止索引；未做生产构建、域名绑定或上线。

## 当前验证边界

源引擎复制时已带入镜头稳定、首领残血修复和横板敌人位置修复。源码基线见 `docs/source-baseline.json`。定向检查不代表原六关固定操作通关回放已全部通过；旧回放会因敌人位置和巡逻变化失配，公开发布前仍需完成相应复核。沙漠回放保留在定向测试中。

## 后续正式发布

1. 核对整条路线与 Boss 通关、暂停返回和存档。
2. 核对素材公开使用授权；第一方统计的后台白名单和游戏域名 /e 转发须随发布启用，目前未接入广告。
3. 将域名解析到现有服务器，配置独立目录和 HTTPS。
4. 授权后预渲染正式产物，核对 canonical、robots、sitemap 和静态资源，再发布。
5. 确认独立站可玩后，再把后台入口改为新域名跳转。

正式站已于2026-11-26部署到 https://runandgun.games 。Git 仓库：https://github.com/cheny5814/raid-ops 。下方早期批次记录保留当时的验证边界。

## Desktop homepage update

The original game menu remains the first viewport. The field guide below it includes campaign screenshots, weapon and operative descriptions, controls, FAQ, and guide/privacy navigation. It collapses during combat and returns at mission selection. Mobile presentation was not changed in this batch.

The host handles failed imports, a 20-second loading timeout and initialization errors, with retry and reload actions that preserve local saves. Eight focused checks passed. Browser checks covered the menu, page content, FAQ, links, combat layout, pause and exit. SSR includes the field guide; screenshots return 200; local preview remains noindex. No production build or deployment was performed.

Screenshot sources: existing game-rendered frames `/tmp/raid-fullscreen-0.png` and `/tmp/raid-fullscreen-desert.png`, copied to `public/iron-front/screenshots/`.

## 关于、分享与页面配置

- `/about` 已接入页脚与站点地图，独立主内容为923个英文词。
- `shared/site.ts` 统一品牌、正式域名、公开路由、TDK和分享图；`app/content/game-facts.ts` 统一版本、数量、访问条件、设备与存档限制。
- 首页使用互相关联的 WebSite / VideoGame 结构化数据。公开页面共用1200×630分享封面 `public/images/raid-ops-share.png`；macOS上可运行 `npm run share:generate` 使用已有游戏画面和本地字体重新生成。
- 用户已确认对外署名、运营者名称均为 RAID OPS，邮箱暂不添加。`/terms` 已启用并接入页脚、站点地图；关于页、隐私页及条款使用统一品牌署名。`/contact` 保持404，不显示联系入口或空邮箱链接。以后明确提供邮箱再启用联系页。
- 本批11项定向检查通过；浏览器核对了关于页排版、首页主菜单和页脚导航，无新增控制台错误。四个已启用页面的SSR TDK/H1/canonical/分享元数据正常。条款启用后已完成浏览器和HTTP检查，关于页署名显示正确；联系页继续停用。
- 未改手机端，未接统计或广告，未做生产构建、部署或DNS修改。

## 独立站接入修复

- 独立站游戏固定为英文，顶部及设置弹框的语言切换入口已移除。旧中文偏好不再影响界面或页面 lang；其余设置和存档继续保留。
- 主菜单 Game guide 会先退出原生全屏或沉浸模式，再定位并聚焦首页介绍区，避免固定游戏画面遮挡正文。已在开发浏览器验证沉浸模式、介绍区焦点、设置弹框及暂停退出返回任务选择；原生浏览器全屏退出分支已核对源码，本轮环境未触发该分支。
- 已启用公开页的尾斜杠路径统一重定向到无尾斜杠路径，保留查询参数。开发预览实测首页200、公开页301、停用联系页及未知路径404。静态部署时仍须对应配置服务器路由。
- 本批12项定向检查通过，未做生产构建或上线。开发预览继续运行于 http://localhost:3400/。

## 首页战役与玩法展示

- 战役卡片改用现有港口、沙漠场景背景，按原图3:1完整展示，修复固定高度导致的大幅裁切；说明改为两条战役背景与任务介绍。
- 首页增加双角色能力、六种武器、共享成长、绳索和滑索、固定炮台、装甲载具、场景机关与两类首领战介绍。沿用站内字号层级，替换重复的旧概述卡片。
- 主菜单绘制上限调整为30帧；游戏区域离开视口后取消绘制循环，回来重新启动并清空时间差，战斗帧率保持原逻辑。新增真实循环的离屏停止、恢复与去重检查。
- 本批13项定向检查通过，浏览器核对场景图、玩法卡片、无横向溢出、滚动返回、进入游戏与暂停，未产生控制台错误。未生产构建、未上线；本地预览继续运行。

## 首页与教程分工调整

- 首页仅保留原游戏主菜单、游戏简介与数量、两条战役背景、免费/单人/本地存档FAQ及教程入口；移除详细玩法、按键和首领攻略。
- 详细玩法集中到 `/how-to-play`，合并既有说明，按角色、六种武器、装备机关、首领、重试和设置组织。教程独立正文1,394英文词。
- 13项定向检查通过，浏览器确认首页教程入口、教程分组和角色卡片正常，无横向溢出或控制台错误。未生产构建、未上线。

## 主菜单远景与标题

- 移除首页远景的镜像循环拼接，改为单张固定背景；人物步伐、前景甲板、直升机和探照灯仍保留动态。实战镜头逻辑未修改。
- RAID OPS主标题改为单行，保留双色字标，调整字号上限与间距。桌面和沉浸模式检查无换行、无横向溢出或控制台错误。
- 本批7项定向检查通过，其中真实绘制函数在0、80、160及3,600秒均只绘制一张未经位移的远景。该检查是绘制函数测试，不代表浏览器连续运行一小时。未构建或发布。

## 开始入口与完整战场存档

- 主菜单为 Start game 与 Quick start。前者无存档时进入战役选择，有兼容存档时提供 Continue saved game / New game；新游戏在部署时才替换存档，取消选关不清除原存档。
- Quick start固定直进灰港首关，保留永久成长；没有存档时正常自动保存，已有存档时不覆盖原继续存档。
- 常规游戏每3秒及暂停、退出、正常关闭页面时保存位置、血量、装备、弹道、敌人、首领部件、目标、机关、载具、绳索与检查点快照。恢复后先停在暂停界面，由玩家按Resume继续。
- 使用独立版本化本地存档槽，校验关卡布局、完整性及关键字段；旧版仅有关卡记录的数据无法还原当时战场，原有永久成长继续保留。异常关闭最多可能丢失最近数秒，存档仍仅属于当前浏览器。任务完成时清除其继续存档，下关部署后建立新存档。
- 教程、首页FAQ、关于、隐私、条款和游戏内说明已同步。教程独立正文1,503词，关于页943词。
- 浏览器实测了常规开局、移动开火、暂停、刷新恢复相同生命/时间/进度、退出返回选关、快速开始不覆盖存档以及取消新游戏保留存档。七关定向存档测试验证往返后继续相同物理过程，另验证检查点、装备交互状态和损坏存档；不等同于七关浏览器通关。未构建或发布。

存档补充检查：所有63项现有检查通过。快速开始在没有存档时也会建立自动存档，让首次玩家可以下次继续；仅在已有继续存档时采用不覆盖模式。

## 首页玩法承诺与战斗演出

- 首页简介具体说明夺取新武器、驾驶装甲和分部件击败首领。
- 右侧改为十秒战斗展示：奔跑、连续开火、命中装甲、换火箭、爆炸后循环；复用实际游戏的角色、枪口、坦克与爆炸素材。演出不执行真实Run、不发出战斗音频、不修改存档。固定背景与飞机、探照灯保留。
- 减少动态模式关闭奔跑、枪火、弹道和爆炸。浏览器检查构图与运行无控制台错误；9项定向检查通过。仅本地修改，未构建或上线。

## 持续推进宣传演示

- 宣传演示改为独立真实战场：两名步兵、两架无人机、坦克按当前镜头右侧的屏外位置依次进入。角色持续向前跑，镜头跟随，近处甲板后移，远景固定。
- 复用真实AI、弹道、命中、受击、爆炸及角色动作，自动换机枪/火箭和跳跃躲弹；不使用站定等待的脚本。演示与玩家战场及存档隔离，无重复战斗音效。
- 10项定向检查通过，覆盖全程跑动、屏外入场、移动交火、击败5个目标及状态隔离；浏览器目检演出与爆炸正常，无控制台错误。仅本地修改，未构建或发布。

## 第一方使用统计

游戏通过同源 `POST /e` 接入后台「流量统计」中的 `runandgun.games`，只在正式域名且非开发环境上报。本地预览不写正式数据；页面编号仅保留在内存，不增加 cookie 或持久访客标识，不上传完整存档。

- 页面：PV、来源域名、来源渠道、可见满5秒、首次输入；复用后台设备/国家/访客分类。
- 入口：`click_start_game`、`click_quick_start`，与实际进入分开统计。
- 游戏：`game_start_战役_关号`、`game_continue_战役_关号`、`game_retry_战役_关号`、`game_fail_战役_关号`、`game_exit_战役_关号`、`mission_complete_战役_关号`。战役标识为 grayhaven/sandstorm，关号01起。
- 继续存档在按 Resume 后才统计实际进入；普通暂停恢复不会重复计入。
- `play_60s`、`play_300s` 按本次页面打开期间的真实模拟时间累计，每档只报一次；暂停、隐藏、首页演出不累计，读入的存档时长不作为已玩时长。
- 角色切换：`operative_falcon`、`operative_silver_fox`；不报姓名或账号。

发布时先更新后台的站点白名单和报表配置，再在游戏域名的 HTTPS server 块中加入 `deploy/stats-location.conf`；它会转发至同机后台的3100端口。静态文件本身不能处理 `/e`。采集服务继续使用后台已有数据库和密钥；不要把后台密钥放进前端。检查 Nginx 配置和真实访客IP传递后再重载。正式发布后需核对入口、开局、时长、失败和通关数据在后台的实际入库；本地模拟验证不代表线上已入库。

## 2026-11-26 首次正式发布

- 正式入口为 https://runandgun.games ，HTTP与www统一301到主域名；HTTPS证书已配置自动续期及续期后的Nginx重载。
- 静态目录 `/var/www/raid-ops/current` 指向版本目录 `/var/www/raid-ops/releases/20261126-initial`。站点配置为 `/etc/nginx/sites-available/raid-ops`，统计转发为 `/etc/nginx/snippets/raid-ops-stats.conf`，模板保存在本仓库 `deploy/`。
- 正式产物使用 `SITE_INDEXABLE=true npm run generate`。共享配置使用Nuxt的 `#shared` 别名；停用联系页排除预渲染，仍返回404。
- 五个公开页面、canonical与索引指令、robots、sitemap、www/HTTP/尾斜杠跳转及关键JS/CSS/图片/音乐MIME经线上HTTP核对。浏览器核对了回车开始、部署、移动射击、暂停和刷新恢复存档；没有将这些冒烟检查当作七关浏览器通关。
- 后台流量统计已发布RAID OPS站点与漏斗。正式浏览器产生的PV、可见满5秒、首次输入、开始入口、实际开局、继续存档事件已只读核对真实入库；1/5分钟与全部任务通关事件的去重由定向模拟验证，未声称本次浏览器已逐一达成。
- 后台此次仅叠加统计运行时文件，旧产物保存在 `/home/tools/raid-ops-release-20261126/output-before`，原统计源码保存在同目录的 `source-before/`。游戏包SHA-256为 `f71948f4b3f942b1e4a4bb892e3a586387b5d7d0e418594b20411c6cf8af6b79`。
