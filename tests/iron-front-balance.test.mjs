import{test}from'node:test'
import assert from'node:assert/strict'
import{FRONT_LEVELS,createRun,step}from'../app/utils/front.ts'
import{thinFieldSupplies}from'../app/utils/front-route-features.ts'
const idle={left:false,right:false,jump:false,shoot:false,up:false,duck:false}
test('适量补回医疗包，其他补给维持限额，关底医疗包和拾取编号保留',()=>{
 const l={width:10000,pickups:['med','armor','grenades'].flatMap((type,i)=>Array.from({length:8},(_,n)=>({id:i*100+n,x:100+n*500,type,taken:false}))),};l.pickups.push({id:999,x:9700,type:'med',taken:false});thinFieldSupplies(l)
 assert.equal(l.pickups.length,19);assert.ok(l.pickups.some(p=>p.id===999));assert.ok(!l.pickups.some(p=>[1,7,101,105,201,205].includes(p.id)))
})
test('基础步兵火力适度放缓，保留明确预警和连续交火压力',()=>{
 const l={...FRONT_LEVELS[0],ground:[{x:0,y:400,w:2000,h:180}],field:undefined,width:2000,barriers:[],platforms:[],hazards:[],spikes:[],encounters:[],missions:[],storyTerminals:[],checkpoints:[],setPieces:[],enemies:[{...FRONT_LEVELS[0].enemies.find(e=>e.type==='soldier'&&!e.guard),x:400,home:400,y:362,homeY:362,role:undefined,crossfire:undefined,cooldown:0}]},r=createRun(l);r.interactives=[];r.tactics=[];r.invincible=100;let warnings=0
 for(let i=0;i<2400;i++){step(r,l,idle,1/120);if(r.enemies[0].windup>0)warnings++}
 assert.ok(r.enemies[0].volleys>=5&&r.enemies[0].volleys<=7);assert.ok(warnings>200,'预警未被跳过')
})

test('沙漠装饰碎石逐块贴合坡面，越过断崖时不画出悬空石块',async()=>{
 const{buildSync}=await import('esbuild');const code=buildSync({entryPoints:['app/utils/front-desert-draw.ts'],bundle:true,platform:'node',format:'esm',write:false}).outputFiles[0].text;const{desertProps}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));const {DESERT_LEVEL:l}=await import('../app/utils/front-desert-level.ts');const{surfaceY}=await import('../app/utils/front-route-features.ts');let tx=0,ty=0,path=[],pebbles=[];const stack=[]
 const c=new Proxy({fillStyle:''},{get(o,k){if(k in o)return o[k];if(k==='save')return()=>stack.push([tx,ty]);if(k==='restore')return()=>{[tx,ty]=stack.pop()};if(k==='translate')return(x,y)=>{tx+=x;ty+=y};if(k==='beginPath')return()=>{path=[]};if(k==='moveTo'||k==='lineTo')return(x,y)=>path.push({x:x+tx,y:y+ty});if(k==='fill')return()=>{if(o.fillStyle==='#9b734d')pebbles.push([...path])};if(String(k).startsWith('create'))return()=>({addColorStop(){}});return()=>{}},set(o,k,v){o[k]=v;return true}})
 for(const camera of[700,3300,8200,14300,20500])desertProps(c,camera,960,l)
 assert.ok(pebbles.length>50)
 for(const points of pebbles){assert.ok(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))<=5);let closest=Infinity;for(const p of points){const g=l.ground.find(g=>p.x>=g.x&&p.x<=g.x+g.w);assert.ok(g,'碎石不能画在无地面的裂谷');const gap=surfaceY(g,p.x)-p.y;assert.ok(gap>=-.01);closest=Math.min(closest,gap)}assert.ok(closest<=3,'石块底边应贴近当前坡面')}
})

test('后期关卡和沙漠巡逻保留强化血量，首领及分段装甲血量同步',async()=>{
 const{DESERT_LEVEL}=await import('../app/utils/front-desert-level.ts');const{effectiveDamage,weaponStats}=await import('../app/utils/front.ts');const{MAX_WEAPON_XP}=await import('../app/utils/front-growth.ts')
 for(const l of [...FRONT_LEVELS.slice(3),DESERT_LEVEL]){const r=createRun(l,undefined,undefined,MAX_WEAPON_XP),shot=weaponStats(r,'rifle').damage;for(const e of r.enemies.filter(e=>!e.boss)){assert.ok(e.hp>effectiveDamage('rifle',e,shot),`${l.name} ${e.type} 不应被满级步枪一发击倒`);assert.equal(e.hp,e.maxHp)}}
 assert.equal(DESERT_LEVEL.enemies.find(e=>e.desertBoss).maxHp,180)
})

test('七关都补入新增巡逻，新增单位不占任务区、机关区、存档点和实体障碍',async()=>{
 const{DESERT_LEVEL}=await import('../app/utils/front-desert-level.ts');const before=[356,411,413,456,432,492,380]
 for(const [i,l]of [...FRONT_LEVELS,DESERT_LEVEL].entries()){assert.ok(l.enemies.length>before[i],l.name+'数量必须实际增加');const patrol=l.enemies.filter(e=>e.id>=500000);assert.ok(patrol.length>0)
  for(const e of patrol){assert.ok(l.ground.some(g=>!g.rise&&e.x>=g.x&&e.x+e.w<=g.x+g.w));assert.ok(!l.checkpoints.some(x=>Math.abs(x-e.x)<70));assert.ok(!l.encounters.some(a=>e.x>a.x-100&&e.x<a.end+100));assert.ok(!l.barriers.some(b=>e.x+e.w>b.x&&e.x<b.x+b.w&&e.y+e.h>b.y&&e.y<b.y+b.h))}
 }
})
test('首领加血时分段装甲同步加厚，重复规范化不会叠加血量',async()=>{
 const{createDesertLevel}=await import('../app/utils/front-desert-level.ts');const{fortifyPatrols}=await import('../app/utils/front-balance.ts');const l=createDesertLevel(),boss=l.enemies.find(e=>e.boss),before=JSON.stringify(l.enemies);assert.equal(boss.maxHp,180);assert.ok(Math.abs(boss.parts.tracks+boss.parts.gun+boss.parts.engine-180)<.001);fortifyPatrols(l);assert.equal(JSON.stringify(l.enemies),before)
})

test('每关少量补回血包并保留关底补给，未恢复成沿路大量投放',async()=>{
 const{DESERT_LEVEL}=await import('../app/utils/front-desert-level.ts');const previous=[8,10,10,11,11,11,10]
 for(const[i,l]of [...FRONT_LEVELS,DESERT_LEVEL].entries()){const packs=l.pickups.filter(p=>p.type==='med');assert.ok(packs.length>previous[i]&&packs.length<=previous[i]+2);assert.ok(packs.some(p=>p.x>l.width-1000))}
})

test('前三关适配零经验初始步枪，普通兵两至四枪击倒，血量与火力逐步递增',async()=>{
 const{effectiveDamage,WEAPONS}=await import('../app/utils/front.ts');const{fortifyPatrols}=await import('../app/utils/front-balance.ts')
 const previous=[12,12,12];let last=0
 for(const [i,l]of FRONT_LEVELS.slice(0,3).entries()){
  const r=createRun(l),soldier=r.enemies.find(e=>e.type==='soldier'&&!e.boss),damage=effectiveDamage('rifle',soldier,WEAPONS.rifle.damage),hits=Math.ceil(soldier.hp/damage)
  assert.equal(r.weaponXp,0);assert.ok(hits>=2&&hits<=4);assert.ok(soldier.hp<previous[i]);assert.ok(soldier.hp>last);last=soldier.hp
  assert.ok(l.difficulty.cooldown>[2,1.82,1.64][i]);assert.ok(l.difficulty.windup>[.36,.34,.32][i]);assert.ok(l.difficulty.bulletSpeed<[165,185,205][i])
  const boss=l.enemies.find(e=>e.boss);if(i===0)assert.equal(boss.maxHp,220);else assert.ok(boss.maxHp<[156,216,264][i]);if(boss.parts)assert.ok(Math.abs(Object.values(boss.parts).reduce((a,b)=>a+b,0)-boss.maxHp)<.001)
  const before=JSON.stringify(l.enemies);fortifyPatrols(l);assert.equal(JSON.stringify(l.enemies),before,'重复规范化不应继续减血')
 }
})
