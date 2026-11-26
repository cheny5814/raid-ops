import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import { createRenderer, nextTick, h } from 'vue'
const require = createRequire(import.meta.url)
const source = await readFile(new URL('../app/components/game/GameHost.vue', import.meta.url), 'utf8')
const descriptor = parse(source).descriptor
async function mountHost(loaderExpression) {
  // Mock only the dynamic module request; execute the real component and its UI handlers.
  const compiled = compileScript(descriptor, { id: 'host-test', inlineTemplate: true }).content
    .replace("import('./RaidOpsGame.vue')", loaderExpression)
  const js = transformSync('let requests=0;\n' + compiled, { loader: 'ts', format: 'esm' }).code
    .replaceAll('from "vue"', 'from ' + JSON.stringify(pathToFileURL(require.resolve('vue')).href))
  const Host = (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))).default
  const node = (type, text = '') => ({ type, text, children: [], parent: null, props: {}, focus() {} })
  const renderer = createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
    setText: (n, text) => { n.text = text }, setElementText: (n, text) => { n.text = text; n.children = [] },
    patchProp: (n, key, old, value) => { n.props[key] = value }, parentNode: n => n.parent,
    nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1] ?? null,
    insert(n, parent, anchor) { if(n.parent) this.remove(n); n.parent=parent; const i=parent.children.indexOf(anchor); parent.children.splice(i<0?parent.children.length:i,0,n) },
    remove(n) { if(n.parent){n.parent.children.splice(n.parent.children.indexOf(n),1);n.parent=null} },
    querySelector: () => null, setScopeId() {}, insertStaticContent() { throw Error('Unexpected static content') },
  })
  const root=node('root'), activity=[]
  const app=renderer.createApp(Host,{onActive:active=>activity.push(active)})
  app.component('GameLoading',{render:()=>h('p','Loading')})
  app.component('NuxtLink',{render(){return h('a',this.$slots.default?.())}})
  app.mount(root)
  const flush=async()=>{for(let i=0;i<8;i++){await Promise.resolve();await nextTick()}}
  const descendants=(n=root)=>[n,...n.children.flatMap(c=>descendants(c))]
  const text=n=>n.text+n.children.map(text).join('')
  return {app,flush,activity,all:()=>descendants(),text:()=>text(root)}
}
test('游戏模块加载失败后显示说明，点击重试能实际重新加载',async()=>{
  const x=await mountHost("(++requests === 1 ? Promise.reject(new Error('offline')) : Promise.resolve({default:{emits:['active'],render(){return 'Battlefield loaded'}}}))")
  await x.flush();assert.match(x.text(),/could not load/);assert.match(x.text(),/saved weapons/)
  const retry=x.all().find(n=>n.type==='button'&&n.text==='Try again');assert.ok(retry);retry.props.onClick()
  await x.flush();assert.match(x.text(),/Battlefield loaded/);assert.doesNotMatch(x.text(),/could not load/);x.app.unmount()
})
test('游戏加载超时显示恢复提示',async t=>{
  t.mock.timers.enable({apis:['setTimeout']})
  const x=await mountHost('new Promise(() => {})');await x.flush();assert.match(x.text(),/Loading/)
  t.mock.timers.tick(20001);await x.flush();assert.match(x.text(),/could not load/);x.app.unmount()
})
test('组件初始化出错由加载器接住，并解除战斗页面状态',async()=>{
  const x=await mountHost("Promise.resolve({default:{emits:['active'],render(){return null},setup(){throw new Error('initialization failed')}}})")
  await x.flush();assert.match(x.text(),/could not load/);assert.equal(x.activity.at(-1),false);x.app.unmount()
})
