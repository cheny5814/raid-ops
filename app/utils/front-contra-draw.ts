import type { Level,Run,Enemy } from './front'
import { activeClimb, collapseFront, crossfireOpen, tankStage, tankTarget } from './front-contra'
import { rect,line,polygon,disc,metal,glow } from './front-art'
import { drawHealthBar } from './front-feedback'
import { frontFont } from './front-font'
type Ctx=CanvasRenderingContext2D
export function drawContraWorld(c:Ctx,l:Level,r:Run,camera:number,width:number,language:'en'|'zh'='zh',reduced=false){
 const en=language==='en'
 for(const p of l.setPieces??[]){if(p.kind==='escape')continue;if(p.end<camera||p.x>camera+width)continue;const s=r.arcade.find(s=>s.id===p.id);if(!s)continue;c.save()
  if(p.kind==='climb'){
   rect(c,p.x+12,p.roof-100,330,p.floor-p.roof+100,'#142d3a')
   for(const x of [p.x+6,p.x+335]){metal(c,x,p.roof-100,10,p.floor-p.roof+100,'#627e88','#243f51',1);for(let y=p.roof-80;y<p.floor;y+=55){rect(c,x+2,y,6,18,'#9fa99a');line(c,[x+2,y+4,x+8,y+4],'#2d4851',1)}}
   for(let y=p.roof-60;y<p.floor;y+=70){line(c,[p.x+22,y,p.x+322,y],'#4c677446',1);rect(c,p.x+308,y-4,6,3,'#88b8ad')}
   line(c,[p.x+320,p.roof-80,p.x+320,p.floor-20],'#6b8d9363',2)
   c.font=frontFont(10,language);c.fillStyle='#b7cbc4';c.textAlign='center';c.fillText(en?"Comms shaft":'通讯竖井',p.x+175,p.floor-15)
   const y=s.dangerY
   if(s.phase==='active'&&s.elapsed>2.5){const top=Math.max(p.roof,y);rect(c,p.x+18,top,310,Math.max(0,p.floor-top),'#67b5be18');for(let i=0;i<3;i++){const yy=top+i*5,points=[p.x+18,yy];for(let j=1;j<14;j++)points.push(p.x+18+j*22,yy+(reduced?j%2*3:Math.sin(r.time*35+j)*3));points.push(p.x+328,yy);line(c,points,i===0?'#bfebe3':'#6caaaf70',i===0?1.3:.7)}}
   if(s.phase==='return')line(c,[p.x+235,p.roof-20,r.x+13,r.y+8],'#c4ccc0',1.3)
   metal(c,p.x+180,p.roof-4,124,9,'#9eafa3','#3d5b65',1);c.fillStyle='#9ec9b5';c.fillText(en?"Auto zipline exit":'自动滑索出口',p.x+240,p.roof-18)
  }else if(p.kind==='chase'&&s.phase==='active'){
   const x=Math.max(p.x-40,r.x-260),y=p.floor-220;metal(c,x-21,y,42,14,'#8b9da7','#314d63',3);line(c,[x-34,y-4,x+34,y-4],'#9eaba6',2);disc(c,x,y+15,4,'#c89678');line(c,[x,y+18,r.x-65,r.y+12],'#d9ab7944',1);c.font=frontFont(9,language);c.fillStyle='#d5b18b';c.textAlign='center';c.fillText(en?"Tracking drone":'追踪无人机',x,y-14)
  }else if(s.phase!=='waiting'){
   const front=collapseFront(p,s,l)
   for(let i=0;i<8;i++){const x=front-18-i*23,y=p.floor+12+(reduced?i*7:(r.time*90+i*19)%125);c.save();c.translate(x,y);c.rotate(i*.5+r.time);metal(c,-7,-3,14,6,'#7c9397','#2e4854',.5);c.restore()}
   line(c,[front-10,p.floor-5,front+4,p.floor+6,front-4,p.floor+15],'#d6a779',2);glow(c,front-35,p.floor+45,65,'#96785b',.12)
  }
  c.restore()
 }
 const group=l.encounters.find(a=>Math.abs(r.x-a.x)<460&&a.enemies.some(id=>r.enemies.some(e=>e.id===id&&e.hp>0&&e.crossfire)))
 if(group){const labels={high:en?"High fire":'高位压制',rush:en?"Rusher":'突进兵',air:en?"Air strafe":'空中掠射',cover:en?"Cover gun":'掩护炮台'};for(const e of r.enemies)if(e.hp>0&&e.crossfire&&group.enemies.includes(e.id)&&crossfireOpen(e,r.time)){c.font=frontFont(7,language);c.fillStyle='#d8bc89';c.textAlign='center';c.fillText(labels[e.crossfire],e.x+e.w/2,e.y-36)}}
}
export function drawArcadeHud(c:Ctx,l:Level,r:Run,width:number,language:'en'|'zh'='zh'){
 const en=language==='en',s=r.arcade.find(s=>s.phase==='active'||s.phase==='return');if(!s)return;const p=l.setPieces?.find(p=>p.id===s.id);if(!p||p.kind==='escape')return
 const text=p.kind==='chase'?(en?"Rooftop pursuit · keep moving or duck the targeting beam":'屋顶追击 · 持续移动或蹲下躲避锁定射线'):p.kind==='climb'?(s.phase==='return'?(en?"Zipline transfer · automatic landing":'滑索转移中 · 自动落岸'):(en?"Climb the shaft · aim up · arc rising":'沿跳台向上突围 · 上瞄清敌 · 电弧正在上升')):(s.elapsed<2.5?(en?"Bridge failure · keep moving":'桥梁即将坍塌 · 持续向前'):(en?"Deck collapsing behind you · do not stop":'身后桥面正在坍塌 · 不要停留'))
 c.save();c.font=frontFont(9,language);c.textAlign='center';const w=Math.min(width-20,c.measureText(text).width+24);rect(c,width/2-w/2,76,w,22,'#0c2234e8',3);c.fillStyle=p.kind==='climb'?'#a8d4cf':'#e8bb86';c.fillText(text,width/2,90);c.restore()
}
export function drawTankComponents(c:Ctx,e:Enemy,language:'en'|'zh'='zh'){
 if(!e.boss||e.zone!==0)return
 const stage=tankStage(e),target=tankTarget(e),en=language==='en',parts=e.parts??{tracks:e.maxHp*.28,gun:e.maxHp*.3,engine:e.maxHp*.42}
 c.save();for(const [i,k]of(['tracks','gun','engine'] as const).entries()){const x=e.x+e.w/2-77+i*53,max=e.maxHp*[.28,.3,.42][i]!;drawHealthBar(c,x,e.y-43,48,parts[k],max,k===stage?'#eac185':'#719991');c.font=frontFont(7,language);c.textAlign='center';c.fillStyle=parts[k]>0?'#c4d4cc':'#657f83';c.fillText(en?["Tracks","Side gun","Engine"][i]!:['履带','副炮','引擎'][i]!,x+24,e.y-50)}
 glow(c,target.x,target.y,13,'#ebbc7e',.2);c.strokeStyle='#d9bd85';c.lineWidth=.8;c.strokeRect(target.x-10,target.y-7,20,14);c.restore()
}
