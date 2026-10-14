# Stratum · 策略游戏目录

React + Vite 前端，默认中文，可切换英文。桌面端为左侧即时筛选栏、右侧每行三张卡片；窄屏自动减少列数。支持收藏、搜索、评分排序、首发日期排序、截图放大与每批 24 款的分批加载。

目录保留原有 11 款复核游戏，并增加 Google Play 美国区近两年首次发布的策略游戏。具体数量、扫描时间和覆盖范围见 `src/data/scan-coverage.json`。新作口径为 **2024-10-12 至 2026-10-12**，使用商店 **Released on**，不把 **Updated on** 当作首发日期；只收录官方分类为 `GAME_STRATEGY` 的已发布条目。公开搜索及榜单结果受 Google Play 限制，不能证明覆盖全店。

卡片展示真实名称、商店评分、简介、首发日期和官方截图。新作简介保留开发者英文原文；未采集的评论不生成评价摘要，无评分显示为未知。原有 11 款的 33 条评论样本及双语复核摘要继续保留，但这些小样本不代表全部玩家或当前版本。

## 启动与验证

### Windows 本地运行

安装 Git 和 Node.js 22 或更新版本后，在 PowerShell 执行（目标文件夹需为空或尚不存在）：

```powershell
git clone https://github.com/powerdefense1753-ui/MGP.git "E:\Mobile Game Publish"
Set-Location "E:\Mobile Game Publish"
npm.cmd ci
npm.cmd run dev
```

使用终端输出的地址在本机浏览器打开。仓库已包含展示所需的游戏数据和图片，无需安装 Python 或重新抓取数据。保持终端运行；按 Ctrl+C 停止服务。

Node.js 22+（当前为 24），在 `/workspace/MGP` 执行：

```bash
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run test:e2e
npm run build
```

浏览器测试使用 `/usr/bin/chromium`，可通过 `CHROMIUM_PATH` 覆盖。测试覆盖卡片列表、真实图片、评分、评论依据、放大切换、即时筛选、收藏、中英文、首发日期筛选与移动端不溢出。

`dist/index.html` 为普通构建，图片独立缓存。`dist/stratum-prototype.html` 为含所有图片的独立交互文件（新增游戏后体积随图片数量增长）。无需请求外部图片即可展示；点击商店/原图链接需要联网。

## 新作扫描与导入

`npm run data:scan` 扫描美国区策略游戏免费榜、付费榜及 50 组关键词，并逐条读取分类和首发日期。最多 3 并发；工作缓存与失败记录位于 `work/play-crawler/`，重复执行复用缓存。需要重新抓取时使用新的工作缓存目录或先备份旧缓存。

`npm run data:import-recent` 筛选符合窗口的条目、下载图标和最多两张截图，并输出新增目录、来源证据和逐候选排除原因。它保留原有精选目录；评论始终保留为未采集，不自动生成评价。下载失败会记录在审计文件中，界面可显示缺失媒体。

- `src/data/recent-games.json`、`recent-details.json`：新增游戏及图片、商店评分。
- `src/data/scan-coverage.json`：收录窗口、覆盖统计和完整性说明。
- `data/google-play/recent-scan-audit.json`：每个候选的检索来源、收录或排除原因。
- `data/google-play/recent-listing-evidence.json`：收录条目的公开商品信息、原始首发字段与分类标签。不包含开发者联系资料或玩家个人信息。

## 原有精选数据与刷新

- `src/data/google-play.json`：11 款游戏的已复核分类、简介和商店事实。
- `src/data/play-details.json`：评分、数量、短评论节选、日期与图片来源。
- `src/data/review-summaries.json`：逐款复核的中英文摘要，包含对应评论 ID。
- `data/google-play/review-evidence.json`：完整评论证据，供复核使用，不在网页中整段转载。
- `public/play-media/`：原有与新增游戏的官方图标、截图，保留原始来源链接。

基础资料刷新：`npm run data:refresh`。评分、评论、截图刷新：

```bash
python -m pip install --target .python-deps -r data-requirements.txt
npm run data:details
```

刷新只访问明确的包名，最多三个并发；复用已下载图片，不自动绕过访问限制。若评论内容变化，需要人工重新复核摘要；界面发现摘要与样本 ID 不一致会显示待复核，数据测试也会失败。普通构建不会抓取网络数据。

标签缺失不是功能不存在；缺失广告/内购信息保持未知。价格和地区可用性以当前商店为准。截图与商标归各自权利人，来源链接在页面中保留。收藏只在当前浏览器保存，无账号或后台。

## 持续扩展队列

`npm run data:expand` 会从已发现的策略游戏继续读取推荐链接与开发者公开作品目录，再核验新候选；也包含补充关键词。任务保存在 `work/play-crawler/graph-state.json`，已完成任务按类型和标识去重，重启后继续。`graph-status.json` 区分已核验、符合条件、已发布和待处理任务。

- 最多 3 个并发任务；短暂读取失败有限重试，遇到限流退避，不绕过访问限制。
- 每新增至少 25 款符合条件的游戏，下载媒体、校验并发布一批。校验失败恢复上一批目录。
- `graph.lock` 防止重复采集进程；需要主动停止时可创建 `work/play-crawler/graph.stop`，续跑前移除此控制文件。
- 磁盘剩余不足 2 GiB 时停止写入并报告。`frontier_exhausted_not_all` 仅代表当前可发现队列耗尽，绝不代表 Google Play 全量收录完成。
- 开发者目录优先使用商品页提供的数字开发者标识，避免已编码名称导致错误链接。

### 界面语言
支持 English、简体中文、繁體中文、日本語、Español、Français、Deutsch、Português、ไทย 和 Bahasa Indonesia。默认按浏览器的系统语言优先列表匹配，不支持的语言回退为英语；中文按文字系统或地区识别简繁体。右上角语言菜单可手动选择并保存在本机，也可选“跟随系统”。界面、筛选标签、游戏简介及已采集评价内容均支持语言切换；游戏名称和来源证据保留原文，所有译文可展开对照原文。新增界面文案需同步 `src/locales/` 的十套词典。

游戏内容翻译：`npm run data:translate` 预先生成九种非英语译文，覆盖现有游戏简介、已采集评价摘要和评论摘录。来源为英文公开内容，译文提供方为 Google Translate；原文键、服务、源语言及生成时间保存在 `src/data/content-translations.json`。已复核的中文摘要优先显示。每处译文带原文入口和译文类型标识；没有评论的游戏不会生成评价。缓存位于 `work/content-translation-cache.json`，新增游戏发布前自动补译并校验完整性。遇 403/429 停止，不绕过限制。
