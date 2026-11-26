import {stepSandScorpion,stepBossSignature,eliteState} from './front-boss-tactics.ts'
import {desertBossState} from './front-desert.ts'
import { tankStage } from './front-contra.ts'
import type { Enemy, Level, Run, Weapon, Bullet } from './front'
import type { EnemyShot } from './front-enemies'
export type DungeonRole = 'boarding' | 'welder' | 'interceptor' | 'shield' | 'spotter' | 'capacitor'
export type DungeonThreat = { visualOnly?:boolean,owner?:number,hint?:{en:string,zh:string}, x: number, y: number, w: number, h: number, warning: number, active: number, kind: 'wave' | 'slam' | 'bomb' | 'beam' | 'pulse', fired?: boolean }
const text = (en: string, zh: string) => ({ en, zh })
export const DUNGEON_RULES = [
  { rule: text('Use cargo cranes, ride the barge and drain the flooded quay. Take the container tops when the tide rises; jump the gaps in the cargo bridge.', '操作吊箱搭路，搭乘货运浮台，用闸门排干低处通道；涨潮时走集装箱上层，跳过货运桥断口。'), boss: text('Break the tracks, destroy the side gun, then attack the exposed engine. Jump the low cannon sweep.', '先断履带、再拆副炮，最后攻击暴露的引擎；跳过贴地炮击。'), weapon: text('Piercing Rifle / Rockets', '穿透步枪 / 火箭') },
  { rule: text('Use line-control panels to stop presses and power freight lifts. Clear the crew to drive armored vehicles; keep welders at range.', '用控制台停止冲压机、启动货梯；清除守车兵后可驾驶装甲车。传送带会改变走位，注意与焊接兵保持距离。'), boss: text('Destroy the coolant valve. Dodge marked presses, then attack during the steam vent.', '先击毁冷却阀；躲开地面冲压标记，泄压时攻击炉心。'), weapon: text('Piercing Rifle / Rockets', '穿透步枪 / 火箭') },
  { rule: text('Cross the broken bridges by zipline or moving service shuttle. Watch the crosswind, then climb the comms shaft ahead of the rising arc field.', '选择跨桥滑索或移动检修台穿越断桥，留意侧风；沿通讯竖井跳台上行，避开上升电弧。'), boss: text('Keep aiming upward. Sidestep marked bombs and punish the carrier after its dive.', '持续上瞄，避开投弹标记；运输机俯冲结束后集中防空火力。'), weapon: text('Machine Gun', '速射机枪') },
  { rule: text('Use the slopes and bunker roofs to flank shield troops. Override sentries to unlock upper walkways. Crouch-fire to clear mines.', '借坡地和碉堡顶层绕开正面盾墙；反控炮台后展开上层通路，蹲射可提前拆雷。'), boss: text('Bait the shield charge, jump over its lane, and shoot the exposed back after the dash.', '引出盾墙冲锋，跳过冲锋路线；冲锋后背部暴露，迅速反击。'), weapon: text('Piercing Rifle / Grenades', '穿透步枪 / 手雷') },
  { rule: text('Shoot billboard supports to bridge rooftops and ride maintenance lifts. Duck searchlights and evade the tracking drone’s marked shots.', '击落广告牌搭成楼间通路，搭乘维护升降台；蹲下躲探照灯，移动或蹲伏避开追踪无人机的锁定射线。'), boss: text('Track the sniper between perches. Duck the pink sightline and attack during the reload.', '追踪换位的狙击手；蹲下避开粉色瞄准线，利用装填间隙反击。'), weapon: text('Assault Rifle', '突击步枪') },
  { rule: text('Route auxiliary power at control panels to open maintenance gates and disable floor surges. Use powered lifts and the Railcannon against capacitor shields.', '在控制台切换辅助供电，打开维护闸门并关闭地板电涌；利用货梯前往上层，用电磁重炮压制电容护盾。'), boss: text('Destroy both shield relays first. Then jump the floor pulse and fire between sweeping salvos.', '先摧毁两座护盾中继；再跳过地板脉冲，利用扫射弹幕间隙输出。'), weapon: text('Railcannon', '电磁重炮') },
]
export function specializeDungeon(level: Level) {
  const id = level.id
  for (const e of level.enemies) {
    e.zone = id
    if (e.boss || e.type === 'runner' || e.type === 'tank' || e.type === 'mortar') continue
    const selected = e.id % 3 !== 0
    if (!selected) continue
    if (id === 0 && e.type === 'soldier') e.role = 'boarding'
    if (id === 1 && e.type === 'heavy') e.role = 'welder'
    if (id === 2 && (e.type === 'drone' || e.type === 'heavy')) {
      e.type = 'drone'; e.w = 28; e.h = 25; e.drawScale = 1; e.y = e.homeY = Math.min(e.y, 265); e.hp = e.maxHp = 10; e.role = 'interceptor'
    }
    if (id === 3 && e.type === 'heavy') { e.role = 'shield'; e.hp = e.maxHp = 28 }
    if (id === 4 && (e.type === 'soldier' || e.type === 'sniper')) { e.type = 'sniper'; e.hp = e.maxHp = 7; e.role = 'spotter' }
    if (id === 5 && ['heavy', 'turret', 'drone'].includes(e.type)) e.role = 'capacitor'
  }
  // 在有实地、有战斗的房间布置专属机关，避开吊索和断桥本体。
  for (let i = 0; i < level.segments.length; i += 4) {
    const x = level.segments[i]!.x + 340, floor = level.ground.find(g => x >= g.x + 12 && x + 160 <= g.x + g.w - 10)
    if (!floor || level.spikes.some(s => x < s.x + s.w && x + 160 > s.x)) continue
    const type = (['tide', 'conveyor', 'gust', null, 'searchlight', 'surge'] as const)[id]
    if (!type) continue
    const h = type === 'gust' || type === 'searchlight' ? 160 : type === 'conveyor' ? 10 : 20
    level.hazards.push({ x, y: floor.y - h, w: 160, h, type, offset: i * .53 })
  }
  const boss = level.enemies.find(e => e.boss)
  if (!boss) return
  if (id === 1) { boss.type = 'mech'; boss.w = 156; boss.h = 143; boss.y = boss.homeY = 400 - boss.h }
  if (id === 2) { boss.type = 'drone'; boss.drawScale = 3; boss.w = 120; boss.h = 96; boss.y = boss.homeY = 205 }
  if (id === 4) {
    boss.type = 'sniper'; boss.drawScale = 2; boss.w = 56; boss.h = 76; boss.y = boss.homeY = 248
    for (const [dx, y] of [[-120, 310], [0, 324], [110, 294]]) level.platforms.push({ x: boss.home + dx! - 20, y: y!, w: 100, h: 16 })
  }
}
export function dungeonHazardState(type: Level['hazards'][number]['type'], time: number, offset: number): 'safe' | 'warning' | 'active' {
  if (type === 'conveyor') return 'active'
  const cycle = type === 'tide' ? 6 : type === 'gust' ? 5 : type === 'searchlight' ? 5.5 : 4
  const p = (time + offset) % cycle
  return p < cycle * .5 ? 'safe' : p < cycle * .67 ? 'warning' : 'active'
}
export function bossState(run: Run, e: Enemy) {
  if(e.elite)return eliteState(e)
  if(e.desertBoss)return desertBossState(e)
  const zone = e.zone ?? 0, t = e.age
  if (zone === 0) { const stage=tankStage(e);return {open:stage==='engine'||t%4.8>=2.8,label:text(stage==='tracks'?"Break the tracks":stage==='gun'?"Tracks disabled · destroy side gun":"Engine exposed · finish the tank",stage==='tracks'?'击毁履带 · 阻止战车推进':stage==='gun'?'履带已断 · 拆除副炮':'引擎弱点暴露 · 攻击车身后部发光处')}}
  if (zone === 1) {
    const valve = run.interactives.some(p => p.kind === 'coolant' && p.hp <= 0)
    const open = valve && t % 6 >= 3
    return { open, label: text(!valve ? "Destroy coolant valve" : open ? "Venting — core exposed" : "Press strike incoming", !valve ? '击毁冷却阀，解除炉心装甲' : open ? '泄压中 · 炉心暴露' : '冲压落点已标记') }
  }
  if (zone === 2) return { open: t % 6 >= 4.3, label: text(t % 6 >= 4.3 ? "Dive recovery — fire up" : "Bomb run — keep moving", t % 6 >= 4.3 ? '俯冲恢复 · 上瞄反击' : '投弹航线 · 保持移动') }
  if (zone === 3) return { open: t % 6 >= 3.8, label: text(t % 6 >= 3.8 ? "Backplate exposed" : "Shield charge — jump", t % 6 >= 3.8 ? '背部装甲暴露' : '盾墙冲锋 · 跳跃闪避') }
  if (zone === 4) return { open: t % 5 >= 2.4, label: text(t % 5 >= 2.4 ? "Reloading — counterattack" : "Sniper sightline — duck", t % 5 >= 2.4 ? '装填中 · 反击窗口' : '狙击瞄准 · 蹲下躲避') }
  const shield = run.interactives.some(p => p.kind === 'relay' && p.hp > 0)
  const open=!shield&&t%6>=3.8
  return { open, label: text(shield ? "Destroy both shield relays" : open ? "Cooling vents exposed · focus fire" : "Core barrage · dodge the lanes", shield ? '先摧毁两座护盾中继' : open ? '回充散热口暴露 · 集中攻击' : '核心齐射 · 躲开标记通道') }
}
export function dungeonDamageScale(run: Run, e: Enemy, kind?: Bullet['kind']) {
  if(e.elite)return ['bulwark','conductor'].includes(e.elite)?eliteState(e).open?1.3:.8:1
  if (e.boss && e.zone !== undefined) {
    const open = bossState(run, e).open
    if(e.desertBoss)return (e.parts?.tracks??0)>0?1:open?1.5:.12
    if (e.zone === 5) return open ? 1.25 : run.interactives.some(p=>p.kind==='relay'&&p.hp>0)?0:.28
    return open ? e.zone === 3 ? 2.4 : 1.6 : e.zone === 2 ? .7 : e.zone === 4 ? .4 : .22
  }
  if (e.role === 'shield' && e.cooldown < 1.1 && run.x < e.x) return kind === 'rocket' || kind === 'grenade' ? 1.2 : kind === 'pulse' ? .8 : .25
  if (e.role === 'capacitor' && e.age % 4 < 2 && kind !== 'beam' && !run.interactives.some(p => p.kind === 'power' && p.hp <= 0 && Math.abs(p.x - e.x) < 480)) return .35
  return 1
}
type BossHooks = { shot: (x: number, y: number, angle: number, style: EnemyShot, speed: number) => void }
export function stepDungeonBoss(run: Run, level: Level, e: Enemy, dt: number, hooks: BossHooks) {
  if(e.desertBoss){stepSandScorpion(run,level,e,dt,hooks);return}
  const id = level.id, phase = e.hp < e.maxHp * .25 ? 3 : e.hp < e.maxHp * .5 ? 2 : 1
  const period = id === 0 ? 4.8 : id === 4 ? 5 : 6, cycle = Math.floor(e.age / period), t = e.age % period
  const emit = (kind: DungeonThreat['kind'], x: number, y: number, w: number, h: number, warning = .9) => run.threats.push({ owner:e.id,kind, x, y, w, h, warning, active: .22 })
  const aim = () => Math.atan2(run.y + 15 - (e.y + e.h * .4), run.x + 13 - (e.x + e.w / 2))
  if(id===0&&tankStage(e)==='tracks')e.x=e.home+Math.sin(e.age*.9)*65
  if (id === 2) { e.x = e.home + Math.sin(e.age * .9) * 90; e.y = e.homeY + (t > 3.3 && t < 4.3 ? Math.sin((t - 3.3) * Math.PI) * 90 : Math.sin(e.age) * 15) }
  if (id === 4) { const perch = cycle % 3; e.x = e.home + [-120, 0, 110][perch]!; e.y = [234, 248, 218][perch]! }
  if (e.bossCycle !== cycle) {
    e.bossCycle = cycle; e.bossTarget = run.x
    if (id === 0) {
      for (let n = 0; n < phase + 1; n++) emit('wave', e.home - 650 + n * 115, 382, 150, 18, 1.1 + n * .32)
    } else if (id === 1) {
      for (let n = 0; n < phase; n++) emit('slam', run.x - 45 + n * 125, 335, 105, 65, 1.2 + n * .25)
    } else if (id === 2) {
      for (let n = 0; n < phase + 1; n++) emit('bomb', run.x - 80 + n * 95, 348, 75, 52, 1.25 + n * .22)
    } else if (id === 3) {
      e.chargeFrom = e.x; e.chargeTo = Math.max(level.width - 950, Math.min(level.width - 160, run.x + (run.x < e.x ? -e.w - 65 : 100)))
      emit('slam', Math.min(e.chargeFrom, e.chargeTo), 350, Math.abs(e.chargeFrom - e.chargeTo) + e.w, 50, 2)
    } else if (id === 4) emit('beam', e.home - 750, run.y + 14, 1100, 5, 1.6 - phase * .12)
    else emit('pulse', e.home - 700, 380, 950, 20, 1.1)
  }
  stepBossSignature(run,level,e,t,cycle)
  if (id === 3) {
    if (t > 2 && t < 3.3) e.x = (e.chargeFrom ?? e.home) + ((e.chargeTo ?? e.home) - (e.chargeFrom ?? e.home)) * Math.min(1, (t - 2) / 1.3)
  }
  e.cooldown -= dt; e.aim = aim(); e.windup = Math.max(0, .9 - t)
  if (e.cooldown > 0 || t < .9) return
  if (id === 0) {
    const stage=tankStage(e),side=run.x+13<e.x+e.w/2?-1:1,x=side<0?e.x+8:e.x+e.w-8,y=e.y+e.h*.58
    e.aim=Math.atan2(run.y+20-y,run.x+13-x)
    // 引擎暴露仍有应急机枪，但每轮炮击后保留两秒的反击窗口。
    if(t<2.8)hooks.shot(x,y,e.aim,stage==='engine'?'burst':stage==='gun'?'flak':'shell',stage==='gun'?300:240)
    e.cooldown=(stage==='gun'?.85:stage==='engine'?1.05:1.15)/(1+(phase-1)*.15)
  }
  else if (id === 1) { if (t < 3) { hooks.shot(e.x + e.w / 2, e.y + 20, e.aim - .2, 'shell', 180); hooks.shot(e.x + e.w / 2, e.y + 20, e.aim + .2, 'shell', 180) }; e.cooldown = 1.3 }
  else if (id === 2) { if (t < 3.3) for (let n = 0; n < 2 + phase; n++) hooks.shot(e.x + e.w / 2, e.y + e.h * .6, e.aim + (n - (1 + phase) / 2) * .18, 'plasma', 220); e.cooldown = .9 }
  else if (id === 3) { if (t < 2) hooks.shot(e.x + e.w / 2, e.y + 35, e.aim, 'missile', 210); e.cooldown = 1.1 - phase * .1 }
  else if (id === 4) { if (t >= 1.6 && t < 2.4) hooks.shot(e.x + e.w / 2, e.y + 18, e.aim, 'needle', 470); e.cooldown = t < 1.6 ? .15 : .3 }
  else { if (t < 3.8) for (let n = 0; n < 1 + phase * 2; n++) hooks.shot(e.x + e.w / 2, e.y + 40, e.aim + (n - phase) * .18 + Math.sin(e.age * 2) * .16, 'orb', 170 + phase * 15); e.cooldown = .95 - phase * .15 }
}
