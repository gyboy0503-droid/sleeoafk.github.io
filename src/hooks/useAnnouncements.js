import { useEffect, useState } from 'react'
import * as initial from '../data/announcements.js'

function validSnapshot(data) {
  const officialUrl = (value) => {
    try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'www.npu.edu.tw' } catch { return false }
  }
  const dateOnly = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
  if (!data || !Array.isArray(data.sources) || !Array.isArray(data.categories) || !Array.isArray(data.announcements) || !data.announcements.length || !dateOnly(data.snapshotDate) || !Number.isFinite(Date.parse(data.updatedAt))) return false
  if (!data.sources.length || !data.sources.every((item) => item && typeof item.id === 'string' && typeof item.label === 'string' && officialUrl(item.url))) return false
  if (!data.categories.length || !data.categories.every((item) => item && typeof item.id === 'string' && typeof item.label === 'string')) return false
  const sourceIds = new Set(data.sources.map((item) => item.id))
  const categoryIds = new Set(data.categories.map((item) => item.id))
  const announcementIds = new Set()
  return data.announcements.every((item) => {
    if (!item || typeof item.id !== 'string' || announcementIds.has(item.id) || typeof item.title !== 'string' || !item.title.trim() || typeof item.summary !== 'string' || !Array.isArray(item.categoryIds) || !item.categoryIds.length || !item.categoryIds.every((id) => categoryIds.has(id)) || !sourceIds.has(item.sourceId) || !dateOnly(item.publishedAt) || (item.deadline != null && !dateOnly(item.deadline)) || (item.benefit != null && typeof item.benefit !== 'string') || typeof item.statusLabel !== 'string' || !['active', 'closed', 'check', 'upcoming'].includes(item.status) || !officialUrl(item.url)) return false
    announcementIds.add(item.id)
    return true
  })
}

export function useAnnouncements() {
  const [data, setData] = useState({ ...initial, updatedAt: null, updateError: false })
  useEffect(() => {
    let active = true
    let inFlight = false
    const controller = new AbortController()
    async function refresh() {
      if (inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/announcements.json`, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('資料暫時無法取得')
        const snapshot = await response.json()
        if (!validSnapshot(snapshot)) throw new Error('公告資料不完整')
        if (active) setData({ ...snapshot, updateError: false })
      } catch (error) {
        if (active && error.name !== 'AbortError') setData((current) => ({ ...current, updateError: true }))
      } finally { inFlight = false }
    }
    refresh()
    const timer = window.setInterval(refresh, 5 * 60 * 1000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return data
}
