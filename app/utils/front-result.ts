import { WEAPON_ORDER, type Level, type Run, type Weapon, type Record as BestRecord } from './front'
export const VICTORY_DURATION = 3.2
export type Settlement = { score: number, time: number, kills: number, enemies: number, accuracy: number, damage: number, blocked: number, retries: number, outposts: number, totalOutposts: number, rank: 'S' | 'A' | 'B' | 'C', rating: number, newBest: boolean, destroyed: number, weapons: number, rewards: Weapon[], missions: number }
export function settleRun(level: Level, run: Run, previous?: BestRecord | null): Settlement | null {
  if (run.status !== 'won') return null
  const accuracy = run.stats.shots ? Math.min(100, Math.round(run.stats.hits / run.stats.shots * 100)) : 0
  const clearance = Math.min(1, run.kills / Math.max(1, level.enemies.length))
  const pace = Math.min(1, level.width / 225 * 1.2 / Math.max(1, run.time))
  const survival = Math.max(0, 1 - run.stats.damage / 25)
  const outposts = level.encounters.filter(a => a.enemies.every(id => run.enemies.find(e => e.id === id)?.hp === 0)).length
  const rating = Math.max(0, Math.min(100, Math.round(clearance * 35 + pace * 20 + survival * 25 + Math.min(1, accuracy / 55) * 20 - Math.min(30, run.stats.retries * 4))))
  return { score: run.score, time: run.time, kills: run.kills, enemies: level.enemies.length, accuracy, damage: run.stats.damage, blocked: run.stats.blocked, retries: run.stats.retries, outposts, totalOutposts: level.encounters.length, rank: rating >= 85 ? 'S' : rating >= 70 ? 'A' : rating >= 50 ? 'B' : 'C', rating, newBest: !previous || run.score > previous.score || run.score === previous.score && run.time < previous.time, destroyed: run.barriers.filter(b => b.hp === 0).length, weapons: run.arsenal.length, rewards: WEAPON_ORDER.filter(w => run.arsenal.includes(w) && !run.initialArsenal.includes(w)), missions: level.missions.filter(m => run.claimedMissions.includes(m.id)).length }
}
