import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { transformSync } from 'esbuild'

test('首页长时间运行后仍只画一张固定远景，人物和前景继续运动', async () => {
  const source = await readFile(new URL('../app/utils/front-art.ts', import.meta.url), 'utf8')
  const fn = source.slice(source.indexOf('export function titleMotion('), source.indexOf('\nexport {drawOperativeFront'))
  const painted = [], transforms = [], battleBounds = []
  const context = { save() {}, restore() {}, translate(...args) { transforms.push(args) }, scale() {} }
  const box = vm.createContext({
    INFANTRY_VISUAL_SCALE: 1,
    WAR_PALETTES: [{accent:'#fff'}],
    drawBackdrop(c, level, width) { painted.push({width, transforms: [...transforms]}) },
    drawDeck() {}, drawTitleCamp() {}, drawTitleSupplies() {}, drawTitleBattle(c,left,right){battleBounds.push({left,right})}, titleDemoTravel(){return 0}, glow() {},
    titleFigurePlacement() { return {x:900,scale:1} },
    trooper() { return {x:0,y:0,angle:0} }, drawInfantryWeapon() {},
    context, level: {id:0,dungeon:{surface:'metal'}},
  })
  vm.runInContext(transformSync(fn.replaceAll('export function','function'), {loader:'ts'}).code, box)
  for (const elapsed of [0, 80, 160, 3600]) {
    transforms.length = 0
    box.elapsed = elapsed
    vm.runInContext('drawFrontTitle(context,level,1200,elapsed)', box)
    assert.deepEqual(painted.at(-1),{width:1200,transforms:[]})
    assert.equal(vm.runInContext('titleMotion(elapsed).backdrop',box),0)
  }
  assert.equal(painted.length,4)
  assert.deepEqual(battleBounds,Array.from({length:4},()=>({left:0,right:1200})))
  assert.ok(vm.runInContext('titleMotion(160).deck>titleMotion(80).deck',box))
  assert.ok(vm.runInContext('titleMotion(160).stride>titleMotion(80).stride',box))
})
