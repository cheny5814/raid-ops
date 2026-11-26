import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { transformSync } from 'esbuild'

test('真实菜单循环离屏后停止绘制，返回时恢复且不累积离屏时间', async () => {
  const source = await readFile(new URL('../app/components/game/RaidOpsGame.vue', import.meta.url), 'utf8')
  const loop = source.slice(source.indexOf('let sceneObserver:'), source.indexOf('\nonMounted(() =>'))
  let nextId = 0, draws = 0
  const pending = new Map()
  const box = vm.createContext({
    frame: 0, previous: 0, accumulator: 0, titleElapsed: 0,
    mode: { value: 'ready' }, panel: { value: null }, menuView: { value: 'title' },
    context: {}, level: { value: {} }, width: 1200,
    reduceMotion: { value: false }, language: { value: 'en' }, selectedOperative: { value: 'raven' },
    document: { hidden: false }, updateMusic() {}, clearInput() {}, titleFigureSpace() {},
    drawFrontTitle() { draws++ },
    requestAnimationFrame(fn) { pending.set(++nextId, fn); return nextId },
    cancelAnimationFrame(id) { pending.delete(id) },
  })
  vm.runInContext(transformSync(loop, { loader: 'ts', target: 'es2022' }).code, box)
  const tick = time => { const [id, fn] = pending.entries().next().value; pending.delete(id); fn(time) }
  vm.runInContext('animate(100)', box)
  tick(116); assert.equal(draws, 1)
  tick(140); assert.equal(draws, 2)
  vm.runInContext('setSceneVisible(false)', box)
  assert.equal(pending.size, 0)
  vm.runInContext('animate(9000)', box)
  assert.equal(draws, 2)
  vm.runInContext('setSceneVisible(true)', box)
  assert.equal(pending.size, 1)
  tick(10000); assert.equal(draws, 3)
  assert.ok(vm.runInContext('titleElapsed < 0.1', box))
  vm.runInContext('setSceneVisible(true)', box)
  assert.equal(pending.size, 1, 'Repeated visibility events must not create duplicate loops')
})
