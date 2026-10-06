import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { validateSnapshot } from '../src/lib/announcementParser.js'
import { taipeiDate } from './update-announcements.mjs'

const startedAt = Date.parse(process.env.REFRESH_STARTED_AT)
assert(Number.isFinite(startedAt), '必須提供本次更新開始時間 REFRESH_STARTED_AT')

const publicBytes = await readFile(new URL('../public/data/announcements.json', import.meta.url))
const distBytes = await readFile(new URL('../dist/data/announcements.json', import.meta.url))
assert.deepEqual(distBytes, publicBytes, '發布資料必須與本次抓取資料完全一致')

const snapshot = validateSnapshot(JSON.parse(publicBytes.toString('utf8')))
const updatedAt = Date.parse(snapshot.updatedAt)
assert(updatedAt >= startedAt && updatedAt <= Date.now() + 60_000, '資料時間必須來自本次更新')
assert.equal(snapshot.snapshotDate, taipeiDate(new Date(updatedAt)), '整理日期必須對應台灣日期')
assert(snapshot.announcements.length <= 24, '每次最多整理 24 則公告')
assert.deepEqual(new Set(snapshot.sources.map((source) => source.id)), new Set(['university', 'library']), '必須包含兩個指定來源')
const counts = Object.fromEntries(snapshot.sources.map((source) => {
  const count = snapshot.announcements.filter((item) => item.sourceId === source.id).length
  assert(count > 0, `${source.id} 必須有公告資料`)
  return [source.id, count]
}))

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const base = process.env.VITE_BASE_PATH || '/'
assert(html.includes(`src="${base}assets/`), '建置資源必須使用發布位置的子路徑')
console.log(JSON.stringify({ updatedAt: snapshot.updatedAt, sources: counts, publicDistMatch: true, base }, null, 2))
