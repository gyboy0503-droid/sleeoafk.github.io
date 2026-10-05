const allowedHost = 'www.npu.edu.tw'
const categoryIds = ['rewards', 'talks', 'competitions', 'campus', 'resources', 'careers']
const datePattern = /(?<!\d)(\d{3,4})\s*(?:年|[-/.])\s*(\d{1,2})\s*(?:月|[-/.])\s*(\d{1,2})\s*日?(?!\d)/g

export function decodeHtml(value = '') {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', hellip: '…', ndash: '–', mdash: '—' }
  return String(value).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] !== '#') return entities[name.toLowerCase()] ?? entity
    const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
  })
}

export function htmlText(html = '') {
  return decodeHtml(String(html).replace(/<!--[^]*?-->/g, '').replace(/<(script|style|noscript)\b[^>]*>[^]*?<\/\1\s*>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function attribute(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? '')
}

export function officialUrl(value, base = 'https://www.npu.edu.tw/') {
  const url = new URL(decodeHtml(value), base)
  if (url.protocol !== 'https:' || url.hostname !== allowedHost || url.port || url.username || url.password) throw new Error(`不允許的公告網址：${url.origin}`)
  url.hash = ''
  return url.href
}

export function announcementKey(value) {
  const url = new URL(officialUrl(value))
  const parser = [...url.searchParams].find(([name]) => name.toLowerCase() === 'parser')?.[1]
  const id = parser?.split(',').filter(Boolean).at(-1)
  // 同一公告會出現在不同分類清單，Parser 最後一段才是公告編號。
  if (/\/details\.aspx$/i.test(url.pathname) && /^\d+$/.test(id ?? '')) return `npu-${id}`
  url.searchParams.sort()
  return url.href
}

export function isoDates(text) {
  const dates = []
  for (const match of String(text).matchAll(datePattern)) {
    let year = Number(match[1])
    if (year < 200) year += 1911
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day))
    if (year < 1900 || year > 2200 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) continue
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  return dates
}

export function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isoDates(value)[0] === value
}

function rowPublishedAt(html) {
  for (const match of html.matchAll(/<(span|td|time)\b([^>]*)>([^]*?)<\/\1\s*>/gi)) {
    const classes = attribute(match[2], 'class')
    const datetime = attribute(match[2], 'datetime')
    if (datetime && isIsoDate(datetime.slice(0, 10))) return datetime.slice(0, 10)
    if (!/(?:^|\s)(?:list_date|date|published|publish-date)(?:\s|$)/i.test(classes)) continue
    const date = isoDates(htmlText(match[3]))[0]
    if (date) return date
  }
  // 日期只從該公告列、且排除標題取得，不能取頁腳或活動標題中的日期。
  return isoDates(htmlText(html.replace(/<a\b[^>]*>[^]*?<\/a\s*>/gi, '')))[0] ?? null
}

export function parseAnnouncementList(html, source) {
  officialUrl(source.url)
  const rows = [...String(html).matchAll(/<(li|tr)\b[^>]*>([^]*?)<\/\1\s*>/gi)].map((match) => match[2])
  const entries = new Map()
  for (const row of rows) {
    const publishedAt = rowPublishedAt(row)
    for (const match of row.matchAll(/<a\b([^>]*)>([^]*?)<\/a\s*>/gi)) {
      const href = attribute(match[1], 'href')
      if (!/Details\.aspx(?:\?|$)/i.test(href)) continue
      let url
      try { url = officialUrl(href, source.url) } catch { continue }
      if (!/\/latestevent\/Details\.aspx$/i.test(new URL(url).pathname)) continue
      const title = htmlText(attribute(match[1], 'title') || match[2])
      if (!title) continue
      const key = announcementKey(url)
      const entry = { id: key, title, url, sourceId: source.id, publishedAt }
      if (!entries.has(key) || (!entries.get(key).publishedAt && publishedAt)) entries.set(key, entry)
    }
  }
  return [...entries.values()].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

export function parseAnnouncementDetail(html) {
  const text = htmlText(html)
  const fullDate = '(\\d{3,4}\\s*(?:年|[-/.])\\s*\\d{1,2}\\s*(?:月|[-/.])\\s*\\d{1,2}\\s*日?)'
  const published = text.match(new RegExp(`(?:發布|發佈|公布|公告|刊登|張貼)(?:日期|時間)\\s*[:：]?\\s*${fullDate}`))
  const deadlines = []
  for (const match of text.matchAll(new RegExp(`(?:報名截止(?:日期|時間)?|申請截止(?:日期|時間)?|收件截止(?:日期|時間)?|截止報名(?:日期|時間)?|截止日期|截止時間|報名至|申請至)\\s*[:：為]?\\s*(?:為|至|於|是)?\\s*${fullDate}`, 'g'))) {
    const date = isoDates(match[1])[0]
    if (date) deadlines.push(date)
  }
  const distinct = [...new Set(deadlines)]
  return { publishedAt: published ? isoDates(published[1])[0] ?? null : null, deadline: distinct.length === 1 ? distinct[0] : null }
}

export function classifyAnnouncement(title, sourceId) {
  const result = []
  if (/禮券|禮物|贈禮|好禮|獎勵|抽獎|有獎|獎金|補助|助學金|獎學金/.test(title)) result.push('rewards')
  if (/講座|研習|工作坊|演講|訓練|說明會|座談|課程|電影院/.test(title)) result.push('talks')
  if (/競賽|比賽|徵件|徵文|創業競賽/.test(title)) result.push('competitions')
  if (/實習|徵才|職涯|就業|職缺|招聘|誠徵|勞動權益|遴選/.test(title)) result.push('careers')
  if (/電子書|閱讀|資料庫|圖書|借閱|教科書|試用|Turnitin|eBOOK|FUNDAY|新書|電子雜誌/i.test(title) || sourceId === 'library') result.push('resources')
  return result.length ? result : ['campus']
}

const summaries = {
  rewards: '這則消息包含獎勵或補助線索。參加前請查看原公告，確認資格、名額、任務條件與獎項辦法。',
  talks: '校方整理了一場活動或學習機會。時間、地點、報名方式與參加資格，請以原公告為準。',
  competitions: '有新的競賽或徵件機會。準備作品前，請先確認主題、參加資格、繳交方式與截止時間。',
  campus: '這是一則校園最新消息。需要辦理的事項、適用對象與相關時程，請進入原公告確認。',
  resources: '這則消息提供閱讀或學習資源。使用方式、開放對象與可使用期間，請查看原公告。',
  careers: '校方提供了職涯或實習相關消息。申請條件、工作內容、所需資料與辦理時程，請查看原公告。',
}

export function announcementStatus({ deadline, startsAt, title = '' }, today) {
  if (deadline && deadline < today) return { status: 'closed', statusLabel: '已截止' }
  if (/得獎名單|獲獎名單|中獎名單|活動已結束|已截止/.test(title)) return { status: 'closed', statusLabel: '活動已結束' }
  if (startsAt && startsAt > today) return { status: 'upcoming', statusLabel: `${startsAt.slice(5).replace('-', '/')} 開始` }
  if (startsAt && deadline && startsAt <= today && today <= deadline) return { status: 'active', statusLabel: '活動進行中' }
  return { status: 'check', statusLabel: '詳見公告' }
}

export function buildAnnouncement(entry, detail, baseline, today) {
  const categories = baseline?.categoryIds?.filter((id) => categoryIds.includes(id)) ?? classifyAnnouncement(entry.title, entry.sourceId)
  // 人工確認的 null 代表沒有單一截止日（例如多場次），不能猜成其中一場。
  const deadline = baseline && Object.hasOwn(baseline, 'deadline') && baseline.deadline === null ? null : detail.deadline ?? baseline?.deadline ?? null
  const startsAt = baseline?.startsAt ?? null
  const title = baseline?.title || entry.title
  const status = announcementStatus({ deadline, startsAt, title: entry.title }, today)
  return {
    id: baseline?.id || entry.id,
    title,
    summary: baseline?.summary || summaries[categories[0]],
    categoryIds: categories,
    sourceId: entry.sourceId,
    url: entry.url,
    publishedAt: entry.publishedAt || detail.publishedAt || baseline?.publishedAt || null,
    startsAt,
    deadline: deadline ?? null,
    ...status,
    benefit: baseline?.benefit ?? null,
    featured: false,
  }
}

export function validateSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.sources) || !Array.isArray(snapshot.categories) || !Array.isArray(snapshot.announcements) || !snapshot.announcements.length) throw new Error('公告快照缺少必要資料或清單為空')
  if (!isIsoDate(snapshot.snapshotDate) || typeof snapshot.updatedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.updatedAt))) throw new Error('快照更新日期格式錯誤')
  const sources = new Set()
  for (const source of snapshot.sources) {
    if (!source.id || !source.label || sources.has(source.id)) throw new Error('公告來源設定錯誤')
    officialUrl(source.url)
    sources.add(source.id)
  }
  const categories = new Set(snapshot.categories.map((category) => category.id))
  const ids = new Set()
  const keys = new Set()
  for (const entry of snapshot.announcements) {
    const key = announcementKey(entry.url)
    if (!entry.id || ids.has(entry.id) || keys.has(key)) throw new Error('公告編號或網址重複')
    if (!entry.title || typeof entry.title !== 'string' || !entry.summary || typeof entry.summary !== 'string' || !sources.has(entry.sourceId)) throw new Error('公告標題、摘要或來源不完整')
    if (!Array.isArray(entry.categoryIds) || !entry.categoryIds.length || entry.categoryIds.some((id) => !categoryIds.includes(id) || !categories.has(id))) throw new Error('公告分類錯誤')
    if (!isIsoDate(entry.publishedAt) || (entry.deadline !== null && !isIsoDate(entry.deadline)) || (entry.startsAt != null && !isIsoDate(entry.startsAt))) throw new Error(`公告日期未確認：${entry.id}`)
    if (!['active', 'upcoming', 'closed', 'check'].includes(entry.status) || typeof entry.statusLabel !== 'string' || typeof entry.featured !== 'boolean' || (entry.benefit !== null && typeof entry.benefit !== 'string')) throw new Error('公告狀態格式錯誤')
    if (entry.deadline && entry.deadline < snapshot.snapshotDate && entry.status !== 'closed') throw new Error('已截止公告的狀態錯誤')
    ids.add(entry.id)
    keys.add(key)
  }
  if (snapshot.announcements.filter((entry) => entry.featured).length !== 1) throw new Error('快照必須有一筆精選公告')
  return snapshot
}
