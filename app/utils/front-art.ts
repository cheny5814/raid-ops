import {drawTitleBattle,titleDemoTravel} from './front-title-battle.ts'
import {infantryAction,mechStride} from './front-combat-motion.ts'
import {drawDistrictEquipment,drawVehicleDamage} from './front-equipment-detail.ts'
import {sceneryForLevel,paintScenicPlate,drawSceneAtmosphere,sceneryPowered,drawIndustrialAmbience} from './front-scenery.ts'
import { paintImpact, paintExplosion, effectDuration } from './front-impact.ts'
import {drawTitleCamp} from './front-title-camp'
import {desertBackdrop,desertProps,desertDeck,drawDesertBoss} from './front-desert-draw.ts'
import type { OperativeId } from './front-operatives'
import { paintSteelCable } from './front-steel-cable'
import { paintFirearm, firearmMuzzle } from './front-firearms'
import { playerRig } from './front-gun-pose'
import { INFANTRY_VISUAL_SCALE, paintInfantry, paintInfantryWeapon, trackInfantry, type InfantryMotion, type MotionTracker, type InfantryPose } from './front-infantry'
import { drawIndustrialDeck, drawIndustrialDrone, drawFieldCrate, drawIndustrialTank, drawIndustrialTurret } from './front-materials'
import { paintAmmunition } from './front-ammunition'
import { frontFont } from './front-font'
import { WEAPONS, ropePoint, type Enemy, type Input, type Level, type Run, type Weapon } from './front'
type Ctx = CanvasRenderingContext2D
export const WAR_PALETTES = [
  { sky: '#071b2d', horizon: '#294b62', accent: '#67ded4', second: '#e7b47c', metal: '#304d61' },
  { sky: '#211322', horizon: '#674744', accent: '#f4b06e', second: '#cb84a7', metal: '#57434e' },
  { sky: '#0d1834', horizon: '#394d75', accent: '#8cbefc', second: '#d2b48d', metal: '#374a6b' },
  { sky: '#11232c', horizon: '#3a5d62', accent: '#98d8ae', second: '#cbb783', metal: '#3b555b' },
  { sky: '#21172e', horizon: '#5e456a', accent: '#c59fee', second: '#e49e8a', metal: '#514760' },
  { sky: '#071b29', horizon: '#254d5c', accent: '#67e1e5', second: '#a8aceb', metal: '#294553' },
]
export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string | CanvasGradient, r = 0) {
  c.fillStyle = color; if (r) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill() } else c.fillRect(x, y, w, h)
}
export function line(c: Ctx, points: number[], color: string, w = 1) {
  c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(points[0]!, points[1]!); for (let i = 2; i < points.length; i += 2) c.lineTo(points[i]!, points[i + 1]!); c.stroke()
}
export function polygon(c: Ctx, points: number[], color: string | CanvasGradient) {
  c.fillStyle = color; c.beginPath(); c.moveTo(points[0]!, points[1]!); for (let i = 2; i < points.length; i += 2) c.lineTo(points[i]!, points[i + 1]!); c.closePath(); c.fill()
}
export function disc(c: Ctx, x: number, y: number, r: number, color: string) { c.fillStyle = color; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fill() }
export function glow(c: Ctx, x: number, y: number, r: number, color: string, alpha = .2) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, color + '00'); c.save(); c.globalAlpha *= alpha; rect(c, x - r, y - r, r * 2, r * 2, g); c.restore()
}
export function metal(c: Ctx, x: number, y: number, w: number, h: number, light: string, dark: string, radius = 2) {
  const g = c.createLinearGradient(x, y, x + w * .35, y + h); g.addColorStop(0, light); g.addColorStop(.42, dark); g.addColorStop(1, '#172634'); rect(c, x, y, w, h, g, radius)
}
function bolts(c: Ctx, x: number, y: number, w: number, h: number) { for (const [a, b] of [[x + 4, y + 4], [x + w - 5, y + 4], [x + 4, y + h - 5], [x + w - 5, y + h - 5]]) { disc(c, a!, b!, 1.1, '#9bb1b175'); } }
const backdrops = new Map<string, { surface: CanvasImageSource, pixels: number }>()
let backdropPixels = 0
function paintBackdrop(c: Ctx, level: Level, width: number) {
  const p = WAR_PALETTES[level.id]!, g = c.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, p.sky); g.addColorStop(.65, p.horizon); g.addColorStop(1, '#0b202b'); rect(c, 0, 0, width, 480, g)
  glow(c, width * .77, 109, 200, p.second, .15)
  if (level.id !== 5) { disc(c, width * .78, 92, 26, '#b8ced249'); disc(c, width * .78 - 8, 85, 7, '#8298b027'); disc(c, width * .78 + 9, 99, 5, '#6f819f2b'); disc(c, width * .78 - 2, 104, 3, '#637b962b') }
  for (let i = 0; i < width / 3; i++) { const x = (i * 137.3) % width, y = (i * 47.17) % 290; rect(c, x, y, i % 7 === 0 ? 1.5 : .7, .7, '#cfdef024') }
  // 远景与中景保持固定，避免额外视差移动；光照、雾层形成空间层次。
  for (let layer = 0; layer < 2; layer++) {
    const pitch = layer ? 125 : 73, base = layer ? 375 : 330
    for (let i = -1; i < width / pitch + 1; i++) {
      const x = i * pitch + (layer ? 24 : 0), h = 65 + Math.abs((i * 71 + level.id * 29) % 135)
      const color = layer ? '#102431dc' : '#20394e9c'
      if (level.id === 0) {
        rect(c, x, base - h * .45, pitch - 8, h * .45, color); line(c, [x + 15, base, x + 15, base - h - 50, x + 86, base - h - 50, x + 110, base - h - 10], color, layer ? 5 : 3)
        line(c, [x + 15, base - h - 50, x + 86, base - h + 15, x + 86, base - h - 50], color, 2)
      } else if (level.id === 1) {
        rect(c, x, base - h, pitch - 8, h, color); rect(c, x + 16, base - h - 90, 13, 90, color)
        rect(c, x + 38, base - h - 47, 19, 47, color)
        for (let k = 0; k < 4; k++) disc(c, x + 24 + k * 11, base - h - 100 - k * 9, 15 + k * 4, '#a9a1ae0d')
      } else if (level.id === 2) {
        rect(c, x + 20, 175, 8, 205, color); line(c, [x - 50, 274, x + 24, 175, x + 100, 274], color, 2); rect(c, x - 20, 274, pitch, 13, color)
        rect(c, x + 37, 325 - h * .3, 55, h * .3 + 60, color)
      } else if (level.id === 3) {
        rect(c, x, base - h * .5, pitch - 10, h * .5, color, 8); rect(c, x + 32, base - h - 25, 6, h, color)
        c.strokeStyle = color; c.lineWidth = 6; c.beginPath(); c.arc(x + 35, base - h - 30, 28, .1, Math.PI - .1); c.stroke(); line(c, [x + 35, base - h - 35, x + 62, base - h - 58], color, 2)
      } else if (level.id === 4) {
        polygon(c, [x, base, x, base - h, x + pitch * .6, base - h, x + pitch * .6, base - h - 15, x + pitch - 12, base - h - 15, x + pitch - 12, base], color)
        rect(c, x + 8, base - h - 30, 2, 30, color)
      } else {
        rect(c, x + 8, 35, 12, 330, color); rect(c, x + 30, 139, pitch - 40, 230, color, 7)
        for (let k = 0; k < 8; k++) { rect(c, x + 37, 150 + k * 23, pitch - 55, 13, '#34546080'); rect(c, x + 40, 154 + k * 23, 5, 3, p.accent + '65') }
      }
      if (layer && level.id !== 5) for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { if ((i + k + j) % 3) rect(c, x + 8 + k * 24, base - h + 14 + j * 22, 7, 10, (k + i) % 2 ? p.second + '25' : p.accent + '22') }
    }
  }
  // 每个战区的大型地标，搭配固定照明形成纵深。
  if (level.id === 0) {
    const x = width * .48
    polygon(c, [x - 140, 298, x + 145, 298, x + 114, 322, x - 116, 322], '#132d3e')
    rect(c, x + 61, 253, 41, 45, '#243e4e'); rect(c, x + 69, 261, 26, 5, p.second + '75'); line(c, [x + 81, 253, x + 81, 217, x + 103, 217], '#3e5867', 2)
    for (let i = 0; i < 5; i++) { rect(c, x - 116 + i * 32, 275, 29, 23, i % 2 ? '#2f4b5c' : '#365565'); line(c, [x - 111 + i * 32, 278, x - 111 + i * 32, 295], '#7c929b3d') }
  } else if (level.id === 1) {
    for (let i = 0; i < 3; i++) { const x = width * .3 + i * 170; glow(c, x, 290, 68, '#e6a078', .14); rect(c, x - 24, 269, 48, 44, '#603f4180', 5); rect(c, x - 17, 277, 34, 26, '#df9b6355'); for (let j = 0; j < 5; j++) rect(c, x - 15 + j * 7, 277, 2, 26, '#2b344a') }
  } else if (level.id === 2) {
    const x = width * .6
    line(c, [x, 140, x + 75, 205, x + 150, 140], '#788da328', 2)
    polygon(c, [x - 15, 153, x + 18, 145, x + 43, 153, x + 98, 153, x + 113, 160, x + 35, 165, x, 162], '#3b536c')
    rect(c, x + 8, 151, 20, 4, '#85c1d54d'); rect(c, x + 78, 158, 12, 2, '#b0c9e166')
  } else if (level.id === 3) {
    const x = width * .52
    rect(c, x - 20, 197, 40, 123, '#213c4b'); rect(c, x - 27, 193, 54, 11, '#3e5c6a'); rect(c, x - 15, 209, 30, 12, p.accent + '35')
    polygon(c, [x - 10, 224, x - 110, 303, x - 30, 303], p.accent + '07'); line(c, [x, 193, x, 151], '#657d873c', 3)
  } else if (level.id === 4) {
    for (let i = 0; i < 3; i++) { const x = width * .22 + i * 235; rect(c, x, 233 - i % 2 * 45, 46, 57, '#5b4a7966', 2); line(c, [x + 5, 242 - i % 2 * 45, x + 40, 242 - i % 2 * 45], p.accent + '70', 2); for (let j = 0; j < 3; j++) rect(c, x + 7, 252 - i % 2 * 45 + j * 8, 26 - j * 5, 2, '#b8a1d740') }
  }
  if (level.id === 0) { rect(c, 0, 314, width, 86, '#183a4b'); for (let i = 0; i < 50; i++) { const x = i * width / 49; line(c, [x, 329 + i % 5 * 12, x + 18 + i % 3 * 9, 329 + i % 5 * 12], '#78b7c91c') } }
  if (level.id === 5) {
    for (let i = 0; i < width / 300 + 1; i++) { const x = i * 300 + 150; glow(c, x, 112, 94, p.accent, .1); c.strokeStyle = p.accent + '45'; c.lineWidth = 3; c.beginPath(); c.arc(x, 112, 53, 0, Math.PI * 2); c.stroke(); rect(c, x - 4, 64, 8, 97, p.accent + '45', 3) }
    rect(c, 0, 39, width, 8, '#415c6a'); rect(c, 0, 48, width, 2, p.accent + '75')
  }
  const fog = c.createLinearGradient(0, 265, 0, 400); fog.addColorStop(0, '#28475500'); fog.addColorStop(1, p.horizon + '72'); rect(c, 0, 265, width, 135, fog)
  // 固定细颗粒，替代大面积平涂；不随帧随机闪动。
  for (let i = 0; i < width * .8; i++) rect(c, (i * 47.37) % width, (i * 113.79) % 480, 1, 1, '#e1f4ff05')
}
export function drawBackdrop(c: Ctx, level: Level, width: number, camera=0,time=0,reduced=false) {
  if(level.biome!=='desert'&&paintScenicPlate(c,sceneryForLevel(level),width,camera,reduced)){if(level.id===0)drawSceneAtmosphere(c,level,width,camera,time,reduced);return}
  if(level.biome==='desert'){desertBackdrop(c,width,camera,time,reduced);return}
  const transform = c.getTransform()
  const pixelWidth = Math.max(1, Math.round(width * Math.abs(transform.a))), pixelHeight = Math.max(1, Math.round(480 * Math.abs(transform.d)))
  const key = `${level.id}:${width}:${pixelWidth}x${pixelHeight}`, cached = backdrops.get(key)
  if (cached) { c.drawImage(cached.surface, 0, 0, width, 480); return }
  const surface = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(pixelWidth, pixelHeight) : typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!surface) { paintBackdrop(c, level, width); return }
  surface.width = pixelWidth; surface.height = pixelHeight
  const target = surface.getContext('2d') as Ctx | null
  if (!target) { paintBackdrop(c, level, width); return }
  target.setTransform(pixelWidth / width, 0, 0, pixelHeight / 480, 0, 0)
  paintBackdrop(target, level, width)
  const pixels = pixelWidth * pixelHeight
  while (backdrops.size && (backdrops.size >= 3 || backdropPixels + pixels > 16_000_000)) { const oldest = backdrops.keys().next().value!; backdropPixels -= backdrops.get(oldest)!.pixels; backdrops.delete(oldest) }
  backdrops.set(key, { surface, pixels }); backdropPixels += pixels; c.drawImage(surface, 0, 0, width, 480)
}
export function drawProps(c: Ctx, level: Level, camera: number, width: number, run?:Run,reduced=false) {
  if(level.biome==='desert'){desertProps(c,camera,width,level);return}
  const p = WAR_PALETTES[level.id]!
  for (let x = Math.floor(camera / 440) * 440; x < camera + width + 440; x += 440) {
    // Rear fixtures need continuous ground beneath the whole base; omit them over gaps and slopes.
    const footing=level.id===0?undefined:level.ground.find(g=>!g.rise&&g.x<=x+135&&g.x+g.w>=x+260)
    if(level.id!==0&&!footing)continue
    c.save();if(footing)c.translate(0,footing.y-390)
    const variant = Math.abs(Math.floor(x / 440)) % 3,powered=!run||sceneryPowered(run,x+150)
    if (level.id === 0) {
      metal(c, x + 138, 326, 100, 64, '#516d7b', '#253c4c'); for (let j = 0; j < 9; j++) line(c, [x + 144 + j * 10, 332, x + 144 + j * 10, 384], '#8b9b9a36')
      rect(c, x + 144, 347, 40, 14, '#192f3b'); rect(c, x + 148, 352, 30, 2, powered?p.accent+'82':'#364b52'); bolts(c, x + 138, 326, 100, 64)
    } else drawDistrictEquipment(c,level.id,x+135,powered,run?.time??0,reduced)
    c.font = frontFont(9); c.textAlign = 'left'; c.fillStyle = '#adbec26b'; c.fillText(`${["Dock", "Forge", "Skyway", "Outpost", "Nexus", "Reactor"][level.id]} / ${String(Math.floor(x / 440) + 1).padStart(3, '0')}`, x + 143, 340 - variant * 5)
    // 装饰电缆与碎石放在落脚面后，不能误认成碰撞障碍。
    line(c, [x + 320, 392, x + 350, 385, x + 390, 391, x + 415, 387], '#142936', 2)
    c.restore()
  }
  if(run&&level.id===0)drawIndustrialAmbience(c,level,run,camera,width,reduced)
}
export function drawDeck(c: Ctx, x: number, y: number, w: number, h: number, camera: number, width: number, accent: string, floating = false, surface: Level['dungeon']['surface'] = 'dock') {
  if(surface==='desert'){desertDeck(c,{x,y,w,h},camera,width,floating);return}
  drawIndustrialDeck(c,x,y,w,h,camera,width,accent,floating,surface)
}

export function drawWeapon(c: Ctx, x: number, y: number, angle: number, weapon: Weapon, firing = false, enemy = false, length = 30) {
  c.save();c.translate(x,y);c.rotate(angle)
  const scale=length/firearmMuzzle(25,weapon);c.scale(scale,scale)
  paintFirearm(c,0,0,0,weapon,firing,enemy,25)
  c.restore()
}

function drawInfantryWeapon(c: Ctx, x: number, y: number, angle: number, weapon: Weapon, firing = false, enemy = false, length = 30, phase = 0) {
  paintInfantryWeapon(c,x,y,angle,weapon,firing,enemy,length,phase)
}
type TrooperPose=InfantryPose
const playerMotion=new WeakMap<Run,MotionTracker>(),guardMotion=new WeakMap<Enemy,MotionTracker>()
function trooper(c:Ctx,x:number,feet:number,face:number,time:number,moving:boolean,crouch:boolean,enemy:boolean,kind='',airborne=false,armor=0,pose:TrooperPose={},operative?:OperativeId,desert=false){
  return paintInfantry(c,{desert,operative,x,feet,facing:face,time,moving,crouch,enemy,kind,airborne,armor,pose})
}
export function runningPose(time:number,active:boolean){
  const phase=(Number.isFinite(time)?time:0)*Math.PI*5
  return active?{rise:-.84*(1-Math.cos(phase*2)),lean:.075+Math.sin(phase)*.015,sway:Math.sin(phase)*.28,arm:Math.sin(phase+.35)*.7,gunY:Math.sin(phase*2+.3)*.2}:{rise:0,lean:0,sway:0,arm:0,gunY:0}
}
export function drawPlayer(c: Ctx, run: Run, input: Input, reducedMotion = false) {
  if (run.status === 'dead') return
  const moving = run.ladder !== null ? input.up || input.duck : run.grounded && (input.left || input.right) && !run.duck
  if (run.grounded) { c.save(); c.globalAlpha *= .3; c.fillStyle = '#06141f'; c.beginPath(); c.ellipse(run.x + 13, run.y + 40, 13*INFANTRY_VISUAL_SCALE, 2.3, 0, 0, Math.PI * 2); c.fill(); c.restore() }
  c.save()
  c.translate(run.x+13,run.y+40);c.scale(INFANTRY_VISUAL_SCALE,INFANTRY_VISUAL_SCALE);c.translate(-run.x-13,-run.y-40)
  if (run.invincible > 0 && !(run.dashTime>0) && !reducedMotion && Math.floor(run.invincible * 6) % 2 === 1) c.globalAlpha *= .25
  const activity=run.infantryMotion??trackInfantry(playerMotion.get(run),run.x,run.time,run.grounded,moving,run.facing,run.duck);playerMotion.set(run,activity)
  const rig=playerRig(run,input,reducedMotion,activity),rotation=rig.rotation
  if(rotation){c.translate(run.x+13,run.y+20);c.rotate(rotation);c.translate(-run.x-13,-run.y-20)}
  const slung=(!!run.zipline||run.rope!==null||run.ladder!==null)&&!input.shoot
  if (slung) drawInfantryWeapon(c, run.x + 13 - run.facing * 6, run.y + 8, run.facing > 0 ? 1.18 : Math.PI - 1.18, run.weapon, false, false, 21)
  if(run.dashTime>0&&!reducedMotion)for(const offset of [22,11]){c.save();c.globalAlpha*=offset===22?.08:.16;c.translate(-run.dashFacing*offset,0);const ghost=paintInfantry(c,rig.options);drawInfantryWeapon(c,ghost.x,ghost.y,ghost.angle,run.weapon,false,false,25);c.restore()}
  const gun=paintInfantry(c,rig.options)
  if (!slung && run.mountedGun === null) drawInfantryWeapon(c, gun.x, gun.y, gun.angle, run.weapon, run.gunfire?.weapon===run.weapon && (run.gunfire.at!==undefined?run.time-run.gunfire.at<(run.weapon==='rocket'?.13:.055):run.fireDelay>(run.shotDelay??WEAPONS[run.weapon].delay)-(run.weapon==='rocket'?.13:.055)), false, 25,run.time*83)
  c.restore()
}
export function drawCombatant(c:Ctx,e:Enemy,run:Run,locomotion?:InfantryMotion,reduced=false){
  if(e.desertBoss){drawDesertBoss(c,e,reduced);return}
  const direction=run.x<e.x?-1:1,activity=locomotion??e.infantryMotion??trackInfantry(guardMotion.get(e),e.x,e.age,true,true,direction)
  if(!locomotion)guardMotion.set(e,activity as MotionTracker)
  if (e.drawScale && e.drawScale !== 1) {
    const scale = e.drawScale
    c.save(); c.translate(e.x, e.y); c.scale(scale, scale)
    drawCombatant(c, { ...e, x: 0, y: 0, w: e.w / scale, h: e.h / scale, vehicleMotion:e.vehicleMotion?{...e.vehicleMotion,distance:e.vehicleMotion.distance/scale,speed:e.vehicleMotion.speed/scale}:undefined, drawScale: 1 }, { ...run, x: (run.x - e.x) / scale, y: (run.y - e.y) / scale },activity,reduced)
    c.restore(); return
  }
  const x = e.x, y = e.y, face = run.x < x ? -1 : 1, accent = '#f1a28a'
  if (e.type === 'tank') {
    drawIndustrialTank(c,e,reduced)
  } else if (e.type === 'mech') {
    const stride=mechStride(e,1,reduced),opposite=mechStride(e,-1,reduced),gait=stride.lift-opposite.lift,settle=(stride.compress+opposite.compress)*.5
    for (const [dx, s] of [[26, 1], [82, -1]]) { const a = dx!, b = s!; line(c, [x + a, y + 64, x + a + b * 5, y + 83 + gait * b + settle, x + a - b * 7, y + 104], '#152a3d', 23); line(c, [x + a, y + 64, x + a + b * 5, y + 83 + gait * b + settle, x + a - b * 7, y + 104], '#778491', 15); disc(c, x + a + b * 5, y + 83 + gait * b + settle, 8, '#283e52'); disc(c, x + a + b * 5, y + 83 + gait * b + settle, 3, accent); metal(c, x + a - 18, y + 99, 34, 12, '#8b9aaa', '#34495c', 3) }
    c.save();c.translate(0,settle)
    metal(c, x + 13, y + 22, 84, 48, '#aab2b6', '#4d6077', 8); metal(c, x + 26, y + 1, 57, 30, '#91a4ac', '#344c66', 7)
    rect(c, x + 35, y + 11, 41, 6, accent, 2); polygon(c, [x + 38, y + 36, x + 72, y + 36, x + 63, y + 58, x + 46, y + 58], '#223c53'); disc(c, x + 55, y + 45, 7, '#eda78c')
    metal(c, x - 2, y + 24, 24, 28, '#98a7af', '#405670', 5); metal(c, x + 88, y + 24, 24, 28, '#98a7af', '#405670', 5); bolts(c, x + 13, y + 22, 84, 48)
    // Separate hydraulic rods, ankle pivots and replaceable shin plates.
    for(const [dx,side] of [[26,1],[82,-1]]){const kneeY=y+83+gait*side+settle
      line(c,[x+dx-4,y+61,x+dx+side*5-4,kneeY],'#213843',5);line(c,[x+dx-4,y+64,x+dx+side*5-4,kneeY-3],'#b4bfb4',2)
      line(c,[x+dx+side*5,kneeY+3,x+dx-side*7,y+101],'#1f3644',8);line(c,[x+dx+side*5-1,kneeY+5,x+dx-side*7-1,y+98],'#92a49d',3)
      for(const a of [-1,1])disc(c,x+dx+side*5+a*5,kneeY,1,'#b5b9a0')
      line(c,[x+dx-12,y+105,x+dx+9,y+105],'#c5c5ad',.8)
    }
    metal(c,x+31,y+26,49,7,'#7e8e8c','#2a414f',1)
    for(let i=0;i<5;i++){rect(c,x+36+i*8,y+28,4,2,'#172e3b');line(c,[x+20,y+38+i*4,x+29,y+38+i*4],'#1e3541',1)}
    for(const dx of[1,89]){line(c,[x+dx,y+28,x+dx,y+48],'#b0b8a1',1);for(let i=0;i<3;i++)rect(c,x+dx+4,y+31+i*5,10,2,'#243c4b')}
    line(c,[x+29,y+8,x+24,y+4,x+24,y-6],'#8ba29d',1);disc(c,x+24,y-6,1.3,'#d0b68d')
    c.restore()
    drawWeapon(c, x + e.w / 2, y + e.h * .38, e.aim, 'rapid', (e.shotFlash??0) > .07, true, 69)
  } else if (e.type === 'core') {
    metal(c, x + 3, y, e.w - 6, e.h, '#819ba7', '#263c53', 8); bolts(c, x + 3, y, e.w - 6, e.h)
    for (const dx of [12, 98]) for (let k = 0; k < 4; k++) rect(c, x + dx, y + 13 + k * 14, 10, 3, '#8aa7ba')
    disc(c, x + 60, y + 40, 29, '#102b42'); c.save(); c.translate(x + 60, y + 40); c.rotate(reduced?0:e.age * .18); for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); polygon(c, [19, -7, 29, -4, 29, 4, 19, 7], '#b4b8d3') }; c.restore()
    glow(c, x + 60, y + 40, 44, '#b6a5f1', .22); disc(c, x + 60, y + 40, 16, '#8fb5d0'); disc(c, x + 60, y + 40, 9, '#d2d6ef')
    drawWeapon(c, x + e.w / 2, y + e.h * .38, e.aim, 'beam', (e.shotFlash??0) > .07, true, 76)
  } else if (e.type === 'drone') {
    drawIndustrialDrone(c,e,reduced)
  } else if (e.type === 'mortar') {
    line(c, [x + 20, y + 18, x + 4, y + 41, x + 22, y + 33, x + 40, y + 41, x + 23, y + 18], '#738d98', 4)
    metal(c, x + 7, y + 22, 30, 12, '#9a9b86', '#4a5b59', 3)
    c.save(); c.translate(x + 22, y + 24); c.rotate(face < 0 ? -.65 : .65)
    metal(c, -6, -28, 12, 29, '#a1b4b2', '#3c535f', 2); rect(c, -7, -30, 14, 5, '#1c3245', 1)
    rect(c, -3, -19, 6, 9, '#d2c17e', 1); c.restore()
    disc(c, x + 22, y + 23, 5, '#213b4a'); disc(c, x + 22, y + 23, 2, '#b9c3ab')
  } else if (e.type === 'turret') {
    drawIndustrialTurret(c,e)
  } else {
    c.save();c.translate(x+e.w/2,y+e.h);c.scale(INFANTRY_VISUAL_SCALE,INFANTRY_VISUAL_SCALE);c.translate(-x-e.w/2,-y-e.h)
    const action=infantryAction(e,face,reduced)
    const gun=trooper(c,x+e.w/2,y+e.h,face,e.age,activity.blend>.02,false,true,e.type,false,0,{...action,motion:activity,shooting:(e.shotFlash??0)>0,recoil:Math.min(1,(e.shotFlash??0)/.12),hit:Math.min(1,(e.hitFlash??0)/.12)},undefined,!!e.desert)
    drawInfantryWeapon(c,gun.x,gun.y,gun.angle,e.type==='heavy'?'rapid':e.type==='sniper'?'beam':'rifle',(e.shotFlash??0)>.07,true,e.type==='sniper'?29:23,e.age*83)
    c.restore()

  }
  if(['mech','core','drone','turret','mortar'].includes(e.type))drawVehicleDamage(c,e,reduced)
}
export function drawProjectiles(c: Ctx, run: Run, camera: number, width: number) {
  for (const b of run.bullets) {
    if (b.x < camera - 60 || b.x > camera + width + 60) continue
    paintAmmunition(c,b,run.time,run.biome==='desert')
  }
}
export function drawCombatEffects(c: Ctx, run: Run, camera: number, width: number, reduced = false) {
  for (const fx of run.effects) {
    if (fx.x < camera - 160 || fx.x > camera + width + 160) continue
    if(fx.kind==='fall'&&fx.fallen){
      const e=fx.fallen,age=Math.max(0,effectDuration(fx)-fx.time),t=reduced?1.16:age,scale=INFANTRY_VISUAL_SCALE*(e.drawScale??1),face=fx.facing??(run.x<e.x?-1:1),side=(fx.angle??1)*face
      const floor=fx.floor??fx.y,feet=Math.min(floor,fx.y+310*t*t)
      c.save();c.globalAlpha*=Math.min(1,fx.time/.3);c.beginPath();c.rect(fx.x-220,fx.y-220,440,Math.max(1,floor-fx.y+220));c.clip();c.translate(fx.x,feet);c.scale(scale,scale)
      const weapon=e.type==='heavy'?'rapid':e.type==='sniper'?'beam':'rifle'
      const gun=paintInfantry(c,{x:0,feet:0,facing:face,time:0,moving:false,crouch:false,enemy:true,kind:e.type,desert:!!e.desert,pose:{aim:e.aim,collapse:{age:t,side,variant:e.id}}})
      if(t<.18)paintFirearm(c,gun.x,gun.y,e.aim,weapon,false,true,23)
      else{const d=Math.max(0,t-.18),contact=Math.max(0,Math.min(1,(d-.38)/.16)),y=Math.min(-4,-27+8*d+170*d*d),a=(e.aim+(fx.angle??1)*Math.min(.5,d)*3.5)*(1-contact)+(face>0?.08:Math.PI-.08)*contact;paintFirearm(c,face*5+(fx.angle??1)*Math.min(d,.5)*17,y,a,weapon,false,true,23)}
      if(!reduced&&t>.65&&t<1){c.globalAlpha*=Math.sin((t-.65)/.35*Math.PI)*.25;for(let i=0;i<4;i++)line(c,[(fx.angle??1)*(12+i*4),-1,(fx.angle??1)*(16+i*5),-2-i%2],'#9b9e8a',1)}
      c.restore();continue
    }
    if(fx.kind==='destroy'||fx.kind==='boss'||fx.kind==='blast'){paintExplosion(c,fx,reduced,run.biome==='desert');continue}
    if(fx.kind==='scrap'||fx.kind==='hit'&&fx.impact){paintImpact(c,fx,reduced,run.biome==='desert');continue}
    const duration = effectDuration(fx), age = Math.max(0, Math.min(1, 1 - fx.time / duration)), progress = reduced ? .45 : age, fade = 1 - age
    const blast = fx.kind === 'blast' || fx.kind === 'destroy' || fx.kind === 'boss', color = fx.kind === 'pickup' ? '#94e3d8' : '#efb37e', radius = blast ? 9 + progress * (fx.kind === 'boss' ? 155 : fx.kind === 'blast' ? 115 : 52) : 3 + progress * 19
    c.save(); c.globalAlpha = fade * .78
    if (fx.kind === 'jump' || fx.kind === 'land') {
      for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, x = fx.x + side * (5 + progress * (18 + i * 4)), y = fx.y - Math.sin(progress * Math.PI) * (3 + i % 3 * 3); line(c, [x, y, x - side * (3 + fade * 6), y + 1], '#a6cad4', 1.2) }
      c.restore(); continue
    }
    if (blast) {
      if (!reduced) for (let i = 0; i < 5; i++) {
        const a = i * 2.399, r = radius * (.25 + i * .06)
        c.globalAlpha = Math.sin(age * Math.PI) * .35
        glow(c, fx.x + Math.cos(a) * r * .7, fx.y - progress * 34 + Math.sin(a) * r * .4, radius * (.35 + i * .025), i % 2 ? '#46505a' : '#202d3a', .85)
      }
      c.globalAlpha = fade * .8
      glow(c, fx.x, fx.y, radius * .9 + 14, color, reduced ? .15 : .4)
      const core = Math.max(0, 1 - age * 2.3)
      if (core > 0) {
        for(let i=0;i<5;i++){const a=i*2.399,r=(fx.kind==='destroy'?6:13)*core;disc(c,fx.x+Math.cos(a)*r*.65,fx.y+Math.sin(a)*r*.55,r*(.7+i%2*.2)+1,i%2?'#edb16b':'#d38345')}
        glow(c,fx.x-2,fx.y-2,(fx.kind==='destroy'?8:18)*core+1,'#fff0bb',.9)
      }
      if (!reduced && age < .65) for (let i = 0; i < 7; i++) {
        const a = i * 2.399, reach = radius * (.24 + i % 3 * .08)
        c.globalAlpha = fade * Math.max(0, 1 - age * 1.5) * .6
        disc(c, fx.x + Math.cos(a) * reach, fx.y + Math.sin(a) * reach * .65 - age * 15, (7 + i % 3 * 3) * fade, i % 2 ? '#e5a054' : '#b76c3e')
      }
      c.globalAlpha = fade * .8

    } else if (fx.kind === 'hit') {
      // 短促的四向命中火花，无人物外圈。
      const gap = reduced ? 3 : 2 + progress * 5
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) line(c, [fx.x + dx! * gap, fx.y + dy! * gap, fx.x + dx! * (gap + 4 * fade), fx.y + dy! * (gap + 4 * fade)], '#ffdf9a', 1.8 * fade + .5)
      if (!reduced && age < .3) disc(c, fx.x, fx.y, 2.5 * fade, '#fff4cd')
    }

    const count = reduced ? 3 : fx.kind === 'boss' ? 30 : blast ? 22 : 9
    for (let i = 0; i < count; i++) {
      const seed = fx.x * .017 + fx.y * .031 + i * 2.399, distance = radius * (.3 + (i % 4) * .22)
      const x = fx.x + Math.cos(seed) * distance, y = fx.y + Math.sin(seed) * distance * .75 + progress * progress * 25
      if (blast && i % 3 === 0) polygon(c, [x, y, x + 4 * fade, y - 2, x + 2, y + 3], '#8399a5')
      else line(c, [x, y, x - Math.cos(seed) * (3 + fade * 7), y - Math.sin(seed) * (3 + fade * 7)], color, 1.2)
    }
    c.restore()
  }
}
export function drawVictory(c: Ctx, width: number, elapsed: number, accent: string, reduced = false) {
  const t = Math.max(0, Math.min(1, elapsed / 3.2)), x = width / 2, y = 210
  c.save(); c.globalAlpha = Math.min(.7, t * 3)
  const veil = c.createLinearGradient(0, 0, 0, 480); veil.addColorStop(0, '#071b2de0'); veil.addColorStop(.45, '#102e4080'); veil.addColorStop(1, '#071b2deb'); rect(c, 0, 0, width, 480, veil)
  c.globalAlpha = 1; glow(c, x, y, 170, accent, .14)
  const expansion = reduced ? 1 : Math.min(1, t * 2.2)
  for (let j = 0; j < 3; j++) {
    const r = (58 + j * 22) * (.8 + expansion * .2)
    c.strokeStyle = accent + (j ? '3a' : 'bb'); c.lineWidth = j ? 1 : 2
    c.beginPath(); for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!i) c.moveTo(px, py); else c.lineTo(px, py) }; c.stroke()
  }
  polygon(c, [x - 24, y - 14, x - 5, y + 3, x + 30, y - 30, x + 39, y - 21, x - 5, y + 22, x - 33, y - 4], '#c8e4dc')
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const a = x + side * (105 + i * 20); polygon(c, [a, y - 6, a + side * 14, y - 13, a + side * 9, y + 7, a - side * 5, y + 14], accent + '65') }
  if (!reduced) for (let i = 0; i < 28; i++) { const a = i * 2.399, r = 85 + t * (30 + i % 5 * 18), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .75; c.globalAlpha = (1 - t * .6) * .45; line(c, [px, py, px - Math.cos(a) * 8, py - Math.sin(a) * 8], i % 2 ? accent : '#e4bc8f', 1.5) }
  c.restore()
}
export function drawMechanicalSpikes(c: Ctx, spike: { x: number, y: number, w: number, h: number }) {
  const { x, y, w, h } = spike, floor = y + h, count = Math.max(2, Math.ceil(w / 15)), cell = w / count
  metal(c, x - 4, floor - 7, w + 8, 10, '#879aa8', '#263e52', 2)
  rect(c, x - 3, floor - 7, w + 6, 2, '#c1d1d5'); rect(c, x - 1, floor - 4, w + 2, 5, '#132c3e')
  for (let i = 0; i < count; i++) {
    const left = x + i * cell, tip = left + cell * .52
    rect(c, left + 1, floor - 8, cell - 2, 3, '#0c2132', 1)
    polygon(c, [left, floor - 6, tip, y - 1, left + cell - 1, floor - 6], '#182e42')
    const g = c.createLinearGradient(left, y, left + cell, floor); g.addColorStop(0, '#d4e1e4'); g.addColorStop(.42, '#839caa'); g.addColorStop(1, '#40596e')
    polygon(c, [left + 2, floor - 7, tip, y + 1, tip - 1, floor - 7], g)
    polygon(c, [tip, y + 1, left + cell - 3, floor - 7, tip - 1, floor - 7], '#4c657b')
    line(c, [left + 2, floor - 7, tip, y + 1], '#d4e5eaaa', .8)
    rect(c, left + cell * .4, floor - 2, Math.max(2, cell * .25), 2, '#e1b378', 1)
    disc(c, left + 2, floor + 1, .8, '#93a9b2')
  }
  for (const xx of [x - 3, x + w]) { rect(c, xx, floor - 4, 3, 5, '#b59a67'); line(c, [xx, floor - 4, xx + 3, floor - 1], '#2a3e50') }
}

export function drawTraversal(c: Ctx, level: Level, run: Run, camera: number, width: number, language: 'en' | 'zh' = 'zh') {
  const accent = WAR_PALETTES[level.id]!.accent
  for (const r of level.ropes) {
    if (r.x + r.length < camera || r.x - r.length > camera + width) continue
    metal(c, r.x - 250, r.y + 263, 46, 7, '#94a9af', '#3c566a', 1); for (let k = 0; k < 4; k++) rect(c, r.x - 245 + k * 10, r.y + 263, 5, 3, '#d2ae78')
    const angle = run.ropeMotion[r.id]?.angle ?? -.85, end = ropePoint(r, angle)
    metal(c, r.x - 61, r.y - 11, 122, 12, '#8094a3', '#304a60', 3); bolts(c, r.x - 61, r.y - 11, 122, 12)
    line(c, [r.x - 48, r.y - 6, r.x - 19, r.y + 12, r.x + 19, r.y + 12, r.x + 48, r.y - 6], '#415b6d', 4)
    disc(c, r.x, r.y, 13, '#172e42'); disc(c, r.x, r.y, 8, '#8098a8'); disc(c, r.x, r.y, 3, '#c5ccba');line(c,[r.x-1.7,r.y,r.x+1.7,r.y],'#465d67',.8)
    paintSteelCable(c,r.x,r.y,end.x,end.y,run.rope===r.id,run.time)
    c.fillStyle = '#b7ced1'; c.font = frontFont(10, language); c.textAlign = 'center'; c.fillText(language === 'en' ? "Grapple anchor" : '吊索锚点', r.x, r.y - 22)
    if (run.rope !== r.id) { c.fillStyle = accent; c.fillText(language === 'en' ? "E grab" : 'E 抓索', end.x - 32, end.y - 7) }
  }
  for (const l of level.ladders) {
    if (l.x + l.w < camera || l.x > camera + width) continue
    rect(c, l.x - 5, l.y + 6, l.w + 10, l.h - 6, '#0c263959', 3)
    metal(c, l.x, l.y - 8, 5, l.h + 10, '#b2c5cd', '#536e81', 2); metal(c, l.x + l.w - 5, l.y - 8, 5, l.h + 10, '#b2c5cd', '#536e81', 2)
    for (let y = l.y + 10; y < l.y + l.h - 4; y += 14) { rect(c, l.x + 3, y, l.w - 6, 4, '#7898a9', 1); line(c, [l.x + 5, y, l.x + l.w - 5, y], '#d0dedc77') }
    rect(c, l.x - 7, l.y - 10, l.w + 14, 5, accent, 1)
    c.fillStyle = '#c0d6d5'; c.font = frontFont(10, language); c.textAlign = 'center'; c.fillText(language === 'en' ? "E grab · W/S climb" : 'E 抓梯 · W/S 攀爬', l.x + l.w / 2, l.y - 23)
  }
}

// 独立的首页演出时钟，不修改实战位置、计时或存档。
export function titleMotion(elapsed: number, reduced = false) {
  const time = !reduced && Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0
  return { backdrop: 0, deck: time * 210, stride: time * .96, moving: !reduced, facing: 1 }
}
export function drawFrontTitle(c: Ctx, level: Level, width: number, elapsed = 0, reduced = false, space?: {left:number,right:number}, operative:OperativeId='raven') {
  // A single stationary scenic plate avoids seams in the non-tileable artwork.
  // Foreground walking, aircraft and searchlights keep their independent animation.
  drawBackdrop(c, level, width)
  const artLeft=space?.left??width/2,artRight=space?.right??width
  const travel=titleDemoTravel(width,reduced)
  c.save();c.translate(-travel,0)
  drawDeck(c, travel, 412, width, 68, travel, width, WAR_PALETTES[level.id]!.accent, false, level.dungeon.surface)
  c.restore()
  drawTitleCamp(c,artLeft,artRight,elapsed,reduced)
  drawTitleBattle(c,0,width,elapsed,reduced,operative,level.biome==='desert')
}

export {drawOperativeFront as drawOperativePortrait} from './front-operative-portrait.ts'
