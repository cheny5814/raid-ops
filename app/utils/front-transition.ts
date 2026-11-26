import type { OperativeId } from './front-operatives'
import { CAMPAIGN } from './front-story.ts'
import { createRun, FRONT_LEVELS, type Level, type Run, type Weapon } from './front.ts'

export const TRANSITION_DURATION = 9.2
export const TRANSITION_STORIES = [
  { title: '沿武器转运路线追查', text: CAMPAIGN[0]!.outcome.zh + CAMPAIGN[0]!.next.zh, transport: '货运闸门', vehicle: 'cargo' },
  { title: '搭乘升降台前往中继站', text: CAMPAIGN[1]!.outcome.zh + CAMPAIGN[1]!.next.zh, transport: '货运升降台', vehicle: 'lift' },
  { title: '追踪求救录音来源', text: CAMPAIGN[2]!.outcome.zh + CAMPAIGN[2]!.next.zh, transport: '高架维护桥', vehicle: 'bridge' },
  { title: '掩护城区撤离路线', text: CAMPAIGN[3]!.outcome.zh + CAMPAIGN[3]!.next.zh, transport: '内城维护闸门', vehicle: 'truck' },
  { title: '关闭铁幕协议', text: CAMPAIGN[4]!.outcome.zh + CAMPAIGN[4]!.next.zh, transport: '地下维护隧道', vehicle: 'tunnel' },
]
export const ROUTE_STOPS = [
  { x: 55, y: 105, short: '港口' }, { x: 177, y: 62, short: '工厂' },
  { x: 299, y: 105, short: '高架' }, { x: 421, y: 62, short: '哨站' },
  { x: 543, y: 105, short: '内城' }, { x: 665, y: 62, short: '核心' },
]
export type FrontTransition = { operative:OperativeId,
  weaponXp: number, claimedMissions: string[], from: number, to: number, elapsed: number, paused: boolean,
  arsenal: Weapon[], weapon: Weapon, armor: number, grenades: number,
  score: number, kills: number, time: number,
}
export function createTransition(level: Level, run: Run): FrontTransition | null {
  if (run.status !== 'won' || level.id >= FRONT_LEVELS.length - 1) return null
  return { operative:run.operative,weaponXp: run.weaponXp, claimedMissions: [...run.claimedMissions], from: level.id, to: level.id + 1, elapsed: 0, paused: false, arsenal: [...run.arsenal], weapon: run.weapon, armor: run.armor, grenades: run.grenades, score: run.score, kills: run.kills, time: run.time }
}
export function advanceTransition(state: FrontTransition, dt: number) {
  if (!state.paused && Number.isFinite(dt) && dt > 0) state.elapsed = Math.min(TRANSITION_DURATION, state.elapsed + Math.min(dt, .1))
  return state.elapsed >= TRANSITION_DURATION
}
const clamp = (n: number) => Math.max(0, Math.min(1, n))
export function transitionFrame(state: FrontTransition) {
  const stage = state.elapsed < 1.15 ? 'depart' : state.elapsed < 7.7 ? 'route' : 'arrive'
  const phase = clamp(stage === 'depart' ? state.elapsed / 1.15 : stage === 'route' ? (state.elapsed - 1.15) / 6.55 : (state.elapsed - 7.7) / 1.5)
  const travel = clamp((state.elapsed - 1.15) / 6.55), eased = travel * travel * (3 - 2 * travel)
  const a = ROUTE_STOPS[state.from]!, b = ROUTE_STOPS[state.to]!
  return { stage, phase, journey: travel, progress: clamp(state.elapsed / TRANSITION_DURATION), vehicle: { x: a.x + (b.x - a.x) * eased, y: a.y + (b.y - a.y) * eased } }
}
export function arriveRun(state: FrontTransition, level: Level): Run {
  if (level.id !== state.to) throw new Error('衔接目标与战区不一致')
  return { ...createRun(level, state.arsenal, state.claimedMissions, state.weaponXp,state.operative), arsenal: [...state.arsenal], weapon: state.weapon, armor: state.armor, grenades: Math.max(3, state.grenades), invincible: 1.8 }
}
