import {FRONT_LEVELS,createRun,enemy,step,equipWeapon,type Level,type Run,type Input} from './front.ts'
import {drawPlayer,drawCombatant,drawProjectiles,drawCombatEffects} from './front-art'
import type {OperativeId} from './front-operatives.ts'
const VIEW=650,DT=1/120
const idle:Input={left:false,right:false,up:false,duck:false,jump:false,shoot:false,aimAssist:true,viewWidth:VIEW}
export type TitleDemo={level:Level,run:Run,clock:number,accumulator:number,clearAt:number|null,spawns:number[],input:Input}
// A separate miniature level uses the real simulation. It has no storage or audio bindings.
export function createTitleDemo(operative:OperativeId='raven',desert=false):TitleDemo {
 const foes=[enemy(1,'soldier',VIEW+65,false,false),enemy(2,'soldier',VIEW+65,false,false),enemy(3,'drone',VIEW+90,false,false),enemy(4,'drone',VIEW+100,false,false),enemy(5,'tank',VIEW+70,false,false)]
 foes.forEach((e,i)=>{
  e.dormant=true;e.cooldown=.2;e.guard=false;e.zone=undefined;e.drawScale=i===4?1.1:1;e.hp=e.maxHp=i===4?28:i<2?12:7
  if(i===4){e.w=132;e.h=88;e.y=e.homeY=400-e.h}
  else if(e.type!=='drone'){e.y=e.homeY=400-e.h}
  if(e.type==='soldier')e.role='boarding'
 })
 const level:Level={...FRONT_LEVELS[0],width:12000,biome:desert?'desert':undefined,desert:desert?{sand:[],towerIds:[]}:undefined,enemies:foes,
  ground:[{x:0,y:400,w:12000,h:180}],platforms:[],barriers:[],pickups:[],hazards:[],ropes:[],ladders:[],ziplines:[],checkpoints:[],encounters:[],missions:[],storyTerminals:[],setPieces:[],field:undefined,districts:[],difficulty:{...FRONT_LEVELS[0].difficulty,cooldown:2.5,windup:.25}}
 const run=createRun(level,['rifle','rapid','rocket'],[],6500,operative)
 run.x=360
 return{level,run,clock:0,accumulator:0,clearAt:null,spawns:[.6,1.7,4.2,6.2,10],input:{...idle}}
}
export function advanceTitleDemo(d:TitleDemo,delta:number){
 d.accumulator+=Math.max(0,Math.min(.1,delta))
 while(d.accumulator>=DT){
  d.clock+=DT;d.accumulator-=DT
  if(d.run.status!=='playing')continue
  for(let i=0;i<d.run.enemies.length;i++){
   const e=d.run.enemies[i]!
   if(e.dormant&&d.clock>=d.spawns[i]!){e.dormant=false;e.x=e.home=titleDemoCamera(d)+VIEW+80}
   // A convoy advances along the road while the player pursues it.
   if(!e.dormant&&e.hp>0&&e.type==='drone'){e.home+=105*DT;e.x=e.home}
   if(!e.dormant&&e.hp>0&&e.type==='tank'){e.home+=165*DT;e.x=e.home}
  }
  const tank=d.run.enemies.find(e=>e.type==='tank')!,air=d.run.enemies.some(e=>e.type==='drone'&&!e.dormant&&e.hp>0)
  const camera=titleDemoCamera(d)
  const weapon=!tank.dormant&&tank.hp>0&&tank.x+tank.w<camera+VIEW-15?'rocket':air?'rapid':'rifle'
  if(d.run.weapon!==weapon)equipWeapon(d.run,weapon)
  const incoming=d.run.bullets.some(b=>!b.friendly&&b.x>d.run.x&&b.x<d.run.x+120&&Math.abs(b.y-d.run.y-25)<40)
  d.input={...idle,right:true,shoot:d.run.enemies.some(e=>e.hp>0&&!e.dormant&&e.x+e.w<camera+VIEW-15),jump:d.run.grounded&&(incoming||!tank.dormant&&tank.hp>0&&tank.x-d.run.x<160),grenade:!tank.dormant&&tank.hp>0&&tank.x-d.run.x<180,skill:false,view:{x:camera,y:0,zoom:1,worldWidth:VIEW,worldHeight:480,anchor:360/VIEW,look:1,facing:1,requested:1,turnAge:1}}
  step(d.run,d.level,d.input,DT)
  // Audio notifications are intentionally discarded: this is a silent gameplay preview.
  d.run.soundEvents=[]
  d.run.bullets=d.run.bullets.filter(b=>!b.friendly||b.x<=camera+VIEW)
  if(d.clearAt===null&&(d.run.status==='dead'||d.run.enemies.every(e=>e.hp<=0)))d.clearAt=d.clock
 }
}
export function titleDemoCamera(d:TitleDemo){return Math.max(0,d.run.x-360)}
let demo:TitleDemo|null=null,lastElapsed=0,lastOperative:OperativeId='raven',lastDesert=false,lastReduced=false
export function titleDemoTravel(span:number,reduced=false){return !reduced&&demo?titleDemoCamera(demo)*span/VIEW:0}
export function drawTitleBattle(c:CanvasRenderingContext2D,left:number,right:number,elapsed:number,reduced=false,operative:OperativeId='raven',desert=false){
 const span=right-left;if(span<105)return
 if(!demo||reduced!==lastReduced||operative!==lastOperative||desert!==lastDesert||elapsed<lastElapsed||demo.clock>34||demo.clearAt!==null&&demo.clock-demo.clearAt>2.2){demo=createTitleDemo(operative,desert);lastElapsed=elapsed;lastOperative=operative;lastDesert=desert;lastReduced=reduced}
 if(!reduced)advanceTitleDemo(demo,elapsed-lastElapsed)
 lastElapsed=elapsed
 const scale=span/VIEW
 c.save();c.beginPath();c.rect(left,0,span,480);c.clip();c.translate(left,411-400*scale);c.scale(scale,scale)
 if(!reduced)c.translate(-titleDemoCamera(demo),0)
 if(reduced){
  for(const [i,source]of demo.run.enemies.entries()){const e={...source,x:300+i*65,y:source.type==='drone'?240:400-source.h,dormant:false};drawCombatant(c,e,demo.run,undefined,true)}
 }else{
  for(const e of demo.run.enemies)if(e.hp>0&&!e.dormant)drawCombatant(c,e,demo.run)
  drawProjectiles(c,demo.run,titleDemoCamera(demo),VIEW)
 }
 drawPlayer(c,demo.run,reduced?idle:demo.input,reduced)
 if(!reduced)drawCombatEffects(c,demo.run,titleDemoCamera(demo),VIEW)
 c.restore()
}
