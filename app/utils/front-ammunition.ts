import type { Bullet } from './front'
import { rect, line, polygon, disc, metal, glow } from './front-art'
type Ctx = CanvasRenderingContext2D
// All geometry is local to the projectile centre; heading follows its real velocity.
function tracer(c:Ctx,length:number,color:string,weight=1){
  const g=c.createLinearGradient(-length,0,0,0);g.addColorStop(0,color+'00');g.addColorStop(.72,color+'65');g.addColorStop(1,color+'cc')
  c.beginPath();c.moveTo(-length,0);c.lineTo(-2,0);c.strokeStyle=g;c.lineWidth=weight;c.stroke()
}
function smoke(c:Ctx,time:number){
  // 稀疏、向后散开的烟迹，不在弹体周围铺光圈。
  for(let i=0;i<4;i++){c.save();c.globalAlpha*=.14-i*.025;c.fillStyle='#849095';c.beginPath();c.ellipse(-27-i*8,Math.sin(time*7-i)*(.8+i*.4),3+i*1.3,1+i*.6,0,0,Math.PI*2);c.fill();c.restore()}
}
function missile(c:Ctx,time:number,hostile:boolean,desert=false){
  smoke(c,time)
  const flame=14+Math.sin(time*53)*3,g=c.createLinearGradient(-15-flame,0,-11,0);g.addColorStop(0,'#e98a4000');g.addColorStop(.55,'#e99b5bb0');g.addColorStop(1,'#fff3c9')
  polygon(c,[-12,-2,-18,-1.4,-15-flame,0,-20,1.3,-12,2],g);polygon(c,[-12,-.65,-21,0,-12,.65],'#fff0b8')
  polygon(c,[-10,-2,-16,-5,-14,-1,-14,1,-16,5,-10,2],'#49616b')
  line(c,[-15,-4,-10,-1.5],'#a0b1b0',.7)
  metal(c,-12,-2.6,18,5.2,desert?(hostile?'#4f6169':'#9eafb7'):'#c1cbc0',desert?(hostile?'#182731':'#354b58'):hostile?'#4b5d61':'#52665c',.7)
  polygon(c,[5,-2.6,10,0,5,2.6],desert?(hostile?'#2b3a43':'#536671'):hostile?'#b99c7b':'#9bab8d');line(c,[5,-2.6,9,0],'#dbe1cd',.7)
  rect(c,-3,-2.6,2,5.2,desert?(hostile?'#7e2b21':'#4b9bb7'):hostile?'#b77658':'#c2ac6c');rect(c,-11,-1,2,2,'#243c47')
}
function shell(c:Ctx,mortar:boolean,desert=false,hostile=true){
  const accent=desert?(hostile?'#6f2521':'#173d59'):hostile?'#bc573d':'#408da6'
  tracer(c,mortar?10:21,desert?accent:'#d5a16b',mortar?.9:1.1)
  if(mortar){
    // 迫击炮弹：短粗弹头、细尾管和展开的尾翼，靠轮廓区分平射炮弹。
    polygon(c,[-5,-1.2,-12,-1.2,-16,-4,-15,-.6,-17,0,-15,.6,-16,4,-12,1.2,-5,1.2],desert?(hostile?'#49342b':'#243f4d'):'#56685a')
    line(c,[-15,0,-6,0],'#a4b1ae',.6)
    const g=c.createLinearGradient(0,-4,0,4);g.addColorStop(0,desert?(hostile?'#805342':'#526b76'):'#b6c3bd');g.addColorStop(.35,desert?(hostile?'#593629':'#2c4758'):'#81917a');g.addColorStop(1,desert?(hostile?'#302023':'#132a38'):'#3c5059')
    polygon(c,[-6,-2.5,-2,-4,3,-3.7,6,-2.4,8,0,6,2.4,3,3.7,-2,4,-6,2.5],g)
    polygon(c,[5,-2.8,8,0,5,2.8,6,0],desert?(hostile?'#643d2b':'#344b54'):'#83938d')
    rect(c,-4,-3.2,1.3,6.4,desert?accent:'#b79a68',.2)
  }else{
    // 平射炮弹：修长尖头和金属驱动带，不加火箭式尾焰。
    const g=c.createLinearGradient(0,-3,0,3);g.addColorStop(0,desert?(hostile?'#805342':'#526b76'):'#bdc9c9');g.addColorStop(.32,desert?(hostile?'#593629':'#2c4758'):'#929d87');g.addColorStop(1,desert?(hostile?'#302023':'#132a38'):'#354b58')
    polygon(c,[-9,-2.7,2,-2.7,6,-1.8,11,0,6,1.8,2,2.7,-9,2.7],g)
    polygon(c,[4,-2.2,11,0,4,2.2,6,0],desert?(hostile?'#643d2b':'#344b54'):'#798775')
    rect(c,-7,-2.7,2,5.4,desert?accent:'#b79a68',.2)
    line(c,[-4,-1.8,2,-1.8,5,-1.1],desert?'#798993':'#d3dcd4',.55)
  }
}
function grenade(c:Ctx,b:Bullet,desert=false){
  c.rotate(b.life*8*(b.vx<0?-1:1))
  metal(c,-4.2,-5,8.4,10,desert?'#526568':'#92a083',desert?'#132b36':'#354c44',2.8)
  for(const y of [-2,1])line(c,[-3.6,y,3.6,y],'#213b34',.7)
  line(c,[0,-4,0,4],desert?'#415d65':'#304b3c',.8);rect(c,-3.3,-3.8,6.6,1.2,desert?'#b49b60':'#a49b6c',.2);rect(c,-2,-6.3,4,1.8,'#b6b6a0',.4)
  line(c,[-2,-6,3,-5,5,2],'#bdc5b4',1.3)
  c.beginPath();c.ellipse(-3,-6.4,1.8,1.3,.3,0,Math.PI*2);c.strokeStyle='#9ca99a';c.lineWidth=.7;c.stroke()
  disc(c,-.6,-6.7,.6,'#ebba6e')
}
function kinetic(c:Ctx,kind:string,hostile:boolean,desert=false){
  const piercing=kind==='pulse'||kind==='needle',pellet=kind==='spread'||kind==='flak',rapid=kind==='rapid'||kind==='burst'
  const length=pellet?5:piercing?24:rapid?13:18,body=pellet?3:piercing?10:7,r=desert?(pellet?1.25:1.55):pellet?1:1.25
  // 弹体自身的金属明暗提供体积；短曳光向后渐隐，不叠加轮廓或底圈。
  const tint=hostile?'#6f2521':'#173d59'
  tracer(c,length,desert?tint:hostile?'#e59874':piercing?'#9bb8d1':'#e8bf7d',desert?(pellet?1.3:1.7):pellet?.8:1.2)
  const g=c.createLinearGradient(0,-r,0,r)
  g.addColorStop(0,desert?(hostile?'#98422e':'#476879'):'#f0dfba')
  g.addColorStop(.3,desert?(hostile?'#6f2b24':'#21465d'):piercing?'#c8d2d2':'#d1a271')
  g.addColorStop(1,desert?(hostile?'#3b1214':'#0d2337'):piercing?'#627d8b':'#76563f')
  polygon(c,[-body/2,-r,body/2-1,-r,body/2+1,0,body/2-1,r,-body/2,r],g)
  if(!pellet)rect(c,-body/2,-r,1.4,r*2,desert?tint:'#bc8d59',.2)
  if(piercing)line(c,[-body/2+2,-r+.3,body/2-1,-r+.3],desert?'#617f8f':'#d7e7e6',.5)
}
function energy(c:Ctx,kind:string,time:number,desert=false,hostile=false){
  const rail=kind==='beam',orb=kind==='orb',color=desert?(hostile?'#6b1d40':rail?'#33265e':'#174857'):rail?'#aca6de':orb?'#b9a0d7':'#7dcfc7'
  tracer(c,rail?35:18,color,rail?1.8:1)
  c.save();c.scale(1,.5);glow(c,-2,0,rail?9:7,color,desert?.14:.26);c.restore()
  if(orb){disc(c,0,0,3.1,desert?'#4d1730':'#70618e');disc(c,.6,-.5,1.7,desert?'#9b4560':'#e9dff4')}
  else{polygon(c,[-(rail?11:5),-1,2,-1,5,0,2,1,-(rail?11:5),1],color);line(c,[-(rail?9:3),0,3,0],desert?(hostile?'#a34f73':'#6d5b94'):'#eaf5ec',.7)}
  if(rail)for(const side of [-1,1])line(c,[-27,side*1.8,-18,side*(2+Math.sin(time*45)), -9,side*1.3],desert?'#58497580':'#a7b2df80',.6)
}
export function paintAmmunition(c:Ctx,b:Bullet,time:number,desert=false){
  c.save();c.translate(b.x,b.y)
  if(b.kind==='grenade')grenade(c,b,desert)
  else{
    c.rotate(Math.atan2(b.vy,b.vx))
    const kind=b.enemyShot??(!b.friendly?'round':b.kind)
    if(kind==='rocket'||kind==='missile')missile(c,time,!b.friendly,desert)
    else if(kind==='shell'||kind==='mortar')shell(c,kind==='mortar',desert,!b.friendly)
    else if(kind==='beam'||kind==='plasma'||kind==='orb')energy(c,kind,time,desert,!b.friendly)
    else kinetic(c,kind,!b.friendly,desert)
  }
  c.restore()
}
