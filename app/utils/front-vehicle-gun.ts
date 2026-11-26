// The vehicle sprite is scaled non-uniformly; convert the world aim before drawing its turret.
export function vehicleGun(p:{x:number,y:number},angle:number){
 const localAngle=Math.atan2(Math.sin(angle)/.74,Math.cos(angle)/.88)
 const pivot={x:p.x+59*.88,y:p.y+30*.74}
 const muzzle={x:pivot.x+Math.cos(localAngle)*54*.88,y:pivot.y+Math.sin(localAngle)*54*.74}
 return{pivot,muzzle,localAngle}
}
