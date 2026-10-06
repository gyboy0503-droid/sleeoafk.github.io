export function parseMotionPreference(value) {
  return value === 'on' || value === 'off' ? value : null
}

export function isMotionEnabled(preference, systemReduced) {
  return !systemReduced && preference !== 'off'
}
