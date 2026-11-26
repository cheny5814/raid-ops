import {frontFont} from './front-font'
import type {Rect} from './front'
import {drawEquipmentFinish} from './front-materials'
type C=CanvasRenderingContext2D
type Paint=string|CanvasGradient
const box=(c:C,x:number,y:number,w:number,h:number,color:Paint,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
const poly=(c:C,p:number[],color:Paint)=>{c.fillStyle=color;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.closePath();c.fill()}
const line=(c:C,p:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const oval=(c:C,x:number,y:number,rx:number,ry:number,color:Paint)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
const metal=(c:C,x:number,y:number,w:number,h:number,light='#a59b80',dark='#484d46',r=1)=>{const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.3,'#777a68');g.addColorStop(1,dark);box(c,x,y,w,h,g,r);line(c,[x+1,y+1,x+w-1,y+1],'#e4d5b34f',.7)}
const bolt=(c:C,x:number,y:number)=>{oval(c,x+.4,y+.5,1.4,1.3,'#34382f');oval(c,x,y,.8,.8,'#b8b69c')}
const noise=(seed:number,i:number)=>{const n=Math.sin(seed*.137+i*17.31)*43758.5453;return n-Math.floor(n)}
function dust(c:C,x:number,y:number,w:number){oval(c,x,y,w,.9+w*.035,'#4b39242b');for(let i=0;i<5;i++){const a=x-w+i*w*.43;line(c,[a,y+1,a+5,y+.3],'#c3a77c55',.7)}}

export function desertRock(c:C,seed:number){
 dust(c,0,0,51)
 const face=c.createLinearGradient(-30,-58,30,0);face.addColorStop(0,'#b7a183');face.addColorStop(.45,'#96836a');face.addColorStop(1,'#75634f')
 poly(c,[-49,0,-44,-16,-30,-37,-25,-51,-7,-59,14,-55,31,-39,39,-14,51,-3,37,2],face)
 poly(c,[-49,0,-29,-17,-16,-40,-7,-59,-25,-51,-30,-37,-44,-16],'#c5b192')
 poly(c,[-7,-59,9,-45,14,-21,37,2,51,-3,39,-14,31,-39,14,-55],'#685c4d')
 poly(c,[-29,-17,-10,-22,14,-21,37,2,7,-5,-11,-4,-49,0],'#a99170')
 line(c,[-29,-36,-19,-33,-4,-34,13,-30,26,-32],'#dac7a357',1)
 line(c,[-40,-20,-24,-22,-9,-19,12,-21],'#564e413e',1.2)
 line(c,[-24,-47,-18,-42,-21,-30,-14,-23,-17,-13],'#5b5143',.8)
 line(c,[12,-44,9,-34,15,-30,17,-18,24,-10],'#3d3b3266',.8)
 for(let i=0;i<18;i++){const x=-33+noise(seed,i)*62,y=-9-noise(seed+9,i)*33;line(c,[x,y,x+1+noise(seed+3,i)*4,y-.4],i%3?'#e1cda02b':'#3d3a322a',.65)}
 for(let i=0;i<3;i++){const x=-40+i*30+noise(seed,i)*9;poly(c,[x,-2,x+4,-6,x+10,-5,x+14,-1,x+8,1],'#8a785d')}
}
export function desertCactus(c:C,seed:number){
 dust(c,0,0,13);c.save();c.lineCap='round'
 line(c,[-1,-4,-1,-59],'#4a5141',10);line(c,[-18,-41,-18,-24,-2,-24],'#515d48',7);line(c,[2,-32,18,-32,18,-65],'#52644b',7)
 line(c,[-3,-6,-3,-57],'#849275',2);line(c,[-19,-39,-19,-25,-10,-25],'#9ba383',1);line(c,[16,-62,16,-34,8,-34],'#94a17b',1)
 for(let y=-12;y>-57;y-=7){line(c,[1,y,2,y-3],'#242f2c',.7);line(c,[-5,y-2,-8,y-3],'#b5b59b',.5)}
 for(let i=0;i<8;i++){const y=-35-i*3.3;line(c,[19,y,22,y-1],'#beb79c88',.55)}
 c.lineCap='butt';for(let i=0;i<4;i++){const x=-9+i*5;line(c,[x,0,x-3,-5-noise(seed,i)*7],'#89785b',.8)}c.restore()
}
export function desertShelter(c:C){
 dust(c,0,0,53)
 box(c,-45,-7,97,8,'#80715a',1);poly(c,[40,-58,51,-64,51,-7,40,-4],'#4b5148')
 const wall=c.createLinearGradient(-40,-60,25,0);wall.addColorStop(0,'#a69b7d');wall.addColorStop(1,'#716e59');box(c,-41,-59,81,54,wall)
 for(let x=-36;x<38;x+=9){line(c,[x,-55,x,-8],'#464d435c',1.1);line(c,[x+1,-55,x+1,-8],'#d3c6a458',.6)}
 poly(c,[-48,-58,-35,-68,45,-68,54,-60,39,-55,-48,-55],'#79684e');line(c,[-46,-58,39,-58,52,-62],'#c7b38c',1.2)
 for(let x=-33;x<42;x+=7)line(c,[x,-67,x-8,-58],'#393d3680',1)
 box(c,-19,-42,26,37,'#3c463f',1);box(c,-16,-39,21,34,'#555b4a');line(c,[-17,-41,-17,-8],'#c3b895',1)
 metal(c,1,-26,3,7,'#b1aa89','#42483c');bolt(c,2,-25)
 box(c,16,-44,18,13,'#374b49',1);line(c,[17,-43,32,-43,32,-33],'#b9b998',.9);line(c,[18,-40,27,-37],'#9bac9560',1)
 for(const x of[-39,37]){metal(c,x,-56,3,48);bolt(c,x+1,-51);bolt(c,x+1,-11)}
 line(c,[-34,-15,-28,-18,-23,-16],'#514d3f',1);box(c,-9,-57,25,5,'#c0ad8177');drawEquipmentFinish(c,-39,-57,77,49,4)
}
export function desertFuelStation(c:C){
 dust(c,0,0,89)
 for(const x of[-71,71]){poly(c,[x,-10,x+7,-10,x+5,-92,x,-92],'#6b6c5c');metal(c,x-1,-92,4,79,'#aaa58a','#4a5146');box(c,x-5,-8,15,6,'#8c8067',1);bolt(c,x+1,-15)}
 // A deep fascia, exposed roof ribs, rust seams and an underside beam give the canopy weight.
 poly(c,[-92,-99,-77,-109,76,-109,92,-99,87,-95,-90,-95],'#9b7454');poly(c,[-92,-99,92,-99,92,-91,-92,-91],'#835b43')
 box(c,-93,-96,186,3,'#c6b28a');line(c,[-88,-91,87,-91],'#463f35',1.5)
 for(let x=-76;x<78;x+=17){line(c,[x,-107,x-9,-100],'#d6bd9766',1);line(c,[x,-94,x+5,-92],'#5a433877',.8);bolt(c,x,-94)}
 metal(c,-69,-91,145,4,'#9a967c','#494c40');for(const x of[-47,44])box(c,x,-88,21,3,'#c6c2a04d',1)
 c.font=frontFont(7,'en');c.textAlign='center';c.fillStyle='#dac398';c.fillText('Fuel / 07',0,-96.5)
 for(const x of[-44,29]){
  box(c,x-6,-4,31,5,'#696652',2);metal(c,x-4,-45,27,41,'#b4ad8a','#596254',3)
  box(c,x-2,-43,23,18,'#4e6459',2);box(c,x+1,-40,17,9,'#1c3435',1);line(c,[x+3,-38,x+13,-38],'#b7c3a488',.8)
  for(let i=0;i<4;i++)box(c,x+3+i*3,-36,1.5,3,'#bdc5a2')
  box(c,x+3,-23,11,3,'#987957');for(let i=0;i<3;i++)line(c,[x+2,-16+i*3,x+15,-16+i*3],'#394c42',.9)
  c.strokeStyle='#343c34';c.lineWidth=2.5;c.beginPath();c.moveTo(x+23,-34);c.bezierCurveTo(x+37,-34,x+39,-9,x+30,-7);c.bezierCurveTo(x+21,-7,x+28,-24,x+25,-26);c.stroke()
  metal(c,x+23,-30,3,8,'#95977c','#293b34');line(c,[x+24,-30,x+28,-32],'#5d6453',1.6);drawEquipmentFinish(c,x-2,-42,22,35,Math.abs(x)*13)
 }
}
export function desertWaterTower(c:C){
 dust(c,1,0,29)
 for(const x of[-18,15]){line(c,[x,0,x*.65,-132],'#383f38',5);line(c,[x-1,0,x*.65-1,-132],'#9a9a7e',1.2);metal(c,x-5,-3,11,3,'#8c8e76','#484d41');bolt(c,x,-3)}
 for(let y=-22;y>-130;y-=32){line(c,[-17,y,15,y-29,-15,y-29,17,y],'#6d7563',2);line(c,[-15,y+1,14,y-28],'#b0ad8755',.6);bolt(c,-15,y);bolt(c,15,y)}
 const tank=c.createLinearGradient(-37,0,37,0);tank.addColorStop(0,'#545f56');tank.addColorStop(.2,'#b5b39a');tank.addColorStop(.45,'#9da38f');tank.addColorStop(.8,'#777e6b');tank.addColorStop(1,'#414e48')
 box(c,-37,-165,74,45,tank,3);oval(c,0,-165,37,6,'#acb29c');oval(c,0,-164,32,3.5,'#c4c5ac');oval(c,0,-120,37,5.5,'#4d5c50')
 for(const y of[-158,-128]){box(c,-38,y,76,3,'#5c685a');line(c,[-32,y,30,y],'#d4caae66',.8);for(const x of[-27,-9,10,28])bolt(c,x,y+1)}
 for(const x of[-19,4,23])line(c,[x,-157,x,-129],'#d0cfb12e',.8)
 for(const [x,y,h]of[[-25,-154,18],[15,-140,14],[27,-154,11]]){box(c,x,y,2,h,'#8d5c3f66',.5);line(c,[x+2,y+3,x+3,y+h],'#a36f494d',.7)}
 box(c,-10,-174,21,5,'#637463',2);oval(c,0,-173,11,2,'#a1ab8d');line(c,[29,-156,34,-156,34,-12],'#a2ab90',2)
 for(let y=-151;y<-10;y+=9)line(c,[29,y,39,y],'#aab095',1);line(c,[39,-156,39,-10],'#4c5e50',2)
 c.font=frontFont(8,'en');c.textAlign='center';c.fillStyle='#e0d8bd';c.fillText('Water',-4,-139);drawEquipmentFinish(c,-33,-159,61,31,7)
}
export function drawDesertCrate(c:C,p:Rect,seed=0,damaged=false){
 const x=p.x,y=p.y,w=p.w,h=p.h;box(c,x,y,w,h,'#5c5141',2)
 const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#b2a282');g.addColorStop(.45,'#8c8167');g.addColorStop(1,'#5e604e');box(c,x+2,y+2,w-4,h-4,g,1)
 for(let xx=x+7;xx<x+w-3;xx+=9){line(c,[xx,y+3,xx,y+h-3],'#4a4b3d88',.8);line(c,[xx+1,y+4,xx+1,y+h-6],'#cfbe9344',.5)}
 for(let i=0;i<10;i++){const xx=x+4+noise(seed,i)*(w-9),yy=y+5+noise(seed+8,i)*(h-11);line(c,[xx,yy,Math.min(x+w-4,xx+5),yy+2],'#534b393d',.6)}
 for(const yy of[y+3,y+h-8]){metal(c,x+2,yy,w-4,5,'#9fa187','#48574d');for(const xx of[x+6,x+w-7])bolt(c,xx,yy+2)}
 for(const xx of[x+3,x+w-7]){metal(c,xx,y+4,4,h-8,'#9a9e86','#3e5147');bolt(c,xx+2,y+10);bolt(c,xx+2,y+h-10)}
 box(c,x+w*.3,y+h*.35,w*.35,8,'#b4a47c55',1);line(c,[x+w*.34,y+h*.35+3,x+w*.58,y+h*.35+3],'#625f4666',1)
 box(c,x+w/2-6,y+3,12,3,'#2f423a',1);line(c,[x+7,y+h-3,x+w-8,y+h-3],'#d2b78c66',1);drawEquipmentFinish(c,x+3,y+3,w-6,h-6,seed)
 if(damaged)line(c,[x+w*.4,y+8,x+w*.54,y+h*.45,x+w*.43,y+h*.7,x+w*.6,y+h-8],'#383b30',1.4)
}
export function desertSandbags(c:C,p:Rect){
 box(c,p.x,p.y,p.w,p.h,'#635642',2)
 const rows=Math.ceil(p.h/12),rowH=p.h/rows
 c.save();c.beginPath();c.rect(p.x,p.y,p.w,p.h);c.clip()
 for(let row=0;row<rows;row++)for(let col=-1;col<Math.ceil(p.w/24)+1;col++){
  const seed=p.x*.1+row*13+col*7,x=p.x+col*24+(row%2?12:0),y=p.y+row*rowH,jitter=noise(seed,1)*1.4
  const g=c.createLinearGradient(x,y,x,y+rowH);g.addColorStop(0,'#bca985');g.addColorStop(.3,'#a59573');g.addColorStop(1,'#746449')
  c.fillStyle=g;c.beginPath();c.moveTo(x+3,y+1+jitter);c.bezierCurveTo(x+9,y-1,x+18,y+1,x+21,y+2);c.bezierCurveTo(x+26,y+5,x+24,y+rowH-1,x+20,y+rowH);c.lineTo(x+4,y+rowH-1);c.bezierCurveTo(x-1,y+rowH-2,x-1,y+4,x+3,y+1+jitter);c.fill()
  line(c,[x+3,y+3,x+8,y+2,x+17,y+3,x+21,y+5],'#d8c5a187',.6)
  line(c,[x+3,y+4,x+3,y+rowH-3],'#655c4666',.6);for(let j=0;j<5;j++)line(c,[x+5+j*3,y+4,x+6+j*3,y+5],'#665d472e',.5)
  line(c,[x+20,y+5,x+22,y+8,x+19,y+rowH-2],'#68583f66',.7)
 }
 for(let i=0;i<p.w/4;i++){const x=p.x+noise(p.x,i)*p.w,y=p.y+noise(p.y,i)*p.h;line(c,[x,y,x+1.2,y+1.4],'#d8c4a123',.5)}
 c.restore();line(c,[p.x+2,p.y+p.h-1,p.x+p.w-2,p.y+p.h-1],'#514732',1.5)
}
