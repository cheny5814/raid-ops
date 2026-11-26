import {clearLevelPatrols,clearPatrolSpawn,constrainPatrol} from './front-enemy-placement.ts'
import {operateEnvironment,triggerEnvironment,tickEnvironment,steamObscures,stormObscures,radarOff,environmentalKind} from './front-environment.ts'
import { terrainMaterial, impactStyle, rememberEffectGround, destructionGround, debrisFloor, type CombatEffect } from './front-impact.ts'
import type {BattleView} from './front-camera.ts'
import {vehicleMotion,type VehicleMotion} from './front-vehicle-motion.ts'
import {installLieutenants,stepLieutenant,type EliteKind} from './front-boss-tactics.ts'
import {fortifyPatrols,addRoutePatrols} from './front-balance.ts'
import {installDistricts} from './front-districts.ts'
import {carryField,fieldDecks,fieldWalls,operateField,type FieldLayout} from './front-field.ts'
import { installRouteFeatures,thinFieldSupplies, surfaceY, terrainSolids, projectileContact, nearbyZipline, ziplinePoint, type Zipline } from './front-route-features.ts'
import { desertDecks, desertSand, tickDesert } from './front-desert.ts'
import { readOperative, useOperativeSkill, type OperativeId } from './front-operatives.ts'
import { installContra, createArcade, arcadeGround, arcadeInput, arcadePlatforms, tickArcade, crossfireOpen, tankTarget, tankDamage, tankStage, type SetPiece, type ArcadeState, type TankParts, type CrossfireRole } from './front-contra.ts'
import { createTactics, controlled, tacticalDecks, tacticalInteract, tickTactics, leaveTactical, type Tactical } from './front-tactics.ts'
import { trackInfantry, type MotionTracker } from './front-infantry.ts'
import { playerRig, enemyMuzzle, clearMuzzle } from './front-gun-pose.ts'
import { emitSound, type SoundEvent } from './front-sound-events.ts'
import { WEAPON_XP, cleanWeaponXp, grownWeapon, killExperience } from './front-growth.ts'
import { specializeDungeon, dungeonHazardState, bossState, dungeonDamageScale, stepDungeonBoss, type DungeonRole, type DungeonThreat } from './front-dungeons.ts'
import { ENEMY_SHOTS, type EnemyShot } from './front-enemies.ts'
import { createInteractions, poweredDown, gunNearby, tickInteractions, type Interactive } from './front-interactions.ts'
import { CAMPAIGN, type StoryGoal } from './front-story.ts'
export const MAX_HEALTH = 10
export const FLOOR = 400
export const BODY = { w: 26, h: 40 }
export type Weapon = 'rifle' | 'spread' | 'pulse' | 'rapid' | 'rocket' | 'beam'
export const WEAPONS = {
  rifle: { name: '突击步枪', label: 'R', color: '#e8c27c', delay: .18, speed: 960, damage: 3, pellets: 1, range: 650, pierce: 1, description: '单发高伤、精准中远射，擅长步兵与狙击手', role: '精准点杀', counter: '普通步兵、狙击手' },
  spread: { name: '霰弹枪', label: 'S', color: '#8ad0b8', delay: .38, speed: 760, damage: 1, pellets: 7, range: 255, pierce: 1, description: '七颗低伤弹丸，近距离群伤强；射程短，打重甲弱', role: '近战清群', counter: '冲锋兵群、近距离围攻' },
  pulse: { name: '穿透步枪', label: 'P', color: '#9cbced', delay: .3, speed: 1080, damage: 2.8, pellets: 1, range: 690, pierce: 4, description: '基础贯穿四层，成长增加层数，对重甲增伤；唯一能击穿叠层装甲门', role: '破甲贯穿', counter: '重装兵、坦克、叠层装甲门' },
  rapid: { name: '速射机枪', label: 'M', color: '#d4d68b', delay: .055, speed: 1020, damage: .7, pellets: 1, range: 570, pierce: 1, description: '单弹低伤、持续高射速，对无人机增伤；打重甲弱', role: '防空压制', counter: '无人机、持续移动目标' },
  rocket: { name: '火箭发射器', label: 'B', color: '#dca27d', delay: .64, speed: 650, damage: 8, pellets: 1, range: 580, pierce: 1, description: '慢速范围爆破，中心伤害更高；唯一能炸开爆破墙', role: '范围拆除', counter: '扎堆守军、爆破墙' },
  beam: { name: '电磁重炮', label: 'E', color: '#b5a5df', delay: .6, speed: 1320, damage: 6, pellets: 1, range: 720, pierce: 1, description: '慢射速单目标，对能量目标大幅增伤；唯一能关闭能量屏障', role: '能量克制', counter: '防御核心、能量屏障' },
}
export const WEAPON_ORDER: Weapon[] = ['rifle', 'spread', 'pulse', 'rapid', 'rocket', 'beam']
export type Supply = 'med' | 'armor' | 'grenades'
export type Mission = { id: string, title: string, description: string, encounter: number, reward: Weapon }
export const MISSION_REWARDS: Weapon[] = ['spread', 'pulse', 'rapid', 'rocket', 'beam']
export const GATE_NAMES = { pulse: '叠层装甲门', rocket: '爆破墙', beam: '能量屏障', rifle: '精准靶', spread: '蜂群防线', rapid: '防空阵列' }
export type Defense = 'light' | 'swarm' | 'armor' | 'air' | 'energy'
export function enemyDefense(e: Pick<Enemy, 'type'> & Partial<Pick<Enemy, 'role'>>): Defense {
  return e.type === 'core' || e.role === 'capacitor' ? 'energy' : ['heavy', 'turret', 'tank', 'mech', 'mortar'].includes(e.type) ? 'armor' : e.type === 'drone' ? 'air' : e.type === 'runner' ? 'swarm' : 'light'
}
const MATCHUPS: { [K in Weapon | 'grenade']: { [D in Defense]: number } } = {
  rifle: { light: 1, swarm: .9, armor: .6, air: .8, energy: .25 },
  spread: { light: 1, swarm: 1.4, armor: .35, air: .65, energy: .2 },
  pulse: { light: .9, swarm: .6, armor: 1.8, air: .7, energy: .35 },
  rapid: { light: 1, swarm: 1, armor: .4, air: 2.2, energy: .25 },
  rocket: { light: 1, swarm: 1.2, armor: 1.2, air: .7, energy: .25 },
  beam: { light: .75, swarm: .4, armor: .85, air: .65, energy: 2.5 },
  grenade: { light: 1, swarm: 1, armor: .6, air: .5, energy: .15 },
}
export function effectiveDamage(kind: Bullet['kind'], e: Pick<Enemy, 'type'>, damage: number) {
  return Math.round(damage * 100 * (kind === 'enemy' ? 1 : MATCHUPS[kind][enemyDefense(e)])) / 100
}
export type Rect = { x: number, y: number, w: number, h: number, rise?: number }
export type Enemy = Rect & { lastShotAt?:number, vehicleMotion?:VehicleMotion, elite?:EliteKind,eliteName?:{en:string,zh:string},bossSpecialCycle?:number,closeAttackAt?:number, desert?:boolean,desertBoss?:boolean, parts?:TankParts,crossfire?:CrossfireRole,tower?:number, infantryMotion?:MotionTracker,shotFlash?:number, zone?: number, role?: DungeonRole, bossCycle?: number, bossTarget?: number, chargeFrom?: number, chargeTo?: number, boss?: boolean, drawScale?: number, hitFlash?: number, id: number, dormant?: boolean, wakeAfter?: number[], wakeTimer?: number, type: 'soldier' | 'runner' | 'turret' | 'drone' | 'heavy' | 'sniper' | 'tank' | 'mech' | 'core' | 'mortar', hp: number, maxHp: number, home: number, homeY: number, cooldown: number, windup: number, aim: number, age: number, volleys: number, guard: boolean }
export type Pickup = { id: number, x: number, y: number, type: Supply, taken: boolean }
export type Bullet = { enemyShot?: EnemyShot, x: number, y: number, vx: number, vy: number, friendly: boolean, damage: number, life: number, pierce: number, hit: number[], registeredHit?: boolean, kind: Weapon | 'enemy' | 'grenade' }
export type Barrier = Rect & { collapseTriggered?:boolean, billboard?:boolean,waterTower?:boolean,fallAge?:number, id: number, hp: number, maxHp: number, material: 'crate' | 'bunker', requiredWeapon?: Weapon }
export type Rope = { id: number, x: number, y: number, length: number }
export type Ladder = Rect & { id: number }
export type Hazard = Rect & { circuit?:number,type: 'laser' | 'crusher' | 'tide' | 'conveyor' | 'gust' | 'searchlight' | 'surge', offset: number }
export type Encounter = { x: number, end: number, enemies: number[] }
export type Difficulty = { name: string, briefing: string, bulletSpeed: number, cooldown: number, windup: number, runnerSpeed: number }
export const DIFFICULTIES: Difficulty[] = [
  { name: '初入战场', briefing: '基础步兵与三向炮台，熟悉掩体和跳台', bulletSpeed: 145, cooldown: 2.55, windup: .50, runnerSpeed: 60 },
  { name: '装甲压制', briefing: '无人机加入交火，装甲战车封锁出口', bulletSpeed: 170, cooldown: 2.15, windup: .44, runnerSpeed: 72 },
  { name: '空地夹击', briefing: '无人机覆盖更多路段，断桥间穿插火力', bulletSpeed: 195, cooldown: 1.8, windup: .38, runnerSpeed: 85 },
  { name: '交叉封锁', briefing: '步兵双发压制，机甲半血后加密弹幕', bulletSpeed: 225, cooldown: 1.46, windup: .30, runnerSpeed: 100 },
  { name: '密集火线', briefing: '五向炮台与冲锋兵配合，弹速继续提高', bulletSpeed: 245, cooldown: 1.28, windup: .28, runnerSpeed: 110 },
  { name: '极限突围', briefing: '最短开火间隔，核心三阶段七向弹幕', bulletSpeed: 265, cooldown: 1.10, windup: .26, runnerSpeed: 120 },
]
export type StoryTerminal = Rect & { id: string, encounter: number, goal: number, kind: StoryGoal['kind'], duration: number }
export type Level = { districts?:{x:number,end:number,name:string}[],field?:FieldLayout,ziplines?:Zipline[], biome?:'desert',desert?:{sand:Rect[],towerIds:number[]}, setPieces?:SetPiece[], storyTerminals: StoryTerminal[], id: number, difficulty: Difficulty, ropes: Rope[], ladders: Ladder[], missions: Mission[], dungeon: { name: string, description: string, chapters: string[], surface: 'desert' | 'dock' | 'factory' | 'viaduct' | 'fortress' | 'roof' | 'reactor' }, hazards: Hazard[], encounters: Encounter[], name: string, subtitle: string, width: number, color: string, ground: Rect[], platforms: Rect[], barriers: Barrier[], spikes: Rect[], segments: { x: number, name: string }[], enemies: Enemy[], pickups: Pickup[], checkpoints: number[] }
export type Input = { view?:BattleView, skill?:boolean, reducedMotion?:boolean, left: boolean, right: boolean, jump: boolean, shoot: boolean, up: boolean, duck: boolean, grenade?: boolean, interact?: boolean, aimAssist?: boolean, viewWidth?: number }
type Snapshot = { fieldSwitches?:number[],arcade:ArcadeState[], tactics:Tactical[], interactives: Interactive[], storyCompleted: string[], x: number, y: number, barriers: Barrier[], enemies: Enemy[], pickups: Pickup[], score: number, kills: number, weapon: Weapon, arsenal: Weapon[], armor: number, grenades: number, checkpoint: number }
export type CombatStats = { shots: number, hits: number, damage: number, blocked: number, retries: number }
export type Run = { fieldSwitches:number[],zipline:{id:number,t:number,speed:number}|null, biome?:'desert',sandTime?:number, operative:OperativeId,skillCooldown:number,dashTime:number,dashFacing:number,airSkillUsed:boolean, arcade:ArcadeState[], tactics:Tactical[], tacticalControl:number|null, infantryMotion?:MotionTracker,shotDelay?:number,fireAngle?:number, soundEvents: SoundEvent[], gunfire: { serial: number, weapon: Weapon, at?:number } | null, weaponXp: number, growthClaims: number[], threats: DungeonThreat[], spotted: boolean, interactives: Interactive[], mountedGun: number | null, storyRequired: number, storyCompleted: string[], storyCharge: number, aimTarget: number | null, aimAngle: number | null, flipAge: number, flipFacing: number, rope: number | null, ladder: number | null, ropeMotion: { [id: number]: { angle: number, speed: number } }, interactDelay: number, glideVx: number, initialArsenal: Weapon[], claimedMissions: string[], missionRewards: Weapon[], stats: CombatStats, x: number, y: number, vy: number, facing: number, grounded: boolean, duck: boolean, grace: number, jumpBuffer: number, hp: number, invincible: number, damageCue: number, armorHit: boolean, fireDelay: number, weapon: Weapon, arsenal: Weapon[], armor: number, grenades: number, grenadeDelay: number, bullets: Bullet[], barriers: Barrier[], enemies: Enemy[], pickups: Pickup[], score: number, kills: number, time: number, checkpoint: number, saved: Snapshot | null, status: 'playing' | 'dead' | 'won', reason: string, effects: CombatEffect[] }
export const isBoss = (enemy: Enemy) => enemy.boss ?? ['tank', 'mech', 'core'].includes(enemy.type)
export function overlaps(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y }
export function playerBody(run: Run): Rect { const p=controlled(run);if(p?.kind==='vehicle')return {x:p.x,y:p.y,w:p.w,h:p.h};return { x: run.x + 3, y: run.y + (run.duck ? 20 : 3), w: BODY.w - 6, h: run.duck ? 20 : BODY.h - 4 } }
const platform = (x: number, y: number, w = 140): Rect => ({ x, y, w, h: 16 })
export function enemy(id: number, type: Enemy['type'], x: number, guard = false, boss = ['tank', 'mech', 'core'].includes(type)): Enemy {
  const hp = ({ soldier: 4, runner: 2, turret: 12, drone: 8, heavy: 22, sniper: 6, tank: boss ? 130 : 38, mech: 220, core: 300, mortar: 18 })[type]
  const drawScale = boss ? 1.3 : type === 'tank' ? .7 : type === 'heavy' ? 1.15 : 1
  const w = type === 'tank' || boss ? (type === 'core' ? 120 : 120) * drawScale : type === 'mortar' ? 44 : type === 'turret' ? 38 : 28 * drawScale, h = type === 'tank' || boss ? (type === 'mech' ? 110 : 80) * drawScale : type === 'drone' ? 25 : type === 'mortar' ? 42 : 38 * drawScale
  return { id, type, boss, drawScale, x, y: type === 'drone' ? 277 : FLOOR - h, w, h, hp, maxHp: hp, home: x, homeY: type === 'drone' ? 277 : FLOOR - h, cooldown: .12 + id % 4 * .07, windup: 0, aim: Math.PI, age: 0, volleys: 0, guard }
}
const plans: { name: string, subtitle: string, width: number, boss?: Enemy['type'], color: string }[] = [
  { name: '港口登陆', subtitle: '掩体可以射碎或跳过，尖刺需要避开，长断桥要借助连续跳台。按住 J 连射，清掉出口炮台。', width: 67500, boss: 'tank', color: '#243e46' },
  { name: '装甲封锁', subtitle: '穿过工厂，击破守在出口的装甲战车。首领蓄力时先准备躲避。', width: 70500, boss: 'tank', color: '#3c3945' },
  { name: '高架追击', subtitle: '无人机会从高处射击，按住 W 可以向上瞄准。', width: 73500, boss: 'mech', color: '#2b424d' },
  { name: '机甲哨站', subtitle: '机甲会连续发射扇形弹幕。蹲下、跳跃和换位都很重要。', width: 76500, boss: 'mech', color: '#3a4242' },
  { name: '内城火线', subtitle: '炮台互相掩护。穿透弹可以同时打中一条线上的多个敌人。', width: 79500, boss: 'core', color: '#3f3741' },
  { name: '核心突围', subtitle: '摧毁最后的防御核心。受损后它会加快攻击，别站在同一个位置。', width: 82500, boss: 'core', color: '#293c49' },
]
type Terrain = 'breach' | 'gap' | 'spikes' | 'bridge' | 'crossfire' | 'laser' | 'press' | 'siege' | 'counter' | 'ravine' | 'ladder' | 'wreck'
export const DUNGEONS: Level['dungeon'][] = [
  { name: '潮汐货运港', description: '集装箱掩体、断裂装卸桥与水上跳台，沿三条货运航道推进。', surface: 'dock', chapters: ['集装箱堆场', '潮汐装卸桥', '货轮连接栈道', '海关封锁线'] },
  { name: '熔炉装甲工厂', description: '在密集冲压机与冷却沟之间穿行，从生产车间打到战车装配线。', surface: 'factory', chapters: ['冷却沟入口', '重型冲压车间', '熔炉输送线', '装甲装配大厅'] },
  { name: '断空高架', description: '连续断桥与逐级升高的悬空桥墩，借助维修平台躲避空中交火。', surface: 'viaduct', chapters: ['桥头维修站', '悬空桥墩群', '断裂主桥', '高空防空阵地'] },
  { name: '雷达山地要塞', description: '高低错落的堡垒墙与纵深掩体，逐一拔除哨站据点。', surface: 'fortress', chapters: ['前沿反冲锋带', '外墙碉堡', '雷达台阶', '机甲指挥庭院'] },
  { name: '霓虹屋顶防线', description: '从屋顶跨越楼间空隙，利用天台高低差接近交叉火力。', surface: 'roof', chapters: ['商业区天台', '楼宇连接桥', '屋顶狙击线', '内城行政塔'] },
  { name: '反应堆维护区', description: '下沉的冷却走道、交错电网与压机，最终抵达核心反应大厅。', surface: 'reactor', chapters: ['维护闸门', '冷却回路', '脉冲供能廊', '主反应大厅'] },
]
const ROUTES: Terrain[][] = [
  ['breach', 'gap', 'bridge', 'spikes', 'bridge', 'crossfire', 'gap', 'laser'],
  ['press', 'breach', 'press', 'laser', 'gap', 'press', 'crossfire', 'bridge'],
  ['bridge', 'gap', 'crossfire', 'bridge', 'laser', 'gap', 'press', 'bridge'],
  ['breach', 'spikes', 'crossfire', 'press', 'breach', 'gap', 'laser', 'bridge'],
  ['crossfire', 'bridge', 'gap', 'crossfire', 'bridge', 'laser', 'press', 'spikes'],
  ['laser', 'press', 'crossfire', 'laser', 'gap', 'press', 'bridge', 'breach'],
]
const ELEVATIONS = [[0], [0, 0, -18, 0], [-25, -55, -85, -55], [0, -30, -60, -30], [-40, -75, -35, -65], [0, -25, -55, -25]]
const TERRAIN_NAMES: { [K in Terrain]: string } = { breach: '掩体突破', gap: '断桥跃进', spikes: '尖刺封锁', bridge: '连续跳台', crossfire: '高低交火', laser: '脉冲电网', press: '冲压车间', siege: '据点歼灭战', counter: '武器战术试炼', ravine: '吊索裂谷', ladder: '攀梯检修道', wreck: '断梁跃进' }
// 启动前有稳定预警；关卡越后，机关的安全窗口越短。
export function hazardState(hazard: Hazard, time: number, levelId: number): 'safe' | 'warning' | 'active' {
  if (hazard.type !== 'laser' && hazard.type !== 'crusher') return dungeonHazardState(hazard.type, time, hazard.offset)
  const cycle = 4.4 - levelId * .16, phase = (time + hazard.offset) % cycle
  return phase < cycle - 1.45 ? 'safe' : phase < cycle - .9 ? 'warning' : 'active'
}
export function equipWeapon(run: Run, weapon: Weapon) {
  if (run.status !== 'playing' || !run.arsenal.includes(weapon)) return false
  run.weapon = weapon; emitSound(run, 'equip', run.x); run.fireDelay = Math.max(run.fireDelay, .1); return true
}
export function currentEncounter(level: Level, run: Run) {
  return level.encounters.find(a => run.x > a.x - 450 && run.x < a.end + 30 && a.enemies.some(id => run.enemies.some(e => e.id === id && e.hp > 0)))
}
function makeLevel(plan: typeof plans[number], id: number): Level {
  const count = Math.floor((plan.width - 480 - 850) / 620), gaps: [number, number][] = [], platforms: Rect[] = [], barriers: Barrier[] = [], spikes: Rect[] = [], enemies: Enemy[] = [], pickups: Pickup[] = [], checkpoints: number[] = [], segments: Level['segments'] = [], hazards: Hazard[] = [], encounters: Encounter[] = [], ropes: Rope[] = [], ladders: Ladder[] = []
  let enemyId = 1, barrierId = 1
  const addBarrier = (x: number, h: number, material: Barrier['material'] = 'crate') => { const hp = material === 'bunker' ? 8 : 4; barriers.push({ id: barrierId++, x, y: FLOOR - h, w: material === 'bunker' ? 66 : 48, h, hp, maxHp: hp, material }) }
  const addEnemy = (type: Enemy['type'], x: number, y?: number) => { const e = enemy(enemyId++, type, x, false, false); if (y !== undefined) e.y = y; enemies.push(e) }
  const addPickup = (x: number, y: number, type: Pickup['type']) => pickups.push({ id: pickups.length, x, y, type, taken: false })
  for (let i = 0; i < count; i++) {
    const x = 480 + i * 620, terrain = i % 10 === 8 ? 'siege' : i % 10 === 9 ? 'counter' : i % 20 === 6 ? 'ravine' : i % 20 === 13 ? 'ladder' : i % 20 === 16 ? 'wreck' : ROUTES[id]![i % ROUTES[id]!.length]!
    const chapter = DUNGEONS[id]!.chapters[Math.min(3, Math.floor(i / count * 4))]!
    segments.push({ x, name: `${chapter} · ${TERRAIN_NAMES[terrain]}` })
    const firstEnemy = enemies.length, firstPlatform = platforms.length, firstBarrier = barriers.length, firstSpike = spikes.length, firstPickup = pickups.length, firstHazard = hazards.length, firstRope = ropes.length, firstLadder = ladders.length
    const heights = ELEVATIONS[id]!, lift = heights[Math.floor(i / 3) % heights.length]!
    const airRoute = id === 2 || id === 4
    if (terrain === 'breach') {
      addBarrier(x + 165, 42); addBarrier(x + 350, 62, i % 2 ? 'bunker' : 'crate')
      addEnemy(i % 2 ? 'turret' : 'soldier', x + 475)
      if (id >= 2) addEnemy('drone', x + 330)
    } else if (terrain === 'gap') {
      gaps.push([x + 205, id === 0 ? 100 : 105 + Math.min(id, 4) * 4]); platforms.push(platform(x + 30, 325, 200))
      addBarrier(x + 385, 38); addEnemy('soldier', x + 500)
    } else if (terrain === 'spikes') {
      spikes.push({ x: x + 185, y: FLOOR - 21, w: 43, h: 21 }, { x: x + 385, y: FLOOR - 21, w: 48, h: 21 })
      platforms.push(platform(x + 270, id === 3 ? 305 : 320, id === 3 ? 170 : 130)); addEnemy(i % 2 ? 'runner' : 'soldier', x + 490)
    } else if (terrain === 'bridge') {
      gaps.push([x + 140, 360])
      platforms.push(platform(x + 145, airRoute ? 335 : 345, 155), platform(x + 310, airRoute ? 280 : 295, 135), platform(x + 455, 340, 100))
      addEnemy('soldier', x + 550)
    } else if (terrain === 'crossfire') {
      platforms.push(platform(x + 95, id === 4 ? 310 : 325, 155), platform(x + 300, id === 4 ? 240 : 255, 160)); addBarrier(x + 285, 48, 'bunker')
      addEnemy('turret', x + 470); addEnemy(id >= 1 ? 'drone' : 'soldier', x + 375, id >= 1 ? undefined : FLOOR - 38)
      addPickup(x + 380, 228, 'armor')
    }
    if (terrain === 'laser' || terrain === 'press') {
      hazards.push({ x: x + 245, y: terrain === 'laser' ? 367 : 275, w: terrain === 'laser' ? 75 : 65, h: terrain === 'laser' ? 33 : 125, type: terrain === 'laser' ? 'laser' : 'crusher', offset: i * .71 })
      platforms.push(platform(x + 90, 315, 110), platform(x + 380, 300, 130))
      addEnemy('heavy', x + 495); addEnemy('sniper', x + 425, 262)
    }
    if (terrain === 'ravine') {
      gaps.push([x + 125, 385])
      ropes.push({ id: ropes.length, x: x + 300, y: FLOOR - 270, length: 285 })
      platforms.push(platform(x + 495, FLOOR - 35, 110))
      addEnemy('soldier', x + 550)
    }
    if (terrain === 'ladder') {
      platforms.push(platform(x + 200, FLOOR - 135, 160), platform(x + 390, FLOOR - 95, 135))
      ladders.push({ id: ladders.length, x: x + 248, y: FLOOR - 135, w: 26, h: 135 })
      gaps.push([x + 390, 120]); addEnemy('sniper', x + 430, FLOOR - 95 - 38)
      addPickup(x + 308, FLOOR - 157, 'armor'); addEnemy('soldier', x + 550)
    }
    if (terrain === 'wreck') {
      platforms.push(platform(x + 130, FLOOR - 35, 90), platform(x + 250, FLOOR - 85, 110), platform(x + 390, FLOOR - 135, 130))
      spikes.push({ x: x + 175, y: FLOOR - 21, w: 290, h: 21 }); addEnemy('turret', x + 550)
    }
    if (terrain === 'siege') {
      const first = enemies.length
      addBarrier(x + 150, 42); platforms.push(platform(x + 290, 305, 130))
      addEnemy('heavy', x + 320); addEnemy('sniper', x + 340, 267); addEnemy('turret', x + 485)
      let marked = enemies.slice(first).map(e => e.id)
      const firstWave = enemies.slice(first).filter(e => e.type !== 'sniper').map(e => e.id)
      if (encounters.length < 5) {
        checkpoints.push(x - 80)
        const start = enemies.length
        addEnemy('soldier', x + 95); addEnemy('drone', x + 310); addEnemy('runner', x + 165)
        for (const e of enemies.slice(start)) { e.dormant = true; e.wakeAfter = [...firstWave]; e.wakeTimer = 1.1 }
        marked = [...firstWave, ...enemies.slice(start).map(e => e.id)]
      }
      encounters.push({ x, end: x + 580, enemies: marked })
      addPickup(x + 45, 378, 'grenades'); addPickup(x + 45, 378, 'armor')
    }
    // 每段有近距离接战兵；长桥上改用空中目标，避免步兵悬空。
    if (terrain !== 'ravine') addEnemy(i % 4 === 0 ? 'heavy' : 'soldier', x + 65)
    if (terrain !== 'crossfire' && terrain !== 'siege' && terrain !== 'ravine') addEnemy('drone', x + 340)
    if (terrain === 'counter') {
      const lesson = Math.floor(i / 10) % 5
      if (lesson === 0) { for (let j = 0; j < 4; j++) addEnemy('runner', x + 300 + j * 45) }
      else if (lesson === 2) { addEnemy('drone', x + 270); addEnemy('drone', x + 450) }
      else {
        const required: Weapon = lesson === 1 ? 'pulse' : lesson === 3 ? 'rocket' : 'beam'
        barriers.push({ id: barrierId++, x: x + 350, y: FLOOR - 240, w: 45, h: 240, hp: required === 'pulse' ? 14 : 18, maxHp: required === 'pulse' ? 14 : 18, material: 'bunker', requiredWeapon: required })
      }
      addEnemy('soldier', x + 490)
    }
    if (['breach', 'crossfire', 'siege'].includes(terrain) && i % 3 === 0) addEnemy('tank', x + 450)
    if (['bridge', 'laser', 'press', 'ladder'].includes(terrain) && i % 3 === 1) addEnemy('mortar', x + 520)
    if (i % 5 === 3) addPickup(x + 75, 378, 'med')
    if (i % 10 === 4) addPickup(x + 75, 378, 'armor')
    if ((i + 1) % 5 === 0 && i < count - 1) checkpoints.push(x + 655)
    for (const e of enemies.slice(firstEnemy)) { e.y += lift; e.homeY = e.y }
    for (const a of [ropes.slice(firstRope), ladders.slice(firstLadder), platforms.slice(firstPlatform), barriers.slice(firstBarrier), spikes.slice(firstSpike), hazards.slice(firstHazard), pickups.slice(firstPickup)]) for (const r of a) r.y += lift

  }
  const ground: Rect[] = []; let start = 0
  for (const [x, w] of gaps.sort((a, b) => a[0] - b[0])) { ground.push({ x: start, y: FLOOR, w: x - start, h: 100 }); start = x + w }
  ground.push({ x: start, y: FLOOR, w: plan.width - start, h: 100 })
  // 将地面按副本台阶切分；入口与最终首领平台保持平整。
  const shaped: Rect[] = []
  for (const g of ground) {
    let left = g.x
    while (left < g.x + g.w) {
      const module = Math.floor((left - 480) / 620), edge = module < 0 ? 480 : 480 + (module + 1) * 620
      const right = Math.min(g.x + g.w, edge)
      const heights = ELEVATIONS[id]!, lift = module < 0 || module >= count ? 0 : heights[Math.floor(module / 3) % heights.length]!
      shaped.push({ x: left, y: FLOOR + lift, w: right - left, h: 580 - FLOOR - lift }); left = right
    }
  }
  ground.splice(0, ground.length, ...shaped)
  checkpoints.push(plan.width - 720); segments.push({ x: plan.width - 850, name: plan.boss ? '关底首领战' : '出口警戒区' })
  addPickup(plan.width - 550, 378, 'med')
  addEnemy('drone', plan.width - 900)
  if (plan.boss) { const leader = enemy(90000, plan.boss, plan.width - 320, true, true); leader.hp = leader.maxHp = [130, 180, 220, 270, 300, 380][id]!; enemies.push(leader) }
  else { enemies.push(enemy(90001, 'turret', plan.width - 330, true)); if (id >= 2) enemies.push(enemy(90002, 'turret', plan.width - 490, true)) }
  const missions: Mission[] = MISSION_REWARDS.map((reward, n) => ({ id: `zone-${id}-${reward}`, title: ['近战军械库', '破甲军械库', '防空军械库', '爆破军械库', '电磁军械库'][n]!, description: `肃清第 ${n + 1} 个军械据点的两波青色标记守军，缴获专用武器`, encounter: n, reward }))
  const storyTerminals = CAMPAIGN[id]!.goals.map((goal, i) => {
    const encounter = Math.min(encounters.length - 1, [2, 5, 8][i]!), x = encounters[encounter]!.end - 95
    const floor = ground.find(p => x >= p.x && x + 28 <= p.x + p.w)?.y ?? FLOOR
    return { id: `intel-${id}-${i}`, encounter, goal: i, kind: goal.kind, duration: goal.kind === 'intel' ? .3 : goal.kind === 'uplink' ? 3 : 2.5, x, y: floor - 44, w: 28, h: 44 }
  })
  const level: Level = { ...plan, subtitle: CAMPAIGN[id]!.brief.zh, id, storyTerminals, missions, difficulty: DIFFICULTIES[id]!, dungeon: DUNGEONS[id]!, ropes, ladders, hazards, encounters, ground, barriers, spikes, segments, enemies, platforms, pickups, checkpoints }
  specializeDungeon(level); installContra(level); installRouteFeatures(level);installDistricts(level);thinFieldSupplies(level);addRoutePatrols(level);fortifyPatrols(level);installLieutenants(level);clearLevelPatrols(level); return level
}
export const FRONT_LEVELS = plans.map(makeLevel)
function copyEnemies(enemies: Enemy[]) { return enemies.map(e => ({ ...e, ...(e.parts?{parts:{...e.parts}}:{}), ...(e.wakeAfter ? { wakeAfter: [...e.wakeAfter] } : {}) })) }
function copyPickups(pickups: Pickup[]) { return pickups.map(p => ({ ...p })) }
export function createRun(level: Level, unlocked: Weapon[] = ['rifle'], claimed: string[] = [], weaponXp = 0, operative:OperativeId='raven'): Run { const arsenal = WEAPON_ORDER.filter(w => w === 'rifle' || unlocked.includes(w)); return { fieldSwitches:[],zipline:null,biome:level.biome,sandTime:0,operative:readOperative(operative),skillCooldown:0,dashTime:0,dashFacing:1,airSkillUsed:false,arcade:createArcade(level), tactics:createTactics(level), tacticalControl:null, soundEvents: [], gunfire: null, weaponXp: cleanWeaponXp(weaponXp), growthClaims: [], threats: [], spotted: false, interactives: createInteractions(level), mountedGun: null, storyRequired: level.storyTerminals.length, storyCompleted: [], storyCharge: 0, aimTarget: null, aimAngle: null, flipAge: -1, flipFacing: 1, rope: null, ladder: null, ropeMotion: {}, interactDelay: 0, glideVx: 0, initialArsenal: [...arsenal], claimedMissions: [...claimed], missionRewards: [], stats: { shots: 0, hits: 0, damage: 0, blocked: 0, retries: 0 }, x: 65, y: FLOOR - BODY.h, vy: 0, facing: 1, grounded: true, duck: false, grace: .1, jumpBuffer: 0, hp: MAX_HEALTH, invincible: 0, damageCue: 0, armorHit: false, fireDelay: 0, weapon: 'rifle', arsenal, armor: 0, grenades: 3, grenadeDelay: 0, bullets: [], barriers: level.barriers.map(b => ({ ...b })), enemies: copyEnemies(level.enemies), pickups: copyPickups(level.pickups), score: 0, kills: 0, time: 0, checkpoint: -1, saved: null, status: 'playing', reason: '', effects: [] } }
export function respawn(run: Run, level: Level): Run {
  const stats = { ...run.stats, retries: run.stats.retries + 1 }
  const earned = weaponsForMissions(run.claimedMissions), permanent = WEAPON_ORDER.filter(w => run.initialArsenal.includes(w) || earned.includes(w))
  const base = { ...createRun(level, permanent, run.claimedMissions, run.weaponXp,run.operative), initialArsenal: [...run.initialArsenal], growthClaims: [...run.growthClaims], missionRewards: [...run.missionRewards] }
  if (!run.saved) return { ...base, stats, time: run.time }
  const saved = run.saved
  return { ...base, stats, fieldSwitches:[...(saved.fieldSwitches??[])],arcade:saved.arcade.map(p=>({...p})), tactics:saved.tactics.map(p=>({...p,crew:[...p.crew]})), interactives: saved.interactives.map(p => ({ ...p })), storyCompleted: [...saved.storyCompleted], x: saved.x, y: saved.y, barriers: saved.barriers.map(b => ({ ...b })), enemies: copyEnemies(saved.enemies), pickups: copyPickups(saved.pickups), score: saved.score, kills: saved.kills, weapon: saved.weapon, arsenal: WEAPON_ORDER.filter(w => saved.arsenal.includes(w) || permanent.includes(w)), armor: saved.armor, grenades: saved.grenades, checkpoint: saved.checkpoint, saved, invincible: 1.4, time: run.time }
}
export function exitOpen(run: Run) { return run.storyCompleted.length >= run.storyRequired && run.enemies.filter(e => e.guard).every(e => e.hp <= 0) }
function effect(run: Run, x: number, y: number, kind: CombatEffect['kind'], detail: Partial<CombatEffect> = {}) {
 const duration=detail.duration??(kind==='fall'?1.8:kind==='scrap'?1.5:kind==='boss'?1.8:kind==='blast'?1.35:kind==='destroy'?1.45:.32)
 const ground=['fall','scrap','boss','blast','destroy'].includes(kind)?destructionGround(run,x):undefined
 run.effects.push({x,y,kind,time:duration,duration,...(ground?{ground,floor:debrisFloor(ground,x,y)}:{}),...detail})
 if(run.effects.length>40)run.effects.shift()
}
function hurt(run: Run, reason: string, damage = 1) {
  if (run.invincible > 0) return
  const vehicle=controlled(run)
  if(vehicle?.kind==='vehicle'){
    vehicle.hp=Math.max(0,vehicle.hp-2*damage);run.armorHit=true;run.damageCue=.55;run.invincible=.4;run.stats.blocked++;emitSound(run,'armorHit',run.x)
    if(vehicle.hp===0){vehicle.state='wreck';leaveTactical(run);run.invincible=1.5;effect(run,vehicle.x+52,vehicle.y+30,'blast');emitSound(run,'tankBoom',vehicle.x)}
    return
  }
  run.damageCue = .55; run.armorHit = run.armor > 0; emitSound(run, run.armorHit ? 'armorHit' : 'hurt', run.x)
  const absorbed=Math.min(run.armor,damage);run.armor-=absorbed;run.stats.blocked+=absorbed
  const lost=Math.min(run.hp,damage-absorbed);run.hp-=lost;run.stats.damage+=lost
  run.invincible = 1.2
  effect(run, run.x + 13, run.y + 20, 'hit')
  if (run.hp <= 0) { run.hp = 0; run.status = 'dead'; emitSound(run, 'death', run.x); run.reason = reason;leaveTactical(run) }
}
export function weaponStats(run: Pick<Run, 'weaponXp'>, weapon: Weapon) { return grownWeapon(weapon, WEAPONS[weapon], run.weaponXp) }
function fire(run: Run, x: number, y: number, angle: number, friendly: boolean, kind: Bullet['kind'], speed: number, damage = 1) {
  const stats = friendly && kind !== 'enemy' && kind !== 'grenade' ? weaponStats(run, kind) : null
  if (friendly) run.stats.shots++
  run.bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, friendly, kind, damage: stats ? damage * stats.damage / WEAPONS[kind as Weapon].damage : damage, life: kind === 'grenade' ? 1 : friendly && kind !== 'enemy' ? (stats?.range ?? WEAPONS[kind].range) / speed : 4.5, pierce: friendly && kind !== 'enemy' && kind !== 'grenade' ? (stats?.pierce ?? WEAPONS[kind].pierce) : 1, hit: [] })
  if (run.bullets.length > 200) run.bullets.shift()
}
function damageEnemy(run: Run, e: Enemy, damage: number, kind?: Bullet['kind'], impactY?:number, impactX?:number,impactAngle?:number) {
  if (e.hp <= 0 || e.dormant) return
  const hitAngle=impactAngle??Math.atan2(e.y+e.h*.5-run.y-20,e.x+e.w*.5-run.x-13)
  const incoming=damage, scale=dungeonDamageScale(run,e,kind), stage=e.boss&&e.zone===0?tankStage(e):null
  damage *= scale
  if(e.boss&&e.zone===0){damage=tankDamage(e,damage,kind==='rocket'||kind==='grenade'?undefined:impactY)}
  const changed=stage!==null&&stage!==tankStage(e)
  const style=impactStyle(enemyDefense(e),kind,scale,damage,incoming,isBoss(e)&&bossState(run,e).open)
  emitSound(run, damage<=0?'shield':style==='weak'?'weakHit':style==='pierce'?'armorBreak':['armor','energy'].includes(style)?'metalHit':'hit',e.x+e.w/2)
  effect(run,impactX??e.x+e.w/2,impactY??e.y+e.h*.45,'hit',{impact:style,angle:hitAngle})
  // 分段装甲是坦克剩余生命的唯一来源，避免每次扣血取整后留下无法命中的残血。
  const remaining=e.boss&&e.zone===0&&e.parts?e.parts.tracks+e.parts.gun+e.parts.engine:e.hp-damage
  e.hp = Math.max(0, Math.round(remaining * 100) / 100); e.hitFlash = damage>0?.12:0
  if(changed){const target=tankTarget({...e,parts:stage==='tracks'?{tracks:1,gun:1,engine:1}:{tracks:0,gun:1,engine:1}});emitSound(run,'armorBreak',e.x);effect(run,target.x,target.y,'scrap',{material:'metal',angle:run.facing>0?0:Math.PI})}
  if (!e.hp) {
    const infantry=['soldier','runner','heavy','sniper'].includes(e.type)
    emitSound(run, isBoss(e) && e.type !== 'sniper' || e.type === 'tank' ? 'tankBoom' : ['drone', 'turret', 'mortar'].includes(e.type) ? 'explosion' : 'enemyDown', e.x + e.w / 2)
    if (!run.growthClaims.includes(e.id)) { run.growthClaims.push(e.id); run.weaponXp = cleanWeaponXp(run.weaponXp + killExperience(e)) }
    run.kills++; run.score += isBoss(e) ? 1500 : e.elite ? 650 : e.type === 'heavy' || e.type === 'turret' ? 180 : 100
    if(infantry)effect(run,e.x+e.w/2,e.y+e.h,'fall',{fallen:{...e,hitFlash:0,shotFlash:0,windup:0,volleys:0},angle:Math.cos(hitAngle)>=0?1:-1,facing:run.x<e.x?-1:1,seed:e.id})
    else effect(run,e.x+e.w/2,e.y+e.h/2,isBoss(e)?'boss':'destroy',{blastStyle:e.type==='drone'?'drone':e.type==='core'?'energy':'armor',size:Math.max(e.type==='drone'?38:26,Math.min(85,e.w*.5)),seed:e.id})
  }
}
function blast(run: Run, x: number, y: number, radius: number, damage: number, kind: 'rocket' | 'grenade') {
  let hit = false
  effect(run, x, y, 'blast',{blastStyle:'fuel',size:45}); emitSound(run, 'explosion', x)
  for (const e of run.enemies) if (e.hp > 0 && !e.dormant && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < radius) { damageEnemy(run, e, effectiveDamage(kind, e, damage) * Math.max(.4, 1 - Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) / radius * .65), kind,undefined,undefined,Math.atan2(e.y+e.h/2-y,e.x+e.w/2-x)); hit = true }
  for (const b of run.barriers) if (b.hp > 0 && Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) < radius) {
    if(b.requiredWeapon&&b.requiredWeapon!==kind){emitSound(run,'shield',b.x);effect(run,b.x+b.w/2,b.y+b.h/2,'hit',{impact:'blocked'});continue}
    b.hp = Math.max(0, Math.round((b.hp - damage) * 100) / 100); hit = true
    if (!b.hp) {run.score += 40;effect(run,b.x+b.w/2,b.y+b.h/2,'destroy',{blastStyle:b.requiredWeapon==='beam'?'energy':'dust',size:Math.min(42,b.w*.6+15),seed:b.id})}
  }
  for (const p of run.interactives) if (p.hp > 0 && p.kind !== 'gun' && Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) < radius) { damageInteractive(run, p, damage); hit = true }
  return hit
}
function damageInteractive(run: Run, prop: Interactive, damage: number) {
  if (prop.hp <= 0 || prop.kind === 'gun') return
  prop.hp = Math.max(0, prop.hp - damage)
  effect(run, prop.x + prop.w / 2, prop.y + 10, 'hit',{impact:'armor'})
  if (prop.hp > 0) { emitSound(run, 'metalHit', prop.x); return }
  if(environmentalKind(prop.kind)){triggerEnvironment(prop);emitSound(run,prop.kind==='fuel'?'barrelBoom':prop.kind==='steam'?'metalHit':'objective',prop.x);if(prop.kind==='fuel')blast(run,prop.x+14,prop.y+12,100,6,'grenade');return}
  emitSound(run, prop.kind === 'barrel' ? 'barrelBoom' : prop.kind === 'mine' ? 'explosion' : 'shield', prop.x)
  effect(run,prop.x+prop.w/2,prop.y+prop.h/2,'scrap',{material:'metal'})
  run.score += prop.kind === 'alarm' && !prop.triggered ? 150 : 50
  if (prop.kind === 'barrel' || prop.kind === 'mine') blast(run, prop.x + prop.w / 2, prop.y + 12, 150, 10, 'grenade')
  else if (prop.kind === 'power') {
    effect(run, prop.x + 12, prop.y + 12, 'destroy')
    for (const e of run.enemies) if (!e.boss && ['turret', 'drone'].includes(e.type) && Math.abs(e.x - prop.x) < 480) { e.dormant = false; damageEnemy(run, e, e.hp) }
  } else effect(run, prop.x + 12, prop.y + 12, 'destroy')
}
function hostileBlast(run: Run, x: number, y: number, radius: number, damage = 1) {
  effect(run, x, y, 'blast',{blastStyle:'fuel',size:45}); emitSound(run, 'explosion', x)
  if (Math.hypot(run.x + 13 - x, run.y + 25 - y) < radius) hurt(run, '被敌方爆炸波及', damage)
}
function registerHit(run: Run, bullet: Bullet, hit = true) { if (hit && !bullet.registeredHit) { run.stats.hits++; bullet.registeredHit = true } }
// 只辅助开枪方向；子弹仍按各自速度、散射和射程飞行，不会拐弯穿墙。
function rayBlocked(x: number, y: number, dx: number, dy: number, box: Rect) {
  let near = 0, far = 1
  for (const [origin, delta, min, max] of [[x, dx, box.x, box.x + box.w], [y, dy, box.y, box.y + box.h]]) {
    if (Math.abs(delta!) < .0001) { if (origin! < min! || origin! > max!) return false; continue }
    const a = (min! - origin!) / delta!, b = (max! - origin!) / delta!
    near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b))
    if (far < near) return false
  }
  return near < .995 && far > .005
}
export function aimSolution(run: Run, level: Level, input: Input,source?:{x:number,y:number,range:number,omnidirectional?:boolean,facilities?:boolean,baseAngle?:number}) {
  const base = source?.baseAngle??(input.up ? input.left || input.right ? run.facing > 0 ? -Math.PI / 4 : -Math.PI * 3 / 4 : -Math.PI / 2 : run.facing > 0 ? 0 : Math.PI)
  if (!input.aimAssist) return { angle: base, target: null as Enemy | null }
  const emplacement=run.interactives.find(p=>p.id===run.mountedGun),sight=source??(emplacement?{x:emplacement.x+22,y:emplacement.y+6}:playerRig({...run,aimAngle:base},input).gun),x=sight.x,y=sight.y
  const viewWidth=input.view?.worldWidth??input.viewWidth??960,camera=input.view?.x??Math.max(0,Math.min(level.width-viewWidth,run.x-viewWidth*.29))
  const range = source?.range??weaponStats(run, run.weapon).range, cone = source?.omnidirectional?Math.PI:input.up ? Math.PI / 6 : Math.PI * .24
  const obstacles = [...tacticalDecks(run),...fieldWalls(level,run),...arcadePlatforms(level,run),...fieldDecks(level,run),...desertDecks(run), ...terrainSolids(arcadeGround(level,run).filter(p => p.x+p.w>run.x-1400&&p.x<run.x+1400)), ...run.barriers.filter(b => b.hp > 0)]
  let chosen: Enemy | null = null, angle = base, best = Infinity
  const priority = run.interactives.filter(p => source?.facilities!==false && p.hp > 0 && (p.kind === 'coolant' || p.kind === 'relay' || p.kind === 'mine' && input.duck) && (p.x - x) * run.facing > 0 && Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) < range && !obstacles.some(b => rayBlocked(x, y, p.x + p.w / 2 - x, p.y + p.h / 2 - y, b))).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
  if (priority) return { angle: Math.atan2(priority.y + priority.h / 2 - y, priority.x + priority.w / 2 - x), target: null }
  for (const e of run.enemies) {
    if (e.boss && e.zone === 5 && run.interactives.some(p=>p.kind==='relay'&&p.hp>0)) continue
    if (e.hp <= 0 || e.dormant || e.x + e.w < camera || e.x > camera + viewWidth || input.view&&(e.y+e.h<input.view.y||e.y>input.view.y+input.view.worldHeight)) continue
    const target=e.boss&&e.zone===0?tankTarget(e):{x:e.x+e.w/2,y:e.y+e.h*.45}
    const dx = target.x - x, dy = target.y - y, distance = Math.hypot(dx, dy)
    if (distance > range || distance < 8 || !source?.omnidirectional && !input.up && dx * run.facing < 0) continue
    const a = Math.atan2(dy, dx), difference = Math.abs(Math.atan2(Math.sin(a - base), Math.cos(a - base)))
    if (difference > cone || obstacles.some(b => rayBlocked(x, y, dx, dy, b))) continue
    const score = distance + difference * (source?.omnidirectional?40:180) - (run.aimTarget === e.id ? 65 : 0)
    if (score < best) { chosen = e; angle = a; best = score }
  }
  return { angle, target: chosen }
}
export function ropePoint(rope: Rope, angle: number) { return { x: rope.x + Math.sin(angle) * rope.length, y: rope.y + Math.cos(angle) * rope.length } }
function releaseRope(run: Run, level: Level, jump: boolean) {
  const rope = level.ropes.find(r => r.id === run.rope), m = rope ? run.ropeMotion[rope.id] : null
  if (rope && m) { run.glideVx = Math.max(-150, Math.min(150, Math.cos(m.angle) * rope.length * m.speed)); run.vy = jump ? Math.min(-420, -Math.sin(m.angle) * rope.length * m.speed - 100) : -Math.sin(m.angle) * rope.length * m.speed }
  emitSound(run, 'ropeRelease', run.x); run.rope = null; run.grounded = false; run.grace = 0; run.jumpBuffer = 0; run.interactDelay = .45
}
function releaseZipline(run:Run,jump=false){
  run.glideVx=Math.max(-140,Math.min(140,run.zipline?.speed??0));run.zipline=null;run.vy=jump?-380:0;run.grounded=false;run.grace=0;run.jumpBuffer=0;run.interactDelay=.5;emitSound(run,'ropeRelease',run.x)
}
export function step(run: Run, level: Level, input: Input, dt: number) {
  if (run.status !== 'playing') return
  if(run.hp<=0){run.status='dead';run.reason='陷入流沙，跳跃或冲刺脱离';return}
  input=arcadeInput(level,run,input)
  const wasGrounded = run.grounded, previousVy = run.vy
  if (run.flipAge >= 0) run.flipAge = Math.min(.52, run.flipAge + dt)
  run.soundEvents ??= []
  run.soundEvents.length = 0
  run.skillCooldown=Math.max(0,(run.skillCooldown??0)-dt);run.dashTime=Math.max(0,(run.dashTime??0)-dt)
  run.time += dt; carryField(level,run,dt);run.invincible = Math.max(0, run.invincible - dt); run.fireDelay = Math.max(0, run.fireDelay - dt)
  run.damageCue = Math.max(0, run.damageCue - dt)
  run.grenadeDelay = Math.max(0, run.grenadeDelay - dt)
  const nearby = (r: Rect) => r.x + r.w > run.x - 1200 && r.x < run.x + 1200
  tickDesert(level,run,dt)
  const ground = [...arcadeGround(level,run),...tacticalDecks(run),...desertDecks(run),...fieldWalls(level,run)].filter(nearby), barriers = run.barriers.filter(b => b.hp > 0 && nearby(b)), platforms = [...arcadePlatforms(level,run),...fieldDecks(level,run)].filter(nearby)
  // Suspended beams are solid cover for both sides; use the same geometry for aiming and shots.
  const shotGround=terrainSolids(ground),projectileSolids=[...shotGround,...platforms],patrolSurfaces=[...ground,...platforms]
  rememberEffectGround(run,[...ground,...platforms,...barriers])
  for (const e of run.enemies) if (e.dormant && e.hp > 0 && Math.abs(e.x - run.x) < 700 && e.wakeAfter?.every(id => run.enemies.find(a => a.id === id)?.hp === 0)) { e.wakeTimer = Math.max(0, (e.wakeTimer ?? 1.1) - dt); if (e.wakeTimer === 0) { if (e.type !== 'drone' && Math.abs(e.x - run.x) < 100) { const anchor = run.enemies.find(a => a.id === e.wakeAfter?.[0])?.home ?? e.home; const left = anchor - 250, right = anchor + 190; e.x = e.home = Math.abs(left - run.x) > Math.abs(right - run.x) ? left : right; const support=patrolSurfaces.filter(p=>e.x+e.w/2>=p.x&&e.x+e.w/2<p.x+p.w&&surfaceY(p,e.x+e.w/2)>=e.y+e.h-1).sort((a,b)=>surfaceY(a,e.x+e.w/2)-surfaceY(b,e.x+e.w/2))[0]; if(support)e.y=e.homeY=surfaceY(support,e.x+e.w/2)-e.h }; e.dormant = false; effect(run, e.x + e.w / 2, e.y + e.h / 2, 'pickup') } }
  const enemies = run.enemies.filter(e => e.hp > 0 && !e.dormant && Math.abs(e.x - run.x) < 1150)
  run.effects = run.effects.filter(e => (e.time -= dt) > 0)
  let direction = Number(input.right) - Number(input.left)
  let grabbed = false
  if (direction) run.facing = direction
  if(input.skill||run.operative==='fox'&&input.jump&&!run.grounded&&run.grace<=0)useOperativeSkill(run)
  if(run.dashTime>0){direction=run.dashFacing;run.facing=run.dashFacing}
  run.interactDelay = Math.max(0, run.interactDelay - dt)
  run.glideVx *= Math.exp(-3.5 * dt)
  if (input.interact && run.interactDelay === 0) {
    run.interactDelay = .3
    if(run.zipline){releaseZipline(run,!!input.jump);grabbed=true}
    else if (nearbyZipline(level,run)&&run.rope===null&&run.ladder===null&&run.mountedGun===null&&run.tacticalControl===null){const p=nearbyZipline(level,run)!;run.zipline={id:p.z.id,t:p.t,speed:run.facing*140};run.grounded=false;run.grace=0;run.jumpBuffer=0;grabbed=true;emitSound(run,'ropeGrab',run.x)}
    else if(operateEnvironment(run)){grabbed=true;run.interactDelay=.45}
    else if(operateField(level,run)){grabbed=true;run.interactDelay=.45}
    else if (tacticalInteract(run,level)) { grabbed = true; run.interactDelay=.5 }
    else if (run.mountedGun !== null) { run.mountedGun = null; grabbed = true; run.interactDelay = .5 }
    else if (run.grounded && gunNearby(run)) { run.mountedGun = gunNearby(run)!.id; grabbed = true; run.interactDelay = .5 }
    else if (run.rope !== null) releaseRope(run, level, !!input.jump)
    else if (run.ladder !== null) { run.ladder = null; run.vy = input.jump ? -520 : -90; run.grace = 0 }
    else {
      const rope = level.ropes.find(r => { const p = ropePoint(r, run.ropeMotion[r.id]?.angle ?? -.85); return Math.hypot(p.x - run.x - 13, p.y - run.y - 12) <= 64 })
      const ladder = level.ladders.find(l => Math.abs(l.x + l.w / 2 - run.x - 13) <= 38 && run.y + BODY.h >= l.y && run.y <= l.y + l.h)
      if (rope) { emitSound(run, 'ropeGrab', run.x); grabbed = true; run.rope = rope.id; run.ropeMotion[rope.id] ??= { angle: -.85, speed: 0 }; run.grounded = false; run.grace = 0; run.jumpBuffer = 0 }
      else if (ladder) { emitSound(run, 'ladderGrab', run.x); grabbed = true; run.ladder = ladder.id; run.rope = null; run.grace = 0; run.jumpBuffer = 0 }
    }
  }
  if (run.mountedGun !== null && (input.jump || run.hp <= 0)) { run.mountedGun = null; run.interactDelay = .5 }
  const mounted = run.interactives.find(p => p.id === run.mountedGun)
  if (mounted) { run.x = mounted.x + mounted.w/2 - BODY.w/2 - run.facing*31; run.y=mounted.y+mounted.h-BODY.h; direction = 0; input = { ...input, left: false, right: false, jump: false, up: false, duck: false }; run.rope = null; run.ladder = null }
  input=tickTactics(run,level,input,dt,{damage:(e,n)=>damageEnemy(run,e,n),aim:(x,y)=>{const a=aimSolution(run,level,input,{x,y,range:weaponStats(run,'rocket').range,omnidirectional:true,facilities:false,baseAngle:run.facing>0?0:Math.PI});return{angle:a.angle,target:a.target?.id??null}},shot:(x,y,a,k,n,pivot)=>{const distance=k==='rocket'?48:36,origin=clearMuzzle(pivot??{x:x-Math.cos(a)*distance,y:y-Math.sin(a)*distance},{x,y},[...projectileSolids,...barriers]);fire(run,origin.x,origin.y,a,true,k,k==='rocket'?660:1100,n);if(k==='rocket')run.bullets.at(-1)!.enemyShot='shell'},blast:(x,y)=>{blast(run,x,y,125,10,'grenade')},hurt:()=>hurt(run,'被吊箱砸中')})
  if(controlled(run))direction=0
  tickInteractions(run, level, dt)
  if(input.jump&&!grabbed&&run.zipline)releaseZipline(run,true)
  if (input.jump && !grabbed && run.rope !== null) releaseRope(run, level, true)
  if (input.jump && !grabbed && run.ladder !== null) { run.ladder = null; run.vy = -520; run.grace = 0; run.jumpBuffer = 0; run.interactDelay = .35 }
  for (const [id, motion] of Object.entries(run.ropeMotion)) {
    const r = level.ropes.find(r => r.id === Number(id))
    if (!r || Math.abs(r.x - run.x) > 1400) continue
    const pumping = run.rope === r.id ? direction * 2 : 0
    motion.speed += (-1700 / r.length * Math.sin(motion.angle) + pumping - motion.speed * .18) * dt
    motion.speed = Math.max(-1.65, Math.min(1.65, motion.speed)); motion.angle += motion.speed * dt
    if (Math.abs(motion.angle) > 1.12) { motion.angle = Math.sign(motion.angle) * 1.12; motion.speed = 0 }
  }
  const rope = level.ropes.find(r => r.id === run.rope), ladder = level.ladders.find(l => l.id === run.ladder)
  const zip=level.ziplines?.find(z=>z.id===run.zipline?.id)
  if(zip&&run.zipline){
    const z=run.zipline,target=(direction||Math.sign(z.speed)||1)*215;z.speed+=Math.max(-550*dt,Math.min(550*dt,target-z.speed));z.t=Math.max(0,Math.min(1,z.t+z.speed*dt/(zip.endX-zip.x)));const p=ziplinePoint(zip,z.t);run.x=p.x-13;run.y=p.y+18;run.vy=0;run.grounded=false;run.duck=false
    if(z.t>=1&&z.speed>0||z.t<=0&&z.speed<0)releaseZipline(run)
  } else if (rope) {
    const p = ropePoint(rope, run.ropeMotion[rope.id]!.angle)
    run.x = p.x - 13; run.y = p.y - 12; run.vy = 0; run.grounded = false; run.duck = false
    const motion = run.ropeMotion[rope.id]!
    const shore = level.ground.find(g => g.x > rope.x && g.x < rope.x + rope.length && p.x >= g.x - 8)
    if (shore && motion.angle >= .84 && motion.speed > 0) releaseRope(run, level, true)
  } else if (ladder) {
    run.x = ladder.x + ladder.w / 2 - 13; run.vy = (Number(input.duck) - Number(input.up)) * 135
    run.y = Math.max(ladder.y - BODY.h, Math.min(ladder.y + ladder.h - BODY.h, run.y + run.vy * dt)); run.grounded = false; run.duck = false
    if (run.y <= ladder.y - BODY.h && input.up || run.y >= ladder.y + ladder.h - BODY.h && input.duck) { run.ladder = null; run.grounded = true; run.vy = 0; run.interactDelay = .3 }
  } else {
    run.grace = run.grounded ? .1 : Math.max(0, run.grace - dt)
    run.jumpBuffer = input.jump ? .1 : Math.max(0, run.jumpBuffer - dt)
    run.duck = input.duck && run.grounded
    if (run.jumpBuffer > 0 && run.grace > 0) { emitSound(run, 'jump', run.x); effect(run, run.x + 13, run.y + BODY.h, 'jump'); run.flipAge = 0; run.flipFacing = run.facing; run.vy = -620; run.grounded = false; run.duck = false; run.grace = 0; run.jumpBuffer = 0 }
    const previousX=run.x,onIncline=ground.some(p=>p.rise&&previousX+13>=p.x&&previousX+13<=p.x+p.w&&Math.abs(run.y+BODY.h-surfaceY(p,previousX+13))<6)
    run.x = Math.max(0, Math.min(level.width - BODY.w, run.x + (direction * (run.dashTime>0?720:run.duck ? 105 : desertSand(level,run)&&run.grounded ? 105 : 225) + run.glideVx) * dt))
    const encounter = currentEncounter(level, run)
    if (encounter) run.x = Math.min(run.x, encounter.end - BODY.w)
    const objective = nextStoryTerminal(run, level)
    if (objective) run.x = Math.min(run.x, level.encounters[objective.encounter]!.end - BODY.w)
    for (const b of barriers) if (b.requiredWeapon && b.hp > 0 && run.x < b.x + b.w && run.x + BODY.w >= b.x && direction > 0) run.x = b.x - BODY.w
    for (const b of barriers) if (b.hp > 0 && direction && overlaps({ x: run.x, y: run.y + (run.duck ? 20 : 0), w: BODY.w, h: run.duck ? 20 : BODY.h }, b)) run.x = direction > 0 ? b.x - BODY.w : b.x + b.w
    for (const p of [...ground, ...platforms]) if (!p.rise && direction && !(wasGrounded&&onIncline&&run.y+BODY.h-p.y<8) && (direction>0?previousX+BODY.w<=p.x+.5:previousX>=p.x+p.w-.5) && p.y < run.y + BODY.h - 2 && overlaps({ x: run.x, y: run.y + 2, w: BODY.w, h: BODY.h - 3 }, p)) run.x = direction > 0 ? p.x - BODY.w : p.x + p.w
    if(wasGrounded&&onIncline&&run.vy>=0){const flat=ground.find(p=>run.x+13>=p.x&&run.x+13<p.x+p.w&&Math.abs(run.y+BODY.h-surfaceY(p,run.x+13))<8);if(flat)run.y=surfaceY(flat,run.x+13)-BODY.h}
    if(wasGrounded&&run.vy>=0){const ramp=ground.find(p=>p.rise&&run.x+13>=p.x&&run.x+13<=p.x+p.w&&Math.abs(run.y+BODY.h-surfaceY(p,previousX+13))<5);if(ramp)run.y=surfaceY(ramp,run.x+13)-BODY.h}
    const head = run.y, bottom = run.y + BODY.h
    run.vy = Math.min(850, run.vy + 1700 * dt); run.y += run.vy * dt; run.grounded = false
    if (run.vy < 0) for (const p of [...shotGround, ...platforms, ...barriers].sort((a, b) => b.y + b.h - a.y - a.h)) {
      if (head >= p.y + p.h - .5 && run.y < p.y + p.h && run.x + BODY.w > p.x && run.x < p.x + p.w) {
        run.y = p.y + p.h; run.vy = 0; run.flipAge = -1; run.jumpBuffer = 0
        break
      }
    }
    for (const p of [...ground, ...platforms, ...barriers]) { const top=surfaceY(p,run.x+13);if (run.vy >= 0 && bottom <= top + .5 && run.y + BODY.h >= top && run.x + BODY.w > p.x && run.x < p.x + p.w) { run.y = top - BODY.h; run.vy = 0; run.grounded = true } }
    if (!wasGrounded && run.grounded && previousVy > 150) { emitSound(run, 'land', run.x); effect(run, run.x + 13, run.y + BODY.h, 'land') }
    run.duck = input.duck && run.grounded
    if (run.grounded) run.glideVx = 0
  }
  if (run.grounded) run.airSkillUsed=false
  if (run.grounded || run.zipline || run.rope !== null || run.ladder !== null) run.flipAge = -1
  if (level.spikes.some(p => overlaps(playerBody(run), { x: p.x + 5, y: p.y + 5, w: p.w - 10, h: p.h - 5 }))) hurt(run, '碰到了尖刺障碍')
  tickEnvironment(run,level,dt,{damage:(e,n)=>damageEnemy(run,e,n),hurt:reason=>hurt(run,reason)})
  run.spotted = false
  for (const hazard of level.hazards) {
    if (!nearby(hazard) || poweredDown(run, hazard) && (hazard.type !== 'tide'||hazard.circuit!==undefined)) continue
    const active = hazardState(hazard, run.time, level.id) === 'active'
    if (!active || !overlaps(playerBody(run), hazard)) continue
    if (hazard.type === 'conveyor' && run.grounded && run.mountedGun === null) run.glideVx = Math.floor(hazard.offset) % 2 ? -85 : 85
    else if (hazard.type === 'gust' && !run.grounded && run.rope === null && run.ladder === null) { run.glideVx = Math.max(-110, Math.min(110, run.glideVx + (Math.floor(hazard.offset) % 2 ? -1 : 1) * dt * 260)); run.vy -= dt * 550 }
    else if (hazard.type === 'searchlight') run.spotted = !run.duck
    else if (hazard.type === 'tide' || hazard.type === 'surge' || hazard.type === 'laser' || hazard.type === 'crusher') hurt(run, hazard.type === 'crusher' ? '被冲压机关击中' : '碰到了通电电网')
  }
  for (const p of run.interactives) if (p.kind === 'mine' && p.hp > 0) {
    if (p.timer < 0 && Math.hypot(run.x + 13 - p.x - 12, run.y + 35 - p.y) < 55) p.timer = .6
    if (p.timer >= 0) { p.timer -= dt; if (p.timer <= 0) { damageInteractive(run, p, p.hp); hostileBlast(run, p.x + 12, p.y, 70) } }
  }
  for (const threat of run.threats) {
    if(threat.owner!==undefined&&!run.enemies.some(e=>e.id===threat.owner&&e.hp>0)){threat.warning=0;threat.active=0;continue}
    threat.warning -= dt
    if (threat.warning > 0) continue
    if (!threat.fired) { threat.fired = true; effect(run, threat.x + threat.w / 2, threat.y + threat.h / 2, threat.kind === 'beam' ? 'hit' : 'blast') }
    if (!threat.visualOnly && threat.active > 0 && overlaps(playerBody(run), threat)) hurt(run, '被敌方爆炸波及', run.enemies.some(e=>e.id===threat.owner&&e.boss&&e.zone===0&&!e.desertBoss)?2:1)
    threat.active -= dt
  }
  run.threats = run.threats.filter(t => t.warning > 0 || t.active > 0)

  if (run.y > 505) { run.hp = 0; run.status = 'dead'; run.reason = '掉进了断桥下方'; return }
  run.infantryMotion=trackInfantry(run.infantryMotion,run.x,run.time,run.grounded,run.grounded&&(input.left||input.right||run.dashTime>0)&&!run.duck,run.facing,run.duck)
  const vehicle=controlled(run)
  const aim = vehicle?.kind==='vehicle'?{angle:vehicle.cannonAim??(run.facing>0?0:Math.PI),target:run.enemies.find(e=>e.id===vehicle.target&&e.hp>0)??null}:aimSolution(run, level, input)
  run.fireAngle=aim.angle;run.aimTarget = aim.target?.id ?? null; run.aimAngle = input.aimAssist ? aim.angle : null
  if (mounted && input.shoot && run.fireDelay <= 0 && !mounted.overheated) {
    run.gunfire = { serial: (run.gunfire?.serial ?? 0) + 1, weapon: 'rapid',at:run.time }
    const gun={x:mounted.x+22,y:mounted.y+6},muzzle={x:gun.x+Math.cos(aim.angle)*34,y:gun.y+Math.sin(aim.angle)*34},origin=clearMuzzle(gun,muzzle,[...projectileSolids,...barriers])
    fire(run,origin.x,origin.y,aim.angle,true,'rapid',1100,2.4)
    mounted.heat = Math.min(100, mounted.heat + 6); mounted.overheated = mounted.heat >= 100; run.fireDelay = .075
  }
  if (!mounted && input.shoot && run.fireDelay <= 0) {
    run.gunfire = { serial: (run.gunfire?.serial ?? 0) + 1, weapon: run.weapon,at:run.time }
    const angle = aim.angle
    run.shotDelay=weaponStats(run,run.weapon).delay;run.fireDelay=run.shotDelay
    const rig=playerRig(run,input),origin=clearMuzzle(rig.gun,rig.muzzle,[...projectileSolids,...barriers]),x=origin.x,y=origin.y
    for (const offset of run.weapon === 'spread' ? [-1, -2/3, -1/3, 0, 1/3, 2/3, 1].map(n => n * weaponStats(run, 'spread').spread) : [0]) fire(run, x, y, angle + offset, true, run.weapon, WEAPONS[run.weapon].speed, WEAPONS[run.weapon].damage)
    run.fireDelay = weaponStats(run, run.weapon).delay
  }
  if (input.grenade && run.grenades > 0 && run.grenadeDelay <= 0) {
    fire(run, run.x + 13, run.y + 12, run.facing > 0 ? -.65 : Math.PI + .65, true, 'grenade', 420, 10)
    run.grenades--; run.grenadeDelay = .8
  }
  const difficulty = level.difficulty
  for (const e of enemies) {
    if(e.hp<=0)continue
    e.hitFlash = Math.max(0, (e.hitFlash ?? 0) - dt);e.shotFlash=Math.max(0,(e.shotFlash??0)-dt)
    if(radarOff(run,e)){e.shotFlash=0;e.windup=0;e.cooldown=Math.max(.3,e.cooldown);continue}
    if(e.tower!==undefined&&Math.abs(e.y-run.y)>240)continue
    if(!crossfireOpen(e,run.time)){e.cooldown=Math.max(e.cooldown,.15);e.windup=0;continue}
    if (Math.abs(e.x - run.x) > 620) continue
    clearPatrolSpawn(e,level,platforms,barriers,true)
    e.age += dt; e.cooldown -= dt
    if(e.elite){
      e.cooldown+=dt
      stepLieutenant(run,level,e,dt,{shot:(x,y,a,style,speed)=>{fire(run,x,y,a,false,'enemy',speed);run.bullets.at(-1)!.enemyShot=style}})
      if(overlaps(playerBody(run),e))hurt(run,'被敌人逼近了')
      continue
    }
    if (e.boss && e.zone !== undefined) {
      e.cooldown += dt
      e.vehicleMotion??=vehicleMotion(undefined,e.x,dt);
      stepDungeonBoss(run, level, e, dt, { shot: (x, y, angle, style, speed) => { fire(run, x, y, angle, false, 'enemy', speed, e.zone===0&&!e.desertBoss?2:1); run.bullets.at(-1)!.enemyShot = style; e.lastShotAt=e.age;e.shotFlash=.12; e.volleys++ } })
      e.vehicleMotion=vehicleMotion(e.vehicleMotion,e.x,dt,e.parts?.tracks!==0)
      const dash = e.zone === 3 && e.age % 6 > 2 && e.age % 6 < 3.3
      const body = dash ? { x: e.x, y: e.y + e.h * .62, w: e.w, h: e.h * .38 } : e
      if (overlaps(playerBody(run), body)) hurt(run, '碰到了首领装甲')
      continue
    }
    if(e.type==='tank')e.vehicleMotion??=vehicleMotion(undefined,e.x,dt)
    const oldX = e.x, oldY = e.y
    if (e.type === 'soldier' || e.type === 'heavy') e.x = e.home + Math.sin(e.age * .9) * 30
    if (e.role === 'boarding' || e.role === 'welder') { const stop = e.role === 'welder' ? 95 : 200; e.x = Math.abs(run.x - oldX) > stop ? oldX + Math.sign(run.x - oldX) * (e.role === 'welder' ? 42 : 52) * dt : oldX }

    if (e.role === 'spotter') e.x = e.home + Math.sin(e.age * .7) * 25
    if (e.type === 'runner') e.x += Math.sign(run.x - e.x) * difficulty.runnerSpeed * dt
    if (e.type === 'drone') { e.x = e.home + Math.sin(e.age * (e.role === 'interceptor' ? 1.8 : 1.2)) * (e.role === 'interceptor' ? 85 : 28); e.y = e.homeY + Math.sin(e.age * 1.8) * 18 }
    if(['soldier','runner','heavy'].includes(e.type)){const p=patrolSurfaces.find(p=>e.x+e.w/2>=p.x&&e.x+e.w/2<p.x+p.w&&Math.abs(surfaceY(p,oldX+e.w/2)-e.y-e.h)<8);if(p)e.y=surfaceY(p,e.x+e.w/2)-e.h}
    if (['soldier', 'runner', 'heavy'].includes(e.type) && !patrolSurfaces.some(p => e.x + e.w / 2 >= p.x && e.x + e.w / 2 < p.x + p.w && Math.abs(surfaceY(p,e.x+e.w/2) - e.y - e.h) < 2)) e.x = oldX
    constrainPatrol(e,{x:oldX,y:oldY},level,platforms,barriers)
    e.infantryMotion=trackInfantry(e.infantryMotion,e.x,e.age,true,true,run.x<e.x?-1:1)
    const boss = isBoss(e)
    if (boss) e.x = e.home + Math.sin(e.age * .6) * (e.type === 'mech' ? 30 : 8)
    if(e.type==='tank')e.vehicleMotion=vehicleMotion(e.vehicleMotion,e.x,dt,e.parts?.tracks!==0)
    if (e.role === 'spotter' && run.spotted) e.cooldown -= dt * 2
    if(steamObscures(run,e)||stormObscures(run,level,e,h=>hazardState(h,run.time,level.id)==='active'&&!poweredDown(run,h))){e.cooldown=e.windup>0?.3:Math.min(3,Math.max(.3,e.cooldown));e.windup=0}
    if (e.cooldown <= 0 && e.windup <= 0 && e.type !== 'runner') { e.aim = Math.atan2(run.y + (boss && e.volleys % 2 ? 32 : 12) - (e.y + e.h * .38), run.x + 13 - (e.x + e.w / 2)); e.windup = e.type === 'mortar' ? .9 : e.type === 'tank' && !boss ? .85 : e.type === 'sniper' ? .8 : boss ? .52 - level.id * .02 : difficulty.windup + .08; e.cooldown = 100 }
    if (e.windup > 0) {
      e.windup -= dt
      if (e.windup <= 0) {
        const angry = e.hp < e.maxHp / 2, finalPhase = boss && e.hp < e.maxHp / 4
        const fan = e.type === 'tank' || e.type === 'mortar' ? 1 : boss ? finalPhase ? 7 : angry ? 5 : 3 : e.type === 'turret' ? level.id >= 4 ? 5 : 3 : e.type === 'heavy' ? 3 : e.type === 'drone' ? 2 : e.type === 'soldier' && level.id >= 3 ? 2 : 1
        const speed = e.type === 'sniper' ? 410 + level.id * 12 : e.type === 'tank' ? 230 : e.type === 'mortar' ? 320 : e.type === 'core' ? 175 + level.id * 9 : difficulty.bulletSpeed + (boss ? 20 : 0)
        e.lastShotAt=e.age;e.shotFlash=.12
        for (let i = 0; i < fan; i++) {
          const pose=enemyMuzzle(e,run.x),origin=clearMuzzle(pose.gun,pose.muzzle,[...projectileSolids,...barriers]),x=origin.x,y=origin.y
          fire(run, x, y, e.aim + (i - (fan - 1) / 2) * (boss ? .16 : e.type === 'turret' ? .22 : .1), false, 'enemy', speed)
          const shot = run.bullets.at(-1)!
          shot.enemyShot = e.role === 'welder' ? 'orb' : e.role === 'boarding' ? 'burst' : e.role === 'capacitor' ? 'orb' : ENEMY_SHOTS[e.type]
          if (e.role === 'welder') { shot.vx *= .7; shot.vy *= .7; shot.life = .85 }
          if (e.type === 'mortar') { const flight = .95, floor = level.ground.find(g => run.x + 13 >= g.x && run.x + 13 < g.x + g.w)?.y ?? FLOOR; shot.vx = (run.x + 13 - x) / flight; shot.vy = (floor - 8 - y - .5 * 700 * flight * flight) / flight; run.threats.push({ x: run.x - 32, y: floor - 40, w: 90, h: 40, warning: flight, active: .18, kind: 'bomb' }) }
        }
        e.volleys++
        e.cooldown = e.type === 'mortar' ? 2.8 : e.type === 'tank' && !boss ? 2.6 : e.type === 'sniper' ? 2.3 : boss ? difficulty.cooldown * (finalPhase ? .58 : angry ? .72 : .95) : difficulty.cooldown*1.05
      }
    }
    if (overlaps(playerBody(run), e)) hurt(run, boss ? '碰到了首领装甲' : '被敌人逼近了')
  }
  for (const bullet of run.bullets) {
    if (bullet.kind === 'grenade' || bullet.enemyShot === 'mortar') bullet.vy += 700 * dt
    bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt
    const radius = bullet.enemyShot === 'shell' || bullet.enemyShot === 'orb' || bullet.enemyShot === 'mortar' ? 5 : 3
    const box = { x: bullet.x - radius, y: bullet.y - radius, w: radius * 2, h: radius * 2 }
    if (bullet.kind === 'grenade' && (bullet.life <= 0 || projectileSolids.some(p => overlaps(box, p)))) { registerHit(run, bullet, blast(run, bullet.x, bullet.y - 8, 175, bullet.damage, 'grenade')); bullet.life = 0; continue }
    if (!bullet.friendly && bullet.enemyShot === 'mortar' && (bullet.life <= 0 || projectileSolids.some(p => overlaps(box, p)))) { hostileBlast(run, bullet.x, bullet.y, 65, bullet.damage); bullet.life = 0; continue }
    if (projectileSolids.some(p => overlaps(box,p)||rayBlocked(bullet.x-bullet.vx*dt,bullet.y-bullet.vy*dt,bullet.vx*dt,bullet.vy*dt,p))) {
      if (!bullet.friendly && ['shell', 'missile'].includes(bullet.enemyShot ?? '')) hostileBlast(run, bullet.x, bullet.y, 55, bullet.damage)
      else if (bullet.kind === 'rocket') registerHit(run, bullet, blast(run, bullet.x, bullet.y, weaponStats(run, 'rocket').radius, bullet.damage, 'rocket'))
      else{
        const contact=projectileContact({x:bullet.x-bullet.vx*dt,y:bullet.y-bullet.vy*dt},bullet,projectileSolids,radius)??{x:bullet.x,y:bullet.y,nx:-Math.sign(bullet.vx),ny:-Math.sign(bullet.vy)}
        const slope=ground.find(p=>p.rise&&contact.x>=p.x&&contact.x<=p.x+p.w&&Math.abs(contact.y-surfaceY(p,contact.x))<16)
        if(slope){contact.y=surfaceY(slope,contact.x);const a=Math.atan2(-1,slope.rise!/slope.w);contact.nx=Math.cos(a);contact.ny=Math.sin(a)}
        const energy=bullet.kind==='beam'||['plasma','orb'].includes(bullet.enemyShot??'')
        const material=terrainMaterial(level,contact,platforms)
        effect(run,contact.x,contact.y,'hit',{impact:'terrain',angle:Math.atan2(contact.ny,contact.nx),material,weapon:energy?'beam':bullet.kind,duration:bullet.kind==='rapid'?.18:.3})
        emitSound(run,energy?'shield':material==='sand'?'sandHit':material==='concrete'?'stoneHit':'metalHit',contact.x)
      }
      bullet.life = 0; continue
    }
    if (bullet.friendly && bullet.life > 0) {
      const sweep = { x: Math.min(bullet.x, bullet.x - bullet.vx * dt) - 3, y: Math.min(bullet.y, bullet.y - bullet.vy * dt) - 3, w: Math.abs(bullet.vx * dt) + 6, h: Math.abs(bullet.vy * dt) + 6 }
      const props = run.interactives.filter(p => p.hp > 0 && p.kind !== 'gun' && overlaps(sweep, p)).sort((a, b) => Math.abs(a.x - (bullet.x - bullet.vx * dt)) - Math.abs(b.x - (bullet.x - bullet.vx * dt)))
      const prop = props[0]
      if (prop && !barriers.some(b => rayBlocked(bullet.x - bullet.vx * dt, bullet.y - bullet.vy * dt, prop.x + prop.w / 2 - (bullet.x - bullet.vx * dt), prop.y + prop.h / 2 - (bullet.y - bullet.vy * dt), b))) {
        registerHit(run, bullet); damageInteractive(run, prop, bullet.damage)
        if (bullet.kind === 'rocket' || bullet.kind === 'grenade') blast(run, prop.x + prop.w / 2, prop.y + 12, 150, bullet.damage, bullet.kind)
        bullet.life = 0; continue
      }
    }
    for (const barrier of barriers) {
      const hitId = -barrier.id - 1000
      if (barrier.hp <= 0 || bullet.hit.includes(hitId) || bullet.life <= 0 || !(overlaps(box,barrier)||rayBlocked(bullet.x-bullet.vx*dt,bullet.y-bullet.vy*dt,bullet.vx*dt,bullet.vy*dt,barrier))) continue
      if (!bullet.friendly && ['shell', 'missile', 'mortar'].includes(bullet.enemyShot ?? '')) { hostileBlast(run, bullet.x, bullet.y, 55, bullet.damage); bullet.life = 0; break }
      if (bullet.kind === 'rocket' || bullet.kind === 'grenade') { registerHit(run, bullet, blast(run, bullet.x, bullet.y, bullet.kind === 'grenade' ? 175 : weaponStats(run, 'rocket').radius, bullet.damage, bullet.kind)); bullet.life = 0; break }
      if (barrier.requiredWeapon && barrier.requiredWeapon !== bullet.kind) { bullet.life = 0; emitSound(run, 'shield', bullet.x); effect(run, bullet.x, bullet.y, 'hit',{impact:'blocked',angle:Math.atan2(bullet.vy,bullet.vx)}); break }
      bullet.hit.push(hitId); barrier.hp = Math.max(0, Math.round((barrier.hp - bullet.damage) * 100) / 100); bullet.pierce--; if (bullet.friendly) registerHit(run, bullet)
      const material=barrier.material==='crate'?'wood':level.id===3||level.id===4||run.biome==='desert'?'concrete':'metal'
      emitSound(run,barrier.hp?(barrier.requiredWeapon||material==='metal'?'metalHit':material==='wood'?'woodHit':'stoneHit'):'explosion',bullet.x);effect(run,bullet.x,bullet.y,'hit',{impact:barrier.requiredWeapon?'pierce':'terrain',material,weapon:bullet.kind,angle:Math.atan2(-bullet.vy,-bullet.vx)})
      if (!barrier.hp) {if(bullet.friendly)run.score+=40;effect(run,barrier.x+barrier.w/2,barrier.y+barrier.h/2,'destroy',{blastStyle:barrier.requiredWeapon==='beam'?'energy':'dust',size:Math.min(42,barrier.w*.6+15),seed:barrier.id})}
      if (bullet.kind !== 'pulse' || bullet.pierce <= 0) bullet.life = 0
    }
    if(!bullet.friendly&&bullet.life>0){const ally=run.tactics.find(p=>p.kind==='hack'&&p.state==='allied'&&overlaps(box,{x:p.loadX,y:p.loadY,w:40,h:40}));if(ally){ally.hp=Math.max(0,ally.hp-bullet.damage);bullet.life=0;effect(run,bullet.x,bullet.y,ally.hp?'hit':'destroy');emitSound(run,ally.hp?'metalHit':'explosion',ally.loadX)}}
    if (bullet.life <= 0) continue
    if (bullet.friendly) for (const e of enemies) {
      if (e.hp <= 0 || bullet.hit.includes(e.id) || bullet.life <= 0 || !overlaps(box, e)) continue
      if (bullet.kind === 'rocket' || bullet.kind === 'grenade') { registerHit(run, bullet, blast(run, bullet.x, bullet.y, bullet.kind === 'grenade' ? 175 : weaponStats(run, 'rocket').radius, bullet.damage, bullet.kind)); bullet.life = 0; break }
      registerHit(run, bullet); bullet.hit.push(e.id); damageEnemy(run, e, effectiveDamage(bullet.kind, e, bullet.damage), bullet.kind,bullet.y,bullet.x,Math.atan2(bullet.vy,bullet.vx)); bullet.pierce--; if (bullet.pierce <= 0) bullet.life = 0
    }
    else if (overlaps(box, playerBody(run))) { bullet.life = 0; if (['shell', 'missile', 'mortar'].includes(bullet.enemyShot ?? '')) hostileBlast(run, bullet.x, bullet.y, 55, bullet.damage); else hurt(run, '被敌方子弹击中', bullet.damage) }
  }
  run.bullets = run.bullets.filter(b => b.life > 0 && b.x > -50 && b.x < level.width + 50 && b.y > -80 && b.y < 510)
  if (run.status !== 'playing') return
  for (const p of run.pickups) if (!p.taken && overlaps(playerBody(run), { x: p.x - 15, y: p.y - 15, w: 30, h: 30 })) {
    p.taken = true
    if (p.type === 'med') { run.hp = Math.min(MAX_HEALTH, run.hp + 2); run.score += 50 }
    else if (p.type === 'armor') { run.armor = 3; run.score += 50 }
    else if (p.type === 'grenades') { run.grenades = Math.min(6, run.grenades + 3); run.score += 50 }
    emitSound(run, 'pickup', p.x); effect(run, p.x, p.y, 'pickup')
  }
  if (run.status !== 'playing') return
  awardMissions(run, level)
  tickArcade(level,run,dt)
  if(run.hp<=0)return
  advanceStoryObjective(run, level, dt)
  level.checkpoints.forEach((x, i) => {
    if (i > run.checkpoint && run.x >= x && run.x < x + 70 && run.grounded) {
      run.checkpoint = i; run.hp = Math.min(MAX_HEALTH,run.hp+2); run.grenades = Math.max(run.grenades, 2)
      emitSound(run, 'checkpoint', run.x)
      run.saved = { fieldSwitches:[...run.fieldSwitches],arcade:run.arcade.map(p=>({...p})), tactics:run.tactics.map(p=>({...p,crew:[...p.crew]})), interactives: run.interactives.map(p => ({ ...p })), storyCompleted: [...run.storyCompleted], x: run.x, y: run.y, barriers: run.barriers.map(b => ({ ...b })), enemies: copyEnemies(run.enemies), pickups: copyPickups(run.pickups), score: run.score, kills: run.kills, weapon: run.weapon, arsenal: [...run.arsenal], armor: run.armor, grenades: run.grenades, checkpoint: i }
    }
  })
  if (run.x >= level.width - 110 && run.grounded && exitOpen(run)) { run.status = 'won'; run.score += run.hp * 100 }
}
export function nextStoryTerminal(run: Run, level: Level) { return level.storyTerminals.find(t => !run.storyCompleted.includes(t.id)) }
export function storyTerminalReady(run: Run, level: Level, terminal: StoryTerminal) { return level.encounters[terminal.encounter]?.enemies.every(id => run.enemies.find(e => e.id === id)?.hp === 0) ?? false }
function advanceStoryObjective(run: Run, level: Level, dt: number) {
  const terminal = nextStoryTerminal(run, level)
  if (!terminal) { run.storyCharge = 0; return }
  const close = Math.abs(run.x + 13 - terminal.x - 14) < 75 && Math.abs(run.y + BODY.h - terminal.y - terminal.h) < 48
  if (!close || !storyTerminalReady(run, level, terminal)) { run.storyCharge = 0; return }
  run.storyCharge = Math.min(terminal.duration, run.storyCharge + dt)
  if (run.storyCharge >= terminal.duration) { emitSound(run, 'objective', terminal.x); run.storyCompleted.push(terminal.id); run.storyCharge = 0; run.score += 250; effect(run, terminal.x + 14, terminal.y + 12, 'pickup') }
}
export function weaponsForMissions(ids: string[]): Weapon[] {
  const rewards = FRONT_LEVELS.flatMap(l => l.missions.filter(m => ids.includes(m.id)).map(m => m.reward))
  return WEAPON_ORDER.filter(w => w === 'rifle' || rewards.includes(w))
}
export function armoryFor(progress: Progress) { return weaponsForMissions(progress.missions) }
export function recordMissions(progress: Progress, run: Run): Progress {
  const ids = new Set(FRONT_LEVELS.flatMap(l => l.missions.map(m => m.id)))
  return { ...progress, weaponXp: Math.max(cleanWeaponXp(progress.weaponXp), cleanWeaponXp(run.weaponXp)), growthVersion: 1, missions: [...new Set([...progress.missions, ...run.claimedMissions.filter(id => ids.has(id))])] }
}
function awardMissions(run: Run, level: Level) {
  for (const m of level.missions) {
    const encounter = level.encounters[m.encounter]
    if (!encounter || run.claimedMissions.includes(m.id) || run.x < encounter.x - 450 || !encounter.enemies.every(id => run.enemies.find(e => e.id === id)?.hp === 0)) continue
    emitSound(run, 'objective', run.x); run.claimedMissions.push(m.id); run.weaponXp = cleanWeaponXp(run.weaponXp + 60); run.score += 150
    if (!run.arsenal.includes(m.reward)) { run.arsenal.push(m.reward); run.missionRewards.push(m.reward); run.weapon = m.reward; run.fireDelay = 0 }
    effect(run, run.x + 13, run.y + 20, 'pickup')
  }
}
export type Record = { score: number, time: number, kills: number }
export type Progress = { weaponXp: number, growthVersion: 1, missions: string[], current: number, unlocked: number, records: (Record | null)[] }
export function readProgress(value: unknown): Progress {
  const data = value as Partial<Progress> | null
  const records = FRONT_LEVELS.map((level, i) => { const r = data?.records?.[i]; return r && Number.isSafeInteger(r.score) && r.score >= 0 && Number.isFinite(r.time) && r.time > 0 && Number.isInteger(r.kills) && r.kills >= 0 && r.kills <= 10000 ? { score: r.score, time: r.time, kills: r.kills } : null })
  let unlocked = 0; while (unlocked < records.length - 1 && records[unlocked]) unlocked++
  const validIds = new Set(FRONT_LEVELS.flatMap(l => l.missions.map(m => m.id)))
  const missions = Array.isArray(data?.missions) ? [...new Set(data.missions.filter(id => typeof id === 'string' && validIds.has(id)))] : []
  const legacy = Math.max(records.reduce((sum, r) => sum + (r ? r.kills * 8 + 120 : 0), 0), WEAPON_XP[unlocked]!) + missions.length * 60
  const weaponXp = data?.growthVersion === 1 ? cleanWeaponXp(data.weaponXp) : cleanWeaponXp(legacy)
  return { weaponXp, growthVersion: 1, records, unlocked, missions, current: Number.isInteger(data?.current) ? Math.max(0, Math.min(unlocked, data!.current!)) : unlocked }
}
export function complete(progress: Progress, run: Run): Progress {
  if (run.status !== 'won') return progress
  const records = [...progress.records], old = records[progress.current]
  if (!old || run.score > old.score || (run.score === old.score && run.time < old.time)) records[progress.current] = { score: run.score, time: run.time, kills: run.kills }
  return { ...recordMissions(progress, run), records, unlocked: Math.max(progress.unlocked, Math.min(FRONT_LEVELS.length - 1, progress.current + 1)) }
}
