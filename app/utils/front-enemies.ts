import type { Enemy, Run } from './front'
export type EnemyShot = 'round' | 'burst' | 'plasma' | 'flak' | 'needle' | 'shell' | 'missile' | 'orb' | 'mortar'
export const ENEMY_SHOTS: Record<Enemy['type'], EnemyShot> = { soldier: 'round', runner: 'round', heavy: 'burst', drone: 'plasma', turret: 'flak', sniper: 'needle', tank: 'shell', mech: 'missile', core: 'orb', mortar: 'mortar' }
export const SHOT_COLORS: Record<EnemyShot, string> = { round: '#f4b27e', burst: '#ed876d', plasma: '#73ddd0', flak: '#f1c67e', needle: '#f19cce', shell: '#e29b67', missile: '#f3ac70', orb: '#b9a0f3', mortar: '#d5cf89' }
export const BOSS_NAMES = [
  { zh: '铁锚 · 港口重型战车', en: "Iron Anchor · siege tank" },
  { zh: '熔炉 · 铸造执行者', en: "Foundry · Forge Executor" },
  { zh: '猎隼 · 空中运输舰', en: "Kestrel · Gunship Carrier" },
  { zh: '壁垒 · 堡垒重装机甲', en: "Bastion · Assault Mech" },
  { zh: '夜幕 · 屋顶猎手', en: "Nightfall · Rooftop Hunter" },
  { zh: '铁幕 · 主武器控制核心', en: "Iron Veil · Weapons Core" },
]
export function bossApproach(run: Run) {
  const e = run.enemies.find(e => e.boss === true && e.hp > 0)
  if (!e) return null
  const distance = e.x - run.x
  return e.hp === e.maxHp && distance > 650 && distance < 1600 ? e : null
}
