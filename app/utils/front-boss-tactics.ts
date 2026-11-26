import {constrainPatrol} from './front-enemy-placement.ts'
import type {Enemy,Level,Run} from './front'
import type {EnemyShot} from './front-enemies'
import {surfaceY} from './front-route-features.ts'
export type BossHooks={shot:(x:number,y:number,angle:number,style:EnemyShot,speed:number)=>void}
const text=(en:string,zh:string)=>({en,zh})
export const ELITE_KITS={
 bulwark:{counter:text('Piercing Rifle / Rockets','穿透步枪 / 火箭'),hint:text('Brace strike · jump, then punish the reload','盾击预警 · 跳起躲避，装填时反击')},
 artillery:{counter:text('Rifle / Rockets','步枪 / 火箭'),hint:text('Mortar markers lock in place · leave the marked ground','迫击落点锁定 · 离开标记地面')},
 interceptor:{counter:text('Machine Gun / Rifle','机枪 / 步枪'),hint:text('Air volley · move between bursts','空中点射 · 利用齐射间隙移动')},
 hunter:{counter:text('Rifle / Shotgun','步枪 / 霰弹枪'),hint:text('Laser sight · crouch, then move off the grenade marker','激光瞄准 · 蹲下，再离开榴弹落点')},
 conductor:{counter:text('EM Cannon / Piercing Rifle','电磁重炮 / 穿透步枪'),hint:text('Ground discharge · jump, then attack the vent','地面放电 · 跳跃躲避，泄压时反击')},
} as const
export type EliteKind=keyof typeof ELITE_KITS
const ROSTER:{name:{en:string,zh:string},kind:EliteKind}[][]=[
 [{name:text('Dockmaster · Cargo enforcer','码头长 · 货运执法者'),kind:'bulwark'},{name:text('Breakwater · Quay bombardier','防波堤 · 岸防炮长'),kind:'artillery'}],
 [{name:text('Rivet · Assembly captain','铆钉 · 装配队长'),kind:'bulwark'},{name:text('Kiln · Furnace bombardier','窑火 · 熔炉炮长'),kind:'artillery'}],
 [{name:text('Gale · Bridge interceptor','疾风 · 桥区拦截机'),kind:'interceptor'},{name:text('Needle · Cable hunter','长针 · 索桥猎手'),kind:'hunter'}],
 [{name:text('Gatekeeper · Shield captain','门卫 · 盾阵队长'),kind:'bulwark'},{name:text('Watchman · Radar hunter','守望 · 雷达猎手'),kind:'hunter'}],
 [{name:text('Silhouette · Rooftop hunter','剪影 · 天台猎手'),kind:'hunter'},{name:text('Owl · Patrol interceptor','夜枭 · 巡逻拦截机'),kind:'interceptor'}],
 [{name:text('Coil · Circuit guardian','线圈 · 回路守卫'),kind:'conductor'},{name:text('Fuse · Core bombardier','熔断 · 核心炮长'),kind:'artillery'}],
 [{name:text('Dust Viper · Depot bombardier','尘蛇 · 油站炮长'),kind:'artillery'},{name:text('Rockjaw · Convoy captain','岩颚 · 车队卫长'),kind:'bulwark'}],
]
// Promote two existing patrols near section boundaries: no new walls, geometry or arena locks.
export function installLieutenants(l:Level){
 const roster=ROSTER[l.biome==='desert'?6:l.id]!
 for(const i of[0,1]){
  const kit=roster[i]!,target=l.width*(i===0?.34:.67)
  const types=kit.kind==='interceptor'?['drone']:kit.kind==='hunter'?['sniper','soldier','heavy','turret']:kit.kind==='artillery'?['mortar','turret','heavy']:['heavy','turret','soldier']
  const candidates=l.enemies.filter(e=>types.includes(e.type)&&!e.boss&&!e.elite&&!e.dormant&&Math.abs(e.x-target)<l.width*.15&&!l.checkpoints.some(x=>Math.abs(x-e.x)<90)&&!l.setPieces?.some(p=>e.x>p.x-100&&e.x<p.end+100)).filter(e=>{
   const floor=[...l.ground,...l.platforms].find(g=>!g.rise&&e.x>=g.x+8&&e.x+e.w<=g.x+g.w-8)
   return floor&&(e.type==='drone'||Math.abs(e.y+e.h-floor.y)<2)&&!l.barriers.some(b=>e.x+e.w>b.x&&e.x<b.x+b.w&&e.y+e.h>b.y&&e.y<b.y+b.h)
  }).sort((a,b)=>Math.abs(a.x-target)-Math.abs(b.x-target)||types.indexOf(a.type)-types.indexOf(b.type))
  const e=candidates[0];if(!e)continue
  e.elite=kit.kind;e.eliteName=kit.name;e.role=undefined;e.crossfire=undefined
  e.hp=e.maxHp=Math.max(e.maxHp, l.biome==='desert'?62:30+l.id*8+i*5);e.cooldown=1.1
 }
}
export function eliteState(e:Enemy){return {open:e.age%6>=3.5,label:ELITE_KITS[e.elite!].hint}}
function floorAt(l:Level,x:number){const g=l.ground.find(g=>x>=g.x&&x<g.x+g.w);return g?surfaceY(g,x):undefined}
export function bossMarker(r:Run,l:Level,e:Enemy,x:number,w:number,h:number,warning:number,kind:'slam'|'wave'|'bomb'|'pulse',hint?:{en:string,zh:string}){
 const center=Math.max(15,Math.min(l.width-15,x)),platform=kind==='bomb'?l.platforms.filter(p=>center>=p.x&&center<p.x+p.w&&p.y>=r.y+39).sort((a,b)=>a.y-b.y)[0]:undefined,floor=platform?.y??floorAt(l,center);if(floor===undefined)return
 r.threats.push({owner:e.id,kind,x:center-w/2,y:floor-h,w,h,warning,active:.25,hint})
}
export function stepLieutenant(r:Run,l:Level,e:Enemy,dt:number,hooks:BossHooks){
 const cycle=Math.floor(e.age/6),t=e.age%6,kit=e.elite!,early=l.biome!=='desert'&&l.id<3
 e.aim=Math.atan2(r.y+20-e.y-e.h*.45,r.x+13-e.x-e.w/2);e.cooldown-=dt;e.windup=Math.max(0,.95-t)
 if(e.bossCycle!==cycle){e.bossCycle=cycle;e.bossTarget=r.x+13
  const hint=ELITE_KITS[kit].hint
  if(kit==='artillery'){bossMarker(r,l,e,e.bossTarget,74,48,1.2,'bomb',hint);bossMarker(r,l,e,e.bossTarget+(r.x<e.x?-112:112),70,48,1.9,'bomb',hint)}
  else if(kit==='bulwark')bossMarker(r,l,e,e.bossTarget,94,32,1.25,'wave',hint)
  else if(kit==='conductor')bossMarker(r,l,e,e.bossTarget,150,22,1.2,'pulse',hint)
  else if(kit==='hunter')r.threats.push({owner:e.id,kind:'beam',x:Math.min(e.x,r.x)-65,y:r.y+13,w:Math.abs(e.x-r.x)+130,h:5,warning:1.25,active:.15,hint})
 }
 if(kit==='interceptor'){const previous={x:e.x,y:e.y};e.x=e.home+Math.sin(e.age*.8)*32;e.y=e.homeY+Math.sin(e.age*1.2)*16;constrainPatrol(e,previous,l)}
 if(kit==='hunter'&&t>=2.5&&e.bossSpecialCycle!==cycle){e.bossSpecialCycle=cycle;bossMarker(r,l,e,r.x+13,76,45,1.15,'bomb',ELITE_KITS[kit].hint)}
 if(t<1.1||t>3.4||e.cooldown>0)return
 const x=e.x+e.w/2,y=e.y+e.h*.45,n=early?1:kit==='interceptor'?3:2
 for(let i=0;i<n;i++)hooks.shot(x,y,e.aim+(i-(n-1)/2)*.16,kit==='conductor'?'orb':kit==='interceptor'?'plasma':'burst',early?180:220)
 e.cooldown=early?1.25:.95;e.lastShotAt=e.age;e.shotFlash=.12;e.volleys++
}
export function stepSandScorpion(r:Run,l:Level,e:Enemy,dt:number,hooks:BossHooks){
 const wheels=(e.parts?.tracks??0)>0,t=e.age%6,cycle=Math.floor(e.age/6),angry=e.hp<e.maxHp*.45
 e.cooldown-=dt;e.windup=Math.max(0,1.05-t)
 if(e.bossCycle!==cycle){e.bossCycle=cycle;e.bossTarget=r.x+13;e.chargeFrom=e.x
  const direction=(e.bossTarget<e.x+e.w/2?-1:1)
  e.chargeTo=Math.max(l.width-880,Math.min(l.width-e.w-35,e.x+direction*Math.min(330,Math.abs(e.bossTarget-e.x-e.w/2)+100)))
  const hint=text('Scorpion charge · jump clear, do not hug the wheels','沙蝎冲撞 · 跳跃避让，远离轮组')
  if(wheels){const x=Math.min(e.chargeFrom,e.chargeTo);r.threats.push({visualOnly:true,owner:e.id,kind:'wave',x,y:e.y+e.h-23,w:Math.abs(e.chargeTo-e.chargeFrom)+e.w,h:23,warning:1.05,active:2.15,hint})}
  bossMarker(r,l,e,e.bossTarget,90,48,1.45,'bomb',text('Mortar locked · leave the marker','迫击定位 · 离开落点'))
 }
 if(wheels){const start=e.chargeFrom??e.home,end=e.chargeTo??e.home
  if(t>=1.05&&t<2.25)e.x=start+(end-start)*Math.min(1,(t-1.05)/1.2)
  else if(t>=2.25&&t<3.2)e.x=end+(e.home-end)*((t-2.25)/.95)
  else if(t>=3.2)e.x=e.home
 }
 // The close-range blast is locked to a visible patch of ground, with a real escape window.
 if(Math.abs(r.x+13-e.x-e.w/2)<e.w/2+115&&e.closeAttackAt===undefined)e.closeAttackAt=e.age+1.1
 if(e.closeAttackAt!==undefined&&e.age>=e.closeAttackAt&&t<3.2){
  bossMarker(r,l,e,r.x+13,100,40,.95,'wave',text('Sand purge · jump or back away','排砂震荡 · 跳起或后撤'))
  e.closeAttackAt=e.age+3.4
 }
 const side=r.x+13<e.x+e.w/2?-1:1,x=side<0?e.x+8:e.x+e.w-8,y=e.y+e.h*.58
 e.aim=Math.atan2(r.y+22-y,r.x+13-x)
 if(t<.9||t>=3.2||e.cooldown>0)return
 for(const a of angry?[-.17,0,.17]:[-.1,.1])hooks.shot(x,y,e.aim+a,'shell',angry?270:235)
 e.lastShotAt=e.age;e.shotFlash=.16;e.volleys++;e.cooldown=angry?1.15:1.55
}
// Extra signatures complement each boss's existing mechanism, with fixed telegraphs and recovery.
export function stepBossSignature(r:Run,l:Level,e:Enemy,t:number,cycle:number){
 const trigger=l.id===3?3.35:l.id===4?2.6:.05
 if(t<trigger||e.bossSpecialCycle===cycle)return;e.bossSpecialCycle=cycle
 const target=r.x+13
 if(l.id===0){if(Math.abs(target-e.x-e.w/2)<260)bossMarker(r,l,e,target,100,30,1.3,'wave',text('Track breaker · jump away from the hull','履带震击 · 跳离车体'))}
 else if(l.id===1){for(const dx of[-150,150])bossMarker(r,l,e,target+dx,80,76,1.5,'slam',text('Twin presses · stay in the central gap','双侧冲压 · 留在中间空隙'))}
 else if(l.id===2)bossMarker(r,l,e,target-130,85,48,2,'bomb',text('Bombing run · leave the marked lane','投弹航线 · 离开标记区域'))
 else if(l.id===3)bossMarker(r,l,e,e.x+e.w/2,220,32,1,'wave',text('Landing shock · jump, then attack the backplate','落地震波 · 跳起，随后攻击背甲'))
 else if(l.id===4)bossMarker(r,l,e,target,86,45,1.25,'bomb',text('Hunter grenade · leave cover before detonation','猎手榴弹 · 爆炸前离开掩体'))
 else {
  const x=Math.max(l.width-1150,Math.min(l.width-210,target));
  r.threats.push({owner:e.id,kind:'beam',x:x-230,y:r.y+13,w:460,h:5,warning:1.7,active:.3,hint:text('Core sweep · crouch under the sightline','核心扫射 · 蹲下躲过瞄准线')})
  bossMarker(r,l,e,target-120,90,52,2.6,'bomb',text('Overhead strike · keep the unmarked gap','顶置炮击 · 走未标记的空隙'))
  if(e.hp<e.maxHp*.5)bossMarker(r,l,e,target+120,90,52,2.6,'bomb',text('Overhead strike · keep the unmarked gap','顶置炮击 · 走未标记的空隙'))
 }
}
