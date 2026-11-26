import { firearmMuzzle, paintFirearm } from './front-firearms.ts'
export const INFANTRY_VISUAL_SCALE=1.25
export const isInfantry=(type:string)=>['soldier','runner','heavy','sniper'].includes(type)
export function infantryTop(e:{type:string,y:number,h:number,drawScale?:number}){return isInfantry(e.type)?e.y+e.h-40.2*(e.drawScale??1)*INFANTRY_VISUAL_SCALE:e.y}
// Shared proportions and materials for playable infantry and every human enemy.
type Ctx=CanvasRenderingContext2D
type Point={x:number,y:number}
export type InfantryMotion={phase:number,blend:number,direction:number,landing:number,crouch?:number}
export type MotionTracker=InfantryMotion&{x:number,time:number,grounded:boolean}
export function trackInfantry(previous:MotionTracker|undefined,x:number,time:number,grounded:boolean,active:boolean,facing:number,crouch=false):MotionTracker{
  if(!previous||time<previous.time)return {x,time,grounded,phase:0,blend:0,direction:1,landing:0,crouch:crouch?1:0}
  const dt=Math.max(0,Math.min(.06,time-previous.time)),dx=x-previous.x,travel=Math.abs(dx)<70?Math.abs(dx):0
  if(dt===0)return previous
  const target=active&&grounded?Math.min(1,travel/dt/95):0,blend=previous.blend+(target-previous.blend)*(1-Math.exp(-dt*(target>previous.blend?14:10)))
  return {x,time,grounded,crouch:(previous.crouch??0)+((crouch?1:0)-(previous.crouch??0))*(1-Math.exp(-dt*20)),phase:previous.phase+(target>0?travel*.065:dt*previous.blend*5),blend,direction:travel>.01?Math.sign(dx)*facing:previous.direction,landing:grounded&&!previous.grounded?.2:Math.max(0,previous.landing-dt)}
}
export type InfantryPose={sprint?:number,brace?:number,reload?:number,dash?:number,aim?:number,rope?:boolean,ladder?:boolean,shooting?:boolean,fold?:number,airOpen?:number,recoil?:number,hit?:number,motion?:InfantryMotion,collapse?:{age:number,side:number,variant:number}}
export type InfantryOptions={desert?:boolean,operative?:'raven'|'fox',x:number,feet:number,facing:number,time:number,moving:boolean,crouch:boolean,enemy?:boolean,kind?:string,airborne?:boolean,armor?:number,pose?:InfantryPose}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const rect=(c:Ctx,x:number,y:number,w:number,h:number,color:string|CanvasGradient,r=0)=>{c.fillStyle=color;c.beginPath();if(r)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.fill()}
const line=(c:Ctx,p:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const poly=(c:Ctx,p:number[],color:string|CanvasGradient)=>{c.fillStyle=color;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.closePath();c.fill()}
const disc=(c:Ctx,x:number,y:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function plate(c:Ctx,x:number,y:number,w:number,h:number,light:string,dark:string){
  const g=c.createLinearGradient(x,y,x+w*.25,y+h);g.addColorStop(0,light);g.addColorStop(.28,dark);g.addColorStop(1,'#162b36');
  poly(c,[x+1,y,x+w-1,y,x+w,y+1,x+w,y+h-1,x+w-1,y+h,x+1,y+h,x,y+h-1,x,y+1],g)
  line(c,[x+.8,y+.5,x+w-1,y+.5,x+w-.5,y+1.3],'#d4d5bd88',.5)
  line(c,[x+1,y+h-.5,x+w-1,y+h-.5],'#0c202b',.6)
}
export function infantryKnee(a:Point,b:Point,upper:number,lower:number,bend=1):Point{
  const distance=Math.max(.001,Math.hypot(b.x-a.x,b.y-a.y)),d=clamp(distance,Math.abs(upper-lower)+.01,upper+lower-.01),ux=(b.x-a.x)/distance,uy=(b.y-a.y)/distance
  const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along))
  return {x:a.x+ux*along-uy*height*bend,y:a.y+uy*along+ux*height*bend}
}
export function infantryFoot(phase:number,blend:number,direction=1,sprint=0){
  const effort=clamp(sprint,0,1),reach=6.5+effort*2, lift=5.8+effort*4
  const p=((phase/(Math.PI*2))%1+1)%1,support=.57-effort*.15,swing=clamp((p-support)/(1-support),0,1),ease=swing*swing*(3-2*swing)
  return {x:(p<support?reach-p/support*reach*2:-reach+ease*reach*2)*blend*direction,y:-1.6-Math.sin(swing*Math.PI)*lift*blend,support:p<support}
}
function fabric(c:Ctx,a:Point,b:Point,wa:number,wb:number,light:string,dark:string){
  const length=Math.max(.001,Math.hypot(b.x-a.x,b.y-a.y)),nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,mx=a.x*.45+b.x*.55,my=a.y*.45+b.y*.55
  const g=c.createLinearGradient(a.x+nx*wa/2,a.y+ny*wa/2,a.x-nx*wa/2,a.y-ny*wa/2);g.addColorStop(0,light);g.addColorStop(.65,dark);g.addColorStop(1,'#1a303a')
  c.fillStyle=g;c.beginPath();c.moveTo(a.x+nx*wa/2,a.y+ny*wa/2);c.quadraticCurveTo(mx+nx*(wa+wb)*.32,my+ny*(wa+wb)*.32,b.x+nx*wb/2,b.y+ny*wb/2);c.lineTo(b.x-nx*wb/2,b.y-ny*wb/2);c.quadraticCurveTo(mx-nx*(wa+wb)*.25,my-ny*(wa+wb)*.25,a.x-nx*wa/2,a.y-ny*wa/2);c.closePath();c.fill()
  line(c,[a.x+nx*wa*.25,a.y+ny*wa*.25,b.x+nx*wb*.25,b.y+ny*wb*.25],'#c5c6ad35',.45)
  line(c,[mx-nx*wa*.28,my-ny*wa*.28,mx+nx*wb*.2,my+ny*wb*.2+1],'#172c35',.55)
}
// Separate pelvis, torso and limbs: recoil, knee failure, hand contact, then settling.
const smooth=(a:number,b:number,t:number)=>{const k=clamp(t,0,1),e=k*k*(3-2*k);return a+(b-a)*e}
export function infantryCollapse(age:number,side=1,variant=0){
 const t=Math.max(0,age),s=side<0?-1:1,v=variant%3
 const keys=[{t:0,hip:0,y:-20,lean:0},{t:.12,hip:-.7,y:-19,lean:-.09},{t:.4,hip:1.8,y:-12.5,lean:.42},{t:.78,hip:7,y:-5.2,lean:1.42},{t:.88,hip:7.8,y:-6,lean:1.34},{t:1.12,hip:8.8,y:-4.8,lean:1.51}]
 const i=Math.max(0,keys.findIndex((k,n)=>n<keys.length-1&&t>=k.t&&t<keys[n+1]!.t)),a=t>=1.12?keys.at(-1)!:keys[i]!,b=t>=1.12?a:keys[i+1]!,u=a===b?1:(t-a.t)/(b.t-a.t)
 const hipX=s*smooth(a.hip,b.hip,u),hipY=smooth(a.y,b.y,u),lean=s*smooth(a.lean,b.lean,u),kneel=clamp((t-.1)/.32,0,1),settle=clamp((t-.42)/.4,0,1)
 const leg=(rear:boolean)=>{const start={x:rear?-3.3:3.7,y:-1.6},standing=infantryKnee({x:rear?-1.8:1.7,y:-20},start,9.8,9.9,-1)
  const ankle={x:smooth(smooth(start.x,s*(rear?-8:4),kneel),s*(rear?-10-v:-6-v),settle),y:-1.6}
  const knee={x:smooth(smooth(standing.x,s*(rear?-1:9),kneel),s*(rear?0:2.5),settle),y:smooth(smooth(standing.y,rear?-3.5:-4.2,kneel),rear?-3.8:-4.4,settle)}
  return{ankle,knee}}
 return{hipX,hipY,lean,head:s*(-.18*clamp(t/.5,0,1)+.26*clamp((t-.65)/.35,0,1)),release:clamp((t-.12)/.24,0,1),contact:clamp((t-.55)/.23,0,1),legs:[leg(true),leg(false)],hands:[{x:smooth(hipX+s*4,s*(18+v),clamp((t-.38)/.4,0,1)),y:smooth(hipY+5,-2.7,clamp((t-.38)/.4,0,1))},{x:smooth(hipX+s*10,s*(29+v),clamp((t-.38)/.4,0,1)),y:smooth(hipY+3,-3.5,clamp((t-.38)/.4,0,1))}]}
}
export function infantryRig(o:InfantryOptions){
  const {facing:face,time,moving,crouch,kind='',airborne=false,pose={}}=o,runner=kind==='runner'
  const motion=pose.motion,phase=motion?.phase??time*Math.PI*(runner?6.2:5),run=(pose.ladder||pose.rope||airborne||crouch)?0:(motion?.blend??(moving?1:0)),direction=motion?.direction??1
  const duck=motion?.crouch??(crouch?1:0),landing=(motion?.landing??0)/.2,compress=Math.sin(landing*Math.PI)*2.4,bob=(Math.cos(phase*2)-1)*.42*run,breath=Math.sin(time*2.2)*.17*(1-run)
  const hit=pose.hit??0,impactSettle=Math.sin(hit*Math.PI)*.85
  const tuck=pose.fold??0,hipY=(-20+11.5*duck)+run*.9+bob+compress+tuck*.6+impactSettle*.5,shoulderY=(-29.7+14.2*duck)+bob+compress+breath+tuck*1.8+impactSettle,headTop=(-40.2+14.2*duck)+bob+compress+breath+tuck*2.3+impactSettle*.8
  const hipX=Math.sin(phase)*run*.28,lean=(pose.ladder||pose.rope?0:run*((runner?.16:.075+(pose.sprint??0)*.105)*direction+Math.sin(phase)*.025))+(pose.dash??0)*.13+(pose.recoil??0)*-.025-(pose.hit??0)*.1+tuck*.07
  const aim=pose.aim??(face>0?0:Math.PI),localAim=Math.atan2(Math.sin(aim),Math.cos(aim)*face)-lean
  const recoil=(pose.recoil??0)*1.05,ax=Math.cos(localAim),ay=Math.sin(localAim)
  const gun={x:6-tuck*1.4+run*Math.sin(phase+.35)*.18-ax*recoil,y:shoulderY+4.0-tuck*.8+Math.sin(phase*2+.3)*run*.2-ay*recoil}
  return {phase,run,direction,duck,hipY,shoulderY,headTop,hipX,lean,aim,localAim,gun,ax,ay}
}
export function infantryGun(o:InfantryOptions,rig=infantryRig(o)){
  const {phase,run,hipX,hipY,lean,gun,aim}=rig,dx=gun.x-Math.sin(phase+.15)*run*.35,dy=gun.y-hipY,cos=Math.cos(lean),sin=Math.sin(lean)
  return {x:o.x+o.facing*(hipX+dx*cos-dy*sin),y:o.feet+hipY+dx*sin+dy*cos,angle:aim}
}
export const infantryMuzzleLength=firearmMuzzle
export function paintInfantry(c:Ctx,o:InfantryOptions){
  const {x,feet,facing:face,time,moving,crouch,enemy=false,kind='',airborne=false,armor=0,pose={}}=o
  const heavy=kind==='heavy',runner=kind==='runner',sniper=kind==='sniper',hero=!enemy,fox=hero&&o.operative==='fox'
  const cloth=hero?(o.desert?(fox?'#c5ad81':'#82998c'):(fox?'#8a9890':'#829f94')):(o.desert?'#89795e':heavy?'#626e70':sniper?'#555f70':'#52636a'),clothDark=hero?(o.desert?'#56675d':'#345458'):(o.desert?'#534d42':'#2d414b'),steel=hero?(o.desert?'#c8c5a1':fox?'#c3c7ad':'#b7cec4'):(o.desert?'#a69c7c':heavy?'#8b9695':'#7c898c'),steelDark=hero?'#4c6d70':o.desert?'#5e5b4c':'#364b57',trim=hero?(fox?'#e4b77f':'#8ed8d1'):'#cf856a'

  let rig=infantryRig(o)
  const collapse=pose.collapse?infantryCollapse(pose.collapse.age,pose.collapse.side,pose.collapse.variant):null
  if(collapse)rig={...rig,hipX:collapse.hipX,hipY:collapse.hipY,shoulderY:collapse.hipY-9.7,headTop:collapse.hipY-20.2,lean:collapse.lean,run:0,gun:{...rig.gun,y:collapse.hipY-5.7}}
  const {phase,run,direction,duck,hipY,shoulderY,headTop,hipX,lean,aim,localAim,gun,ax,ay}=rig
  c.save();c.translate(x,feet);c.scale(face,1);c.lineJoin='round';c.lineCap='round'
  // Rear limb first. The front knee tracks the foot instead of tracing a rigid zig-zag.
  for(const rear of [true,false]){
    const step=infantryFoot(phase+(rear?Math.PI:0),run,direction,pose.sprint??0),hip={x:hipX+(rear?-1.8:1.7),y:hipY}
    let ankle={x:step.x+(1-run)*(rear?-3.3:3.7),y:step.y}
    if(duck>0)ankle={x:ankle.x*(1-duck)+(rear?-6.5:7.3)*duck,y:ankle.y*(1-duck)-1.6*duck}
    if(airborne){const open=pose.airOpen??0;ankle={x:(rear?-5.5:6.0)*(1-open)+(rear?-3.3:3.7)*open,y:(rear?-4.2:-7.1)*(1-open)-1.6*open}}
    if(pose.fold){const tuck=pose.fold;ankle={x:ankle.x*(1-tuck)+(rear?-2:3)*tuck,y:ankle.y*(1-tuck)+(rear?-15:-17)*tuck}}
    if(pose.ladder)ankle={x:rear?-4:4,y:-4-(1+Math.sin(time*9+(rear?Math.PI:0)))*3}
    if(pose.rope)ankle={x:rear?-7:6,y:rear?-3:-6}
    if(collapse)ankle={...collapse.legs[rear?0:1]!.ankle}
    const knee=collapse?collapse.legs[rear?0:1]!.knee:infantryKnee(hip,ankle,9.8,9.9,-1)
    fabric(c,hip,knee,heavy?5.3:fox?3.9:4.5,3.7,rear?clothDark:cloth,clothDark)
    fabric(c,knee,ankle,3.8,2.6,rear?'#3a5052':cloth,clothDark)
    // Cargo pocket folds and boot fastenings follow each articulated limb.
    const pocket={x:hip.x*.55+knee.x*.45,y:hip.y*.55+knee.y*.45}
    c.save();c.translate(pocket.x,pocket.y);c.rotate(Math.atan2(knee.y-hip.y,knee.x-hip.x)-Math.PI/2)
    rect(c,-1.4,-1,2.8,3.2,rear?clothDark:cloth,.4);line(c,[-1.1,-.6,1.1,-.6,.9,.3,-.9,.3],'#b0b69a6b',.4);line(c,[-1,1.8,1,1.8],'#253c40',.4);c.restore()
    for(let lace=0;lace<2;lace++)line(c,[ankle.x-.7,ankle.y-1.8-lace,ankle.x+1,ankle.y-1.3-lace],'#84938a',.35)
    c.save();c.translate(knee.x,knee.y);c.rotate(Math.atan2(ankle.y-knee.y,ankle.x-knee.x)-Math.PI/2);plate(c,-1.9,-1.5,3.8,3.7,rear?'#687c79':steel,steelDark);line(c,[-1,-.2,1,-.2],'#d3cbb375',.45);c.restore()
    line(c,[ankle.x-1.2,ankle.y-3,ankle.x+1.1,ankle.y-2.3],'#253c43',1.2)
    poly(c,[ankle.x-2.2,ankle.y-1.8,ankle.x+1,ankle.y-1.7,ankle.x+4.6,ankle.y-.2,ankle.x+4.8,ankle.y+1.6,ankle.x-2.4,ankle.y+1.6],'#1b303a')
    line(c,[ankle.x-2.2,ankle.y+1.3,ankle.x+4.5,ankle.y+1.3],'#82938c',.55)
    line(c,[ankle.x-.7,ankle.y-1.3,ankle.x+.8,ankle.y-.8],'#a1a78b',.45)
  }
  c.save();c.translate(hipX,hipY);c.rotate(lean);c.translate(-Math.sin(phase+.15)*run*.35,-hipY)
  const handPoint=(along:number,down:number)=>({x:gun.x+ax*along-ay*down,y:gun.y+ay*along+ax*down})
  const arm=(rear:boolean)=>{
    const shoulder={x:rear?-3.6:3.6,y:shoulderY+1.3}
    let hand=rear?handPoint(1.3,5.5):handPoint(10.7,2.8)
    if(pose.reload&&rear){const v=pose.reload;hand={x:hand.x*(1-v)+3*v,y:hand.y*(1-v)+(shoulderY+8)*v}}
    if(pose.rope&&(rear||!pose.shooting))hand={x:rear?-1:2,y:headTop+8}
    if(pose.ladder&&(rear||!pose.shooting))hand={x:rear?-3:3,y:headTop+1+Math.sin(time*9+(rear?Math.PI:0))*3}
    if(collapse){const contact=collapse.hands[rear?0:1]!,dx=contact.x-hipX,dy=contact.y-hipY,local={x:dx*Math.cos(lean)+dy*Math.sin(lean),y:hipY-dx*Math.sin(lean)+dy*Math.cos(lean)};hand={x:smooth(hand.x,local.x,collapse.release),y:smooth(hand.y,local.y,collapse.release)}}
    const elbow=infantryKnee(shoulder,hand,8.1,8.6,1)
    fabric(c,shoulder,elbow,heavy?4.6:3.8,3.1,rear?clothDark:cloth,clothDark)
    fabric(c,elbow,hand,3.0,2.2,rear?clothDark:'#708682',clothDark)
    c.save();c.translate(elbow.x,elbow.y);c.rotate(Math.atan2(hand.y-elbow.y,hand.x-elbow.x));plate(c,0,-1.2,4.7,2.4,steel,steelDark);c.restore()
    disc(c,hand.x,hand.y,1.5,'#263e45');line(c,[hand.x-.7,hand.y-.5,hand.x+.7,hand.y-.4],'#a5b1a0',.5)
  }
  arm(true)
  if(sniper)poly(c,[-5,shoulderY-1,-10,shoulderY+3,-11-Math.sin(phase-.5)*run,hipY+3,-5,hipY+1],'#364953')
  if(!runner){plate(c,-8.1,shoulderY+1,3.7,10.7,steelDark,'#293e48');line(c,[-7.8,shoulderY+3,-8.3,shoulderY-5],'#809792',.6);rect(c,-7.5,shoulderY+4,1,3,trim,.3)}
  poly(c,[-4.8,shoulderY-1,3.8,shoulderY-1,6.2,shoulderY+3,3.7,hipY+.4,-3.8,hipY+.4,-5.7,shoulderY+4],cloth)
  line(c,[-4,shoulderY+1,-3,hipY-.6,3.1,hipY-.6,4,shoulderY+1],'#253f44',1)
  plate(c,-3.6,shoulderY+1,7.8,7.2,steel,steelDark)
  poly(c,[-2.5,shoulderY+3,2.9,shoulderY+3,2.1,shoulderY+6.3,-2,shoulderY+6.3],'#334f59')
  line(c,[-2.7,shoulderY+1.7,1,shoulderY+1.7],'#d3d1b8',.45);line(c,[1.3,shoulderY+4.8,2.6,shoulderY+4.8],'#a9b6a55c',.4)
  if(hero){line(c,[-2.3,shoulderY+3.5,0,shoulderY+5.5,2.3,shoulderY+3.5],'#e5dfb7',.9);rect(c,-1.8,shoulderY+3.6,3.8,.9,trim,.2);if(armor)for(let i=0;i<armor;i++)rect(c,-2+i*1.7,shoulderY+6,1,.6,trim,.15)}
  else{rect(c,-1.8,shoulderY+3.6,3.8,1,'#c58467',.2);line(c,[-2.7,shoulderY+6,1.3,shoulderY+6],'#8d9b8c',.5)}
  rect(c,-4.2,hipY-2,8.7,2.2,'#263d42',.5);for(const px of [-3,0,3]){plate(c,px-1.1,hipY-3.7,2.2,3.2,'#9c9e82','#526759');line(c,[px-.6,hipY-3,px+.5,hipY-3],'#c7c6a1',.35)}
  if(heavy){plate(c,-4.3,shoulderY+.5,9.3,8.3,'#a8ac98','#4b6060');line(c,[-2.5,shoulderY+3,2.9,shoulderY+3],'#c29c76',.8);for(const sx of [-7,4]){plate(c,sx,shoulderY-1,4.6,5,'#a18c7e','#554c4c');rect(c,sx+.7,shoulderY+.1,3.2,1.2,'#af6b5d',.2)}plate(c,-2.7,hipY+.6,6,3.9,'#7b8d87','#394f56')}
  else{plate(c,fox?-5.5:-6.1,shoulderY-.6,fox?2.8:3.7,3.5,steel,steelDark);plate(c,3.6,shoulderY-.4,fox?2.9:3.9,3.8,steel,steelDark)}
  // Webbing carries real shaped magazine pouches, buckles and a cable into the radio pack.
  for(const sx of [-3.4,2.7]){line(c,[sx,shoulderY+1,sx*.9,hipY-2],'#1b333b',1.4);line(c,[sx+.3,shoulderY+1,sx*.9+.3,hipY-2],'#a2ad955c',.4)}
  for(const px of [-2.6,.4]){rect(c,px,shoulderY+6.6,2.5,3.4,clothDark,.4);line(c,[px+.2,shoulderY+7,px+2.2,shoulderY+7,px+1.9,shoulderY+7.8,px+.4,shoulderY+7.8],'#b5b99b',.35);disc(c,px+1.2,shoulderY+8,.25,'#d0c7a4')}
  line(c,[-5.5,shoulderY+1,-4.7,shoulderY-1,-2,shoulderY-1],'#8b9b8b',.5)
  if(runner){rect(c,-5,hipY-1.4,2.5,4,'#6c7c69',.4);line(c,[-4.5,hipY-.8,-3.1,hipY-.8],'#c0baa0',.4)}
  if(sniper)for(let i=0;i<4;i++)line(c,[-5.8-i*.7,shoulderY+1+i*2,-8.4-i*.6,shoulderY+4+i*2],'#9da78b55',.5)
  if(enemy){rect(c,4.1,shoulderY+.6,2.7,1.4,'#b8654c',.2);line(c,[4.4,shoulderY+1,6.5,shoulderY+1],'#ecb58a',.45)}
  c.save();if(!collapse&&pose.hit){c.translate(0,headTop+7);c.rotate(.08*pose.hit);c.translate(0,-headTop-7)}if(!collapse&&pose.brace){c.translate(0,headTop+7);c.rotate(-.045*pose.brace);c.translate(0,-headTop-7)}if(collapse){c.translate(.5,headTop+9);c.rotate(collapse.head);c.translate(-.5,-headTop-9)}
  // Head protection is compact: a narrow visor for the player, exposed jaw and goggles for guards.
  rect(c,-.9,headTop+7.4,2.8,3.2,hero?'#b2957c':'#aa9077',.6)
  const skin=fox?'#c5a187':'#b6977a'
  if(fox){const sway=Math.sin(time*8)*(.6+run*1.6);c.fillStyle='#403632';c.beginPath();c.moveTo(-3.5,headTop+1.5);c.bezierCurveTo(-8,headTop-1,-7+sway,headTop+10,-11+sway,headTop+14);c.bezierCurveTo(-5+sway,headTop+13,-3,headTop+6,-3.5,headTop+1.5);c.fill();line(c,[-5.2,headTop+3,-6.5+sway,headTop+9],'#877460',.7);rect(c,-5,headTop+2.5,2,1.5,trim,.3)}
  poly(c,[-2.6,headTop+2,2.6,headTop+2,3.2,headTop+4,4.2,headTop+4.7,3,headTop+5.6,2.2,headTop+7.5,-.6,headTop+8,-2.9,headTop+5.7],skin)
  if(hero){
    poly(c,[-3.7,headTop+3,-3.5,headTop+.2,-1.5,headTop-1,2,headTop-.7,3.1,headTop+1.8,.8,headTop+2,-.8,headTop+1.6,-1.8,headTop+4],fox?'#4a3a31':'#303e3d')
    line(c,[-2.6,headTop+.4,.6,headTop+.1,2,headTop+1],'#788076',.6)
    if(fox){plate(c,-2.3,headTop+1.2,5.8,1.5,'#a8957e','#475b60');rect(c,-1.6,headTop+1.4,2,1,'#344c59',.3);rect(c,1,headTop+1.4,2,1,'#344c59',.3);line(c,[.9,headTop+4,2.5,headTop+4],'#3c3c37',.55)}
    else{rect(c,-.4,headTop+3.5,3.8,1.5,'#243f4b',.45);line(c,[0,headTop+3.8,2.6,headTop+3.8],'#b8d5c7',.4);line(c,[-1.3,headTop+6.5,2.4,headTop+7.3],'#6d6a5b',.6)}
    line(c,[1.2,headTop+6,2.4,headTop+6.1],'#856b58',.45)
  }else{plate(c,-3.9,headTop,7.4,3.8,'#a3aa92','#586e62');line(c,[-4.1,headTop+3.2,4,headTop+3.2],'#253e42',.8);rect(c,.3,headTop+3.8,3.3,1.5,'#233d44',.4);line(c,[.7,headTop+4.1,2.6,headTop+4.0],'#b4c5b6',.4);line(c,[1,headTop+6.5,2.8,headTop+6.3],'#6d6255',.45)}
  disc(c,-3.2,headTop+4.8,1.4,'#334d55');disc(c,-3.4,headTop+4.6,.7,'#b2bca8');line(c,[-3.4,headTop+5.2,-1.8,headTop+6.6,.5,headTop+6.5],'#293f45',.5)
  rect(c,-2,shoulderY-2,5,2.8,clothDark,.6)
  if(o.desert){fabric(c,{x:-3,y:shoulderY-2},{x:-8+Math.sin(time*7)*1.3,y:shoulderY+7},2.8,1.5,'#c4ad7e','#87724e');line(c,[-2,headTop+7,3,headTop+7],'#b59f77',2.1)}
  if(sniper){poly(c,[-4.8,headTop-.3,2.8,headTop-1.2,4,headTop+2,-4.4,headTop+3.6],'#6d7d82');line(c,[-3.8,headTop+.4,1.8,headTop+.1],'#a8b3a35c',.6)}
  if(heavy){plate(c,-.3,headTop+5.3,4.5,2.8,'#8d9990','#3e575b');for(let i=0;i<3;i++)line(c,[i*1.2+.3,headTop+6.2,i*1.2+.3,headTop+7.2],'#203b43',.45)}
  c.restore()
  arm(false)
  // A small painted band identifies allegiance without turning every pauldron into a neon block.
  rect(c,3.7,shoulderY+1.6,3.1,1.3,trim,.3);line(c,[4,shoulderY+2,5.7,shoulderY+2],'#d5d1b53b',.4)
  c.restore();c.restore()
  return infantryGun(o,rig)
}

export const paintInfantryWeapon=paintFirearm
