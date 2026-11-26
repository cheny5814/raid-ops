import type { Level, Rect, Run } from './front.ts'
import { surfaceY, ziplinePoint } from './front-route-features.ts'
import { rect, line, polygon, disc, metal } from './front-art'
import { frontFont } from './front-font'
type C=CanvasRenderingContext2D
export function drawIncline(c:C,p:Rect,camera:number,width:number,desert:boolean){
 const x=Math.max(camera-10,p.x),end=Math.min(camera+width+10,p.x+p.w),y=surfaceY(p,x),ey=surfaceY(p,end),bottom=p.y+p.h
 const g=c.createLinearGradient(0,Math.min(y,ey),0,bottom);g.addColorStop(0,desert?'#bd915e':'#5b7276');g.addColorStop(.15,desert?'#8d6245':'#334e5d');g.addColorStop(1,desert?'#583e32':'#182e40')
 polygon(c,[x,y,end,ey,end,bottom,x,bottom],g as unknown as string)
 polygon(c,[x,y,end,ey,end,ey+5,x,y+5],desert?'#dfb57c':'#97aaa3')
 line(c,[x,y+6,end,ey+6],desert?'#f3d29c66':'#293e4e',1)
 for(let xx=Math.ceil(x/32)*32;xx<end;xx+=32){const top=surfaceY(p,xx);if(desert){line(c,[xx,top+16,Math.min(xx+22,end),top+20],'#deb47b50');line(c,[xx+4,top+28,xx+14,top+35,xx+12,top+46],'#573d3444')}else{line(c,[xx,top+7,xx+8,top+29,xx+8,Math.min(bottom,top+90)],'#1a3344',2);disc(c,xx+5,top+10,1.1,'#a4b4aa');line(c,[xx+11,top+13,Math.min(xx+26,end),surfaceY(p,Math.min(xx+26,end))+13],'#78918f',.7)}}
}
export function drawZiplines(c:C,l:Level,r:Run,camera:number,width:number,language='zh'){
 for(const z of l.ziplines??[]){if(z.endX<camera-40||z.x>camera+width+40)continue
  for(const [x,y]of [[z.x,z.y],[z.endX,z.endY]]){const floor=l.ground.find(p=>x>=p.x&&x<p.x+p.w);const bottom=floor?surfaceY(floor,x):y+65;metal(c,x-4,y-10,8,bottom-y+10,'#9daea5','#3a5360',1);line(c,[x-18,bottom,x,bottom-32,x+18,bottom],'#526b73',3);metal(c,x-12,bottom-3,24,4,'#b3b6a0','#3f535b');disc(c,x,y,6,'#263e4b');disc(c,x,y,3,'#bdc3af')}
  // Tensioned cable follows the same slight sag as the trolley physics.
  const g=c.createLinearGradient(0,z.y-2,0,z.y+3);g.addColorStop(0,'#d0d8cb');g.addColorStop(.5,'#6d8791');g.addColorStop(1,'#314c5b')
  for(const [offset,color,w]of [[1,'#102735',3],[0,g,1.8]] as const){c.beginPath();for(let i=0;i<=40;i++){const p=ziplinePoint(z,i/40);if(!i)c.moveTo(p.x,p.y+offset);else c.lineTo(p.x,p.y+offset)}c.strokeStyle=color;c.lineWidth=w;c.stroke()}
  const active=r.zipline?.id===z.id,p=ziplinePoint(z,active?r.zipline!.t:.025)
  metal(c,p.x-10,p.y-6,20,7,'#bdc8ba','#4b646c',2)
  for(const dx of [-5,5]){disc(c,p.x+dx,p.y,3.2,'#263f4c');disc(c,p.x+dx,p.y,1.6,'#b5c4b9')}
  line(c,[p.x,p.y+3,p.x,p.y+18],'#a4b2aa',2);metal(c,p.x-10,p.y+18,20,4,'#9cae9e','#304b57',1)
  c.font=frontFont(10,language);c.textAlign='left';c.fillStyle=l.biome==='desert'?'#f1dfb4':'#d3dfd1';c.fillText(language==='en'?"Cliff zipline · E":'跨崖滑索 · E',z.x+14,z.y-15)
 }
}
