# 活動獵人

為澎湖科技大學學生整理校園消息的原創概念網站，以 Vite、React 與 Tailwind CSS 建置。核心句：「禮券甚麼好康的都給我來。」

## 在本機啟動

使用 Node.js 22 或以上版本。在此檔案所在的專案目錄執行：

```sh
npm ci
npm run dev
```

依畫面顯示的本機網址開啟網站。

## 檢查與建置

```sh
npm test
npm run build
npm run preview
```

測試使用 Node 內建功能，涵蓋捲動進度 0–1 邊界、動效偏好，以及公告解析與更新失敗時保留資料。一般本機建置的 `base` 預設為 `/`。

## 雲端每日更新與發布

雲端流程定義於 [update-pages.yml](.github/workflows/update-pages.yml)，在公開儲存庫使用標準 `ubuntu-latest` 與 Node.js 22：

- 每日 UTC 16:00 排程，對應台灣時間下一日 00:00。
- 推送至 `main` 時更新，也可在 Actions 頁面手動執行；發布只允許 `main`。
- 依序安裝依賴、執行測試、抓取雙來源並建置，驗證快照日期、兩來源資料與公開／建置 JSON 一致後，才發布至 GitHub Pages。
- 抓取、測試、建置或驗證失敗時跳過發布，保留上一次成功的線上版本。
- Pages artifact 只保留 1 天；已發布的網站不會因 artifact 到期而刪除。

首次發布成功後的網站網址為：

[活動獵人 GitHub Pages](https://gyboy0503-droid.github.io/sleeoafk.github.io/)

此儲存庫使用專案 Pages 路徑，雲端建置設定 `VITE_BASE_PATH=/sleeoafk.github.io/`。首頁與公告 JSON 皆沿用這個 `base`，避免資源載入到錯誤目錄。

**每日資料直接發布到網站，不會每日提交回儲存庫。** Repo 內的 `public/data/announcements.json` 是初始備援快照；目前最新資料與實際 `updatedAt` 請查看線上網站。

這份文件描述設定與操作方式；雲端是否已可用，應以 Actions 成功記錄及線上資料驗證為準。確認首次雲端更新與發布成功後，再停用原工作站的 Codex 本機午夜排程。

## 手動更新

在本機執行：

```sh
npm run refresh
```

此指令讀取[澎科大校網](https://www.npu.edu.tw/)與[圖書館最新消息](https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344)，合併分類後寫入 `public/data/announcements.json`，再建置網站。

雲端手動更新：在儲存庫 Actions 頁面選取 `update-pages.yml` 對應工作流程，按 Run workflow 並選擇 `main`。等待抓取、驗證及部署皆成功，再查看網站顯示的更新時間。

每次最多整理 24 則公告，兩來源輪流選取。原創摘要與提示不取代校方辦法；資格、期限及獎項請查看卡片連結的原公告。

## 排程與免費用量

公開儲存庫使用標準 GitHub-hosted runner 與 GitHub Pages，可採免費方案；此流程不使用付費 larger runner，也不需要額外 API 金鑰。保留短期 Pages artifact，避免不必要的儲存累積。[GitHub Actions 計費說明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

GitHub 排程可能在整點壅塞時延遲或漏跑，不能保證精準在 00:00 完成。若公開儲存庫連續 60 天沒有活動，排程可能自動停用，需回 Actions 頁面重新啟用。錯過排程或抓取失敗時，可手動重跑；工作流程必須存在於預設分支，排程只執行預設分支。[GitHub 排程規則](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 頁面功能

- 固定導覽、原創情報票券主視覺與深色主題。
- 公告分類、來源篩選、關鍵字搜尋及空結果重設。
- 動效可以關閉並記住偏好，系統減少動態設定優先。
- 顯示資料更新時間，並連結每則原公告。

詳細檔案對照、資料保護與維護方式請看 [維護說明](docs/activity-hunter.md)。建置輸出在 `dist/`；改用其他部署網址時，請同步設定 `VITE_BASE_PATH`。
