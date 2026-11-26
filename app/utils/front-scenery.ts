import type {Level,Run,Barrier} from './front.ts'
import {poweredDown} from './front-interactions.ts'
type C=CanvasRenderingContext2D
export const SCENERY_ASSETS={
 harbor:'/iron-front/scenery/harbor-night-v1.png',desert:'/iron-front/scenery/desert-border-v1.png',
 forge:'/iron-front/scenery/forge-foundry-v1.png',skyway:'/iron-front/scenery/skyway-bridges-v1.png',
 outpost:'/iron-front/scenery/outpost-fortress-v1.png',city:'/iron-front/scenery/city-ruins-v1.png',reactor:'/iron-front/scenery/reactor-hall-v1.png'
}as const
type Scene=keyof typeof SCENERY_ASSETS
const districts:Scene[]=['harbor','forge','skyway','outpost','city','reactor']
export function sceneryForLevel(level:Pick<Level,'id'|'biome'>):Scene{return level.biome==='desert'?'desert':districts[level.id]??'harbor'}
const grades:Record<Scene,{base:string,tint:string}>={
 harbor:{base:'#163145',tint:'#0b26384d'},desert:{base:'#aab4b3',tint:'#d0ad8115'},
 forge:{base:'#292733',tint:'#171f2b40'},skyway:{base:'#203449',tint:'#12283e38'},
 outpost:{base:'#34413f',tint:'#20352e30'},city:{base:'#2c2e45',tint:'#17233a40'},reactor:{base:'#102a37',tint:'#102a3726'}
}
const images=new Map<Scene,HTMLImageElement>(),failed=new Set<Scene>()
export function warmSceneryArt(scene:Scene){
 if(failed.has(scene)||typeof Image==='undefined')return
 const cached=images.get(scene)
 if(cached){images.delete(scene);images.set(scene,cached);return}
 // Keep only the three most recently visited districts decoded.
 if(images.size>=3)images.delete(images.keys().next().value!)
 const img=new Image();img.decoding='async';img.onerror=()=>{failed.add(scene);if(images.get(scene)===img)images.delete(scene)};images.set(scene,img);img.src=SCENERY_ASSETS[scene]
}
const rect=(c:C,x:number,y:number,w:number,h:number,color:string|CanvasGradient)=>{c.fillStyle=color;c.fillRect(x,y,w,h)}
const path=(c:C,points:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(points[0]!,points[1]!);for(let i=2;i<points.length;i+=2)c.lineTo(points[i]!,points[i+1]!);c.stroke()}
export function sceneryFrame(width:number,camera:number,aspect:number,scene:Scene,reduced=false){
 const h=Math.max(500,(width+180)/aspect),w=h*aspect,travel=Math.max(0,w-width),pan=travel*(.5+(reduced?0:Math.sin(camera/18000)*.32))
 return{x:-pan,y:(scene==='harbor'?345:360)-h*(scene==='harbor'?.7:.72),w,h}
}
export function paintScenicPlate(c:C,scene:Scene,width:number,camera=0,reduced=false){
 warmSceneryArt(scene);const image=images.get(scene)
 if(failed.has(scene)||!image?.complete||!image.naturalWidth||!image.naturalHeight)return false
 const frame=sceneryFrame(width,camera,image.naturalWidth/image.naturalHeight,scene,reduced)
 c.save();rect(c,0,0,width,480,grades[scene].base);c.drawImage(image,frame.x,frame.y,frame.w,frame.h)
 // Background grading preserves the contrast reserved for combatants and projectiles.
 rect(c,0,0,width,480,grades[scene].tint)
 if(scene==='harbor'){const haze=c.createLinearGradient(0,220,0,400);haze.addColorStop(0,'#19374600');haze.addColorStop(1,'#19374628');rect(c,0,220,width,180,haze)}
 c.restore();return true
}
function mist(c:C,x:number,y:number,w:number,h:number,color:string,opacity:number){
 c.save();c.translate(x,y);c.scale(1,h/w);const g=c.createRadialGradient(0,0,0,0,0,w);g.addColorStop(0,color+'60');g.addColorStop(1,color+'00');c.globalAlpha*=opacity;c.fillStyle=g;c.beginPath();c.arc(0,0,w,0,Math.PI*2);c.fill();c.restore()
}
// Small, slow background motions; these are painted before the entire collision/play layer.
export function drawSceneAtmosphere(c:C,level:Pick<Level,'id'|'biome'>,width:number,camera:number,time:number,reduced=false){
 const t=reduced?0:time,desert=level.biome==='desert'
 c.save()
 if(desert){
  for(let i=0;i<3;i++){const drift=reduced?0:Math.sin(t*.13+i)*30,x=width*(.18+i*.34)+drift;mist(c,x,321+i%2*18,140,13,'#d5b68f',.2)}
  if(!reduced)for(let i=0;i<13;i++){const x=((i*137+t*20-camera*.025)%(width+80)+width+80)%(width+80)-40,y=287+i*7%83;path(c,[x,y,x+7+i%9,y-1],'#a98d6c30',.65)}
 }else if(level.id===0){
  for(let i=0;i<29;i++){
   const x=((i*113.7-camera*.018)%width+width)%width,y=351+i%6*7,phase=reduced?0:Math.sin(t*.7+i*1.8),length=4+i%5*3+phase*2
   path(c,[x-length/2,y,x+length/2,y],'#b3d0d42c',.6)
   if(i%6===0)path(c,[x-3,y+2,x+3,y+2],'#d9b87e30',.75)
  }
  for(let i=0;i<3;i++)mist(c,width*(.12+i*.38)+(reduced?0:Math.sin(t*.1+i)*12),326+i*6,120,12,'#a1b7bd',.2)
 }else{
  // Other districts keep their own palette and silhouettes, with restrained district-specific life.
  const accents=['#c6b28a','#c6a28c','#a3bccd','#a9b49b','#b8abc5','#94c5c2'],color=accents[level.id]!
  if(level.id===1)for(let i=0;i<3;i++){const rise=reduced?12:(t*6+i*15)%45;mist(c,width*(.2+i*.29),210-rise,12+rise*.25,15+rise*.4,'#b7afa5',.12)}
  if(level.id===2)for(let i=0;i<5;i++){const x=width*(.1+i*.2);rect(c,x,272,2,1,'#b5c6bf70');path(c,[x-10,305,x+12,305],'#9bb5cc16',.8)}
  if(level.id===3)for(let i=0;i<4;i++)path(c,[width*i/4,330,width*i/4+35,327,width*i/4+70,330],'#9fb5ab16',1)
  if(level.id===4)for(let i=0;i<7;i++){const x=(i*181+41)%width;rect(c,x,235+i%3*19,4,2,color+(Math.sin(t*.12+i)>-.6?'37':'18'))}
  if(level.id===5)for(let i=0;i<4;i++){const x=width*(.12+i*.26);mist(c,x,335,45,9,'#9fbcb4',.09);path(c,[x-15,295,x+15,295],'#9ebec325',1)}
 }
 c.restore()
}
export function sceneryPowered(run:Run,x:number,y=350){return !poweredDown(run,{x,y,w:1,h:1})}
export function drawIndustrialAmbience(c:C,level:Level,run:Run,camera:number,width:number,reduced=false){
 if(level.biome==='desert')return
 c.save()
 for(let x=Math.floor(camera/440)*440;x<camera+width+440;x+=440){
  const powered=sceneryPowered(run,x+150),t=reduced?0:run.time
  if(level.id===0){
   // Hardware on the existing dock cabinet: hinges, louvers, latch and insulated conduit.
   path(c,[x+142,331,x+232,331],'#a1aaa04d',.6);path(c,[x+215,339,x+215,383],'#1d333c',1)
   for(let k=0;k<4;k++)path(c,[x+192,346+k*5,x+206,346+k*5],'#203947',1.3)
   rect(c,x+218,358,3,10,'#81928b');rect(c,x+221,361,1,3,'#d1c49c')
   path(c,[x+236,375,x+250,375,x+250,390],'#263e49',3);path(c,[x+236,374,x+249,374],'#8d9b9340',.7)
   rect(c,x+153,374,10,3,powered?'#bca879':'#47565a');rect(c,x+168,374,3,3,powered?'#789d8b':'#47565a')
  }else if(level.id===1||level.id===5){
   for(let i=0;i<4;i++)path(c,[x+137,315+i*13,x+175,315+i*13],'#b6b7a637',.65)
   path(c,[x+140,300,x+140,385],'#b3b9a33a',.6);rect(c,x+153,332,6,8,powered?(level.id===1?'#bfa06c':'#83b4ae'):'#2e4348')
   if(powered)for(let i=0;i<(reduced?1:2);i++){const rise=reduced?9:(t*8+i*10)%22;mist(c,x+154+Math.sin(reduced?i:t*.5+i)*3,289-rise,4+rise*.14,6+rise*.2,'#bdc5ba',.14*(1-rise/27))}
  }else{
   rect(c,x+251,275,32,2,powered?'#a6b7ad':'#2c414b');path(c,[x+267,279,x+267,320,x+271,324],'#243c48',1)
   for(let i=0;i<3;i++)rect(c,x+143+i*19,365,12,1,'#a3ac9d45')
  }
 }
 c.restore()
}
export function drawCoverRemains(c:C,b:Barrier,desert=false){
 if(b.hp>0||b.waterTower||b.billboard)return
 const x=b.x+b.w/2,y=b.y+b.h
 c.save();c.globalAlpha*=.64;c.fillStyle=desert?'#5d50382e':'#0a1e2760';c.beginPath();c.ellipse(x,y-.7,Math.min(23,b.w*.6),1.6,0,0,Math.PI*2);c.fill()
 for(let i=0;i<3;i++){const xx=x+(i-1)*Math.min(10,b.w*.25),h=1.5+(b.id+i)%3*.6;c.fillStyle=desert?'#76654b':'#3e535d';c.beginPath();c.moveTo(xx-3,y-1);c.lineTo(xx-1,y-h-1);c.lineTo(xx+3,y-h*.6);c.lineTo(xx+4,y-1);c.closePath();c.fill();path(c,[xx-1,y-h,xx+2,y-h*.6],desert?'#baa17a75':'#92a09a75',.55)}
 c.restore()
}
