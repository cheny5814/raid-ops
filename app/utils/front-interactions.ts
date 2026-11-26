import {installEnvironment,coolingOff,radarAlarmOff,type EnvironmentalKind} from './front-environment.ts'
import {switchOn} from './front-field.ts'
import {surfaceY} from './front-route-features.ts'
import type { Level, Run, Rect, Enemy } from './front'
export type Interactive = Rect & { areaStart?:number,areaEnd?:number,pulse?:number,reach?:number,left?:number, id: number, kind: EnvironmentalKind | 'barrel' | 'power' | 'alarm' | 'gun' | 'mine' | 'coolant' | 'relay', hp: number, timer: number, triggered: boolean, heat: number, overheated: boolean }
export function createInteractions(level: Level): Interactive[] {
  const result: Interactive[] = []
  const add = (kind: Interactive['kind'], desiredX: number) => {
    const w = kind === 'gun' ? 44 : 24, h = kind === 'mine' ? 12 : kind === 'alarm' ? 58 : kind === 'gun' ? 36 : 30
    for (const offset of [0, 40, -40, 80, -80, 120, -120]) {
      const x = desiredX + offset
      const floor = level.ground.find(g => x >= g.x + 10 && x + w <= g.x + g.w - 10)
      if (result.some(p => x < p.x + p.w + 10 && x + w > p.x - 10) || !floor || level.spikes.some(s => x < s.x + s.w + 18 && x + w > s.x - 18) || level.barriers.some(b => x < b.x + b.w + 12 && x + w > b.x - 12)) continue
      result.push({ id: result.length + 1, kind, x, y: surfaceY(floor,x+w/2) - h, w, h, hp: kind === 'mine' ? 1 : kind === 'relay' || kind === 'coolant' ? 8 : kind === 'gun' ? 1 : kind === 'power' ? 3 : 2, timer: -1, triggered: false, heat: 0, overheated: false })
      return
    }
  }
  level.encounters.forEach((a, i) => {
    add('barrel', a.x + 290); add('barrel', a.x + 370)
    add(level.biome==='desert'?'alarm':i % 2 ? 'alarm' : 'power', a.x + 190)
    if (i % 3 === 0) add('gun', a.x + 65)
  })
  if(level.biome==='desert'){for(const x of[10500,21900,31400,43800,58400]){add('barrel',x);add('barrel',x+90)}installEnvironment(level,result);return result}
  if ([1, 4, 5].includes(level.id)) for (const hazard of level.hazards) if (['conveyor', 'searchlight', 'surge'].includes(hazard.type)) add('power', hazard.x - 70)
  if (level.id === 3) level.encounters.forEach(a => { add('mine', a.x + 100); add('mine', a.x + 420) })
  if (level.id === 1) add('coolant', level.width - 650)
  if (level.id === 5) { add('relay', level.width - 680); add('relay', level.width - 510) }
  installEnvironment(level,result)
  return result
}
export function poweredDown(run: Run, object: Rect & {circuit?:number}) {
  if('type'in object&&coolingOff(run,object as import('./front').Hazard))return true
  if(object.circuit!==undefined&&switchOn(run,object.circuit))return true
  return run.interactives.some(p => p.kind === 'power' && p.hp <= 0 && Math.abs(object.x - p.x) < 480)
}
export function gunNearby(run: Run) {
  return run.interactives.find(p => p.kind === 'gun' && Math.abs(p.x - run.x - 13) < 52 && Math.abs(p.y + p.h - run.y - 40) < 12)
}
export function tickInteractions(run: Run, level: Level, dt: number) {
  for (const p of run.interactives) {
    p.heat = Math.max(0, p.heat - dt * (run.mountedGun === p.id ? 14 : 24))
    if (p.overheated && p.heat < 25) p.overheated = false
    if(p.kind==='alarm'&&radarAlarmOff(run,p.x))continue
    if (p.kind !== 'alarm' || p.hp <= 0 || p.triggered) continue
    if (p.timer < 0 && Math.abs(run.x - p.x) < 280 && Math.abs(run.y - p.y) < 90) p.timer = 4
    if (p.timer < 0) continue
    p.timer = Math.max(0, p.timer - dt)
    if (p.timer > 0) continue
    p.triggered = true
    const template = run.enemies.find(e => e.type === 'soldier' && !e.guard && Math.abs(e.home - p.x) < 1000)
    if (!template) continue
    for (let i = 0; i < 2 + Math.floor(level.id / 3); i++) {
      const x = p.x + 180 + i * 42, floor = level.ground.find(g => x >= g.x && x + template.w < g.x + g.w)
      if (!floor) continue
      const enemy: Enemy = { ...template, id: Math.max(0, ...run.enemies.map(e => e.id)) + 1, x, home: x, y: floor.y - template.h, homeY: floor.y - template.h, hp: template.maxHp, dormant: false, wakeAfter: undefined, wakeTimer: undefined, cooldown: .8, windup: 0, guard: false, age: 0, volleys: 0 }
      run.enemies.push(enemy)
      run.effects.push({ x, y: enemy.y, kind: 'pickup', time: .32 })
    }
  }
}
