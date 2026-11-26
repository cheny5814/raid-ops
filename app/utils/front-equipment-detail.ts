import type {Enemy} from './front.ts'
import type {Interactive} from './front-interactions.ts'
type C=CanvasRenderingContext2D
const line=(c:C,p:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const box=(c:C,x:number,y:number,w:number,h:number,color:string|CanvasGradient,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
const disc=(c:C,x:number,y:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function panel(c:C,x:number,y:number,w:number,h:number,light='#82918c',dark='#2c414c'){
 const g=c.createLinearGradient(x,y,x+w*.2,y+h);g.addColorStop(0,light);g.addColorStop(.24,dark);g.addColorStop(1,'#172a34');box(c,x,y,w,h,g,2);line(c,[x+1,y+1,x+w-1,y+1],light+'a0',.7)
 for(const xx of[x+2.5,x+w-2.5])for(const yy of[y+2.5,y+h-2.5]){disc(c,xx,yy,.8,'#a4afa0');line(c,[xx-.4,yy,xx+.4,yy],'#2a4149',.4)}
}
function vent(c:C,x:number,y:number,w:number,h:number){box(c,x,y,w,h,'#132833',1);for(let yy=y+2;yy<y+h-1;yy+=3){line(c,[x+2,yy,x+w-2,yy],'#70837d',.6);line(c,[x+2,yy+.8,x+w-2,yy+.8],'#091c27',.8)}}
function gauge(c:C,x:number,y:number,r:number,live:boolean){disc(c,x,y,r+1,'#172e39');disc(c,x,y,r,'#a5ad96');disc(c,x,y,r-.8,'#303d3c');for(let i=0;i<5;i++){const a=2.5+i*1.1;line(c,[x+Math.cos(a)*r*.68,y+Math.sin(a)*r*.68,x+Math.cos(a)*r*.86,y+Math.sin(a)*r*.86],'#c1bda2',.5)}const a=live?-.7:2.5;line(c,[x,y,x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7],live?'#e5c28a':'#7e8b82',.7);disc(c,x,y,.8,'#c3bd9e')}
function wheel(c:C,x:number,y:number,r:number,angle:number,color='#bfa481'){
 c.strokeStyle='#263d45';c.lineWidth=3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.strokeStyle=color;c.lineWidth=1.4;c.stroke()
 for(let i=0;i<4;i++){const a=angle+i*Math.PI/2;line(c,[x,y,x+Math.cos(a)*r,y+Math.sin(a)*r],color,1)}disc(c,x,y,1.7,'#71867f')
}
/** Rear-plane fixtures replace the former repeated crate/tank silhouettes; no collision objects are added. */
export function drawDistrictEquipment(c:C,id:number,x:number,powered:boolean,time:number,reduced=false){
 const t=reduced?0:time;c.save();c.translate(x,390);c.globalAlpha*=.68
 if(id===1){
  panel(c,0,-96,43,96,'#8c8d7f','#4d4c45');for(const yy of[-83,-21]){panel(c,-3,yy,49,5,'#89968b','#35474b');for(const xx of[3,37])disc(c,xx,yy+2.5,1,'#c2b9a0')}
  panel(c,8,-64,27,34,'#746e58','#252f32');for(let i=0;i<4;i++)box(c,12+i*5,-59,2.5,23,powered?'#d194556e':'#3e4642',1)
  gauge(c,21,-77,6,powered);line(c,[44,-23,76,-23,76,-4,120,-4],'#223741',14);line(c,[44,-25,76,-25,76,-6,120,-6],'#718178',6)
  panel(c,61,-33,28,5);wheel(c,76,-36,9,powered?Math.sin(t*.3)*.06:0);vent(c,97,-28,24,16)
 }else if(id===2){
  panel(c,0,-40,78,39,'#89968f','#364b57');vent(c,7,-33,38,24);panel(c,52,-33,18,20);gauge(c,61,-23,5,powered)
  for(const xx of[4,67])panel(c,xx,-4,8,4);line(c,[83,-1,83,-101],'#2c414d',5);panel(c,75,-104,48,7)
  for(let i=0;i<6;i++)box(c,80+i*6,-96,3,2,powered?'#c1ba88':'#445550',.5)
  panel(c,90,-74,21,26,'#8e9180','#414d49');box(c,94,-70,13,11,'#192e3b',1);line(c,[96,-65,100,-68,105,-63],powered?'#afba91':'#425451',.8);line(c,[95,-55,105,-55],'#ae9b73',1)
 }else if(id===3){
  panel(c,0,-43,76,42,'#8e9581','#465447');vent(c,8,-27,24,18);panel(c,39,-36,29,25);gauge(c,48,-26,5,powered);box(c,58,-30,5,3,powered?'#a7c8a0':'#4b594d',.5)
  panel(c,34,-72,8,29);disc(c,38,-70,5,'#8a9583');c.save();c.translate(38,-70);c.rotate(powered?Math.sin(t*.25)*.35:0)
  c.fillStyle='#51655e';c.beginPath();c.moveTo(-22,-23);c.quadraticCurveTo(-14,4,19,-11);c.quadraticCurveTo(-4,0,-22,-23);c.fill();line(c,[-22,-23,19,-11],'#a6afa090',1);line(c,[-9,-8,7,-30,1,-15],'#899a86',1);disc(c,7,-30,1.5,'#baad80');c.restore()
  line(c,[74,-30,88,-30,88,0],'#263d43',2);for(let i=0;i<3;i++)panel(c,79,-21+i*7,10,4)
 }else if(id===4){
  panel(c,0,-47,83,46,'#8c9290','#424a53');vent(c,5,-38,20,28);for(const xx of[42,67]){disc(c,xx,-26,11,'#182c38');c.strokeStyle='#778b8b';c.lineWidth=.8;c.beginPath();c.arc(xx,-26,9,0,Math.PI*2);c.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*2/5+(powered?t*1.4:0);line(c,[xx+Math.cos(a)*3,-26+Math.sin(a)*3,xx+Math.cos(a+.3)*8,-26+Math.sin(a+.3)*8],'#6d8385',2)}}
  disc(c,29,-12,1.4,powered?'#9bbb9d':'#46574e')
  line(c,[9,-47,9,-67,61,-67,61,-47],'#2b4149',7);line(c,[9,-49,9,-67,61,-67,61,-49],'#8a9082',2)
  line(c,[96,0,96,-100,111,-123,101,-97,116,-102],'#768983',1.5);for(let i=0;i<3;i++)line(c,[87,-85-i*8,108,-85-i*8],'#9da592',1)
 }else if(id===5){
  panel(c,0,-96,47,96,'#829e97','#304d56');for(const yy of[-83,-19])panel(c,-3,yy,53,6,'#9bb0a3','#364f55');vent(c,7,-76,17,32);gauge(c,34,-66,6,powered)
  panel(c,10,-36,26,22);for(let i=0;i<3;i++)box(c,15,-31+i*5,16,2,powered?'#8eb8a2':'#425b59',.4)
  line(c,[48,-28,89,-28,89,-5,124,-5],'#1d353f',18);line(c,[48,-31,89,-31,89,-8,124,-8],'#718d8b',8)
  for(const xx of[56,72])panel(c,xx,-40,5,25,'#a3b1a0','#3b5a5c');wheel(c,89,-43,8,0,'#90b4ab');panel(c,100,-78,25,43);vent(c,105,-71,15,23)
 }
 c.restore()
}
/** Small physical controls sit inside the existing, shootable equipment, using its actual state. */
export function drawInteractiveDetail(c:C,p:Interactive,levelId:number,time:number,reduced=false){
 if(p.kind==='gun'||p.kind==='mine')return
 const dead=p.hp<=0,t=reduced?0:time;c.save()
 if(dead){
  c.beginPath();c.rect(0,0,p.w,p.h);c.clip();for(let i=0;i<3;i++){const x=5+i*6;line(c,[x,5,x+1,12,x-2,18,x+3,p.h-3],i%2?'#8c785e':'#586c65',.8)}box(c,3,p.h-7,Math.max(2,p.w-6),4,'#101e28',1)
 }else if(p.kind==='barrel'){
  for(let i=0;i<3;i++)line(c,[4+i*7,8,4+i*7,22],'#dba27d30',.6);disc(c,17,2.5,2.2,'#2d3b3d');disc(c,17,2.5,1,'#b79c7d');line(c,[18,24,16,28,20,29],'#c28e5a',.8)
 }else if(p.kind==='power'){
  panel(c,3,4,18,20);box(c,6,7,12,9,'#122b35',1);gauge(c,12,11,3.5,true);line(c,[18,8,16,11,19,11,17,14],'#d6b77f',.8)
  for(const xx of[7,12,17]){box(c,xx-1,18,2,3,'#b5b79d',.4);line(c,[xx,18,xx+1,16],'#263c40',.8)}line(c,[22,8,22,22],'#a1afa1',1.2);disc(c,20,26,1.2,'#9bc9a3')
 }else if(p.kind==='coolant'){
  for(const xx of[0,21]){panel(c,xx,3,3,23,'#a3b6a4','#3f5c5c');for(const yy of[7,23])disc(c,xx+1.5,yy,.6,'#c7c6aa')}
  gauge(c,12,24,3.2,true);wheel(c,12,12,6.3,0,'#b0c5ab');line(c,[8,13,5,25],'#829790',.7)
 }else if(p.kind==='relay'){
  for(let i=0;i<3;i++){panel(c,3,4+i*8,18,6,'#a7afa4','#44505b');box(c,6,6+i*8,10,1.4,'#b7b1cd',.3);disc(c,18,7+i*8,.75,'#a6c4b0')}
  line(c,[2,5,2,24],'#79928c',.7)
 }else if(p.kind==='alarm'){
  panel(c,3,9,18,13,'#9e8d81','#433e43');vent(c,6,11,12,8);line(c,[7,3,7,6,17,6,17,3],'#c6a593',.8)
  if(p.timer>=0&&!p.triggered){const a=reduced?0:t*5;line(c,[12,2,12+Math.cos(a)*5,2+Math.sin(a)*1.5],'#ffe2ac',1.3)}
 }
 // Muted painted district strip, never a false interaction prompt.
 if(!dead&&p.kind!=='barrel')box(c,3,p.h-3,Math.max(3,p.w-6),1,levelId===1?'#b49a73':levelId===5?'#88b4ac':'#9aa897',.3)
 c.restore()
}
export function drawVehicleDamage(c:C,e:Pick<Enemy,'x'|'y'|'w'|'h'|'hp'|'maxHp'|'id'|'age'>,reduced=false){
 if(!Number.isFinite(e.hp)||!e.maxHp||e.hp>=e.maxHp)return
 const severity=1-Math.max(0,e.hp)/e.maxHp;c.save();c.beginPath();c.rect(e.x,e.y,e.w,e.h);c.clip()
 for(let i=0;i<Math.ceil(severity*5);i++){const x=e.x+e.w*(.2+((i*37+e.id)%60)/100),y=e.y+e.h*(.36+i%3*.17);c.fillStyle='#18272883';c.beginPath();c.ellipse(x,y,4+severity*5,3+severity*3,-.4,0,Math.PI*2);c.fill();line(c,[x-3,y-1,x,y+2,x+3,y-2],'#a8a08a',.65)}
 if(severity>.55){const x=e.x+e.w*.74,y=e.y+e.h*.4;for(let i=0;i<3;i++){const p=reduced?i/3:((e.age*.6+i*.31)%1+1)%1;c.globalAlpha=(1-p)*.24;c.fillStyle='#2a302e';c.beginPath();c.ellipse(x+Math.sin(p*4+i)*3,y-p*19,2+p*5,3+p*7,0,0,Math.PI*2);c.fill()}}
 c.restore()
}
