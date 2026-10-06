import test from 'node:test'
import assert from 'node:assert/strict'
import { clamp, getScrollProgress, mapRange } from './motion.js'

test('clamp 會把數值限制在區間內', () => {
  assert.equal(clamp(-1, 0, 1), 0)
  assert.equal(clamp(0.4, 0, 1), 0.4)
  assert.equal(clamp(2, 0, 1), 1)
})

test('mapRange 可映射並限制輸出範圍', () => {
  assert.equal(mapRange(50, 0, 100, 0, 1), 0.5)
  assert.equal(mapRange(120, 0, 100, 0, 1), 1)
})

test('getScrollProgress 回傳 0 到 1 的場景進度', () => {
  assert.equal(getScrollProgress(800, 2400, 800), 0)
  assert.equal(getScrollProgress(-800, 2400, 800), 0.5)
  assert.equal(getScrollProgress(-2400, 2400, 800), 1)
})

test('mapRange 低於輸入範圍時限制為輸出下界', () => {
  assert.equal(mapRange(-20, 0, 100, 0, 1), 0)
})

test('getScrollProgress 在場景進入前與離開後仍限制於 0 到 1', () => {
  assert.equal(getScrollProgress(1600, 2400, 800), 0)
  assert.equal(getScrollProgress(-3200, 2400, 800), 1)
})

test('getScrollProgress 支援短場景與等高場景', () => {
  assert.equal(getScrollProgress(200, 400, 800), 0.5)
  assert.equal(getScrollProgress(0, 800, 800), 0.5)
})

test('零長度區間回傳起點，避免除以零', () => {
  assert.equal(mapRange(1, 1, 1, 0, 1), 0)
  assert.equal(getScrollProgress(0, 0, 0), 0)
})
