// 人工核對的首份資料；每日更新器會保留這些原創摘要與已確認條件。
export const snapshotDate = '2026-10-04'

export const sources = [
  { id: 'university', label: '澎科大校網', url: 'https://www.npu.edu.tw/' },
  { id: 'library', label: '圖書館', url: 'https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344' },
]

export const categories = [
  { id: 'all', label: '全部情報' },
  { id: 'rewards', label: '好康獎勵' },
  { id: 'talks', label: '講座活動' },
  { id: 'competitions', label: '競賽徵件' },
  { id: 'campus', label: '校園公告' },
  { id: 'resources', label: '學習資源' },
  { id: 'careers', label: '實習職涯' },
]

export const announcements = [
  {
    id: 'university-14228',
    title: '拼出澎湖地圖，完成任務換限量好禮',
    summary: '10 月 5 日起，完成線上拼圖與答題，再捐贈符合條件的雲端發票，即可依活動辦法兌換限量好禮。出發前先確認發票張數與剩餘名額。',
    publishedAt: '2026-10-02',
    categoryIds: ['rewards', 'campus'],
    sourceId: 'university',
    url: 'https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,23,,,,14228',
    benefit: '限量贈禮｜須完成任務並捐贈指定雲端發票',
    startsAt: '2026-10-05',
    deadline: '2026-11-04',
    status: 'upcoming',
    statusLabel: '10/05 開始',
    featured: false,
  },
  {
    id: 'university-14164',
    title: '實習之前，先把自己的勞動權益弄懂',
    summary: '10 月 14 日 13:20 在實驗大樓演講廳，從實習契約談到工時、薪資、保險與職場安全。想參加的同學，記得在 10 月 9 日前報名。',
    publishedAt: '2026-09-30',
    categoryIds: ['talks', 'careers'],
    sourceId: 'university',
    url: 'https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,24,,,,14164',
    benefit: null,
    deadline: '2026-10-09',
    status: 'active',
    statusLabel: '報名中',
    featured: false,
  },
  {
    id: 'library-13917',
    title: '九月電子書閱讀活動，借閱也能累積獎勵',
    summary: '這場活動已於 9 月 30 日結束。當時借閱累計達 20 冊可參加抽獎，借閱排名另有獎勵；保留公告供同學查閱辦法與後續訊息。',
    publishedAt: '2026-08-26',
    categoryIds: ['rewards', 'resources'],
    sourceId: 'library',
    url: 'https://www.npu.edu.tw/lib/latestevent/Details.aspx?Parser=9,41,397,344,,,13917',
    benefit: '活動已結束｜原訂百元禮券抽獎與借閱排名獎勵',
    deadline: '2026-09-30',
    status: 'closed',
    statusLabel: '活動已結束',
    featured: false,
  },
  {
    id: 'library-13949',
    title: '把閱讀變成抽獎機會，電子書任務開跑',
    summary: '「E 遊味盡」開放聯盟成員館的在校師生參加。完成指定資訊閱讀，或分享符合規定的電子書讀後觀點，就能依活動辦法爭取抽獎機會。',
    publishedAt: '2026-08-24',
    categoryIds: ['rewards', 'resources'],
    sourceId: 'library',
    url: 'https://www.npu.edu.tw/lib/latestevent/Details.aspx?Parser=9,41,397,344,,,13949',
    benefit: '抽獎活動｜獎項與資格見原公告',
    startsAt: '2026-08-24',
    deadline: '2026-10-31',
    status: 'active',
    statusLabel: '活動進行中',
    featured: true,
  },
  {
    id: 'library-13928',
    title: '論文比對怎麼用？學生版線上課帶你操作',
    summary: 'Turnitin 學生版訓練提供 10 月 15 日、11 月 26 日兩場，擇一參加即可。分別在 10 月 8 日、11 月 19 日 23:59 截止報名，請依場次查看連結。',
    publishedAt: '2026-08-13',
    categoryIds: ['resources', 'talks'],
    sourceId: 'library',
    url: 'https://www.npu.edu.tw/lib/latestevent/Details.aspx?Parser=9,41,397,344,,,13928',
    benefit: null,
    deadline: null,
    status: 'check',
    statusLabel: '分場報名，詳見公告',
    featured: false,
  },
]

export const sourceNotes = [
  '上述五筆公告於 2026-10-04 核對校方原頁；摘要為活動獵人重新整理。',
  '公告日期與活動截止日分開記錄。無單一截止日的多場次活動不推定截止日，請看原公告。',
  '抽獎不代表保證獲獎；資格、名額、贈品與活動異動，以校方及主辦單位最新公告為準。',
]
