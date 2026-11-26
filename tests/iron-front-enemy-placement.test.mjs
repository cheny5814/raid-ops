import{test}from'node:test'
import assert from'node:assert/strict'
import{FRONT_LEVELS,createRun,step}from'../app/utils/front.ts'
import{DESERT_LEVEL}from'../app/utils/front-desert-level.ts'
import{patrolObstructed,constrainPatrol}from'../app/utils/front-enemy-placement.ts'
const idle={left:false,right:false,jump:false,shoot:false,up:false,duck:false,aimAssist:true}
test('七关所有非首领单位出生时不嵌入横板或路障',()=>{
 for(const l of[...FRONT_LEVELS,DESERT_LEVEL])for(const e of l.enemies.filter(e=>!e.boss)){
  assert.ok(!patrolObstructed(e,[...l.platforms,...l.barriers]),`${l.name} ${e.id}`)
 }
})
test('七关巡逻和飞行轨迹碰到横板时停在外侧，扫掠不能跨过薄障碍',()=>{
 for(const l of[...FRONT_LEVELS,DESERT_LEVEL])for(const source of l.enemies.filter(e=>!e.boss)){
  const e={...source};for(let i=1;i<=100;i++){
   const previous={x:e.x,y:e.y},age=i*.12
   e.x=e.home+Math.sin(age)*(['drone'].includes(e.type)?85:30)
   if(e.type==='drone')e.y=e.homeY+Math.sin(age*1.8)*18
   constrainPatrol(e,previous,l)
   assert.ok(!patrolObstructed(e,[...l.platforms,...l.barriers]),`${l.name} ${e.id} 巡逻嵌入`)
  }
 }
 const l={...FRONT_LEVELS[0],platforms:[{x:100,y:360,w:4,h:40}],barriers:[]},e={...l.enemies[0],boss:false,x:150,y:362,w:28,h:38};constrainPatrol(e,{x:50,y:362},l);assert.equal(e.x,50)
})
test('截图指挥官的旧检查点位置会自动移出横板，真实步枪可正常命中并击败',()=>{
 const base=FRONT_LEVELS[0],source=base.enemies.find(e=>e.elite==='bulwark'),l={...base,enemies:[source],hazards:[],spikes:[],encounters:[],missions:[],storyTerminals:[],pickups:[],checkpoints:[],setPieces:[]},r=createRun(l),e=r.enemies[0]
 e.x=e.home=22960;e.y=e.homeY=362;r.x=23045;r.y=360;r.facing=-1;r.invincible=100
 r.interactives=[];r.tactics=[];step(r,l,idle,1/120)
 assert.ok(!patrolObstructed(e,l.platforms));assert.equal(e.y+e.h,365)
 for(let i=0;i<2400&&e.hp>0;i++)step(r,l,{...idle,shoot:true},1/120)
 assert.equal(e.hp,0,'应能直接命中站在横板上的指挥官');assert.equal(r.kills,1)
})

test('平台上的延迟增援换侧登场时重新落到实体表面，不继承平台高度悬空',()=>{
 const base=FRONT_LEVELS[0],source={...base.enemies.find(e=>e.type==='soldier'),x:1000,home:1000,y:327,homeY:327,dormant:true,wakeAfter:[],wakeTimer:0},l={...base,enemies:[source],ground:[{x:0,y:400,w:base.width,h:180}],platforms:[{x:970,y:365,w:90,h:16}],barriers:[],hazards:[],spikes:[],encounters:[],missions:[],storyTerminals:[],pickups:[],checkpoints:[],setPieces:[],field:undefined},r=createRun(l);r.x=1000;r.interactives=[];r.tactics=[];step(r,l,idle,1/120);assert.equal(r.enemies[0].dormant,false);assert.equal(r.enemies[0].y+r.enemies[0].h,400);assert.ok(!patrolObstructed(r.enemies[0],l.platforms))
})

test('七关地面单位和旧悬空位置均回到真实支撑面，无人机仍能飞行',async()=>{
 const {clearPatrolSpawn,patrolSupported}=await import('../app/utils/front-enemy-placement.ts')
 for(const l of [...FRONT_LEVELS,DESERT_LEVEL])for(const source of l.enemies.filter(e=>!e.boss&&e.type!=='drone')){
  const e=structuredClone(source);clearPatrolSpawn(e,l,l.platforms,l.barriers,true)
  assert.ok(patrolSupported(e,[...l.ground,...l.platforms]),`${l.name} ${e.type} ${e.id}`)
 }
})
test('断口里的静止小兵会回到桥面，巡逻和冲锋不会越过缺口悬空',async()=>{
 const {clearPatrolSpawn,patrolSupported}=await import('../app/utils/front-enemy-placement.ts')
 const base=FRONT_LEVELS[0],l={...base,ground:[{x:0,y:400,w:200,h:180},{x:300,y:400,w:300,h:180}],platforms:[],barriers:[],width:600}
 const e={...base.enemies.find(e=>!e.boss&&e.type==='soldier'),x:240,home:240,y:362,homeY:362,h:38,w:26}
 constrainPatrol(e,{x:e.x,y:e.y},l)
 assert.ok(patrolSupported(e,l.ground))
 const previous={x:e.x,y:e.y};e.x=245;constrainPatrol(e,previous,l)
 assert.equal(e.x,previous.x);assert.ok(patrolSupported(e,l.ground))
})
