// Signed travel drives the animation. Rendering never advances it, so pauses and frame rate do not spin parked wheels.
export type VehicleMotion={x:number,distance:number,speed:number,pitch?:number}
export function vehicleMotion(previous:VehicleMotion|undefined,x:number,dt:number,enabled=true):VehicleMotion{
 const dx=previous?x-previous.x:0
 const speed=enabled&&dt>0?dx/dt:0,acceleration=previous&&dt>0?(speed-previous.speed)/dt:0,target=Math.max(-.028,Math.min(.028,-acceleration/12000)),pitch=(previous?.pitch??0)+(target-(previous?.pitch??0))*(1-Math.exp(-Math.max(0,dt)*16))
 return{x,distance:(previous?.distance??0)+(enabled?dx:0),speed,pitch}
}
export function wheelPhase(motion:VehicleMotion|undefined,reduced=false){return reduced?0:(motion?.distance??0)/8}
export function drawVehicleWake(c:CanvasRenderingContext2D,motion:VehicleMotion|undefined,x:number,y:number,w:number,time:number,desert=false,reduced=false){
 if(reduced||!motion||Math.abs(motion.speed)<2)return
 const back=motion.speed>0?x:x+w,dir=motion.speed>0?-1:1,phase=((time*2)%1+1)%1
 c.save()
 for(let i=0;i<4;i++){const t=(phase+i*.24)%1;c.globalAlpha=(1-t)*.2;c.fillStyle=desert?'#ad8050':'#9aa598';c.beginPath();c.ellipse(back+dir*(6+t*25),y-1-t*6,4+t*10,2+t*4,0,0,Math.PI*2);c.fill()}
 for(let i=0;i<3;i++){const t=(phase+i*.31)%1;c.globalAlpha=(1-t)*.16;c.fillStyle=desert?'#514b3f':'#56666a';c.beginPath();c.ellipse(back+dir*(2+t*12),y-27-t*13,3+t*5,3+t*5,0,0,Math.PI*2);c.fill()}
 c.restore()
}
