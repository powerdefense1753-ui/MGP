# Stratum · 策略游戏总表

React + Vite 前端，默认中文，可切换英文。每行一款真实 Google Play 游戏，固定五列：

1. 游戏名称、真实图标、开发者与商店入口。
2. Google Play 商店总评分和评分数量，不是样本评论的均分。
3. 依据商店介绍整理的游戏简介。
4. 根据实际页面评论整理的体验评价，区分认可点、需留意的问题，并展示样本量和年份。
5. 每款两张 Google Play 原始商店截图，可点击放大和切换。

当前收录 11 款游戏、22 张真实截图、33 条页面评论样本。图片均从 Google Play 图片 CDN 读取，已移除页面中使用的占位插画。评论是页面展示的小样本，不是随机抽样；较旧评论不代表当前版本。提供英文原评短节选、日期和来源链接。

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

浏览器测试使用 `/usr/bin/chromium`，可通过 `CHROMIUM_PATH` 覆盖。测试覆盖五列表格、真实图片加载、评分、评论依据、放大切换、筛选收藏、中英文与手机横向滚动。

`dist/index.html` 为普通构建，图片独立缓存。`dist/stratum-prototype.html` 为含所有图片的独立交互文件（约 15MB）。无需请求外部图片即可展示；点击商店/原图链接需要联网。

## 数据与刷新

- `src/data/google-play.json`：11 款游戏的已复核分类、简介和商店事实。
- `src/data/play-details.json`：评分、数量、短评论节选、日期与图片来源。
- `src/data/review-summaries.json`：逐款复核的中英文摘要，包含对应评论 ID。
- `data/google-play/review-evidence.json`：完整评论证据，供复核使用，不在网页中整段转载。
- `public/play-media/`：11 个真实图标、22 张官方截图，原图文件未二次绘制。

基础资料刷新：`npm run data:refresh`。评分、评论、截图刷新：

```bash
python -m pip install --target .python-deps -r data-requirements.txt
npm run data:details
```

刷新只访问明确的包名，最多三个并发；复用已下载图片，不自动绕过访问限制。若评论内容变化，需要人工重新复核摘要；界面发现摘要与样本 ID 不一致会显示待复核，数据测试也会失败。普通构建不会抓取网络数据。

标签缺失不是功能不存在；缺失广告/内购信息保持未知。价格和地区可用性以当前商店为准。截图与商标归各自权利人，来源链接在页面中保留。收藏只在当前浏览器保存，无账号或后台。
