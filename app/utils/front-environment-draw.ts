import type {Interactive} from './front-interactions.ts'
import type {Level,Run} from './front.ts'
import {environmentArea,environmentalKind,ENVIRONMENT_TEXT,coolingOff} from './front-environment.ts'
import{rect,line,disc,metal,polygon}from'./front-art.ts'
import{frontFont}from'./front-font.ts'
export function drawEnvironmentInteraction(c:CanvasRenderingContext2D,p:Interactive,l:Level,r:Run,camera:number,width:number,language:'zh'|'en'='zh',reduced=false){
 if(!environmentalKind(p.kind))return
 const dead=p.hp<=0,area=environmentArea(p),near=Math.abs(r.x-p.x)<230,t=reduced?0:r.time,text=ENVIRONMENT_TEXT[p.kind][language]
 c.save()
 if(p.kind==='steam'&&dead&&!p.triggered&&p.timer>0){
  for(let i=0;i<(reduced?4:8);i++){const phase=reduced?i/8:((t*.65+i*.137)%1),x=area.x+phase*area.w,y=area.y+area.h*.7-phase*34,g=c.createRadialGradient(x,y,0,x,y,16+phase*17);g.addColorStop(0,'#b9c6bf55');g.addColorStop(1,'#b9c6bf00');c.fillStyle=g;c.beginPath();c.ellipse(x,y,19+phase*21,25+phase*14,0,0,Math.PI*2);c.fill()}
  line(c,[area.x,area.y+area.h-1,area.x+area.w,area.y+area.h-1],'#c1d0bb45',1)
 }
 if(p.kind==='fuel'&&dead&&p.timer>0){
  const warning=p.timer>=5.2;rect(c,area.x,area.y+area.h-4,area.w,4,warning?'#d9b575':'#443c2e',1)
  for(let x=area.x+4;x<area.x+area.w-4;x+=13){if(warning)line(c,[x,area.y+area.h-9,x+5,area.y+area.h-2],'#d3b780',1)
   else{const h=reduced?13:10+(1+Math.sin(t*11+x))*5;const g=c.createLinearGradient(x,area.y+area.h-h,x,area.y+area.h);g.addColorStop(0,'#e1872b00');g.addColorStop(.4,'#d9661f');g.addColorStop(1,'#ffe7a5');c.fillStyle=g;c.beginPath();c.moveTo(x-4,area.y+area.h);c.quadraticCurveTo(x-5,area.y+area.h-h*.5,x+1,area.y+area.h-h);c.quadraticCurveTo(x-1,area.y+area.h-h*.25,x+3,area.y+area.h-h*.55);c.quadraticCurveTo(x+7,area.y+area.h-h*.2,x+6,area.y+area.h);c.closePath();c.fill()}
  }
 }
 c.translate(p.x,p.y)
 if(p.kind==='radar'){
  metal(c,0,32,28,28,'#8f9c89','#344a49',2);for(let i=0;i<4;i++)line(c,[5,39+i*4,23,39+i*4],'#182e34',1)
  metal(c,12,15,4,18,'#a4b19f','#405b57');c.save();c.translate(14,18);if(!dead)c.rotate(reduced?0:Math.sin(t*.7)*.35)
  polygon(c,[-15,-13,-10,1,1,7,15,3,4,2,-5,-3],'#6b8579');line(c,[-15,-13,15,3],'#c0c5a1',1);line(c,[-2,1,10,-15,6,-2],'#a7b59c',1);disc(c,10,-15,2,dead?'#4c5950':'#c8b982');c.restore();disc(c,22,36,1.6,dead?'#4b5b52':'#b7c997')
 }else if(p.kind==='fuel'){
  metal(c,0,0,28,34,dead?'#666455':'#b19b70','#464b3c',5);for(const y of[5,26])metal(c,-1,y,30,3,'#9d9e80','#39483f',1);rect(c,8,10,13,11,dead?'#323e35':'#bfaa76',1);if(!dead)polygon(c,[14,12,19,19,9,19],'#694e32');disc(c,21,2,2,'#283d37')
 }else{
  metal(c,0,0,28,34,'#8ba69d','#2e4e55',2);for(const x of[4,24])line(c,[x,5,x,28],'#18373f',2)
  c.strokeStyle=dead&&p.kind!=='steam'?'#5d7067':'#c1ba91';c.lineWidth=1.8;c.beginPath();c.arc(14,14,8,0,Math.PI*2);c.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+(p.kind==='cooling'&&p.triggered?.6:0);line(c,[14,14,14+Math.cos(a)*7,14+Math.sin(a)*7],'#98b2a3',1.3)}disc(c,14,14,2,'#657e72')
  if(p.kind==='cooling'){rect(c,7,26,5,3,!dead&&!p.triggered?'#afd0ac':'#6a796b',.5);rect(c,17,26,5,3,!dead&&p.triggered?'#afd0ac':'#6a796b',.5)}
 }
 if(!dead){const maximum=p.kind==='radar'?6:p.kind==='fuel'?4:3;rect(c,0,p.h+4,p.w,2,'#1c333c',1);rect(c,0,p.h+4,p.w*p.hp/maximum,2,'#c0ab7b',1)}
 if(near){
  const title=p.kind==='radar'&&dead?(language==='zh'?'雷达已毁 · 局部空中支援停用':'Radar offline · local support disabled'):p.kind==='cooling'?(language==='zh'?(dead?'冷却旁路保护 · 双支路停用':p.timer>0?'泄压保护 · '+p.timer.toFixed(1)+' 秒':'安全支路 '+(p.triggered?'B':'A')):(dead?'Fail-safe · both branches off':p.timer>0?'Pressure relief · '+p.timer.toFixed(1)+'s':'Safe branch '+(p.triggered?'B':'A'))):p.kind==='steam'&&dead?(language==='zh'?(p.triggered||p.timer<=0?'蒸汽已关闭':'蒸汽遮蔽 · E 关阀'):(p.triggered||p.timer<=0?'Steam off':'Sight obscured · E close')):p.kind==='fuel'&&dead?(language==='zh'?(p.timer>=5.2?'燃烧预警 · 离开油迹':p.timer>0?'地面燃烧 · 跳过':'燃料已耗尽'):(p.timer>=5.2?'Ignition warning · clear spill':p.timer>0?'Ground burning · jump over':'Fuel exhausted')):text[0]
  c.font=frontFont(9,language);c.textAlign='center';const panel=Math.min(width-20,Math.max(c.measureText(text[1]).width,c.measureText(title).width)+16),cx=Math.max(camera+panel/2+10-p.x,Math.min(camera+width-panel/2-10-p.x,14));rect(c,cx-panel/2,-43,panel,32,'#0c2234ed',3);c.fillStyle='#dec18b';c.fillText(title,cx,-31);c.fillStyle='#c0d0c6';c.font=frontFont(8,language);c.fillText(text[1],cx,-17)
 }
 c.restore()
 if(p.kind==='cooling')for(const h of l.hazards.filter(h=>h.type==='surge'&&h.x>=p.x&&h.x<p.x+650&&Math.abs(h.y+h.h-p.y-p.h)<40)){c.save();c.font=frontFont(8,language);c.textAlign='center';const off=coolingOff(r,h);c.fillStyle=off?'#9dc8ae':'#dbb47e';c.fillText((h.x-p.x<300?'A':'B')+' · '+(language==='zh'?(off?'已停用':'通电区'):(off?'Off':'Live')),h.x+h.w/2,h.y-12);c.restore()}
}
