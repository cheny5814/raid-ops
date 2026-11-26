import { readOperative, type OperativeId } from './front-operatives.ts'
import { CAMPAIGN } from './front-story.ts'
import type { Weapon } from './front'
export type FrontLanguage = 'en' | 'zh'
export type FrontPreferences = { operative:OperativeId, language: FrontLanguage, autoFire: boolean, aimAssist: boolean, sound: boolean, volume: number, music: boolean, musicVolume: number, audioVersion: 2, reducedMotion: boolean }
export function readFrontPreferences(raw: unknown): FrontPreferences {
  const p = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return { operative:readOperative(p.operative), language: p.language === 'zh' ? 'zh' : 'en', autoFire: p.autoFire === true, aimAssist: p.aimAssist !== false, sound: p.audioVersion === 2 ? p.sound !== false : true, music: p.music !== false, musicVolume: typeof p.musicVolume === 'number' && Number.isFinite(p.musicVolume) ? Math.max(0, Math.min(1, p.musicVolume)) : .32, audioVersion: 2, volume: typeof p.volume === 'number' && Number.isFinite(p.volume) ? Math.max(0, Math.min(1, p.volume)) : .8, reducedMotion: p.reducedMotion === true }
}
export const WEAPON_EN: Record<Weapon, { name: string, role: string, description: string, counter: string }> = {
  rifle: { name: 'Assault Rifle', role: 'Precision', description: 'High damage per shot with reliable mid-range accuracy.', counter: 'Infantry and snipers' },
  spread: { name: 'Shotgun', role: 'Crowd control', description: 'Seven low-damage pellets. Devastating up close, with a short effective range.', counter: 'Runners and close formations' },
  pulse: { name: 'Piercing Rifle', role: 'Armor piercing', description: 'Starts with four-target penetration; upgrades add penetration and damage to armor.', counter: 'Heavy armor and layered gates' },
  rapid: { name: 'Machine Gun', role: 'Anti-air', description: 'Low damage per round, a high rate of fire, and bonus damage to drones.', counter: 'Drones and moving targets' },
  rocket: { name: 'Rocket Launcher', role: 'Demolition', description: 'Slow-firing explosive rounds with powerful splash damage.', counter: 'Grouped enemies and blast walls' },
  beam: { name: 'Railcannon', role: 'Energy disruption', description: 'Heavy single-target shots tuned to overload energy defenses.', counter: 'Defense controllers and energy barriers' },
}
export const ZONES_EN = [
  { name: 'Harbor Landing', dungeon: 'Tidal Docks', description: 'Fight through container yards, broken loading bridges, and waterside platforms.', chapters: ['Container Yard', 'Tidal Loading Bridge', 'Cargo Walkways', 'Customs Blockade'] },
  { name: 'Armored Lockdown', dungeon: 'The Foundry', description: 'Thread the presses and cooling trenches. An armored war machine guards the assembly line.', chapters: ['Cooling Trench', 'Heavy Presses', 'Furnace Conveyor', 'Assembly Hall'] },
  { name: 'Skyway Pursuit', dungeon: 'Broken Skyway', description: 'Cross shattered spans and rising bridge piers under drone fire.', chapters: ['Bridge Workshop', 'Suspended Piers', 'Fractured Span', 'Air Defense Deck'] },
  { name: 'Mech Outpost', dungeon: 'Radar Fortress', description: 'Breach layered bunkers and climb the fortress to confront its combat mech.', chapters: ['Forward Line', 'Outer Bunkers', 'Radar Steps', 'Command Courtyard'] },
  { name: 'City Under Fire', dungeon: 'Neon Rooftops', description: 'Leap between rooftops and use the high ground to break overlapping fields of fire.', chapters: ['Commercial Rooftops', 'Skybridges', 'Sniper Line', 'Civic Tower'] },
  { name: 'Core Breach', dungeon: 'Reactor Complex', description: 'Isolate the weapons network and disable its controller. Keep the reactor intact.', chapters: ['Service Gate', 'Cooling Loop', 'Power Corridor', 'Reactor Hall'] },
]
const WORDS: Record<string, string> = {
 '潮汐货运航道':'Tidal Cargo Crossing','装配线停机通道':'Assembly Line Bypass','高架检修穿梭台':'Skyway Service Shuttle','堡垒侧翼突入':'Bunker Flanking Route','屋顶广告牌通路':'Rooftop Billboard Crossing','供电切换机房':'Power Routing Chamber','屋顶封锁追击':'Rooftop Pursuit','躲避锁定射线':'Evade Targeting Beams',
 '风蚀断崖':'Weathered Cliffs','跨谷滑索':'Canyon Zipline','油站峡口':'Depot Canyon','高低路线':'Ridge and Sand Routes','赤砂深谷':'Red Sand Gorge','长索穿越':'Long Cable Crossing','车队山口':'Convoy Pass','岩壁横渡':'Cliff Traverse','风蚀沙丘':'Wind-carved Dunes','起伏沙脊':'Rolling Sand Ridges','废弃油站':'Abandoned Fuel Depot','燃料与军械':'Fuel and Armories','赤砂峡谷':'Red Sand Canyon','沿岩壁穿越':'Cliffside Passage','车队集结区':'Convoy Staging Area','高地侦察':'Ridge Reconnaissance','峡谷出口':'Canyon Exit','沙蝎封锁':'Sand Scorpion Blockade','沙丘补给车':'Dune Supply Truck','油站军械库':'Fuel Depot Armory','岩壁防空库':'Cliff Air-defense Cache','峡谷爆破库':'Canyon Demolition Cache','中继能源库':'Relay Energy Cache',

  '前沿集结区': 'Forward staging area', '装甲战车': 'Siege Tank', '重装机甲': 'Assault Mech', '防御核心': 'Weapons Controller',
  '通讯竖井':'Comms Shaft','垂直突围':'Vertical Assault','断桥连锁坍塌':'Damaged Cargo Bridge','限时突围':'Bridge Crossing','未能逃离坍塌区域':'Caught by the collapsing bridge','被竖井上升电弧追上':'Caught by the rising arc field','被吊箱砸中':'Struck by falling cargo',
  '掩体突破': 'Breach Point', '断桥跃进': 'Broken Bridge', '尖刺封锁': 'Spike Field', '连续跳台': 'Platform Run', '高低交火': 'Crossfire', '脉冲电网': 'Live Grid', '冲压车间': 'Press Hall', '据点歼灭战': 'Enemy Stronghold', '武器战术试炼': 'Weapons Trial', '吊索裂谷': 'Grapple Ravine', '攀梯检修道': 'Service Ladders', '断梁跃进': 'Wreckage Run', '关底首领战': 'Boss Arena', '出口警戒区': 'Extraction Perimeter',
  '近战军械库': 'Close-quarters Armory', '破甲军械库': 'Armor-piercing Armory', '防空军械库': 'Anti-air Armory', '爆破军械库': 'Demolition Armory', '电磁军械库': 'Energy Armory',
  '叠层装甲门': 'Layered Armor Gate', '爆破墙': 'Blast Wall', '能量屏障': 'Energy Barrier',
  '初入战场': 'First Contact', '装甲压制': 'Armored Resistance', '空地夹击': 'Air & Ground', '交叉封锁': 'Crossfire', '密集火线': 'Heavy Fire', '极限突围': 'Final Stand',
  '碰到了尖刺障碍': 'Caught in a spike trap', '碰到了通电电网': 'Hit by a live grid', '被冲压机关击中': 'Caught by a hydraulic press', '掉进了断桥下方': 'Fell into the ravine', '碰到了首领装甲': 'Collided with the boss', '被敌人逼近了': 'Overrun by an enemy', '被敌方子弹击中': 'Hit by enemy fire', '被敌方爆炸波及': 'Caught in an enemy blast',
}
const CHAPTERS_ZH = [['集装箱堆场','潮汐装卸桥','货轮连接栈道','海关封锁线'],['冷却沟入口','重型冲压车间','熔炉输送线','装甲装配大厅'],['桥头维修站','悬空桥墩群','断裂主桥','高空防空阵地'],['前沿反冲锋带','外墙碉堡','雷达台阶','机甲指挥庭院'],['商业区天台','楼宇连接桥','屋顶狙击线','内城行政塔'],['维护闸门','冷却回路','脉冲供能廊','主反应大厅']]
CHAPTERS_ZH.forEach((chapter, i) => chapter.forEach((name, j) => { WORDS[name] = ZONES_EN[i]!.chapters[j]! }))
export function localizeFront(text: string, language: FrontLanguage) { if(text==='陷入流沙，跳跃或冲刺脱离')return language==='zh'?text:'Trapped in quicksand. Jump or dash to escape.'; return language === 'zh' ? text : text.split(' · ').map(part => WORDS[part] ?? part).join(' · ') }
export const TRANSIT_EN = [
  { title: 'Follow the Weapons Shipment', text: CAMPAIGN[0]!.outcome.en + ' ' + CAMPAIGN[0]!.next.en, transport: 'Freight gate', vehicle: 'cargo' },
  { title: 'Reach the Skyway Relay', text: CAMPAIGN[1]!.outcome.en + ' ' + CAMPAIGN[1]!.next.en, transport: 'Freight lift', vehicle: 'lift' },
  { title: 'Trace the Distress Recording', text: CAMPAIGN[2]!.outcome.en + ' ' + CAMPAIGN[2]!.next.en, transport: 'Maintenance bridge', vehicle: 'bridge' },
  { title: 'Protect the Evacuation Route', text: CAMPAIGN[3]!.outcome.en + ' ' + CAMPAIGN[3]!.next.en, transport: 'Inner-city service gate', vehicle: 'truck' },
  { title: "Shut Down Iron Veil", text: CAMPAIGN[4]!.outcome.en + ' ' + CAMPAIGN[4]!.next.en, transport: 'Underground service tunnel', vehicle: 'tunnel' },
]
