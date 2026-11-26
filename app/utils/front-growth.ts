import type { Weapon } from './front'
// Shared combat research: newly seized guns inherit the campaign's training instead of starting behind.
export const WEAPON_XP = [0, 300, 1200, 3000, 6500, 11500, 18000, 27000] as const
export const MAX_WEAPON_XP = WEAPON_XP[WEAPON_XP.length - 1]!
export function cleanWeaponXp(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(MAX_WEAPON_XP, Math.floor(value))) : 0 }
export function weaponGrowth(value: number) {
  const xp = cleanWeaponXp(value), index = WEAPON_XP.reduce<number>((last, threshold, i) => xp >= threshold ? i : last, 0), floor = WEAPON_XP[index]!, next = WEAPON_XP[index + 1] ?? null
  return { xp, level: index + 1, max: next === null, earned: xp - floor, needed: next === null ? 0 : next - floor, remaining: next === null ? 0 : next - xp, ratio: next === null ? 1 : (xp - floor) / (next - floor) }
}
export const GROWTH_ROLES: Record<Weapon, { en: string, zh: string }> = {
  rifle: { en: 'Harder precision hits', zh: '强化精准单发伤害' },
  spread: { en: 'Tighter close-range spread', zh: '提升近战伤害、收紧弹群' },
  pulse: { en: 'More armor penetration', zh: '强化破甲、增加贯穿层数' },
  rapid: { en: 'Faster sustained anti-air fire', zh: '强化持续射速与防空火力' },
  rocket: { en: 'Wider blast radius', zh: '增强爆破伤害与爆炸范围' },
  beam: { en: 'Stronger anti-energy charge', zh: '大幅强化能量克制伤害' },
}
export function grownWeapon<T extends { damage: number, delay: number, range: number, pierce: number }>(kind: Weapon, base: T, xp: number) {
  const n = weaponGrowth(xp).level - 1
  const power = { rifle: .2, spread: .14, pulse: .18, rapid: .15, rocket: .18, beam: .24 }[kind]
  return { ...base, damage: base.damage * (1 + power * n), delay: base.delay / (1 + (kind === 'rapid' ? .045 : .025) * n), range: base.range * (1 + (kind === 'spread' ? .015 : .025) * n), pierce: base.pierce + (kind === 'pulse' ? Math.floor(n / 3) : 0), radius: 140 * (1 + (kind === 'rocket' ? .045 * n : 0)), spread: .3 * (1 - (kind === 'spread' ? .035 * n : 0)) }
}
export function killExperience(enemy: { type: string, boss?: boolean }) { return enemy.boss ? 120 : enemy.type === 'tank' ? 24 : ['heavy', 'mortar', 'turret'].includes(enemy.type) ? 12 : enemy.type === 'drone' ? 10 : 8 }
export type GrowthChange={key:'damage'|'rate'|'range'|'pierce'|'radius'|'spread',before:number,after:number}
export function growthChanges<T extends {damage:number,delay:number,range:number,pierce:number}>(kind:Weapon,base:T,fromXp:number,toXp:number):GrowthChange[]{
 if(weaponGrowth(toXp).level<=weaponGrowth(fromXp).level)return[]
 const before=grownWeapon(kind,base,fromXp),after=grownWeapon(kind,base,toXp),changes:GrowthChange[]=[{key:'damage',before:before.damage,after:after.damage},{key:'rate',before:1/before.delay,after:1/after.delay}]
 if(kind==='rocket')changes.push({key:'radius',before:before.radius,after:after.radius})
 else if(kind==='spread')changes.push({key:'spread',before:before.spread,after:after.spread})
 else if(kind==='pulse'&&after.pierce>before.pierce)changes.push({key:'pierce',before:before.pierce,after:after.pierce})
 else changes.push({key:'range',before:before.range,after:after.range})
 return changes.filter(c=>c.before!==c.after)
}
