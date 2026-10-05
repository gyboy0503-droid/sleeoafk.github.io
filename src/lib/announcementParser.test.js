import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { announcementKey, announcementStatus, buildAnnouncement, classifyAnnouncement, isoDates, officialUrl, parseAnnouncementDetail, parseAnnouncementList, validateSnapshot } from './announcementParser.js'
import { fetchOfficialHtml, selectAnnouncements, taipeiDate, updateAnnouncements } from '../../scripts/update-announcements.mjs'

const sources = [
  { id: 'university', label: '澎科大校網', url: 'https://www.npu.edu.tw/' },
  { id: 'library', label: '圖書館', url: 'https://www.npu.edu.tw/lib/latestevent/index.aspx?Parser=9,41,397,344' },
]
const categories = ['all', 'rewards', 'talks', 'competitions', 'campus', 'resources', 'careers'].map((id) => ({ id, label: id }))
const now = new Date('2026-10-04T16:10:00.000Z')
const detail = '<div>公布日期：2026-10-02</div><p>活動內容請詳見附件</p>'
const homeUrl = 'https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,23,,,,14228'
const libraryUrl = 'https://www.npu.edu.tw/lib/latestevent/Details.aspx?Parser=9,41,397,344,,,14226'

// 以下小段取自 2026-10-04 下載的兩個官方清單；不依賴下載檔。
const homeHtml = `<footer>2026-12-31</footer><ul class="news_list">
  <li><span class="list_date ">2026-10-02</span><span class="list_date list_department">學務處</span>
    <span class="list_word"><a href="latestevent/Details.aspx?Parser=9,3,23,,,,14228" title="115年度「拼出澎湖之美~細品稅務風華」網路拼圖尋景租稅宣導活動">115年度「拼出澎湖之美~細品稅務風華」網路拼圖尋景租稅宣導...</a></span></li>
  <li><span class="list_date ">2026-10-02</span><a href="latestevent/Details.aspx?Parser=9,3,24,,,,14228">同一公告的另一分類</a></li>
</ul>`
const libraryHtml = `<ul class="list event"><li class="list_head"><span>公布日期</span></li>
  <li><span class="list_word w55 text_le"><a href="Details.aspx?Parser=9,41,397,344,,,14226" title="2026「紐約時報新鮮事」有獎徵答,自即日起至11月30止,歡迎本校師生踴躍參加!">2026「紐約時報新鮮事」有獎徵答,自即日起至11月30止,歡迎本校師生踴躍參加!</a></span>
    <span class="list_date w15 hidden-xs">圖書館</span><span class="list_date w10 hidden-xs">16</span><span class="list_date w20">2026-10-02</span></li></ul>`

function response(html = detail, status = 200, headers = {}) { return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } }) }
function fakeFetch(url) {
  if (url === sources[0].url) return Promise.resolve(response(homeHtml))
  if (url === sources[1].url) return Promise.resolve(response(libraryHtml))
  return Promise.resolve(response(detail))
}
async function temporaryOutput(t) {
  const directory = await mkdtemp(join(tmpdir(), 'npu-announcements-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return { directory, outputPath: join(directory, 'announcements.json') }
}

test('真實首頁列取完整 title、公布日期與網址，並以公告 id 去除跨分類重複', () => {
  const entries = parseAnnouncementList(homeHtml, sources[0])
  assert.equal(entries.length, 1)
  assert.equal(entries[0].title, '115年度「拼出澎湖之美~細品稅務風華」網路拼圖尋景租稅宣導活動')
  assert.equal(entries[0].publishedAt, '2026-10-02')
  assert.equal(entries[0].url, homeUrl)
  assert.equal(announcementKey(homeUrl), announcementKey('https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,24,,,,14228#body'))
})

test('真實圖書館列取最後日期欄，解析相對 Details.aspx 網址', () => {
  const entries = parseAnnouncementList(libraryHtml, sources[1])
  assert.equal(entries.length, 1)
  assert.equal(entries[0].url, libraryUrl)
  assert.equal(entries[0].publishedAt, '2026-10-02')
  assert.equal(entries[0].sourceId, 'library')
})

test('缺少公布日期時不把標題、頁腳或其他公告的日期當作日期', () => {
  const html = `<footer>2026-10-04</footer><li><a href="${homeUrl}">2026/10/20講座</a></li><li><span class="list_date">2026-10-03</span><a href="/latestevent/Details.aspx?Parser=9,3,23,,,,99999">另一則</a></li>`
  assert.equal(parseAnnouncementList(html, sources[0]).find((entry) => entry.url === homeUrl).publishedAt, null)
  assert.equal(parseAnnouncementDetail('<p>活動時間：2026-10-20</p><footer>2026-10-04</footer>').publishedAt, null)
})

test('只接受官方 HTTPS，拒絕其他主機、HTTP、登入資訊與埠', () => {
  for (const url of ['http://www.npu.edu.tw/', 'https://npu.edu.tw/', 'https://www.npu.edu.tw.evil.test/', 'https://user@www.npu.edu.tw/', 'https://www.npu.edu.tw:444/']) assert.throws(() => officialUrl(url), /不允許/)
  const entries = parseAnnouncementList(`<li><span class="list_date">2026-10-02</span><a href="https://evil.test/Details.aspx?Parser=123">假公告</a></li>`, sources[0])
  assert.deepEqual(entries, [])
  assert.deepEqual(parseAnnouncementList('<li><a href="/sub/form/Details.aspx?Parser=2,32,477,,,,2813">數位學習(另開視窗)</a></li>', sources[0]), [])
})

test('可解析民國日期，拒絕不存在的日期；截止須有明確標籤及完整年份', () => {
  assert.deepEqual(isoDates('115年10月9日、2026/10/31；2026-02-30'), ['2026-10-09', '2026-10-31'])
  assert.deepEqual(parseAnnouncementDetail('<div>公布日期：2026-10-02</div><p>報名截止日期：115年10月9日</p>'), { publishedAt: '2026-10-02', deadline: '2026-10-09' })
  assert.equal(parseAnnouncementDetail('<p>報名截止：10/09</p><p>公布日期：2026-10-02</p>').deadline, null)
  assert.equal(parseAnnouncementDetail('<p>公布日期：2026-10-02</p>').deadline, null)
  assert.equal(parseAnnouncementDetail('<p>報名截止：2026-10-08，另一場報名截止：2026-11-19</p>').deadline, null)
})

test('分類由公告標題判定；未知活動不推定期限或進行中', () => {
  assert.deepEqual(classifyAnnouncement('電子書閱讀抽獎活動', 'library'), ['rewards', 'resources'])
  assert.deepEqual(classifyAnnouncement('創業競賽', 'university'), ['competitions'])
  assert.deepEqual(classifyAnnouncement('職涯實習講座', 'university'), ['talks', 'careers'])
  assert.deepEqual(announcementStatus({ deadline: null }, '2026-10-04'), { status: 'check', statusLabel: '詳見公告' })
  assert.equal(announcementStatus({ deadline: '2026-10-09' }, '2026-10-04').status, 'check')
})

test('每天重新判定已截止及尚未開始；截止當天仍保留參加機會', () => {
  const dates = { startsAt: '2026-10-05', deadline: '2026-10-09' }
  assert.equal(announcementStatus(dates, '2026-10-04').status, 'upcoming')
  assert.equal(announcementStatus(dates, '2026-10-05').status, 'active')
  assert.equal(announcementStatus(dates, '2026-10-09').status, 'active')
  assert.equal(announcementStatus(dates, '2026-10-10').status, 'closed')
  assert.equal(announcementStatus({ title: '【得獎名單】閱讀抽獎' }, '2026-10-04').status, 'closed')
})

test('已核實摘要及期限可保留，舊 active 狀態不會保留；多場次 deadline:null 不會被覆寫', () => {
  const entry = parseAnnouncementList(homeHtml, sources[0])[0]
  const baseline = { ...entry, id: 'verified', title: '原創短標', summary: '原創摘要', categoryIds: ['rewards'], deadline: '2026-10-03', benefit: '抽獎機會', status: 'active' }
  const merged = buildAnnouncement(entry, { deadline: null }, baseline, '2026-10-04')
  assert.equal(merged.title, baseline.title)
  assert.equal(merged.summary, baseline.summary)
  assert.equal(merged.status, 'closed')
  assert.equal(buildAnnouncement(entry, { deadline: '2026-10-12' }, baseline, '2026-10-04').deadline, '2026-10-12')
  assert.equal(buildAnnouncement(entry, { deadline: '2026-10-12' }, { ...baseline, deadline: null }, '2026-10-04').deadline, null)
})

test('最多 24 筆、輪流分配兩個來源，已核實但不在清單中的活動仍需選入詳頁抓取', () => {
  const makeEntries = (source, offset) => Array.from({ length: 30 }, (_, i) => ({ id: `npu-${offset + i}`, title: `公告 ${i}`, publishedAt: '2026-10-02', sourceId: source.id, url: `https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,23,,,,${offset + i}` }))
  const baseline = [{ ...makeEntries(sources[1], 999)[0], title: '已核實舊活動' }]
  const selected = selectAnnouncements(sources.map((source, i) => ({ source, entries: makeEntries(source, i * 100 + 1) })), baseline)
  assert.equal(selected.length, 24)
  assert.equal(selected.filter((entry) => entry.sourceId === 'library').length, 12)
  assert.ok(selected.some((entry) => entry.title === '已核實舊活動'))
  assert.throws(() => selectAnnouncements([], [], 25), /24/)
})

test('所有時區都以台北日期判定每日狀態', () => {
  assert.equal(taipeiDate(new Date('2026-10-04T15:59:59Z')), '2026-10-04')
  assert.equal(taipeiDate(new Date('2026-10-04T16:00:00Z')), '2026-10-05')
})

test('任何列表、詳頁或資料驗證失敗，都保留上次 JSON 且不留臨時檔', async (t) => {
  const { directory, outputPath } = await temporaryOutput(t)
  const previous = '{"previous":"successful"}\n'
  const data = { sources, categories, announcements: [] }
  const failures = [
    (url) => url === sources[1].url ? Promise.resolve(response('', 503)) : fakeFetch(url),
    (url) => url === sources[1].url ? Promise.resolve(response('<p>清單為空</p>')) : fakeFetch(url),
    (url) => url === libraryUrl ? Promise.resolve(response('', 500)) : fakeFetch(url),
    (url) => url === sources[0].url ? Promise.resolve(response(`<li><a href="${homeUrl}">未知日期公告</a></li>`)) : url === homeUrl ? Promise.resolve(response('<p>無日期</p>')) : fakeFetch(url),
  ]
  for (const fetchImpl of failures) {
    await writeFile(outputPath, previous)
    await assert.rejects(updateAnnouncements({ data, now, outputPath, fetchImpl }))
    assert.equal(await readFile(outputPath, 'utf8'), previous)
    assert.deepEqual(await readdir(directory), ['announcements.json'])
  }
})

test('成功以完整快照取代 JSON；資料相同也更新 updatedAt，精選只挑一筆', async (t) => {
  const { directory, outputPath } = await temporaryOutput(t)
  const data = { sources, categories, announcements: [], sourceNotes: ['原創摘要'] }
  await writeFile(outputPath, '{"old":true}')
  const first = await updateAnnouncements({ data, now, outputPath, fetchImpl: fakeFetch })
  assert.equal(first.announcements.length, 2)
  assert.equal(first.announcements.filter((entry) => entry.featured).length, 1)
  assert.ok(first.announcements.find((entry) => entry.featured).categoryIds.includes('rewards'))
  assert.ok(first.announcements.every((entry) => entry.deadline === null && entry.status === 'check'))
  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), first)
  assert.deepEqual(await readdir(directory), ['announcements.json'])
  const second = await updateAnnouncements({ data, now: new Date(now.getTime() + 60_000), outputPath, fetchImpl: fakeFetch })
  assert.notEqual(second.updatedAt, first.updatedAt)
  assert.deepEqual(second.announcements, first.announcements)
})

test('校方重新導向不能離開官方主機，逾時會終止 fetch', async () => {
  let calls = 0
  await assert.rejects(fetchOfficialHtml(sources[0].url, { fetchImpl: async () => { calls += 1; return response('', 302, { location: 'https://evil.test/' }) } }), /不允許/)
  assert.equal(calls, 1)
  await assert.rejects(fetchOfficialHtml(sources[0].url, { timeoutMs: 10, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }) }) }), /逾時/)
})

test('詳頁抓取最多三個並行，所有已核實活動都確實重新抓取', async (t) => {
  const { outputPath } = await temporaryOutput(t)
  let active = 0
  let peak = 0
  const seen = new Set()
  const baseline = Array.from({ length: 8 }, (_, i) => ({ id: `verified-${i}`, title: '電子書抽獎', summary: '原創摘要', sourceId: i % 2 ? 'library' : 'university', categoryIds: ['rewards'], publishedAt: '2026-08-01', startsAt: '2026-08-01', deadline: '2026-10-31', benefit: null, featured: i === 1, url: `https://www.npu.edu.tw/latestevent/Details.aspx?Parser=9,3,23,,,,${9000 + i}` }))
  const fetchImpl = async (url) => {
    if (sources.some((source) => source.url === url)) return fakeFetch(url)
    seen.add(url)
    active += 1
    peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 10))
    active -= 1
    return response(detail)
  }
  const snapshot = await updateAnnouncements({ data: { sources, categories, announcements: baseline }, now, outputPath, fetchImpl })
  assert.equal(peak, 3)
  assert.ok(baseline.every((entry) => seen.has(entry.url)))
  assert.equal(snapshot.announcements.find((entry) => entry.featured).id, 'verified-1')
  assert.ok(snapshot.announcements.filter((entry) => entry.id.startsWith('verified-')).every((entry) => entry.status === 'active'))
})

test('快照校驗拒絕不完整或重複資料', () => {
  const item = buildAnnouncement(parseAnnouncementList(homeHtml, sources[0])[0], {}, null, '2026-10-04')
  item.featured = true
  const snapshot = { sources, categories, announcements: [item], snapshotDate: '2026-10-04', updatedAt: now.toISOString() }
  assert.equal(validateSnapshot(snapshot), snapshot)
  assert.throws(() => validateSnapshot({ ...snapshot, announcements: [item, item] }), /重複/)
  assert.throws(() => validateSnapshot({ ...snapshot, announcements: [{ ...item, publishedAt: null }] }), /日期未確認/)
  assert.throws(() => validateSnapshot({ ...snapshot, announcements: [{ ...item, deadline: '2026-10-03', status: 'active' }] }), /已截止/)
})
