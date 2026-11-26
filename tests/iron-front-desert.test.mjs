import{readFileSync}from'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {FRONT_LEVELS,createRun,step,respawn,equipWeapon,WEAPON_ORDER,exitOpen} from '../app/utils/front.ts'
import {DESERT_LEVEL,createDesertLevel} from '../app/utils/front-desert-level.ts'
import {desertSand,desertDecks} from '../app/utils/front-desert.ts'
import {bossState,stepDungeonBoss,dungeonDamageScale} from '../app/utils/front-dungeons.ts'
const idle={left:false,right:false,shoot:false,jump:false,up:false,duck:false}
const frames=(r,l,n,input={})=>{for(let i=0;i<n;i++)step(r,l,{...idle,...input},1/120)}
function arena(){const l=createDesertLevel();l.ground=[{x:0,y:400,w:2000,h:180}];l.width=2000;l.platforms=[];l.enemies=[];l.encounters=[];l.missions=[];l.storyTerminals=[];l.ladders=[];l.ropes=[];l.checkpoints=[];l.pickups=[];l.barriers=[];l.desert.sand=[{x:200,y:396,w:210,h:22}];return l}
test('沙漠为独立五分钟路线，原六关未改，三项情报与武器试炼都有可达位置',()=>{
 const before=JSON.stringify(FRONT_LEVELS);const l=createDesertLevel();assert.equal(JSON.stringify(FRONT_LEVELS),before);assert.equal(FRONT_LEVELS.length,6);assert.ok(l.width/225>=300);assert.equal(l.storyTerminals.length,3);assert.ok(l.desert.sand.length>10);assert.ok(l.desert.towerIds.length>2)
 for(const t of l.storyTerminals){assert.ok(l.ground.some(g=>t.x>=g.x&&t.x+t.w<=g.x+g.w));assert.ok(l.encounters[t.encounter].enemies.every(id=>l.enemies.some(e=>e.id===id)))}
 assert.ok(l.missions.every(m=>m.id===FRONT_LEVELS[0].missions.find(a=>a.reward===m.reward)?.id))
})
test('流沙实际减速和困陷伤害，跳跃或冲刺能离开；普通地面不受影响',()=>{
 const l=arena(),r=createRun(l);r.x=210;frames(r,l,60,{right:true});assert.ok(r.x<270);assert.ok(desertSand(l,r));const hp=r.hp;frames(r,l,360);assert.ok(r.hp<hp);frames(r,l,1,{jump:true});frames(r,l,15);assert.ok(!desertSand(l,r));assert.ok(r.sandTime<2)
 const dash=createRun(l);dash.x=210;frames(dash,l,1,{skill:true});frames(dash,l,20,{right:true});assert.ok(dash.x>320)
 const plain=createRun(l);plain.x=500;frames(plain,l,60,{right:true});assert.ok(plain.x>610);assert.equal(plain.hp,10)
})
test('射击水塔支架使其倒下，落稳后提供真实落脚面并消除该段流沙；重试还原未存档机关',()=>{
 const l=arena();l.barriers=[{id:180001,x:170,y:235,w:25,h:165,hp:6,maxHp:6,material:'crate',waterTower:true}];const r=createRun(l);r.x=65;frames(r,l,120,{shoot:true});assert.equal(r.barriers[0].hp,0);assert.equal(desertDecks(r).length,1);r.x=220;r.y=360;r.grounded=true;frames(r,l,30);assert.equal(r.y+40,400);assert.ok(!desertSand(l,r));assert.equal(respawn(r,l).barriers[0].hp,6)
})
test('沙蝎先拆轮组再开尾部引擎，装甲窗口有伤害差异，炮击和预警实际生成',()=>{
 const l=createDesertLevel(),r=createRun(l),e=r.enemies.find(e=>e.desertBoss);assert.ok(e);assert.equal(e.parts.gun,0);assert.match(bossState(r,e).label.en,/wheels/i);e.parts.tracks=0;e.age=1;assert.ok(!bossState(r,e).open);const closed=dungeonDamageScale(r,e,'rifle');e.age=3.5;assert.ok(bossState(r,e).open);assert.ok(dungeonDamageScale(r,e,'rifle')>closed*5)
 e.cooldown=.1;let shots=0;for(let i=0;i<180;i++){e.age+=1/120;stepDungeonBoss(r,l,e,1/120,{shot:()=>shots++})}assert.equal(shots,0,'散热反击窗口应停火');e.age=6.95;e.cooldown=0;stepDungeonBoss(r,l,e,1/120,{shot:()=>shots++});assert.ok(shots>=2);assert.ok(r.threats.length>0)
})

test('沙海前哨从初始步枪实际跑通，途中缴获武器与升级，完成全部情报并击败沙蝎',()=>{
 const route=JSON.parse(readFileSync(new URL('./fixtures/iron-front-desert-route.json',import.meta.url),'utf8'));const l=DESERT_LEVEL;let r=createRun(l)
 for(const[a,n]of route)for(let i=0;i<n;i++){if(a>=128&&a<134){assert.ok(equipWeapon(r,WEAPON_ORDER[a-128]));continue}if(a===32){r=respawn(r,l);continue}step(r,l,{...idle,aimAssist:!(a&1024),shoot:true,skill:!!(a&512),interact:!!(a&256),left:!!(a&16),right:!!(a&1),jump:!!(a&2),up:!!(a&4),duck:!!(a&64),grenade:!!(a&8)},1/120)}
 assert.equal(r.status,'won');assert.ok(exitOpen(r));assert.equal(r.storyCompleted.length,3);assert.equal(r.enemies.find(e=>e.desertBoss).hp,0);assert.ok(r.weaponXp>0);assert.ok(r.time>=300&&r.time<600);assert.ok(r.arsenal.length>=5)
})

test('沙漠新增低矮路障和高处交火点，路障贴地且不堵住存档点与滑索两岸',()=>{
 const l=createDesertLevel(),cover=l.barriers.filter(b=>b.id>=195000&&b.id<196000)
 assert.ok(cover.length>=12);assert.ok(l.platforms.length>=5);assert.ok(l.pickups.length<=21);assert.equal(l.pickups.filter(p=>p.type==='med').length,11)
 for(const b of cover){assert.ok(l.ground.some(g=>!g.rise&&b.x>=g.x&&b.x+b.w<=g.x+g.w&&b.y+b.h===g.y));assert.ok(b.h<=54);assert.ok(!l.checkpoints.some(x=>x+26>b.x&&x<b.x+b.w));assert.ok(!l.ziplines.some(z=>Math.abs(z.x-b.x)<100||Math.abs(z.endX-b.x)<100))}
 assert.ok(l.pickups.some(p=>p.type==='med'&&p.x>l.width-1000),'保留关底医疗包')
})

test('沙漠敌人数和初始巡逻密度不低于港口，整条路线有地面与空中编队',()=>{
 const l=createDesertLevel(),port=FRONT_LEVELS[0],active=l.enemies.filter(e=>!e.boss&&!e.dormant)
 assert.ok(l.enemies.length>=port.enemies.length);assert.ok(active.length/l.width>=port.enemies.filter(e=>!e.boss&&!e.dormant).length/port.width)
 for(let x=0;x<l.width;x+=5000){const end=Math.min(l.width,x+5000);assert.ok(active.filter(e=>e.x>=x&&e.x<end).length>=Math.floor((end-x)/300),`沙漠 ${x}–${end} 巡逻密度不足`)}
 assert.ok(active.filter(e=>e.type==='drone').length>=40)
 for(const e of l.enemies){assert.ok(l.ground.some(g=>e.x+e.w/2>=g.x&&e.x+e.w/2<g.x+g.w),'敌人不能出生在断崖空位');assert.ok(!l.barriers.some(b=>e.x+e.w>b.x&&e.x<b.x+b.w&&e.y+e.h>b.y&&e.y<b.y+b.h),'敌人不能出生在路障内部')}
})
