import {test} from 'node:test'
import assert from 'node:assert/strict'
import {FRONT_LEVELS,createRun,step,respawn} from '../app/utils/front.ts'
import {DESERT_LEVEL} from '../app/utils/front-desert-level.ts'
import {encodeSession,decodeSession} from '../app/utils/front-session.ts'
const levels=[...FRONT_LEVELS,DESERT_LEVEL]
const idle={left:false,right:false,jump:false,shoot:false,up:false,duck:false}
const campaign=l=>l.biome==='desert'?'sandstorm':'grayhaven'
const clone=v=>JSON.parse(JSON.stringify(v))

test('七关完整战场往返保存，恢复位置、敌人、机关及弹道后可继续同样的物理过程',()=>{
  for(const l of levels){
    const r=createRun(l,['rifle','pulse','rocket'],[],1200,'fox')
    for(let i=0;i<150;i++)step(r,l,{...idle,right:true,shoot:true,jump:i===30},1/120)
    assert.equal(r.status,'playing')
    r.enemies[0].hp=Math.max(.5,r.enemies[0].hp-1)
    r.pickups[0].taken=true
    r.interactives[0].triggered=true
    r.skillCooldown=2.5
    const restored=decodeSession(encodeSession(campaign(l),l,r,1000),FRONT_LEVELS,DESERT_LEVEL)
    assert.ok(restored,l.name);const expected=clone(r);expected.soundEvents=[]
    assert.deepEqual(restored.run,expected,l.name)
    for(let i=0;i<60;i++){step(r,l,idle,1/120);step(restored.run,l,idle,1/120)}
    r.soundEvents=[];restored.run.soundEvents=[]
    assert.deepEqual(clone(restored.run),clone(r),l.name)
  }
})

test('载具、绳索、滑索与检查点快照完整保存，不把恢复变成重新开关',()=>{
  const l=FRONT_LEVELS[0],r=createRun(l)
  const vehicle=r.tactics.find(t=>t.kind==='vehicle')
  if(vehicle){vehicle.state='operating';vehicle.x+=40;r.tacticalControl=vehicle.id}
  if(l.ropes.length){r.rope=l.ropes[0].id;r.ropeMotion[r.rope]={angle:.3,speed:1.2}}
  if(l.ziplines?.length){r.zipline={id:l.ziplines[0].id,t:.4,speed:90};r.rope=null}
  r.checkpoint=0
  r.saved={...clone(r),x:230,y:350}
  delete r.saved.saved
  r.x=450;r.hp=4;r.armor=2;r.grenades=1
  const saved=decodeSession(encodeSession('grayhaven',l,r),FRONT_LEVELS,DESERT_LEVEL)
  assert.ok(saved);assert.equal(saved.run.x,450);assert.equal(saved.run.hp,4)
  assert.deepEqual(saved.run.tactics,clone(r.tactics));assert.deepEqual(saved.run.ropeMotion,r.ropeMotion)
  assert.deepEqual(saved.run.zipline,r.zipline)
  const retry=respawn(saved.run,l);assert.equal(retry.x,230)
})

test('损坏、过期、错误关卡和已结束的战场不作为可继续存档',()=>{
  const l=FRONT_LEVELS[0],r=createRun(l),raw=encodeSession('grayhaven',l,r)
  assert.equal(decodeSession(null,FRONT_LEVELS,DESERT_LEVEL),null)
  for(const text of ['{',raw.slice(0,-10),'x'.repeat(4_010_001)])assert.equal(decodeSession(text,FRONT_LEVELS,DESERT_LEVEL),null)
  for(const delta of [{version:0},{levelId:99},{campaign:'unknown'},{checksum:'broken'},{layout:'old'},{payload:'{}'}]){
    assert.equal(decodeSession(JSON.stringify({...JSON.parse(raw),...delta}),FRONT_LEVELS,DESERT_LEVEL),null)
  }
  const changed=clone(FRONT_LEVELS);changed[0].platforms.push({x:100,y:200,w:20,h:10})
  assert.equal(decodeSession(raw,changed,DESERT_LEVEL),null)
  r.status='won';assert.throws(()=>encodeSession('grayhaven',l,r))
  r.status='playing';r.hp=0;assert.throws(()=>encodeSession('grayhaven',l,r))
})

test('快速开始首关：无旧存档时启用保存，有旧存档时不覆盖',async()=>{
  const {readFile}=await import('node:fs/promises'),{default:vm}=await import('node:vm')
  const source=await readFile(new URL('../app/components/game/RaidOpsGame.vue',import.meta.url),'utf8')
  const fn=source.slice(source.indexOf('function quickStart()'),source.indexOf('function titleStart()'))
  const calls=[]
  const box=vm.createContext({track(){},mode:{value:'ready'},panel:{value:null},savedGame:{value:null},radio:{value:null},chooseCampaign:id=>calls.push(id),select:id=>calls.push(id),start:save=>calls.push(save)})
  vm.runInContext(fn,box);vm.runInContext('quickStart()',box)
  assert.deepEqual(calls,['grayhaven',0,true])
  calls.length=0;box.savedGame.value={campaign:'sandstorm',levelId:0}
  vm.runInContext('quickStart()',box)
  assert.deepEqual(calls,['grayhaven',0,false])
})
