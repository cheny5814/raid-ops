import {vehicleGun} from './front-vehicle-gun'
import type { Run, Level, Enemy } from './front'
import { craneLanding, controlled } from './front-tactics'
import { rect, line, polygon, metal, disc } from './front-art'
import { drawEquipmentFinish, drawIndustrialTank, drawIndustrialTurret } from './front-materials'
import { drawHealthBar } from './front-feedback'
import { frontFont } from './front-font'
export function drawTactics(c:CanvasRenderingContext2D,run:Run,level:Level,camera:number,width:number,language:'en'|'zh'='zh',reduced=false){
 const en=language==='en'
 for(const p of run.tactics){
  if(Math.max(p.x,p.loadX)+p.w<camera-150||Math.min(p.x,p.loadX)>camera+width+150)continue
  const active=p.id===run.tacticalControl,near=Math.abs(run.x+13-p.x-(p.kind==='vehicle'?52:12))<80&&Math.abs(run.y+40-p.y-p.h)<30,accent=p.state==='locked'||p.state==='wreck'?'#d6a181':'#9bc7b2'
  let title='',hint='',cx=p.x+12,top=p.y-18
  c.save()
  if(p.kind==='crane'){
   const railY=p.y-225
   for(const x of [p.minX-9,p.maxX+p.w+9]){metal(c,x,railY,8,p.y+32-railY,'#7e9494','#2d4858',1);line(c,[x-8,p.y+31,x+17,p.y+31],'#a4a98e',3)}
   metal(c,p.minX-9,railY,p.maxX-p.minX+p.w+26,10,'#9baba4','#3b5763',1)
   if(p.state!=='settled'){
    metal(c,p.loadX+p.w/2-14,railY-4,28,17,'#859c9d','#2a4656',2)
    for(const dx of[-9,9]){const cx=p.loadX+p.w/2+dx,cy=railY+3,a=reduced?0:(p.loadX+p.loadY)*.13;disc(c,cx,cy,4,'#243d48');line(c,[cx-Math.cos(a)*3,cy-Math.sin(a)*3,cx+Math.cos(a)*3,cy+Math.sin(a)*3],'#b8c1a5',1)}
    for(const d of [-5,5])line(c,[p.loadX+p.w/2+d,railY+13,p.loadX+p.w/2+d,p.loadY],'#a2aaa2',1)
   }
   if(p.state!=='settled'){const landing=p.state==='falling'?p.landY:craneLanding(level,p);if(landing!==null&&landing!==undefined){rect(c,p.loadX,landing+31,p.w,2,'#c9b98288');for(const x of[p.loadX+3,p.loadX+p.w-3])line(c,[x,landing+23,x,landing+31],'#d3c296',1)}if(p.state==='operating'&&landing===null){c.font=frontFont(8,language);c.textAlign='center';c.fillStyle='#e1a488';c.fillText(en?'No supported landing · move load':'下方无支撑 · 先移动吊箱',p.loadX+p.w/2,p.loadY-14)}}
   metal(c,p.loadX,p.loadY,p.w,32,'#a09d7a','#485c50',2);polygon(c,[p.loadX,p.loadY,p.loadX+5,p.loadY-4,p.loadX+p.w+5,p.loadY-4,p.loadX+p.w,p.loadY],'#abb197')
   for(let x=7;x<p.w-3;x+=14){metal(c,p.loadX+x,p.loadY+3,3,25,'#9ca68c','#42594d',.5)}
   rect(c,p.loadX+8,p.loadY+22,p.w-16,5,'#bba873');for(let x=10;x<p.w-12;x+=12)line(c,[p.loadX+x,p.loadY+22,p.loadX+x+5,p.loadY+27],'#3a4b46',3)
   drawEquipmentFinish(c,p.loadX+1,p.loadY+1,p.w-2,30,p.id)
   metal(c,p.x,p.y,25,32,'#8fa5a0','#314f5a',2);rect(c,p.x+4,p.y+5,17,11,'#203e46',1);line(c,[p.x+7,p.y+11,p.x+11,p.y+8,p.x+17,p.y+11],'#b9d2a8',1)
   disc(c,p.x+18,p.y+23,2,active?'#edbe7c':'#9bc7b2');line(c,[p.x+6,p.y+26,p.x+6,p.y+20,p.x+9,p.y+18],'#b4bca5',1.4)
   title=en?"Cargo crane":'货运吊机';hint=p.state==='settled'?(en?"Cargo secured · jump on top":'货箱已落稳 · 可跳上通行'):p.state==='falling'?(en?"Load dropping · stand clear":'吊箱正在落下 · 保持距离'):active?(en?"A/D move load · E drop · Space exit":'A/D 移动吊箱 · E 投放 · 空格离开'):(en?"E operate · drop cargo to crush or bridge":'E 操作 · 落箱砸敌或搭桥')
  }else if(p.kind==='vehicle'){
   cx=p.x+52
   if(p.state==='wreck'){metal(c,p.x,p.y+35,104,23,'#626c68','#273c43',5);polygon(c,[p.x+10,p.y+35,p.x+36,p.y+23,p.x+78,p.y+34,p.x+88,p.y+39],'#334d55')}
   else{c.save();c.translate(p.x,p.y);c.scale(.88,.74);drawIndustrialTank(c,{x:0,y:0,id:p.id,w:116,h:78,hp:p.hp,maxHp:p.maxHp,age:reduced?0:run.time,aim:vehicleGun(p,p.cannonAim??(active&&run.facing<0?Math.PI:0)).localAngle,vehicleMotion:p.vehicleMotion?{...p.vehicleMotion,distance:p.vehicleMotion.distance/.88,speed:p.vehicleMotion.speed/.88}:undefined,shotFlash:p.cooldown>.79?.12:0} as Enemy,reduced);c.restore();rect(c,p.x+35,p.y+25,27,3,'#9ccdb5',.5);if(active){c.font=frontFont(8,language);c.textAlign='center';c.fillStyle='#c7dfc7';c.fillText(en?"Pilot":'驾驶中',cx,p.y-14)}}
   drawHealthBar(c,p.x,p.y-7,104,p.hp,p.maxHp,accent,3,{owner:p,time:run.time,reduced,armor:true})
   title=p.state==='wreck'?(en?"Armored car destroyed":'装甲车已损毁'):(en?"Armored assault vehicle":'突击装甲车')
   const crew=p.crew.filter(id=>(run.enemies.find(e=>e.id===id)?.hp??0)>0).length
   hint=p.state==='locked'?(en?`Eliminate ${crew} crew to board`:`击败 ${crew} 名守车兵后可驾驶`):p.state==='wreck'?'':active?(en?"A/D drive · J cannon · E/Space exit":'A/D 驾驶 · J 开炮 · E / 空格撤离'):(en?"E board · armored protection":'E 驾驶 · 装甲吸收伤害')
   top=p.y-30
  }else{
   metal(c,p.x,p.y,25,32,'#89a0a5','#2c4757',2);rect(c,p.x+4,p.y+4,17,14,'#1b3545',1)
   const target=run.enemies.find(e=>e.id===p.target),ready=p.state==='allied'
   line(c,[p.x+6,p.y+11,p.x+10,p.y+7,p.x+18,p.y+14],ready?'#96d3b5':'#b7b8d0',1)
   if(active){const scan=reduced?6:(p.progress*8)%13;line(c,[p.x+5,p.y+5+scan,p.x+20,p.y+5+scan],'#a5d5b7',1)}
   line(c,[p.x+25,p.y+29,p.loadX+19,p.y+29,p.loadX+19,p.loadY+33],'#7f9a8e70',1.2)
   if(ready||p.state==='spent'){
    drawIndustrialTurret(c,{...target,x:p.loadX,y:p.loadY,id:p.id,aim:p.progress,age:reduced?0:run.time,shotFlash:ready&&p.cooldown>.13?.12:0} as Enemy)
    rect(c,p.loadX+2,p.loadY-6,35,4,ready?'#8fc9ae':'#657a79',1);drawHealthBar(c,p.loadX,p.loadY-12,40,p.hp,p.maxHp,'#8fc9ae',3,{owner:p,time:run.time,reduced,armor:true})
   }
   title=en?"Sentry override":'炮台反控终端'
   hint=ready?(en?`Allied fire support · ${Math.ceil(p.life)}s`:`友军火力支援 · 剩余 ${Math.ceil(p.life)} 秒`):p.state==='spent'||!target||target.hp<=0?(en?"Terminal offline":'终端已离线'):active?(en?"Hacking · taking damage interrupts":'正在破解 · 受击会中断'):(en?"E hack · hold position for 2.5s":'E 破解 · 原地坚持 2.5 秒')
   if(active){rect(c,p.x,p.y-8,25,3,'#203d4b',1);rect(c,p.x,p.y-8,25*Math.min(1,p.progress/2.5),3,'#b4c8dc',1)}
  }
  if(near||active){c.font=frontFont(9,language);c.textAlign='center';const pw=Math.max(c.measureText(title).width,c.measureText(hint).width)+18,bx=Math.max(camera+pw/2+6,Math.min(camera+width-pw/2-6,cx));rect(c,bx-pw/2,top-26,pw,32,'#0b2233ee',3);c.fillStyle=accent;c.fillText(title,bx,top-14);c.font=frontFont(8,language);c.fillStyle='#d2dfce';c.fillText(hint,bx,top-2)}
  c.restore()
 }
}
export function pilotingVehicle(run:Run){return controlled(run)?.kind==='vehicle'}
