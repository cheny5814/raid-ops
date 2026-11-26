import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { transformSync } from 'esbuild'

const source = readFileSync(new URL('../app/components/game/RaidOpsGame.vue', import.meta.url), 'utf8')
const handler = source.slice(source.indexOf('function windowKeydown('), source.indexOf('function keydown('))
const compiled = transformSync(handler, { loader: 'ts' }).code

test('未点击游戏的页面焦点也能将回车交给游戏，外部控件不被劫持', () => {
  const body = {}, documentElement = {}, gameChild = {}, externalInput = {}
  const received = []
  const context = { document: { body, documentElement }, gameScreen: { value: { contains: target => target === gameChild } }, keydown: event => received.push(event) }
  runInNewContext(compiled, context)
  for (const target of [body, documentElement, gameChild]) {
    const event = { target, code: 'Enter' }
    context.windowKeydown(event)
    assert.equal(received.at(-1), event)
  }
  context.windowKeydown({ target: externalInput, code: 'Enter' })
  context.windowKeydown({ target: null, code: 'Enter' })
  assert.equal(received.length, 3)
})

test('部署直接开始，更换角色确认只返回选关，死亡更换仍可重试', () => {
  const actions = source.slice(source.indexOf('function prepareDeployment('), source.indexOf('function activateSkill('))
  const events = []
  const mode = { value: 'ready' }, panel = { value: null }
  const context = { mode, panel, start: () => events.push('start'), closePanel: () => { panel.value = null; events.push('close') }, retry: () => events.push('retry') }
  runInNewContext(transformSync(actions, { loader: 'ts' }).code, context)
  context.prepareDeployment()
  assert.deepEqual(events, ['start'])
  panel.value = 'operatives'
  context.prepareDeployment()
  assert.equal(events.length, 1)
  context.confirmOperative()
  assert.deepEqual(events, ['start', 'close'])
  mode.value = 'dead'; panel.value = 'operatives'
  context.confirmOperative()
  assert.equal(panel.value, null)
  assert.equal(events.at(-1), 'retry')
})
