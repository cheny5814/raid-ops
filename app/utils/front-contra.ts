import type { Level, Run, Rect, Enemy, Input } from './front.ts'
import { emitSound } from './front-sound-events.ts'
export type SetPiece={id:number,kind:'climb'|'escape'|'chase',x:number,end:number,floor:number,roof:number}
export type ArcadeState={id:number,phase:'waiting'|'active'|'return'|'done',elapsed:number,cameraY:number,fromX:number,fromY:number,dangerY:number}
export type TankParts={tracks:number,gun:number,engine:number}
export type CrossfireRole='high'|'rush'|'air'|'cover'
const intersects=(a:Rect,x:number,end:number)=>a.x+a.w>x&&a.x<end
function clearRoom(l:Level,x:number,end:number){
 for(const key of ['platforms','barriers','spikes','hazards','ropes','ladders','pickups'] as const){const arr=l[key] as unknown as Rect[];for(let i=arr.length-1;i>=0;i--)if(arr[i]!.x>=x&&arr[i]!.x<end)arr.splice(i,1)}
 l.enemies=l.enemies.filter(e=>e.guard||e.boss||e.x<x||e.x>=end)
 const ground:Rect[]=[];for(const g of l.ground){if(!intersects(g,x,end)){ground.push(g);continue}if(g.x<x)ground.push({...g,w:x-g.x});if(g.x+g.w>end)ground.push({...g,x:end,w:g.x+g.w-end})}l.ground=ground
}
export function installContra(l:Level){
 l.setPieces=[]
 let serial=95000
 const spawn=(type:Enemy['type'],x:number,floor:number,hp:number,extra:Partial<Enemy>={})=>{const template=l.enemies.find(e=>e.type===type&&!e.boss)??l.enemies.find(e=>!e.boss)!;const h=type==='drone'?25:type==='turret'?40:38,w=type==='drone'?28:type==='turret'?40:26;const e={...template,...extra,id:serial++,type,x,home:x,y:floor-h,homeY:floor-h,w,h,hp:type==='drone'?Math.max(8,hp):hp,maxHp:type==='drone'?Math.max(8,hp):hp,age:0,cooldown:1.2,windup:0,volleys:0,guard:false,boss:false,dormant:false,wakeAfter:undefined,wakeTimer:undefined,drawScale:1,role:undefined,zone:l.id};l.enemies.push(e);return e}
 if(l.id===2){
  const x=480+7*620,end=x+620,floor=400;clearRoom(l,x,end);l.ground.push({x,y:floor,w:620,h:180});l.checkpoints.push(x-90)
  const piece:SetPiece={id:0,kind:'climb',x,end,floor,roof:-320};l.setPieces.push(piece)
  for(let i=0;i<8;i++){const px=x+(i%2?200:70),y=floor-(i+1)*90;l.platforms.push({x:px,y,w:110,h:14});if([2,4,6].includes(i))spawn(i===4?'drone':'soldier',px+68,y,6,{tower:piece.id})}
  l.segments.push({x,name:'通讯竖井 · 垂直突围'})
 }
 if(l.id===0||l.id===4){
  const x=480+(l.id===0?11:21)*620,end=x+3100,floor=400;clearRoom(l,x,end);l.setPieces.push({id:0,kind:'escape',x,end,floor,roof:0});l.checkpoints.push(x-90)
  let left=x;for(const at of [x+650,x+1450,x+2320]){l.ground.push({x:left,y:floor,w:at-left,h:180});left=at+105;l.platforms.push({x:at-35,y:330,w:75,h:14})}l.ground.push({x:left,y:floor,w:end-left,h:180})
  for(let i=0;i<8;i++){const px=x+260+i*350;spawn(i%3===1?'drone':'soldier',px,i%3===1?290:floor,5+l.id);if(i%3===0)l.barriers.push({id:96000+i,x:px+120,y:360,w:40,h:40,hp:4,maxHp:4,material:'crate'})}
  l.segments.push({x,name:'断桥连锁坍塌 · 限时突围'})
 }
 // Encounters use a coordinated high/low/air formation, rather than independent extra spawns.
 for(const index of [0,3,6]){const a=l.encounters[index];if(!a)continue;const floor=l.ground.find(g=>a.x+260>=g.x&&a.x+260<g.x+g.w)?.y??400;l.platforms.push({x:a.x+205,y:floor-115,w:110,h:14});for(const [type,dx,y,hp,role]of [['sniper',260,floor-115,5,'high'],['runner',130,floor,6,'rush'],['drone',355,floor-135,6,'air'],['turret',480,floor,10,'cover']] as const){const e=spawn(type,a.x+dx,y,hp+l.id,{crossfire:role});a.enemies.push(e.id)}}
 l.ground.sort((a,b)=>a.x-b.x);l.segments.sort((a,b)=>a.x-b.x)
 l.checkpoints=l.checkpoints.map(desired=>[0,-40,40,-80,80,-120].map(d=>desired+d).find(x=>l.ground.some(g=>x>=g.x+2&&x+28<=g.x+g.w-2)&&!l.barriers.some(b=>x+28>b.x&&x<b.x+b.w))??desired).sort((a,b)=>a-b)
 if(l.id===0&&l.ladders.length<5){const x=480+31*620,floor=l.ground.find(g=>x+200>=g.x&&x+200<g.x+g.w)?.y??400;l.platforms.push({x:x+160,y:floor-120,w:160,h:14});l.ladders.push({id:Math.max(...l.ladders.map(p=>p.id))+1,x:x+210,y:floor-120,w:26,h:120})}
}
export function createArcade(l:Level):ArcadeState[]{return(l.setPieces??[]).filter(p=>p.end<=l.width).map(p=>({id:p.id,phase:'waiting',elapsed:0,cameraY:0,fromX:p.kind==='escape'?p.x-210:0,fromY:0,dangerY:p.floor+70}))}
export function collapseFront(p:SetPiece,s:ArcadeState,l:Level){return Math.min(p.end,s.fromX)}
// Legacy escape states remain readable, but no longer remove any terrain.
export function arcadeGround(l:Level,r:Run):Rect[]{return l.ground}
export function activeClimb(l:Level,r:Run){const s=r.arcade.find(s=>{const p=l.setPieces?.find(p=>p.id===s.id);return p?.kind==='climb'&&(s.phase==='active'||s.phase==='return')});return s?{state:s,piece:l.setPieces!.find(p=>p.id===s.id)!}:null}
export function arcadeInput(l:Level,r:Run,input:Input):Input{return activeClimb(l,r)?.state.phase==='return'?{...input,left:false,right:false,jump:false,up:false,duck:false,interact:false}:input}
export function tickArcade(l:Level,r:Run,dt:number){
 for(const s of r.arcade){const p=l.setPieces?.find(p=>p.id===s.id);if(!p)continue;if(p.kind==='escape'){s.phase='done';continue}
  if(s.phase==='waiting'&&r.x>=p.x+18&&r.x<p.end){s.phase='active';s.elapsed=0;emitSound(r,'objective',r.x)}
  if(s.phase==='waiting')continue
  if(p.kind==='chase'){
   if(s.phase==='active'){s.elapsed+=dt;s.fromY+=dt;if(s.elapsed>3.5&&s.fromY>1.6){s.fromY=0;r.threats.push({x:r.x-65,y:r.y+9,w:160,h:6,warning:.65,active:.18,kind:'beam'});emitSound(r,'supportFire',r.x-280)}if(r.x>=p.end-35){s.phase='done';r.score+=450;emitSound(r,'objective',r.x)}}
   continue
  }
  if(s.phase==='active'){
   s.elapsed+=dt;r.x=Math.max(p.x+12,Math.min(p.x+330,r.x))
   if(s.elapsed>2.5)s.dangerY-=dt*(s.dangerY-r.y-40>230?420:60)
   const arc=s.dangerY
   if(r.y+36>arc&&s.elapsed>2.5){r.hp=0;r.status='dead';r.reason='被竖井上升电弧追上';emitSound(r,'death',r.x)}
   if(r.grounded&&r.y+40<=p.roof+1){s.phase='return';s.elapsed=0;s.fromX=r.x;s.fromY=r.y;r.flipAge=-1;emitSound(r,'ropeGrab',r.x)}
  }else if(s.phase==='return'){
   s.elapsed+=dt;const t=Math.min(1,s.elapsed/1.6),ease=t*t*(3-2*t);r.x=s.fromX+(p.end-60-s.fromX)*ease;r.y=s.fromY+(p.floor-40-s.fromY)*ease;r.vy=0;r.flipAge=-1;r.invincible=Math.max(r.invincible,.1)
   if(t===1){s.phase='done';r.grounded=true;r.score+=500;emitSound(r,'ropeRelease',r.x)}
  }
  const target=s.phase==='active'||s.phase==='return'?Math.min(0,r.y-150):0;s.cameraY+=(target-s.cameraY)*(1-Math.exp(-dt*7));if(Math.abs(s.cameraY)<.1)s.cameraY=0
 }
}
export function arcadeCamera(l:Level,r:Run,width:number){const s=r.arcade.find(s=>s.cameraY!==0||l.setPieces?.some(p=>p.id===s.id&&p.kind==='climb'&&(s.phase==='active'||s.phase==='return')));const p=s&&l.setPieces?.find(p=>p.id===s.id);return{x:p?Math.max(0,Math.min(l.width-width,p.x+190-width/2)):Math.max(0,Math.min(l.width-width,r.x-width*.29)),y:s?.cameraY??0}}
export function crossfireOpen(e:Enemy,time:number){const t=time%8;return !e.crossfire||e.crossfire==='cover'||e.crossfire==='high'&&t<2.8||e.crossfire==='rush'&&t>=2&&t<5.5||e.crossfire==='air'&&t>=4.5}
export function tankStage(e:Enemy){return !e.parts||e.parts.tracks>0?'tracks':e.parts.gun>0?'gun':'engine'}
export function tankTarget(e:Enemy){const stage=tankStage(e);return{x:e.x+e.w*(stage==='tracks'?.45:stage==='gun'?.32:.78),y:e.y+e.h*(stage==='tracks'?.83:stage==='gun'?.3:.55)}}
export function tankDamage(e:Enemy,damage:number,impactY?:number){
 e.parts??={tracks:e.maxHp*.28,gun:e.maxHp*.3,engine:e.maxHp*.42};const stage=tankStage(e),target=tankTarget(e)
 if(impactY!==undefined&&Math.abs(impactY-target.y)>e.h*.24)damage*=.25
 const applied=Math.min(e.parts[stage],damage);e.parts[stage]=Math.max(0,e.parts[stage]-applied);return applied
}

export function arcadePlatforms(l:Level,r:Run){return l.platforms}
