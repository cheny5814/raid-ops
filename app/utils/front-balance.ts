import type {Enemy,Level} from './front.ts'
// Early missions are tuned for the starting rifle; later patrols retain their reinforced health.
export const PATROL_HEALTH:Partial<Record<Enemy['type'],number>>={soldier:12,runner:10,sniper:12,drone:16,heavy:32,turret:20,mortar:26,tank:50}
const BOSS_HEALTH=[220,168,228,324,360,456]
const EARLY_HEALTH:Partial<Record<Enemy['type'],number>>[]=[
 {soldier:6,runner:4,sniper:6,drone:10,heavy:20,turret:12,mortar:18,tank:34},
 {soldier:8,runner:6,sniper:8,drone:12,heavy:24,turret:15,mortar:21,tank:40},
 {soldier:10,runner:8,sniper:10,drone:14,heavy:28,turret:18,mortar:24,tank:46},
]
export function fortifyPatrols(l:Level){for(const e of l.enemies){
 if(e.elite)continue
 const early=l.biome!=='desert'&&l.id<3
 const hp=e.boss?(e.desertBoss?Math.max(e.maxHp,180):early?BOSS_HEALTH[l.id]!:Math.max(e.maxHp,BOSS_HEALTH[l.id]??e.maxHp)):early?(EARLY_HEALTH[l.id]?.[e.type]??e.maxHp):Math.max(e.maxHp,PATROL_HEALTH[e.type]??e.maxHp)
 if(e.parts&&hp!==e.maxHp){const scale=hp/e.maxHp;e.parts={tracks:e.parts.tracks*scale,gun:e.parts.gun*scale,engine:e.parts.engine*scale}}
 e.hp=e.maxHp=hp
}}
export function addRoutePatrols(l:Level){
 const original=[...l.enemies],wanted=Math.ceil(original.filter(e=>!e.boss).length*.2),candidates:{x:number,y:number,space:number}[]=[]
 for(let x=560;x<l.width-1100;x+=80){
  const g=l.ground.find(g=>!g.rise&&x>=g.x+50&&x+44<=g.x+g.w-50);if(!g)continue
  if(l.encounters.some(a=>x>a.x-100&&x<a.end+100)||l.setPieces?.some(s=>x>s.x-120&&x<s.end+120)||l.districts?.some(d=>x>d.x-60&&x<d.end+60))continue
  if(l.checkpoints.some(at=>Math.abs(at-x)<70)||[...l.barriers,...l.spikes,...l.hazards,...l.storyTerminals,...l.ladders].some(p=>x+100>p.x&&x-60<p.x+p.w))continue
  const space=Math.min(...original.filter(e=>!e.boss&&!e.dormant).map(e=>Math.abs(e.x-x)));if(space<65)continue
  candidates.push({x,y:g.y,space})
 }
 const placed:number[]=[]
 for(let i=0;i<wanted;i++){
  candidates.sort((a,b)=>b.space-a.space||a.x-b.x);const spot=candidates.shift();if(!spot||spot.space<65)break
  const type=(['soldier','soldier','drone','runner','heavy','sniper']as const)[i%6]!,template=original.find(e=>e.type===type&&!e.boss);if(!template)continue
  const y=spot.y-template.h-(type==='drone'?115:0)
  l.enemies.push({...template,id:500000+(l.biome==='desert'?100000:l.id*10000)+i,x:spot.x,home:spot.x,y,homeY:y,hp:template.maxHp,maxHp:template.maxHp,boss:false,guard:false,dormant:false,wakeAfter:undefined,wakeTimer:undefined,parts:undefined,role:undefined,tower:undefined,crossfire:undefined,age:0,volleys:0,windup:0,cooldown:.8+(i%4)*.16})
  placed.push(spot.x);for(const p of candidates)p.space=Math.min(p.space,Math.abs(p.x-spot.x))
 }
 return placed.length
}
