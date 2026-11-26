import {vehicleGun} from './front-vehicle-gun.ts'
import {vehicleMotion,type VehicleMotion} from './front-vehicle-motion.ts'
import type { Level, Run, Input, Rect, Enemy } from './front.ts'
import { emitSound } from './front-sound-events.ts'
export type Tactical = Rect & { landY?:number, cannonAim?:number, vehicleMotion?:VehicleMotion, id:number,kind:'crane'|'vehicle'|'hack',state:'ready'|'operating'|'falling'|'settled'|'locked'|'allied'|'spent'|'wreck',hp:number,maxHp:number,progress:number,cooldown:number,target:number,loadX:number,loadY:number,minX:number,maxX:number,crew:number[],life:number }
export type TacticalApi={damage:(e:Enemy,n:number)=>void,shot:(x:number,y:number,angle:number,kind:'rocket'|'rapid',damage:number,pivot?:{x:number,y:number})=>void,aim?:(x:number,y:number)=>{angle:number,target:number|null},blast:(x:number,y:number)=>void,hurt:()=>void}
const overlap=(a:Rect,b:Rect)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
export function createTactics(l:Level):Tactical[]{
 const out:Tactical[]=[]
 if(l.biome==='desert')return out
 const add=(kind:Tactical['kind'],x:number,y:number,w:number,h:number,extra:Partial<Tactical>={})=>out.push({id:10000+out.length,kind,x,y,w,h,state:'ready',hp:20,maxHp:20,progress:0,cooldown:0,target:-1,loadX:x,loadY:y-160,minX:x-80,maxX:x+360,crew:[],life:0,...extra})
 if(l.id===0){
  const gaps=l.ground.slice(1).flatMap((g,i)=>{const p=l.ground[i]!,gap=g.x-p.x-p.w;return gap>=75&&gap<=160&&g.y===p.y&&!l.setPieces?.some(s=>s.x<=p.x+p.w&&s.end>=g.x)?[{left:p.x+p.w,right:g.x,y:g.y}]:[]}).slice(0,3)
  for(const g of gaps){const consoleX=[g.left-85,g.left-220,g.left-45].find(x=>l.ground.some(p=>x>=p.x+5&&x+25<=p.x+p.w-5&&p.y===g.y)&&!l.ladders.some(p=>Math.abs(p.x-x)<95)&&!l.barriers.some(p=>overlap({x,y:g.y-32,w:25,h:32},p)));if(consoleX===undefined)continue;add('crane',consoleX,g.y-32,g.right-g.left+48,32,{loadX:(g.left+g.right)/2-(g.right-g.left+48)/2,loadY:g.y-190,minX:g.left-155,maxX:g.right+90})}
 }
 if(l.id===2)for(const d of l.districts??[]){const x=d.x+220,floor=l.ground.find(g=>!g.rise&&x>=g.x+10&&x+26<=g.x+g.w-10);if(floor&&!l.barriers.some(b=>overlap({x,y:floor.y-32,w:26,h:32},b)))add('crane',x,floor.y-32,130,32,{loadX:d.x+380,loadY:floor.y-200,minX:d.x+310,maxX:d.x+430})}
 if(l.id===1)for(const desired of [1800,8000,15500]){
  const floor=l.ground.find(g=>desired>=g.x+20&&desired+110<=g.x+g.w-20);if(!floor||l.barriers.some(b=>overlap({x:desired,y:floor.y-60,w:110,h:60},b)))continue
  const crew=l.enemies.filter(e=>!e.boss&&!e.dormant&&e.type!=='drone'&&Math.abs(e.x-desired)<450).slice(0,2).map(e=>e.id)
  add('vehicle',desired,floor.y-58,104,58,{state:crew.length?'locked':'ready',crew,minX:floor.x,maxX:desired+2200})
 }
 if(l.id===3)for(const e of l.enemies.filter(e=>e.type==='turret'&&!e.boss).filter((_,i)=>i%4===0).slice(0,4)){
  const x=e.x-80,floor=l.ground.find(g=>x>=g.x+5&&x+25<g.x+g.w-5);if(floor&&!l.barriers.some(b=>overlap({x,y:floor.y-32,w:25,h:32},b)))add('hack',x,floor.y-32,25,32,{target:e.id,loadX:e.x,loadY:e.y,maxHp:e.maxHp,hp:e.maxHp})
 }
 for(const bridge of l.field?.bridges??[]){if(bridge.kind!=='sentry'||out.some(p=>p.target===bridge.target))continue;const e=l.enemies.find(e=>e.id===bridge.target);if(!e)continue;const x=e.x-105,floor=l.ground.find(g=>x>=g.x&&x+25<g.x+g.w);if(floor)add('hack',x,floor.y-32,25,32,{target:e.id,loadX:e.x,loadY:e.y,maxHp:e.maxHp,hp:e.maxHp})}
 return out
}
export function controlled(run:Run){return run.tactics.find(p=>p.id===run.tacticalControl)}
export function tacticalNearby(run:Run){return run.tactics.filter(p=>!['settled','falling','wreck','spent','allied'].includes(p.state)&&Math.abs(run.x+13-p.x-(p.kind==='vehicle'?p.w/2:12))<(p.kind==='vehicle'?75:42)&&Math.abs(run.y+40-p.y-(p.kind==='vehicle'?p.h:32))<28).sort((a,b)=>Math.abs(a.x-run.x)-Math.abs(b.x-run.x))[0]}
export function tacticalDecks(run:Run):Rect[]{return run.tactics.filter(p=>p.kind==='crane'&&p.state==='settled').map(p=>({x:p.loadX,y:p.loadY,w:p.w,h:32}))}
export function leaveTactical(run:Run){const p=controlled(run);if(!p)return;if(p.state==='operating')p.state='ready';if(p.kind==='vehicle'){const exit=p.x-30;run.x=exit>=p.minX&&!run.barriers.some(b=>b.hp>0&&overlap({x:exit,y:run.y,w:26,h:40},b))?exit:p.x+8}p.progress=0;run.tacticalControl=null;run.interactDelay=.5;run.vy=0;run.rope=null;run.ladder=null;run.invincible=Math.max(run.invincible,.5);emitSound(run,'equip',run.x)}
export function craneLanding(l:Level,p:Tactical){
 const surfaces=[...l.ground,...l.platforms].filter(g=>!g.rise&&g.y>=p.loadY+32-.1),levels=[...new Set(surfaces.map(g=>g.y))].sort((a,b)=>a-b)
 for(const y of levels){const same=surfaces.filter(g=>Math.abs(g.y-y)<.1),left=same.some(g=>p.loadX+12>=g.x&&p.loadX+12<=g.x+g.w),right=same.some(g=>p.loadX+p.w-12>=g.x&&p.loadX+p.w-12<=g.x+g.w)
  if(left&&right)return y-32
  if(same.some(g=>p.loadX+p.w>g.x&&p.loadX<g.x+g.w))return null
 }
 return null
}
export function tacticalInteract(run:Run,l:Level){
 const active=controlled(run)
 if(active){if(active.kind==='crane'&&active.state==='operating'){const landing=craneLanding(l,active);if(landing===null){emitSound(run,'shield',active.loadX);return true}active.landY=landing;active.state='falling';active.progress=0;run.tacticalControl=null;emitSound(run,'ropeRelease',active.loadX);run.interactDelay=.5}else leaveTactical(run);return true}
 if(run.rope!==null||run.ladder!==null||l.ladders.some(p=>Math.abs(p.x+p.w/2-run.x-13)<=38&&run.y+40>=p.y&&run.y<=p.y+p.h)||l.ropes.some(p=>{const a=run.ropeMotion[p.id]?.angle??-.85;return Math.hypot(p.x+Math.sin(a)*p.length-run.x-13,p.y+Math.cos(a)*p.length-run.y-12)<=64}))return false
 const p=tacticalNearby(run);if(!p||!run.grounded)return false
 if(p.state==='locked'){emitSound(run,'shield',p.x);return true}
 p.state='operating';p.progress=0;run.tacticalControl=p.id;run.mountedGun=null;run.rope=null;run.ladder=null;run.glideVx=0;run.flipAge=-1;emitSound(run,p.kind==='hack'?'ui':p.kind==='crane'?'ropeGrab':'equip',p.x);return true
}
export function tickTactics(run:Run,l:Level,input:Input,dt:number,api:TacticalApi):Input{
 for(const p of run.tactics){
  if(p.kind==='vehicle')p.vehicleMotion=vehicleMotion(p.vehicleMotion,p.x,dt,p.state!=='wreck')
  p.cooldown=Math.max(0,p.cooldown-dt)
  if(p.state==='locked'&&p.crew.every(id=>(run.enemies.find(e=>e.id===id)?.hp??0)<=0)){p.state='ready';emitSound(run,'objective',p.x)}
  if(p.kind==='crane'&&p.state==='falling'){
   p.progress+=dt;const old=p.loadY;p.loadY=Math.min(p.landY??p.y,p.loadY+(100+p.progress*1100)*dt)
   for(const e of run.enemies)if(e.hp>0&&!e.dormant&&!p.crew.includes(e.id)&&overlap({x:p.loadX,y:old,w:p.w,h:p.loadY-old+32},e)){api.damage(e,e.boss?25:80);p.crew.push(e.id)}
   if(overlap({x:p.loadX,y:old,w:p.w,h:p.loadY-old+32},{x:run.x,y:run.y,w:26,h:40})){api.hurt();run.y=p.loadY-40;run.vy=0}
   if(p.loadY===(p.landY??p.y)){p.state='settled';if(run.effects.length<150)run.effects.push({x:p.loadX+p.w/2,y:p.loadY+28,kind:'destroy',blastStyle:'dust',size:24,time:.65,duration:.65,floor:p.loadY+32});emitSound(run,'land',p.loadX)}
  }
  if(p.kind==='hack'&&p.state==='allied'){
   p.life=Math.max(0,p.life-dt);if(p.life===0||p.hp<=0){p.state='spent';continue}
   const e=run.enemies.filter(e=>e.hp>0&&!e.dormant&&Math.hypot(e.x-p.loadX,e.y-p.loadY)<650).sort((a,b)=>Math.abs(a.x-p.loadX)-Math.abs(b.x-p.loadX))[0]
   if(e&&p.cooldown===0){const x=p.loadX+19,y=p.loadY+13,angle=Math.atan2(e.y+e.h/2-y,e.x+e.w/2-x);p.progress=angle;api.shot(x+Math.cos(angle)*36,y+Math.sin(angle)*36,angle,'rapid',3);p.cooldown=.18;emitSound(run,'supportFire',p.loadX)}
  }
 }
 const p=controlled(run);if(!p)return input
 if(input.jump||p.hp<=0||run.status!=='playing'){leaveTactical(run);return input}
 const d=Number(input.right)-Number(input.left)
 if(p.kind==='crane')p.loadX=Math.max(p.minX,Math.min(p.maxX,p.loadX+d*115*dt))
 if(p.kind==='hack'){
  const target=run.enemies.find(e=>e.id===p.target)
  if(!target||target.hp<=0){p.state='spent';leaveTactical(run);return input}
  if(run.damageCue>.5){leaveTactical(run);return input}
  p.progress+=dt
  if(p.progress>=2.5){p.hp=target.hp;target.hp=0;p.state='allied';p.life=25;p.progress=target.aim;run.tacticalControl=null;run.score+=180;emitSound(run,'objective',p.x)}
 }
 if(p.kind==='vehicle'){
  const next=p.x+d*155*dt,body={x:next,y:p.y,w:p.w,h:p.h},limit=l.encounters.find(a=>a.end>p.x&&a.enemies.some(id=>(run.enemies.find(e=>e.id===id)?.hp??0)>0))?.end??l.width
  const terminal=l.storyTerminals.find(t=>!run.storyCompleted.includes(t.id)),storyLimit=terminal?l.encounters[terminal.encounter]!.end:l.width
  const supported=Array.from({length:7},(_,i)=>next+i*p.w/6).every(x=>l.ground.some(g=>x>=g.x&&x<=g.x+g.w&&Math.abs(g.y-p.y-p.h)<2))
  if(supported&&next>=p.minX&&next+p.w<=Math.min(p.maxX,limit,storyLimit)&&!run.barriers.some(b=>b.hp>0&&overlap(body,b)))p.x=next
  p.vehicleMotion=vehicleMotion(p.vehicleMotion,p.x,dt,p.state!=='wreck')
  if(d)run.facing=d;run.x=p.x+p.w/2-13;run.y=p.y+p.h-40;run.vy=0;run.grounded=true
  const pivot=vehicleGun(p,0).pivot,aim=api.aim?.(pivot.x,pivot.y)
  p.cannonAim=aim?.angle??(run.facing>0?0:Math.PI);p.target=aim?.target??-1
  if(input.shoot&&p.cooldown===0){const gun=vehicleGun(p,p.cannonAim);api.shot(gun.muzzle.x,gun.muzzle.y,p.cannonAim,'rocket',14,gun.pivot);p.cooldown=.85;run.gunfire={serial:(run.gunfire?.serial??0)+1,weapon:'rocket',at:run.time}}
 }
 return {...input,left:false,right:false,jump:false,up:false,duck:false,shoot:false,grenade:false}
}
