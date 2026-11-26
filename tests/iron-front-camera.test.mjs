import{test}from'node:test'
import assert from'node:assert/strict'
import{FRONT_LEVELS,createRun,aimSolution,step}from'../app/utils/front.ts'
import{DESERT_LEVEL}from'../app/utils/front-desert-level.ts'
import{battleView}from'../app/utils/front-camera.ts'
const idle={left:false,right:false,jump:false,shoot:false,up:false,duck:false,aimAssist:true}
test('港口全程采用固定视野和78%地面线，普通桌面宽度保留620单位前方预警空间',()=>{
 const l=FRONT_LEVELS[0],r=createRun(l);r.x=12000
 for(const width of[854,960,1200]){const v=battleView(l,r,width);assert.equal(v.zoom,1);assert.ok(v.x+v.worldWidth-r.x>=620);assert.ok(Math.abs((400-v.y)*v.zoom/480-.78)<.001);assert.equal(v.worldWidth*v.zoom,width)}
})
test('滑索、摆索、首领、竖井与其他战役保留宽视野',()=>{
 for(const l of[...FRONT_LEVELS.slice(1),DESERT_LEVEL]){const r=createRun(l);r.x=12000;assert.equal(battleView(l,r,960).zoom,1)}
 const l=FRONT_LEVELS[0],r=createRun(l);r.x=12000;r.y=190;assert.equal(battleView(l,r,960).zoom,1);r.y=360;r.rope=0;assert.equal(battleView(l,r,960).zoom,1);r.rope=null;r.x=l.enemies.find(e=>e.boss).x-400;assert.equal(battleView(l,r,960).zoom,1)
})
test('点按或原地转身不触发长距离甩镜头，持续反向行走只有有限前瞻',()=>{
 const l={...FRONT_LEVELS[0],enemies:[],ropes:[],ziplines:[],setPieces:[]},r=createRun(l);r.x=12000;let v=battleView(l,r,960);const x=v.x;r.facing=-1
 for(let i=0;i<120;i++)v=battleView(l,r,960,v,1/60);assert.equal(v.facing,1);assert.equal(v.x,x)
 let last=v.x
 for(let i=0;i<90;i++){r.x-=2.5;v=battleView(l,r,960,v,1/60);assert.ok(Math.abs(v.x-last)<9);last=v.x}
 assert.equal(v.facing,-1);assert.ok(v.look<-.99);assert.ok(r.x-v.x-v.worldWidth*v.anchor<85)
})
test('短点按 A 后松手不会等待一段时间再滑动，持续走动后松手也立即停止前瞻',()=>{
 const l={...FRONT_LEVELS[0],enemies:[],ropes:[],ziplines:[],setPieces:[]},r=createRun(l);r.x=12000;let v=battleView(l,r,960);r.facing=-1
 for(let i=0;i<4;i++){r.x-=3;v=battleView(l,r,960,v,1/60)}const tapped=v.x
 for(let i=0;i<120;i++)v=battleView(l,r,960,v,1/60);assert.ok(Math.abs(v.x-tapped)<.01)
 for(let i=0;i<22;i++){r.x-=3;v=battleView(l,r,960,v,1/60)}const released=v.x,look=v.look
 for(let i=0;i<120;i++)v=battleView(l,r,960,v,1/60);assert.ok(Math.abs(v.x-released)<.01);assert.equal(v.look,look)
 r.facing=1;for(let i=0;i<120;i++)v=battleView(l,r,960,v,1/60);assert.ok(Math.abs(v.x-released)<.01)
})
test('辅助瞄准使用画面同一可见边界，屏外、上方不可见敌人不会被锁定',()=>{
 const base=FRONT_LEVELS[0],l={...base,ground:[{x:0,y:400,w:base.width,h:180}],platforms:[],barriers:[],field:undefined,setPieces:[],encounters:[],storyTerminals:[],missions:[],hazards:[],spikes:[],checkpoints:[],pickups:[]},r=createRun(l);r.x=12000;r.interactives=[];r.tactics=[]
 const v=battleView(l,r,960);const source=base.enemies.find(e=>e.type==='soldier'&&!e.elite);r.enemies=[{...source,id:991,x:v.x+v.worldWidth+2,y:362,hp:6,maxHp:6,dormant:false}];assert.equal(aimSolution(r,l,{...idle,view:v}).target,null)
 r.enemies[0].x=r.x+300;assert.equal(aimSolution(r,l,{...idle,view:v}).target?.id,991);r.enemies[0].y=v.y-100;assert.equal(aimSolution(r,l,{...idle,up:true,view:v}).target,null)
})
test('镜头计算不改变位置、碰撞、存档或敌人状态，窗口改变后边界有效',()=>{
 const l=FRONT_LEVELS[0],r=createRun(l);r.x=l.width-100;const before=JSON.stringify(r);for(const width of[460,854,1920]){const v=battleView(l,r,width);assert.ok(v.x>=0&&v.x+v.worldWidth<=l.width+.001)}assert.equal(JSON.stringify(r),before)
})

test('高台跳跃跨过原高度阈值，背景、取景锚点和缩放都不来回移动',()=>{
 for(const width of[765,960]){const l={...FRONT_LEVELS[0],ground:[{x:0,y:325,w:70000,h:255}],platforms:[],enemies:[],barriers:[],hazards:[],spikes:[],encounters:[],storyTerminals:[],missions:[],checkpoints:[],pickups:[],field:undefined,setPieces:[],ropes:[],ziplines:[],ladders:[]},r=createRun(l);r.x=12000;r.y=285;r.interactives=[];r.tactics=[];let v=battleView(l,r,width);const initial={...v};let high=285;
 for(let i=0;i<100;i++){step(r,l,{...idle,jump:i===0},1/60);v=battleView(l,r,width,v,1/60);high=Math.min(high,r.y);assert.ok(Math.abs(v.x-initial.x)<.001);assert.ok(Math.abs(v.y-initial.y)<.001);assert.equal(v.zoom,initial.zoom);assert.equal(v.anchor,initial.anchor)}assert.ok(high<230);assert.ok(r.grounded);}
})
test('原地重新计算显示尺寸保留镜头状态，首领倒下也不立即改变取景',()=>{
 const l={...FRONT_LEVELS[0],enemies:[],ropes:[],ziplines:[],setPieces:[],ladders:[]},r=createRun(l);r.x=12000;let v=battleView(l,r,960);for(let i=0;i<30;i++){r.x-=3;v=battleView(l,r,960,v,1/60)}const next=battleView(l,r,960,v,0);for(const key of['x','y','look','anchor','zoom'])assert.equal(next[key],v[key]);
 r.enemies=[{...FRONT_LEVELS[0].enemies.find(e=>e.boss),x:12500,home:12500,hp:1}];v=battleView(l,r,960);assert.equal(v.zoom,1);r.enemies[0].hp=0;assert.equal(battleView(l,r,960,v,1/60).y,v.y);
})

test('真实七关路线经过绳索、滑索、梯子和首领区域时，地面屏幕高度保持稳定',()=>{
 for(const l of[...FRONT_LEVELS,DESERT_LEVEL])for(const width of[460,765,854,960,1200]){
  const r=createRun(l);let v=battleView(l,r,width);const y=v.y,zoom=v.zoom,anchor=v.anchor
  // 保留真实场景数据，连续往返跨过所有互动区的进入和离开边界。
  for(const direction of[1,-1])for(let x=direction===1?0:l.width;direction===1?x<=l.width:x>=0;x+=direction*40){
   r.x=x;r.y=360-Math.max(0,Math.sin(x/80))*220;r.facing=direction
   v=battleView(l,r,width,v,1/60)
   assert.equal(v.y,y,`${l.id}: x=${x}, width=${width} 行走和跳跃不得移动镜头高度`)
   assert.equal(v.zoom,zoom);assert.equal(v.anchor,anchor)
  }
  for(const key of['rope','zipline','ladder'])for(const state of[0,null]){r[key]=state;v=battleView(l,r,width,v,1/60);assert.equal(v.y,y);assert.equal(v.zoom,zoom);assert.equal(v.anchor,anchor)}
  r.status='won';v=battleView(l,r,width,v,1/60);assert.equal(v.y,y);assert.equal(v.zoom,zoom)
 }
})
