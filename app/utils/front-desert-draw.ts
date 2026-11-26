import {hullResponse} from './front-combat-motion.ts'
import {drawVehicleDamage} from './front-equipment-detail.ts'
import {paintScenicPlate,drawSceneAtmosphere} from './front-scenery.ts'
import {wheelPhase,drawVehicleWake} from './front-vehicle-motion'
import {desertRock,desertCactus,desertShelter,desertFuelStation,desertWaterTower,desertSandbags} from './front-desert-props'
import {surfaceY} from './front-route-features'
import {desertBossState,desertDecks} from './front-desert.ts'
import type {Level,Run,Enemy,Rect} from './front.ts'
import {frontFont} from './front-font.ts'
type C=CanvasRenderingContext2D
const poly=(c:C,p:number[],color:string)=>{c.fillStyle=color;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.closePath();c.fill()}
const line=(c:C,p:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const box=(c:C,x:number,y:number,w:number,h:number,color:string,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
const disc=(c:C,x:number,y:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
export function desertBackdrop(c:C,width:number,camera=0,time=0,reduced=false){
 if(paintScenicPlate(c,'desert',width,camera,reduced)){drawSceneAtmosphere(c,{biome:'desert',id:0},width,camera,time,reduced);return}
 const sky=c.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#7797a0');sky.addColorStop(.45,'#e4b783');sky.addColorStop(1,'#c78b55');box(c,0,0,width,480,sky as unknown as string)
 const sun=c.createRadialGradient(width*.73,105,8,width*.73,105,100);sun.addColorStop(0,'#fff0c3aa');sun.addColorStop(1,'#ffdb9900');box(c,width*.73-100,5,200,200,sun as unknown as string);disc(c,width*.73,105,26,'#ffe7b0')
 for(let layer=0;layer<3;layer++){const stride=280+layer*60,offset=camera*(.035+layer*.035)%stride;for(let x=-stride-offset;x<width+stride;x+=stride){const y=215+layer*45;poly(c,[x,y+100,x+35,y+32,x+70,y+28,x+82,y-15,x+152,y-25,x+175,y+23,x+225,y+29,x+stride,y+100],['#b18e79','#b17f5f','#925b42'][layer]!);poly(c,[x+82,y-15,x+108,y+18,x+101,y+80,x+155,y+100,x+175,y+23,x+152,y-25],['#bca18a','#c0926b','#b9794e'][layer]!)
  for(let k=0;k<5;k++){const yy=y+27+k*14;line(c,[x+18+k*6,yy+15,x+79,yy+9,x+122,yy+11,x+187-k*4,yy+17],layer===2?'#4f493622':'#e4ccb12e',.7)}
  line(c,[x+107,y+21,x+119,y+39,x+113,y+56,x+129,y+79,x+125,y+94],'#564c3b36',.8)
 } }
 for(let layer=0;layer<2;layer++){c.fillStyle=layer?'#c18b55':'#d5a46c';c.beginPath();c.moveTo(0,480);for(let x=0;x<=width+20;x+=20)c.lineTo(x,345+layer*32+Math.sin((x+camera*(.13+layer*.08))/170+layer)*17);c.lineTo(width,480);c.fill()}
 // Drifting sand is low-contrast, behind combat and projectiles.
 c.strokeStyle='#fff0cb28';c.lineWidth=1;for(let i=0;i<26;i++){const x=((i*173+time*45-camera*.1)%(width+100)+width+100)%(width+100)-50,y=190+(i*71%200);c.beginPath();c.moveTo(x,y);c.lineTo(x+12+i%14,y-1);c.stroke()}
}
export function desertProps(c:C,camera:number,width:number,level?:Level){
 const supportAt=(x:number)=>level?.ground.find(g=>x>=g.x&&x<g.x+g.w)
 const heightAt=(x:number)=>{const g=supportAt(x);return g?surfaceY(g,x):level?undefined:400}
 // Structural columns sit behind the ground so their buried foundations stay occluded.
 for(const p of level?.platforms??[]){if(p.x+p.w<camera||p.x>camera+width||p.y>=390)continue
  for(const x of[p.x+16,p.x+p.w-20]){const floor=heightAt(x);if(floor===undefined||floor<=p.y+p.h)continue
   box(c,x-4,p.y+p.h,8,floor-p.y-p.h,'#656759');line(c,[x-3,p.y+p.h,x-3,floor],'#b4b19a',1);line(c,[x+2,p.y+p.h,x+2,floor],'#414f45',1.4)
   box(c,x-9,floor-4,18,4,'#968b71',1);line(c,[x-5,p.y+p.h+5,x+5,p.y+p.h+5],'#3d4b42',2)
  }
 }
 for(let x=Math.floor(camera/520)*520-520;x<camera+width+520;x+=520){
  const anchor=x+150,floor=heightAt(anchor),g=supportAt(anchor)
  if(floor!==undefined){const left=heightAt(anchor-50),right=heightAt(anchor+54),variant=Math.abs(Math.floor(x/520))%3
   c.save();c.translate(anchor,floor)
   if(variant===1)desertCactus(c,x)
   else if(variant===2&&left!==undefined&&right!==undefined&&Math.abs(left-right)<3)desertShelter(c)
   else if(left!==undefined&&right!==undefined){if(g?.rise)c.rotate(Math.atan2(right-left,104));desertRock(c,x)}
   c.restore()
  }
  const fuel=[10480,21880,31380,43780,58380].some(at=>Math.abs(x+375-at)<300),left=heightAt(x+304),right=heightAt(x+446)
  if(fuel&&left!==undefined&&right!==undefined&&Math.abs(left-right)<4){c.save();c.translate(x+375,Math.max(left,right));desertFuelStation(c);c.restore()}
  // Pebbles sample their own support rather than following a distant prop's slope height.
  for(let j=0;j<7;j++){const px=x+270+j*19,g=supportAt(px);if(level&&(!g||px+11>g.x+g.w))continue;const y=g?Math.min(surfaceY(g,px),surfaceY(g,px+11)):400;poly(c,[px,y-1,px+2,y-4,px+7,y-5,px+11,y-2,px+10,y],'#9b734d');line(c,[px+3,y-4,px+7,y-4],'#bc946d',.6)}
 }
}
export function desertDeck(c:C,p:Rect,camera:number,width:number,floating=false){
 const x=Math.max(camera-10,p.x),end=Math.min(camera+width+10,p.x+p.w),w=end-x;if(w<=0)return
 c.save();c.beginPath();c.rect(x,p.y,w,p.h);c.clip()
 const g=c.createLinearGradient(0,p.y,0,p.y+Math.min(p.h,150));g.addColorStop(0,'#aa9270');g.addColorStop(.15,'#927b5c');g.addColorStop(1,'#5d4c3a');box(c,x,p.y,w,p.h,g as unknown as string)
 box(c,x,p.y,w,3,'#cfb88b');line(c,[x,p.y+3,end,p.y+3],'#f1d7a63d',.7)
 if(floating){
  box(c,x,p.y+4,w,Math.max(2,p.h-4),'#646b5b');line(c,[x,p.y+6,end,p.y+6],'#343f36',1.5)
  for(let xx=Math.ceil(x/28)*28;xx<end-2;xx+=28){line(c,[xx,p.y+5,xx,p.y+p.h-2],'#252e2959',.8);disc(c,xx+3,p.y+8,.8,'#bab89b');line(c,[xx+7,p.y+2,xx+12,p.y+2],'#ede1b56b',.6)}
 }else{
  for(let yy=p.y+14;yy<p.y+Math.min(180,p.h);yy+=17){c.strokeStyle='#d7b58c34';c.lineWidth=.8;c.beginPath();c.moveTo(x,yy);for(let xx=Math.floor(x/80)*80;xx<end;xx+=80){const y=yy+Math.sin(xx*.017+yy*.1)*3;c.bezierCurveTo(xx+20,y-2,xx+49,y+3,xx+80,y)}c.stroke()}
  for(let xx=Math.floor(x/110)*110;xx<end;xx+=110){const y=p.y+17+Math.abs(Math.sin(xx*.13))*24;line(c,[xx+27,y,xx+34,y+11,xx+29,y+23,xx+36,y+32],'#413e3252',.75);line(c,[xx+35,y+12,xx+47,y+13],'#443d3040',.6)}
 }
 for(let xx=Math.floor(x/11)*11;xx<end;xx+=11){const y=p.y+1+(Math.sin(xx*9.7)+1)*1.3;line(c,[xx,y,xx+1.5,y+.5],'#69583e55',.65)}
 c.restore()
}
export function desertWorld(c:C,l:Level,r:Run,camera:number,width:number,en:boolean){
 for(const s of l.desert?.sand??[]){if(s.x+s.w<camera||s.x>camera+width)continue;box(c,s.x,s.y+4,s.w,13,'#9e6d3e');c.save();c.beginPath();c.rect(s.x,s.y,s.w,23);c.clip();for(let j=0;j<6;j++){const y=s.y+3+j*3;line(c,[s.x+Math.sin(r.time+j)*7,y,s.x+s.w,y-2],'#e0ae694d',1)}c.restore();c.font=frontFont(8,en?'en':'zh');c.textAlign='center';c.fillStyle='#fce5ae';const safe=desertDecks(r).some(d=>d.x<=s.x&&d.x+d.w>=s.x+s.w);c.fillStyle=safe?'#d3e0b6':'#fce5ae';c.fillText(safe?(en?"Hard crossing":'硬路已铺设'):(en?"Quicksand · keep jumping":'流沙 · 跳跃脱离'),s.x+s.w/2,s.y-12)}
 for(const b of r.barriers){if(!b.waterTower||b.x+280<camera||b.x>camera+width)continue;const feet=b.y+b.h,fall=b.hp<=0?Math.min(1,(b.fallAge??0)/.65):0;c.save();c.translate(b.x+10,feet);c.rotate(fall*Math.PI/2)
 desertWaterTower(c);c.restore()
 if(b.hp>0){c.fillStyle='#f6d28d';c.font=frontFont(8,en?'en':'zh');c.textAlign='center';c.fillText(en?"Shoot support / hard crossing": '射击支架 · 铺出硬路',b.x+10,b.y-28);box(c,b.x-10,feet-45,40,17,'#e5bc6a33');line(c,[b.x-7,feet-40,b.x+25,feet-30],'#ecc67a',2)}else{const d={x:b.x-12,y:feet,w:270,h:12};desertDeck(c,d,camera,width,true);if(fall<1){for(let j=0;j<9;j++)disc(c,b.x+j*25,feet-12-(j%3)*6,8,'#d6ad7770')}}
 }
 if((r.sandTime??0)>.6){c.font=frontFont(10,en?'en':'zh');c.textAlign='center';c.fillStyle='#fff0ba';c.fillText(en?"Sinking · jump or dash":'正在下陷 · 跳跃或冲刺',r.x+13,r.y-32)}
}
export function drawDesertBoss(c:C,e:Enemy,reduced=false){
 drawVehicleWake(c,e.vehicleMotion,e.x,e.y+e.h,e.w,e.age,true,reduced)
 const phase=wheelPhase(e.vehicleMotion,reduced)*8/12,recoil=reduced?0:Math.min(1,(e.shotFlash??0)/.16)
 const x=e.x,y=e.y,w=e.w,h=e.h,broken=(e.parts?.tracks??0)<=0,open=desertBossState(e).open
 c.save();c.translate(x,y);c.fillStyle='#4a34294f';c.beginPath();c.ellipse(w/2,h+2,w*.55,7,0,0,Math.PI*2);c.fill()
 if(broken){poly(c,[8,h-15,25,h-21,43,h-15,65,h-20,78,h-12,60,h-6,30,h-8],'#342f29');line(c,[10,h-12,27,h-4,41,h-11,55,h-3],'#a18e6a',2)}
 for(const wx of [25,w*.5,w-25]){disc(c,wx,h-12,17,'#282b29');disc(c,wx,h-12,12,broken?'#4c463d':'#6d6b57');disc(c,wx,h-12,5,'#b3a282');for(let a=0;a<6;a++){const angle=a*Math.PI/3+(broken?0:phase);line(c,[wx+Math.cos(angle)*7,h-12+Math.sin(angle)*7,wx+Math.cos(angle)*13,h-12+Math.sin(angle)*13],'#252c29',2)}}
 // A continuous tread wraps the existing road wheels, with travel-driven links.
 c.save();c.beginPath();c.roundRect(5,h-30,w-10,34,14);c.clip()
 const belt=broken?0:((phase*12)%8+8)%8
 for(let xx=-8;xx<w+8;xx+=8){box(c,xx+belt,h-30,6.5,4,'#9b9678',.6);line(c,[xx+8-belt,h+1,xx+14-belt,h+1],'#b0a17e',2.5)}
 c.restore()
 for(const wx of [25,w*.5,w-25]){line(c,[wx-7,h-31,wx,h-15],'#a49c7b',2);disc(c,wx-7,h-31,2,'#3c463b')}
 const response=hullResponse(e.vehicleMotion,e.shotFlash??0,reduced);c.save();c.translate(w*.4,16+response.settle);c.rotate(response.pitch);c.translate(-w*.4,-16)
 const g=c.createLinearGradient(0,12,0,h-18);g.addColorStop(0,'#e1c492');g.addColorStop(.25,'#b49b71');g.addColorStop(1,'#655840');poly(c,[0,38,17,19,w-25,19,w,42,w-8,h-25,8,h-25],g as unknown as string)
 line(c,[17,20,w-25,20,w-2,42],'#f5dbac99',2);poly(c,[28,19,42,2,91,2,110,20],'#a08f6b');box(c,35,-1,55,8,'#d1b987',2);
 box(c,18,27,30,13,'#364c4b',2);line(c,[21,29,43,29],'#cad6b870',2);for(let i=0;i<4;i++)box(c,w-38+i*6,31,3,18,open?'#ffb45d':'#494838')
 for(let xx=20;xx<w-10;xx+=27){disc(c,xx,46,1.3,'#e5cc9a');line(c,[xx,24,xx-5,43],'#5b503e',1)}
 // Engine access panels, spare links and tow brackets use restrained sand-worn materials.
 for(let i=0;i<3;i++){box(c,52+i*10,25,8,7,'#736d52',1);line(c,[53+i*10,26,58+i*10,26],'#d1be94',.7);disc(c,56+i*10,29,1,'#3b4437')}
 line(c,[49,36,77,36,77,47,49,47,49,36],'#4e523f',.8)
 for(const xx of[12,w-13]){disc(c,xx,h-30,3,'#414c40');disc(c,xx,h-30,1.5,'#b6a47c')}
 for(let i=0;i<6;i++)line(c,[w-54+i*5,22,w-56+i*5,26],'#4a4c3b',1)
 line(c,[40,1,40,-4,62,-4,62,1],'#d0ba8d',1)
 if(open){c.shadowColor='#ffb154';c.shadowBlur=14;box(c,w-35,32,20,15,'#ffba66',2);c.shadowBlur=0}
 c.font=frontFont(8,'en');c.fillStyle='#4e4938';c.fillText('SC-09',65,44);c.restore();c.save();c.translate(w*.4,16);c.rotate(e.aim??Math.PI);c.translate(-recoil*5,0);box(c,0,-4,56,8,'#676f5b',2);box(c,49,-5,12,10,'#374c44',1);line(c,[8,-3,48,-3],'#d4c39a',1);c.restore();c.restore();drawVehicleDamage(c,e,reduced)
}

export function drawDesertSandbags(c:C,p:Rect){desertSandbags(c,p)}
