type Ctx=CanvasRenderingContext2D
const rect=(c:Ctx,x:number,y:number,w:number,h:number,color:string|CanvasGradient,r=.4)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
const line=(c:Ctx,p:number[],color:string,w=.6)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const poly=(c:Ctx,p:number[],color:string)=>{c.fillStyle=color;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.closePath();c.fill()}
function steel(c:Ctx,x:number,y:number,w:number,h:number,light='#9daea8',dark='#314a55'){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,light);g.addColorStop(.3,'#607b7f');g.addColorStop(1,dark);rect(c,x,y,w,h,g)}
const REACH:Record<string,number>={rifle:25,spread:27,pulse:32,rapid:29,rocket:28,beam:33}
export const firearmMuzzle=(length=25,weapon='rifle')=>(REACH[weapon]??25)*length/25
/** Rounded, layered combustion and smoke, anchored at the physical bore. */
export function paintMuzzleFlash(c:Ctx,x:number,weapon:string,phase=0){
  c.save();c.translate(x,0)
  const piercing=weapon==='pulse',energy=weapon==='beam',rocket=weapon==='rocket',wide=weapon==='spread',reach=(energy?12:rocket?17:wide?10:piercing?11:weapon==='rapid'?5.5:7)*(.9+Math.sin(phase*2.3)*.1),spread=(rocket?5:wide?3.8:energy?1.8:2.7)*(.9+Math.cos(phase*1.7)*.1)
  const color=energy?'#abbfe6':piercing?'#afc9d3':'#efb26c',glow=c.createRadialGradient(2,0,0,2,0,reach+3);glow.addColorStop(0,energy?'#cbdfff65':'#ffce8a60');glow.addColorStop(1,color+'00');rect(c,-reach-5,-reach-5,reach*2+14,reach*2+10,glow)
  const heat=c.createLinearGradient(0,0,reach,0);heat.addColorStop(0,'#fff6dce6');heat.addColorStop(.35,energy||piercing?'#bbd6eecc':'#f3bf78c0');heat.addColorStop(1,color+'00')
  c.fillStyle=heat;c.beginPath();c.moveTo(0,rocket?-2.1:-.8);c.bezierCurveTo(2,-spread,reach*.8,-spread*.55,reach,Math.sin(phase)*.4);c.bezierCurveTo(reach*.8,spread*.8,2,spread,0,rocket?2.1:.8);c.closePath();c.fill()
  if(rocket){const plume=c.createLinearGradient(0,0,20,0);plume.addColorStop(0,'#fff1bccc');plume.addColorStop(.45,'#efac5eaa');plume.addColorStop(1,'#df7b3700');for(const side of [-1,1]){c.fillStyle=plume;c.beginPath();c.moveTo(0,side*1.3);c.bezierCurveTo(5,side*4,10,side*2.8,19,side*.7);c.bezierCurveTo(12,side*2,6,side*1.7,0,side*.7);c.fill()}}
  if(!energy&&!rocket)for(const side of [-1,1]){c.fillStyle='#efba7b65';c.beginPath();c.ellipse(2.5,side*1.2,wide?3.4:2.2,wide?1.1:.8,side*.45,0,Math.PI*2);c.fill()}
  const smoke=c.createRadialGradient(5,-2,0,5,-2,6);smoke.addColorStop(0,'#b8b6a722');smoke.addColorStop(1,'#b8b6a700');rect(c,-2,-9,14,14,smoke)
  // White ignition is centred on the same exit point used by the ballistic simulation.
  c.fillStyle='#fff6dc';c.beginPath();c.ellipse(0,0,.9,.65,0,0,Math.PI*2);c.fill();c.restore()
}
/** Six separate silhouettes sharing the hand grip and bore axis. */
export function paintFirearm(c:Ctx,x:number,y:number,angle:number,weapon:string,firing=false,enemy=false,length=25,phase=0){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(length/25,length/25)
  const trim=enemy?'#bb9577':weapon==='beam'?'#a4b7d0':weapon==='pulse'?'#a2b9c2':'#b6aa85',m=REACH[weapon]??25
  // Pistol grip remains aligned with the character's firing hand.
  poly(c,[0,1.4,2.6,1.4,3.3,5.5,.8,5.5],'#203740');line(c,[1,2.7,1.8,4.8],'#7b9189')
  if(weapon==='rocket'){
    steel(c,-7,-3.5,32,7,'#a5af8e','#3e5650');steel(c,-8,-4,4,8);steel(c,22,-4.1,6,8.2)
    rect(c,-2,-2,7,4,'#30473d');rect(c,9,-3.5,2,7,'#b9aa75');rect(c,23,-2.5,5,5,'#1d343c')
    steel(c,6,-6.4,5,2);line(c,[8,-4.5,8,-6.8],'#b6c3ae');steel(c,12,3,4,3)
  }else if(weapon==='beam'){
    poly(c,[-6,-2,-1,-2,0,2,-7,3,-9,2],'#304b56');steel(c,-1,-3.2,15,6.4)
    steel(c,5,3,7,4,'#8699ac','#3a5063');rect(c,7,3.7,3,2.5,trim)
    for(const side of [-1,1]){steel(c,13,side<0?-3.2:1.6,20,1.6,'#bac6c7','#425c6d');line(c,[15,side*2.1,31,side*2.1],trim,.6)}
    for(let i=0;i<3;i++)steel(c,14+i*5,-4,2,8,'#7e979e','#2b4352');rect(c,30,-1.1,3,2.2,'#253e4e');steel(c,1,-5.4,9,2)
  }else if(weapon==='spread'){
    poly(c,[-8,-1.4,-2,-1.4,1,1.7,-7,3.3,-10,2],'#69735b');line(c,[-8,-.7,-3,-.7],'#a4ac8e')
    steel(c,-1,-2.2,11,4.4);steel(c,9,-1.6,18,2.3);steel(c,9,1.2,16,1.3,'#6c8580','#304c51')
    steel(c,10,.7,8,2.8,'#a5a382','#515f4c');for(let i=0;i<4;i++)line(c,[11+i*1.7,1,11+i*1.7,3],'#394c42')
    rect(c,25,-1.9,2,3.2,'#203a45');line(c,[24,-2,24,-3],'#a3b4a6',.8)
  }else if(weapon==='pulse'){
    poly(c,[-8,-2,-2,-2,1,1.6,-7,2.8,-9,1.6],'#3d535b');steel(c,-1,-2.4,16,4.8)
    steel(c,14,-1.5,13,3);steel(c,27,-2,5,4,'#6e8791','#243d4c');rect(c,4,2,4,4,'#536d77')
    steel(c,3,-5.4,10,2.4);rect(c,3,-5.2,2,2,'#192f3d');rect(c,11,-5.2,2,2,'#acc1bf')
    for(let i=0;i<4;i++)line(c,[16+i*2.3,-1.5,16+i*2.3,1.5],'#bac9c0',.55)
  }else if(weapon==='rapid'){
    poly(c,[-7,-1.7,-2,-1.7,1,2,-7,3,-9,1],'#344e54');steel(c,-1,-2.7,15,5.4)
    steel(c,13,-2.2,12,4.4);for(let i=0;i<4;i++)rect(c,14+i*2.5,-.8,1.3,1.2,'#1d3440')
    steel(c,25,-1.1,4,2.2);rect(c,28,-1.7,1,3.4,'#263c47');steel(c,4,2.5,8,5,'#8a967c','#435547')
    for(let i=0;i<4;i++)rect(c,9+i*1.5,2.4+i*.45,1.1,2.2,'#bda579')
    line(c,[18,2,15,7,13,7],'#728983',.8);line(c,[18,2,22,7,24,7],'#728983',.8);steel(c,2,-4.5,7,1.5)
  }else{
    poly(c,[-7,-1.3,-2,-1.3,1,1.7,-6.8,2.5,-9,1.5],'#2b424d');steel(c,-1.5,-2.1,14,4.2)
    poly(c,[4,2,8,2,7,6.8,3.6,6.2],'#4b6267');line(c,[5,3,6.6,3.3,6,5.4],'#90a297')
    steel(c,12,-1.7,8,3.4);for(let i=0;i<3;i++)rect(c,13+i*2,-.5,1.2,1,'#1a323e')
    steel(c,20,-.8,5,1.6);rect(c,24,-1.4,1,2.8,'#263f4a');steel(c,2,-4.1,5,1.6);rect(c,4,-4.5,1,.6,trim)
  }
  rect(c,1,-1.2,3,.7,'#213842');line(c,[-.5,-2.3,3,-2.3],'#b7c3b2',.4)
  if(firing)paintMuzzleFlash(c,m,weapon,phase+x*.31+y*.17)
  c.restore()
}
