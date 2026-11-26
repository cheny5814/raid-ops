<script setup lang="ts">
import { track } from '../../utils/track'
import { createGameStats } from '../../utils/game-stats'
const gameStats = createGameStats(track)
let restoredPending = false
const beginGameStats = (kind: 'start' | 'continue' | 'retry') => gameStats.begin(campaignId.value, level.value.id, kind)
import { encodeSession, decodeSession, type SavedSession } from '../../utils/front-session'
import {mechanicalSources} from '../../utils/front-combat-motion'
import {warmDestructionArt} from '../../utils/front-impact.ts'
import {readTutorial,learn,lessonFor,observeLessons,type Lesson,type TeachingHint} from '../../utils/front-tutorial'
import {nearbyFieldSwitch} from '../../utils/front-field'
import { nearbyZipline } from '../../utils/front-route-features'
import { MENU_ART } from '../../utils/front-menu-art'
import {DESERT_LEVEL,DESERT_RULES,DESERT_STORY} from '../../utils/front-desert-level'
import { OPERATIVES, OPERATIVE_ORDER, readOperative, canUseOperativeSkill, type OperativeId } from '../../utils/front-operatives'
import { healthEcho } from '../../utils/front-feedback'
import type { SoundCue } from '../../utils/front-sound-events'
import { ELITE_KITS } from '../../utils/front-boss-tactics'
import {battleView,type BattleView} from '../../utils/front-camera'
import { weaponGrowth, grownWeapon, growthChanges, GROWTH_ROLES, type GrowthChange } from '../../utils/front-growth'
import { FrontSoundBank, MUSIC_TRACKS, musicForMode, type MusicScene } from '../../utils/front-audio'
import { DUNGEON_RULES, bossState } from '../../utils/front-dungeons'
import { BOSS_NAMES, bossApproach } from '../../utils/front-enemies'
import { Aim, VideoPlay, VideoPause, Headset, RefreshLeft, Lock, Setting } from '@element-plus/icons-vue'
import { BODY, MAX_HEALTH, FRONT_LEVELS, WEAPONS, WEAPON_ORDER, armoryFor, recordMissions, GATE_NAMES, ropePoint, equipWeapon, currentEncounter, complete, createRun, exitOpen, isBoss, nextStoryTerminal, storyTerminalReady, readProgress, respawn, step, type Input, type Weapon } from '../../utils/front'
import { createTransition, advanceTransition, transitionFrame, arriveRun, TRANSITION_STORIES, ROUTE_STOPS, type FrontTransition } from '../../utils/front-transition'
import { settleRun, VICTORY_DURATION, type Settlement } from '../../utils/front-result'
import { drawVictory, drawFrontTitle, drawOperativePortrait, WAR_PALETTES } from '../../utils/front-art'
import { drawFront } from '../../utils/front-draw'
import { CAMPAIGN, CAMPAIGN_PREMISE, type StoryText } from '../../utils/front-story'
import { frontViewport } from '../../utils/front-viewport'

import { localizeFront, readFrontPreferences, WEAPON_EN, ZONES_EN, TRANSIT_EN, type FrontLanguage } from '../../utils/front-locale'

const emit = defineEmits<{ active: [value: boolean] }>()
const props = withDefaults(defineProps<{ storageNamespace?: string }>(), { storageNamespace: 'raid-ops-progress-v1' })
const lastCampaign=ref<'grayhaven'|'sandstorm'|null>(null),lastMission=ref<number|null>(null)
const campaignId=ref<'grayhaven'|'sandstorm'>('grayhaven'), desertRecord=ref<{score:number,time:number,kills:number}|null>(null)
const isDesert=computed(()=>campaignId.value==='sandstorm')
const selectedOperative=ref<OperativeId>('raven'), operativeInfo=computed(()=>OPERATIVES[selectedOperative.value])
const operativeSlide=ref(1), operativeIndex=computed(()=>OPERATIVE_ORDER.indexOf(selectedOperative.value))
const skillState=ref({cooldown:0,ready:false,active:false}), operativeCanChange=computed(()=>mode.value==='ready'||mode.value==='dead')
const operativePreview=ref<HTMLCanvasElement|null>(null)
const language = computed<FrontLanguage>(() => 'en'), menuView = ref<'title' | 'campaigns' | 'missions'>('title')
const panel = ref<'continue' | 'operatives' | 'settings' | 'controls' | 'trials' | 'growth' | 'story' | 'restart' | 'leave' | 'quit' | null>(null)
const pauseCard = ref<HTMLElement | null>(null)
const dialogPanel = ref<HTMLElement | null>(null), volume = ref(.8), musicEnabled = ref(true), musicVolume = ref(.32), musicPlayer = ref<HTMLAudioElement | null>(null)
const gameScreen = ref<HTMLElement | null>(null), isFullscreen = ref(false), immersive = ref(false), fullscreenAvailable = ref(false), menuFeedback = ref('')
let pageOverflow = ''
let panelReturnFocus: HTMLElement | null = null
const tr = (en: string, zh: string) => language.value === 'en' ? en : zh
const storyText = (text: StoryText) => text[language.value].replace(/\b(?:RAVEN|Raven)\b/g, operativeInfo.value.name.en).replace(/渡鸦/g, operativeInfo.value.name.zh)
const local = (text: string) => localizeFront(text, language.value)
const weaponName = (w: Weapon) => language.value === 'en' ? WEAPON_EN[w].name : WEAPONS[w].name
const weaponInfo = (w: Weapon) => language.value === 'en' ? WEAPON_EN[w] : WEAPONS[w]
const zoneName = (id: number) => isDesert.value?tr('Dune Outpost','沙海前哨'): language.value === 'en' ? ZONES_EN[id]!.name : FRONT_LEVELS[id]!.name
const zoneInfo = (id: number) => isDesert.value?{name:tr('Red Sand Frontier','赤砂边境')}: language.value === 'en' ? { ...ZONES_EN[id]!, name: ZONES_EN[id]!.dungeon } : FRONT_LEVELS[id]!.dungeon
const titleCopy = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null), arena = ref<HTMLElement | null>(null)
const progress = ref(readProgress(null)), mode = ref<'ready' | 'playing' | 'paused' | 'dead' | 'won' | 'transition' | 'victory' | 'settlement'>('ready')
// Only the title menu belongs to the public homepage; all deeper game screens fill the viewport.
watch(() => mode.value !== 'ready' || menuView.value !== 'title', active => emit('active', active), { immediate: true, flush: 'sync' })
const growth = computed(() => weaponGrowth(progress.value.weaponXp))
const upgraded = (w: Weapon) => grownWeapon(w, WEAPONS[w], progress.value.weaponXp)
const damageText = (w: Weapon) => Number(upgraded(w).damage.toFixed(2))
const growthBonus = (w: Weapon) => Math.round((upgraded(w).damage / WEAPONS[w].damage - 1) * 100)
const campaignLevels=computed(()=>isDesert.value?[DESERT_LEVEL]:FRONT_LEVELS)
const campaignRecords=computed(()=>isDesert.value?[desertRecord.value]:progress.value.records)
const campaignUnlocked=computed(()=>isDesert.value?0:progress.value.unlocked)
const level = computed(() => isDesert.value?DESERT_LEVEL:FRONT_LEVELS[progress.value.current]!)
const finalMission=computed(()=>isDesert.value||level.value.id===5)
const dungeonRules=computed(()=>isDesert.value?DESERT_RULES:DUNGEON_RULES[level.value.id]!)
const chapter = computed(() => isDesert.value?DESERT_STORY:CAMPAIGN[level.value.id]!)
const radio = ref<StoryText | null>(null), radioRemaining = ref(0)
const objective = ref<{ title: StoryText, completed: number, total: number, remaining: number, charge: number, duration: number, distance: number, ready: boolean } | null>(null)
function radioMessage(text: StoryText) { radio.value = text; radioRemaining.value = 4 }
function prepareChapter() { radioMessage(chapter.value.intro) }
const settlement = ref<Settlement | null>(null), victoryTime = ref(0), victoryPaused = ref(false), resultPreview = ref(false)
const resultPanel = ref<HTMLElement | null>(null)
const mapPaths = FRONT_LEVELS.map(l => l.ground.map(p => `M${(p.x / l.width * 340 + 10).toFixed(1)},${(57 - (400 - p.y) * .45).toFixed(1)}h${(p.w / l.width * 340).toFixed(1)}`).join(' '))
const transit = ref<FrontTransition | null>(null), previewing = ref(false), reduceMotion = ref(false)
const transitFrame = computed(() => transit.value ? transitionFrame(transit.value) : null)
const nextLevel = computed(() => transit.value ? FRONT_LEVELS[transit.value.to]! : null)
const story = computed(() => transit.value ? (language.value === 'en' ? TRANSIT_EN : TRANSITION_STORIES)[transit.value.from]! : null)
const routePoints = ROUTE_STOPS.map(p => `${p.x},${p.y}`).join(' ')
let arrival: ReturnType<typeof createRun> | null = null, previewReturnMode: 'ready' | 'won' = 'ready'
const cleared = computed(() => campaignRecords.value.filter(Boolean).length)
const hp = ref(MAX_HEALTH), score = ref(0), kills = ref(0), seconds = ref(0), distance = ref(0), weapon = ref<keyof typeof WEAPONS>('rifle'), checkpoint = ref(-1)
const missions = ref<{ id: string, title: string, description: string, reward: Weapon, remaining: number, total: number, done: boolean }[]>([])
const pendingMission = computed(() => missions.value.find(m => !m.done))
const climbing = ref(false), traversalHint = ref(''), equipmentOpen = ref(false)
const gateHint = ref<{ name: string, weapon: Weapon, onscreen: boolean } | null>(null)
const sectionName = ref('前沿集结区'), armor = ref(0), grenades = ref(3), arsenal = ref<Weapon[]>(['rifle']), encounterTargets = ref(0)
const bossIncoming = ref(''), bossTrail=ref(0)
const boss = ref<{ name: string, hp: number, max: number, phase: number, minor: boolean, counter: string, tactic: string } | null>(null), gateReady = ref(false), reason = ref(''), notice = ref(''), autoFire = ref(false), aimAssist = ref(true), sound = ref(true), storageAvailable = ref(true)
const storageKey = computed(() => props.storageNamespace)
const tutorialReset=ref(false),tutorial=ref(readTutorial(null)),teaching=ref<TeachingHint|null>(null)
const weaponReveals=ref<Weapon[]>([]),revealRemaining=ref(0),newWeapon=computed(()=>weaponReveals.value[0])
const revealVisible=computed(()=>mode.value==='playing'&&!!newWeapon.value&&!boss.value&&!bossIncoming.value)
function saveTutorial(){try{localStorage.setItem(storageKey.value+':tutorial-v1',JSON.stringify(tutorial.value))}catch{storageAvailable.value=false}}
function completeLesson(id:Lesson){const next=learn(tutorial.value,id);if(next!==tutorial.value){tutorial.value=next;saveTutorial()}}
function resetTutorial(){tutorialReset.value=true;tutorial.value=readTutorial(null);saveTutorial();message(tr('Contextual tips reset. Your progress is unchanged.','场景教学已重置，闯关进度保留。'))}
function dismissReveal(){weaponReveals.value=weaponReveals.value.slice(1);revealRemaining.value=8}
const savedGame = shallowRef<Pick<SavedSession,'campaign'|'levelId'|'savedAt'> | null>(null)
let saveSlotActive = false, lastSessionAt = 0
const sessionKey = computed(() => storageKey.value + ':session-v1')
const savedMission = computed(() => savedGame.value?.campaign === 'sandstorm' ? 'Dune Outpost' : savedGame.value ? ZONES_EN[savedGame.value.levelId]?.name : '')
function storeSession() {
  if (!saveSlotActive || run.status !== 'playing' || !['playing','paused'].includes(mode.value) || previewing.value || resultPreview.value) return
  try {
    const savedAt = Date.now()
    localStorage.setItem(sessionKey.value, encodeSession(campaignId.value, level.value, run, savedAt))
    savedGame.value = { campaign: campaignId.value, levelId: level.value.id, savedAt }
    lastSessionAt = run.time
  } catch { storageAvailable.value = false; message('Your browser could not save this attempt. Keep this page open to continue playing.') }
}
function clearSession() {
  if (!saveSlotActive) return
  try { localStorage.removeItem(sessionKey.value); savedGame.value = null } catch { storageAvailable.value = false }
}
function quickStart() {
  if (mode.value !== 'ready' || panel.value) return
  track('click_quick_start'); chooseCampaign('grayhaven'); select(0); start(!savedGame.value); radio.value = null
}
function titleStart() {
  if (mode.value !== 'ready' || panel.value) return
  track('click_start_game')
  if (savedGame.value) openPanel('continue')
  else showCampaigns()
}
function newGame() { panel.value = null; showCampaigns() }
function continueGame() {
  if (mode.value !== 'ready' || panel.value !== 'continue') return
  let saved: SavedSession | null = null
  try { saved = decodeSession(localStorage.getItem(sessionKey.value), FRONT_LEVELS, DESERT_LEVEL) } catch { storageAvailable.value = false }
  if (!saved) { savedGame.value = null; panel.value = null; menuFeedback.value = 'This save is unavailable or belongs to an older game version. Your unlocked weapons and records are still available.'; return }
  campaignId.value = saved.campaign
  if (saved.campaign === 'grayhaven') progress.value.current = saved.levelId
  selectedOperative.value = saved.run.operative
  run = saved.run
  run.weaponXp = Math.max(run.weaponXp, progress.value.weaponXp)
  run.arsenal = WEAPON_ORDER.filter(w => run.arsenal.includes(w) || armoryFor(progress.value).includes(w))
  panel.value = null; settlement.value = null; transit.value = null; arrival = null; resultPreview.value = false; previewing.value = false
  equipmentOpen.value = false; radio.value = null; weaponReveals.value = []; upgradeReveal.value = null
  saveSlotActive = true; lastSessionAt = run.time; cameraView = undefined
  clearInput(); previous = 0; accumulator = 0; reason.value = ''; mode.value = 'paused'; restoredPending = true; sync(); rememberMission()
  message('Saved game restored. Resume when you are ready.')
  nextTick(() => { resize(); pauseCard.value?.querySelector('button')?.focus() })
}
const upgradeReveal=ref<{fromXp:number,toXp:number,weapon:Weapon}|null>(null),upgradeRemaining=ref(0)
const upgradeVisible=computed(()=>mode.value==='playing'&&!!upgradeReveal.value&&!revealVisible.value&&!boss.value&&!bossIncoming.value)
const upgradeChanges=computed(()=>upgradeReveal.value?growthChanges(upgradeReveal.value.weapon,WEAPONS[upgradeReveal.value.weapon],upgradeReveal.value.fromXp,upgradeReveal.value.toXp):[])
function growthLabel(key:GrowthChange['key']){return({damage:tr('Damage','伤害'),rate:tr('Shots/sec','每秒射击'),range:tr('Range','射程'),pierce:tr('Pierce targets','贯穿目标'),radius:tr('Blast radius','爆炸范围'),spread:tr('Spread angle','散射角')})[key]??key}
const growthValue=(n:number,key:GrowthChange['key'])=>key==='spread'?`${Number((n*180/Math.PI).toFixed(1))}°`:Number(n.toFixed(2))
function announceGrowth(fromXp:number,toXp:number){if(weaponGrowth(toXp).level<=weaponGrowth(fromXp).level||mode.value!=='playing')return;upgradeReveal.value={fromXp:upgradeReveal.value?.fromXp??fromXp,toXp,weapon:run.weapon};upgradeRemaining.value=7}


const clock = (value: number) => `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`
const weaponSilhouettes: Record<Weapon, string> = {
  rifle: 'M5 13h9V8h23v2h20v5H37v3H26l-2 9h-7l-1-9H7v5H2V12h3zm17-9h13v3H22z',
  spread: 'M3 10h28V7h9v3h20v4H36v4H23l-2 8h-7l-1-10H6v8H2zm32 6h19v4H35z',
  pulse: 'M3 10h11V6h30v4h15v7H38v4H25l-3 7h-7l-1-11H4zm19-1v7h3V9zm7 0v7h3V9zm7 0v7h3V9z',
  rapid: 'M3 10h34V8h11v3h13v5H39v3h-7v5H19v-7H9v8H3zm20 10a6 6 0 1 0 0 12a6 6 0 1 0 0-12',
  rocket: 'M4 8h39v2h16v11H43v2H4zm13 15h7v7h-7zm22-17h11v2H39zm7 7v5h10v-5z',
  beam: 'M2 10h12V6h28v4h19v7H39v5H26l-3 8h-7l-1-13H5zm19-1v8h3V9zm7 0v8h3V9zm7 0v8h3V9z',
}
const keys = new Set<string>()
let cameraView:BattleView|undefined
let run = createRun(level.value, armoryFor(progress.value), progress.value.missions, progress.value.weaponXp,selectedOperative.value), jump = false, grenade = false, interact = false, skill = false, frame = 0, previous = 0, accumulator = 0, width = 960
let titleElapsed = 0
let lastMechanicalAt=-1
let context: CanvasRenderingContext2D | null = null, observer: ResizeObserver | undefined, soundBank: FrontSoundBank | null = null, noticeTimer: ReturnType<typeof setTimeout> | undefined
function clearInput() { keys.clear(); jump = false; grenade = false; interact = false; skill=false }
function input(): Input { return { skill, left: keys.has('KeyA') || keys.has('ArrowLeft'), right: keys.has('KeyD') || keys.has('ArrowRight'), up: keys.has('KeyW') || keys.has('ArrowUp'), duck: keys.has('KeyS') || keys.has('ArrowDown'), jump, shoot: autoFire.value || keys.has('KeyJ'), grenade, interact, aimAssist: aimAssist.value, reducedMotion: reduceMotion.value, viewWidth: width, view:cameraView } }
function message(text: string) { notice.value = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.value = '' }, 2500) }
function save() { try { localStorage.setItem(storageKey.value, JSON.stringify(progress.value)) } catch { storageAvailable.value = false } }
function sync() {
  const hint=lessonFor(tutorial.value,run,level.value)
  if(teaching.value?.id!==hint?.id||teaching.value?.key!==hint?.key||teaching.value?.en!==hint?.en)teaching.value=hint
  if (!previewing.value && !resultPreview.value && run.weaponXp > progress.value.weaponXp) {
    const oldXp = progress.value.weaponXp
    progress.value = recordMissions(progress.value, run); save()
    announceGrowth(oldXp,progress.value.weaponXp)
  }
  const terminal = nextStoryTerminal(run, level.value)
  objective.value = terminal ? { title: chapter.value.goals[terminal.goal]!.title, completed: run.storyCompleted.length, total: run.storyRequired, remaining: level.value.encounters[terminal.encounter]!.enemies.filter(id => run.enemies.some(e => e.id === id && e.hp > 0)).length, charge: run.storyCharge, duration: terminal.duration, distance: Math.round(terminal.x - run.x), ready: storyTerminalReady(run, level.value, terminal) } : null
  climbing.value = run.ladder !== null
  const nearRope = level.value.ropes.find(r => { const p = ropePoint(r, run.ropeMotion[r.id]?.angle ?? -.85); return Math.hypot(p.x - run.x - 13, p.y - run.y - 12) < 115 })
  const nearLadder = level.value.ladders.find(l => Math.abs(l.x + l.w / 2 - run.x - 13) < 55 && run.y + BODY.h >= l.y && run.y <= l.y + l.h)
  const nearGun = run.interactives.find(p => p.kind === 'gun' && Math.abs(p.x - run.x - 13) < 60 && Math.abs(p.y + p.h - run.y - 40) < 16)
  const fieldSwitch=nearbyFieldSwitch(level.value,run)
  traversalHint.value = fieldSwitch ? `${storyText(fieldSwitch.label)} · ${tr('E to operate','E 操作')}` : run.zipline ? tr('A/D to slide · Auto-release at the bank · Space to jump off', 'A/D 沿索滑行 · 到岸自动下索 · 空格跳离') : nearbyZipline(level.value,run) ? tr('Press E to grab the cliff zipline', '按 E 挂上跨崖滑索') : run.mountedGun !== null ? tr('J fire · A/D face · E or Space to leave · Stop firing to cool down', 'J 开火 · A/D 转向 · E 或空格离开 · 停火冷却') : nearGun ? tr('Press E to operate the fixed machine gun', '按 E 操作固定机枪') : run.rope !== null ? tr('A/D to swing · Auto-release at the far bank · Space to jump early', 'A/D 荡向对岸 · 到岸自动松索 · 空格可提前跳离') : run.ladder !== null ? tr('W/S to climb · Space to jump off · E to release', 'W/S 上下攀爬 · 空格跳离 · E 松手') : nearRope ? tr('Press E near the rope. Swing across to land automatically.', '靠近绳头按 E 抓索，向对岸摆荡后自动落岸') : nearLadder ? tr('Press E to grab the ladder, then W/S to climb.', '按 E 抓梯，再用 W/S 上下攀爬') : ''
  missions.value = level.value.missions.map(m => { const a = level.value.encounters[m.encounter]; return { ...m, total: a?.enemies.length ?? 0, remaining: a?.enemies.filter(id => run.enemies.some(e => e.id === id && e.hp > 0)).length ?? 0, done: run.claimedMissions.includes(m.id) } })
  const gate = run.barriers.find(b => b.hp > 0 && b.requiredWeapon && b.x >= run.x - 10 && b.x - run.x < 620)
  const gateView=cameraView??battleView(level.value,run,width)
  gateHint.value = gate?.requiredWeapon ? { name: GATE_NAMES[gate.requiredWeapon], weapon: gate.requiredWeapon,onscreen:gate.x<gateView.x+gateView.worldWidth&&gate.x+gate.w>gateView.x } : null
  armor.value = run.armor; grenades.value = run.grenades; arsenal.value = [...run.arsenal]
  const encounter = currentEncounter(level.value, run); encounterTargets.value = encounter ? run.enemies.filter(e => encounter.enemies.includes(e.id) && e.hp > 0).length : 0
  skillState.value={cooldown:run.skillCooldown,ready:canUseOperativeSkill(run),active:run.dashTime>0}
  hp.value = run.hp; score.value = run.score; kills.value = run.kills; seconds.value = run.time; weapon.value = run.weapon; checkpoint.value = run.checkpoint; gateReady.value = exitOpen(run)
  sectionName.value = [...level.value.segments].reverse().find(s => run.x >= s.x)?.name || '前沿集结区'
  distance.value = Math.max(0, Math.min(100, run.x / (level.value.width - 110) * 100))
  const bossName = isDesert.value?{en:'Sand Scorpion / SC-09',zh:'沙蝎装甲车 / SC-09'}:BOSS_NAMES[level.value.id]!
  bossIncoming.value = bossApproach(run) ? tr(bossName.en, bossName.zh) : ''
  const e = run.enemies.filter(e => (isBoss(e)||e.elite) && !e.dormant && e.hp > 0 && (Math.abs(e.x - run.x) < 650 || e.hp < e.maxHp && Math.abs(e.x - run.x) < 1000)).sort((a,b)=>Number(!!b.boss)-Number(!!a.boss)||Math.abs(a.x-run.x)-Math.abs(b.x-run.x))[0]
  bossTrail.value=e?healthEcho(e,e.hp,e.maxHp,run.time,reduceMotion.value):0
  boss.value = e ? { name: e.eliteName?storyText(e.eliteName):tr(bossName.en, bossName.zh), minor:!!e.elite, hp: e.hp, max: e.maxHp, phase: e.hp < e.maxHp * .25 ? 3 : e.hp < e.maxHp * .5 ? 2 : 1, counter: storyText(e.elite?ELITE_KITS[e.elite].counter:dungeonRules.value.weapon), tactic: storyText(bossState(run, e).label) } : null
}
function uiClickSound(event: MouseEvent) { if ((event.target as HTMLElement).closest('button, summary')) soundBank?.cue?.('ui') }
function focusPlayfield(event: PointerEvent) { const target = event.target as HTMLElement; if (!target.closest('button, a, input, select, textarea')) focusGame() }
function focusGame() { if (mode.value === 'playing') arena.value?.focus({ preventScroll: true }) }
function rememberMission(){lastCampaign.value=campaignId.value;lastMission.value=level.value.id;try{localStorage.setItem(storageKey.value+':last-campaign',campaignId.value);localStorage.setItem(storageKey.value+':last-mission',String(lastMission.value))}catch{storageAvailable.value=false}}
function start(saveSlot = true) { restoredPending = false; saveSlotActive = saveSlot !== false; lastSessionAt = 0; rememberMission();upgradeReveal.value=null;upgradeRemaining.value=0;weaponReveals.value=[];revealRemaining.value=0;cameraView=undefined; musicPreviewUntil = 0; equipmentOpen.value = false; panel.value = null; settlement.value = null; resultPreview.value = false; victoryTime.value = 0; victoryPaused.value = false; transit.value = null; previewing.value = false; arrival = null; clearInput(); run = createRun(level.value, armoryFor(progress.value), progress.value.missions, progress.value.weaponXp,selectedOperative.value); accumulator = 0; previous = 0; reason.value = ''; notice.value = ''; mode.value = 'playing'; beginGameStats('start'); prepareChapter(); sync(); storeSession(); nextTick(focusGame); unlockAudio() }
function retry() { upgradeReveal.value=null;upgradeRemaining.value=0;cameraView=undefined; equipmentOpen.value = false; clearInput(); run = respawn({...run,operative:selectedOperative.value}, level.value); accumulator = 0; previous = 0; reason.value = ''; mode.value = 'playing'; restoredPending = false; beginGameStats('retry'); radio.value = null; sync(); storeSession(); nextTick(focusGame); message(run.saved ? tr('Checkpoint restored. Health refilled.', '从补给点重新突围，体力已恢复') : tr('Back in action. Hold J to fire.', '重新出发，按住 J 连续开火')) }
function chooseCampaign(id:'grayhaven'|'sandstorm'){if(mode.value!=='ready')return;campaignId.value=id;select(isDesert.value?0:progress.value.current)}
function select(index: number) { cameraView=undefined; if (mode.value === 'transition' || mode.value === 'victory' || index > campaignUnlocked.value) return; clearInput(); settlement.value = null; resultPreview.value = false; if(!isDesert.value)progress.value.current = index; run = createRun(level.value, armoryFor(progress.value), progress.value.missions, progress.value.weaponXp,selectedOperative.value); mode.value = 'ready'; radio.value = null; menuView.value = 'missions'; notice.value = ''; sync(); save() }
function beginVictory(preview = false) {
  if (mode.value === 'victory') return
  const record = campaignRecords.value[level.value.id]
  const source = preview ? { ...run, status: 'won' as const, score: record?.score ?? 0, time: record?.time ?? 0, kills: record?.kills ?? 0 } : run
  const result = settleRun(level.value, source, record)
  if (!result) return
  settlement.value = result; resultPreview.value = preview; victoryTime.value = 0; victoryPaused.value = false
  if (!preview) { gameStats.finish('mission_complete'); clearSession(); if(isDesert.value){progress.value=recordMissions(progress.value,run);if(!desertRecord.value||run.score>desertRecord.value.score||run.score===desertRecord.value.score&&run.time<desertRecord.value.time)desertRecord.value={score:run.score,time:run.time,kills:run.kills};try{localStorage.setItem(storageKey.value+':sandstorm',JSON.stringify(desertRecord.value))}catch{storageAvailable.value=false}}else progress.value = complete(progress.value, run); save() }
  soundBank?.stopTraversal?.(); soundBank?.cue?.('victory'); mode.value = 'victory'; clearInput(); notice.value = ''; previous = 0; accumulator = 0; arena.value?.focus({ preventScroll: true })
}
function showSettlement() {
  if (mode.value !== 'victory') return
  mode.value = 'settlement'; clearInput(); previous = 0
  nextTick(() => resultPanel.value?.focus({ preventScroll: true }))
}
function returnToDungeon() { if (mode.value === 'settlement') select(level.value.id) }
function beginTransition(preview = false) {
  if(isDesert.value)return
  const record = campaignRecords.value[level.value.id]
  const source = preview ? { ...run, status: 'won' as const, score: record?.score ?? run.score, kills: record?.kills ?? run.kills, time: record?.time ?? run.time } : run
  const state = createTransition(level.value, source)
  if (!state) return
  previewReturnMode = mode.value === 'won' ? 'won' : 'ready'
  previewing.value = preview; transit.value = state; arrival = arriveRun(state, FRONT_LEVELS[state.to]!); mode.value = 'transition'
  clearInput(); notice.value = ''; previous = 0; accumulator = 0
  arena.value?.focus({ preventScroll: true })
}
function finishTransition() { cameraView=undefined;
  const state = transit.value
  if (!state || mode.value !== 'transition') return
  if (previewing.value) { mode.value = previewReturnMode; transit.value = null; previewing.value = false; arrival = null; previous = 0; return }
  const nextRun = arriveRun(state, FRONT_LEVELS[state.to]!)
  progress.value.current = state.to;rememberMission();upgradeReveal.value=null;upgradeRemaining.value=0;run = nextRun; transit.value = null; arrival = null; mode.value = 'playing'; beginGameStats('start')
  clearInput(); previous = 0; accumulator = 0; prepareChapter(); sync(); save(); storeSession(); focusGame(); message(tr('New sector. Gear retained. Health and grenades replenished.', '进入新战区，武器与护甲已携带，体力和手雷已补充'))
}
function next() { if (resultPreview.value) { returnToDungeon(); return }; if (isDesert.value || progress.value.current === FRONT_LEVELS.length - 1) { select(0); return }; beginTransition() }
function pause() { soundBank?.stopTraversal?.(); if (mode.value === 'victory') { victoryPaused.value = true; clearInput(); return }; if (mode.value === 'transition' && transit.value) { transit.value.paused = true; clearInput(); return }; if (mode.value === 'playing') { storeSession(); clearInput(); mode.value = 'paused'; updateMusic(); nextTick(() => pauseCard.value?.querySelector('button')?.focus()) } }
function resume() { musicPreviewUntil = 0; panel.value = null; if (mode.value === 'victory') { victoryPaused.value = false; previous = 0; nextTick(() => arena.value?.focus({ preventScroll: true })); return }; if (mode.value === 'transition' && transit.value) { transit.value.paused = false; previous = 0; nextTick(() => arena.value?.focus({ preventScroll: true })); return }; clearInput(); previous = 0; accumulator = 0; mode.value = 'playing'; if (restoredPending) { restoredPending = false; beginGameStats('continue') }; unlockAudio(); nextTick(focusGame) }
function pageForeground() { return typeof document !== 'undefined' && !document.hidden && (typeof document.hasFocus !== 'function' || document.hasFocus()) }
function silenceMusic(el = musicPlayer.value) { if (el) { el.muted = true; el.volume = 0; el.pause() } }
function backgroundAudio() { pageActive = false; musicGeneration++; silenceMusic(); pause(); soundBank?.suspend?.().catch(() => {}) }
function foregroundAudio() { if (!pageForeground()) return; pageActive = true; musicBlocked.value = false; updateMusic(); if (sound.value && soundBank) soundBank.unlock().catch(() => {}) }
function visibility() { if (!pageForeground()) backgroundAudio(); else foregroundAudio() }
function chooseWeapon(item: Weapon) { const changed=run.weapon!==item;if (mode.value === 'playing' && equipWeapon(run, item)) { if(changed)completeLesson('switch');soundBank?.cue?.('equip'); equipmentOpen.value = false; sync(); focusGame() } }
function toggleEquipment() { equipmentOpen.value = !equipmentOpen.value; clearInput(); nextTick(focusGame) }
function cycleWeapon() { const index = run.arsenal.indexOf(run.weapon); chooseWeapon(run.arsenal[(index + 1) % run.arsenal.length]!) }
function interactWith() { if (mode.value === 'playing') { interact = true; focusGame() } }
function throwGrenade() { if (mode.value === 'playing') { grenade = true; focusGame() } }
function toggleAim() { aimAssist.value = !aimAssist.value; persistPreferences() }
function toggleAuto() { autoFire.value = !autoFire.value; persistPreferences() }
function setImmersive(value: boolean) {
  if (value && !immersive.value) { pageOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden' }
  if (!value && immersive.value) document.documentElement.style.overflow = pageOverflow
  immersive.value = value; isFullscreen.value = value; clearInput(); nextTick(resize)
}
function focusFullscreenContent() {
  if (panel.value) return
  const content = mode.value === 'settlement' ? resultPanel.value : arena.value
  content?.focus({ preventScroll: true })
}
async function toggleFullscreen() {
  if (immersive.value) { setImmersive(false); nextTick(focusFullscreenContent); return }
  try {
    if (document.fullscreenElement === gameScreen.value) await document.exitFullscreen()
    else if (document.fullscreenEnabled && gameScreen.value?.requestFullscreen) await gameScreen.value.requestFullscreen()
    else setImmersive(true)
  } catch { setImmersive(true) } finally { nextTick(focusFullscreenContent) }
}
function fullscreenChange() { isFullscreen.value = immersive.value || document.fullscreenElement === gameScreen.value; nextTick(() => { resize(); focusFullscreenContent() }) }
function persistPreferences() {
  try { localStorage.setItem('raid-ops-preferences-v1', JSON.stringify({ operative:selectedOperative.value, language: language.value, autoFire: autoFire.value, aimAssist: aimAssist.value, sound: sound.value, volume: volume.value, music: musicEnabled.value, musicVolume: musicVolume.value, audioVersion: 2, reducedMotion: reduceMotion.value })) } catch { storageAvailable.value = false }
}
function setVolume(event: Event) { volume.value = Math.max(0, Math.min(1, Number((event.target as HTMLInputElement).value))); soundBank?.configure(sound.value, volume.value); persistPreferences() }
function setMusicVolume(event: Event) { musicVolume.value = Math.max(0, Math.min(1, Number((event.target as HTMLInputElement).value))); updateMusic(); persistPreferences() }
function toggleMusic() { musicEnabled.value = !musicEnabled.value; unlockAudio(); updateMusic(); persistPreferences() }
function toggleMotion() { reduceMotion.value = !reduceMotion.value; persistPreferences() }
function openPanel(value: NonNullable<typeof panel.value>) {
  pause(); panelReturnFocus = typeof document !== 'undefined' ? document.activeElement as HTMLElement : null
  clearInput(); panel.value = value; nextTick(() => dialogPanel.value?.focus())
}
function closePanel() { panel.value = null; nextTick(() => { if (panelReturnFocus?.isConnected) panelReturnFocus.focus(); else if (mode.value === 'paused' || mode.value === 'dead') pauseCard.value?.querySelector('button')?.focus(); else arena.value?.focus({ preventScroll: true }) }) }
function showMissions() { unlockAudio(); menuFeedback.value = ''; if (mode.value !== 'ready') { openPanel('leave'); return }; menuView.value = 'missions'; nextTick(() => arena.value?.focus({ preventScroll: true })) }
function showCampaigns() { if (mode.value !== 'ready') return; clearInput(); menuView.value = 'campaigns'; nextTick(() => arena.value?.focus({ preventScroll: true })) }
function showCampaignStory(id:'grayhaven'|'sandstorm') { if (mode.value !== 'ready') return; chooseCampaign(id); showCampaigns(); openPanel('story') }
function chooseOperative(id:OperativeId){if(!operativeCanChange.value)return;const changed=selectedOperative.value!==readOperative(id);selectedOperative.value=readOperative(id);if(changed)track(selectedOperative.value==='fox'?'operative_silver_fox':'operative_falcon');if(mode.value==='ready')run.operative=selectedOperative.value;persistPreferences();sync()}
function prepareDeployment(){if(mode.value!=='ready'||panel.value)return;start()}
function cycleOperative(direction:number){if(!operativeCanChange.value)return;operativeSlide.value=direction;const next=(operativeIndex.value+direction+OPERATIVE_ORDER.length)%OPERATIVE_ORDER.length;chooseOperative(OPERATIVE_ORDER[next]!)}
function confirmOperative(){if(mode.value==='ready'){closePanel()}else if(mode.value==='dead'){panel.value=null;retry()}}
function activateSkill(){if(mode.value!=='playing'||!canUseOperativeSkill(run))return;skill=true;focusGame()}
function showTitle() { select(level.value.id); menuView.value = 'title'; nextTick(() => arena.value?.focus({ preventScroll: true })) }
async function confirmMenuAction() { const action = panel.value; panel.value = null; if (action === 'restart') start(saveSlotActive); else if (action === 'leave' || action === 'quit') { gameStats.finish('game_exit'); storeSession(); select(level.value.id); menuView.value = 'missions'; nextTick(() => arena.value?.focus({ preventScroll: true })) } }
function windowKeydown(event: KeyboardEvent) {
  const target = event.target as Node | null
  if (gameScreen.value?.contains(target) || target === document.body || target === document.documentElement) keydown(event)
}
function keydown(event: KeyboardEvent) {
  if (!audioUnlocked || musicBlocked.value || sound.value && !soundBank?.ready) { try { unlockAudio() } catch { /* 声音初始化失败不能吞掉移动输入。 */ } }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (panel.value) {
    if(panel.value==='operatives'&&!event.repeat){if(event.code==='ArrowLeft'||event.code==='ArrowRight'){event.preventDefault();cycleOperative(event.code==='ArrowLeft'?-1:1);return}if(event.code==='Enter'&&!(event.target as HTMLElement).closest('button')){event.preventDefault();confirmOperative();return}}
    if (event.code === 'Escape') { event.preventDefault(); closePanel() }
    if (event.code === 'Tab') {
      const items = dialogPanel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href]')
      if (items?.length) { const first = items[0]!, last = items[items.length - 1]!; if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogPanel.value)) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() } }
    }
    return
  }
  if (event.code === 'Tab' && (mode.value === 'paused' || mode.value === 'dead')) {
    const items = pauseCard.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (items?.length) { if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1]!.focus() } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0]!.focus() } }
    return
  }
  const target = event.target as HTMLElement
  if (target.closest('input, select, textarea, [contenteditable="true"]')) return
  // 战斗中的空格始终用于跳跃，避免再次激活仍有焦点的全屏等按钮。
  if (target.closest('button, a')) {
    if (event.code === 'Enter' || event.code === 'Space' && mode.value !== 'playing') return
    if (event.code === 'Space') focusGame()
  }
  if (mode.value === 'ready') { if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); if (event.repeat) return; if (menuView.value === 'title') titleStart(); else if (menuView.value === 'campaigns') chooseCampaign(campaignId.value); else prepareDeployment() } else if (event.code === 'Escape') { if (menuView.value === 'missions') showCampaigns(); else if (menuView.value === 'campaigns') showTitle() }; return }
  if (!['KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyJ', 'KeyK', 'KeyU', 'KeyE', 'KeyL', 'KeyQ', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyR', 'Escape', 'Enter'].includes(event.code)) return
  event.preventDefault()
  if (mode.value === 'victory') { if (event.code === 'Enter' && !event.repeat) showSettlement(); else if (event.code === 'Escape') { if (victoryPaused.value) resume(); else pause() }; return }
  if (mode.value === 'settlement') { if (event.code === 'Enter' && !event.repeat) next(); else if (event.code === 'Escape') returnToDungeon(); return }
  if (mode.value === 'transition') { if (event.code === 'Enter' && !event.repeat) finishTransition(); else if (event.code === 'Escape') { if (transit.value?.paused) resume(); else pause() }; return }
  if (event.code === 'Escape') { if (mode.value === 'playing') pause(); else if (mode.value === 'paused') resume(); return }
  if (event.code === 'KeyR' && !event.repeat) { if (mode.value === 'dead') retry(); else openPanel('restart'); return }
  if (event.code === 'Enter' && mode.value !== 'playing') { if (mode.value === 'paused') resume(); else if (mode.value === 'won') next(); else if (mode.value === 'dead') retry(); else start(); return }
  if (mode.value !== 'playing') return
  if (event.code === 'KeyU' && !event.repeat) { activateSkill(); return }
  if (event.code === 'KeyE' && !event.repeat) { interactWith(); return }
  if (event.code === 'KeyQ' && !event.repeat) { cycleWeapon(); return }
  if (event.code.startsWith('Digit')) { const item = WEAPON_ORDER[Number(event.code.slice(-1)) - 1]; if (item) chooseWeapon(item); return }
  if (event.code === 'KeyL' && !event.repeat) { throwGrenade(); return }
  keys.add(event.code)
  if (['Space', 'KeyK'].includes(event.code) && !event.repeat) jump = true
}
function keyup(event: KeyboardEvent) { keys.delete(event.code) }
const musicBlocked = ref(false)
let pageActive = true, audioUnlocked = false, musicPending = false, musicGeneration = 0, musicTrack: MusicScene | null = null, musicPreviewUntil = 0, musicDuckUntil = 0
function unlockFromPointer(event: PointerEvent) {
  // The music control handles its own unlock, preserving its state until click.
  if (!(event.target as HTMLElement).closest('.music-tool')) unlockAudio()
}
function unlockAudio() {
  if (typeof window === 'undefined') return
  if (!pageForeground()) return
  pageActive = true; audioUnlocked = true; musicBlocked.value = false
  updateMusic()
  if (pageActive && !document.hidden && sound.value && typeof AudioContext !== 'undefined') { soundBank ||= new FrontSoundBank(); soundBank.configure(sound.value, volume.value); soundBank.unlock().catch(() => { menuFeedback.value = tr('Audio could not start. Try the sound preview in settings.', '声音未能启动，请在设置里点击试听。') }) }
}
function desiredMusicScene(): MusicScene | null {
  if (!audioUnlocked || !pageActive || !pageForeground() || !musicEnabled.value || musicVolume.value <= 0) return null
  if (mode.value === 'victory' && victoryPaused.value || mode.value === 'transition' && transit.value?.paused) return null
  return Date.now() < musicPreviewUntil ? 'menu' : musicForMode(mode.value, !!boss.value)
}
function updateMusic() {
  const el = musicPlayer.value
  if (!el) return
  const scene = desiredMusicScene()
  if (!scene) { silenceMusic(el); return }
  if (musicTrack !== scene) { el.pause(); el.src = MUSIC_TRACKS[scene]; musicTrack = scene; el.volume = 0; musicBlocked.value = false }
  el.muted = false
  const target = musicVolume.value * (Date.now() < musicDuckUntil ? .72 : 1)
  el.volume = Math.max(0, Math.min(1, el.volume + (target - el.volume) * .12))
  if (el.paused && !musicPending && !musicBlocked.value) {
    musicPending = true
    const generation = musicGeneration
    el.play().then(() => {
      // A delayed play can complete after blur/pagehide, when animation frames are suspended.
      if (musicPlayer.value !== el || desiredMusicScene() !== scene) silenceMusic(el)
    }).catch((error: unknown) => {
      if (generation === musicGeneration && musicTrack === scene && desiredMusicScene() === scene && !(error instanceof Error && error.name === 'AbortError')) musicBlocked.value = true
    }).finally(() => {
      musicPending = false
      if ((generation !== musicGeneration || musicTrack !== scene) && desiredMusicScene()) updateMusic()
    })
  }
}
function musicError() { musicBlocked.value = true; menuFeedback.value = tr('Music could not load. Refresh the preview.', '背景音乐加载失败，请刷新预览。') }
async function toggleSound() { sound.value = !sound.value; soundBank?.configure(sound.value, volume.value); if (sound.value) unlockAudio(); persistPreferences() }
function shotSound(firedWeapon: Weapon) { musicDuckUntil = Date.now() + 120; soundBank?.configure(sound.value, volume.value); soundBank?.shot(firedWeapon) }
async function previewEffect(kind: SoundCue) { unlockAudio(); if (soundBank) { await soundBank.unlock(); soundBank.cue(kind) } }
async function previewGun() { unlockAudio(); if (soundBank) { await soundBank.unlock(); soundBank.shot(weapon.value) } }
function previewMusic() { musicPreviewUntil = Date.now() + 5000; unlockAudio(); updateMusic() }
function resize() {
  if (!canvas.value) return
  // 世界视野跟随显示比例；绘制分辨率受像素预算限制，HUD 不受影响。
  const cssWidth = canvas.value.clientWidth, cssHeight = canvas.value.clientHeight
  if (cssWidth <= 0 || cssHeight <= 0) return
  const viewport = frontViewport(cssWidth, cssHeight, window.devicePixelRatio || 1)
  width = viewport.logicalWidth
  if (cameraView) cameraView = battleView(level.value, run, width, cameraView, 0)
  if (canvas.value.width !== viewport.pixelWidth) canvas.value.width = viewport.pixelWidth
  if (canvas.value.height !== viewport.pixelHeight) canvas.value.height = viewport.pixelHeight
  context = canvas.value.getContext('2d')
  if (context) { context.setTransform(viewport.scaleX, 0, 0, viewport.scaleY, 0, 0); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high' }
}
function titleFigureSpace() {
  const area=canvas.value?.getBoundingClientRect(),copy=titleCopy.value?.getBoundingClientRect()
  if(!area?.width||!copy)return undefined
  const unit=width/area.width,gap=24*unit
  return {left:Math.min(width-gap,(copy.right-area.left)*unit+gap),right:width-gap}
}
// Keep the title screen from competing with page scrolling when it is offscreen.
let sceneObserver: IntersectionObserver | undefined
let sceneVisible = true, titleFrameAt = 0
function setSceneVisible(visible: boolean) {
  if (sceneVisible === visible) return
  sceneVisible = visible
  cancelAnimationFrame(frame)
  previous = 0; accumulator = 0; titleFrameAt = 0
  if (visible) frame = requestAnimationFrame(animate)
  else clearInput()
}
function animate(time: number) {
  if (!sceneVisible) return
  frame = requestAnimationFrame(animate)
  // Menu scenery needs less work than combat, especially while scrolling away.
  if (mode.value === 'ready') {
    if (titleFrameAt && time - titleFrameAt < 1000 / 30) return
    titleFrameAt = time
  } else titleFrameAt = 0
  updateMusic()
  if(panel.value==='operatives'&&operativePreview.value){const node=operativePreview.value,ctx=node.getContext('2d');if(ctx)drawOperativePortrait(ctx,readOperative(node.dataset.operative),node.width,node.height,time/1000,reduceMotion.value,isDesert.value)}
  const dt = previous ? Math.min(.05, (time - previous) / 1000) : 0; previous = time
  if (mode.value === 'playing') {
    accumulator += dt
    while (accumulator >= 1 / 120) {
      const oldStoryCount = run.storyCompleted.length, oldCheckpoint = run.checkpoint, oldClaims = run.claimedMissions.length, oldArsenal = run.arsenal.length, previousShot = run.gunfire?.serial ?? 0
      const action=input(),beforeLesson={x:run.x,weapon:run.weapon,grenades:run.grenades,skillCooldown:run.skillCooldown,rope:run.rope,zipline:run.zipline,ladder:run.ladder,mountedGun:run.mountedGun,tacticalControl:run.tacticalControl,stats:{...run.stats},fieldSwitches:[...run.fieldSwitches]},previousWeapons=[...run.arsenal]
      step(run, level.value, action, 1 / 120);
      gameStats.tick(1 / 120)
      const learned=observeLessons(tutorial.value,beforeLesson,run,action);if(learned!==tutorial.value){tutorial.value=learned;saveTutorial()}
      if(run.arsenal.length>oldArsenal){for(const item of run.arsenal)if(!previousWeapons.includes(item)&&!weaponReveals.value.includes(item))weaponReveals.value.push(item);if(revealRemaining.value<=0)revealRemaining.value=8}
      jump = false; grenade = false; interact = false; skill=false; accumulator -= 1 / 120
      try {
      if (run.gunfire && run.gunfire.serial > previousShot) shotSound(run.gunfire.weapon)
      for (const event of run.soundEvents) {
        if (event.kind === 'explosion' && run.soundEvents.some(detail => ['barrelBoom', 'tankBoom'].includes(detail.kind) && Math.abs(detail.x - event.x) < 160)) continue
        const offset = event.x - run.x
        if (Math.abs(offset) > width * .8) continue
        const boom = ['explosion', 'barrelBoom', 'tankBoom'].includes(event.kind)
        if (boom || event.kind === 'hurt') musicDuckUntil = Date.now() + (boom ? 450 : 220)
        soundBank?.cue?.(event.kind, offset / (width * .65), Math.max(.2, 1 - Math.abs(offset) / width * .6))
      }
      if(run.time-lastMechanicalAt>=.04||run.time<lastMechanicalAt){lastMechanicalAt=run.time;soundBank?.machinery?.(mechanicalSources(run),run.x,width,run.time)}
      soundBank?.traversal?.(!!run.zipline || run.rope !== null, run.zipline ? run.zipline.speed / 140 : run.rope !== null ? run.ropeMotion[run.rope]?.speed ?? 0 : 0, run.ladder !== null && (input().up || input().duck))
      } catch (error) {
        console.warn('RAID OPS audio disabled after playback error', error)
        const failedBank = soundBank; soundBank = null
        try { failedBank?.dispose?.()?.catch(() => {}) } catch { /* 继续战斗。 */ }
      }
      if (run.storyCompleted.length > oldStoryCount) { const t = level.value.storyTerminals.find(t => t.id === run.storyCompleted.at(-1)); if (t) radioMessage(chapter.value.goals[t.goal]!.report) }
      if (run.claimedMissions.length > oldClaims) {
        const previousXp=progress.value.weaponXp,previousRank = weaponGrowth(previousXp).level
        progress.value = recordMissions(progress.value, run); save()
        announceGrowth(previousXp,progress.value.weaponXp)
        const task = level.value.missions.find(m => m.id === run.claimedMissions.at(-1))
        if (task && growth.value.level === previousRank && run.arsenal.length === oldArsenal) message(tr('Armory secured. +150 points.', '军械据点完成，战术得分 +150'))
      }
      else if (run.checkpoint > oldCheckpoint) message(tr('Checkpoint saved · supplies restored', '检查点已保存 · 补给已恢复'))
      if (run.status !== 'playing') { if (run.status === 'dead') gameStats.finish('game_fail'); soundBank?.stopTraversal?.(); mode.value = run.status; reason.value = run.reason; clearInput(); if (run.status === 'won') beginVictory(); else nextTick(() => pauseCard.value?.querySelector('button')?.focus()); break }
    }
    // 镜头与本帧物理更新后的角色位置对齐，避免跳跃/低帧率时落后一帧。
    if (mode.value === 'playing') cameraView = battleView(level.value, run, width, cameraView, dt)
    if(upgradeVisible.value){upgradeRemaining.value=Math.max(0,upgradeRemaining.value-dt);if(!upgradeRemaining.value)upgradeReveal.value=null}
    if(revealVisible.value){revealRemaining.value=Math.max(0,revealRemaining.value-dt);if(!revealRemaining.value)dismissReveal()}
    if (radio.value&&!revealVisible.value) { radioRemaining.value = Math.max(0, radioRemaining.value - dt); if (!radioRemaining.value) radio.value = null }
    sync()
    if (run.time - lastSessionAt >= 3) { lastSessionAt = run.time; storeSession() }
  }
  if (mode.value === 'victory' && !victoryPaused.value) { victoryTime.value = Math.min(VICTORY_DURATION, victoryTime.value + dt); if (victoryTime.value >= VICTORY_DURATION) showSettlement() }
  if (mode.value === 'transition' && transit.value) {
    if (advanceTransition(transit.value, dt)) finishTransition()
    if (transit.value && context && arrival) {
      const frame = transitionFrame(transit.value)
      const departing = { ...run, x: run.x + (reduceMotion.value ? 0 : Math.min(1, transit.value.elapsed / 1.15) * 105), time: run.time + transit.value.elapsed, facing: 1, duck: false, bullets: [], effects: [] }
      const arriving = { ...arrival, x: reduceMotion.value ? 65 : -30 + frame.phase * 95, time: frame.phase * 1.5 }
      drawFront(context, frame.stage === 'arrive' ? FRONT_LEVELS[transit.value.to]! : level.value, frame.stage === 'arrive' ? arriving : departing, width, { left: false, right: !reduceMotion.value && frame.stage !== 'route' && !transit.value.paused, up: false, duck: false, jump: false, shoot: false }, { reducedMotion: reduceMotion.value, language: language.value })
    }
  } else if (context && mode.value === 'ready') {
    if (menuView.value === 'title' && !panel.value && !reduceMotion.value && (typeof document === 'undefined' || !document.hidden)) titleElapsed += dt
    drawFrontTitle(context, level.value, width, titleElapsed, reduceMotion.value, titleFigureSpace(), selectedOperative.value)
  } else if (context && mode.value !== 'settlement') {
    const sceneRun = mode.value === 'victory' ? { ...run, effects: run.effects.map(f => ({ ...f, time: f.time - victoryTime.value })).filter(f => f.time > 0) } : run
    drawFront(context, level.value, sceneRun, width, mode.value === 'victory' ? { left: false, right: false, up: true, duck: false, jump: false, shoot: false } : input(), { reducedMotion: reduceMotion.value, language: language.value,view:cameraView })
    if (mode.value === 'victory') drawVictory(context, width, victoryTime.value, WAR_PALETTES[level.value.id]!.accent, reduceMotion.value)
  }
}
onMounted(() => {
  try {
    const raw = localStorage.getItem(sessionKey.value)
    const saved = decodeSession(raw, FRONT_LEVELS, DESERT_LEVEL)
    if (saved) savedGame.value = { campaign:saved.campaign, levelId:saved.levelId, savedAt:saved.savedAt }
    else if (raw) menuFeedback.value = 'An older or incomplete save could not be restored. Your permanent unlocks and records are kept.'
  } catch { storageAvailable.value = false }
  warmDestructionArt()
  try{const last=localStorage.getItem(storageKey.value+':last-campaign');if(last==='grayhaven'||last==='sandstorm')lastCampaign.value=last;const mission=localStorage.getItem(storageKey.value+':last-mission');if(mission!==null&&/^[0-5]$/.test(mission))lastMission.value=Number(mission)}catch{storageAvailable.value=false}
  try{const raw=JSON.parse(localStorage.getItem(storageKey.value+':sandstorm')??'null');if(raw&&Number.isSafeInteger(raw.score)&&raw.score>=0&&Number.isFinite(raw.time)&&raw.time>0&&Number.isInteger(raw.kills)&&raw.kills>=0&&raw.kills<=DESERT_LEVEL.enemies.length)desertRecord.value=raw}catch{}
  fullscreenAvailable.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', fullscreenChange)
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  try { const raw = localStorage.getItem('raid-ops-preferences-v1'); const p = readFrontPreferences(raw ? JSON.parse(raw) : null); selectedOperative.value=p.operative; autoFire.value = p.autoFire; aimAssist.value = p.aimAssist; sound.value = p.sound; volume.value = p.volume; musicEnabled.value = p.music; musicVolume.value = p.musicVolume; reduceMotion.value = p.reducedMotion || systemMotion } catch { reduceMotion.value = systemMotion }
  try { progress.value = readProgress(JSON.parse(localStorage.getItem(storageKey.value) || 'null')) } catch { storageAvailable.value = false }
  try{tutorial.value=readTutorial(JSON.parse(localStorage.getItem(storageKey.value+':tutorial-v1')??'null'),progress.value.weaponXp>0||progress.value.unlocked>0)}catch{tutorial.value=readTutorial(null)}
  run = createRun(level.value, armoryFor(progress.value), progress.value.missions, progress.value.weaponXp,selectedOperative.value); sync(); resize(); observer = new ResizeObserver(resize); if (canvas.value) observer.observe(canvas.value)
  sceneObserver = new IntersectionObserver(entries => { const entry = entries[entries.length - 1]; if (entry) setSceneVisible(entry.isIntersecting) }); if (gameScreen.value) sceneObserver.observe(gameScreen.value)
  window.addEventListener('resize', resize); window.addEventListener('keydown', windowKeydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', backgroundAudio); window.addEventListener('focus', foregroundAudio); document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', backgroundAudio); window.addEventListener('pageshow', foregroundAudio); pageActive = pageForeground(); audioUnlocked = true; updateMusic(); frame = requestAnimationFrame(animate)
})
onBeforeUnmount(() => { gameStats.finish('game_exit'); storeSession(); if (immersive.value) document.documentElement.style.overflow = pageOverflow; cancelAnimationFrame(frame); pageActive = false; audioUnlocked = false; musicGeneration++; silenceMusic(); document.removeEventListener('fullscreenchange', fullscreenChange); observer?.disconnect(); sceneObserver?.disconnect(); clearInput(); clearTimeout(noticeTimer); musicPlayer.value?.pause(); soundBank?.dispose().catch(() => {}); window.removeEventListener('resize', resize); window.removeEventListener('keydown', windowKeydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', backgroundAudio); window.removeEventListener('focus', foregroundAudio); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', backgroundAudio); window.removeEventListener('pageshow', foregroundAudio) })
</script>

<template>
  <section ref="gameScreen" class="front-page" :class="{ 'is-fullscreen': isFullscreen, 'is-immersive': immersive, 'combat-layout': ['playing','paused','dead','victory'].includes(mode) }" lang="en" @pointerdown.capture="unlockFromPointer" @click.capture="uiClickSound">
    <audio ref="musicPlayer" loop preload="none" aria-hidden="true" @error="musicError"/>
    <div class="front-machine">
      <div ref="arena" class="front-arena" tabindex="0" role="group" @pointerdown="focusPlayfield" :aria-label="tr('RAID OPS game. Enter to start, A/D to move, J to fire, Space to jump, Esc to pause.', 'RAID OPS。Enter 开始，A/D 移动，J 开火，空格跳跃，Esc 暂停。')">
        <canvas ref="canvas" class="front-canvas" role="img" :aria-label="`${zoneName(level.id)} · ${tr('Health', '体力')} ${hp}/${MAX_HEALTH} · ${tr('Score', '得分')} ${score}`" />
      </div>
      <header class="screen-top" :class="{ 'is-home-nav': mode === 'ready' && menuView === 'title' }">
        <div class="screen-brand"><img class="brand-logo" src="/images/raid-ops-logo-v2.png" alt="" width="44" height="44"/><span>RAID OPS<small>{{ tr('Tactical action', 'RAID OPS') }}</small></span></div>
        <div v-if="notice && mode === 'playing'" class="field-notice" role="status">{{ notice }}</div>
        <div class="screen-tools">
          <nav v-if="mode === 'ready' && menuView === 'title'" class="home-site-nav" aria-label="Site navigation"><NuxtLink to="/how-to-play">How to play</NuxtLink><NuxtLink to="/about">About</NuxtLink></nav>
          <button v-if="mode === 'playing' || mode === 'paused' || mode === 'dead'" class="mission-entry" @click="openPanel('story')">{{ tr('Mission', '任务') }}</button>
          <button class="music-tool" :class="{'needs-click': musicBlocked && musicEnabled}" :aria-label="musicBlocked && musicEnabled ? 'Enable background music' : musicEnabled ? 'Mute background music' : 'Play background music'" :title="musicBlocked && musicEnabled ? 'Click to enable background music' : musicEnabled ? 'Mute background music' : 'Play background music'" :aria-pressed="musicEnabled && !musicBlocked" @click="musicBlocked && musicEnabled ? unlockAudio() : toggleMusic()"><span class="front-ui-icon"><Headset/></span></button>
          <button v-if="fullscreenAvailable" :aria-label="isFullscreen ? tr('Exit fullscreen', '退出全屏') : tr('Enter fullscreen', '进入全屏')" :title="isFullscreen ? tr('Exit fullscreen', '退出全屏') : tr('Fullscreen', '全屏')" @click="toggleFullscreen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg></button>
          <button :aria-label="tr('Settings', '设置')" :title="tr('Settings', '设置')" @click="openPanel('settings')"><span class="front-ui-icon"><Setting/></span></button>
          <button v-if="mode === 'playing' || mode === 'paused'" :aria-label="mode === 'paused' ? tr('Resume', '继续') : tr('Pause', '暂停')" :title="mode === 'paused' ? tr('Resume', '继续') : tr('Pause', '暂停')" @click="mode === 'paused' ? resume() : pause()"><span class="front-ui-icon"><VideoPlay v-if="mode === 'paused'"/><VideoPause v-else/></span></button>
        </div>
      </header>
      <div v-if="mode === 'playing' || mode === 'paused' || mode === 'dead'" class="campaign-progress" role="progressbar" :aria-label="tr('Mission progress', '关卡进度')" :aria-valuenow="Math.round(distance)" :aria-valuemin="0" :aria-valuemax="100"><i :style="{ width: `${distance}%` }"/></div>
      <p v-if="menuFeedback" class="menu-feedback" role="status">{{ menuFeedback }}</p>

      <div v-if="mode === 'ready' && menuView === 'title'" class="title-screen">
        <div ref="titleCopy" class="title-copy">
          <p class="eyebrow">Run. Gun. Break through.</p>
          <h1>RAID<span> OPS</span></h1>
          <p class="title-subtitle">Run and Gun Game Online</p>
          <p class="title-description">Fight through occupied harbors and desert outposts. Seize weapons, commandeer armor, and take down bosses.</p>
          <div class="title-actions">
            <button class="front-primary" @click="titleStart">Start Game<kbd>Enter</kbd></button>
            <div class="quick-start-action">
              <button class="menu-secondary" @click="quickStart">Quick start</button>
              <p class="quick-start-hint">Jump into the first mission</p>
            </div>
          </div>
          <p v-if="savedGame" class="continue-note">Saved: {{ savedMission }} · Continue from your last position</p>
          <div class="title-facts"><span>{{ tr('2 campaigns', '两大战役') }}</span><span>{{ tr('6 specialist weapons', '六种战术武器') }}</span><span>{{ tr('Checkpoint retries', '补给点重试') }}</span></div>
        </div>
        <div class="title-bottom"><span>RAID OPS · {{ tr('Progress saved locally', '进度保存在当前浏览器') }}</span><nav class="title-legal" aria-label="Legal"><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink></nav></div>
      </div>

      <section v-if="mode === 'ready' && menuView === 'campaigns'" class="campaign-screen" :aria-label="tr('Campaign select', '选择战役')">
        <header class="menu-heading"><div><p class="eyebrow">{{ tr('Campaign select', '战役选择') }}</p><h2>{{ tr('Choose your campaign', '选择要挑战的战役') }}</h2></div><button class="menu-secondary" @click="showTitle">{{ tr('Back', '返回') }}</button></header>
        <div class="campaign-cards">
          <article class="campaign-option campaign-card campaign-grayhaven"><button class="campaign-main" @click="chooseCampaign('grayhaven')"><div class="campaign-art" aria-hidden="true"><img :src="MENU_ART['campaign-grayhaven']" alt="" decoding="async" draggable="false"/></div><div class="campaign-copy"><p class="eyebrow">{{ tr('6 operations', '六场行动') }}</p><h3>{{ tr('Grayhaven', '灰港行动') }}</h3><p>{{ tr('Break through the harbor blockade, cross the industrial front and recover your missing squad.', '突破港口封锁，穿越工业战线，寻找失联队友。') }}</p><span>{{ progress.records.filter(Boolean).length }}/6 {{ tr('Cleared', '已完成') }}</span></div></button><footer class="campaign-card-actions"><button class="text-button" @click="chooseCampaign('grayhaven')">{{ tr('Choose operation', '进入关卡选择') }}</button><button class="text-button campaign-story" @click="showCampaignStory('grayhaven')">{{ tr('Campaign background', '行动背景') }}</button></footer></article>
          <article class="campaign-option campaign-card campaign-sandstorm"><button class="campaign-main" @click="chooseCampaign('sandstorm')"><div class="campaign-art" aria-hidden="true"><img :src="MENU_ART['campaign-sandstorm']" alt="" decoding="async" draggable="false"/></div><div class="campaign-copy"><p class="eyebrow">{{ tr('Dune outpost available', '沙海前哨已开放') }}</p><h3>{{ tr('Sandstorm', '沙暴行动') }}</h3><p>{{ tr('Cross the sinking sands, breach the outpost and take down the Sand Scorpion armored vehicle.', '穿越流沙地带，突入沙海前哨，击破沙蝎装甲车。') }}</p><span>{{ desertRecord ? 1 : 0 }}/1 {{ tr('Cleared', '已完成') }}</span></div></button><footer class="campaign-card-actions"><button class="text-button" @click="chooseCampaign('sandstorm')">{{ tr('Choose operation', '进入关卡选择') }}</button><button class="text-button campaign-story" @click="showCampaignStory('sandstorm')">{{ tr('Campaign background', '行动背景') }}</button></footer></article>
        </div>
      </section>

      <section v-if="mode === 'ready' && menuView === 'missions'" class="mission-screen" :aria-label="tr('Mission select', '选择任务')">
        <header class="menu-heading"><div><p class="eyebrow">{{ isDesert ? tr('Sandstorm', '沙暴行动') : tr('Grayhaven', '灰港行动') }} · {{ cleared }}/{{ campaignLevels.length }} {{ tr('Cleared', '已完成') }}</p><h2>{{ tr('Choose your next operation', '选择下一场行动') }}</h2></div><button class="menu-secondary" @click="showCampaigns">{{ tr('Back', '返回') }}</button></header>
        <div class="mission-layout"><div class="mission-choices"><div class="zone-grid"><button v-for="item in campaignLevels" :key="item.id" :class="{ current: level.id === item.id, completed: campaignRecords[item.id] }" :disabled="item.id > campaignUnlocked" :aria-pressed="level.id === item.id" @click="select(item.id)"><div class="zone-art" :class="isDesert?'zone-desert':`zone-${item.id}`"><img :src="MENU_ART[`operation-${isDesert ? 6 : item.id}`]" alt="" decoding="async" draggable="false"/><span>{{ item.id > campaignUnlocked ? tr('Locked', '未解锁') : campaignRecords[item.id] ? tr('Cleared', '已完成') : tr('Available', '可出战') }}</span></div><div class="zone-card-copy"><small>0{{ item.id + 1 }}</small><strong>{{ zoneName(item.id) }}</strong><span>{{ campaignRecords[item.id] ? `${tr('Best', '最佳')} ${campaignRecords[item.id]!.score.toLocaleString()} · ${clock(campaignRecords[item.id]!.time)}` : item.id > campaignUnlocked ? tr('Clear the previous operation', '完成上一场行动后解锁') : `${Math.floor(item.width / 225 / 60)}–8 ${tr('min', '分钟')} · ${tr('Boss encounter', '首领战')}` }}</span></div></button></div><div class="deploy-row"><span><small>{{ tr('Selected operation', '已选行动') }} / 0{{ level.id + 1 }}</small><strong>{{ zoneName(level.id) }}</strong></span><div class="deploy-operative"><div><small>Operative · {{ operativeInfo.tag.en }}</small><div class="deploy-operative-summary"><strong>{{ operativeInfo.name.en }}</strong><p><kbd>U</kbd> {{ operativeInfo.skill.en }}</p></div></div><button class="text-button" aria-label="Change operative" @click="openPanel('operatives')">Change</button></div><button class="front-primary" @click="prepareDeployment">Deploy<kbd>Enter</kbd></button></div></div>
          <aside class="mission-brief" tabindex="0" :aria-label="tr('Mission briefing · Scroll for details', '行动简报，可独立滚动查看')"><p class="eyebrow">{{ tr('Mission brief', '行动简报') }} / 0{{ level.id + 1 }}</p><h3>{{ zoneInfo(level.id).name }}</h3><p>{{ storyText(chapter.brief) }}</p><div class="brief-meta"><span>{{ tr('Threat level', '威胁等级') }}<b>{{ isDesert ? tr('Normal','标准') : `${level.id + 1} / 6` }}</b></span><span>{{ tr('Strongholds', '敌方据点') }}<b>{{ level.encounters.length }}</b></span><span>{{ tr('Estimated time', '预计时长') }}<b>5–8 {{ tr('min', '分钟') }}</b></span></div><p class="dungeon-rule">{{ storyText(dungeonRules.rule) }}</p><button class="growth-entry" @click="openPanel('growth')"><span>{{ tr('Arsenal', '军械成长') }}</span><strong>LV {{ growth.level }}</strong><small>{{ growth.max ? tr('Max', '已满级') : `${growth.remaining} XP ${tr('to next level', '后升级')}` }}</small></button><p class="brief-tip">{{ tr('Raid Black Tide armories: eliminate two waves of marked guards to seize specialist weapons.', '攻下黑潮军械据点，击败两波标记守军，缴获专用武器。') }}</p><button class="text-button" @click="openPanel('story')">{{ tr('Briefing & intel', '剧情简报与情报') }}</button><button class="text-button" @click="openPanel('controls')">{{ tr('Controls & weapon roles', '操作与武器用途') }}</button></aside>
        </div><p v-if="isDesert" class="desert-roadmap">{{ tr('First operation available · Next: Canyon Convoy, Buried City, Storm Radar, Solar Array, Relay Core.','首场行动已开放 · 后续规划：峡谷运输线、埋沙古城、风暴雷达站、太阳能阵列、地下中继核心。') }}</p><p class="save-note">{{ storageAvailable ? tr('Weapons and best scores are saved locally in this browser. Checkpoints last for the current run.', '武器与最佳成绩保存在当前浏览器。补给点仅在本次闯关期间有效。') : tr('Storage unavailable. Progress will last only until this page is closed.', '浏览器存储不可用，关闭页面后进度将丢失。') }}</p>
      </section>

      <template v-if="mode === 'playing' || mode === 'paused' || mode === 'dead'">
        <div class="battle-hud"><div class="health" :class="{ 'health-low': hp <= 3 }" :aria-label="`${tr('Health', '体力')} ${hp}/${MAX_HEALTH}`"><span class="health-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/></svg></span><div class="health-content"><div class="health-caption"><small>{{ tr('Vitals', '生命状态') }}</small><span>{{ hp }}<b>/{{ MAX_HEALTH }}</b></span></div><div class="health-cells"><i v-for="n in MAX_HEALTH" :key="n" :class="{ filled: hp >= n }"/></div><div class="armor-readout" :aria-label="`${tr('Armor', '护甲')} ${armor}/3`"><span>{{ tr('Armor', '护甲') }}</span><i v-for="n in 3" :key="n" :class="{ filled: armor>=n }"/><b>{{ armor }}/3</b></div></div></div><div class="battle-score"><strong>{{ score.toString().padStart(6, '0') }}</strong><span>{{ clock(seconds) }}</span></div></div>
        <aside v-if="mode === 'playing' && radio && !revealVisible" class="radio-message" role="status"><small>{{ tr('Radio', '无线电') }}</small><p>{{ storyText(radio) }}</p><button :aria-label="tr('Dismiss radio', '收起无线电')" @click="radio = null">×</button></aside>
        <aside v-if="mode==='playing' && teaching && !revealVisible && !boss && !bossIncoming" class="teaching-hint" role="status"><kbd>{{ teaching.key }}</kbd><p>{{ language==='en'?teaching.en:teaching.zh }}</p><button @click="completeLesson(teaching.id)">{{ tr('Got it', '知道了') }}</button></aside>
        <aside v-if="revealVisible && newWeapon" class="weapon-reveal" role="status"><svg viewBox="0 0 64 34" aria-hidden="true" :style="{color:WEAPONS[newWeapon].color}"><path :d="weaponSilhouettes[newWeapon]" fill="currentColor" fill-rule="evenodd"/></svg><div><small>{{ tr('New weapon unlocked', '新武器已解锁') }}</small><strong :style="{color:WEAPONS[newWeapon].color}">{{ weaponName(newWeapon) }}</strong><p>{{ weaponInfo(newWeapon).description }}</p><p>{{ weaponInfo(newWeapon).role }} · {{ weaponInfo(newWeapon).counter }}</p><p><kbd>Q</kbd> {{ tr('Cycle weapons', '循环切换') }} · <kbd>{{ WEAPON_ORDER.indexOf(newWeapon)+1 }}</kbd> {{ tr('Equip directly', '直接装备') }}</p></div><button @click="dismissReveal" :aria-label="tr('Dismiss weapon details','收起武器详情')">×</button></aside>
        <aside v-if="upgradeVisible && upgradeReveal" class="weapon-reveal growth-reveal" role="status"><div><small>{{ tr('Arsenal upgraded','军械升级') }} · LV {{ weaponGrowth(upgradeReveal.toXp).level }}</small><strong>{{ weaponName(upgradeReveal.weapon) }}</strong><dl><div v-for="change in upgradeChanges" :key="change.key"><dt>{{ growthLabel(change.key) }}</dt><dd>{{ growthValue(change.before,change.key) }} → {{ growthValue(change.after,change.key) }}</dd></div></dl><p>{{ tr('Shared research strengthens every unlocked weapon.','共享军械成长同时强化所有已解锁武器。') }}</p></div><button @click="upgradeReveal=null" :aria-label="tr('Dismiss upgrade details','收起升级详情')">×</button></aside>
        <div v-if="traversalHint && mode === 'playing'" class="traversal-hint" role="status">{{ traversalHint }}</div>
        <div v-if="gateHint && mode === 'playing'" class="counter-hint" :class="{ 'hint-offscreen-only':gateHint.onscreen }" :style="{ color: WEAPONS[gateHint.weapon].color }"><strong>{{ local(gateHint.name) }}</strong><span>{{ arsenal.includes(gateHint.weapon) ? `${tr('Use', '使用')} ${weaponName(gateHint.weapon)} · ${WEAPON_ORDER.indexOf(gateHint.weapon) + 1}` : tr('Complete the matching armory raid first', '先攻下对应军械据点') }}</span></div>
        <div v-if="bossIncoming && mode === 'playing'" class="boss-warning" role="status"><small>{{ tr('Warning · boss ahead', '警告 · 前方发现首领') }}</small><strong>{{ bossIncoming }}</strong><span>{{ storyText(dungeonRules.boss) }}</span></div>
        <div v-if="boss && mode === 'playing'" class="boss-bar" :class="{ 'boss-critical': boss.hp / boss.max < .25 }" role="meter" :aria-label="boss.name" :aria-valuenow="Math.ceil(boss.hp)" :aria-valuemax="boss.max" :aria-valuemin="0"><div class="boss-heading"><small>{{ boss.minor?tr('Section commander', '区域指挥官'):tr('Boss', '首领') }}</small><strong>{{ boss.name }}</strong><span>{{ Math.ceil(boss.hp) }}<b> / {{ boss.max }}</b></span></div><div class="boss-track"><i class="boss-echo" :style="{ width: `${bossTrail / boss.max * 100}%` }"/><i class="boss-fill" :style="{ width: `${boss.hp / boss.max * 100}%` }"/><em v-for="n in 3" :key="n" :style="{ left: `${n * 25}%` }"/></div><div class="boss-details"><span class="boss-phase">{{ boss.minor?tr('Elite encounter', '精英遭遇战'):tr('Phase', '阶段') }} <template v-if="!boss.minor">{{ boss.phase }} / 3</template></span><span>{{ boss.tactic }}</span></div><small class="boss-counter">{{ tr('Counter:', '建议武器：') }} {{ boss.counter }}</small></div>
        <button v-if="mode==='playing'" class="grenade-resource" :disabled="grenades===0" @click="throwGrenade" :aria-label="`${tr('Grenades', '手雷')} ${grenades}`"><span>{{ tr('Grenades', '手雷') }}</span><strong>{{ grenades }}</strong><kbd>L</kbd></button>
        <button v-if="mode==='playing'" class="operative-skill" :class="{ ready: skillState.ready, active:skillState.active }" :disabled="!skillState.ready" @click="activateSkill" :title="storyText(operativeInfo.skillDescription)"><kbd>U</kbd><span><strong>{{ storyText(operativeInfo.name) }}</strong><small>{{ storyText(operativeInfo.skill) }}</small></span><b>{{ skillState.cooldown>0?`${Math.ceil(skillState.cooldown)}s`:selectedOperative==='fox'&&!skillState.ready?tr('Air only','空中使用'):tr('Ready','就绪') }}</b><i :style="{ width:`${(1-skillState.cooldown/operativeInfo.cooldown)*100}%` }"/></button>
        <div class="equipment-bar" :class="{ collapsed: !equipmentOpen }"><div class="equipment-tools"><button class="equipment-toggle" :aria-expanded="equipmentOpen" aria-controls="front-loadout" :aria-label="`${tr('Loadout', '装备')} · ${weaponName(weapon)}`" :title="equipmentOpen ? tr('Hide loadout', '收起装备栏') : tr('Show loadout', '展开装备栏')" @click="toggleEquipment"><svg viewBox="0 0 64 34" aria-hidden="true" :style="{ color: WEAPONS[weapon].color }"><path :d="weaponSilhouettes[weapon]" fill="currentColor" fill-rule="evenodd"/></svg><span class="current-weapon-name">{{ weaponName(weapon) }}</span><small class="loadout-level">LV {{ growth.level }}</small><span v-if="equipmentOpen">{{ tr('Hide', '收起') }}</span></button><button class="weapon-cycle" :disabled="mode !== 'playing' || arsenal.length < 2" :title="tr('Cycle through unlocked weapons', '依次切换已解锁武器')" @click="cycleWeapon"><span>{{ tr('Switch weapon', '切换武器') }}</span><kbd>Q</kbd></button></div><div v-show="equipmentOpen" id="front-loadout"><div class="weapon-slots"><button v-for="(item, index) in WEAPON_ORDER" :key="item" :disabled="mode !== 'playing' || !arsenal.includes(item)" :class="{ active: weapon === item }" :aria-pressed="weapon === item" :title="`${weaponName(item)} · ${weaponInfo(item).description}`" @click="chooseWeapon(item)"><kbd>{{ index + 1 }}</kbd><svg viewBox="0 0 64 34" aria-hidden="true" :style="{ color: WEAPONS[item].color }"><path :d="weaponSilhouettes[item]" fill="currentColor" fill-rule="evenodd"/></svg><span>{{ weaponName(item) }}</span><small>LV {{ growth.level }}</small></button></div><div class="tactical-slots"><button @click="openPanel('growth')">{{ tr('Weapon growth', '武器成长') }} · LV {{ growth.level }}</button><button class="text-button" @click="openPanel('controls')">{{ tr('Controls', '操作') }}</button></div><div class="route-bar"><span :style="{ width: `${distance}%` }"/></div></div></div>
      </template>

      <div v-if="(mode === 'paused' || mode === 'dead' || mode === 'won') && !panel" class="pause-scrim"><section ref="pauseCard" class="pause-card" role="dialog" aria-modal="true" :aria-label="mode === 'paused' ? tr('Paused', '已暂停') : tr('Mission status', '任务状态')"><p class="eyebrow">{{ zoneName(level.id) }} / 0{{ level.id + 1 }}</p><h2>{{ mode === 'paused' ? tr('Paused', '已暂停') : mode === 'dead' ? tr('Down, not out.', '再次出击') : tr('Area clear', '战区突破') }}</h2><p>{{ mode === 'paused' ? tr('Take a breath. The battlefield can wait.', '歇一口气，战场已经暂停。') : mode === 'dead' ? local(reason) : `${tr('Score', '得分')} ${score} · ${clock(seconds)}` }}</p><div class="pause-summary"><span>{{ tr('Time', '用时') }}<b>{{ clock(seconds) }}</b></span><span>{{ tr('Eliminations', '击破') }}<b>{{ kills }}</b></span><span>{{ tr('Progress', '进度') }}<b>{{ Math.floor(distance) }}%</b></span></div><button class="front-primary" @click="mode === 'paused' ? resume() : mode === 'dead' ? retry() : next()">{{ mode === 'paused' ? tr('Resume', '继续行动') : mode === 'dead' ? checkpoint >= 0 ? tr('Retry checkpoint', '从补给点重试') : tr('Try again', '重新挑战') : tr('Continue', '继续') }}<kbd>{{ mode === 'paused' ? 'Esc' : 'Enter' }}</kbd></button><div class="pause-options"><button v-if="mode==='dead'" @click="openPanel('operatives')">{{ tr('Change operative', '更换角色') }}</button><button @click="openPanel('settings')">{{ tr('Settings', '设置') }}</button><button @click="openPanel('controls')">{{ tr('Controls', '操作指南') }}</button><button @click="openPanel('restart')">{{ tr('Restart mission', '重开本关') }}</button><button @click="showMissions">{{ tr('Mission select', '选择任务') }}</button><button v-if="mode==='paused'" class="pause-exit" @click="openPanel('quit')">{{ tr('Exit', '退出') }}</button></div><small>{{ tr('Weapons already earned stay unlocked.', '已经获得的武器会继续保留。') }}</small></section></div>

      <section v-if="mode === 'settlement' && settlement" ref="resultPanel" class="result-page" tabindex="-1" :aria-label="tr('Mission results', '任务结算')"><div class="result-overview"><header class="result-heading"><p class="eyebrow">{{ resultPreview ? tr('Preview / no progress saved', '演出预览 / 不计成绩') : finalMission ? tr('Campaign complete', '战役完成') : tr('Mission complete', '任务完成') }}</p><h2>{{ zoneName(level.id) }}</h2><p>{{ zoneInfo(level.id).name }}</p></header><div class="result-main"><div class="result-rank" :class="`rank-${settlement.rank.toLowerCase()}`"><small>{{ tr('Rank', '评级') }}</small><strong>{{ settlement.rank }}</strong><span>{{ settlement.rating }}/100</span></div><div class="result-score"><small>{{ tr('Mission score', '本次得分') }}</small><strong>{{ settlement.score.toLocaleString() }}</strong><span>{{ resultPreview ? tr('Preview only', '仅为预览') : settlement.newBest ? tr('New personal best', '个人最佳纪录') : tr('Score saved', '成绩已保存') }}</span></div><div class="result-time"><small>{{ tr('Combat time','战斗用时') }}</small><strong>{{ clock(settlement.time) }}</strong></div></div><section class="result-rewards" :aria-label="tr('New weapons', '新获得武器')"><p class="eyebrow">{{ tr('Armory raids', '军械据点') }} · {{ settlement.missions }}/{{ level.missions.length }}</p><h3 v-if="!resultPreview && settlement.rewards.length">{{ tr('New weapons unlocked', '本关新获得武器') }}</h3><p v-if="resultPreview || !settlement.rewards.length">{{ tr('Previously earned weapons remain unlocked.', '已获得的武器继续保留。') }}</p><p v-if="!resultPreview && settlement.rewards.length" class="reward-switch-help">{{ tr('Weapons are permanently unlocked. In combat, tap Q to cycle through unlocked weapons; after the last one, it returns to the first. You can also click Switch weapon or choose a weapon in the loadout.', '武器已永久解锁。战斗中每按一次 Q 切换到下一把，最后一把之后回到第一把；也可点击「切换武器」按钮，或展开装备栏选择。') }}</p><div v-if="!resultPreview && settlement.rewards.length" class="reward-weapons"><article v-for="item in settlement.rewards" :key="item"><header><svg viewBox="0 0 64 34" aria-hidden="true" :style="{ color: WEAPONS[item].color }"><path :d="weaponSilhouettes[item]" fill="currentColor" fill-rule="evenodd"/></svg><div><h4 :style="{ color: WEAPONS[item].color }">{{ weaponName(item) }}</h4><small>{{ weaponInfo(item).role }}</small></div></header><p>{{ weaponInfo(item).description }}</p><p>{{ tr('Best against:', '适合对付：') }} {{ weaponInfo(item).counter }}</p><div class="reward-equip"><kbd>{{ WEAPON_ORDER.indexOf(item) + 1 }}</kbd>{{ tr('Select directly in combat', '战斗中按此数字键直接装备') }}</div></article></div></section><details class="result-details"><summary>{{ tr('Combat statistics, story and loadout','查看战斗统计、剧情和携行装备') }}</summary><div class="result-stats"><div v-for="stat in [{ label: tr('Combat time', '战斗用时'), value: clock(settlement.time) }, { label: tr('Eliminations', '击破目标'), value: `${settlement.kills}/${settlement.enemies}` }, { label: tr('Strongholds', '清理据点'), value: `${settlement.outposts}/${settlement.totalOutposts}` }, { label: tr('Accuracy', '命中率'), value: `${settlement.accuracy}%` }, { label: tr('Hits taken', '受击次数'), value: settlement.damage }, { label: tr('Armor blocks', '护甲挡伤'), value: settlement.blocked }, { label: tr('Retries', '重试次数'), value: settlement.retries }, { label: tr('Cover destroyed', '摧毁掩体'), value: settlement.destroyed }]" :key="stat.label"><small>{{ stat.label }}</small><strong>{{ stat.value }}</strong></div></div><div class="story-outcome"><p class="eyebrow">{{ tr('Operation update', '行动进展') }}</p><p>{{ storyText(chapter.outcome) }}</p><small>{{ storyText(chapter.next) }}</small></div><p class="result-note">{{ tr('Arsenal', '军械等级') }} · LV {{ growth.level }} · {{ growth.xp }} XP <button class="text-button" @click="openPanel('growth')">{{ tr('Weapon growth', '武器成长') }}</button></p><div class="result-kit"><span>{{ tr('Loadout', '携行装备') }}</span><span v-for="item in arsenal" :key="item" :style="{ color: WEAPONS[item].color }">{{ weaponName(item) }}</span></div><p class="result-note">{{ tr('Health and grenades are replenished for the next mission. Your weapons and armor carry over.', '进入下一关时补充体力与手雷，武器与护甲继续携带。') }}</p></details></div><div class="result-actions"><button class="front-primary" @click="next">{{ resultPreview ? tr('Back to missions', '返回任务选择') : finalMission ? tr('Return to operations', '返回行动选择') : tr('Next mission', '下一场行动') }}</button><button class="menu-secondary" @click="openPanel('restart')">{{ tr('Replay mission', '重玩本关') }}</button><button class="menu-secondary" @click="returnToDungeon">{{ tr('Mission select', '任务选择') }}</button></div></section>
      <div v-if="mode === 'victory'" class="victory-overlay"><div><p class="eyebrow">{{ resultPreview ? tr('Cinematic preview', '通关演出预览') : tr('Threat eliminated', '区域威胁已解除') }}</p><h2>{{ finalMission ? (isDesert?tr('Outpost secured','前哨已夺取'):tr('Campaign complete', '全线突破')) : tr('Mission complete', '任务完成') }}</h2><p>{{ storyText(chapter.outcome) }}</p></div><div class="victory-actions"><button v-if="victoryPaused" class="menu-secondary" @click="resume">{{ tr('Resume', '继续') }}</button><button class="menu-secondary" @click="showSettlement">{{ tr('View results', '查看结算') }}<kbd>Enter</kbd></button></div></div>
      <section v-if="transit && transitFrame && nextLevel && story" class="transit-overlay"><header><p class="eyebrow">{{ previewing ? tr('Transition preview', '衔接预览') : tr('Redeploying', '转移战区') }}</p><span>0{{ transit.from + 1 }} / 0{{ transit.to + 1 }}</span></header><div class="transit-content"><p class="eyebrow">{{ transitFrame.stage === 'depart' ? tr('Extraction open', '撤离通道已开放') : story.transport }}</p><h2>{{ transitFrame.stage === 'depart' ? zoneName(level.id) : transitFrame.stage === 'arrive' ? zoneName(nextLevel.id) : story.title }}</h2><p>{{ transitFrame.stage === 'depart' ? storyText(chapter.outcome) : transitFrame.stage === 'arrive' ? storyText(CAMPAIGN[nextLevel.id]!.brief) : story.text }}</p><svg class="journey-scene" viewBox="0 0 720 120" aria-hidden="true"><path d="M0 104H720" stroke="#688b9e" stroke-width="3"/><g v-if="story.vehicle === 'cargo'"><path d="M35 100V22H155V100M565 100V22H685V100M155 36H565M155 58H565" fill="none" stroke="#4f7488" stroke-width="5"/><g :transform="`translate(${reduceMotion ? 350 : 70 + transitFrame.journey * 500},0)`"><rect x="-30" y="64" width="60" height="29" rx="4" fill="#819b9d"/><path d="M-20 69V88M-8 69V88M4 69V88M16 69V88" stroke="#2b4b5f" stroke-width="3"/><circle cx="-18" cy="98" r="6" fill="#d9b47b"/><circle cx="18" cy="98" r="6" fill="#d9b47b"/></g></g><g v-else-if="story.vehicle === 'lift'"><path d="M270 6V103M450 6V103M265 10H455" stroke="#54788b" stroke-width="5"/><path d="M315 8V90M405 8V90" stroke="#93aab2" stroke-width="2"/><g :transform="`translate(0,${reduceMotion ? -40 : -transitFrame.journey * 60})`"><rect x="293" y="77" width="134" height="9" fill="#c0aa83"/><path d="M306 77V51H414V77" fill="none" stroke="#7b9baf" stroke-width="3"/><circle cx="360" cy="44" r="7" fill="#a8d5d0"/><path d="M360 51V70M350 59H370M360 69L353 77M360 69L368 77" stroke="#91b7bf" stroke-width="5"/></g></g><g v-else-if="story.vehicle === 'bridge'"><path d="M35 90H685M105 90V120M260 90V120M460 90V120M610 90V120M35 65H685" stroke="#5e7e92" stroke-width="5"/><g :transform="`translate(${reduceMotion ? 360 : 60 + transitFrame.journey * 600},0)`"><circle cy="44" r="8" fill="#a9d4d1"/><path d="M0 53V72M-13 62H15M0 72L-12 88M0 72L12 88" stroke="#b8a27e" stroke-width="6"/></g></g><g v-else-if="story.vehicle === 'truck'"><path d="M80 104V35H140V104M570 104V15H635V104" fill="#244357"/><g :transform="`translate(${reduceMotion ? 360 : 70 + transitFrame.journey * 560},0)`"><rect x="-50" y="56" width="70" height="35" rx="4" fill="#617e8d"/><path d="M20 91V47H44L63 67V91Z" fill="#b7a786"/><rect x="28" y="54" width="14" height="16" fill="#284c60"/><circle cx="-30" cy="95" r="10" fill="#142e40" stroke="#96b2bb" stroke-width="3"/><circle cx="44" cy="95" r="10" fill="#142e40" stroke="#96b2bb" stroke-width="3"/></g></g><g v-else><path v-for="n in 5" :key="n" :d="`M${n * 130 - 80} 102V44Q${n * 130 - 25} -15 ${n * 130 + 30} 44V102`" fill="none" stroke="#355a70" stroke-width="7"/><g :transform="`translate(${reduceMotion ? 360 : 60 + transitFrame.journey * 600},0)`"><circle cy="57" r="7" fill="#a8d5d0"/><path d="M0 64V82M-12 73H12M0 82L-9 102M0 82L9 102" stroke="#a7b7b7" stroke-width="5"/></g></g></svg><svg class="transit-map" viewBox="0 0 720 165" aria-hidden="true"><polyline :points="routePoints" fill="none" stroke="#49616b" stroke-width="3" stroke-dasharray="7 7"/><g v-for="(stop, index) in ROUTE_STOPS" :key="index"><circle :cx="stop.x" :cy="stop.y" r="8" :fill="index <= transit.from ? '#e6b76b' : '#263c4a'" stroke="#abc4c5"/><text :x="stop.x" :y="stop.y + 32" text-anchor="middle" fill="#d5e1dc" font-size="14">{{ tr(['Docks','Foundry','Skyway','Fortress','City','Reactor'][index]!, stop.short) }}</text></g><circle :cx="reduceMotion ? ROUTE_STOPS[transit.to]!.x : transitFrame.vehicle.x" :cy="reduceMotion ? ROUTE_STOPS[transit.to]!.y : transitFrame.vehicle.y" r="12" fill="#e6b76b"/></svg><p class="transit-loadout">{{ transit.arsenal.length }} {{ tr(transit.arsenal.length === 1 ? 'weapon retained' : 'weapons retained', '种武器保留') }} · {{ tr('Health replenished', '体力补满') }}</p></div><footer><div class="transit-progress" role="progressbar" :aria-label="tr('Transfer progress', '转移进度')" :aria-valuenow="Math.round(transitFrame.progress * 100)" :aria-valuemin="0" :aria-valuemax="100"><span :style="{ width: `${transitFrame.progress * 100}%` }"/></div><div><span>{{ transit.paused ? tr('Transfer paused', '转场已暂停') : tr('Your equipment travels with you.', '携带已有装备进入下一战区。') }}</span><button v-if="transit.paused" class="menu-secondary" @click="resume">{{ tr('Resume', '继续') }}</button><button class="menu-secondary" @click="finishTransition">{{ previewing ? tr('End preview', '结束预览') : tr('Skip', '跳过') }}<kbd>Enter</kbd></button></div></footer></section>

      <div v-if="panel" class="modal-scrim" @click.self="closePanel"><section ref="dialogPanel" class="modal-panel" :class="{'operative-panel':panel==='operatives'}" role="dialog" aria-modal="true" aria-labelledby="front-dialog-title" tabindex="-1"><header><div><p class="eyebrow">{{ tr('RAID OPS / operations', 'RAID OPS / 作战中心') }}</p><h2 id="front-dialog-title">{{ panel === 'continue' ? 'Continue your saved game?' : panel === 'operatives' ? tr('Operatives', '选择角色') : panel === 'settings' ? tr('Settings', '设置') : panel === 'growth' ? tr('Arsenal progression', '军械成长') : panel === 'controls' ? tr('Field manual', '作战手册') : panel === 'trials' ? tr('Armory raids', '军械据点') : panel === 'story' ? (isDesert ? tr('Operation Sandstorm', '沙暴行动') : tr('Operation Grayhaven', '灰港行动')) : panel === 'restart' ? tr('Restart this mission?', '重新开始本关？') : panel === 'quit' ? tr('Return to mission select?', '退出并返回选关？') : tr('Leave this run?', '离开本次闯关？') }}</h2></div><button class="close-button" :aria-label="tr('Close dialog', '关闭弹窗')" @click="closePanel">×</button></header>
        <div :key="panel" class="modal-body">
        <template v-if="panel === 'continue'">
          <p class="confirm-copy">Resume {{ savedMission }} with your saved position, health, enemies and battlefield progress, or choose a mission for a new attempt.</p>
          <p class="dialog-note">Starting a new attempt replaces this saved game when you deploy. Unlocked weapons, research and best scores are kept.</p>

        </template>
        <template v-else-if="panel === 'operatives'">
          <div class="operative-mission"><span>{{ tr('Selected operation','已选行动') }} / {{ zoneName(level.id) }}</span><span>{{ tr('02 / Loadout','02 / 出战准备') }}</span></div>
          <div class="operative-prep" :class="{'switch-left':operativeSlide<0}">
            <div class="operative-showcase"><div class="operative-stage-lines" aria-hidden="true"/>
              <button class="operative-nav previous" :disabled="!operativeCanChange" :aria-label="tr('Previous operative','上一位角色')" @click="cycleOperative(-1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
              <Transition :name="reduceMotion?'operative-still':operativeSlide<0?'operative-back':'operative-forward'" mode="out-in"><div :key="selectedOperative" class="operative-figure"><canvas ref="operativePreview" :data-operative="selectedOperative" width="600" height="900" :aria-label="`${tr(operativeInfo.name.en,operativeInfo.name.zh)} · ${tr('Front view','正面展示')}`" role="img"/></div></Transition>
              <button class="operative-nav next" :disabled="!operativeCanChange" :aria-label="tr('Next operative','下一位角色')" @click="cycleOperative(1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8"/></svg></button>
              <div class="operative-position"><span>{{ String(operativeIndex+1).padStart(2,'0') }} / {{ String(OPERATIVE_ORDER.length).padStart(2,'0') }}</span><div><i v-for="id in OPERATIVE_ORDER" :key="id" :class="{current:selectedOperative===id}"/></div><small>{{ tr('Left / right to switch','左右切换角色') }}</small></div>
            </div>
            <Transition :name="reduceMotion?'operative-still':'operative-details'" mode="out-in"><div :key="selectedOperative" class="operative-details" :style="{'--operative-accent':operativeInfo.color}"><p class="eyebrow">{{ tr(operativeInfo.tag.en,operativeInfo.tag.zh) }}</p><h3>{{ tr(operativeInfo.name.en,operativeInfo.name.zh) }}</h3><small class="operative-outfit">{{ isDesert?(selectedOperative==='fox'?tr('Desert scout kit','沙漠轻装侦察服'):tr('Desert field kit','沙漠战术装备')):tr(operativeInfo.outfit.en,operativeInfo.outfit.zh) }}</small><p class="operative-bio">{{ tr(operativeInfo.description.en,operativeInfo.description.zh) }}</p><div class="operative-ability"><kbd>U</kbd><strong>{{ tr(operativeInfo.skill.en,operativeInfo.skill.zh) }}</strong><span>{{ operativeInfo.cooldown }}s</span></div><p class="operative-skill-copy">{{ tr(operativeInfo.skillDescription.en,operativeInfo.skillDescription.zh) }}</p><p class="operative-shared">{{ tr('Weapons and arsenal progression are shared. Your operative is fixed for this run.','武器与军械成长共享；进入副本后角色固定。') }}</p></div></Transition>
          </div>

        </template><template v-else-if="panel === 'settings'"><div class="settings-row"><div><strong>{{ tr('Sound effects', '游戏音效') }}</strong><small>{{ tr('Gunfire, hits, traversal, and explosions', '开火、命中、受伤、绳索与爆炸音效') }}</small></div><div class="audio-actions"><button role="switch" :aria-checked="sound" :aria-label="tr('Sound effects', '游戏音效')" :class="{ enabled: sound }" @click="toggleSound">{{ sound ? tr('On', '开') : tr('Off', '关') }}</button><button :disabled="!sound || volume === 0" @click="previewGun">{{ tr('Test shot', '试听枪声') }}</button></div></div><div class="sound-preview"><button v-for="effect in [{ kind: 'metalHit', label: tr('Hit', '命中') }, { kind: 'hurt', label: tr('Taking damage', '受伤') }, { kind: 'barrelBoom', label: tr('Fuel explosion', '油桶爆燃') }, { kind: 'tankBoom', label: tr('Tank explosion', '坦克重爆') }]" :key="effect.kind" :disabled="!sound || volume === 0" @click="previewEffect(effect.kind as SoundCue)">{{ effect.label }}</button></div><label class="settings-row volume-row"><span><strong>{{ tr('Effects volume', '音效音量') }}</strong><small>{{ Math.round(volume * 100) }}%</small></span><input type="range" min="0" max="1" step="0.05" :value="volume" :aria-label="tr('Effects volume', '音效音量')" @input="setVolume"/></label><div class="settings-row"><div><strong>{{ tr('Background music', '背景音乐') }}</strong><small>{{ tr('Menu, combat, and boss tracks', '菜单、战斗与 Boss 独立配乐') }}</small></div><div class="audio-actions"><button role="switch" :aria-checked="musicEnabled" :aria-label="tr('Background music', '背景音乐')" :class="{ enabled: musicEnabled }" @click="toggleMusic">{{ musicEnabled ? tr('On', '开') : tr('Off', '关') }}</button><button :disabled="!musicEnabled || musicVolume === 0" @click="previewMusic">{{ tr('Preview music', '试听音乐') }}</button></div></div><label class="settings-row volume-row"><span><strong>{{ tr('Music volume', '音乐音量') }}</strong><small>{{ Math.round(musicVolume * 100) }}%</small></span><input type="range" min="0" max="1" step="0.01" :value="musicVolume" :aria-label="tr('Music volume', '音乐音量')" @input="setMusicVolume"/></label><div class="settings-row"><div><strong>{{ tr('Auto-fire', '自动连射') }}</strong><small>{{ tr('Keep firing without holding J', '无需按住 J，持续开火') }}</small></div><button role="switch" :aria-checked="autoFire" :aria-label="tr('Auto-fire', '自动连射')" :class="{ enabled: autoFire }" @click="toggleAuto">{{ autoFire ? tr('On', '开') : tr('Off', '关') }}</button></div><div class="settings-row"><div><strong>{{ tr('Aim assist', '辅助锁敌') }}</strong><small>{{ tr('Target visible enemies in your aim direction', '辅助瞄准前方可见的敌人') }}</small></div><button role="switch" :aria-checked="aimAssist" :aria-label="tr('Aim assist', '辅助锁敌')" :class="{ enabled: aimAssist }" @click="toggleAim">{{ aimAssist ? tr('On', '开') : tr('Off', '关') }}</button></div><div class="settings-row"><div><strong>{{ tr('Reduce motion', '减少动态效果') }}</strong><small>{{ tr('Disable screen shake, flips, and blinking', '关闭屏幕抖动、前空翻与人物闪烁') }}</small></div><button role="switch" :aria-checked="reduceMotion" :aria-label="tr('Reduce motion', '减少动态效果')" :class="{ enabled: reduceMotion }" @click="toggleMotion">{{ reduceMotion ? tr('On', '开') : tr('Off', '关') }}</button></div><p class="dialog-note">{{ tr('Preferences are saved on this device. Closing settings keeps the game paused.', '偏好保存在本机。关闭设置后，游戏仍保持暂停。') }}</p></template>
        <template v-else-if="panel === 'story'"><article v-if="mode !== 'ready'" class="current-mission"><small>{{ tr('Current objective', '当前任务') }} · {{ objective?.completed ?? level.storyTerminals.length }}/{{ level.storyTerminals.length }}</small><strong>{{ objective ? storyText(objective.title) : tr('Clear the exit defenses', '清除出口守卫') }}</strong><p v-if="objective">{{ objective.remaining ? `${objective.remaining} ${tr('guards at the target', '名目标守军')}` : tr('Stay near the terminal to secure the objective.', '留在终端附近完成任务。') }}</p><p>{{ checkpoint >= 0 ? `${tr('Checkpoint', '补给点')} ${checkpoint + 1}/${level.checkpoints.length}` : tr('Reach the first checkpoint', '前往首个补给点') }}</p><button class="text-button" @click="panel = 'trials'">{{ tr('Armory raids', '军械据点') }} {{ missions.filter(m => m.done).length }}/5</button></article><article class="dungeon-rule-card"><h3>{{ tr('Sector tactics', '本关打法') }}</h3><p>{{ storyText(dungeonRules.rule) }}</p><p>{{ storyText(dungeonRules.boss) }}</p></article><p class="story-premise">{{ storyText(isDesert?DESERT_STORY.brief:CAMPAIGN_PREMISE) }}</p><h3>0{{ level.id + 1 }} / {{ zoneName(level.id) }}</h3><p class="dialog-note">{{ storyText(chapter.brief) }}</p><div class="story-goals"><article v-for="(goal, index) in chapter.goals" :key="index" :class="{ done: run.storyCompleted.includes(level.storyTerminals[index]!.id) }"><strong>0{{ index + 1 }} / {{ storyText(goal.title) }}</strong><p>{{ run.storyCompleted.includes(level.storyTerminals[index]!.id) ? storyText(goal.report) : tr('Clear the terminal guards, then stay nearby to secure it. You can keep firing while working.', '清除终端守军后，留在附近完成任务，期间可以继续开火。') }}</p></article></div><p class="dialog-note">{{ tr('After this mission:', '下一步：') }} {{ storyText(chapter.next) }}</p></template>
        <template v-else-if="panel === 'growth'">
          <div class="growth-summary"><div><p class="eyebrow">{{ tr('Combat research', '战斗研发') }}</p><h3>LV {{ growth.level }} <small>/ 8</small></h3></div><div><strong>{{ growth.max ? tr('Fully upgraded', '武器已满级') : `${growth.earned} / ${growth.needed} XP` }}</strong><p>{{ tr('Kills and armory raids earn permanent XP. Every weapon upgrades together, including newly seized guns.', '击败敌人、攻下军械据点获得永久经验；所有武器同步升级，新缴获武器也继承等级。') }}</p></div></div>
          <div class="growth-meter" role="progressbar" :aria-label="tr('Weapon experience', '武器经验')" :aria-valuenow="growth.max ? 1 : growth.earned" :aria-valuemin="0" :aria-valuemax="growth.max ? 1 : growth.needed"><i :style="{ width: `${growth.ratio * 100}%` }"/></div>
          <p class="dialog-note">{{ tr('Upgrades apply immediately. Death, retries, and mission changes keep your XP. Weapon counters and shield mechanics still matter.', '升级途中即时生效；死亡、重试和切关都保留经验。武器克制、护盾与弱点机制仍然有效。') }}</p>
          <div class="growth-grid"><article v-for="item in WEAPON_ORDER" :key="item" :class="{ locked: !armoryFor(progress).includes(item) }"><header><svg viewBox="0 0 64 34" aria-hidden="true" :style="{ color: WEAPONS[item].color }"><path :d="weaponSilhouettes[item]" fill="currentColor" fill-rule="evenodd"/></svg><span>{{ armoryFor(progress).includes(item) ? `LV ${growth.level}` : tr('Locked', '待缴获') }}</span></header><h3>{{ weaponName(item) }}</h3><p>{{ storyText(GROWTH_ROLES[item]) }}</p><dl><div><dt>{{ tr('Damage / pellet', '每发伤害') }}</dt><dd>{{ damageText(item) }} <small>+{{ growthBonus(item) }}%</small></dd></div><div><dt>{{ tr('Rounds / sec', '每秒射击') }}</dt><dd>{{ (1 / upgraded(item).delay).toFixed(1) }}</dd></div><div v-if="item === 'pulse'"><dt>{{ tr('Penetration', '贯穿目标') }}</dt><dd>{{ upgraded(item).pierce }}</dd></div><div v-if="item === 'rocket'"><dt>{{ tr('Blast radius', '爆炸范围') }}</dt><dd>+{{ Math.round((upgraded(item).radius / 140 - 1) * 100) }}%</dd></div><div v-if="item === 'spread'"><dt>{{ tr('Pellets / shot', '每枪弹丸') }}</dt><dd>7</dd></div></dl></article></div>
        </template>
        <template v-else-if="panel === 'trials'"><p class="dialog-note">{{ tr('Clear two waves of Black Tide guards to capture each armory. Seized weapons enter your loadout immediately and remain unlocked.', '击败黑潮军械库的两波守军，缴获对应武器，途中立即到账并永久保留。') }}</p><div class="trial-list"><article v-for="task in missions" :key="task.id" :class="{ done: task.done }"><div><strong>{{ local(task.title) }}</strong><span :style="{ color: WEAPONS[task.reward].color }">{{ weaponName(task.reward) }}</span></div><p>{{ task.done ? tr('Armory captured · Weapon retained', '任务完成 · 武器已保留') : `${tr('Defenders eliminated', '已击败守军')} ${task.total - task.remaining}/${task.total}` }}</p></article></div></template>
        <template v-else-if="panel === 'controls'"><p class="dialog-note">Start game lets you choose a campaign or continue your saved battlefield. Quick start enters the first mission. It saves normally if there is no existing save; otherwise it keeps that save untouched. Regular attempts save automatically every few seconds and when paused or exited; restored games wait at Pause until you resume.</p><button class="text-button tutorial-reset" @click="resetTutorial">{{ tr('Replay contextual tips', '重新显示场景教学') }}</button><p v-if="tutorialReset" class="dialog-note" role="status">{{ tr('Tips will appear as you play. Your mission progress and weapons are kept.','继续游玩时会按场景显示教学，关卡进度与武器保留。') }}</p><div class="controls-grid"><div v-for="control in [{ key: 'A / D', name: tr('Move', '移动') }, { key: 'J', name: tr('Hold to fire', '按住连射') }, { key: 'Space / K', name: tr('Jump', '跳跃') }, { key: 'W / S', name: tr('Aim up / crouch', '上瞄 / 下蹲') }, { key: 'E', name: tr('Interact / operate gun', '抓索 / 滑索 / 爬梯 / 操作机枪') }, { key: 'W / S', name: tr('Climb a ladder', '上下攀爬') }, { key: 'Q', name: tr('Cycle weapons', '循环切换武器') }, { key: '1–6', name: tr('Select weapon', '直接选择武器') }, { key: 'U', name: tr('Operative skill', '角色技能') }, { key: 'L', name: tr('Throw grenade', '投掷手雷') }, { key: 'R', name: tr('Retry / restart', '重试 / 重开') }, { key: 'Esc', name: tr('Pause / resume', '暂停 / 继续') }]" :key="control.key + control.name"><span>{{ control.name }}</span><kbd>{{ control.key }}</kbd></div></div><p class="dialog-note">{{ tr('Shoot barrels to cause chain explosions. Destroy power boxes to cut nearby defenses; shoot alarm beacons before their countdown ends. Press E near a fixed gun, J to fire, A/D to face, E or Space to exit. Let an overheated gun cool down.', '射击油桶可连锁爆破；击毁电箱可关闭附近防御。警报倒计时结束前打掉警报器可阻止增援。靠近固定机枪按 E 操作，J 开火、A/D 转向、E 或空格离开，过热后需停火冷却。') }}</p><button class="text-button" @click="panel = 'growth'">{{ tr('Weapon growth', '查看武器成长') }} · LV {{ growth.level }}</button><h3>{{ tr('Use the battlefield', '利用战场设施') }}</h3><p>{{ tr('Cliff ziplines: press E near the trolley, use A/D to slide, and release automatically at either bank. Space jumps off early. Swing ropes remain available on other crossings.', '跨崖滑索：靠近滑轮按 E 挂索，A/D 沿索滑行，两岸自动下索；空格可提前跳离。其他裂谷仍可使用摆荡绳索。') }}</p><p>{{ tr('Press E at control panels to operate gates, presses, or freight lifts. Moving platforms carry you; shoot billboard supports to create crossings. At dock cranes, press E to operate, A/D to position cargo, then E to drop it. Cargo crushes enemies and becomes a platform. Clear the crew to board armored vehicles: A/D drives, J fires the cannon, and E or Space exits. With aim assist enabled, the turret tracks visible enemies independently of driving direction. At outpost override terminals, press E and hold position for 2.5 seconds; taking damage interrupts the hack. Captured sentries provide 25 seconds of support.', '开关：靠近控制台按 E，切换闸门、冲压机或货梯。移动浮台会带着角色移动；击落广告牌可搭成通路。港口吊机：E 操作，A/D 移动吊箱，再按 E 投放，落箱可砸敌并成为平台。清除守车兵后，E 驾驶装甲车，A/D 移动，J 开炮，E 或空格撤离。开启辅助瞄准时，炮台会独立瞄准可见敌人，不受车身行进方向限制。哨站反控终端：E 开始破解，原地坚持 2.5 秒，受击会中断；成功后炮台提供 25 秒火力支援。') }}</p><p>{{ tr('Shoot pressure pipes to obscure ordinary guards; E closes the valve. Destroy radar to disable local drone fire and alarm reinforcements. E swaps cooling branches A/B with 1.1s relief; destroying the valve stops both. Fuel ignites after a ground warning and burns both sides. Skyway cargo needs a supported landing; falling billboards crush enemies and leave a crossing.', '射击压力管道可遮挡普通守军视线，E 关阀。击毁雷达可停用本区域无人机火力并阻止警报增援。冷却阀按 E 切换 A/B 安全支路，切换有 1.1 秒泄压保护，击毁阀门则双支路停用。储油罐击破后先地面预警，再形成敌我均需避开的燃烧带。高架吊箱只能投放到有支撑的落点；广告牌倒下会砸击下方敌人并留下通路。') }}</p><h3>{{ tr('Commanders and bosses', '区域指挥官与关底首领') }}</h3><p>{{ tr('Each mission has two named section commanders with a dedicated health bar. Watch mortar markers, brace strikes and laser sights; use the reload window to counterattack. Boss attacks also have fixed warning zones. The Sand Scorpion aims at both sides, charges a marked lane and purges sand near its wheels. Jump or move away, then attack its exposed engine during cooling. The final core combines ground pulses, aimed sweeps and staggered strikes; destroy its relays and attack during the cooling window.', '每关中段有两名具名区域指挥官，靠近后显示独立血条。留意迫击落点、盾击与激光瞄准，利用装填空隙反击。关底首领也有明确的预警区域：沙蝎会双向瞄准、沿标记路线冲撞，并在轮组附近排砂震击；跳起或后撤，散热时攻击暴露引擎。最终核心组合使用地面脉冲、瞄准扫射与错时落点；先拆中继，回充时集中输出。') }}</p><h3>{{ tr('Switch weapons', '切换武器') }}</h3><p>{{ tr('Tap Q to cycle through unlocked weapons. Each press selects the next weapon; after the last one, it returns to the first. You can also click Switch weapon at the bottom right, or open the loadout and select a weapon. Number keys 1–6 select a weapon directly; locked weapons cannot be equipped.', '每按一次 Q 切换到下一把已解锁武器，最后一把之后回到第一把。也可点击右下角「切换武器」，或展开装备栏选择。数字键 1–6 可直接选择对应武器，尚未解锁的武器无法装备。') }}</p><p>{{ tr('Capture armories to permanently unlock weapons. If you earn a new weapon during a mission, the results page shows its role, strengths, best targets and number key. Earned weapons remain available after a retry and in later missions.', '攻下军械据点可永久解锁武器。本关获得新武器时，结算页会展示它的定位、特点、适合对付的目标和对应数字键；重试或进入后续关卡仍可使用已获得的武器。') }}</p><h3>{{ tr('Choose the right tool', '选择合适的武器') }}</h3><div class="weapon-guide"><article v-for="item in WEAPON_ORDER" :key="item"><strong :style="{ color: WEAPONS[item].color }">{{ weaponName(item) }}</strong><small>{{ weaponInfo(item).role }}</small><p>{{ weaponInfo(item).description }}</p><span>{{ tr('Best against:', '针对：') }} {{ weaponInfo(item).counter }}</span></article></div><button class="text-button" @click="panel = 'trials'">{{ tr('View armory raids', '查看武器军械据点') }}</button><p class="dialog-note">{{ tr('Clear two waves at captured armories to seize weapons permanently. Supply drops restore health, armor, or grenades. Checkpoints heal 2 health; retrying restores full health.', '途中攻下两波守军保护的军械据点，缴获并永久保留武器。路边补给恢复体力、护甲或手雷。首次到达补给点恢复 2 格体力，死亡重试时恢复满血。') }}</p></template>
        <template v-else><p class="confirm-copy">{{ panel === 'restart' ? 'Restarting replaces the current attempt. Unlocked weapons, research and records are kept.' : tr('Regular attempts are saved when you leave. Quick start keeps any pre-existing save untouched. Unlocked weapons and best scores are kept.', '本次补给点和战斗进度将丢失，已解锁武器与最佳成绩会保留。') }}</p></template>
        </div>
        <footer class="modal-footer">
          <template v-if="panel === 'continue'"><div class="confirm-actions"><button class="menu-secondary" @click="newGame">New game</button><button class="front-primary" @click="continueGame">Continue saved game</button></div></template>
          <template v-else-if="panel === 'operatives'"><button class="menu-secondary" @click="closePanel">{{ mode==='dead'?tr('Back','返回'):tr('Back to missions','返回选关') }}</button><button class="front-primary" :disabled="!operativeCanChange" @click="confirmOperative">{{ mode==='dead'?tr('Retry with this operative','使用此角色重试'):tr('Use this operative','使用此角色') }}<kbd>Enter</kbd></button></template>
          <template v-else-if="panel === 'restart' || panel === 'quit' || panel === 'leave'"><div class="confirm-actions"><button class="menu-secondary" @click="closePanel">{{ tr('Cancel', '取消') }}</button><button class="front-primary" @click="confirmMenuAction">{{ panel === 'restart' ? tr('Restart mission', '重新开始') : panel === 'quit' ? tr('Exit to mission select', '退出并返回选关') : tr('Leave run', '离开闯关') }}</button></div></template>
          <template v-else><span>Esc {{ tr('to close', '关闭') }}</span><button class="front-primary" @click="closePanel">{{ tr('Done', '完成') }}</button></template>
        </footer>
      </section></div>
    </div>
  </section>
</template>

<style scoped>
@font-face{font-family:'Front Arcade';src:url('/iron-front/fonts/Bungee-Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
@font-face{font-family:'Front Tactical';src:url('/iron-front/fonts/RussoOne-Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
@font-face{font-family:'Front Brief';src:url('/iron-front/fonts/ChakraPetch-Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
@font-face{font-family:'Front Play';src:url('/iron-front/fonts/ZCOOLKuaiLe-Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
/* Typography: display 72/52, menu heading 30/24, section 20/18, body 16, secondary 14. */
.front-page{--front-display:72px;--front-heading:30px;--front-section:20px;--front-body:16px;--front-caption:14px;--front-weight:600;--front-art-font:'Front Tactical',Arial,sans-serif;--front-action:18px;--ink:#edf3ed;--muted:#a2b6bf;--line:#9ab7c52b;--accent:#efbd72;--mint:#91d8ca;position:relative;isolation:isolate;height:min(800px,calc(100svh - 140px));min-height:620px;width:100%;overflow:hidden;border:1px solid #425c6e;border-radius:16px;background:#071b2b;color:var(--ink);font:400 var(--front-body)/1.55 Inter,Arial,sans-serif;color-scheme:dark;box-shadow:0 20px 60px #07142020}
.front-page.is-fullscreen{height:100svh;min-height:0;max-width:none;border:0;border-radius:0}
.front-page *{box-sizing:border-box}button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .15s,border-color .15s;color:inherit}button:disabled{cursor:default;opacity:.45}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid var(--mint);outline-offset:3px}button svg{width:20px;height:20px}kbd{font:500 12px/1.3 ui-monospace,monospace;border:1px solid currentColor;border-radius:4px;padding:3px 6px;opacity:.7;white-space:nowrap}h1,h2,h3,p{margin:0}h2{font-size:var(--front-heading);font-weight:700;line-height:1.15}h3{font-size:var(--front-section);line-height:1.3;font-weight:600}.eyebrow{font-size:var(--front-caption);font-weight:600;line-height:1.4;letter-spacing:.13em;color:var(--accent)}
.front-machine,.front-arena{position:absolute;inset:0}.front-arena{outline:none}.front-arena:focus-visible{box-shadow:inset 0 0 0 2px var(--mint)}.front-canvas{display:block;width:100%;height:100%}.screen-top{position:absolute;inset:0 0 auto;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:20px 28px;background:linear-gradient(#061524cf,transparent)}.screen-brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.1em;font-size:var(--front-caption);line-height:1.2}.brand-emblem{display:grid;place-items:center;width:34px;height:38px;clip-path:polygon(0 0,100% 0,100% 80%,50% 100%,0 80%);background:var(--accent);color:#1e2a33;font-size:18px;letter-spacing:-1px}.screen-brand small{display:block;font-size:11px;font-weight:400;letter-spacing:.17em;margin-top:5px;color:#a9bfc4}.screen-tools{display:flex;gap:7px}.screen-tools button{display:flex;align-items:center;justify-content:center;gap:8px;background:#102536d9;border:1px solid #9ab7c538;min-height:42px;padding:8px 12px;border-radius:7px;font-size:var(--front-caption);color:#b1c2c7}.screen-tools button:hover{background:#254457}.screen-tools svg circle{fill:#102536;stroke:currentColor;stroke-width:1.8}.screen-tools .active{color:#f0e2c5;font-weight:700}.divider{opacity:.45}.menu-feedback{position:absolute;top:76px;right:28px;z-index:55;padding:8px 12px;background:#294052;font-size:var(--front-caption)}
.title-screen{position:absolute;inset:0;display:flex;align-items:center;padding:70px 6%;background:linear-gradient(90deg,#071927ed,#0b2134a6 45%,transparent 90%)}.title-copy{position:relative;z-index:2;max-width:65%}.title-copy h1{margin:18px 0 20px;font:900 var(--front-display)/.86 Impact,'Arial Black',sans-serif;font-size:clamp(64px,8vw,118px);letter-spacing:.025em;transform:skew(-5deg);text-shadow:0 3px 0 #294154,0 8px 25px #0007;color:#eff0df}.title-copy h1>span{display:inline;text-shadow:none;filter:drop-shadow(0 5px 0 #624e36);background:linear-gradient(#ffe0a0,#e7a84e);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}.title-copy .title-subtitle{display:block;margin-top:16px;font:600 var(--front-caption)/1.4 Arial,sans-serif;letter-spacing:.55em;color:#b8c7c9;text-shadow:none;transform:skew(5deg)}.title-description{color:#c4d1cf;font-size:var(--front-section);line-height:1.5;max-width:360px}.title-actions{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 24px}.front-primary,.menu-secondary{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:48px;padding:13px 22px;border-radius:7px;font-size:var(--front-body);font-weight:600;text-align:center}.front-primary{color:#172633;background:linear-gradient(#f6cc8d,#e4aa5d);border:1px solid #ffe4b9;box-shadow:0 4px 0 #926437,0 9px 25px #0003}.front-primary:hover{background:#ffdb9f}.front-primary kbd{color:#263643;border-color:#886b42}.menu-secondary{background:#153044b3;border:1px solid #809aa45e;color:#d7e1da;box-shadow:0 3px 0 #071724}.menu-secondary:hover{background:#2a4659}.title-facts{display:flex;flex-wrap:wrap;gap:8px 18px;color:#a6bbc1;font-size:var(--front-caption)}.title-facts span+span{border-left:1px solid #7b9ba455;padding-left:18px}.title-bottom{position:absolute;bottom:25px;left:6%;right:6%;display:flex;justify-content:space-between;gap:15px;color:#829ba9;font-size:12px;letter-spacing:.05em}
.mission-screen{position:absolute;inset:0;overflow:auto;padding:95px 28px 24px;background:linear-gradient(110deg,#081a29f5,#0d2336e8)}.menu-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.menu-heading h2{margin-top:7px}.menu-heading .menu-secondary{min-height:38px;padding:8px 16px;font-size:var(--front-caption)}.mission-layout{display:grid;grid-template-columns:minmax(0,1fr) 312px;gap:24px}.zone-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-content:start}.zone-grid>button{padding:0;text-align:left;overflow:hidden;min-width:0;border-radius:8px;border:1px solid #54708260;background:#132a3c;box-shadow:0 5px 0 #041522}.zone-grid>button:hover:enabled{background:#1d3c51;border-color:#a3b7ba}.zone-grid>button.current{border-color:var(--accent);box-shadow:0 0 0 1px #efbd7230,0 5px 0 #041522}.zone-grid>button:disabled{opacity:.45;filter:saturate(.3)}.zone-art{position:relative;height:76px;overflow:hidden;background:linear-gradient(140deg,#336979,#0e2c41)}.zone-art img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center 55%}.zone-art>span{position:absolute;top:9px;right:8px;font-size:10px;letter-spacing:.07em;background:#061b2abe;color:#c8d8d1;padding:2px 5px;border-radius:3px}.zone-1{background:linear-gradient(140deg,#9c634a,#3c2c42)}.zone-2{background:linear-gradient(140deg,#5c84b4,#223b5b)}.zone-3{background:linear-gradient(140deg,#587b66,#233f42)}.zone-4{background:linear-gradient(140deg,#836b9f,#382b55)}.zone-5{background:linear-gradient(140deg,#438e92,#10394a)}.zone-card-copy{padding:12px}.zone-card-copy small{display:block;font-size:11px;font-weight:600;letter-spacing:.07em;color:#c8af82}.zone-card-copy strong{display:block;font-size:var(--front-body);font-weight:600;line-height:1.3;margin:5px 0 7px;color:#dfebe4}.zone-card-copy>span{display:block;color:#9db5c0;font-size:12px;line-height:1.4}.mission-brief{padding-left:22px;border-left:1px solid var(--line)}.mission-brief h3{margin:10px 0}.mission-brief>p:not(.eyebrow){font-size:var(--front-caption);line-height:1.6;color:#b3c4ca}.brief-meta{margin:19px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px 0}.brief-meta>span{display:flex;justify-content:space-between;gap:15px;padding:5px 0;font-size:var(--front-caption);color:#99b1bd}.brief-meta b{color:#dfe7dc;font-weight:600}.mission-brief .front-primary{width:100%;margin-top:22px}.text-button{border:0;padding:8px 4px;background:transparent;color:#bed6cf;font-size:var(--front-caption)}.mission-brief>.text-button{display:block;width:100%;margin:10px 0}.preview-options{font-size:12px;color:#9ab0bc;border-top:1px solid var(--line);padding-top:12px}.preview-options summary{cursor:pointer}.preview-options button{display:block;border:0;background:none;padding:7px 0;color:#bed6cf;font-size:12px}.save-note{font-size:12px;line-height:1.5;color:#829da9;margin-top:20px;max-width:800px}
.battle-hud{position:absolute;top:85px;left:24px;right:24px;display:flex;gap:18px;align-items:center;pointer-events:none;text-shadow:0 2px 4px #071523}.battle-hud>div:first-child{margin-right:auto}.battle-hud small{display:block;font-size:12px;color:#bfd2d4;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.battle-hud strong{font-size:var(--front-section);font-weight:700}.health{display:flex;gap:4px;align-items:center}.health i{height:19px;width:10px;border-radius:2px;background:#293e4e}.health i.filled{background:#9adbc4;box-shadow:0 0 10px #82e6c522}.health span{margin-left:7px;font-size:var(--front-caption)}.battle-score{text-align:right}.battle-score>span{display:block;font-size:var(--front-caption);color:#bed1d3;font-variant-numeric:tabular-nums}.traversal-hint{position:absolute;top:195px;left:24px;max-width:calc(100% - 48px);padding:8px 12px;color:#d0e4d8;background:#183545e8;border:1px solid #8abbb547;border-radius:5px;font-size:var(--front-caption);pointer-events:none}.counter-hint{position:absolute;right:24px;bottom:145px;display:flex;flex-direction:column;gap:3px;max-width:calc(100% - 48px);padding:9px 12px;background:#102a3dec;border:1px solid currentColor;border-radius:5px;font-size:var(--front-caption);pointer-events:none}.counter-hint strong{font-weight:600}.boss-bar{position:absolute;top:195px;left:30%;right:30%;pointer-events:none}.boss-bar>div{display:flex;justify-content:space-between;gap:10px;color:#f1c796;font-size:var(--front-caption)}.boss-bar>span{display:block;height:6px;margin-top:4px;background:#1f3443;border:1px solid #dca47c70;border-radius:4px;overflow:hidden}.boss-bar i{display:block;height:100%;background:#d89c7c}.field-notice{position:absolute;bottom:148px;left:50%;transform:translateX(-50%);padding:9px 14px;background:#1c3c4df2;border:1px solid #9cc0b23d;border-radius:6px;max-width:calc(100% - 30px);width:max-content;color:#e2e4cf;font-size:var(--front-caption);pointer-events:none}
.equipment-bar{position:absolute;bottom:0;left:0;right:0;padding:16px 24px 10px;background:linear-gradient(transparent,#071a2bed 25%);pointer-events:none}.weapon-slots{display:flex;justify-content:center;gap:6px;pointer-events:auto}.weapon-slots button{position:relative;display:flex;flex-direction:column;align-items:center;min-width:0;width:115px;padding:8px 8px 5px;border:1px solid #9cbaca35;border-radius:5px;background:#112a3dce;font-size:11px}.weapon-slots button.active{border-color:var(--accent);background:#51432d8c}.weapon-slots button:disabled{opacity:.4}.weapon-slots svg{height:24px;width:54px;margin:0 7px 4px}.weapon-slots kbd{position:absolute;top:3px;left:3px;padding:0 3px;font-size:10px;border:0}.weapon-slots button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.tactical-slots{display:flex;justify-content:center;align-items:center;gap:22px;margin:8px 0 4px;font-size:12px;color:#adc3c9;pointer-events:auto}.tactical-slots button{background:none;color:inherit;border:0;font-size:12px;padding:0}.tactical-slots kbd{margin-left:8px;font-size:10px;padding:1px 4px}.route-bar{height:2px;background:#7ba6ad26;max-width:700px;margin:9px auto 0}.route-bar>span{display:block;height:100%;background:#dbb372}
.pause-scrim,.modal-scrim{position:absolute;inset:0;z-index:40;display:grid;place-items:center;padding:24px;background:#051321be;backdrop-filter:blur(5px)}.pause-card{width:min(100%,440px);padding:32px;background:linear-gradient(140deg,#203b50f5,#102637f5);border:1px solid #77949f70;border-radius:12px;box-shadow:0 20px 60px #0007}.pause-card h2{font-size:40px;letter-spacing:.02em;margin:10px 0}.pause-card>p:not(.eyebrow){font-size:var(--front-body);color:#b3c8cc}.pause-summary{display:flex;justify-content:space-between;gap:12px;padding:19px 0;margin:8px 0 21px;border-bottom:1px solid var(--line)}.pause-summary span{font-size:12px;color:#9cb5c1}.pause-summary b{display:block;font-size:20px;font-weight:600;color:#e3eadf;font-variant-numeric:tabular-nums;margin-top:3px}.pause-card>.front-primary{width:100%;justify-content:space-between}.pause-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:17px 0}.pause-options button{padding:10px 8px;min-height:42px;border:1px solid var(--line);border-radius:5px;background:#142d40;font-size:var(--front-caption);color:#c7d7d3}.pause-options .pause-exit{grid-column:1 / -1}.pause-options button:hover{background:#2a4659}.pause-card>small{font-size:12px;color:#9bb3be}
.modal-scrim{z-index:60;backdrop-filter:blur(7px)}.modal-panel{outline:none;width:min(100%,620px);max-height:100%;overflow:auto;padding:27px;background:linear-gradient(140deg,#20394d,#102637);border:1px solid #849caa6b;border-radius:12px;box-shadow:0 30px 70px #0008}.modal-panel>header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:25px}.modal-panel h2{margin-top:5px}.close-button{display:grid;place-items:center;min-width:40px;min-height:40px;font-size:28px;color:#c9d9d6;background:#0f293c;border:1px solid var(--line);border-radius:5px}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:15px 0;border-top:1px solid var(--line)}.settings-row strong{display:block;font-size:var(--front-body);font-weight:600}.settings-row small{display:block;font-size:12px;color:#a7bdc7;margin-top:3px;line-height:1.5}.settings-row button{min-width:72px;padding:9px 12px;border:1px solid #68829080;border-radius:5px;font-size:var(--front-caption);background:#112739;color:#bfd0d4}.settings-row button.enabled{border-color:#9cceb88c;background:#669c8133;color:#bde7ce}.volume-row input{width:45%;accent-color:#e9b870;cursor:pointer}.dialog-note{margin:20px 0;font-size:var(--front-caption);color:#a2bac3;line-height:1.65}.modal-panel>footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:25px;border-top:1px solid var(--line);padding-top:18px}.modal-panel>footer>span{font-size:12px;color:#9db5c1}.modal-panel>footer .front-primary{min-height:40px;padding:9px 25px}.confirm-copy{font-size:var(--front-body);color:#c1d2d5;line-height:1.7}.confirm-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:28px}.controls-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 22px}.controls-grid>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:var(--front-caption);color:#c4d5d8}.controls-grid kbd{font-size:11px}.weapon-guide{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:17px}.weapon-guide article{padding:13px;border:1px solid var(--line);border-radius:6px;background:#132c3e}.weapon-guide strong{font-size:var(--front-body);font-weight:600}.weapon-guide small{display:block;font-size:12px;color:#adbdc7;margin-top:2px}.weapon-guide p{font-size:var(--front-caption);color:#bdced0;margin:9px 0;line-height:1.6}.weapon-guide span{font-size:12px;color:#8faebc}
.result-page{position:absolute;inset:0;overflow:auto;padding:96px 35px 32px;background:linear-gradient(115deg,#142e43f7,#071c2cf2);outline:none}.result-heading{text-align:center}.result-heading h2{margin:10px 0 5px}.result-heading>p:last-child{color:#a0bbc7;font-size:var(--front-caption)}.result-main{display:flex;justify-content:center;align-items:center;gap:36px;margin:26px 0}.result-rank{display:flex;flex-direction:column;justify-content:center;align-items:center;width:115px;height:115px;border:1px solid #a7cdba70;border-radius:16px;color:#b8e4d1;background:#618a7b14}.result-rank strong{font-size:64px;line-height:1.05;font-weight:800}.result-rank small,.result-rank span{font-size:11px;letter-spacing:.08em}.rank-s{color:#f4ce8d;border-color:#e4ba6f}.result-score{display:flex;flex-direction:column;gap:4px}.result-score small{font-size:var(--front-caption);color:#9db7c0}.result-score strong{font-size:40px;font-weight:700;line-height:1.3}.result-score span{font-size:12px;color:var(--accent)}.result-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:840px;margin:auto}.result-stats>div{padding:12px 15px;border:1px solid var(--line);border-radius:6px;background:#1a344640}.result-stats small{display:block;font-size:12px;color:#a1bdc6}.result-stats strong{display:block;margin-top:4px;font-size:var(--front-section);font-weight:600;font-variant-numeric:tabular-nums}.result-kit{display:flex;justify-content:center;flex-wrap:wrap;gap:6px 12px;margin:22px 0 12px;font-size:12px}.result-kit span:first-child{color:#9bb6c2}.result-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:23px}.result-note{font-size:var(--front-caption);color:#9ebac4;text-align:center}.victory-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:105px 24px 25px;text-align:center;pointer-events:none}.victory-overlay h2{font-size:var(--front-heading);margin:9px 0}.victory-overlay>div>p:last-child{font-size:var(--front-caption);color:#b2cbd1}.victory-actions{display:flex;gap:12px;pointer-events:auto}.transit-overlay{position:absolute;inset:0;z-index:35;display:flex;flex-direction:column;justify-content:space-between;padding:95px 30px 25px;background:#0c2435ed}.transit-overlay>header{display:flex;justify-content:space-between;gap:15px;color:#a6bec8;font-size:var(--front-caption)}.transit-content{text-align:center}.transit-content h2{margin:12px 0}.transit-content>p:not(.eyebrow){max-width:560px;margin:10px auto;color:#c2d0d1;font-size:var(--front-body);line-height:1.7}.transit-map{display:block;width:min(100%,680px);max-height:165px;margin:auto}.transit-content>.transit-loadout{font-size:var(--front-caption)!important;color:#92b1be!important}.transit-progress{height:3px;background:#6c8c9940;margin-bottom:15px}.transit-progress>span{display:block;height:100%;background:var(--accent)}.transit-overlay>footer>div:last-child{display:flex;align-items:center;justify-content:flex-end;gap:12px;font-size:var(--front-caption);color:#a7bfca}.transit-overlay>footer>div:last-child>span{margin-right:auto}.transit-overlay .menu-secondary{min-height:38px;padding:9px 15px;font-size:var(--front-caption)}
@media(max-width:900px){.front-page{--front-heading:26px;--front-section:18px}.screen-top{padding:17px 20px}.mission-screen{padding:90px 20px 20px}.mission-layout{grid-template-columns:minmax(0,1fr) 264px;gap:17px}.mission-brief{padding-left:17px}.zone-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.zone-art{height:65px}.title-description{font-size:18px}.title-copy h1{font-size:88px}.title-facts{max-width:320px}.title-facts span+span{padding-left:0;border:0}.tool-label{display:none}.screen-tools button{min-width:40px;padding:8px}.mission-screen .save-note{max-width:550px}}
@media(prefers-reduced-motion:reduce){button{transition:none}.modal-scrim,.pause-scrim{backdrop-filter:none}}

.trial-progress{pointer-events:auto;background:#102a3dd9;border:1px solid #9fbeb340;border-radius:4px;color:#c4dcd4;font-size:12px;padding:4px 8px}.trial-list{display:grid;gap:10px}.trial-list article{border:1px solid var(--line);padding:14px;border-radius:6px}.trial-list article.done{border-color:#86b9a26b}.trial-list article>div{display:flex;justify-content:space-between;gap:15px;font-size:var(--front-caption)}.trial-list article p{font-size:12px;color:#9bb9c2;margin-top:6px}.result-rewards{text-align:center;max-width:840px;margin:20px auto;font-size:var(--front-caption);color:#a4bfca}.result-rewards span{display:inline-block;padding:7px 10px;background:#21394b;margin:10px 5px 0;border-radius:4px}.result-rewards h3{font-size:var(--front-section);margin:12px 0;color:var(--accent)}.reward-weapons{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;margin-top:15px;text-align:left}.reward-weapons article{padding:18px;border:1px solid #d9b27566;border-radius:8px;background:#1b3547}.reward-weapons header{display:flex;align-items:center;gap:16px}.reward-weapons svg{width:72px;height:42px;flex-shrink:0}.reward-weapons h4{font-size:var(--front-body);margin:0 0 5px}.reward-weapons small{font-size:var(--front-caption);color:#aec5cc}.reward-weapons p,.reward-switch-help{font-size:var(--front-caption);line-height:1.8;color:#b8cdd3;margin-top:12px}.reward-equip{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:var(--front-caption);color:#e5c58f}.equipment-tools{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-bottom:8px}.equipment-tools .equipment-toggle{margin:0}.equipment-bar.collapsed .equipment-tools{margin-bottom:0}.weapon-cycle{display:flex;align-items:center;gap:10px;min-height:42px;padding:9px 13px;border:1px solid #c5a87680;border-radius:6px;background:#163346ed;color:var(--accent);font-size:var(--front-caption);pointer-events:auto}.weapon-cycle:disabled{opacity:.45;cursor:default}.weapon-cycle kbd{font-size:11px}

.result-rewards>p:not(.eyebrow){margin-top:10px}
/* 标题与按钮沿用本地艺术字，正文单独使用较细的字体。 */
.front-page:lang(zh-CN){--front-art-font:'Front Play','Front Arcade',sans-serif;--front-action:21px}
.title-copy h1{font-family:'Front Arcade','Front Play',sans-serif;font-weight:400;font-size:clamp(60px,7vw,104px);line-height:.99;letter-spacing:.015em;transform:skew(-3deg)}
.title-copy .title-subtitle{font-family:'Front Play',sans-serif;font-size:18px;letter-spacing:.35em;transform:skew(3deg)}
.menu-heading h2,.pause-card h2,.modal-panel h2,.result-heading h2,.victory-overlay h2,.transit-content h2{font-family:var(--front-art-font);font-weight:400;line-height:1.25;text-transform:none;letter-spacing:.025em;text-shadow:0 3px 0 #061723}
.front-primary,.menu-secondary,.pause-options button{font-family:var(--front-art-font);font-weight:400;font-synthesis:none;line-height:1.35;text-transform:none;letter-spacing:.025em}
.front-primary{font-size:var(--front-action);color:#111;-webkit-text-stroke:0;text-shadow:none;border-radius:12px;border-width:2px;box-shadow:inset 0 2px 0 #fff1cd99,0 5px 0 #80562f,0 10px 20px #0004}
.front-primary:active{transform:translateY(2px);box-shadow:inset 0 2px 0 #fff1cd77,0 3px 0 #80562f}
.front-primary kbd{font:500 11px/1.3 ui-monospace,monospace;text-transform:none;letter-spacing:0;-webkit-text-stroke:0;text-shadow:none;color:#523c26;flex-shrink:0}
.menu-secondary,.pause-options button{color:#eef1dc;font-size:15px;text-shadow:0 2px 0 #081a29;border-radius:9px}
.pause-options button{font-size:13px;padding:12px 8px}
.front-page:lang(zh-CN) .menu-secondary,.front-page:lang(zh-CN) .pause-options button{font-size:19px}
.screen-brand>span:last-child{font-family:'Front Arcade',sans-serif;font-weight:400;font-size:13px;letter-spacing:.025em}
.screen-brand small{font-family:'Front Play',sans-serif;font-size:12px}
@media(max-width:900px){.title-copy h1{font-size:82px}.front-page{--front-action:17px}}
.screen-tools button{width:44px;height:44px;min-width:44px;min-height:44px;padding:10px;flex-shrink:0}
.screen-tools button>svg,.screen-tools button>.front-ui-icon{width:21px;height:21px;font-size:21px}
/* 覆盖各组件的 font 简写，说明、快捷键、表单和 SVG 文案一并统一。 */
.front-page{font-family:var(--front-art-font);font-synthesis:none}
.front-page :where(h1,h2,h3,p,span,small,strong,b,button,input,select,option,label,summary,kbd,text,article,footer){font-family:var(--front-art-font)!important;font-synthesis:none}
.front-page h1,.front-page h1>span,.screen-brand .brand-emblem,.screen-brand>span:last-child{font-family:'Front Arcade','Front Play',sans-serif!important}
.front-page:lang(en) :is(.front-primary,.menu-secondary,.pause-options button){font-weight:400}.front-page:lang(en) :is(h2,h3){font-weight:400;text-shadow:none}.front-page:lang(en) .eyebrow{letter-spacing:.04em}.front-page:lang(en) :is(.screen-brand small,.title-copy .title-subtitle){letter-spacing:.08em}
/* 中英文正文使用较细笔画；标题与按钮保留各自的艺术字体。 */
.front-page:lang(en){--front-copy-font:'Front Brief',Arial,sans-serif}
.front-page:lang(zh-CN){--front-copy-font:'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','Noto Sans SC',sans-serif}
.front-page :is(p:not(.eyebrow),p:not(.eyebrow) *, .title-facts span,.title-bottom,.title-bottom *,.settings-row small,.weapon-guide small,.weapon-guide article>span,.zone-card-copy>span,.campaign-copy>span){font-family:var(--front-copy-font)!important;font-weight:400}
.title-description,.mission-brief>p:not(.eyebrow),.dialog-note,.weapon-guide p,.confirm-copy{line-height:1.8}
.controls-grid>div,.settings-row{column-gap:16px}
.battle-hud>div:first-child{min-width:0}.health{flex-shrink:0}
.equipment-bar.collapsed{padding:10px 14px;background:none}
.equipment-toggle{display:flex;align-items:center;justify-content:center;gap:9px;min-height:42px;min-width:48px;padding:8px 10px;margin:0 0 8px auto;background:#10293ce0;border:1px solid #a5bec64d;border-radius:7px;color:#d5e1d9;font-size:12px;pointer-events:auto}
.equipment-toggle svg{width:31px;height:20px}.equipment-bar.collapsed .equipment-toggle{margin-bottom:0}
/* 导航与滚动内容各占独立区域，卡片不会再滚到导航文字下面。 */
.front-page{--front-nav-height:84px}
.screen-top{height:var(--front-nav-height);background:#0b1c2c;border-bottom:1px solid #6a87984d;box-shadow:0 5px 18px #04111d45}
.mission-screen{top:var(--front-nav-height);padding-top:24px}
.zone-grid>button:disabled{filter:grayscale(1);opacity:.5;background:#222e38;border-color:#65717b55;box-shadow:none}
.zone-grid>button:disabled .zone-art{background:linear-gradient(140deg,#59616a,#2a333d)}

.story-premise{font-size:14px;line-height:1.9;color:#cfdbd7;margin-bottom:24px}.story-goals{display:grid;gap:10px}.story-goals article{padding:14px;border:1px solid var(--line);border-radius:6px}.story-goals article.done{border-color:#8bbfa080;background:#70967c10}.story-goals strong{font-size:13px;font-weight:400;color:#e7c184}.story-goals p{font-size:12px;color:#b1c8cc;line-height:1.8;margin-top:7px}.story-outcome{max-width:840px;margin:20px auto;padding:16px;border:1px solid #c3a3723d;background:#27415040;border-radius:8px}.story-outcome>p:not(.eyebrow){font-size:14px;line-height:1.8;margin:8px 0;color:#ccded8}.story-outcome small{font-size:12px;color:#cbb080}.journey-scene{display:block;width:min(100%,620px);height:100px;margin:10px auto}.transit-map{max-height:105px}.transit-content>p:not(.eyebrow){font-size:14px;line-height:1.6}.transit-content h2{font-size:26px}.victory-overlay>div:first-child>p:last-child{max-width:630px;line-height:1.7;margin:0 auto}
@media(min-width:601px){.traversal-hint{left:auto;right:24px;top:191px;max-width:350px}}
.title-screen{top:var(--front-nav-height);padding:24px 6% 65px}
.title-copy h1{margin:12px 0 20px;font-size:clamp(60px,6.8vw,104px);white-space:nowrap;line-height:1.05}
.title-description{max-width:470px;font-size:16px}
.title-actions{margin:22px 0 18px}.title-facts{font-size:12px}
.boss-warning{position:absolute;top:39%;left:50%;transform:translateX(-50%);width:500px;max-width:calc(100% - 40px);padding:16px 22px;text-align:center;background:linear-gradient(110deg,#34251af5,#162b3bf5);border:1px solid #e0a46c;border-left:5px solid #e0a46c;border-radius:6px;pointer-events:none;box-shadow:0 8px 30px #0004}.boss-warning small{display:block;color:#efb67e;font-size:var(--front-caption);letter-spacing:.08em}.boss-warning strong{display:block;margin:8px 0;color:#fff0cd;font-size:var(--front-section)}.boss-warning>span{font-size:var(--front-caption);color:#c4d1ce}.boss-bar>small{display:block;margin-top:5px;color:#d7c6a9;font-size:var(--front-caption);text-shadow:0 1px 3px #061728}.boss-bar{left:24%;right:24%}.boss-bar>div{align-items:flex-end}.boss-bar strong{line-height:1.3}.boss-bar>div>span{white-space:nowrap}
/* 战斗界面只保留生命、得分与必要的临时提示。 */
.battle-hud{justify-content:flex-end}.battle-hud>.health:first-child{margin-left:auto;margin-right:0}
.campaign-progress{position:absolute;top:0;left:0;right:0;height:3px;background:#193346;z-index:32;pointer-events:none;overflow:hidden}.campaign-progress i{display:block;height:100%;background:linear-gradient(90deg,#74cfc0,#efbd72);box-shadow:0 0 8px #a0e1cb66;transition:width .15s linear}
.current-mission{margin-bottom:24px;padding:16px 18px;background:#142e40;border:1px solid #c9aa7259;border-radius:7px}.current-mission small{display:block;color:#d9b983;font-size:var(--front-caption)}.current-mission strong{display:block;margin:8px 0;font-size:var(--front-section);font-weight:400}.current-mission p{font-size:var(--front-caption);color:#afc4c9;margin-top:5px}.current-mission .text-button{margin-top:7px}

.screen-tools .mission-entry{width:auto;min-width:88px;padding:8px 14px;font-size:var(--front-caption)}
.front-page.is-immersive{position:fixed;inset:0;width:100%;height:100dvh;min-height:0;max-width:none;border:0;border-radius:0;z-index:2000}
@media(prefers-reduced-motion:reduce){.campaign-progress i{transition:none}}
.dungeon-rule{margin:12px 0;padding:10px 12px;background:#263d4899;border-left:2px solid #c2b084;color:#cfddd5}.dungeon-rule-card{margin-bottom:24px;padding:14px;border:1px solid #aabec13b;border-radius:6px}.dungeon-rule-card p{font-size:var(--front-caption);line-height:1.8;color:#b8cbd0;margin-top:8px}
.audio-actions{display:flex;gap:8px;align-items:center}.audio-actions button{font-size:12px;white-space:nowrap}
.growth-entry{display:flex;align-items:center;flex-wrap:wrap;gap:10px;width:100%;padding:12px 14px;margin:14px 0;border:1px solid #e9bb7360;border-radius:6px;background:#243b45;color:var(--accent);font-size:var(--front-caption)}.growth-entry small{margin-left:auto;color:#a9c4cc;font-size:12px}.loadout-level{font-size:11px;color:var(--accent);white-space:nowrap}.weapon-slots button>small{font-size:10px;margin-top:3px;color:var(--accent)}.growth-summary{display:flex;align-items:center;gap:24px;margin:20px 0 12px}.growth-summary h3{font-size:var(--front-heading);margin:3px 0;color:var(--accent);white-space:nowrap}.growth-summary h3 small{font-size:var(--front-caption);color:#829faa}.growth-summary>div:last-child>strong{font-size:var(--front-body)}.growth-summary p:not(.eyebrow){font-size:var(--front-caption);color:#a4bec8;line-height:1.6;margin-top:6px}.growth-meter{height:5px;border-radius:3px;background:#304b5b;overflow:hidden}.growth-meter i{display:block;height:100%;background:linear-gradient(90deg,#8ad0b8,#e8c27c)}.growth-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.growth-grid article{padding:16px;border:1px solid #7898aa50;border-radius:7px;background:#122d40}.growth-grid article.locked{opacity:.6}.growth-grid header{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--accent)}.growth-grid svg{width:72px;height:38px}.growth-grid h3{font-size:var(--front-body);margin:10px 0 6px}.growth-grid p,.growth-grid dl{font-size:var(--front-caption);color:#a5c0c8}.growth-grid dl>div{display:flex;justify-content:space-between;gap:8px;margin-top:8px}.growth-grid dd{margin:0;color:#e6eee3}.growth-grid dd small{color:#8ad0b8;font-size:11px}
.music-start{display:flex;align-items:center;gap:12px;margin:12px 0;color:#b2c6cc;font-size:var(--front-caption)}.music-start .menu-secondary{display:flex;align-items:center;gap:8px;padding:9px 14px;min-height:38px;font-size:var(--front-caption);border-color:#e8c27c80;color:var(--accent)}
.mission-screen{top:var(--front-nav-height);display:flex;flex-direction:column;overflow:hidden;padding:22px 28px 16px;min-height:0}.mission-screen>.menu-heading{flex:none;margin-bottom:18px}.mission-layout{flex:1;min-height:0;align-items:stretch}.mission-choices{display:flex;flex-direction:column;min-height:0;min-width:0;gap:16px}.mission-choices .zone-grid{flex:1;min-height:0;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));align-content:stretch}.mission-choices .zone-grid>button{display:flex;flex-direction:column;min-height:0}.mission-choices .zone-art{height:auto;min-height:24px;flex:1;width:100%}.mission-choices .zone-card-copy{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:4px 8px;flex:none;width:100%;padding:8px 12px}.mission-choices .zone-card-copy strong{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:var(--front-caption);margin:0}.mission-choices .zone-card-copy small{font-size:10px}.mission-choices .zone-card-copy>span{grid-column:1/-1;min-width:0;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mission-brief{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;scrollbar-width:thin;scrollbar-color:#628394 #112c3e;padding-right:12px;padding-bottom:12px;outline-offset:-2px}.deploy-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex:none;padding:14px 16px;border:1px solid #e8c27c50;border-radius:8px;background:#1b3545}.deploy-row>span{min-width:0}.deploy-row small{display:block;font-size:11px;letter-spacing:.06em;color:#b8a37e}.deploy-row strong{display:block;font-size:var(--front-body);margin-top:5px;color:#e5ece3;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.deploy-row .front-primary{min-width:220px;min-height:54px;padding:12px 22px;font-size:var(--front-action);flex-shrink:0}.mission-screen>.save-note{flex:none;margin-top:12px;font-size:11px;max-width:none}
.sound-preview{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.sound-preview button{font-size:12px;padding:7px 10px;border:1px solid var(--line);border-radius:5px;background:#1a3547;color:#d4dfd9}.sound-preview button:disabled{opacity:.4}
.radio-message{position:absolute;top:calc(var(--front-nav-height) + 12px);left:20px;width:min(560px,calc(100% - 420px));height:32px;display:flex;align-items:center;gap:10px;padding:5px 9px;border-left:2px solid #86bfb5;border-radius:4px;background:#0a2436d9;color:#c9dddb;z-index:3;pointer-events:none}.radio-message small{flex:none;font-size:10px;color:#86bfb5}.radio-message p{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:1.4;margin:0}.radio-message button{flex:none;padding:0 3px;border:0;background:none;color:#bed8d4;font-size:18px;line-height:1;pointer-events:auto}

/* Shared HUD type scale: captions 10px, values 12px, boss title 13px. */
.health{--vital:#9bcbb7;gap:9px;padding:8px 11px;background:linear-gradient(135deg,#173140ed,#0b2130e8);border:1px solid #7a9a9a66;border-radius:5px;box-shadow:inset 0 1px #c1d1bb12,0 3px 10px #06152140;min-width:182px}
.health .health-mark{display:grid;place-items:center;width:22px;height:26px;margin:0;border:1px solid #a7cbb65c;border-radius:3px;color:var(--vital);font:700 20px/1 sans-serif;clip-path:polygon(0 0,100% 0,100% 76%,50% 100%,0 76%)}
.health-content{flex:1}.health-caption{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;gap:20px}.health-caption small{font-size:10px!important;line-height:1;letter-spacing:.12em;color:#9dbbb9}.health-caption>span{margin:0;font-size:12px;line-height:1;color:#e3edda;font-variant-numeric:tabular-nums}.health-caption b{font-weight:400;color:#829e9f;margin-left:2px}
.health-cells{display:flex;gap:3px}.health-cells i{flex:1;width:12px;height:8px;border:1px solid #536f745c;border-radius:1px;transform:skewX(-12deg);background:#071b28;box-shadow:inset 0 1px 2px #0005;transition:background .12s}.health-cells i.filled{background:linear-gradient(#c4dfc3,var(--vital) 45%,#598d83);border-color:#b6d3bb8c;box-shadow:inset 0 1px #e5efd58c,0 0 6px #93cdb316}
.health.health-low{--vital:#d4917b;border-color:#c58d746b}.health-low .health-cells i.filled{background:linear-gradient(#f0c49c,#d4917b 45%,#8f554f);border-color:#e7ac8a8c}.health-low .health-caption>span{color:#edb598}
.boss-bar{left:50%;right:auto;transform:translateX(-50%);width:min(490px,52%);top:calc(var(--front-nav-height) + 72px);padding:9px 12px 7px;background:linear-gradient(110deg,#1e303bea,#102633e6);border:1px solid #a88d685c;border-top-color:#d4b68291;border-radius:4px;box-shadow:inset 0 1px #e2ca9f12,0 4px 12px #04131e40}
.boss-bar .boss-heading{display:flex;align-items:center;gap:8px;margin-bottom:7px}.boss-heading>small{font-size:9px;color:#c8a57b;letter-spacing:.12em;border:1px solid #a186634a;padding:2px 4px;border-radius:2px}.boss-heading>strong{flex:1;color:#e7d4af;font-size:13px;letter-spacing:.04em}.boss-heading>span{font-size:11px;color:#efdfbe;font-variant-numeric:tabular-nums}.boss-heading b{font-weight:400;color:#92a6a6}
.boss-bar .boss-track{display:block;position:relative;height:7px;overflow:hidden;padding:0;border:1px solid #0b1923;border-radius:1px;background:#081c29;box-shadow:0 1px #9eb2ac33}.boss-track>i{position:absolute;inset:0 auto 0 0;display:block;height:100%;border-radius:0}.boss-track .boss-echo{background:#e6d0a5}.boss-track .boss-fill{background:linear-gradient(#efcf9a,#c9976d 48%,#95634f);box-shadow:inset 0 1px #fff0bd6b;transition:width .08s linear}.boss-track>em{position:absolute;top:0;bottom:0;width:2px;background:#1124319c}
.boss-bar .boss-details{display:flex;align-items:center;justify-content:flex-start;gap:9px;margin-top:6px;color:#b7c7c1;font-size:10px;line-height:1.35}.boss-phase{flex-shrink:0;padding-right:8px;border-right:1px solid #76918e4d;color:#d2ad7f;letter-spacing:.05em}.boss-details>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.boss-bar .boss-counter{display:block;font-size:9px;line-height:1.4;margin-top:3px;color:#829e9f}.boss-critical .boss-track .boss-fill{background:linear-gradient(#ebbb91,#be7c64 50%,#854b44)}
@media(prefers-reduced-motion:reduce){.boss-fill,.health-cells i{transition:none!important}}


.screen-top>.field-notice{position:static;inset:auto;transform:none;flex:0 1 auto;min-width:0;max-width:none;margin-left:auto;padding:6px 10px;background:#18323fe8;border:1px solid #94b6a441;border-left:2px solid #b5c8a0;border-radius:3px;font-size:11px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:none}.screen-brand,.screen-tools{flex-shrink:0}

.health .health-mark{clip-path:none;overflow:visible;width:24px;height:28px;flex-shrink:0;background:#112d39;border-radius:3px}.health-mark svg{display:block;width:16px;height:16px;flex-shrink:0;overflow:visible}
.health-cells i{background:#071520;border-color:#3c566075;box-shadow:inset 0 1px 2px #0007}.health-cells i.filled{background:linear-gradient(#f0ffe6 0%,#d4f3cd 28%,#a4e5bd 50%,#76bda4 100%);border-color:#ddf3d4;box-shadow:inset 0 1px #ffffffa6,0 0 5px #b4ebcc35}.health-caption>span{color:#f0ffe6}

.operative-skill{position:absolute;bottom:22px;left:24px;display:flex;align-items:center;gap:9px;min-width:185px;padding:9px 12px 12px;background:#102b3bea;border:1px solid #718c9059;border-radius:5px;color:#9db8b7;overflow:hidden;z-index:15}.operative-skill>span{text-align:left;flex:1}.operative-skill strong{display:block;font-size:11px;letter-spacing:.04em;color:#d8e1cf}.operative-skill small{display:block;font-size:10px;margin-top:3px}.operative-skill>b{font-size:10px;font-weight:400}.operative-skill>i{position:absolute;bottom:0;left:0;height:2px;background:#a8cbb3;transition:width .1s linear}.operative-skill.ready{border-color:#a4c9ac8c;color:#d8ddbb}.operative-skill.active{background:#284b50}.operative-skill:disabled{cursor:default}


.deploy-row>span{flex:1}


.campaign-screen{position:absolute;inset:var(--front-nav-height) 0 0;display:flex;flex-direction:column;padding:24px 28px;overflow:auto;background:linear-gradient(110deg,#081a29f5,#0d2336e8)}.campaign-screen>.menu-heading{flex-shrink:0}.campaign-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;flex:1;min-height:440px;width:100%;margin:0}.campaign-option{min-width:0;min-height:0;display:flex;flex-direction:column}.campaign-main{width:100%;min-height:0;flex:1;display:flex;flex-direction:column;padding:0;text-align:left;border:0;background:transparent}.campaign-card-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 22px;padding:12px 0 16px;border-top:1px solid var(--line)}.campaign-card-actions .text-button{color:var(--accent)}.campaign-card-actions .campaign-story{color:#bed6cf}.campaign-card{padding:0;overflow:hidden;text-align:left;border:1px solid #48616d;border-radius:12px;background:#132d3d}.campaign-card:hover{border-color:var(--accent);background:#1b3545}.campaign-art{width:100%;overflow:hidden;flex:1;min-height:clamp(140px,23vh,230px);height:clamp(140px,23vh,230px);background:linear-gradient(135deg,#39798b,#173247)}.campaign-sandstorm .campaign-art{background:linear-gradient(135deg,#c19b6a,#885e43)}.campaign-art img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 55%}.campaign-copy{width:100%;flex-shrink:0;padding:22px;display:grid;gap:12px}.campaign-copy h3{font-family:var(--front-art-font);font-size:var(--front-heading);font-weight:400;line-height:1.25}.campaign-copy>p:not(.eyebrow){font-size:var(--front-body);line-height:1.55;color:#b3c4ca}.campaign-copy>span{font-size:var(--front-caption);line-height:1.4;color:var(--mint)}.campaign-copy>strong{font-size:var(--front-body);font-weight:var(--front-weight);color:var(--accent);border-top:1px solid var(--line);padding-top:12px}.zone-desert{background:linear-gradient(135deg,#c19b6a,#885e43)!important}.desert-roadmap{font-size:12px;line-height:1.7;color:#c8b48c;margin:18px 0 0}.mission-screen>.menu-heading>div{min-width:0;flex:1}.mission-screen>.menu-heading h2{font-size:var(--front-section)}
@media(max-width:600px){.campaign-screen{padding:18px}.campaign-cards{grid-template-columns:minmax(0,1fr);gap:16px;flex:none;min-height:0}.campaign-copy{padding:16px}.campaign-art{flex:none;min-height:150px;height:150px}}


/* Preparation uses the established heading/body/caption scale. */
.operative-panel{width:min(100%,920px);height:min(640px,100%);display:flex;flex-direction:column;padding:22px;overflow:hidden}.operative-panel>header{flex-shrink:0;margin-bottom:12px}.operative-panel>header .eyebrow{margin:0}.operative-panel h2{font-size:var(--front-section);margin-bottom:0}.operative-mission{flex-shrink:0;display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:10px 0;color:#9db4b9;font-size:var(--front-caption)}
.operative-prep{flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable;display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:center}.operative-showcase{position:relative;height:340px;overflow:hidden;background:radial-gradient(ellipse at 50% 62%,#53716e55,transparent 65%)}.operative-stage-lines{position:absolute;left:15%;right:15%;bottom:48px;height:30px;border:1px solid #a6c5bd38;border-radius:50%;box-shadow:0 0 22px #82baa218,inset 0 0 20px #82baa210}.operative-stage-lines:after{content:'';position:absolute;left:10%;right:10%;top:5px;bottom:5px;border:1px dashed #8cab9d35;border-radius:50%}.operative-figure{position:absolute;inset:0 38px 50px;display:flex;justify-content:center}.operative-figure canvas{display:block;width:100%;height:100%;object-fit:contain}.operative-nav{position:absolute;top:40%;z-index:2;display:grid;place-items:center;width:36px;height:52px;background:#122c3bd9;border:1px solid #6e8b8c77;border-radius:6px;color:#e9d3a5;font-family:Arial,sans-serif;font-size:36px;line-height:1}.operative-nav svg{width:20px;height:28px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.operative-nav:hover:enabled{background:#36504b;border-color:#d7bf8a}.operative-nav:focus-visible{outline:2px solid #e5bf7b;outline-offset:3px}.operative-nav.previous{left:8px}.operative-nav.next{right:8px}.operative-nav:disabled{opacity:.4}.operative-position{position:absolute;bottom:9px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:6px;color:#d2d9c0;font-size:var(--front-caption)}.operative-position>div{display:flex;gap:5px}.operative-position i{width:18px;height:2px;background:#45606b}.operative-position i.current{background:#e8c180}.operative-position small{font-size:10px;color:#859fa6;letter-spacing:.06em}
.operative-details{min-width:0;padding:16px 0}.operative-details>.eyebrow{color:var(--operative-accent);font-size:var(--front-caption);margin:0 0 8px}.operative-details h3{font-size:var(--front-heading);line-height:1.15;color:#eee9d1;margin:0 0 8px}.operative-outfit{font-size:var(--front-caption);color:#9ab3b5}.operative-bio,.operative-skill-copy,.operative-shared{font-size:var(--front-caption);line-height:1.7;color:#b0c5c5}.operative-bio{margin:14px 0 18px}.operative-ability{display:flex;align-items:center;gap:9px;padding-top:14px;border-top:1px solid var(--line);color:#e2d7b5;font-size:var(--front-body)}.operative-ability>span{margin-left:auto;color:var(--operative-accent);font-size:var(--front-caption)}.operative-shared{color:#7e9ca5;border-top:1px solid var(--line);padding-top:12px;margin:15px 0 0}.operative-footer{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;gap:18px;border-top:1px solid var(--line);padding-top:14px}.operative-footer .front-primary{min-height:46px;padding:10px 22px;font-size:var(--front-body)}.operative-footer .menu-secondary{padding:10px 16px;font-size:var(--front-caption)}
.operative-forward-enter-active,.operative-forward-leave-active,.operative-back-enter-active,.operative-back-leave-active{transition:transform .18s cubic-bezier(.2,.7,.3,1),opacity .18s ease}.operative-forward-enter-from,.operative-back-leave-to{transform:translateX(45px);opacity:0}.operative-forward-leave-to,.operative-back-enter-from{transform:translateX(-45px);opacity:0}.operative-details-enter-active,.operative-details-leave-active{transition:opacity .14s ease}.operative-details-enter-from,.operative-details-leave-to{opacity:0}
@media(max-height:800px){.operative-panel{padding:18px 22px}.operative-showcase{height:340px}.operative-details{padding:10px 0}.operative-bio{margin:10px 0 12px}.operative-shared{margin-top:10px;padding-top:8px}}@media(prefers-reduced-motion:reduce){.operative-forward-enter-active,.operative-forward-leave-active,.operative-back-enter-active,.operative-back-leave-active,.operative-details-enter-active,.operative-details-leave-active{transition:none}}

/* Combat hierarchy: survival at upper left, score at upper right, equipment along the bottom. */
.front-page.combat-layout{--front-nav-height:58px}
.combat-layout .screen-top{padding:10px 18px}.combat-layout .screen-brand{gap:9px}.combat-layout .screen-brand .brand-mark{width:30px;height:36px;font-size:var(--front-body)}.combat-layout .screen-brand>span{font-size:var(--front-caption)}.combat-layout .screen-brand small{margin-top:2px;font-size:10px}.combat-layout .screen-tools button{min-height:32px;min-width:34px;padding:7px 10px;font-size:var(--front-caption)}
.combat-layout .battle-hud{top:calc(var(--front-nav-height) + 12px);left:18px;right:18px;justify-content:space-between;align-items:flex-start}.combat-layout .battle-hud>.health:first-child{margin-left:0;margin-right:auto}.combat-layout .health{min-width:218px;background:#102b3cf0}.armor-readout{display:flex;align-items:center;gap:5px;margin-top:7px;font-size:10px;color:#b0c6cb}.armor-readout>span{margin-right:3px}.armor-readout i{width:17px;height:5px;border:1px solid #7c9caa70;border-radius:1px;background:#203b49}.armor-readout i.filled{background:#89b6c6;border-color:#bbd2d7}.armor-readout b{margin-left:auto;font-size:10px;font-weight:400}.combat-layout .battle-score{text-align:right}
.combat-layout .operative-skill{left:18px;top:calc(var(--front-nav-height) + 94px);bottom:auto;width:218px;min-width:0;padding:8px 10px 10px}.combat-layout .operative-skill strong{font-size:var(--front-caption)}.combat-layout .operative-skill small{font-size:11px}
.combat-layout .equipment-bar{left:18px;right:18px;bottom:16px;padding:0;background:none}.combat-layout .equipment-tools{justify-content:flex-start;margin-bottom:8px}.combat-layout .equipment-bar.collapsed .equipment-tools{margin-bottom:0}.combat-layout .equipment-toggle{min-height:42px;background:#102b3cf2;gap:10px}.current-weapon-name{font-size:var(--front-caption);white-space:nowrap}.combat-layout .loadout-level{font-size:11px}.combat-layout .grenade-resource{position:absolute;right:18px;bottom:16px;display:flex;align-items:center;gap:12px;min-height:42px;padding:9px 13px;background:#102b3cf2;border:1px solid #8a9d8066;border-radius:6px;color:#d3dfd3;font-size:var(--front-caption);z-index:18}.grenade-resource strong{font-size:var(--front-body);color:var(--accent)}.grenade-resource kbd{font-size:11px}.combat-layout .equipment-bar:not(.collapsed){padding:12px 14px 8px;background:#0c2437f0;border:1px solid var(--line);border-radius:7px}.combat-layout .equipment-bar:not(.collapsed)~.grenade-resource{bottom:16px}
.combat-layout .radio-message{left:255px;right:185px;max-width:520px;width:auto}.combat-layout .boss-bar{top:calc(var(--front-nav-height) + 58px);left:58%;width:min(490px,48%)}.combat-layout .traversal-hint{top:calc(var(--front-nav-height) + 158px)}
@media(max-width:900px){.combat-layout .screen-brand small{display:none}.combat-layout .health{min-width:185px}.combat-layout .operative-skill{width:185px}.combat-layout .radio-message{left:220px;right:150px}.combat-layout .boss-bar{left:65%;width:58%;top:calc(var(--front-nav-height) + 65px)}.combat-layout .screen-tools button{padding:7px;gap:5px}}
@media(max-width:620px){.combat-layout .screen-top{padding:8px 10px}.combat-layout .battle-hud{left:10px;right:10px}.combat-layout .health{min-width:160px}.combat-layout .operative-skill{left:10px;width:160px}.combat-layout .radio-message{left:10px;right:10px;max-width:none;top:calc(var(--front-nav-height) + 162px)}.combat-layout .boss-bar{left:50%;width:calc(100% - 20px);top:calc(var(--front-nav-height) + 202px)}.combat-layout .equipment-bar{left:10px;right:10px;bottom:12px}.combat-layout .equipment-toggle svg{width:24px}.combat-layout .equipment-tools{gap:6px}.combat-layout .equipment-toggle{gap:6px;padding:8px}.combat-layout .weapon-cycle{padding:9px 8px;gap:6px}.combat-layout .grenade-resource{right:10px;bottom:65px}.current-weapon-name{max-width:145px;overflow:hidden;text-overflow:ellipsis}}

.combat-layout .counter-hint.hint-offscreen-only{width:1px;height:1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

.teaching-hint,.weapon-reveal{position:absolute;left:58%;transform:translateX(-50%);width:min(440px,48%);padding:12px 14px;background:#102a3df0;border:1px solid #89ada16b;border-radius:7px;z-index:18;color:#d5e0d9}.teaching-hint{top:calc(var(--front-nav-height) + 60px);display:flex;align-items:center;gap:12px}.teaching-hint>kbd{flex-shrink:0;color:var(--accent);font-size:var(--front-caption)}.teaching-hint p{font-size:var(--front-caption);line-height:1.6;flex:1;margin:0}.teaching-hint button{flex:none;border:0;background:transparent;color:#b4c7c7;font-size:11px;padding:6px}.weapon-reveal{top:calc(var(--front-nav-height) + 12px);display:flex;gap:14px;align-items:center}.weapon-reveal>svg{width:65px;height:40px;flex:none}.weapon-reveal>div{min-width:0;flex:1}.weapon-reveal small{display:block;color:var(--accent);font-size:11px}.weapon-reveal strong{display:block;font-size:var(--front-body);margin:4px 0}.weapon-reveal p{font-size:var(--front-caption);line-height:1.6;margin:4px 0}.weapon-reveal kbd{font-size:11px;padding:1px 5px}.weapon-reveal>button{align-self:flex-start;border:0;background:transparent;color:#b6c9cc;font-size:22px;padding:0 4px}.tutorial-reset{display:block;margin-bottom:16px;font-size:var(--front-caption)}
@media(max-width:900px){.teaching-hint,.weapon-reveal{left:65%;width:58%;padding:10px}.weapon-reveal>svg{width:44px}.teaching-hint{gap:8px}}@media(max-width:620px){.teaching-hint,.weapon-reveal{left:50%;width:calc(100% - 24px);top:calc(var(--front-nav-height) + 172px)}}


/* Entry and results reuse the established heading/body/caption scale. */
.continue-note{max-width:560px;color:var(--muted);font-size:var(--front-caption);line-height:1.6;margin:0 0 14px}
.growth-reveal dl{margin:10px 0;display:grid;gap:4px}.growth-reveal dl>div{display:flex;justify-content:space-between;gap:22px;font-size:var(--front-caption);line-height:1.5}.growth-reveal dt{color:var(--muted)}.growth-reveal dd{margin:0;color:var(--mint);font-variant-numeric:tabular-nums}
.result-page{display:flex;flex-direction:column;overflow:hidden;padding:calc(var(--front-nav-height) + 14px) 24px 16px;gap:12px}.result-overview{flex:1;min-height:0;overflow:auto;padding:0 10px 12px;overscroll-behavior:contain}.result-heading h2{margin:5px 0}.result-main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;gap:20px;max-width:900px;margin:16px auto;text-align:center}.result-rank{width:auto;height:auto;min-height:80px}.result-rank strong{font-size:42px;line-height:1.1}.result-score strong,.result-time strong{display:block;font-size:var(--front-heading);line-height:1.25;font-variant-numeric:tabular-nums}.result-time small{font-size:var(--front-caption);color:var(--muted)}.result-rewards{margin:12px auto;max-width:960px;text-align:left}.result-rewards h3{margin:8px 0}.reward-weapons{margin-top:8px}.reward-weapons article{padding:12px}.reward-switch-help{line-height:1.6}.result-actions{flex:none;display:flex;justify-content:center;gap:12px;margin:0;padding:12px 0 0;border-top:1px solid var(--line)}.result-details{max-width:960px;margin:18px auto 0;border-top:1px solid var(--line);padding-top:12px}.result-details summary{cursor:pointer;color:var(--muted);font-size:var(--front-caption);line-height:1.6}.result-details .result-stats{margin-top:16px}.result-details .story-outcome{margin-top:16px}
@media(max-width:760px){.result-page{padding-left:12px;padding-right:12px}.result-main{gap:10px}.result-score strong,.result-time strong{font-size:var(--front-section)}.result-actions{flex-wrap:wrap}.result-actions .front-primary{flex:1 1 100%}.result-overview{padding-left:0;padding-right:0}}

.front-page{height:100%;min-height:0;border:0;border-radius:0;box-shadow:none}.front-ui-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1}.front-ui-icon>svg{width:1em;height:1em}

.title-guide-link{margin-left:16px;color:inherit;text-underline-offset:4px}.title-guide-link:hover{color:var(--accent)}

.title-copy .title-subtitle{margin:0 0 16px;transform:none}
.screen-tools .music-tool.needs-click{color:#efbd72;border-color:#b99a63}.screen-tools .music-tool[aria-pressed="false"]:not(.needs-click){opacity:.65}
.title-legal{display:flex;align-items:center;gap:24px}.title-legal a{color:inherit;text-decoration:none}.title-legal a:hover{color:#efbd72}.title-legal a:focus-visible{outline:2px solid #efbd72;outline-offset:4px}
.screen-brand .brand-logo{display:block;width:44px;height:44px;object-fit:contain;flex-shrink:0}
.home-site-nav{display:flex;align-items:center;gap:24px;margin-right:12px;font-family:var(--front-art-font);font-size:var(--front-caption);line-height:1.5}.home-site-nav a{text-decoration:none;color:#c4d1ce}.home-site-nav a:hover{color:#efbd72}.home-site-nav a:focus-visible{outline:2px solid #efbd72;outline-offset:5px}

/* Only the home menu uses the Hero gutter; inner views retain their content gutter. */
.screen-top.is-home-nav{padding-inline:6%}
/* Shared tactical button treatment, preserving each control's size and layout. */
.front-page button{border-radius:3px;text-shadow:none;box-shadow:none}
.front-page :is(.front-primary,.menu-secondary,.pause-options button,.screen-tools button,.sound-preview button,.settings-row button,.equipment-toggle,.weapon-cycle){border-width:1px;border-style:solid;transition:background .15s,border-color .15s,transform .15s}
.front-page .front-primary{background:#efbd72;border-color:#ffdaa0;color:#101f2a;box-shadow:inset 3px 0 0 #ffe1ac,0 3px 0 #79562f}
.front-page .front-primary:hover:enabled{background:#ffd18e}
.front-page :is(.menu-secondary,.pause-options button,.screen-tools button,.sound-preview button,.settings-row button,.equipment-toggle,.weapon-cycle){background:#102b3be8;border-color:#c3a16a;color:#f4d49f}
.front-page :is(.menu-secondary,.pause-options button,.screen-tools button,.sound-preview button,.settings-row button,.equipment-toggle,.weapon-cycle):hover:enabled{background:#213e4e;border-color:#efbd72}
.front-page :is(.settings-row button.enabled,.screen-tools button.active){background:#354535;border-color:#efbd72;color:#ffe0aa}
.front-page :is(.front-primary,.menu-secondary,.pause-options button):active:enabled{transform:translateY(2px);box-shadow:none}
.front-page .front-primary kbd{border-color:#7e633e;color:#624b2c;border-radius:2px}
.front-page :is(.zone-grid>button,.campaign-card){border-radius:3px;box-shadow:none}
.front-page .text-button:hover:enabled{color:#efbd72}
/* Home actions use the existing action/caption type scale. */
.title-copy .eyebrow{font-size:var(--front-body);line-height:1.4;letter-spacing:.06em}
.title-copy .title-description{max-width:470px;font-size:var(--front-body);line-height:1.65;color:#d5dfda}
.title-copy .title-actions{align-items:flex-start;gap:16px;margin:24px 0 18px}
.title-actions :is(.front-primary,.menu-secondary){min-height:54px;padding:14px 24px;border-radius:3px;border-width:1px;font-size:var(--front-action);line-height:1.35;letter-spacing:.025em;text-shadow:none;box-shadow:0 3px 0 #04111d99;transition:background .15s,border-color .15s,transform .15s}
.title-actions .front-primary{background:#efbd72;border-color:#ffdaa0;color:#101f2a;box-shadow:inset 3px 0 0 #ffe1ac,0 3px 0 #79562f}
.title-actions .front-primary:hover{background:#ffd18e}
.title-actions .menu-secondary{width:100%;background:#102b3be8;border-color:#c3a16a;color:#f4d49f}
.title-actions .menu-secondary:hover{background:#213e4e;border-color:#efbd72}
.title-actions :is(.front-primary,.menu-secondary):active{transform:translateY(2px);box-shadow:none}
.title-actions .front-primary kbd{border-color:#7e633e;color:#624b2c;border-radius:2px}
.quick-start-action{display:flex;flex-direction:column;gap:8px}
.title-copy .quick-start-hint{font-size:var(--front-caption);line-height:1.4;color:#a9bdc4}
.title-copy .continue-note{margin:0 0 16px;font-size:var(--front-caption);line-height:1.5;color:#b9cbc9}
/* Keep the selected operative visible before deployment without a forced picker. */
.deploy-row>span{flex:1;min-width:0}
.deploy-operative{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0;flex:0 1 360px;height:54px;padding:6px 12px;border:1px solid var(--line);border-radius:3px;background:#102b3be8}
.deploy-operative>div{min-width:0}
.deploy-operative-summary{display:flex;align-items:center;gap:12px;white-space:nowrap}
.deploy-operative-summary strong{margin:0;line-height:1.4}
.deploy-operative p{margin:0;font-size:var(--front-caption);line-height:1.4;color:#b3c4ca}
.deploy-operative kbd{font-size:11px;color:var(--accent);padding:1px 4px}
.deploy-operative .text-button{flex:none;font-size:var(--front-caption);line-height:1.4;padding:4px 0;min-height:0;color:var(--accent);text-decoration:underline;text-underline-offset:4px}
@media(max-width:1100px){.deploy-row{flex-wrap:wrap}.deploy-row>span{flex-basis:30%}.deploy-operative{flex:1}.deploy-row>.front-primary{width:100%}}
/* Dialog chrome stays fixed; only the shared middle region scrolls. */
.modal-panel{display:flex;flex-direction:column;min-height:0;max-height:100%;padding:0;overflow:hidden}
.modal-panel>header{flex:none;margin:0;padding:24px 27px 20px;border-bottom:1px solid var(--line)}
.modal-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#628394 #112c3e;padding:22px 27px;scroll-padding-block:16px}
.modal-panel>.modal-footer{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0;padding:18px 27px 24px;border-top:1px solid var(--line)}
.modal-footer .confirm-actions{width:100%;margin:0;flex-wrap:wrap}
.operative-panel>header{margin:0;padding:18px 22px 14px}
.operative-panel>.modal-body{padding:0 22px 14px}
.operative-panel>.modal-footer{padding:14px 22px 18px}
.operative-panel .operative-prep{overflow:visible;min-height:auto;flex:none}
/* Match the deployment panel frame around the entire mission briefing. */
.mission-brief{border:1px solid #e8c27c50;border-radius:8px;background:#1b3545;padding:14px 16px}
</style>
