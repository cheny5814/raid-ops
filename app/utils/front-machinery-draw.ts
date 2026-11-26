import type { Hazard, Run } from './front'
import { rect,line,polygon,disc,metal,glow } from './front-art'
import { drawEquipmentFinish } from './front-materials'
import { frontFont } from './front-font'
type Ctx=CanvasRenderingContext2D
function stripes(c:Ctx,x:number,y:number,w:number,h:number){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();rect(c,x,y,w,h,'#b99c68');for(let a=x-h;a<x+w+h;a+=10)polygon(c,[a,y,a+4,y,a+4-h,y+h,a-h,y+h],'#263840');c.restore()}
function led(c:Ctx,x:number,y:number,color:string){disc(c,x,y,2.5,'#172d39');disc(c,x,y,1.4,color)}
export function drawIndustrialHazard(c:Ctx,h:Hazard,state:'safe'|'warning'|'active',run:Run,levelId:number,language:'en'|'zh'='zh',reduced=false){
  const {x,y,w}=h,floor=y+h.h,en=language==='en',active=state==='active',warning=state==='warning',color=active?'#e2a186':warning?'#d9bd83':'#92bdae',t=reduced?0:run.time,near=Math.abs(run.x-x-w/2)<300
  c.save()
  if(h.type==='crusher'){
    const top=y-46,bottom=active?floor:y+23,center=x+w/2
    // Recessed guide rails and a rear brace distinguish the hydraulic machine from a hanging block.
    c.save();c.globalAlpha*=.6;for(const px of [x-5,x+w+1]){metal(c,px,top+9,4,floor-top-12,'#718b94','#2c4555',1);for(let yy=top+19;yy<floor-7;yy+=24)rect(c,px+.8,yy,2,3,'#9aaca2')};c.restore()
    metal(c,x-10,top,w+20,15,'#8c9e9f','#304b5a',2);stripes(c,x-6,top+10,w+12,3);drawEquipmentFinish(c,x-8,top+1,w+16,11,2)
    metal(c,center-10,top+14,20,34,'#7e959b','#304e60',3);for(let i=0;i<4;i++)line(c,[center-7,top+20+i*5,center+7,top+20+i*5],'#203d4d',1.2)
    metal(c,center-4,top+39,8,Math.max(3,bottom-23-top-39),'#c4d1cc','#7d999e',1);line(c,[center-2,top+40,center-2,bottom-24],'#e0e1cc',.7)
    line(c,[x+7,top+12,x+7,top+35,center-11,top+42],'#172e3a',4);line(c,[x+7,top+12,x+7,top+35,center-11,top+42],'#718a8b',1)
    metal(c,x-2,bottom-24,w+4,23,'#a6b1a8','#445e66',3);polygon(c,[x+w+2,bottom-22,x+w+6,bottom-26,x+w+6,bottom-4,x+w+2,bottom-1],'#253f4d')
    metal(c,x+5,bottom-22,w-10,12,'#748c8e','#314b57',1);stripes(c,x+2,bottom-7,w-4,5);drawEquipmentFinish(c,x,bottom-23,w,21,1)
    for(const px of [x+9,x+w-9])led(c,px,bottom-14,color)
    metal(c,x-8,floor-4,w+16,5,'#849794','#314a54',1);stripes(c,x+3,floor-4,w-6,2)
    if(warning){c.setLineDash([3,4]);line(c,[x+1,bottom+2,x+1,floor-5,x+w-1,floor-5,x+w-1,bottom+2],'#ddbd7a80',1);c.setLineDash([])}
    if(active){glow(c,center,floor-3,w*.55,'#d7a479',.13);for(let i=0;i<4;i++){const dx=(i-1.5)*w*.24;line(c,[center+dx,floor-3,center+dx+(i%2?4:-4),floor-6],'#d7be8f',.7)}}
    c.font=frontFont(9,language);c.textAlign='center';c.fillStyle='#c2d0c9';c.fillText(en?"Hydraulic press":'液压冲压器',center,top-10)
    if(near){const cycle=4.4-levelId*.16,phase=(run.time+h.offset)%cycle,remain=state==='safe'?cycle-1.45-phase:warning?cycle-.9-phase:cycle-phase;c.fillStyle=color;c.font=frontFont(8,language);c.fillText(active?(en?"Press down · wait":'压头落下 · 等待'):warning?(en?`Dropping in ${Math.max(0,remain).toFixed(1)}s`:`即将下压 ${Math.max(0,remain).toFixed(1)} 秒`):(en?"Retracted · pass through":'已抬起 · 抓紧通过'),center,top-23)}
  }else{
    // Ground cable and metal emitter pylons remain visible when the electrical field is off.
    metal(c,x-7,floor-6,w+14,7,'#6c858e','#263f50',2);stripes(c,x+6,floor-5,w-12,3)
    for(const px of [x-5,x+w-2]){
      metal(c,px,y-4,8,h.h+1,'#839c9e','#294756',2);metal(c,px-2,floor-9,12,5,'#829590','#304b54',1)
      for(let i=0;i<3;i++){const yy=y+4+i*10;rect(c,px+1,yy,6,3,'#b1b9a3',.6);rect(c,px+2,yy+1,4,1,'#435f62');}
      led(c,px+4,y-1,color);drawEquipmentFinish(c,px,y-3,8,h.h,3)
    }
    if(state!=='safe')for(let i=0;i<3;i++){
      const yy=y+7+i*9,points=[x+3,yy]
      for(let j=1;j<8;j++)points.push(x+3+(w-6)*j/8,yy+(reduced?j%2?1:-1:Math.sin(t*35+j*2.5+i)*2.2))
      points.push(x+w-3,yy);line(c,points,active?'#78b9b7':'#bca57470',active?2:1);if(active)line(c,points,'#d1e7d3',.65)
    }
    c.font=frontFont(9,language);c.textAlign='center';c.fillStyle='#c2d0c9';c.fillText(en?"Pulse grid":'脉冲电网',x+w/2,y-24)
    if(near){c.font=frontFont(8,language);c.fillStyle=color;c.fillText(active?(en?"Live · jump over or cut power":'通电 · 跳过或击毁电箱'):warning?(en?"Charging · keep clear":'正在充能 · 保持距离'):(en?"Off · safe to cross":'已断开 · 可以通过'),x+w/2,y-37)}
  }
  c.restore()
}
export function drawSectorGate(c:Ctx,x:number,floor:number,remaining:number,pending:boolean,near:boolean,language:'en'|'zh'='zh'){
  const closed=remaining>0||pending,en=language==='en',top=235,color=closed?'#d6ad7b':'#9cc5ac'
  c.save();metal(c,x-11,floor-5,23,6,'#8b9b94','#2b4651',1)
  if(closed){
    metal(c,x-7,top,14,floor-top-5,'#7d9297','#2c4656',2);metal(c,x-10,top-5,20,11,'#8b9c95','#3a5560',2)
    for(let yy=top+12;yy<floor-9;yy+=18){metal(c,x-5,yy,10,15,'#617a80','#2b4553',1);line(c,[x-3,yy+3,x+3,yy+3],'#94a49c',.7)}
    stripes(c,x-6,top+43,12,6);stripes(c,x-6,floor-16,12,6);led(c,x,top+7,color)
    rect(c,x-5,top+24,10,12,'#172e3c',1);line(c,[x-2,top+29,x-2,top+26,x+2,top+26,x+2,top+29],'#c8b68b',1);rect(c,x-3,top+29,6,4,'#c8b68b',.5)
  }else{metal(c,x-8,floor-13,16,9,'#7c9490','#2c4b50',2);led(c,x,floor-9,color)}
  if(near){c.textAlign='center';c.fillStyle=color;c.font=frontFont(10,language);c.fillText(closed?(en?"Sector lock":'据点封锁闸'):(en?"Sector clear":'封锁解除'),x,closed?top-23:floor-32);if(closed){c.font=frontFont(8,language);c.fillText(remaining?(en?`Eliminate ${remaining} guards to open`:`击败 ${remaining} 名守军后放行`):(en?"Secure the objective to open":'完成剧情目标后放行'),x,top-10)}}
  c.restore()
}
