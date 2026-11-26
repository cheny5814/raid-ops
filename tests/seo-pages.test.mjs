import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { SITE, PUBLIC_PAGES, indexedPaths, canonicalUrl, pageSeo, canonicalPagePath } from '../shared/site.ts'
import { SITE_OWNER, ownerInfoReady, contactInfoReady } from '../shared/site-owner.ts'
import { GAME_FACTS } from '../app/content/game-facts.ts'
import { gameSiteSchema } from '../app/content/site-schema.ts'
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
test('导航、SEO与站点地图共用已启用的页面，按照已确认署名及联系信息分别启用条款与联系入口', async () => {
  assert.equal(new Set(PUBLIC_PAGES.map(p => p.path)).size, PUBLIC_PAGES.length)
  assert.ok(PUBLIC_PAGES.every(p => p.title.includes(SITE.name) && p.description && p.path !== '/play'))
  assert.deepEqual(indexedPaths(), PUBLIC_PAGES.filter(p => p.index).map(p => p.path))
  for (const p of PUBLIC_PAGES) {
    assert.equal(pageSeo(p.path), p)
    assert.equal(new URL(canonicalUrl(p.path)).origin, SITE.origin)
    await access(new URL('../app/pages/' + (p.path === '/' ? 'index' : p.path.slice(1)) + '.vue', import.meta.url))
  }
  assert.equal(indexedPaths().includes('/terms'),ownerInfoReady())
  assert.equal(indexedPaths().includes('/contact'),contactInfoReady())
  if(!contactInfoReady()) assert.throws(()=>pageSeo('/contact'))
  if(SITE_OWNER.email) assert.match(SITE_OWNER.email,/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
})
test('WebSite与VideoGame结构化数据互相关联，品牌、版本和画面来源与产品事实一致', async () => {
  const schema = gameSiteSchema(), site=schema['@graph'][0], game=schema['@graph'][1]
  assert.equal(site['@type'],'WebSite');assert.equal(game['@type'],'VideoGame')
  assert.equal(site.name,SITE.name);assert.equal(game.name,SITE.name);assert.equal(site.about['@id'],game['@id'])
  assert.equal(game.url,canonicalUrl('/'));assert.equal(game.playMode,'https://schema.org/SinglePlayer')
  assert.equal(game.softwareVersion,JSON.parse(await read('package.json')).version)
  assert.equal(game.isAccessibleForFree,GAME_FACTS.isFree)
  assert.deepEqual(game.screenshot,GAME_FACTS.screenshots.map(canonicalUrl))
  assert.ok(!('aggregateRating' in game)&&!('review' in game)&&!('author' in game))
  const bytes=await readFile(new URL('../public'+SITE.shareImage,import.meta.url))
  assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630)
})
test('关于页独立正文达到800词，新页面与共用页脚可实际编译', async()=>{
  const about=await read('app/pages/about.vue'),main=about.match(/<article class="prose" data-about-content>([\s\S]*?)<\/article>/)[1]
  const words=main.replace(/<[^>]*>/g,' ').match(/[A-Za-z0-9]+(?:['’–-][A-Za-z0-9]+)*/g)
  assert.ok(words.length>=800,String(words.length));console.log('About main content:',words.length,'words')
  for(const filename of ['app/pages/about.vue','app/pages/contact.vue','app/pages/terms.vue','app/pages/privacy.vue','app/pages/how-to-play.vue','app/components/SiteFooter.vue']){
    const {descriptor:d,errors}=parse(await read(filename),{filename});assert.deepEqual(errors,[])
    const script=d.scriptSetup?compileScript(d,{id:'trust-pages'}):null
    assert.deepEqual(compileTemplate({source:d.template.content,filename,id:'trust-pages',compilerOptions:{bindingMetadata:script?.bindings}}).errors,[],filename)
  }
})

test('公开路由去除尾斜杠，未知页面和资源路径不伪装成首页',()=>{
  for(const page of PUBLIC_PAGES){if(page.path!=='/'){assert.equal(canonicalPagePath(page.path+'/'),page.path);assert.equal(canonicalPagePath(page.path+'///'),page.path)}assert.equal(canonicalPagePath(page.path),null)}
  for(const path of ['/','//','/not-a-page/','/iron-front/','/_nuxt/','/contact/'])assert.equal(canonicalPagePath(path),null)
});
