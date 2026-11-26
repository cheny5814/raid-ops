import type {Run} from './front.ts'
import {emitSound} from './front-sound-events.ts'
export type OperativeId='raven'|'fox'
const t=(en:string,zh:string)=>({en,zh})
export const OPERATIVES={
 raven:{id:'raven',name:t("Falcon",'猎鹰者'),tag:t("Field veteran",'战场老兵'),description:t('A seasoned assault operative. Break firing lines with a controlled burst of speed.','经验丰富的突击老兵，利用短距离冲刺突破敌方火线。'),skill:t("Tactical dash",'战术冲刺'),skillDescription:t('Press U to dash in your facing direction with brief damage protection. Walls and locked gates still stop you.','按 U 向面朝方向冲刺，期间短暂免伤；墙体和封锁闸仍会阻挡。'),cooldown:8,color:'#9ac9b9',outfit:t("Grayhaven field kit",'灰港战术装备')},
 fox:{id:'fox',name:t("Silver Fox",'银狐者'),tag:t("Mobile scout",'机动侦察'),description:t('A quick-footed scout in lightweight field gear. Reach higher platforms and recover a mistimed jump.','身穿轻装的敏捷侦察员，利用空中翻跃抵达高台、修正跳跃落点。'),skill:t("Aerial flip",'空中翻跃'),skillDescription:t('While airborne, press U or jump again for one extra leap. Once per airtime, with a 5-second cooldown.','空中按 U 或再次按跳跃键，获得一次额外翻跃；每次腾空限用一次，冷却 5 秒。'),cooldown:5,color:'#dbb087',outfit:t("Grayhaven scout kit",'灰港轻装侦察服')},
} as const
export const OPERATIVE_ORDER:OperativeId[]=['raven','fox']
export const readOperative=(value:unknown):OperativeId=>value==='fox'?'fox':'raven'
export function canUseOperativeSkill(r:Run){return r.status==='playing'&&!r.zipline&&r.skillCooldown<=0&&r.rope===null&&r.ladder===null&&r.mountedGun===null&&r.tacticalControl===null&&!r.arcade.some(s=>s.phase==='return')&&(r.operative==='raven'||!r.grounded&&!r.airSkillUsed)}
export function useOperativeSkill(r:Run){
 if(!canUseOperativeSkill(r))return false
 r.skillCooldown=OPERATIVES[r.operative].cooldown
 if(r.operative==='raven'){r.dashTime=.2;r.dashFacing=r.facing;r.invincible=Math.max(r.invincible,.23);emitSound(r,'ropeRelease',r.x)}
 else{r.airSkillUsed=true;r.vy=-505;r.grace=0;r.jumpBuffer=0;r.flipAge=0;r.flipFacing=r.facing;emitSound(r,'jump',r.x)}
 return true
}
