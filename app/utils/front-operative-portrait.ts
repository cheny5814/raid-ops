import type {OperativeId} from './front-operatives.ts'
type C=CanvasRenderingContext2D
const poly=(c:C,p:number[],fill:string|CanvasGradient)=>{c.fillStyle=fill;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.closePath();c.fill()}
const line=(c:C,p:number[],color:string,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0]!,p[1]!);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]!,p[i+1]!);c.stroke()}
const box=(c:C,x:number,y:number,w:number,h:number,fill:string|CanvasGradient,r=1)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
const disc=(c:C,x:number,y:number,r:number,fill:string)=>{c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function plate(c:C,x:number,y:number,w:number,h:number,light:string,dark:string){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.4,dark);g.addColorStop(1,'#172c34');poly(c,[x+2,y,x+w-2,y,x+w,y+3,x+w-1,y+h-1,x+2,y+h,x,y+3],g);line(c,[x+2,y+1,x+w-3,y+1],'#e3dec266',.6)}
export function drawOperativeFront(c:C,id:OperativeId,width:number,height:number,time:number,reduced=false,desert=false){
 c.clearRect(0,0,width,height);const fox=id==='fox',scale=Math.min(width/104,height/183),t=reduced?0:time,breathe=Math.sin(t*2.1)*.35
 const cloth=desert?fox?'#b6aa8a':'#b8a579':fox?'#87928d':'#7d9185',dark=desert?'#6c644e':fox?'#42565a':'#3e5753',steel=desert?'#d4c092':fox?'#b5c1ba':'#a8b9ad',trim=fox?'#deb17d':'#88c7b9',skin=fox?'#d1ae94':'#bc997d'
 c.save();c.translate(width/2,height-8*scale);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round'
 c.fillStyle='#04192366';c.beginPath();c.ellipse(0,-1,33,4,0,0,Math.PI*2);c.fill()
 // Front-facing stance: independent legs, visible kneecaps and forward boot toes.
 for(const side of [-1,1]){const x=side*9;poly(c,[x-6,-70,x+6,-70,x+7,-44,x+5,-29,x+6,-6,x-5,-6,x-6,-31,x-7,-46],cloth);poly(c,[x+2,-67,x+6,-67,x+6,-44,x+3,-29,x+5,-8,x+1,-8,x-1,-32],dark)
  line(c,[x-3,-65,x-2,-48,x-4,-42],'#d9d8bd33',.7);plate(c,x-5,-42,10,11,steel,dark);line(c,[x-3,-36,x+3,-36],'#d7d3b47a',.8);box(c,x-5.5,-29,11,2,'#263a3a');box(c,x-5,-15,10,4,'#213436');box(c,x-6,-12,12,12,'#243839',2);plate(c,x-6.5,-6,13,7,'#586b65','#203437');line(c,[x-5,1,x+6,1],'#acb5a3',1);for(let j=0;j<3;j++)line(c,[x-3,-10+j*2,x+3,-10+j*2],'#a8b1a177',.6)
 }
 c.translate(0,breathe)
 const shoulder=fox?18:21,waist=fox?11:14
 // Pack and shoulder webbing sit behind the torso and arms.
 box(c,-shoulder-3,-123,shoulder*2+6,49,'#243d3e',4);box(c,-shoulder-5,-115,5,29,dark,2)
 poly(c,[-shoulder,-130,shoulder,-130,shoulder+2,-108,waist,-79,-waist,-79,-shoulder-2,-108],cloth)
 for(const side of [-1,1]){c.save();c.scale(side,1);poly(c,[shoulder-2,-127,shoulder+8,-121,shoulder+11,-104,shoulder+5,-89,shoulder-2,-91,shoulder+2,-106,shoulder-6,-119],cloth);plate(c,shoulder-4,-127,12,10,steel,dark);box(c,shoulder+3,-107,7,9,dark,2);line(c,[shoulder+5,-114,shoulder+7,-109],'#d0d0b24d',.7);c.restore()}
 // Tailored vest, center zipper, layered plates and stitched pouches.
 poly(c,[-shoulder+5,-127,-4,-129,0,-124,4,-129,shoulder-5,-127,waist+2,-91,waist,-78,-waist,-78,-waist-2,-91],dark)
 plate(c,-waist-1,-119,waist*2+2,23,steel,dark);line(c,[0,-117,0,-100],'#192f33',1);box(c,-8,-112,16,2,trim,.5);box(c,-5,-108,3,2,trim,.3);box(c,2,-108,3,2,trim,.3)
 for(const x of [-10,0,10]){plate(c,x-4,-96,8,12,cloth,dark);box(c,x-3,-94,6,2,'#d7ceb366',.3)}
 box(c,-waist-2,-81,waist*2+4,5,'#1d3436');plate(c,-3,-82,6,7,'#c3b99a','#5b685e')
 for(const side of [-1,1]){c.save();c.scale(side,1);box(c,waist-2,-81,8,12,dark,2);line(c,[waist,-78,waist+4,-78],'#a5b09b',.6);c.restore()}
 // Neck, ears and a front-facing face. Two eyes and a central nose define the view.
 box(c,-4,-141,8,13,skin,2);poly(c,[-7,-132,0,-129,7,-132,8,-127,0,-124,-8,-127],dark)
 if(fox){const sway=Math.sin(t*1.7)*1.8;poly(c,[6,-159,14,-157,16+sway,-143,20+sway,-130,14+sway,-134,9,-147], '#473c32');line(c,[12,-154,14+sway,-141,18+sway,-133],'#8b7256',1)}
 disc(c,-9,-149,2.5,skin);disc(c,9,-149,2.5,skin)
 poly(c,[-8,-160,7,-160,9,-154,7.5,-143,4,-138,-4,-138,-7.5,-143,-9,-153],skin)
 poly(c,[5,-157,8,-154,6.5,-144,3,-139,0,-139,4,-146], '#9b79644f');line(c,[-3,-143,3,-143],'#815f50',.7);line(c,[0,-151,-1,-146,1,-146],'#986f5a',.6)
 poly(c,[-9,-153,-10,-159,-6,-165,3,-165,8,-161,9,-154,5,-157,1,-159,-3,-156,-7,-157],fox?'#4b3d33':'#33423b')
 if(fox){
  // 明确的眼白、虹膜与上眼睑，让正面肖像保持睁眼神态。
  for(const side of [-1,1]){const x=side*4;poly(c,[x-2,-150,x-1,-151,x+1,-151,x+2,-150,x+1,-148.8,x-1,-148.8],'#f3e8d7');disc(c,x,-150,.9,'#47635b');disc(c,x,-150,.48,'#172d31');disc(c,x-.25,-150.3,.2,'#fff7e9');line(c,[x-2,-150,x-1,-151,x+1,-151,x+2,-150],'#493c34',.5);line(c,[x-1.8,-152.5,x+1.6,-152.8],'#594638',.65)}
  plate(c,-8,-161,16,4,'#b1a48c','#3a5356');box(c,-6,-160,5,2,'#49656b');box(c,1,-160,5,2,'#49656b')}
 else{box(c,-9,-153,18,5,'#2a4144',1);box(c,-7,-152,6,2.5,'#83b9ae88',.6);box(c,1,-152,6,2.5,'#83b9ae88',.6);line(c,[-9,-158,6,-159],'#a1ad92',1.6)}
 disc(c,-10,-150,3,'#243d3f');disc(c,-10,-150,1.7,'#96a99b');line(c,[-11,-148,-10,-143,-5,-142],'#3a5352',1);box(c,-5,-143,3,1.5,'#203a3e')
 if(desert){poly(c,[-7,-143,7,-143,5,-136,-5,-136],'#bba67d');poly(c,[-7,-132,0,-129,8,-132,9,-126,-5,-124,-12,-114,-14+Math.sin(t*2),-119], '#c3af86');line(c,[-6,-130,2,-127,6,-129],'#ecddb54a',.8)}
 // Rifle rests across the body; the torso and face remain square to the viewer.
 c.save();c.translate(-13,-100);c.rotate(-.13);box(c,-15,-3,19,8,'#354b4b',2);plate(c,2,-6,29,11,'#9cad9f','#3b5352');box(c,29,-4,21,7,'#6f847a',1);box(c,50,-2,12,3,'#344d4c');box(c,59,-3,5,5,'#203b3d');box(c,11,5,7,10,'#31494a');poly(c,[23,4,30,4,28,17,21,16],'#6f8074');box(c,9,-10,12,3,'#354f4d');for(let j=0;j<4;j++)box(c,33+j*4,-2,2,2,'#203638',.4);line(c,[3,-5,27,-5],'#dce0c167',.7);c.restore()
 // Both forearms angle inward to hold the weapon, rather than showing a side-view gun arm.
 for(const side of [-1,1]){c.save();c.scale(side,1);poly(c,[shoulder+6,-104,shoulder+9,-96,12,-91,8,-97],cloth);line(c,[shoulder+5,-103,12,-95],'#b6c4aa55',.8);box(c,8,-99,7,6,'#2f4846',2);box(c,7,-98,4,4,skin,1);c.restore()}
 c.restore()
}
