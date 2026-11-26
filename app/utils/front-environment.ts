import type {Level,Run,Rect,Enemy,Hazard} from './front.ts'
import type {Interactive} from './front-interactions.ts'
import {emitSound} from './front-sound-events.ts'
export type EnvironmentalKind='steam'|'radar'|'cooling'|'fuel'
export const environmentalKind=(kind:string):kind is EnvironmentalKind=>['steam','radar','cooling','fuel'].includes(kind)
const overlap=(a:Rect,b:Rect)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
/** Controls sit on flat, walkable ground, outside spikes, doors, ladders and existing controls. */
export function installEnvironment(l:Level,out:Interactive[]){
 const add=(kind:EnvironmentalKind,desired:number)=>{
  for(const dx of[0,-20,20,-40,40,-80,80,-120,120]){const x=desired+dx,w=28,h=kind==='radar'?60:34,g=l.ground.find(g=>!g.rise&&x>=g.x+18&&x+w<=g.x+g.w-18);if(!g)continue
   if(l.biome!=='desert'&&l.id===1&&[1800,8000,15500].some(v=>x+w>v-30&&x<v+135))continue
   const box={x:x-18,y:g.y-h-8,w:w+36,h:h+16}
   if(out.some(p=>overlap(box,p))||l.barriers.some(p=>p.hp>0&&overlap(box,p))||l.spikes.some(p=>overlap(box,p))||l.hazards.some(p=>overlap(box,p))||l.ladders.some(p=>overlap(box,p))||l.storyTerminals.some(p=>overlap(box,p))||l.field?.switches.some(p=>Math.abs(p.x-x)<80||(p.doors??[]).some(d=>overlap(box,d))))continue
   const scope=l.districts?.find(d=>desired>=d.x&&desired<d.end)
   out.push({areaStart:scope?.x,areaEnd:scope?.end,id:50000+out.length,kind,x,y:g.y-h,w,h,hp:kind==='radar'?6:kind==='fuel'?4:3,timer:-1,triggered:false,heat:0,overheated:false,pulse:0,reach:Math.min(170,g.x+g.w-x-4),left:Math.max(g.x+4,x-65)})
   return
  }
 }
 if(l.biome==='desert'){for(const desired of[10580,21980,31480,43880,58480]){const p=out.filter(p=>p.kind==='barrel'&&Math.abs(p.x-desired)<220&&l.ground.some(g=>!g.rise&&p.x>=g.x+18&&p.x+28<g.x+g.w-18)).sort((a,b)=>Math.abs(a.x-desired)-Math.abs(b.x-desired))[0];if(!p)continue;const g=l.ground.find(g=>!g.rise&&p.x>=g.x&&p.x+28<=g.x+g.w)!;Object.assign(p,{kind:'fuel',w:28,h:34,y:g.y-34,hp:4,pulse:0,reach:Math.min(170,g.x+g.w-p.x-4),left:Math.max(g.x+4,p.x-65)})}return}
 for(const d of l.districts??[]){if(l.id===1)add('steam',d.x+60);if(l.id===3)add('radar',d.x+70);if(l.id===5)add('cooling',d.x+280)}
}
export function environmentArea(p:Interactive):Rect{return{x:p.kind==='fuel'?(p.left??p.x-50):p.x+15,y:p.y+p.h-(p.kind==='fuel'?24:95),w:p.kind==='fuel'?p.x+(p.reach??130)-(p.left??p.x-50):Math.max(30,p.reach??140),h:p.kind==='fuel'?24:95}}
export function environmentControl(r:Run){return r.interactives.find(p=>(p.kind==='steam'||p.kind==='cooling')&&Math.abs(p.x+14-r.x-13)<46&&Math.abs(p.y+p.h-r.y-40)<18&&(p.kind==='cooling'||p.hp<=0&&p.timer>0&&!p.triggered))}
export function operateEnvironment(r:Run){
 if(!r.grounded||r.rope!==null||r.ladder!==null||r.zipline||r.tacticalControl!==null||r.mountedGun!==null)return false
 const p=environmentControl(r);if(!p)return false
 if(p.kind==='steam'){p.timer=0;p.triggered=true}else if(p.hp>0){p.triggered=!p.triggered;p.timer=1.1}else return false
 emitSound(r,'equip',p.x);return true
}
export function coolingOff(r:Run,h:Hazard){
 if(h.type!=='surge')return false
 const p=r.interactives.find(p=>p.kind==='cooling'&&h.x>=p.x&&h.x<p.x+650&&Math.abs(h.y+h.h-p.y-p.h)<40)
 return !!p&&(p.hp<=0||p.timer>0||((h.x-p.x<300?0:1)===(p.triggered?1:0)))
}
const inRadar=(p:Interactive,x:number)=>p.areaStart!==undefined&&p.areaEnd!==undefined?x>=p.areaStart&&x<p.areaEnd:Math.abs(x-p.x)<700
export function radarOff(r:Run,e:{x:number,type?:string,boss?:boolean,elite?:unknown}){return e.type==='drone'&&!e.boss&&!e.elite&&r.interactives.some(p=>p.kind==='radar'&&p.hp<=0&&inRadar(p,e.x))}
export function radarAlarmOff(r:Run,x:number){return r.interactives.some(p=>p.kind==='radar'&&p.hp<=0&&inRadar(p,x))}
function rayThrough(area:Rect,r:Run,e:Enemy){
 const from={x:e.x+e.w/2,y:e.y+e.h*.4},to={x:r.x+13,y:r.y+20},dx=to.x-from.x,dy=to.y-from.y;let near=0,far=1
 for(const[o,d,min,max]of[[from.x,dx,area.x,area.x+area.w],[from.y,dy,area.y,area.y+area.h]]){if(Math.abs(d!)<1e-8){if(o!<min!||o!>max!)return false}else{const a=(min!-o!)/d!,b=(max!-o!)/d!;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b))}}return near<=far
}
export function steamObscures(r:Run,e:Enemy){
 if(e.boss||e.elite)return false
 return r.interactives.some(p=>p.kind==='steam'&&p.hp<=0&&!p.triggered&&p.timer>0&&rayThrough(environmentArea(p),r,e))
}
export function stormObscures(r:Run,l:Level,e:Enemy,active:(h:Hazard)=>boolean){return l.biome==='desert'&&!e.boss&&!e.elite&&l.hazards.some(h=>h.type==='gust'&&active(h)&&rayThrough(h,r,e))}
export function triggerEnvironment(p:Interactive){if(p.kind==='steam'){p.timer=6;p.triggered=false}if(p.kind==='fuel'){p.timer=6;p.pulse=0}}
export function tickEnvironment(r:Run,l:Level,dt:number,api:{damage:(e:Enemy,n:number)=>void,hurt:(reason:string)=>void}){
 for(const p of r.interactives){if(!environmentalKind(p.kind))continue
  p.timer=Math.max(-1,p.timer-dt)
  if(p.kind==='fuel'&&p.hp<=0&&p.timer>0&&p.timer<5.2){p.pulse=Math.max(0,(p.pulse??0)-dt);if(p.pulse>0)continue;p.pulse=.45;const area=environmentArea(p)
   for(const e of r.enemies)if(e.hp>0&&!e.dormant&&overlap(area,e))api.damage(e,e.boss?1:2)
   if(overlap(area,{x:r.x,y:r.y,w:26,h:40}))api.hurt('进入了油罐燃烧带')
  }
 }
 for(const b of r.barriers){if(!b.billboard||b.hp>0||b.collapseTriggered)continue;b.collapseTriggered=true
  const bridge=l.field?.bridges.find(p=>p.target===b.id);if(!bridge)continue
  const area={x:bridge.deck.x,y:b.y,w:bridge.deck.w,h:Math.max(1,bridge.deck.y+bridge.deck.h-b.y)}
  for(const e of r.enemies)if(e.hp>0&&!e.dormant&&overlap(area,e))api.damage(e,e.boss?12:25)
  if(r.effects.length<150)r.effects.push({x:bridge.deck.x+bridge.deck.w/2,y:bridge.deck.y-24,floor:bridge.deck.y,kind:'scrap',material:'metal',time:.9,duration:.9,seed:b.id})
  emitSound(r,'metalHit',b.x)
 }
}
export const ENVIRONMENT_TEXT={
 steam:{zh:['压力蒸汽阀','射击管道释放蒸汽，遮挡敌人视线；靠近按 E 关闭'],en:['Pressure valve','Shoot pipe to obscure enemy sight; E closes the valve']},
 radar:{zh:['区域雷达','击毁可停用附近无人机火力，并阻止区域警报增援'],en:['Sector radar','Destroy to disable nearby drone fire and alarm reinforcements']},
 cooling:{zh:['冷却支路','E 切换 A/B 安全支路；切换后有 1.1 秒泄压保护'],en:['Cooling branches','E swaps safe branch A/B; 1.1s pressure-release grace']},
 fuel:{zh:['储油罐','击破后引燃地面；预警后燃烧，敌我均需避开'],en:['Fuel reservoir','Shoot to ignite ground after warning; fire affects both sides']}
}as const
