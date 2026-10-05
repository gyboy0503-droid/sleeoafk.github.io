export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  if (inputMin === inputMax) {
    return outputMin
  }

  const progress = clamp((value - inputMin) / (inputMax - inputMin))
  return outputMin + (outputMax - outputMin) * progress
}

export function getScrollProgress(top, height, viewportHeight) {
  return mapRange(top, viewportHeight, -height, 0, 1)
}
