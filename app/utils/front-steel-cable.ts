type Ctx=CanvasRenderingContext2D
export function paintSteelCable(c:Ctx,x:number,y:number,endX:number,endY:number,taut:boolean,time=0){
 const length=Math.hypot(endX-x,endY-y),angle=Math.atan2(endY-y,endX-x);if(length<1)return
 c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';c.lineJoin='round'
 const sag=taut?.18:Math.min(1.4,length*.004)*(1+Math.sin(time*3)*.08),steps=Math.ceil(length/2),bow=(t:number)=>Math.sin(t*Math.PI)*sag
 const path=(offset:number)=>{c.beginPath();for(let i=0;i<=steps;i++){const t=i/steps,yy=bow(t)+offset;if(i===0)c.moveTo(0,yy);else c.lineTo(t*length,yy)}}
 path(0);c.strokeStyle='#0b1d28c9';c.lineWidth=4;c.stroke()
 const metal=c.createLinearGradient(0,-1.6,0,1.6);metal.addColorStop(0,'#465e6c');metal.addColorStop(.3,'#d2dbd4');metal.addColorStop(.58,'#8ba0a6');metal.addColorStop(1,'#324e60');path(0);c.strokeStyle=metal;c.lineWidth=2.4;c.stroke()
 for(const phase of [0,Math.PI]){c.beginPath();for(let i=0;i<=steps;i++){const t=i/steps,yy=bow(t)+Math.sin(t*length*.95+phase)*.65;if(i===0)c.moveTo(0,yy);else c.lineTo(t*length,yy)}c.strokeStyle=phase?'#e0e2cd90':'#3c5869b0';c.lineWidth=.45;c.stroke()}
 // Swaged steel ferrules protect the wire at both loaded ends.
 for(const at of [3,length-8]){const g=c.createLinearGradient(0,-2.4,0,2.4);g.addColorStop(0,'#c0c9bf');g.addColorStop(.4,'#7b949b');g.addColorStop(1,'#2f4c5c');c.fillStyle=g;c.beginPath();c.roundRect(at,-2.3,6,4.6,1);c.fill();c.strokeStyle='#3b5663';c.lineWidth=.5;for(const d of [1.5,3,4.5]){c.beginPath();c.moveTo(at+d,-1.8);c.lineTo(at+d,1.8);c.stroke()}}
 c.restore()
 // A steel D-ring with a separate spring gate replaces the glowing circular handle.
 c.save();c.translate(endX,endY);c.rotate((angle-Math.PI/2)*.25)
 c.strokeStyle='#172f3c';c.lineWidth=3.6;c.beginPath();c.moveTo(-3,-1);c.bezierCurveTo(-8,1,-7,10,-1,12);c.bezierCurveTo(5,14,8,5,4,1);c.stroke()
 c.strokeStyle='#c1ccc2';c.lineWidth=1.7;c.stroke();c.strokeStyle='#718c95';c.lineWidth=1.8;c.beginPath();c.moveTo(-3,-1);c.lineTo(4,1);c.stroke();c.fillStyle='#d3c3a0';c.fillRect(-1.5,-1,2,2.7)
 c.fillStyle='#3d5963';c.beginPath();c.roundRect(-9,11,18,4,1.5);c.fill();c.fillStyle='#a8b8b0';c.fillRect(-6,11.3,12,.7);c.restore()
}
