import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isMotionEnabled, parseMotionPreference } from '../lib/motionPreference.js'

const STORAGE_KEY = 'activity-hunter:motion'
const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function readPreference() {
  if (typeof window === 'undefined') return null

  try {
    return parseMotionPreference(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function readMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null

  try {
    return window.matchMedia(MEDIA_QUERY)
  } catch {
    return null
  }
}

function syncDocument(preference, systemReduced) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.motion = isMotionEnabled(preference, systemReduced) ? 'on' : 'off'
}

export function useMotionPreference() {
  const [settings, setSettings] = useState(() => ({
    preference: readPreference(),
    systemReduced: readMediaQuery()?.matches ?? false,
  }))
  const settingsRef = useRef(settings)
  const { preference, systemReduced } = settings
  const motionEnabled = isMotionEnabled(preference, systemReduced)

  useClientLayoutEffect(() => {
    syncDocument(preference, systemReduced)
  }, [preference, systemReduced])

  useClientLayoutEffect(() => {
    const mediaQuery = readMediaQuery()
    if (!mediaQuery) return undefined

    const handleSystemChange = (event) => {
      const next = { ...settingsRef.current, systemReduced: event.matches }
      settingsRef.current = next
      syncDocument(next.preference, next.systemReduced)
      setSettings(next)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemChange)
    }

    // Recheck after subscribing so a change during initialization is not missed.
    handleSystemChange(mediaQuery)

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleSystemChange)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleSystemChange)
      }
    }
  }, [])

  const toggleMotion = useCallback(() => {
    const current = settingsRef.current
    const reduced = readMediaQuery()?.matches ?? current.systemReduced

    if (reduced) {
      const next = { ...current, systemReduced: true }
      settingsRef.current = next
      syncDocument(next.preference, true)
      setSettings(next)
      return
    }

    const next = {
      preference: isMotionEnabled(current.preference, false) ? 'off' : 'on',
      systemReduced: false,
    }
    settingsRef.current = next
    syncDocument(next.preference, false)
    setSettings(next)

    try {
      window.localStorage.setItem(STORAGE_KEY, next.preference)
    } catch {
      // Keep the current choice effective when storage is blocked or full.
    }
  }, [])

  return { motionEnabled, toggleMotion, systemReduced, preference }
}
