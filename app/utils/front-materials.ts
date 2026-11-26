import {hullResponse} from './front-combat-motion.ts'
import {drawVehicleDamage} from './front-equipment-detail.ts'
import {wheelPhase,drawVehicleWake} from './front-vehicle-motion'
import { paintMuzzleFlash } from './front-firearms'
import type { Enemy, Level, Pickup } from './front'
type Ctx = CanvasRenderingContext2D
const STEEL = { edge:'#9aaeb2', light:'#637d87', face:'#344c59', dark:'#182a35', seam:'#0b1923', bolt:'#bcc5ba', yellow:'#c2a16b' }
function rect(c:Ctx,x:number,y:number,w:number,h:number,color:string|CanvasGradient,r=0){c.fillStyle=color;c.beginPath();if(r)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.fill()}
function path(c:Ctx,points:number[],color:string,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0]!,points[1]!);for(let i=2;i<points.length;i+=2)c.lineTo(points[i]!,points[i+1]!);c.stroke()}
function poly(c:Ctx,points:number[],color:string|CanvasGradient){c.fillStyle=color;c.beginPath();c.moveTo(points[0]!,points[1]!);for(let i=2;i<points.length;i+=2)c.lineTo(points[i]!,points[i+1]!);c.closePath();c.fill()}
function ellipse(c:Ctx,x:number,y:number,rx:number,ry:number,color:string){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function finish(c:Ctx,x:number,y:number,w:number,h:number,top=STEEL.light,bottom=STEEL.dark,r=1){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,top);g.addColorStop(.16,STEEL.face);g.addColorStop(.65,bottom);g.addColorStop(1,'#101e28');rect(c,x,y,w,h,g,r);path(c,[x+1,y+.7,x+w-1,y+.7],STEEL.edge,.7);path(c,[x+1,y+h-1,x+w-1,y+h-1],'#07131d',1)}
function bolt(c:Ctx,x:number,y:number,r=1.1){ellipse(c,x+.4,y+.6,r+.4,r+.4,'#0a1720');ellipse(c,x,y,r,r,STEEL.bolt);path(c,[x-r*.45,y,x+r*.45,y],'#384a53',.5)}
/** Stable surface wear uses world coordinates, never per-frame randomness. */
export function drawEquipmentFinish(c:Ctx,x:number,y:number,w:number,h:number,seed=0){
  if(w<8||h<6)return
  for(let i=0;i<4;i++){const dx=x+3+((i*19+seed*7)%Math.max(1,w-7)),dy=y+2+((i*11+seed*3)%Math.max(1,h-5));path(c,[dx,dy,Math.min(x+w-2,dx+2+i%3),dy-.5],'#d9ddd22e',.65)}
  for(const dx of [x+3,x+w-4])for(const dy of [y+3,y+h-4])bolt(c,dx,dy,.75)
}
function hazardStripe(c:Ctx,x:number,y:number,w:number,h:number){
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();rect(c,x,y,w,h,'#b79963');for(let a=x-h;a<x+w+h;a+=10)poly(c,[a,y,a+4,y,a+4-h,y+h,a-h,y+h],'#25313a');path(c,[x,y,x+w,y],'#e8d0a1',.6);c.restore()
}
export function drawIndustrialDeck(c:Ctx,x:number,y:number,w:number,h:number,camera:number,width:number,accent:string,floating=false,surface:Level['dungeon']['surface']='dock'){
  const left=Math.max(x,camera-4),right=Math.min(x+w,camera+width+4);if(right<=left||h<=0)return
  c.save();c.beginPath();c.rect(left,y,right-left,Math.max(h,floating?32:480-y));c.clip()
  const depth=floating?Math.max(12,h):Math.min(h,58)
  // Machined tread, separate front web and two projecting flange edges.
  finish(c,left,y,right-left,depth,floating?'#7c9196':'#82969a','#223542')
  rect(c,left,y,right-left,1.5,'#c3c9ba');rect(c,left,y+2,right-left,3,'#4a626b');rect(c,left,y+5,right-left,1,'#0b202c')
  finish(c,left,y+depth-4,right-left,4,'#5f7880','#223743');path(c,[left,y+depth-4,right,y+depth-4],'#a2b0ab',.6)
  for(let a=Math.floor(left/72)*72;a<right;a+=72){
    path(c,[a,y+6,a,y+depth-5],'#111f29',1.5);path(c,[a+1.5,y+7,a+1.5,y+depth-6],'#79909250',.7)
    for(const dx of [5,64])if(a+dx>left+2&&a+dx<right-2)bolt(c,a+dx,y+9,.85)
    if(depth>24){finish(c,a+10,y+17,50,depth-25,'#4c646e','#1c2d39');for(let j=0;j<4;j++)path(c,[a+16+j*9,y+22,a+20+j*9,y+22],'#11212c',1.5);drawEquipmentFinish(c,a+11,y+17,48,depth-25,a/72)}
    path(c,[a+17,y+2,a+23,y+2,a+25,y+1],'#e6dfc17c',.8)
    if(floating){path(c,[a+15,y+8,a+47,y+8],accent+'40',.7);path(c,[a+20,y+depth-7,a+43,y+depth-7],'#81989b50',.7)}
  }
  if(floating){
    for(const end of [x+5,x+w-17]){finish(c,end,y+depth,12,10,'#627980','#20333e');bolt(c,end+6,y+depth+4,1);path(c,[end+1,y+depth+10,end+11,y+depth+10],'#0b1924',2)}
  }else if(surface==='viaduct'||surface==='dock'){
    const trussY=y+27,bottom=Math.min(478,y+76),pitch=112
    rect(c,left,y+depth,right-left,Math.max(0,480-y-depth),'#0b1b28')
    for(let a=Math.floor(left/pitch)*pitch;a<right;a+=pitch){
      // Thick boxed diagonals meet bolted gussets, rather than one zig-zag line.
      const points=[a,trussY,a+pitch*.5,bottom,a+pitch,trussY]
      path(c,points,'#09141d',8);path(c,points,'#425968',5);path(c,[a+1,trussY,a+pitch*.5,bottom-2,a+pitch-1,trussY],'#78909675',1)
      for(const px of [a,a+pitch*.5]){finish(c,px-5,(px===a?trussY:bottom)-4,10,9,'#71858b','#293f4c');bolt(c,px,(px===a?trussY:bottom),.9)}
      if(Math.floor(a/pitch)%2===0){finish(c,a-7,bottom,14,130,'#5a727e','#233743');path(c,[a-4,bottom+6,a-4,480],'#91a3a43b',1.5)}
    }
    finish(c,left,bottom-2,right-left,5,'#617783','#243945')
  }else if(surface==='roof'||surface==='fortress'){
    rect(c,left,y+depth,right-left,Math.max(0,480-y-depth),surface==='roof'?'#1b2936':'#26363d')
    for(let a=Math.floor(left/64)*64;a<right;a+=64){path(c,[a,y+depth,a,480],'#091c27',2);path(c,[a+2,y+depth,a+2,480],'#7c89883b',.7);if(surface==='roof'){finish(c,a+10,y+depth+12,38,24,'#435a66','#192d3c');rect(c,a+14,y+depth+16,12,14,accent+'26')}else drawEquipmentFinish(c,a+4,y+depth+4,54,35,a/64)}
  }else{
    rect(c,left,y+depth,right-left,Math.max(0,480-y-depth),'#102632')
    for(let a=Math.floor(left/96)*96;a<right;a+=96){finish(c,a+9,y+depth+7,68,27,'#526b76','#203441');for(let j=0;j<6;j++){rect(c,a+16+j*9,y+depth+12,4,16,'#0e202c');rect(c,a+17+j*9,y+depth+14,1,9,accent+'48')}drawEquipmentFinish(c,a+9,y+depth+7,68,27,a/96)}
  }
  if(!floating)for(let a=Math.ceil(left/260)*260;a<right-28;a+=260)hazardStripe(c,a,y+7,27,4)
  // Exposed cut ends have a dark web recess and replaceable steel cap.
  for(const edge of [x,x+w-5])if(edge>=left&&edge<=right){finish(c,edge,y+2,5,depth-2,'#89999b','#283b46');bolt(c,edge+2.5,y+10,.8)}
  c.restore()
}
export function drawSupplyCase(c:Ctx,p:Pickup,time:number,reduced=false){
  const x=p.x,y=p.y+(reduced?0:Math.sin(time*2+p.id)*1.3),med=p.type==='med',armor=p.type==='armor',color=med?'#c2c4af':armor?'#7d9398':'#7d8668'
  c.save();ellipse(c,x,y+18,15,2.3,'#07172460')
  // Side face, lid, rubber corner guards and a recessed handle establish volume.
  finish(c,x-15,y-10,30,25,color,'#2d4045',3);poly(c,[x+15,y-8,x+18,y-11,x+18,y+11,x+15,y+15],'#182c36')
  poly(c,[x-14,y-10,x-10,y-13,x+17,y-13,x+14,y-10],'#b1b8a0');rect(c,x-7,y-16,14,5,'#1b2c34',1);path(c,[x-6,y-13,x-6,y-16,x+6,y-16,x+6,y-13],'#a4afa4',1.4)
  rect(c,x-13,y-5,26,17,'#213641',2);path(c,[x-12,y-5,x+12,y-5],'#90a09b',.65)
  for(const dx of [-14,10]){rect(c,x+dx,y-9,4,24,'#182c35',1);rect(c,x+dx+.5,y-8,1,5,'#8c9f9f');rect(c,x+dx+.5,y+10,3,3,'#536b72')}
  for(const dx of [-8,6]){finish(c,x+dx,y-12,3,6,'#b5b7a2','#4e6269');bolt(c,x+dx+1.5,y-9,.55)}
  if(med){rect(c,x-7,y-3,14,12,'#c8c9b3',1);rect(c,x-2,y-1,4,8,'#a35f55',.5);rect(c,x-4,y+1,8,4,'#a35f55',.5)}
  else if(armor){poly(c,[x-7,y-3,x+7,y-3,x+6,y+5,x,y+10,x-6,y+5],'#7e969a');path(c,[x-5,y-1,x+5,y-1],'#c6d0c6',1);path(c,[x,y-1,x,y+7],'#223f4b',1);rect(c,x-4,y+2,8,2,'#96cdbb',.5)}
  else{for(const dx of [-5,2]){finish(c,x+dx,y-1,4,9,'#a3a27c','#536247',1);rect(c,x+dx+1,y-4,2,4,'#c7bb8d');path(c,[x+dx+3,y-3,x+dx+5,y-4,x+dx+5,y-1],'#9ea990',.7)}}
  drawEquipmentFinish(c,x-13,y-8,26,22,p.id);rect(c,x-10,y+10,4,1.2,'#d6cc9c');rect(c,x+5,y+10,4,1.2,'#a8c0b1')
  c.restore()
}
export function drawCheckpointStation(c:Ctx,x:number,floor:number,active:boolean){
  c.save();ellipse(c,x+36,floor,25,3,'#07131e70');finish(c,x+15,floor-5,43,5,'#71878a','#253e49',1)
  finish(c,x+20,floor-50,32,45,'#839493','#314c54',3);poly(c,[x+52,floor-46,x+56,floor-50,x+56,floor-8,x+52,floor-5],'#203741')
  finish(c,x+23,floor-47,26,19,'#4d6870','#142e3b',2);rect(c,x+26,floor-44,20,12,'#102c36',1)
  rect(c,x+27,floor-43,18,9,active?'#82bc9a':'#5a7b81',1);for(let i=0;i<3;i++)rect(c,x+29,floor-41+i*2,12-i*3,.6,'#e2e8cc90')
  for(let i=0;i<4;i++)path(c,[x+26,floor-23+i*3,x+43,floor-23+i*3],'#172e38',1.3)
  finish(c,x+44,floor-23,5,12,'#a1afa0','#425c61',1);rect(c,x+45,floor-21,3,3,active?'#96d3ab':'#b39b6d',.6)
  path(c,[x+21,floor-40,x+16,floor-40,x+16,floor-7,x+20,floor-7],'#172e39',2);drawEquipmentFinish(c,x+20,floor-50,32,45,1)
  c.restore()
}
export function drawIndustrialDrone(c:Ctx,e:Enemy,reduced=false){
  const age=reduced?0:e.age
  const cx=e.x+e.w/2,cy=e.y+e.h*.48,armed=e.windup>0,accent=e.role==='capacitor'?'#b7a0d7':e.role==='interceptor'?'#8bc6bf':'#d49b78'
  c.save();c.translate(cx,cy);c.rotate(Math.sin(age*1.8)*.035)
  // Back and front rotor planes, nacelles and articulated booms.
  for(const side of [-1,1]){
    const rx=side*23
    path(c,[side*5,-3,rx,-10],'#102633',5);path(c,[side*5,-4,rx,-11],'#76909c',2)
    finish(c,rx-4,-15,8,10,'#849ca3','#243e4f',2);ellipse(c,rx,-14,13.5,4.2,'#102632')
    c.strokeStyle='#8dabae';c.lineWidth=1;c.beginPath();c.ellipse(rx,-14,13.5,4.2,0,0,Math.PI*2);c.stroke()
    // Two blades rotate within a transparent swept rotor disc, not solid oval plates.
    const angle=age*57+side*.6;c.save();c.translate(rx,-14);c.scale(1,.3);c.rotate(angle)
    ellipse(c,0,0,12,12,'#c0d1cf10');poly(c,[-12,-1.1,-3,-2,10,.4,12,1.2,3,2,-10,-.4],'#b5c4bd9c');c.rotate(Math.PI/2);path(c,[-11,0,11,0],'#9fb7b463',1);c.restore();ellipse(c,rx,-14,2.4,1.5,'#d0cbbc')
    path(c,[side*8,7,side*14,13,side*20,13],'#162c39',2.6);path(c,[side*8,7,side*14,12,side*20,12],'#728c93',.8)
  }
  const body=c.createLinearGradient(0,-10,0,11);body.addColorStop(0,'#9bafb1');body.addColorStop(.3,'#536f7c');body.addColorStop(1,'#1a3345')
  poly(c,[-14,-5,-8,-11,9,-10,15,-3,12,7,5,11,-9,8,-15,2],body)
  poly(c,[-9,-9,8,-8,11,-3,-11,-3],'#6c8790');path(c,[-9,-10,8,-9,13,-4],'#cfcec073',.9)
  for(const side of [-1,1]){finish(c,side<0?-13:7,-2,6,8,'#617c85','#213a4c');for(let i=0;i<3;i++)path(c,[side<0?-12:8,i*2,side<0?-9:11,i*2],'#102636',.8)}
  finish(c,-6,7,12,6,'#708690','#263f50',2);ellipse(c,0,4,6.4,6.4,'#102836');ellipse(c,0,4,4.5,4.5,'#537983');ellipse(c,0,4,2.9,2.9,armed?'#ffd4a2':accent);ellipse(c,-1,2.7,1.2,.8,'#f1ecd8')
  // Underslung cannon pivots toward the actual shot direction.
  c.save();c.translate(0,10);c.rotate(e.aim-Math.sin(age*1.8)*.035);finish(c,-2,-2.5,14,5,'#8399a1','#263e4c',1);rect(c,10,-3,4,6,'#152b38',.5);path(c,[1,-2,9,-2],'#b6c1b4',.7);if((e.shotFlash??0)>.07)paintMuzzleFlash(c,14,'beam',e.age*35);c.restore()
  for(const side of [-1,1]){ellipse(c,side*11,-5,1.1,1.1,side<0?'#b89172':'#94b9a4');bolt(c,side*9,5,.65)}
  drawEquipmentFinish(c,-10,-8,20,15,e.id)
  c.restore()
}
export function drawFieldCrate(c:Ctx,x:number,y:number,w:number,h:number){
  c.save();finish(c,x,y,w,h,'#677e87','#263c4b',3);poly(c,[x+w,y+4,x+w+5,y,x+w+5,y+h-5,x+w,y+h],'#172e3e');poly(c,[x,y,x+5,y-4,x+w+5,y-4,x+w,y],'#788b90')
  for(const dx of [6,w-12]){finish(c,x+dx,y+1,6,h-2,'#748a90','#263e4b');bolt(c,x+dx+3,y+6,1);bolt(c,x+dx+3,y+h-6,1)}
  finish(c,x+w*.34,y-3,w*.32,7,'#9aa59c','#405865',1);rect(c,x+w*.4,y-2,w*.2,3,'#1a303c',1)
  rect(c,x+17,y+8,w-34,Math.max(4,h-16),'#283e4c',1);path(c,[x+21,y+11,x+w-21,y+11],'#82959b5c',.8);hazardStripe(c,x+w*.4,y+h-9,w*.2,3);drawEquipmentFinish(c,x+2,y+2,w-4,h-4,Math.floor(x/440));c.restore()
}
export function drawIndustrialTank(c:Ctx,e:Enemy,reduced=false){
  const travel=e.parts?.tracks===0?0:wheelPhase(e.vehicleMotion,reduced),recoil=reduced?0:Math.min(1,(e.shotFlash??0)/.12)
  drawVehicleWake(c,e.vehicleMotion,e.x,e.y+78,116,e.age,false,reduced)
  c.save();c.translate(e.x,e.y)
  ellipse(c,58,78,60,3,'#07141d80')
  finish(c,-3,49,121,28,'#53616a','#15232d',12);rect(c,7,52,103,21,'#10212c',8)
  for(let i=0;i<6;i++){
    const x=9+i*19;ellipse(c,x,64,8.4,8.4,'#192a35');ellipse(c,x,64,6.6,6.6,'#596d73');ellipse(c,x,64,4.7,4.7,'#253b48');ellipse(c,x,64,1.7,1.7,'#91a19d')
    for(let j=0;j<3;j++){const a=j*Math.PI*2/3+travel;bolt(c,x+Math.sin(a)*4,64+Math.cos(a)*4,.5)}
  }
  c.save();c.beginPath();c.roundRect(-3,49,121,28,12);c.clip();const offset=((travel*8)%7+7)%7;for(let x=-6;x<123;x+=7){finish(c,x+offset,49,5.8,4,'#8a9795','#3e5259');path(c,[x+7-offset,76,x+12.5-offset,76],'#93a29a',1.6)}c.restore()
  // Suspension arms and edge teeth give the belt a connected mechanical structure.
  for(let i=0;i<5;i++){const x=14+i*19;path(c,[x,55,x+7,62],'#9aa69c',1.2);ellipse(c,x,55,1.7,1.7,'#344b54')}
  for(const x of[9,104]){c.save();c.translate(x,63);c.rotate(travel);for(let i=0;i<8;i++){c.rotate(Math.PI/4);rect(c,5.5,-.7,1.8,1.4,'#81938e',.3)}c.restore()}
  const response=hullResponse(e.vehicleMotion,e.shotFlash??0,reduced);c.save();c.translate(59,30+response.settle);c.rotate(response.pitch);c.translate(-59,-30)
  const hull=c.createLinearGradient(0,26,0,57);hull.addColorStop(0,'#9aaba4');hull.addColorStop(.3,'#657c7f');hull.addColorStop(1,'#2b4452')
  poly(c,[-2,47,12,27,97,27,115,47,105,57,7,57],hull);poly(c,[12,27,97,27,107,34,7,34],'#879995');path(c,[12,27,97,27,112,45],'#c0c5b68a',1)
  for(let i=0;i<5;i++){finish(c,10+i*19,39,17,17,'#6c8385','#324a57');bolt(c,13+i*19,42,.8);path(c,[13+i*19,52,22+i*19,52],'#a0ada25c',.6)}
  path(c,[5,35,0,45,6,47],'#293f49',2);path(c,[107,35,117,47,108,49],'#293f49',2)
  finish(c,32,27,53,8,'#6b7d7c','#253c47',2)
  const turret=c.createLinearGradient(0,7,0,32);turret.addColorStop(0,'#b2b9ac');turret.addColorStop(.3,'#7b918e');turret.addColorStop(1,'#354e5c')
  poly(c,[23,27,27,12,38,7,83,8,93,16,90,31,30,32],turret);poly(c,[27,12,38,7,83,8,87,13],'#a1aea2');path(c,[38,8,81,9,89,15],'#d6d5bd8c',.9)
  finish(c,44,3,22,5,'#91a296','#405862',2);ellipse(c,55,5,6,1.5,'#b6b99d');finish(c,76,13,10,12,'#58717a','#203945',2);rect(c,78,15,6,4,'#be8d72',.5)
  for(let i=0;i<4;i++)path(c,[32+i*5,20,35+i*5,20],'#233c48',1.4)
  path(c,[69,10,69,-2,71,-5],'#819a9d',1);drawEquipmentFinish(c,28,12,61,18,e.id)
  // Tow eyes, spare links, segmented side skirt, hatch and engine louvres.
  for(const x of[6,104]){ellipse(c,x,46,3.5,2.2,'#132b35');path(c,[x-2,45,x+2,45],'#9aa99b',1)}
  for(let i=0;i<3;i++){finish(c,7+i*7,31,5,5,'#8a998f','#3b5054');bolt(c,9.5+i*7,33.5,.5)}
  for(let i=0;i<5;i++)path(c,[78+i*4,32,76+i*4,36],'#233b44',1)
  path(c,[46,4,46,0,61,0,61,4],'#c0c3a9',.8);rect(c,48,9,16,2,'#293e44',.5)
  for(const x of[31,57,82])path(c,[x,39,x,55],'#b1b9a36b',.6)
  c.restore() // The cannon keeps its exact, shared gameplay pivot.
  if(!e.parts||e.parts.gun>0){
  c.save();c.translate(59,30);c.rotate(e.aim);c.translate(-recoil*4,0)
  finish(c,-5,-6,20,12,'#93a4a1','#2f4957',3);ellipse(c,0,0,5.5,5.5,'#314a55');ellipse(c,0,0,2.6,2.6,'#a1afa3')
  finish(c,12,-3.8,34,7.6,'#a3b1ad','#3a5664',1);for(const x of [17,30]){finish(c,x,-5,3,10,'#7f9698','#2a434f',1)}
  finish(c,44,-5,9,10,'#718d96','#213c4a',1);rect(c,51,-3,3,6,'#0b222f');path(c,[14,-3,43,-3],'#d4d7be8a',.7);if((e.shotFlash??0)>.07){c.save();c.scale(1.6,1.6);paintMuzzleFlash(c,54/1.6,'spread',e.age*35);c.restore()}
  c.restore()
  }else{poly(c,[30,25,24,20,31,16,36,22,42,27],'#283f49');path(c,[27,20,32,16,37,23],'#9aa69a',1)}
  if(e.parts?.tracks===0){poly(c,[30,70,45,68,50,73,60,68,73,71,73,77,56,75,48,79,32,76],'#142832');path(c,[30,77,37,83,45,78,51,84],'#8d9790',2)}
  if(e.parts&&e.parts.tracks===0&&e.parts.gun===0){finish(c,83,35,22,15,'#ad8059','#5c493f',1);for(let i=0;i<3;i++)rect(c,85,38+i*4,18,2,'#f0bb76')}
  c.restore();drawVehicleDamage(c,{...e,w:116,h:78},reduced)
}
export function drawIndustrialTurret(c:Ctx,e:Enemy){
  c.save();c.translate(e.x,e.y);finish(c,-1,34,41,5,'#617b83','#233d49',1)
  poly(c,[4,34,11,19,28,19,35,34],'#314c59');path(c,[8,32,13,21,26,21,31,32],'#8a9f9b',1);finish(c,15,20,9,13,'#758c8e','#2b4551');bolt(c,19.5,24,1.3)
  c.save();c.translate(19,13);c.rotate(e.aim);finish(c,-14,-10,27,18,'#91a49f','#344e5c',3);poly(c,[-14,-10,-7,-13,10,-12,13,-10],'#9da99b')
  finish(c,11,-4,23,8,'#7e959b','#2b4554');for(let i=0;i<3;i++)rect(c,16+i*5,-2,2,4,'#102b38',.4);finish(c,32,-5,4,10,'#9aaba7','#2b4553',1)
  for(let i=0;i<3;i++)path(c,[-10,-4+i*3,4,-4+i*3],'#1c3541',1);rect(c,4,-7,5,3,'#c69c7e',.5);drawEquipmentFinish(c,-13,-9,26,17,e.id);if((e.shotFlash??0)>.07)paintMuzzleFlash(c,36,'spread',e.age*35);c.restore();c.restore()
}
