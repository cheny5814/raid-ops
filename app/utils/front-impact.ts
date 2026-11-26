import type { Enemy, Defense, Bullet, Rect, Level } from './front'
export type ImpactStyle = 'flesh' | 'armor' | 'blocked' | 'pierce' | 'weak' | 'energy' | 'terrain'
export type CombatEffect = {x:number,y:number,time:number,kind:'hit'|'destroy'|'pickup'|'blast'|'boss'|'jump'|'land'|'fall'|'scrap',impact?:ImpactStyle,angle?:number,material?:'wood'|'metal'|'sand'|'concrete',fallen?:Enemy,duration?:number,floor?:number,ground?:Rect[],facing?:number,blastStyle?:'drone'|'armor'|'fuel'|'energy'|'dust',size?:number,seed?:number,weapon?:Bullet['kind']}
export function terrainMaterial(level:Pick<Level,'id'|'biome'>,point:{x:number,y:number},platforms:Rect[]):NonNullable<CombatEffect['material']>{
 const steel=platforms.some(p=>point.x>=p.x-.5&&point.x<=p.x+p.w+.5&&point.y>=p.y-.5&&point.y<=p.y+p.h+.5)
 return steel?'metal':level.biome==='desert'?'sand':level.id===3||level.id===4?'concrete':'metal'
}
/** Classify actual damage, after armor and boss-part checks. Visual only. */
export function impactStyle(defense:Defense,weapon:Bullet['kind']|undefined,scale:number,damage:number,incoming:number,open=false):ImpactStyle {
 if(damage<=0)return 'blocked'
 if(open&&scale>1&&damage>=incoming*.5)return 'weak'
 if(scale<.5||damage<incoming*.45)return defense==='energy'?'energy':'armor'
 if(weapon==='pulse'&&defense==='armor'||weapon==='beam'&&defense==='energy')return 'pierce'
 return defense==='energy'?'energy':defense==='armor'||defense==='air'?'armor':'flesh'
}
export const effectDuration=(f:CombatEffect)=>f.duration??(f.kind==='fall'?1.8:f.kind==='scrap'?.9:f.kind==='boss'?.8:f.kind==='blast'?.5:.32)
// Deterministic, bounded debris: no physics bodies, random allocations, or collision changes.
export function paintImpact(c:CanvasRenderingContext2D,f:CombatEffect,reduced=false,desert=false){
 const age=Math.max(0,Math.min(1,1-f.time/effectDuration(f))),p=reduced?.4:age,fade=1-age
 const stroke=(points:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(points[0]!,points[1]!);for(let i=2;i<points.length;i+=2)c.lineTo(points[i]!,points[i+1]!);c.stroke()}
 c.save();c.translate(f.x,f.y);c.globalAlpha*=fade
 if(f.kind==='scrap'){
  const wood=f.material==='wood',count=reduced?3:8
  for(let i=0;i<count;i++){
   const seed=i*2.399+f.x*.017,part=debrisMotion(f,i,reduced?.3:effectDuration(f)-f.time),dx=part.x-f.x,dy=part.y-f.y
   c.save();c.translate(dx,dy);c.rotate(reduced?seed:seed+p*(i%2?3:-3));c.fillStyle=wood?'#80664c':'#425864';c.fillRect(-3,-2,wood?9:6,wood?2:4);stroke([-2,-2,wood?5:2,-2],wood?'#c2a475':'#a0afa9',.7);c.restore()
  }
  if(!reduced&&!wood)for(let i=0;i<3;i++){
   c.fillStyle=desert?'#51473e':'#293c48';c.globalAlpha=fade*.24;c.beginPath();c.ellipse((i-1)*12+p*8,-10-p*(23+i*8),5+p*10,4+p*8,0,0,Math.PI*2);c.fill()
  }
 }else if(f.impact==='terrain'){
  c.rotate(f.angle??-Math.PI/2)
  const energy=f.weapon==='beam',sand=f.material==='sand',count=reduced?3:f.weapon==='spread'?5:f.weapon==='rapid'?3:7,reach=energy?14:f.weapon==='pulse'?17:f.weapon==='rapid'?8:12
  c.fillStyle=sand?'#6f5547':'#1c303b';c.beginPath();c.ellipse(0,0,1.5,2.4,0,0,Math.PI*2);c.fill()
  if(energy){
   const glow=c.createRadialGradient(0,0,0,0,0,12);glow.addColorStop(0,'#e9dcffb0');glow.addColorStop(.3,'#b0a2da80');glow.addColorStop(1,'#7969b900');c.fillStyle=glow;c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.fill()
   for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*2.5,r=3+p*reach;stroke([0,0,Math.cos(a)*r*.5,Math.sin(a)*r*.5+2,Math.cos(a)*r,Math.sin(a)*r],i%2?'#aaa2dd':'#e8e4f7',1)}
  }else if(sand||f.material==='concrete'||f.material==='wood'){
   const wood=f.material==='wood',stone=f.material==='concrete',shade=sand?'#a58359':wood?'#8e7659':'#8b9088'
   // A broad, short dust cloud and dull chips distinguish soft/porous surfaces from hot steel.
   puff(c,3+p*7,0,4+p*11,2+p*7,shade,fade*(sand?.5:.3))
   for(let i=0;i<(reduced?2:stone?4:3);i++){const a=(i/3-.5)*2.4,r=2+p*(stone?15:11),x=Math.cos(a)*r,y=Math.sin(a)*r;c.save();c.translate(x,y);c.rotate(i+p*2);c.fillStyle=shade;c.beginPath();c.moveTo(-1.6,-.8);c.lineTo(wood?4:1.6,-1.2);c.lineTo(1,1);c.lineTo(-1.2,.6);c.fill();c.restore()}
  }else{
   for(let i=0;i<count;i++){
    const a=(i/(count-1)-.5)*2.45,r=2+p*reach*(.65+i%3*.17),x=Math.cos(a)*r,y=Math.sin(a)*r
    stroke([x,y,x+Math.cos(a)*(2+fade*4),y+Math.sin(a)*(2+fade*4)],sand?'#745141':f.weapon==='pulse'?'#c4dceb':'#f2c68c',sand?.9:1.2)
    if(!reduced&&i%2===0){c.save();c.translate(x,y);c.rotate(i+p*3);c.fillStyle=sand?'#8c674a':'#667d84';c.fillRect(-1,-.7,2.4,1.4);c.restore()}
   }
   if(!sand&&age<.26){c.fillStyle='#fff3d0';c.beginPath();c.ellipse(1,0,1.8*fade,1.2*fade,0,0,Math.PI*2);c.fill()}
  }
 }else{
  const style=f.impact??'flesh',blocked=style==='blocked',energy=style==='energy',through=style==='pierce'||style==='weak',a=f.angle??0
  c.rotate(a)
  const color=blocked?'#91aabb':energy?'#b4a4db':style==='pierce'?'#a9d6df':style==='weak'?'#edbd7b':style==='armor'?'#d7b27a':desert?'#755549':'#b3b4a0'
  if(blocked){
   // A bent ricochet and a closed bracket differ from a successful hit marker.
   stroke([-4,-7,0,-7,0,7,-4,7],color,1.5)
   if(!reduced)stroke([-3,0,-9-p*18,-4-p*9,-14-p*16,-3-p*10],color,1.2)
  }else if(energy){
   stroke([-5,-6,-1,-2,-4,2,2,6,0,2,5,-3],color,1.4)
   if(!reduced)stroke([-2,-4,-8-p*7,-9+p*3],color,.8)
  }else{
   const count=reduced?3:style==='flesh'?4:7
   for(let i=0;i<count;i++){
    const theta=(i/(count-1)-.5)*2.2,reach=3+p*(style==='flesh'?8:18),x=Math.cos(theta)*reach,y=Math.sin(theta)*reach
    stroke([x,y,x+Math.cos(theta)*(2+fade*5),y+Math.sin(theta)*(2+fade*5)],color,style==='flesh'?1:1.4)
   }
   if(through){
    stroke([-9-p*8,0,7+p*14,0],color,1.8)
    const g=4+p*3
    for(const side of [-1,1])stroke([side*(g+4),-g-4,side*g,-g],color,1.4)
    if(style==='weak')for(const side of [-1,1])stroke([side*(g+4),g+4,side*g,g],color,1.4)
   }
  }
 }
 c.restore()
}
/** Scars and vent smoke are tied to real health/part state, never decorative shields. */
export function paintDamageWear(c:CanvasRenderingContext2D,e:Enemy,time:number,reduced=false){
 if(e.hp<=0||!['tank','mech','core','turret','drone','mortar'].includes(e.type))return
 const damage=1-e.hp/e.maxHp,broken=!!e.parts&&e.parts.tracks<=0
 if(damage<.25&&!broken)return
 c.save()
 const count=damage>.65?3:1
 for(let i=0;i<count;i++){
  const x=e.x+e.w*(.28+i*.21),y=e.y+e.h*(.35+i%2*.24)
  c.fillStyle='#192b33';c.beginPath();c.ellipse(x,y,4+i,2.5+i,.4,0,Math.PI*2);c.fill()
  c.strokeStyle='#b7a387';c.lineWidth=.8;c.beginPath();c.moveTo(x-3,y-2);c.lineTo(x+1,y-4);c.lineTo(x+5,y);c.stroke()
 }
 if(damage>.55||broken){
  const x=e.x+e.w*.76,y=e.y+e.h*.3
  for(let i=0;i<(reduced?1:3);i++){
   const rise=reduced?8:((time*19+i*12)%36)
   c.globalAlpha=(1-rise/42)*.22;c.fillStyle=e.desert?'#594b3e':'#354450';c.beginPath();c.ellipse(x+Math.sin(i+(reduced?0:time))*3,y-rise,4+rise*.14,3+rise*.2,0,0,Math.PI*2);c.fill()
  }
 }
 c.restore()
}

const effectGround=new WeakMap<object,Rect[]>()
export function rememberEffectGround(owner:object,ground:Rect[]){effectGround.set(owner,ground)}
export function destructionGround(owner:object,x:number){return(effectGround.get(owner)??[]).filter(p=>p.x+p.w>x-180&&p.x<x+180&&(!('hp'in p)||(p as Rect&{hp:number}).hp>0)).map(p=>({x:p.x,y:p.y,w:p.w,h:p.h,rise:p.rise}))}
export function debrisFloor(ground:Rect[],x:number,y:number){let floor=Infinity;for(const p of ground)if(x>=p.x&&x<=p.x+p.w){const top=p.y+(p.rise??0)*Math.max(0,Math.min(1,(x-p.x)/p.w));if(top>=y-4)floor=Math.min(floor,top)}return Number.isFinite(floor)?floor:y+700}
export function debrisMotion(f:CombatEffect,i:number,t:number){
 const seed=(f.seed??f.x*.13)+i*2.399,scale=Math.max(.65,Math.min(1.8,(f.size??30)/32)),vx=Math.cos(seed)*(35+i%4*18)*scale,vy=-(48+i%5*19)*scale,g=310
 const approx=Math.max(0,(-vy+Math.sqrt(vy*vy+2*g*Math.max(0,(f.floor??f.y+500)-f.y)))/g),floor=f.ground?debrisFloor(f.ground,f.x+vx*approx,f.y):f.floor??f.y+700
 const hit=(-vy+Math.sqrt(vy*vy+2*g*Math.max(0,floor-f.y)))/g
 if(t<hit)return{x:f.x+vx*t,y:f.y+vy*t+.5*g*t*t,angle:seed+t*(i%2?5:-4),landed:false,floor}
 const dt=t-hit,bounce=Math.min(52,(vy+g*hit)*.2),settled=dt>2*bounce/g
 return{x:f.x+vx*hit+vx*.18*(1-Math.exp(-dt*6))/6,y:settled?floor-1:floor-bounce*dt+.5*g*dt*dt,angle:seed+hit*(i%2?5:-4)+(settled?0:dt*1.4),landed:true,floor}
}
function puff(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string,opacity:number){
 c.save();c.translate(x,y);c.scale(1,ry/Math.max(.1,rx));const g=c.createRadialGradient(0,0,rx*.14,0,0,rx);g.addColorStop(0,color+'c0');g.addColorStop(.52,color+'80');g.addColorStop(1,color+'00');c.globalAlpha*=opacity;c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.restore()
}
function fireLobe(c:CanvasRenderingContext2D,x:number,y:number,r:number,seed:number,heat:number,alpha:number){
 if(r<.4||alpha<=0)return
 c.save();c.translate(x,y);c.rotate(Math.sin(seed)*.35);c.scale(1,.86+Math.sin(seed*1.7)*.1);c.globalAlpha*=alpha
 const g=c.createRadialGradient(-r*.18,r*.2,r*.02,0,0,r*1.08)
 g.addColorStop(0,heat>.6?'#fff8ce':'#ffe58a');g.addColorStop(.24,'#ffe38a');g.addColorStop(.48,'#ffbe43');g.addColorStop(.69,'#f87a24');g.addColorStop(.86,'#ba3719');g.addColorStop(1,'#552018');c.fillStyle=g
 c.beginPath();c.moveTo(-r*.94,0);c.bezierCurveTo(-r*1.11,-r*.55,-r*.62,-r*1.02,-r*.13,-r*.9);c.bezierCurveTo(r*.26,-r*1.18,r*.96,-r*.82,r*.9,-r*.2);c.bezierCurveTo(r*1.16,r*.25,r*.74,r*.93,r*.18,r*.83);c.bezierCurveTo(-r*.24,r*1.04,-r*1.04,r*.61,-r*.94,0);c.closePath();c.fill();c.restore()
}
// Generated transparent 4 × 4 atlas. One decoded image is shared by every explosion.
let destructionAtlas:HTMLImageElement|undefined,atlasFailed=false
export function warmDestructionArt(){
 if(destructionAtlas||atlasFailed||typeof Image==='undefined')return
 destructionAtlas=new Image();destructionAtlas.decoding='async';destructionAtlas.onerror=()=>{atlasFailed=true};destructionAtlas.src='/iron-front/fx/explosion-atlas-v1.png'
}
export function paintExplosionAtlas(c:CanvasRenderingContext2D,f:CombatEffect,reduced=false){
 warmDestructionArt()
 const atlas=destructionAtlas
 if(atlasFailed||!atlas?.complete||!atlas.naturalWidth||!atlas.naturalHeight||f.blastStyle==='dust')return false
 const age=Math.max(0,effectDuration(f)-f.time),size=Math.max(16,Math.min(100,f.size??(f.kind==='boss'?75:f.kind==='blast'?47:28))),life=f.kind==='boss'?1.5:1.25
 const frame=reduced?(age<.62?5:12):Math.min(15,Math.floor(age/life*16)),cellW=atlas.naturalWidth/4,cellH=atlas.naturalHeight/4,extent=size*4,fade=age>life?Math.max(0,1-(age-life)/.28):1
 c.save();c.globalAlpha*=fade*(reduced?.68:1)
 c.drawImage(atlas,frame%4*cellW+1,Math.floor(frame/4)*cellH+1,cellW-2,cellH-2,f.x-extent/2,f.y-extent/2,extent,extent);c.restore();return true
}
/** Local ignition -> torn flame jets -> secondary burns -> rising smoke and falling wreckage. */
export function paintExplosion(c:CanvasRenderingContext2D,f:CombatEffect,reduced=false,desert=false){
 const t=Math.max(0,effectDuration(f)-f.time),size=Math.max(16,Math.min(100,f.size??(f.kind==='boss'?75:f.kind==='blast'?47:28))),style=f.blastStyle??'armor',dust=style==='dust',energy=style==='energy',seed=f.seed??f.x*.137+f.y*.021,fade=Math.min(1,f.time/.45),motion=reduced?0:t
 c.save()
 const textured=paintExplosionAtlas(c,f,reduced)
 if(!textured){
 // Smoke separates from the fast flame: later frames retain mass instead of a fading ring.
 if(t>.07)for(let i=0;i<(reduced?2:5);i++){
  const a=i*2.399+seed,r=(size*.3+motion*13)*(i%2?.8:1.1),drift=Math.sin(a)*size*.25+motion*(Math.cos(seed)*9+4)
  puff(c,f.x+drift,f.y-size*.1-motion*(16+i*5),r,r*(.8+i%2*.2),dust?(desert?'#8d755b':'#65716e'):desert?'#443c34':'#263039',fade*(dust?.42:.65)*Math.min(1,t*6))
 }
 if(!dust){
  const early=Math.max(0,1-t/.17),burn=Math.max(0,1-t/(style==='fuel'?.86:.68)),expand=.52+Math.min(1,t*7.5)*.58
  if(early>0)puff(c,f.x,f.y,size*.9,size*.7,energy?'#b8cfde':'#ffb951',early*.65)
  if(burn>0){
   const count=reduced?5:10
   // Overlapping, rolling masses form one fireball. The white-hot base closes gaps between lobes.
   for(let i=0;i<count;i++){
    const angle=seed+i*2.399,delay=(i%3)*.018,age=Math.max(0,t-delay),life=Math.max(0,1-age/(style==='fuel'?.85:.67)),r=size*(.31+i%3*.035)*(.65+Math.min(1,age*10)*.5)*Math.pow(life,.55)
    const distance=size*(.16+Math.min(1,age*7)*.34)*expand,x=f.x+Math.cos(angle)*distance,y=f.y+Math.sin(angle)*distance*.74-age*size*.65
    fireLobe(c,x,y,r,seed+i+age*1.7,life,Math.min(1,life*3.2))
   }
   const core=size*(.38+Math.min(1,t*9)*.16)*Math.pow(burn,.55)
   fireLobe(c,f.x,f.y-t*size*.38,core,seed*.3,burn,Math.min(1,burn*4))
   if(t<.12)puff(c,f.x,f.y,size*.32,size*.28,'#fff2c9',Math.max(0,1-t/.12))
  }
  if(!reduced&&(style==='drone'||style==='fuel'))for(let i=0;i<2;i++){
   const age=t-(.17+i*.14),life=Math.max(0,1-age/.29)
   if(age>0&&life>0)fireLobe(c,f.x+Math.cos(seed+i*2)*size*.37,f.y-size*.12-age*size*.7,size*.31*(.7+age*2)*life,seed+i,life,Math.min(1,life*2))
  }
 }
 }
 const count=reduced?3:style==='drone'?6:style==='fuel'?10:8
 for(let i=0;i<count;i++){
  const part=debrisMotion(f,i,motion),ember=!dust&&i%3===0&&t<.58
  c.save();c.translate(part.x,part.y);c.rotate(part.angle);c.globalAlpha*=fade
  c.fillStyle=dust?'#817667':'#32434a';c.beginPath()
  if(style==='drone'&&i%3===1){c.moveTo(-7,-.8);c.lineTo(5,-1.5);c.lineTo(8,.2);c.lineTo(-6,1.3)}
  else{c.moveTo(-3,-2);c.lineTo(3,-1.5);c.lineTo(4,1);c.lineTo(-1,2.5);c.lineTo(-4,.5)}c.closePath();c.fill();c.strokeStyle='#8f9992';c.lineWidth=.65;c.beginPath();c.moveTo(-3,-1.7);c.lineTo(2,-1.2);c.stroke();c.restore()
  if(!reduced&&ember&&!part.landed){c.save();c.globalAlpha=fade*.5;c.strokeStyle='#e9aa65';c.lineWidth=.8;c.beginPath();c.moveTo(part.x,part.y);c.lineTo(part.x-Math.cos(seed+i*2.399)*5,part.y-3);c.stroke();c.restore()}
 }
 c.restore()
}
