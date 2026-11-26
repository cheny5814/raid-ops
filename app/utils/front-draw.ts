import {radarOff} from './front-environment.ts'
import {drawSceneAtmosphere,drawCoverRemains} from './front-scenery.ts'
import { paintDamageWear, warmDestructionArt } from './front-impact.ts'
import {battleView,type BattleView} from './front-camera'
import {drawDesertCrate} from './front-desert-props'
import {drawField} from './front-field-draw'
import { drawIncline, drawZiplines } from './front-route-draw'
import {desertBackdrop,desertWorld,drawDesertSandbags} from './front-desert-draw.ts'
import {desertDecks} from './front-desert.ts'
import { arcadeCamera, arcadeGround, arcadePlatforms } from './front-contra'
import { drawContraWorld, drawArcadeHud, drawTankComponents } from './front-contra-draw'
import { drawTactics, pilotingVehicle } from './front-tactics-draw'
import { drawIndustrialHazard, drawSectorGate } from './front-machinery-draw'
import { infantryTop, isInfantry, INFANTRY_VISUAL_SCALE } from './front-infantry'
import { drawSupplyCase, drawCheckpointStation, drawEquipmentFinish } from './front-materials'
import { drawDungeonHazard, drawDungeonThreats, drawDungeonEnemy } from './front-dungeons-draw'
import { combatShake, drawHealthBar } from './front-feedback'
import { drawInteractions } from './front-interactions-draw'
import { poweredDown } from './front-interactions'
import { frontFont } from './front-font'
import { FLOOR, WEAPONS, WEAPON_ORDER, exitOpen, isBoss, hazardState, enemyDefense, nextStoryTerminal, storyTerminalReady, GATE_NAMES, type Enemy, type Input, type Level, type Run } from './front'
import { localizeFront, WEAPON_EN } from './front-locale'
import { WAR_PALETTES, drawBackdrop, drawProps, drawDeck, drawPlayer, drawCombatant, drawProjectiles, drawCombatEffects, drawMechanicalSpikes, drawTraversal, glow, line, polygon, disc } from './front-art'
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 0) { ctx.fillStyle = color; if (radius) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill() } else ctx.fillRect(x, y, w, h) }
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, run: Run, en = false, reduced = false) {
  const boss = isBoss(e), artTop=infantryTop(e)
  ctx.save()
  const offline=radarOff(run,e);if(offline)ctx.globalAlpha*=.55
  const hit = !reduced && (e.hitFlash ?? 0) > 0
  if (hit) { ctx.globalAlpha *= .7; ctx.translate(Math.sin((e.hitFlash ?? 0) * 90) * 1.8, 0) }
  if (e.boss && e.zone === 3 && e.age % 6 > 2 && e.age % 6 < 3.3) { ctx.translate(e.x, e.y + e.h); ctx.scale(1, .38); ctx.translate(-e.x, -e.y - e.h) }
  drawCombatant(ctx, e, run,undefined,reduced)
  drawDungeonEnemy(ctx, e, run, en ? 'en' : 'zh', reduced)
  if(!e.desertBoss)drawTankComponents(ctx,e,en?'en':'zh')
  paintDamageWear(ctx,e,run.time,reduced)
  ctx.restore()
  if(offline&&Math.abs(e.x-run.x)<450){ctx.font=frontFont(8,en?'en':'zh');ctx.textAlign='center';ctx.fillStyle='#aac0af';ctx.fillText(en?'Radar link offline':'雷达链路已断',e.x+e.w/2,artTop-16)}
  const defense = enemyDefense(e)
  if (!boss && (e.elite || run.aimTarget===e.id || e.windup>0&&Math.abs(e.x-run.x)<180) && (e.elite || defense === 'armor' || defense === 'energy' || defense === 'air')) {
    const roleName = e.role === 'welder' ? en ? "Welder" : '焊接兵' : e.role === 'shield' ? en ? "Shield guard" : '盾甲兵' : e.role === 'interceptor' ? en ? "Interceptor" : '拦截无人机' : e.role === 'capacitor' ? en ? "Capacitor" : '电容护盾' : null
    const name = e.eliteName?.[en?'en':'zh'] ?? roleName ?? (e.type === 'tank' ? en ? "Tank" : '坦克' : e.type === 'heavy' ? en ? "Armored trooper" : '重装甲兵' : e.type === 'mortar' ? en ? "Mortar" : '迫击炮' : e.type === 'drone' ? en ? "Drone" : '无人机' : defense === 'energy' ? en ? "Energy" : '能量' : en ? "Armor" : '重甲')
    ctx.fillStyle = defense === 'energy' ? '#b5a5df' : defense === 'air' ? '#94d9cc' : '#9cbced'; ctx.font = frontFont(9, en ? 'en' : 'zh'); ctx.textAlign = 'center'; ctx.fillText(name, e.x + e.w / 2, artTop - 21)
  }
  if (!boss && (e.elite || e.hp<e.maxHp || run.aimTarget===e.id || e.windup>0)) { const elite = ['drone', 'heavy', 'tank', 'mortar'].includes(e.type); const w = Math.max(e.w + 12, elite ? 54 : 40); drawHealthBar(ctx, e.x + e.w / 2 - w / 2, artTop - 10, w, e.hp, e.maxHp, e.hp < e.maxHp * .3 ? '#e69a7c' : e.type === 'drone' ? '#83cfc6' : '#c9ae7d',3,{owner:e,time:run.time,reduced,armor:defense==='armor',energy:defense==='energy'}) }
  if (e.windup > 0 && !(e.boss && e.zone !== undefined)) {
    const x = e.x + e.w / 2, y = e.y + e.h * .38
    if (boss || e.type === 'sniper') { ctx.strokeStyle = '#c18a6b75'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(e.aim) * 650, y + Math.sin(e.aim) * 650); ctx.stroke(); ctx.setLineDash([]) }
    box(ctx, x - 4, y - 4, 8, 8, '#d4ac7e', 3)
  }
}
export function drawFront(ctx: CanvasRenderingContext2D, level: Level, run: Run, width: number, input: Input, options: { reducedMotion?: boolean, language?: 'en' | 'zh',view?:BattleView } = {}) {
  warmDestructionArt()
  // 抖动只应用到场景绘制，HUD 与受击边缘保持固定。
  const screenWidth=width,cameraPosition=options.view??battleView(level,run,width),camera=cameraPosition.x
  width=cameraPosition.worldWidth
  const palette = WAR_PALETTES[level.id]!, en = options.language === 'en'
  const visualRun = options.reducedMotion ? { ...run, time: 0, flipAge: -1 } : run
  ctx.save();ctx.scale(cameraPosition.zoom,cameraPosition.zoom)
  if(level.biome==='desert')desertBackdrop(ctx,width,camera,visualRun.time,!!options.reducedMotion);else drawBackdrop(ctx, level, width,camera,run.time,!!options.reducedMotion)
  if(level.biome!=='desert'&&level.id!==0)drawSceneAtmosphere(ctx,level,width,camera,run.time,!!options.reducedMotion)
  const shake = combatShake(run, camera, width, !!options.reducedMotion)
  ctx.save(); ctx.translate(-camera + shake.x, -cameraPosition.y+shake.y)
  drawContraWorld(ctx,level,visualRun,camera,width,options.language,!!options.reducedMotion)
  drawProps(ctx, level, camera, width,run,!!options.reducedMotion)
  drawTraversal(ctx, level, run, camera, width, options.language)
  drawZiplines(ctx,level,run,camera,width,options.language)
  for (const p of arcadeGround(level,run)) {
    if (p.x + p.w < camera || p.x > camera + width) continue
    if(p.rise)drawIncline(ctx,p,camera,width,level.biome==='desert')
    else drawDeck(ctx, p.x, p.y, p.w, p.h, camera, width, palette.accent, false, level.dungeon.surface)
  }
  for (const p of [...arcadePlatforms(level,run),...desertDecks(run)]) {
    if (p.x + p.w < camera || p.x > camera + width) continue
    drawDeck(ctx, p.x, p.y, p.w, p.h, camera, width, palette.accent, true, level.dungeon.surface)
  }
  drawField(ctx,level,run,camera,width,options.language)
  if(level.biome==='desert')desertWorld(ctx,level,visualRun,camera,width,en)
  for (const barrier of run.barriers) {
    if(barrier.waterTower||barrier.billboard)continue
    if(barrier.hp<=0){if(barrier.x+barrier.w>camera-30&&barrier.x<camera+width+30)drawCoverRemains(ctx,barrier,level.biome==='desert');continue}
    if (barrier.x + barrier.w < camera - 20 || barrier.x > camera + width + 20) continue
    if (barrier.requiredWeapon) {
      const weapon = barrier.requiredWeapon, color = WEAPONS[weapon].color, x = barrier.x, y = barrier.y
      box(ctx, x - 4, y, barrier.w + 8, barrier.h, '#1c3044', 3); box(ctx, x - 2, y, 6, barrier.h, '#8496a1', 2); box(ctx, x + barrier.w - 4, y, 6, barrier.h, '#8496a1', 2)
      box(ctx, x + 4, y + 4, barrier.w - 8, barrier.h - 8, weapon === 'beam' ? '#b5a5df24' : weapon === 'pulse' ? '#465d72' : '#6a625b', 2)
      for (let j = 0; j < 9; j++) { const yy = y + 12 + j * 26; box(ctx, x + 5, yy, barrier.w - 10, weapon === 'beam' ? 2 : 16, weapon === 'beam' ? color + '70' : weapon === 'pulse' ? j % 2 ? '#7d96a5' : '#2b4157' : '#938375'); if (weapon === 'rocket') line(ctx, [x + 8, yy, x + 19, yy + 10, x + 12, yy + 16], '#423d3b', 1.5) }
      box(ctx, x + 7, y + 62 - 14, barrier.w - 14, 28, '#182e43', 3)
      ctx.fillStyle = color; ctx.font = frontFont(17, options.language); ctx.textAlign = 'center'; ctx.fillText(WEAPONS[weapon].label, x + barrier.w / 2, y + 62 + 6)
      const owned = run.arsenal.includes(weapon), slot = WEAPON_ORDER.indexOf(weapon) + 1
      const title = localizeFront(GATE_NAMES[weapon], options.language ?? 'zh')
      const hint = en ? `Use ${WEAPON_EN[weapon].name} to break this` : `只能用${WEAPONS[weapon].name}击破`
      const action = owned
        ? en ? `Press ${slot} to equip, then fire` : `按 ${slot} 切换武器，再开火击破`
        : en ? "Earn it at A marked weapon trial" : '先完成标记的军械挑战，获得所需武器'
      ctx.font = frontFont(10, options.language)
      const panelWidth = Math.min(width - 24, Math.max(ctx.measureText(hint).width, ctx.measureText(action).width, ctx.measureText(title).width) + 24)
      const panelX = Math.max(camera + 12, Math.min(camera + width - panelWidth - 12, x + barrier.w / 2 - panelWidth / 2)), panelY = Math.max(cameraPosition.y+140/cameraPosition.zoom, y - 62)
      box(ctx, panelX, panelY, panelWidth, 52, '#0b2033ee', 4)
      box(ctx, panelX, panelY, 3, 52, color, 1)
      ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(title, panelX + panelWidth / 2, panelY + 13)
      ctx.fillStyle = '#eef3df'; ctx.fillText(hint, panelX + panelWidth / 2, panelY + 29)
      ctx.fillStyle = owned ? '#d8bd89' : '#e7a58c'; ctx.font = frontFont(9, options.language); ctx.fillText(action, panelX + panelWidth / 2, panelY + 44)

      drawEquipmentFinish(ctx,x,y,barrier.w,barrier.h,barrier.id)
      drawHealthBar(ctx, x, y + barrier.h + 5, barrier.w, barrier.hp, barrier.maxHp, color,3,{owner:barrier,time:run.time,reduced:!!options.reducedMotion,armor:true})
      continue
    }
    if(level.biome==='desert'&&barrier.material==='crate'){drawDesertCrate(ctx,barrier,barrier.id,barrier.hp<barrier.maxHp);drawHealthBar(ctx,barrier.x,barrier.y-9,barrier.w,barrier.hp,barrier.maxHp,'#c8b18b',3,{owner:barrier,time:run.time,reduced:!!options.reducedMotion,armor:true});continue}
    if(level.biome==='desert'&&barrier.material==='bunker'){drawDesertSandbags(ctx,barrier);drawHealthBar(ctx,barrier.x,barrier.y-9,barrier.w,barrier.hp,barrier.maxHp,'#c8b18b',3,{owner:barrier,time:run.time,reduced:!!options.reducedMotion,armor:true});continue}
    const wood = barrier.material === 'crate', x = barrier.x, y = barrier.y
    const gradient = ctx.createLinearGradient(x, y, x + barrier.w, y + barrier.h)
    gradient.addColorStop(0, wood ? '#8a8072' : '#70899a'); gradient.addColorStop(.45, wood ? '#4f5861' : '#3f596e'); gradient.addColorStop(1, '#253848')
    box(ctx, x, y, barrier.w, barrier.h, '#172c3b', 3); box(ctx, x + 2, y + 2, barrier.w - 4, barrier.h - 4, '#43576a', 2)
    ctx.fillStyle = gradient; ctx.fillRect(x + 4, y + 4, barrier.w - 8, barrier.h - 8)
    box(ctx, x + 6, y + 5, barrier.w - 12, 2, '#afbdbe70'); box(ctx, x + 7, y + barrier.h - 8, barrier.w - 14, 3, '#192f40')
    for (let i = 0; i < 3; i++) box(ctx, x + 8, y + 12 + i * 6, barrier.w - 16, 2, '#142e3e85')
    for (const dx of [3, barrier.w - 7]) for (const dy of [3, barrier.h - 7]) disc(ctx, x + dx + 2, y + dy + 2, 1, '#bed0cf')
    box(ctx, x + barrier.w / 2 - 7, y + barrier.h / 2 - 4, 14, 8, '#1a3345', 1); box(ctx, x + barrier.w / 2 - 5, y + barrier.h / 2 - 2, 10, 2, wood ? '#d4b17b' : palette.accent)
    drawEquipmentFinish(ctx,x+1,y+1,barrier.w-2,barrier.h-2,barrier.id)
    if (barrier.hp < barrier.maxHp) line(ctx, [x + 10, y + 4, x + 17, y + 14, x + 11, y + 23, x + 19, y + 32], '#112633', 1.5)
    drawHealthBar(ctx, barrier.x, barrier.y - 9, barrier.w, barrier.hp, barrier.maxHp, '#c8b18b',3,{owner:barrier,time:run.time,reduced:!!options.reducedMotion,armor:true})
  }
  drawInteractions(ctx, visualRun, level, camera, width, options.language, options.reducedMotion)
  drawTactics(ctx, visualRun, level, camera, width, options.language, !!options.reducedMotion)
  for (const spike of level.spikes) {
    if (spike.x + spike.w < camera || spike.x > camera + width) continue
    drawMechanicalSpikes(ctx, spike)
  }
  for (const hazard of level.hazards) {
    if (hazard.x + hazard.w < camera || hazard.x > camera + width) continue
    if (hazard.type !== 'laser' && hazard.type !== 'crusher') { drawDungeonHazard(ctx, hazard, level, run, options.language ?? 'zh', !!options.reducedMotion); continue }
    const state=poweredDown(run,hazard)?'safe':hazardState(hazard,run.time,level.id)
    drawIndustrialHazard(ctx,hazard,state,run,level.id,options.language,!!options.reducedMotion)
  }

  for (const a of level.encounters) {
    if (a.end < camera || a.x > camera + width) continue
    const remaining = run.enemies.filter(e => a.enemies.includes(e.id) && e.hp > 0).length
    const terminal=level.storyTerminals.find(t=>level.encounters[t.encounter]===a),pending=!!terminal&&!run.storyCompleted.includes(terminal.id)
    drawSectorGate(ctx,a.end,FLOOR,remaining,pending,Math.abs(run.x-a.end)<450,options.language)

  }
  const activeTerminal = nextStoryTerminal(run, level)
  for (const t of level.storyTerminals) {
    if (t.x + 60 < camera || t.x - 60 > camera + width) continue
    const done = run.storyCompleted.includes(t.id), ready = storyTerminalReady(run, level, t), active = activeTerminal?.id === t.id
    const color = done ? '#9bb5a5' : ready && active ? '#e9c383' : '#86c8d1'
    box(ctx, t.x - 5, t.y + 37, 38, 7, '#2e485c', 2)
    box(ctx, t.x, t.y + 9, 28, 29, '#1b354b', 3)
    line(ctx, [t.x + 2, t.y + 10, t.x + 26, t.y + 10, t.x + 26, t.y + 35, t.x + 2, t.y + 35], '#91a9b5', 1.2)
    if (t.kind === 'intel') { box(ctx, t.x + 5, t.y + 14, 18, 12, color, 2); line(ctx, [t.x + 10, t.y + 14, t.x + 10, t.y + 10, t.x + 18, t.y + 10, t.x + 18, t.y + 14], color, 2) }
    else if (t.kind === 'uplink') { box(ctx, t.x + 4, t.y + 14, 20, 12, color + '65', 2); line(ctx, [t.x + 14, t.y + 8, t.x + 14, t.y - 10, t.x + 21, t.y - 15], color, 2); disc(ctx, t.x + 14, t.y - 10, 3, color) }
    else { line(ctx, [t.x + 8, t.y + 26, t.x + 20, t.y + 16], color, 4); disc(ctx, t.x + 8, t.y + 26, 3, '#d2dfd3') }
    ctx.font = frontFont(9, options.language); ctx.fillStyle = color; ctx.textAlign = 'center'
    ctx.fillText(done ? en ? "Secured" : '已夺取' : `${en ? "Objective" : '剧情目标'} 0${t.goal + 1}`, t.x + 14, t.y - 23)
    if (active && ready && !done) {
      box(ctx, t.x - 16, t.y - 15, 60, 4, '#183244'); box(ctx, t.x - 16, t.y - 15, 60 * run.storyCharge / t.duration, 4, color)
      ctx.fillText(en ? "Hold nearby" : '靠近并留在附近', t.x + 14, t.y - 35)
    }
  }
  level.checkpoints.forEach((x,i)=>{
    if(x<camera-80||x>camera+width)return
    const floor=level.ground.find(p=>x>=p.x&&x<p.x+p.w)?.y??FLOOR
    drawCheckpointStation(ctx,x,floor,i<=run.checkpoint)
    ctx.fillStyle='#c9d7cc';ctx.font=frontFont(10,options.language);ctx.textAlign='center';ctx.fillText(en?"Checkpoint":'补给点',x+36,floor-61)
  })
  for(const p of run.pickups){
    if(p.taken||p.x<camera-30||p.x>camera+width+30)continue
    drawSupplyCase(ctx,p,run.time,!!options.reducedMotion)
  }


  const exit = level.width - 90, open = exitOpen(run)
  box(ctx, exit - 12, FLOOR - 92, 66, 92, '#304b52', 5); box(ctx, exit - 6, FLOOR - 86, 54, 86, open ? '#88b8a134' : '#5f6865', 3)
  if (open) { glow(ctx, exit + 20, FLOOR - 45, 78, palette.accent, .18); for (let k = 0; k < 5; k++) box(ctx, exit + 2 + k * 8, FLOOR - 82, 2, 77, palette.accent + '32') }
  box(ctx, exit - 10, FLOOR - 98, 62, 6, open ? '#9ecab1' : '#c39c79', 2)
  ctx.fillStyle = open ? '#d5e6ce' : '#e2c8a3'; ctx.font = frontFont(12, options.language); ctx.textAlign = 'center'; ctx.fillText(open ? en ? "Extraction" : '撤离通道' : run.storyCompleted.length < run.storyRequired ? en ? "Secure all objectives" : '先完成剧情目标' : en ? "Clear the exit" : '击破出口警戒', exit + 20, FLOOR - 111)
  const missionTargets = new Set(level.missions.flatMap(m => level.encounters[m.encounter]?.enemies ?? []))
  for (const e of run.enemies) if (e.hp > 0 && !e.dormant && e.x > camera - 150 && e.x < camera + width + 150) { drawEnemy(ctx, options.reducedMotion && !e.boss && !e.elite ? { ...e, age: 0 } : e, visualRun, en, !!options.reducedMotion); if (missionTargets.has(e.id)) { box(ctx, e.x + e.w / 2 - 3, infantryTop(e) - 25, 6, 6, '#8ddccb', 1); line(ctx, [e.x - 4, infantryTop(e) - 29, e.x - 4, infantryTop(e) - 22, e.x + 1, infantryTop(e) - 22], '#8ddccb80') } }
  const announcedWaves=new Set<string>()
  for (const e of run.enemies) if (e.dormant && e.x > camera && e.x < camera + width && e.wakeAfter?.every(id => run.enemies.find(a => a.id === id)?.hp === 0)) {const key=e.wakeAfter.join(',');if(announcedWaves.has(key))continue;announcedWaves.add(key); line(ctx, [e.x - 10, e.y + e.h, e.x + e.w + 10, e.y + e.h], '#dcb279', 2); ctx.fillStyle = '#dcb279'; ctx.font = frontFont(9, options.language); ctx.textAlign = 'center'; ctx.fillText(en ? "Incoming reinforcements" : '增援即将抵达', e.x + e.w / 2, e.y - 58) }
  drawDungeonThreats(ctx, run, camera, width, options.language ?? 'zh')
  drawProjectiles(ctx, run, camera, width)
  drawCombatEffects(ctx, run, camera, width, !!options.reducedMotion)
  const locked = run.enemies.find(e => e.id === run.aimTarget && e.hp > 0 && !e.dormant)
  if (locked && input.aimAssist && run.status === 'playing') {
    const extra=isInfantry(locked.type)?locked.w*(INFANTRY_VISUAL_SCALE-1)/2:0
    const x=locked.x-5-extra,y=infantryTop(locked)-5,w=locked.w+10+extra*2,h=locked.y+locked.h-y+5
    ctx.save(); ctx.strokeStyle = WEAPONS[run.weapon].color + 'b0'; ctx.lineWidth = 1.2
    for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(px! + dx! * 6, py!); ctx.lineTo(px!, py!); ctx.lineTo(px!, py! + dy! * 6); ctx.stroke()
    }
    ctx.fillStyle = '#c6dbd4'; ctx.font = frontFont(9, en ? 'en' : 'zh'); ctx.textAlign = 'center'; if(!locked.boss)ctx.fillText(en ? "Locked" : '锁定', x + w / 2, y - 27); ctx.restore()
  }
  if(!pilotingVehicle(visualRun))drawPlayer(ctx, visualRun, input, !!options.reducedMotion)
  ctx.restore()
  ctx.restore()
  drawArcadeHud(ctx,level,run,screenWidth,options.language)
  if (run.status !== 'won' && run.damageCue > 0) drawDamageEdge(ctx, screenWidth, run.damageCue, run.armorHit)
}

// 只覆盖四周窄边缘；中心透明，强度单向衰减，不产生反复闪烁。
export function drawDamageEdge(ctx: CanvasRenderingContext2D, width: number, remaining: number, armorHit: boolean) {
  const fade = Math.max(0, Math.min(1, remaining / .55)), alpha = fade * fade * (armorHit ? .16 : .34)
  if (alpha <= 0) return
  const edgeX = Math.min(76, width * .1), edgeY = 52
  const bands = [
    { x: 0, y: 0, w: width, h: edgeY, to: [0, edgeY] },
    { x: 0, y: 480, w: width, h: -edgeY, to: [0, 480 - edgeY] },
    { x: 0, y: 0, w: edgeX, h: 480, to: [edgeX, 0] },
    { x: width, y: 0, w: -edgeX, h: 480, to: [width - edgeX, 0] },
  ]
  ctx.save()
  for (const band of bands) {
    const gradient = ctx.createLinearGradient(band.x, band.y, band.to[0]!, band.to[1]!)
    gradient.addColorStop(0, `rgba(186, 43, 51, ${alpha})`)
    gradient.addColorStop(.6, `rgba(186, 43, 51, ${alpha * .24})`)
    gradient.addColorStop(1, 'rgba(186, 43, 51, 0)')
    ctx.fillStyle = gradient; ctx.fillRect(band.x, band.y, band.w, band.h)
  }
  ctx.restore()
}
