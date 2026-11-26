import {test}from'node:test';import assert from'node:assert/strict'
import{FRONT_LEVELS,createRun,step,respawn,BODY}from'../app/utils/front.ts'
import{arcadeCamera,arcadeGround,tankStage,tankTarget,crossfireOpen}from'../app/utils/front-contra.ts'
const idle={left:false,right:false,jump:false,shoot:false,duck:false,up:false}
const frames=(r,l,n,input={})=>{for(let i=0;i<n&&r.status==='playing';i++)step(r,l,{...idle,...input},1/120)}
test('港口坦克依次破坏履带、副炮和引擎，断履带后停止移动，部件快照不共享',()=>{
 const original=FRONT_LEVELS[0],l={...original,setPieces:[],checkpoints:[],encounters:[],storyTerminals:[],missions:[],ground:[{x:0,y:400,w:original.width,h:180}],platforms:[],barriers:[],hazards:[],spikes:[],pickups:[]},r=createRun(l),e=r.enemies.find(e=>e.boss);r.enemies=[e];r.x=e.x-350;r.invincible=100;e.age=3
 const hit=()=>{const p=tankTarget(e);r.bullets.push({x:p.x,y:p.y,vx:0,vy:0,friendly:true,kind:'rifle',life:1,damage:30,pierce:1,hit:[]});frames(r,l,1)}
 while(tankStage(e)==='tracks')hit();assert.equal(e.parts.tracks,0);assert.ok(e.parts.gun>0);const x=e.x;frames(r,l,60);assert.equal(e.x,x);l.checkpoints=[r.x];frames(r,l,1);assert.ok(r.saved);const savedGun=r.saved.enemies[0].parts.gun
 while(tankStage(e)==='gun')hit();assert.equal(e.parts.gun,0);assert.ok(e.parts.engine>0);assert.ok(e.hp>0);assert.equal(r.saved.enemies[0].parts.gun,savedGun)
 while(e.hp>0)hit();assert.equal(e.parts.engine,0);assert.equal(e.hp,0);assert.equal(r.kills,1)
})
test('竖井可凭真实跳跃登顶，镜头随高度上移，顶部自动滑索落岸，无需按键脱离',()=>{
 const l=FRONT_LEVELS[2],r=createRun(l),p=l.setPieces.find(p=>p.kind==='climb');r.x=p.x+20;r.y=360;let target,minY=0,minCamera=0,returned=false
 for(let i=0;i<4000&&r.status==='playing'&&r.arcade[0].phase!=='done';i++){
  const s=r.arcade[0]
  let input=idle
  if(s.phase==='return')returned=true
  else{if(target&&r.grounded&&(Math.abs(r.y+40-target.y)<2||r.y+40-target.y>110))target=null;if(!target)target=l.platforms.filter(a=>a.x>=p.x&&a.x<p.end&&a.y<r.y+38).sort((a,b)=>b.y-a.y)[0];const dx=target?target.x+target.w/2-r.x-13:0;input={...idle,left:dx< -5,right:dx>5,jump:r.grounded,shoot:true,aimAssist:true,up:true}}
  step(r,l,input,1/120);minY=Math.min(minY,r.y);minCamera=Math.min(minCamera,arcadeCamera(l,r,960).y)
 }
 assert.equal(r.status,'playing');assert.equal(r.arcade[0].phase,'done');assert.ok(returned);assert.ok(minY< -300&&minCamera< -400);assert.equal(r.x,p.end-60);assert.equal(r.y,p.floor-BODY.h);assert.ok(r.grounded)
})
test('竖井不能从底层直接绕过，长时间停留会被上升电弧追上',()=>{
 const l={...FRONT_LEVELS[2],enemies:[]},r=createRun(l),p=l.setPieces[0];r.x=p.x+20;r.y=360;frames(r,l,120,{right:true});assert.ok(r.x<=p.x+330);frames(r,l,1200);assert.equal(r.status,'dead');assert.match(r.reason,/电弧/)
})
test('旧坍塌段不再追赶、移除地面或判负，已有存档状态也不会恢复该机制',()=>{
 const base=FRONT_LEVELS[0],l={...base,enemies:[],barriers:[],hazards:[],spikes:[],encounters:[],storyTerminals:[],missions:[]},r=createRun(l),p=l.setPieces.find(p=>p.kind==='escape');r.x=p.x+20;r.y=360
 const before=JSON.stringify(arcadeGround(l,r));r.arcade[0].phase='active';r.arcade[0].fromX=r.x+200;r.arcade[0].elapsed=20
 frames(r,l,1200)
 assert.equal(r.status,'playing');assert.equal(r.hp,10);assert.equal(r.arcade[0].phase,'done');assert.equal(JSON.stringify(arcadeGround(l,r)),before)
})
test('交叉火力分为高位、突进、空袭和掩护，实际发射有不同时间窗口',()=>{
 const l=FRONT_LEVELS[1],base=createRun(l),a=l.encounters[0],formation=base.enemies.filter(e=>a.enemies.includes(e.id)&&e.crossfire);assert.equal(new Set(formation.map(e=>e.crossfire)).size,4)
 for(const time of[.5,3.2,6])for(const source of formation){const r=createRun(l),e=r.enemies.find(e=>e.id===source.id);r.enemies=[e];r.x=e.x-250;r.y=(l.ground.find(g=>r.x>=g.x&&r.x+26<=g.x+g.w)?.y??400)-40;r.time=time;e.cooldown=0;const allowed=crossfireOpen(e,time),x=e.x;frames(r,l,150);assert.equal(e.crossfire==='rush'?e.x<x:e.volleys>0,allowed,`${source.crossfire} at ${time}`)}
})
test('交叉火力换班后收起枪口闪光，受击闪烁正常结束，不冻结在攻击姿势',()=>{
 const l=FRONT_LEVELS[1],r=createRun(l),e=r.enemies.find(e=>e.crossfire==='high');r.enemies=[e];r.x=e.x-250;r.y=(l.ground.find(g=>r.x>=g.x&&r.x+26<=g.x+g.w)?.y??400)-40;r.time=3.2;e.hitFlash=.12;e.shotFlash=.12;e.cooldown=0
 frames(r,l,30);assert.equal(e.hitFlash,0);assert.equal(e.shotFlash,0);assert.equal(e.volleys,0)
})

test('坦克小数伤害与旧版残血状态均能正常击败，部件和总生命始终同步',()=>{
 for(const maxHp of[104,220])for(const damage of[1,1.13,1.37,2.13]){
  const original=FRONT_LEVELS[0],l={...original,setPieces:[],checkpoints:[],encounters:[],storyTerminals:[],missions:[],ground:[{x:0,y:400,w:original.width,h:180}],platforms:[],barriers:[],hazards:[],spikes:[],pickups:[]},r=createRun(l),e=r.enemies.find(e=>e.boss);r.enemies=[e];r.x=e.x-350;r.invincible=1000;e.age=3;e.hp=e.maxHp=maxHp;e.parts={tracks:maxHp*.28,gun:maxHp*.3,engine:maxHp*.42}
  const hit=()=>{const p=tankTarget(e);r.bullets.push({x:p.x,y:p.y,vx:0,vy:0,friendly:true,kind:'rifle',life:1,damage,pierce:1,hit:[]});frames(r,l,1)}
  let shots=0;while(e.hp>0&&shots++<3000){hit();assert.equal(e.hp,Math.max(0,Math.round(Object.values(e.parts).reduce((a,b)=>a+b,0)*100)/100))}
  assert.equal(e.hp,0,`hp=${maxHp}, damage=${damage}`);assert.equal(r.kills,1);assert.ok(r.effects.some(f=>f.kind==='boss'))
  // 已在浏览器内进行中的旧战斗也能在下一次命中时清掉虚假的残血。
  e.hp=.16;e.parts={tracks:0,gun:0,engine:0};r.kills=0;hit();assert.equal(e.hp,0);assert.equal(r.kills,1)
 }
})
