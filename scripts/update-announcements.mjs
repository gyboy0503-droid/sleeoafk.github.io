import { mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { announcementKey, buildAnnouncement, officialUrl, parseAnnouncementDetail, parseAnnouncementList, validateSnapshot } from '../src/lib/announcementParser.js'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const expectedLists = ['https://www.npu.edu.tw/', 'https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344']

export function taipeiDate(now) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function fetchOfficialHtml(value, { fetchImpl = globalThis.fetch, timeoutMs = 15_000 } = {}) {
  let url = officialUrl(value)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('抓取逾時')), timeoutMs)
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      const response = await fetchImpl(url, { signal: controller.signal, redirect: 'manual', headers: { 'User-Agent': 'ActivityHunter/1.0 (NPU public announcements)', Accept: 'text/html' } })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects === 3) throw new Error('重新導向次數過多')
        const location = response.headers.get('location')
        if (!location) throw new Error('重新導向缺少網址')
        url = officialUrl(location, url)
        continue
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (response.url) officialUrl(response.url)
      const contentType = response.headers.get('content-type')
      if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) throw new Error('來源回傳的格式不是 HTML')
      const html = await response.text()
      if (!html.trim()) throw new Error('來源回傳空頁面')
      return html
    }
    throw new Error('無法取得公告頁面')
  } catch (error) {
    throw new Error(`抓取失敗 ${url}：${error.message}`, { cause: error })
  } finally { clearTimeout(timeout) }
}

export function selectAnnouncements(lists, baseline, maximum = 24) {
  if (!Number.isInteger(maximum) || maximum < lists.length || maximum > 24) throw new Error('公告數量上限須為來源數量至 24 筆')
  const pools = lists.map(({ source, entries }) => {
    // 重新讀取已核實詳頁，保留仍值得查看、可能已不在最新一頁的活動。
    const verified = baseline.filter((entry) => entry.sourceId === source.id)
    const listed = new Map(entries.map((entry) => [announcementKey(entry.url), entry]))
    const seen = new Set()
    return [...verified.map((entry) => listed.get(announcementKey(entry.url)) ?? entry), ...entries].filter((entry) => {
      const key = announcementKey(entry.url)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })
  const selected = []
  const seen = new Set()
  while (selected.length < maximum && pools.some((pool) => pool.length)) {
    for (const pool of pools) {
      let entry
      while (pool.length && !entry) {
        const candidate = pool.shift()
        const key = announcementKey(candidate.url)
        if (seen.has(key)) continue
        seen.add(key)
        entry = candidate
      }
      if (entry) selected.push(entry)
      if (selected.length === maximum) break
    }
  }
  return selected
}

async function mapConcurrent(items, concurrency, callback) {
  const output = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      output[index] = await callback(items[index])
    }
  }))
  return output
}

async function atomicWrite(outputPath, snapshot) {
  await mkdir(dirname(outputPath), { recursive: true })
  const temporaryPath = `${outputPath}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, outputPath)
  } finally { await unlink(temporaryPath).catch((error) => { if (error.code !== 'ENOENT') throw error }) }
}

export async function updateAnnouncements({ data, now = new Date(), outputPath = resolve(projectRoot, 'public/data/announcements.json'), fetchImpl = globalThis.fetch, timeoutMs = 15_000, concurrency = 3, maximum = 24 } = {}) {
  const configuration = data ?? await import('../src/data/announcements.js')
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw new Error('詳頁抓取同時連線數須為 1 至 3')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(now.getTime())) throw new Error('抓取逾時或更新時間設定錯誤')
  const sources = configuration.sources
  if (!Array.isArray(sources) || sources.length !== 2 || expectedLists.some((url) => !sources.some((source) => officialUrl(source.url) === officialUrl(url)))) throw new Error('必須設定指定的校網與圖書館兩個來源')
  const lists = await Promise.all(sources.map(async (source) => {
    const html = await fetchOfficialHtml(source.url, { fetchImpl, timeoutMs })
    const entries = parseAnnouncementList(html, source)
    if (!entries.length) throw new Error(`來源公告清單為空：${source.label}`)
    return { source, entries }
  }))
  const baseline = configuration.announcements ?? []
  const verified = new Map(baseline.map((entry) => [announcementKey(entry.url), entry]))
  const entries = selectAnnouncements(lists, baseline, maximum)
  const today = taipeiDate(now)
  const announcements = await mapConcurrent(entries, concurrency, async (entry) => {
    const html = await fetchOfficialHtml(entry.url, { fetchImpl, timeoutMs })
    return buildAnnouncement(entry, parseAnnouncementDetail(html), verified.get(announcementKey(entry.url)), today)
  })
  announcements.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  const rewards = announcements.filter((entry) => entry.categoryIds.includes('rewards') && entry.status !== 'closed')
  const featured = rewards.find((entry) => entry.status === 'active' && verified.get(announcementKey(entry.url))?.featured) ?? rewards.find((entry) => entry.status === 'active') ?? rewards[0] ?? announcements[0]
  if (featured) featured.featured = true
  const snapshot = validateSnapshot({ sources, categories: configuration.categories, announcements, snapshotDate: today, updatedAt: now.toISOString(), sourceNotes: configuration.sourceNotes ?? [] })
  await atomicWrite(outputPath, snapshot)
  return snapshot
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const snapshot = await updateAnnouncements()
    console.log(`公告更新成功：${snapshot.announcements.length} 筆；更新時間 ${snapshot.updatedAt}`)
  } catch (error) {
    console.error(`公告更新失敗，保留上一次成功資料：${error.message}`)
    process.exitCode = 1
  }
}
