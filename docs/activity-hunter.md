# 活動獵人：頁面與每日更新

本專案是面向澎科大學生的原創校園情報網站。原工作站的副本位於 `E:\npu\islandlight-starter`；下載後可放在其他專案目錄。

## 啟動與維護

```powershell
npm ci
npm run dev
```

手動更新資料並建立網站：

```powershell
npm run refresh
```

只抓資料可使用 `npm run update:data`；測試使用 `npm test`；建置使用 `npm run build`。測試使用 Node 內建測試功能，沒有額外測試庫。

## 午夜更新

原工作站已在 Codex 建立並啟用「活動獵人每日午夜更新」，每天 **00:00，Asia/Taipei** 執行 `npm run refresh`，由該工作站的 Codex 排程介面管理。這是工作站維護紀錄；clone 此專案不會移轉排程，上傳 GitHub 本身也不會自動抓取或發佈更新。

這是本機排程：電腦與 Codex 必須運作，E: 磁碟與網路必須可用。電腦關機、休眠、磁碟離線或網路核准被阻擋時，無法保證準時更新。若日後要在電腦關機時仍更新公開網站，需要將同一更新指令放到部署主機的排程並接上發佈流程。

每次排程驗證兩來源都有資料、更新時間正確、建置成功，且 `dist/data/announcements.json` 與 `public/data/announcements.json` 相符。有需要處理的失敗才通知。排程啟用已確認，第一次午夜自動執行仍需到排程時間才會發生；目前已手動完成一次同樣的更新流程。

## 資料範圍與保護

- 來源：[澎科大校網](https://www.npu.edu.tw/) 與 [圖書館最新消息](https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344)。
- 讀取兩頁上的公告連結及詳細頁，以公告編號去重，兩來源輪流選取，每次最多 24 則，含重新查閱的人工核實活動；不遍歷全部歷史分頁。
- 分為好康獎勵、講座活動、競賽徵件、校園公告、學習資源及實習職涯。分類依公告標題規則，一則公告可有多個分類。
- 已核實項目使用原創摘要；新公告保留校方標題並提供簡要分類提示。每張卡片都有原公告連結，資格與名額以原公告為準。
- 已知起日及截止日會依台灣日期重新判定；無法確定單一期限就標示「詳見公告」。報名截止不等於活動舉辦日期。
- 只讀取校方 HTTPS 網域；每個請求逾時 15 秒，詳頁最多 3 個同時連線。
- 任一來源、詳頁或資料驗證失敗，不覆蓋上一份成功 JSON；全部成功才以臨時檔原子更名替換。
- 頁面啟動、回到視窗及每 5 分鐘讀取本網站最新 JSON。瀏覽器不直接抓校方網站。資料讀取失敗保留當前內容與提示。
- 尚未取得 JSON 時使用隨程式附帶的核實資料，並顯示其實際整理日期；更新時間不以頁面開啟時間代替。

## 檔案對照

| 要求 | 主要檔案 |
| --- | --- |
| 固定導覽與動效開關 | `src/components/SiteNav.jsx` |
| 原創標題與情報票券主視覺 | `src/components/Hero.jsx` |
| 分類、來源、搜尋、空結果 | `src/components/AnnouncementFeed.jsx` |
| 系統減少動態與記住手動偏好 | `src/hooks/useMotionPreference.js` |
| 深色主題與版面樣式 | `src/styles/theme.css`、`src/styles.css` |
| 讀取最新資料與失敗備援 | `src/hooks/useAnnouncements.js` |
| 原始核實資料及來源 | `src/data/announcements.js` |
| 雙來源抓取與寫入 | `scripts/update-announcements.mjs` |
| 公告解析、去重、分類、狀態 | `src/lib/announcementParser.js` |
| 公開資料快照 | `public/data/announcements.json` |
| 進度 0–1 邊界測試 | `src/lib/motion.test.js` |
| 動效偏好政策測試 | `src/lib/motionPreference.test.js` |
| 抓取、解析、失敗保留與時區測試 | `src/lib/announcementParser.test.js` |

## 無障礙與視覺

提供跳到主要內容連結、明確的鍵盤焦點、帶名稱的搜尋及來源控制、篩選結果宣告。系統減少動態設定優先，手動關閉會立即同步頁面狀態並暫停裝飾動畫。主視覺以 CSS 與自製 SVG 組成，沒有使用真實品牌商標或產品圖片。

瀏覽器驗證與截圖存於 `.verification/`，不包含在正式網站建置中；動效測試 fixture 模擬一般系統偏好，真實系統減少動態另外在正式頁面驗證。
