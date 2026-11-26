import { frontFlip } from './front-jump-pose.ts'
import { INFANTRY_VISUAL_SCALE, infantryGun, infantryMuzzleLength, type InfantryOptions, type InfantryMotion } from './front-infantry.ts'
import type { Enemy, Input, Rect, Run } from './front.ts'
const rotate=(x:number,y:number,angle:number)=>({x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)})
export function playerRig(run:Run,input:Input,reduced=!!input.reducedMotion,motion:InfantryMotion|undefined=run.infantryMotion){
  const moving=run.ladder!==null?input.up||input.duck:run.grounded&&(input.left||input.right||run.dashTime>0)&&!run.duck
  const aim=run.aimAngle??(input.up?input.left||input.right?run.facing>0?-Math.PI/4:-Math.PI*3/4:-Math.PI/2:run.facing>0?0:Math.PI)
  let rotation=0,fold=0,open=0
  if(!reduced&&run.flipAge>=0&&!run.zipline&&run.rope===null&&run.ladder===null&&!run.grounded){const pose=frontFlip(run.flipAge,run.vy);rotation=run.flipFacing*Math.PI*2*pose.turn;fold=pose.fold;open=pose.open}
  const options:InfantryOptions={desert:run.biome==='desert',operative:run.operative,x:run.x+13,feet:run.y+40,facing:run.facing,time:reduced?0:run.time,moving:!reduced&&moving,crouch:run.duck,airborne:!run.grounded,armor:run.armor,pose:{dash:run.dashTime>0?1:0,aim:aim-(input.shoot?rotation:0),rope:!!run.zipline||run.rope!==null,ladder:run.ladder!==null,shooting:input.shoot,fold,airOpen:open,motion:reduced?undefined:motion,recoil:reduced?0:input.shoot?Math.max(0,(run.fireDelay/(run.shotDelay??.18)-.62)/.38):0,hit:reduced?0:Math.min(1,run.damageCue/.35)}}
  const anchor=infantryGun(options),r=rotate(anchor.x-run.x-13,anchor.y-run.y-20,rotation),gun={x:run.x+13+r.x*INFANTRY_VISUAL_SCALE,y:run.y+40+(r.y-20)*INFANTRY_VISUAL_SCALE,angle:anchor.angle+rotation}
  const muzzle={x:gun.x+Math.cos(gun.angle)*infantryMuzzleLength(25,run.weapon)*INFANTRY_VISUAL_SCALE,y:gun.y+Math.sin(gun.angle)*infantryMuzzleLength(25,run.weapon)*INFANTRY_VISUAL_SCALE}
  return {options,rotation,gun,muzzle}
}
export function enemyMuzzle(e:Enemy,playerX:number){
  const scale=e.drawScale??1,w=e.w/scale,h=e.h/scale,face=playerX<e.x?-1:1,aim=e.aim
  let gun={x:w/2,y:h*.38},length=30
  if(['soldier','runner','heavy','sniper'].includes(e.type)){
    const options:InfantryOptions={x:w/2,feet:h,facing:face,time:e.age,moving:(e.infantryMotion?.blend??0)>.02,crouch:false,enemy:true,kind:e.type,pose:{aim,motion:e.infantryMotion,shooting:true,recoil:Math.min(1,(e.shotFlash??0)/.12),hit:Math.min(1,(e.hitFlash??0)/.12)}}
    const base=infantryGun(options);gun={x:w/2+(base.x-w/2)*INFANTRY_VISUAL_SCALE,y:h+(base.y-h)*INFANTRY_VISUAL_SCALE};length=infantryMuzzleLength(e.type==='sniper'?29:23,e.type==='sniper'?'beam':e.type==='heavy'?'rapid':'rifle')*INFANTRY_VISUAL_SCALE
  }else if(e.type==='drone'){const bank=Math.sin(e.age*1.8)*.035;gun={x:w/2-Math.sin(bank)*10,y:h*.48+Math.cos(bank)*10};length=14}
  else if(e.type==='tank'){gun={x:59,y:30};length=54}
  else if(e.type==='turret'){gun={x:19,y:13};length=36}
  else if(e.type==='mech')length=69
  else if(e.type==='core')length=76
  else if(e.type==='mortar'){gun={x:22,y:24};const tilt=face<0?-.65:.65;return {gun:{x:e.x+gun.x*scale,y:e.y+gun.y*scale},muzzle:{x:e.x+(22+Math.sin(tilt)*30)*scale,y:e.y+(24-Math.cos(tilt)*30)*scale}}}
  return {gun:{x:e.x+gun.x*scale,y:e.y+gun.y*scale},muzzle:{x:e.x+(gun.x+Math.cos(aim)*length)*scale,y:e.y+(gun.y+Math.sin(aim)*length)*scale}}
}
/** Clip a long barrel against nearby cover so a close wall cannot be bypassed. */
export function clearMuzzle(gun:{x:number,y:number},muzzle:{x:number,y:number},obstacles:Rect[]){
  const dx=muzzle.x-gun.x,dy=muzzle.y-gun.y;let first=1
  for(const r of obstacles){let near=0,far=1;for(const[o,d,min,max]of [[gun.x,dx,r.x,r.x+r.w],[gun.y,dy,r.y,r.y+r.h]]){if(Math.abs(d!)<1e-8){if(o!<min!||o!>max!){near=2;break}}else{const a=(min!-o!)/d!,b=(max!-o!)/d!;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}}if(near<=far&&near>=0&&near<first)first=near;}
  return {x:gun.x+dx*first,y:gun.y+dy*first}
}
