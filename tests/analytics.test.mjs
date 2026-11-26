import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { transformSync } from 'esbuild'
import { createGameStats } from '../app/utils/game-stats.ts'

const source = readFileSync(new URL('../app/utils/track.ts', import.meta.url), 'utf8')
function browser(host = 'runandgun.games', dev = false, beacon = true) {
  const sent = [], timers = new Map(), listeners = {}, inputs = {}
  let now = 10000, seq = 0
  const ctx = {
    window: { addEventListener: (k, f) => { inputs[k] = f } },
    location: { hostname: host, pathname: '/', search: '?utm_source=test' },
    document: { visibilityState: 'visible', referrer: 'https://google.com/search?q=private', addEventListener: (k, f) => { listeners[k] = f } },
    navigator: { language: 'en-US', webdriver: false, sendBeacon: (url, body) => { if (beacon) sent.push({ url, body: JSON.parse(body) }); return beacon } },
    screen: { width: 1440, height: 900 }, performance: { getEntriesByType: () => [{ type: 'navigate' }] },
    Intl, URL, URLSearchParams, Date: { now: () => now }, Math,
    setTimeout: (f, ms) => { timers.set(++seq, { f, at: now + ms }); return seq }, clearTimeout: id => timers.delete(id),
    fetch: (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return Promise.resolve() },
  }
  const code = transformSync(source.replace(/export function/g, 'function'), { loader: 'ts', define: { 'import.meta.dev': String(dev) } }).code
  vm.createContext(ctx); vm.runInContext(code, ctx)
  const advance = ms => { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.f() } }
  return { ctx, sent, timers, listeners, inputs, advance }
}

test('本地和开发环境不发数据；正式站使用同源采集，页面编号仅在内存中', () => {
  for (const [host, dev] of [['localhost', false], ['runandgun.games', true], ['preview.example', false]]) {
    const b = browser(host, dev); b.ctx.trackPage('/'); b.ctx.track('click_start_game')
    assert.equal(b.sent.length, 0); assert.equal(b.timers.size, 0)
  }
  const b = browser(); b.ctx.trackPage('/'); b.ctx.track('click_start_game')
  assert.equal(b.sent[0].url, '/e'); assert.equal(b.sent[0].body.s, 'runandgun.games')
  assert.equal(b.sent[0].body.r, 'https://google.com')
  assert.equal(b.sent[1].body.i, b.sent[0].body.i)
  assert.equal(b.sent[1].body.n, 'click_start_game')
  b.ctx.trackPage('/about'); assert.notEqual(b.sent.at(-1).body.i, b.sent[0].body.i)
  assert.equal(b.sent.at(-1).body.e, undefined)
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/)
})

test('有效访问只累计可见时间，真实输入每页只上报一次，Beacon失败走fetch', () => {
  const b = browser('runandgun.games', false, false)
  b.ctx.trackPage('/'); b.advance(2000)
  b.ctx.document.visibilityState = 'hidden'; b.listeners.visibilitychange(); b.advance(10000)
  assert.equal(b.sent.filter(x => x.body.k === 'eg').length, 0)
  b.ctx.document.visibilityState = 'visible'; b.listeners.visibilitychange(); b.advance(3000)
  assert.equal(b.sent.filter(x => x.body.k === 'eg').length, 1)
  b.inputs.keydown(); b.inputs.pointerdown()
  assert.equal(b.sent.filter(x => x.body.k === 'ia').length, 1)
})

test('真实游玩达标按页面累计且只记一次，失败、退出和通关不会重复记账', () => {
  const events = [], g = createGameStats(n => events.push(n))
  g.tick(60); assert.equal(events.length, 0)
  g.begin('grayhaven', 0, 'start')
  for (let i = 0; i < 60 * 120; i++) g.tick(1 / 120)
  assert.equal(events.filter(x => x === 'play_60s').length, 1)
  g.finish('game_fail'); g.finish('game_fail'); g.tick(1)
  g.begin('grayhaven', 0, 'retry')
  for (let i = 0; i < 240 * 120; i++) g.tick(1 / 120)
  assert.equal(events.filter(x => x === 'play_300s').length, 1)
  g.finish('mission_complete'); g.finish('game_exit')
  assert.equal(events.filter(x => x === 'game_fail_grayhaven_01').length, 1)
  assert.equal(events.filter(x => x === 'mission_complete_grayhaven_01').length, 1)
  g.begin('sandstorm', 0, 'continue'); g.finish('game_exit')
  assert.ok(events.includes('game_continue_sandstorm_01'))
  assert.ok(events.includes('game_exit_sandstorm_01'))
  assert.doesNotThrow(() => { const broken = createGameStats(() => { throw Error('offline') }); broken.begin('grayhaven', 0, 'start'); broken.tick(1); broken.finish('game_exit') })
})
