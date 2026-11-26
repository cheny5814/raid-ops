import{test}from'node:test'
import assert from'node:assert/strict'
import{build}from'esbuild'
const result=await build({entryPoints:[new URL('../app/utils/front-title-battle.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node'})
const {createTitleDemo,advanceTitleDemo,titleDemoCamera}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
test('宣传演示角色持续向前跑，敌人从当前镜头右侧屏外进入',()=>{
 const d=createTitleDemo();const tank=d.run.enemies.find(e=>e.type==='tank');let wasDormant=true,entered=false,lastX=d.run.x
 for(let i=0;i<18*120;i++){
  advanceTitleDemo(d,1/120)
  assert.ok(d.run.x>lastX,'Player must keep moving forward');assert.equal(d.input.right,true);lastX=d.run.x
  if(wasDormant&&!tank.dormant)assert.ok(tank.x-titleDemoCamera(d)>650)
  if(!tank.dormant&&tank.x-titleDemoCamera(d)<650)entered=true
  wasDormant=!!tank.dormant
 }
 assert.ok(entered);assert.ok(titleDemoCamera(d)>2000)
})
test('真实AI、弹道和伤害驱动演示：步兵无人机坦克开火，角色换枪并击败目标',()=>{
 for(const operative of['raven','fox']){
  const d=createTitleDemo(operative);let blast=false;const weapons=new Set()
  for(let i=0;i<24*30;i++){advanceTitleDemo(d,1/30);weapons.add(d.run.weapon);blast ||=d.run.effects.some(e=>['blast','boss','destroy'].includes(e.kind))}
  assert.equal(d.run.status,'playing');assert.equal(d.run.kills,5);assert.ok(d.run.stats.hits>0);assert.ok(d.run.enemies.every(e=>e.volleys>0));assert.ok(d.run.hp<10&&d.run.hp>0);assert.ok(blast);assert.ok(weapons.has('rapid')&&weapons.has('rocket'));assert.ok(d.clearAt)
 }
})
test('宣传演示使用独立战场，不修改原关卡或其他实例，暂停时间不会补跑',()=>{
 const a=createTitleDemo(),b=createTitleDemo();const before=JSON.stringify(b.run)
 for(let i=0;i<120;i++)advanceTitleDemo(a,1/30)
 assert.equal(JSON.stringify(b.run),before);const time=a.clock;advanceTitleDemo(a,100);assert.ok(a.clock-time<=.101)
})
