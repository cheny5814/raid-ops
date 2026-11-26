import{test}from'node:test'
import assert from'node:assert/strict'
import{FRONT_LEVELS,createRun,step,respawn}from'../app/utils/front.ts'
import{DESERT_LEVEL}from'../app/utils/front-desert-level.ts'
import{stepDungeonBoss,bossState,dungeonDamageScale}from'../app/utils/front-dungeons.ts'
import{ELITE_KITS,stepLieutenant}from'../app/utils/front-boss-tactics.ts'
const idle={left:false,right:false,jump:false,shoot:false,duck:false,up:false}
function arena(base=DESERT_LEVEL){return{...base,ground:[{x:0,y:400,w:base.width,h:180}],platforms:[],barriers:[],spikes:[],hazards:[],encounters:[],missions:[],storyTerminals:[],pickups:[],checkpoints:[],setPieces:[],field:undefined,desert:undefined}}
function duel(base=DESERT_LEVEL){const l=arena(base),r=createRun(l),e=r.enemies.find(e=>e.boss);r.enemies=[e];r.interactives=[];r.tactics=[];r.x=e.x-80;r.y=360;return{l,r,e}}
function frames(r,l,n,input=idle){for(let i=0;i<n&&r.status==='playing';i++)step(r,l,input,1/120)}
test('七关各有两名具名区域指挥官，均落在原有实体表面且不引入新墙体',()=>{
 const names=[]
 for(const l of[...FRONT_LEVELS,DESERT_LEVEL]){const elites=l.enemies.filter(e=>e.elite);assert.equal(elites.length,2,l.name)
  for(const e of elites){names.push(e.eliteName.zh);assert.ok(e.eliteName.en);assert.ok(ELITE_KITS[e.elite]);assert.ok(!e.boss);assert.ok(!e.dormant);assert.ok(e.x>l.width*.18&&e.x<l.width*.83);assert.ok([...l.ground,...l.platforms].some(g=>!g.rise&&e.x>=g.x&&e.x+e.w<=g.x+g.w&&(e.type==='drone'||Math.abs(e.y+e.h-g.y)<2)));assert.ok(!l.barriers.some(b=>e.x+e.w>b.x&&e.x<b.x+b.w&&e.y+e.h>b.y&&e.y<b.y+b.h))}
 }assert.equal(new Set(names).size,14)
})
test('沙蝎向玩家所在侧实际射击，车前车后均没有永久炮口盲区',()=>{
 for(const side of[-1,1]){const{l,r,e}=duel();e.age=1;e.cooldown=0;e.parts.tracks=0;r.x=side<0?e.x-70:e.x+e.w+45;const shots=[];stepDungeonBoss(r,l,e,1/120,{shot:(x,y,a)=>shots.push({x,y,a})});assert.ok(shots.length>=2);assert.ok(shots.every(s=>Math.sign(Math.cos(s.a))===side));assert.ok(shots.some(s=>Math.abs(Math.sin(s.a))<.45),'炮口需覆盖接地人物，不能始终从头顶越过')}
})
test('沙蝎完整轮组或断轮后，左右履带旁站桩都实际受击；攻击有可见预警',()=>{
 for(const broken of[false,true])for(const side of[-1,1]){const{l,r,e}=duel();if(broken)e.parts.tracks=0;r.x=side<0?e.x-35:e.x+e.w+10;frames(r,l,12);assert.equal(r.hp,10);assert.ok(r.threats.some(t=>t.owner===e.id&&t.warning>.8));frames(r,l,1800);assert.ok(r.stats.damage>=2,`broken ${broken} side ${side} 不能永久无伤站桩`)}
})
test('沙蝎标记锁定后不追随玩家，离开落点能避开爆炸，冲撞与回位连续',()=>{
 const{l,r,e}=duel();r.x=e.x-330;frames(r,l,12);const marker=r.threats.find(t=>t.kind==='bomb'),x=marker.x;assert.ok(marker);r.x-=150;frames(r,l,12);assert.equal(marker.x,x)
 let old=e.x;for(let i=0;i<720&&r.status==='playing';i++){step(r,l,idle,1/120);assert.ok(Math.abs(e.x-old)<7,'车辆不能瞬移回位');old=e.x}
})
test('各关首领都有独立预警招式，最终核心保留护盾条件与回充反击窗口',()=>{
 const labels=[];for(const base of FRONT_LEVELS){const{l,r,e}=duel(base);e.age=base.id===3?3.5:base.id===4?2.7:.1;e.cooldown=10;stepDungeonBoss(r,l,e,1/120,{shot(){}});const signature=r.threats.filter(t=>t.hint);assert.ok(signature.length,base.name);assert.ok(signature.every(t=>t.warning>=.9&&t.owner===e.id));labels.push(signature[0].hint.zh)}assert.equal(new Set(labels).size,6)
 const{r,e}=duel(FRONT_LEVELS[5]);r.interactives=[{kind:'relay',hp:8}];e.age=4.5;assert.equal(dungeonDamageScale(r,e,'beam'),0);r.interactives[0].hp=0;e.age=1;assert.equal(bossState(r,e).open,false);const closed=dungeonDamageScale(r,e,'beam');e.age=4.5;assert.ok(bossState(r,e).open);assert.ok(dungeonDamageScale(r,e,'beam')>closed*4)
})
test('指挥官招式分为盾击、迫击、拦截、狙击和放电，预警后有装填反击空隙',()=>{
 for(const kind of Object.keys(ELITE_KITS)){const base=FRONT_LEVELS.find(l=>l.enemies.some(e=>e.elite===kind)),l=arena(base),r=createRun(l),e=r.enemies.find(e=>e.elite===kind);r.x=e.x-180;r.y=360;e.age=.1;const shots=[];stepLieutenant(r,l,e,1/120,{shot:(...a)=>shots.push(a)});assert.equal(shots.length,0);if(kind!=='interceptor')assert.ok(r.threats.every(t=>t.warning>=1.2));e.age=4;e.cooldown=0;stepLieutenant(r,l,e,1/120,{shot:(...a)=>shots.push(a)});assert.equal(shots.length,0,'装填窗口不应继续射击')}
})
test('首领或区域指挥官阵亡后，所属预警立即取消；重试恢复身份和独立血量',()=>{
 const{l,r,e}=duel();r.threats=[{owner:e.id,kind:'bomb',x:r.x,y:r.y,w:50,h:40,warning:.01,active:1}];e.hp=0;frames(r,l,3);assert.equal(r.hp,10);assert.equal(r.threats.length,0)
 const source=FRONT_LEVELS[0],run=createRun(source),elite=run.enemies.find(e=>e.elite);elite.hp=1;const retry=respawn(run,source),copy=retry.enemies.find(e=>e.id===elite.id);assert.equal(copy.hp,copy.maxHp);assert.deepEqual(copy.eliteName,elite.eliteName);assert.equal(elite.hp,1)
})

test('铁锚引擎阶段仍向玩家所在侧射击，炮击后保留反击窗口',()=>{
 for(const stage of['tracks','gun','engine'])for(const side of[-1,1]){
  const{l,r,e}=duel(FRONT_LEVELS[0]);e.parts={tracks:stage==='tracks'?60:0,gun:stage==='engine'?0:66,engine:94};e.hp=Object.values(e.parts).reduce((a,b)=>a+b,0);r.x=side<0?e.x-110:e.x+e.w+85;e.age=1;e.cooldown=0;const shots=[]
  stepDungeonBoss(r,l,e,1/120,{shot:(x,y,a)=>shots.push({x,y,a})});assert.ok(shots.length);assert.ok(shots.every(s=>Math.sign(Math.cos(s.a))===side));assert.ok(shots.every(s=>Math.abs(Math.sin(s.a))<.45))
  e.age=3.5;e.cooldown=0;stepDungeonBoss(r,l,e,1/120,{shot(){assert.fail('装填间隙不能继续开火')}})
 }
})
test('铁锚炮击与预警招式实际扣两格血，普通敌人仍扣一格，护甲先抵扣',()=>{
 for(const armor of[0,1,3]){
  const{l,r,e}=duel(FRONT_LEVELS[0]);r.x=e.x-350;r.armor=armor;e.age=3;e.cooldown=100;e.bossCycle=0;e.bossSpecialCycle=0
  r.threats=[{owner:e.id,kind:'bomb',x:r.x-5,y:350,w:45,h:50,warning:0,active:.2}];frames(r,l,1)
  assert.equal(r.hp,10-Math.max(0,2-armor));assert.equal(r.armor,Math.max(0,armor-2));assert.equal(r.stats.damage,Math.max(0,2-armor));assert.equal(r.stats.blocked,Math.min(2,armor))
 }
 const{l,r,e}=duel(FRONT_LEVELS[0]);e.age=1;e.cooldown=0;r.x=e.x-180;frames(r,l,1);assert.ok(r.bullets.some(b=>!b.friendly&&b.damage===2))
 const normal=duel(FRONT_LEVELS[1]);normal.r.x=normal.e.x-350;normal.e.cooldown=100;normal.r.bullets=[{x:normal.r.x+13,y:normal.r.y+20,vx:0,vy:0,life:1,pierce:1,hit:[],friendly:false,kind:'enemy',damage:1,enemyShot:'round'}];frames(normal.r,normal.l,1);assert.equal(normal.r.hp,9)
})
