import {environmentalKind,radarAlarmOff} from './front-environment.ts'
import {drawEnvironmentInteraction} from './front-environment-draw.ts'
import {drawInteractiveDetail} from './front-equipment-detail.ts'
import { paintMuzzleFlash } from './front-firearms'
import { drawEquipmentFinish } from './front-materials'
import { drawHealthBar } from './front-feedback'
import type { Level, Run } from './front'
import { rect, line, polygon, disc, metal, glow } from './front-art'
import { frontFont } from './front-font'
export function drawInteractions(c: CanvasRenderingContext2D, run: Run, level: Level, camera: number, width: number, language: 'en' | 'zh' = 'zh', reducedMotion = false) {
  const en = language === 'en'
  const candidates = run.interactives.filter(p => Math.abs(run.x - p.x) < 340 && (p.hp > 0 || p.kind !== 'barrel'))
  const focus = candidates.find(p => p.id === run.mountedGun) ?? candidates.find(p => p.kind === 'alarm' && p.hp > 0 && p.timer >= 0 && !p.triggered && !radarAlarmOff(run,p.x)) ?? candidates.sort((a, b) => Math.abs(a.x - run.x - 13) - Math.abs(b.x - run.x - 13))[0]
  for (const p of run.interactives) {
    if (p.x < camera - 80 || p.x > camera + width + 80) continue
    if(environmentalKind(p.kind)){drawEnvironmentInteraction(c,p,level,run,camera,width,language,reducedMotion);continue}
    c.save(); c.translate(p.x, p.y)
    const destroyed = p.hp <= 0, near = p.id === focus?.id
    let label = '', hint = '', color = '#d9bd83'
    if (destroyed) {
      if(['power','relay','alarm','coolant'].includes(p.kind)){
        metal(c,2,4,Math.max(12,p.w-4),p.h-4,'#465451','#1b2e38',1)
        polygon(c,[3,5,p.w-4,7,p.w-8,p.h-8,6,p.h-5],'#132732')
        line(c,[5,8,10,12,7,17,14,p.h-4],'#897e67',.8);line(c,[p.w-6,9,p.w-10,18,p.w-6,p.h-4],'#506a70',1)
        polygon(c,[-1,p.h-12,4,p.h-14,8,p.h-3,1,p.h],'#53615e')
        if(p.kind==='relay'){for(let i=0;i<3;i++)rect(c,6,7+i*6,8,2,'#3c4052',.5)}
      }else polygon(c, [-2, p.h, 2, p.h - 9, 8, p.h - 5, 17, p.h - 12, 24, p.h], '#30424a')
      line(c, [0, p.h - 1, 24, p.h - 1], '#927f63', 2)
      if (p.kind === 'coolant') { label = en ? "Cooling disabled" : '冷却已切断'; color = '#8fceb8' }
      else if (p.kind === 'relay') { label = en ? "Relay destroyed" : '护盾中继已毁'; color = '#8fceb8' }
      else if (p.kind === 'power') { label = en ? "Power cut" : '已断电'; color = '#8fceb8' }
      else if (p.kind === 'alarm') { label = p.triggered ? en ? "Alarm destroyed" : '警报器已毁' : en ? "Reinforcements prevented" : '已阻止增援'; color = '#8fceb8' }
    } else if (p.kind === 'barrel') {
      metal(c, 1, 0, 22, 30, '#bb6951', '#643b39', 4)
      for (const y of [5, 23]) { rect(c, 0, y, 24, 3, '#293d47', 1); line(c, [3, y, 20, y], '#bf9983', .6) }
      polygon(c, [12, 9, 17, 18, 7, 18], '#f1c477'); line(c, [12, 12, 12, 15], '#623c32', 1)
      rect(c, 5, 1, 5, 2, '#e0aa83', 1)
      label = en ? "Explosive" : '爆炸油桶'; hint = en ? "Shoot to chain explosions" : '射击引爆 · 可连锁爆炸'
    } else if (p.kind === 'power') {
      metal(c, -1, 0, 26, 30, '#7d9299', '#344a59', 2)
      rect(c, 3, 4, 18, 19, '#152f40', 1); polygon(c, [13, 6, 7, 15, 12, 15, 10, 21, 18, 12, 13, 12], '#ecc776')
      disc(c, 20, 26, 1.5, '#93e3cb'); line(c, [12, 30, 12, 33, 40, 33], '#607976', 2)
      label = en ? "Defense power" : '防御电箱'; hint = en ? "Shoot: disable nearby defenses" : '击毁可关闭附近电网、炮台和无人机'
      // 可见电缆帮助玩家理解电箱与防御机关的联系。
      for (const h of level.hazards) if (h.type === 'laser' && Math.abs(h.x - p.x) < 480) line(c, [12, 30, h.x - p.x, 30, h.x - p.x, h.y - p.y + h.h], '#6b89745c', 1)
    } else if (p.kind === 'mine') {
      metal(c, 0, 5, 24, 7, '#b9ac7b', '#3a4f54', 2); disc(c, 12, 5, 5, '#68796d'); disc(c, 12, 4, 2, p.timer >= 0 ? '#f19f7b' : '#dbc181')
      label = en ? "Proximity mine" : '感应地雷'; hint = en ? "Crouch-fire to disarm · or jump over" : '蹲射可拆除 · 或跳过感应范围'
    } else if (p.kind === 'coolant') {
      metal(c, 2, 0, 20, 30, '#749ca0', '#274955', 2); line(c, [12, 4, 12, 25], '#a8e0d4', 3)
      c.strokeStyle = '#b8dbcf'; c.lineWidth = 2; c.beginPath(); c.arc(12, 13, 7, 0, Math.PI * 2); c.stroke(); line(c, [5, 13, 19, 13, 12, 13, 12, 6, 12, 20], '#d2dbc2', 1.4)
      label = en ? "Boss coolant valve" : '首领冷却阀'; hint = en ? "Destroy to expose the furnace core" : '击毁后，首领泄压时暴露炉心'
    } else if (p.kind === 'relay') {
      metal(c, 1, 0, 22, 30, '#9b92be', '#35445d', 2)
      for (let i = 0; i < 3; i++) { rect(c, 6, 5 + i * 8, 12, 3, '#baa4ee', 1); glow(c, 12, 6 + i * 8, 9, '#ac95e5', .16) }
      label = en ? "Core shield relay" : '核心护盾中继'; hint = en ? "Destroy both relays before attacking core" : '摧毁两座中继，才能伤害核心'
    } else if (p.kind === 'alarm') {
      metal(c, 9, 18, 6, 40, '#8f9b9b', '#3a505e', 1)
      metal(c, 1, 5, 22, 19, '#9d7069', '#4b3542', 3)
      const suppressed=radarAlarmOff(run,p.x),active = p.timer >= 0 && !p.triggered&&!suppressed
      const lit = active && (reducedMotion || Math.sin(run.time * 12) > 0)
      rect(c, 6, 0, 12, 9, lit ? '#ff9577' : '#b86b5e', 3)
      if (lit) glow(c, 12, 5, 23, '#e68b70', .25)
      for (let i = 0; i < 3; i++) line(c, [5, 11 + i * 3, 19, 11 + i * 3], '#222f3c', 1)
      color = active ? '#f0a282' : '#d9bd83'
      label = suppressed?(en?'Alarm link offline':'警报链路停用'):p.triggered ? en ? "Reinforcements called" : '增援已呼叫' : active ? en ? `Alarm: ${p.timer.toFixed(1)}s` : `增援倒计时 ${p.timer.toFixed(1)} 秒` : en ? "Alarm beacon" : '警报器'
      hint = suppressed?(en?'Radar destroyed · no reinforcements':'区域雷达已毁 · 不再呼叫增援'):!p.triggered ? en ? "Destroy to stop reinforcements" : '立即打掉，阻止敌方增援' : ''
    } else {
      const mounted = run.mountedGun === p.id, facing = mounted ? run.facing : 1
      line(c,[22,14,10,36,22,28,34,36,22,14],'#172c37',5)
      line(c,[22,14,10,36,22,28,34,36,22,14],'#81979d',2)
      for(const foot of [7,30]){metal(c,foot,35,9,3,'#8e9e9b','#2e4550',1)}
      metal(c,12,14,11,14,'#637c83','#233b47',2);rect(c,14,17,7,6,'#334b4d',1)
      for(let i=0;i<4;i++){rect(c,12+i*3,11,2.2,3.5,'#b3a477',.5)}
      c.save(); c.translate(22,6);c.scale(facing,1);if(mounted){const aim=run.fireAngle??(facing>0?0:Math.PI);c.rotate(Math.atan2(Math.sin(aim),Math.cos(aim)*facing))}
      const firing=mounted&&run.fireDelay>.04&&!p.overheated
      if(firing&&!reducedMotion)c.translate(-Math.min(1,run.fireDelay/.08)*1.8,0)
      const receiver=c.createLinearGradient(0,-7,0,6);receiver.addColorStop(0,'#a4b2ab');receiver.addColorStop(.3,'#657d83');receiver.addColorStop(1,'#2d4655')
      polygon(c,[-14,-3,-9,-7,11,-7,17,-2,15,5,-11,6,-14,3],receiver)
      line(c,[-9,-7,10,-7,14,-3],'#c2c7b777',.7);metal(c,14,-3,20,5,'#81969a','#2f4b5b',1)
      for(let vent=0;vent<3;vent++)rect(c,17+vent*4,-1.5,1.5,2,'#132c39')
      metal(c,-17,-2,5,10,'#59737e','#263e4c',1);line(c,[-5,-8,-5,-11,6,-11,6,-8],'#8b9d98',1.3)
      drawEquipmentFinish(c,-12,-5,25,10,1)
      for(let slot=0;slot<4;slot++)line(c,[-6+slot*4,-4,-4+slot*4,-4],'#1a2d39',1)
      line(c,[15,-2,32,-2],'#b3bbb1',.65);rect(c,29,-4,5,7,'#243b49',1)
      rect(c, -16, -2, 6, 9, '#21394a', 1); disc(c,1,10,5,'#1b3443');disc(c,1,10,3.6,'#697f86');disc(c,1,10,1.3,'#b3b99d'); rect(c, -2, -8, 10, 2, '#d1bc82', 1)
      if (mounted && run.fireDelay > .04 && !p.overheated) paintMuzzleFlash(c,34,'rapid',run.time*51)
      c.restore()
      if(!reducedMotion&&firing){for(let i=0;i<2;i++){const t=(run.time*8+i*.4)%1;c.save();c.translate(22-facing*(9+t*13),-3-t*9+t*t*16);c.rotate(t*4);rect(c,-2,-.7,4,1.4,'#c5ab73',.3);c.restore()}}
      if(!reducedMotion&&p.heat>35){for(let i=0;i<2;i++){const t=(run.time*.7+i*.45)%1;c.strokeStyle='#c7c9b54d';c.lineWidth=.7;c.beginPath();c.moveTo(22+facing*21,-2-t*4);c.bezierCurveTo(18+facing*21,-8-t*6,29+facing*21,-11-t*9,22+facing*21,-17-t*10);c.stroke()}}
      color = p.overheated ? '#ef967c' : '#bcd4c5'
      label = p.overheated ? en ? "Overheated — cooling" : '机枪过热 · 冷却中' : en ? "Emplaced machine gun" : '固定机枪'
      hint = mounted ? en ? "J fire · A/D face · E/Space exit" : 'J 开火 · A/D 转向 · E / 空格离开' : en ? "E to operate" : '靠近按 E 操作'
      rect(c, 1, 40, 42, 3, '#223c4c', 1); rect(c, 1, 40, 42 * p.heat / 100, 3, color, 1)
    }
    if(!destroyed&&p.kind!=='mine'){
      if(p.kind!=='gun')drawEquipmentFinish(c,1,2,Math.max(12,p.w-2),Math.max(12,p.h-4),p.id)
      if(p.kind==='power'||p.kind==='relay'||p.kind==='coolant'){metal(c,-3,p.h-3,p.w+6,4,'#899791','#263e48',1);line(c,[1,3,p.w-2,3],'#bbc4b76b',.7)}
    }
    drawInteractiveDetail(c,p,level.id,run.time,reducedMotion)
    if (!destroyed && p.kind !== 'gun') drawHealthBar(c, p.w / 2 - 21, p.h + 4, 42, p.hp, p.kind === 'mine' ? 1 : p.kind === 'relay' || p.kind === 'coolant' ? 8 : p.kind === 'power' ? 3 : 2, '#d3ac78',3,{owner:p,time:run.time,reduced:reducedMotion,armor:true})
    if (near && label) {
      c.font = frontFont(9, language); c.textAlign = 'center'
      const panelWidth = Math.min(width - 24, Math.max(c.measureText(label).width, c.measureText(hint).width) + 16)
      const cx = Math.max(camera + panelWidth / 2 + 8 - p.x, Math.min(camera + width - panelWidth / 2 - 8 - p.x, p.w / 2))
      rect(c, cx - panelWidth / 2, -39, panelWidth, hint ? 31 : 18, '#0c2033ed', 3)
      c.fillStyle = color; c.fillText(label, cx, -27)
      if (hint) { c.font = frontFont(8, language); c.fillStyle = '#d5ddd3'; c.fillText(hint, cx, -15) }
    }
    c.restore()
  }
}
