# 活動獵人：頁面與每日更新

本專案是面向澎科大學生的原創校園情報網站。原工作站的副本位於 `E:\npu\islandlight-starter`；下載後可放在其他專案目錄。

## 啟動與維護

使用 Node.js 22 或以上版本，在專案目錄執行：

```powershell
npm ci
npm run dev
```

手動更新資料並建立網站：

```powershell
npm run refresh
```

只抓資料可使用 `npm run update:data`；測試使用 `npm test`；建置使用 `npm run build`。測試使用 Node 內建測試功能，沒有額外測試庫。

## 雲端更新與發布

雲端流程設定於 `.github/workflows/update-pages.yml`，使用公開儲存庫的標準 `ubuntu-latest` runner 與 Node.js 22，不依賴原工作站開機或 Codex 持續運作。

觸發方式：

- 每日 UTC 16:00，對應台灣時間下一日 00:00。
- `main` 有新的推送。
- 在 GitHub Actions 頁面手動執行；只有 `main` 可發布，其他分支不發布正式網站。

排程工作流程必須存在於預設分支 `main`，不能只放在開發分支。GitHub Pages 的發布來源需設為 GitHub Actions，發布工作使用 `github-pages` environment。

更新順序：

1. Checkout 正式分支，設定 Node.js 22，執行 `npm ci`。
2. 執行 `npm test`，確認解析、捲動及動效偏好測試通過。
3. 執行 `npm run refresh`，先抓取與驗證雙來源，再建置 `dist/`。
4. 驗證快照日期與實際更新時間、兩個來源皆有資料，以及 `public/data/announcements.json` 和 `dist/data/announcements.json` 一致。
5. 將 `dist/` 上傳為 Pages artifact，再部署至 GitHub Pages。

任一步抓取、測試、建置或資料驗證失敗，都跳過發布，維持上一次成功的線上版本。更新程式自身亦先寫臨時檔，全部資料有效後才更名替換 JSON。失敗不應透過 `continue-on-error` 或無條件發布繞過。

同一網站的發布使用固定 concurrency group，避免排程、推送與手動執行同時部署。建置使用讀取程式的權限，部署僅授予 Pages 發布與身份驗證所需權限；不需要每日提交資料，因此不用 `contents: write` 或個人存取權杖。Pages artifact 只保留 1 天，線上已發布版本會持續保留到下一次成功發布。

本節描述流程設定與操作方式，尚不代表首次雲端執行已通過驗證。需以 Actions 成功記錄與實際線上 JSON 確認發布結果。

## Pages 網址與資料位置

首次發布成功後使用：

[https://gyboy0503-droid.github.io/sleeoafk.github.io/](https://gyboy0503-droid.github.io/sleeoafk.github.io/)

此 repo 是專案 Pages，雲端建置環境設為 `VITE_BASE_PATH=/sleeoafk.github.io/`，由 Vite 設定讀取為 `base`。公告 hook 使用 `import.meta.env.BASE_URL` 讀取 `data/announcements.json`，因此線上資料位於：

[線上公告 JSON](https://gyboy0503-droid.github.io/sleeoafk.github.io/data/announcements.json)

每日更新不提交回 repo。儲存庫的 `public/data/announcements.json` 是初始備援資料，最新快照包含在成功發布的網站中；查看最新消息時，應以線上 JSON 的 `updatedAt` 為準。repo 的提交日期不等於資料更新時間。

一般本機建置不設定環境變數時，`base` 預設 `/`。需要在本機檢查 Pages 子路徑時，可先在該終端設定 `VITE_BASE_PATH=/sleeoafk.github.io/`，再建置與預覽；更換網站路徑時也需同步調整此值。[Vite Pages 部署規則](https://vite.dev/guide/static-deploy.html#github-pages)

## 手動更新與失敗處理

在儲存庫 Actions 頁面選取 `update-pages.yml` 對應工作流程，按 Run workflow，選 `main` 後執行。確認各步成功及 deployment 的網站連結，再查看頁面或線上 JSON 的實際更新時間。

若執行失敗，先查看哪個步驟失敗：校方來源離線或逾時可稍後重跑；測試、建置或資料驗證失敗需修正原因後再發布。不要把失敗當次的舊 repo 快照重新發布，以免覆蓋較新的線上資料。

首次雲端發布完成後，驗收應包含：兩來源都有公告、快照日期符合台灣日期、`updatedAt` 是本次抓取時間、來源與分類篩選可用、Pages 子路徑的程式及 JSON 載入成功。完成這些確認後，再停用原工作站的 Codex「活動獵人每日午夜更新」，避免重複排程。在確認雲端可用前，保留原本機維護方式。

## 排程限制與免費用量

公開儲存庫使用標準 GitHub-hosted runner 與 GitHub Pages 可採免費方案，本流程不使用 larger runner 或其他付費服務。Pages artifact 保留 1 天，控制暫存量；帳戶其他 Actions、Packages 或儲存用量仍應依其設定管理。[GitHub Actions 計費說明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

UTC 16:00 是開始排程的時間，抓取、建置與發布仍需耗時。GitHub 在整點負載高時可能延遲，部分排程可能漏跑，所以不保證 00:00 整立即發布成功。若公開 repo 連續 60 天沒有活動，GitHub 會自動停用排程，需要重新啟用；排程執行記錄本身不應被當作永遠保持活躍的保證。可定期檢查 Actions，若更新時間過舊，先重新啟用並手動執行。[GitHub 排程規則](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 資料範圍與保護

- 來源：[澎科大校網](https://www.npu.edu.tw/) 與 [圖書館最新消息](https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344)。
- 讀取兩頁上的公告連結及詳細頁，以公告編號去重，兩來源輪流選取，每次最多 24 則，含重新查閱的人工核實活動；不遍歷全部歷史分頁。
- 分為好康獎勵、講座活動、競賽徵件、校園公告、學習資源及實習職涯。分類依公告標題規則，一則公告可有多個分類。
- 已核實項目使用原創摘要；新公告保留校方標題並提供簡要分類提示。每張卡片都有原公告連結，資格與名額以原公告為準。
- 已知起日及截止日會依台灣日期重新判定；無法確定單一期限就標示「詳見公告」。報名截止不等於活動舉辦日期。
- 只讀取校方 HTTPS 網域；每個請求逾時 15 秒，詳頁最多 3 個同時連線。
- 任一來源、詳頁或資料驗證失敗，不覆蓋當次工作目錄的原 JSON；全部成功才以臨時檔原子更名替換。雲端失敗不發布，所以既有線上版本也保留。
- 頁面啟動、回到視窗及每 5 分鐘讀取本網站最新 JSON。瀏覽器不直接抓校方網站。資料讀取失敗保留當前內容與提示。
- 尚未取得 JSON 時使用隨程式附帶的核實資料，並顯示其實際整理日期；更新時間不以頁面開啟時間代替。

## 檔案對照

| 要求 | 主要檔案 |
| --- | --- |
| 雲端每日更新、驗證與 Pages 發布 | `.github/workflows/update-pages.yml` |
| 部署子路徑 | `vite.config.js`、環境變數 `VITE_BASE_PATH` |
| 固定導覽與動效開關 | `src/components/SiteNav.jsx` |
| 原創標題與情報票券主視覺 | `src/components/Hero.jsx` |
| 分類、來源、搜尋、空結果 | `src/components/AnnouncementFeed.jsx` |
| 系統減少動態與記住手動偏好 | `src/hooks/useMotionPreference.js` |
| 深色主題與版面樣式 | `src/styles/theme.css`、`src/styles.css` |
| 讀取最新資料與失敗備援 | `src/hooks/useAnnouncements.js` |
| 原始核實資料及來源 | `src/data/announcements.js` |
| 雙來源抓取與寫入 | `scripts/update-announcements.mjs` |
| 公告解析、去重、分類、狀態 | `src/lib/announcementParser.js` |
| 初始公開資料快照 | `public/data/announcements.json` |
| 進度 0–1 邊界測試 | `src/lib/motion.test.js` |
| 動效偏好政策測試 | `src/lib/motionPreference.test.js` |
| 抓取、解析、失敗保留與時區測試 | `src/lib/announcementParser.test.js` |

## 無障礙與視覺

提供跳到主要內容連結、明確的鍵盤焦點、帶名稱的搜尋及來源控制、篩選結果宣告。系統減少動態設定優先，手動關閉會立即同步頁面狀態並暫停裝飾動畫。主視覺以 CSS 與自製 SVG 組成，沒有使用真實品牌商標或產品圖片。

本機瀏覽器驗證與截圖存於 `.verification/`，不包含在正式網站建置中；既有本機驗證不取代雲端 Pages 發布後的實測。
