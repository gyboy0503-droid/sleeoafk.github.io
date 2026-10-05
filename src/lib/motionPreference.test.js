import test from 'node:test'
import assert from 'node:assert/strict'
import { isMotionEnabled, parseMotionPreference } from './motionPreference.js'

test('僅 on 與 off 是有效的手動動效偏好', () => {
  assert.equal(parseMotionPreference('on'), 'on')
  assert.equal(parseMotionPreference('off'), 'off')
  assert.equal(parseMotionPreference(null), null)
  assert.equal(parseMotionPreference('invalid'), null)
})

test('系統允許動效且沒有手動偏好時預設開啟', () => {
  assert.equal(isMotionEnabled(null, false), true)
  assert.equal(isMotionEnabled('on', false), true)
})

test('手動關閉的偏好在系統允許動效時仍生效', () => {
  assert.equal(isMotionEnabled('off', false), false)
})

test('系統減少動態的設定優先於所有手動偏好', () => {
  for (const preference of [null, 'on', 'off']) {
    assert.equal(isMotionEnabled(preference, true), false)
  }
})
