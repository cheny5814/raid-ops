import type {Enemy} from './front.ts'
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x))
/** Cosmetic recovery lives inside the existing fire interval; it never delays a shot. */
export function infantryAction(e:Enemy,facing:number,reduced=false){
 const since=e.lastShotAt===undefined?Infinity:Math.max(0,e.age-e.lastShotAt),firing=(e.shotFlash??0)>0,preparing=e.windup>0,hold=firing||since<.17
 const reload=!reduced&&!preparing&&!hold&&since<.78?Math.sin(clamp((since-.17)/.61)*Math.PI):0
 const prepare=hold?1:preparing?clamp(1-e.windup/(e.type==='sniper'?.8:.58)):0
 const rest=facing>0?.18:Math.PI-.18,delta=Math.atan2(Math.sin(e.aim-rest),Math.cos(e.aim-rest))
 return{aim:hold?e.aim:rest+delta*prepare,reload,brace:preparing?prepare:hold?1:0}
}
/** Hull response is bounded around the fixed gun pivot; it cannot move a muzzle or collision box. */
export function hullResponse(motion:{pitch?:number}|undefined,flash:number,reduced=false){
 if(reduced)return{pitch:0,settle:0}
 const kick=Math.max(0,Math.min(1,flash/.12))
 return{pitch:Math.max(-.035,Math.min(.035,motion?.pitch??0))+Math.sin(kick*Math.PI)*-.012,settle:Math.sin(kick*Math.PI)*.65}
}
export function mechStride(e:Pick<Enemy,'age'|'vehicleMotion'>,side:number,reduced=false){
 const phase=(e.vehicleMotion?.distance??0)*.055,move=Math.min(1,Math.abs(e.vehicleMotion?.speed??0)/30),lift=reduced?0:Math.max(0,Math.sin(phase+side*Math.PI/2))*4*move
 return{lift,compress:reduced?0:Math.pow(Math.max(0,Math.cos(phase+side*Math.PI/2)),6)*1.3*move}
}
export type MechanicalSource={id:string,x:number,speed:number,aim:number,shotAt?:number,age:number,kind:'vehicle'|'infantry'}
export function mechanicalSources(run:{enemies:Enemy[],tactics:{id:number,kind:string,hp:number,x:number,cannonAim?:number,vehicleMotion?:{speed:number}}[],time:number}):MechanicalSource[]{
 const sources:MechanicalSource[]=run.enemies.filter(e=>e.hp>0&&!e.dormant&&['tank','mech','turret','soldier','heavy','sniper'].includes(e.type)).map(e=>({id:'enemy:'+e.id,x:e.x+e.w/2,speed:e.vehicleMotion?.speed??0,aim:e.aim,shotAt:e.lastShotAt,age:e.age,kind:['tank','mech','turret'].includes(e.type)?'vehicle':'infantry'}))
 for(const p of run.tactics)if(p.kind==='vehicle'&&p.hp>0)sources.push({id:'vehicle:'+p.id,x:p.x+52,speed:p.vehicleMotion?.speed??0,aim:p.cannonAim??0,age:run.time,kind:'vehicle'})
 return sources
}
