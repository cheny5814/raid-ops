import type { Enemy, Hazard, Level, Run } from './front'
import { hazardState } from './front'
import { bossState } from './front-dungeons'
import { poweredDown } from './front-interactions'
import { rect, line, polygon, disc, metal, glow } from './front-art'
import { frontFont } from './front-font'
type Ctx = CanvasRenderingContext2D
export function drawDungeonHazard(c: Ctx, h: Hazard, level: Level, run: Run, language: 'en' | 'zh', reduced: boolean) {
  const state = poweredDown(run, h) && (h.type !== 'tide'||h.circuit!==undefined) ? 'safe' : hazardState(h, run.time, level.id), active = state === 'active', warning = state === 'warning', floor = h.y + h.h, en = language === 'en'
  c.save()
  if (h.type === 'tide') {
    metal(c, h.x, floor - 4, h.w, 5, '#6d929b', '#294b60', 1)
    if (state !== 'safe') {
      rect(c, h.x, floor - (active ? 20 : 7), h.w, active ? 20 : 7, active ? '#4995af88' : '#67acbd44')
      for (let i = 0; i < 12; i++) { const x = h.x + i * h.w / 12; line(c, [x, floor - (active ? 17 : 5), x + 9, floor - (active ? 17 : 5) + (reduced ? 0 : Math.sin(run.time * 3 + i) * 2)], '#b5dde1a0', 1.5) }
    }
  } else if (h.type === 'conveyor') {
    metal(c, h.x, floor - 8, h.w, 8, '#8f9e9e', '#354951', 2)
    for (let i = 0; i < 10; i++) { const x = h.x + (i * 17 + (reduced || poweredDown(run, h) ? 0 : run.time * 40)) % h.w; line(c, [x, floor - 5, x + 5, floor - 5], '#bba976', 2) }
  } else if(h.type==='gust'&&level.biome==='desert'){
    if(active){c.save();c.beginPath();c.rect(h.x,h.y,h.w,h.h);c.clip();const haze=c.createLinearGradient(h.x,h.y,h.x+h.w,h.y);haze.addColorStop(0,'#c4a77a00');haze.addColorStop(.4,'#c4a77a35');haze.addColorStop(1,'#c4a77a00');rect(c,h.x,h.y,h.w,h.h,haze);c.restore()}
    if(state!=='safe')for(let i=0;i<18;i++){const travel=reduced?i*17:(run.time*100+i*37)%h.w,x=h.x+travel,y=h.y+15+(i*29)%(h.h-20);line(c,[x,y,x+22+i%17,y-3],active?'#f3d49966':'#e7c38b33',i%3?1:1.8)}
  } else if (h.type === 'gust') {
    metal(c, h.x, floor - 12, h.w, 12, '#718e9b', '#294555', 2)
    for (let i = 0; i < 6; i++) { const x = h.x + 15 + i * 25; disc(c, x, floor - 5, 5, '#1c394b'); if (active) { const rise = reduced ? 45 : (run.time * 55 + i * 22) % 130; line(c, [x, floor - rise, x + 9, floor - rise - 20], '#c0e4e96a', 1.3) } }
  } else if (h.type === 'searchlight') {
    metal(c, h.x + h.w / 2 - 8, h.y - 10, 16, 10, '#8996a5', '#35495a', 2)
    if (state !== 'safe') {
      const g = c.createLinearGradient(0, h.y, 0, floor); g.addColorStop(0, '#f3db9a50'); g.addColorStop(1, '#f3db9a0a')
      polygon(c, [h.x + h.w / 2, h.y, h.x, floor, h.x + h.w, floor], g)
      line(c, [h.x, floor - 1, h.x + h.w, floor - 1], run.spotted && active ? '#ea927a' : '#d6c18b', 2)
    }
  } else if (h.type === 'surge') {
    metal(c, h.x, floor - 7, h.w, 7, '#8b9da9', '#304656', 1)
    for (let i = 0; i < 8; i++) { const x = h.x + i * 20; rect(c, x + 2, floor - 5, 10, 2, active ? '#b5a0f0' : '#587b8e', 1); if (active) line(c, [x + 3, floor - 5, x + 8, floor - 18, x + 11, floor - 9, x + 16, floor - 22], '#bca4ee99', 1.5) }
  }
  const names = { tide: en ? "Tide deck" : '潮汐甲板', conveyor: en ? "Conveyor · shoot power box" : '传送带 · 电箱可停机', gust: level.biome==='desert'?(en?(active?'Sand cover · advance between shots':'Crosswind · sand cover approaching'):(active?'沙幕遮蔽 · 趁隙推进':'沙暴侧风 · 留意遮蔽时机')):en ? "Gust vents · watch your jump" : '阵风口 · 留意跳跃时机', searchlight: en ? run.spotted && active ? "Spotted · duck" : "Searchlight · crouch through" : run.spotted && active ? '已被照亮 · 蹲下脱离' : '探照灯 · 蹲下穿过', surge: en ? "Power surge · jump or cut power" : '电涌地板 · 跳过或断电', laser: '', crusher: '' }
  c.font = frontFont(9, language); c.textAlign = 'center'; c.fillStyle = active ? '#dda78c' : warning ? '#dec58f' : '#9ebdbe'
  c.fillText(names[h.type], h.x + h.w / 2, h.type === 'gust' || h.type === 'searchlight' ? h.y - 15 : h.y - 12)
  if (warning) { c.font = frontFont(8, language); c.fillStyle = '#e5c083'; c.fillText(en ? "Activating" : '即将启动', h.x + h.w / 2, h.y - 24) }
  c.restore()
}
export function drawDungeonThreats(c: Ctx, run: Run, camera: number, width: number, language: 'en' | 'zh') {
  c.save()
  const focus = run.threats.filter(t => t.x <= camera + width && t.x + t.w >= camera).sort((a, b) => Math.abs(a.x + a.w / 2 - run.x) - Math.abs(b.x + b.w / 2 - run.x))[0]
  for (const t of run.threats) {
    if (t.x > camera + width || t.x + t.w < camera) continue
    const waiting = t.warning > 0, color = run.biome==='desert'?(waiting?'#8c3e27':'#702b24'):waiting ? '#edba78' : '#f1a17b'
    rect(c, t.x, t.y, t.w, t.h, waiting ? '#e6a76024' : '#f2ac7a65', 1)
    c.strokeStyle = color; c.lineWidth = 1.5; c.setLineDash(waiting ? [6, 5] : []); c.strokeRect(t.x, t.y, t.w, t.h); c.setLineDash([])
    const center = Math.max(camera + 90, Math.min(camera + width - 90, t.x + t.w / 2))
    c.fillStyle = color; c.font = frontFont(10, language); c.textAlign = 'center'
    if(t===focus){
      const label = t.hint?t.hint[language]:language === 'en' ? t.kind === 'beam' ? "Sightline — duck" : t.kind === 'wave' || t.kind === 'pulse' ? "Ground attack — jump" : "Impact zone — move" : t.kind === 'beam' ? '狙击射线 · 蹲下' : t.kind === 'wave' || t.kind === 'pulse' ? '地面攻击 · 跳跃' : '打击落点 · 移开'
      const labelW=Math.min(width-16,c.measureText(label).width+14),labelX=Math.max(camera+labelW/2+8,Math.min(camera+width-labelW/2-8,center));rect(c,labelX-labelW/2,t.y-24,labelW,20,'#102a39ed',3);c.fillStyle='#ffe0ad';c.fillText(label,labelX,t.y-10,Math.max(20,width-30))
    }
  }
  c.restore()
}
export function drawDungeonEnemy(c: Ctx, e: Enemy, run: Run, language: 'en' | 'zh', reduced: boolean) {
  c.save()
  if (e.role === 'shield') {
    const raised = e.cooldown < 1.1
    metal(c, e.x - 5, e.y + (raised ? 10 : 0), 13, 27, '#a4a6a0', '#4e5660', 2); rect(c, e.x - 3, e.y + (raised ? 15 : 5), 9, 5, '#a25754', 1)
  } else if (e.role === 'welder') {
    metal(c, e.x + e.w - 4, e.y + 12, 7, 20, '#c89467', '#674b3e', 2); disc(c, e.x + e.w, e.y + 10, 2, '#edb57b')
  } else if (e.role === 'interceptor') {
    polygon(c, [e.x - 10, e.y + 8, e.x + 8, e.y - 4, e.x + 10, e.y + 5], '#68adae'); polygon(c, [e.x + e.w + 10, e.y + 8, e.x + e.w - 8, e.y - 4, e.x + e.w - 10, e.y + 5], '#68adae')
  } else if (e.role === 'capacitor' && e.age % 4 < 2 && !poweredDown(run, e)) {
    c.strokeStyle = '#aa99de90'; c.lineWidth = 1.5; c.strokeRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8)
    rect(c, e.x + e.w - 3, e.y + 10, 5, 10, '#a592d9', 1)
  } else if (e.role === 'spotter') line(c, [e.x + 8, e.y + 8, e.x + 20, e.y + 8], '#d99ebb', 2)
  if(e.elite){
    const x=e.x,y=e.y,color=e.elite==='conductor'?'#bba7df':e.elite==='interceptor'?'#88cec5':'#e3b57d'
    // Hardware and insignia identify commanders without increasing their collision footprint.
    metal(c,x+e.w*.25,y+e.h*.12,e.w*.5,5,color,'#4d5049',1)
    line(c,[x+e.w*.65,y+5,x+e.w*.65,y-13,x+e.w*.65+9,y-13],color,1.2)
    for(let n=0;n<3;n++)line(c,[x+5+n*5,y+e.h*.54,x+7+n*5,y+e.h*.54+3],color,1.5)
    if(e.elite==='artillery'){for(const dx of[-5,e.w-5]){metal(c,x+dx,y+e.h*.3,8,16,'#9b9d80','#3f514d',2);disc(c,x+dx+4,y+e.h*.3,2,color)}}
    if(e.elite==='conductor'){for(const dx of[-3,e.w]){metal(c,x+dx,y+8,4,e.h*.55,'#a99bc5','#3b4658',1);disc(c,x+dx+2,y+12,1.5,color)}}
    if(e.elite==='bulwark')metal(c,x-4,y+e.h*.35,9,e.h*.5,'#b4a88a','#43574e',2)
  }
  if (!e.boss || e.zone === undefined) { c.restore(); return }
  const state = bossState(run, e), x = e.x, y = e.y
  if (e.zone === 1) {
    metal(c, x + 10, y + 18, 20, 65, '#bc986e', '#584a42', 4); metal(c, x + e.w - 25, y + 18, 20, 65, '#bc986e', '#584a42', 4)
    if (state.open) for (let i = 0; i < 4; i++) { c.save(); c.globalAlpha = .2; disc(c, x + e.w / 2 + i * 8, y - (reduced ? 15 : (run.time * 20 + i * 10) % 40), 10 + i * 2, '#b5c4bf'); c.restore() }
  } else if (e.zone === 2) {
    metal(c, x + 10, y + e.h * .35, e.w - 20, 15, '#819eaa', '#2d4d62', 3)
    for (const dx of [8, e.w - 8]) { rect(c, x + dx, y + e.h * .6, 10, 20, '#344f64', 2); disc(c, x + dx + 5, y + e.h * .6 + 20, 3, '#89d0ce') }
  } else if (e.zone === 3 && !state.open) {
    metal(c, x - 10, y + 22, 36, e.h - 28, '#a4b1af', '#384e60', 4); polygon(c, [x - 3, y + 40, x + 19, y + 40, x + 8, y + 60], '#a25e59')
  } else if (e.zone === 4) {
    polygon(c, [x + 8, y + 20, x + 40, y + 20, x + 55, y + e.h, x - 10, y + e.h], '#4a41595c')
    line(c, [x + 4, y + 12, x + 25, y + 12], '#e1a4c4', 3)
  } else if (e.zone === 5) {
    const cx=x+e.w/2,cy=y+e.h*.48,radius=Math.max(e.w,e.h)*.6
    c.strokeStyle=state.open?'#f1c17f':'#9d9ed1';c.lineWidth=3
    for(let n=0;n<6;n++){const a=n*Math.PI/3+(reduced?0:run.time*.3);c.beginPath();c.arc(cx,cy,radius,a,a+.42);c.stroke()}
    for(let n=0;n<4;n++){metal(c,x+e.w*.28+n*8,y+e.h*.65,5,14,'#7a8799','#243a4d',1);rect(c,x+e.w*.28+n*8,y+e.h*.65+2,5,7,state.open?'#e4aa72':'#8179b1',1)}
    if(!state.open){

    c.strokeStyle = '#b09ce5b0'; c.lineWidth = 3; c.strokeRect(x - 9, y - 8, e.w + 18, e.h + 16)
    for (const relay of run.interactives.filter(p => p.kind === 'relay' && p.hp > 0)) line(c, [relay.x + 12, relay.y, x + e.w / 2, y + e.h / 2], '#ab99dc65', 1.5)
  }
  }
  if (state.open && e.zone!==0) { const wx = x + e.w * .65, wy = y + e.h * .48; glow(c, wx, wy, 25, '#efc382', .25); disc(c, wx, wy, 4, '#f4d094') }
  c.font=frontFont(10,language);c.textAlign='center';const label=state.label[language],labelW=c.measureText(label).width+14;rect(c,x+e.w/2-labelW/2,y-30,labelW,23,'#102a39ed',3);c.fillStyle=state.open?'#ffe0ad':'#c7e0dc';c.fillText(label,x+e.w/2,y-15)
  c.restore()
}
