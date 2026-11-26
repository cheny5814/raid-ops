import type {MechanicalSource} from './front-combat-motion.ts'
import type { SoundCue } from './front-sound-events'
import type { Weapon } from './front'
export const MUSIC_TRACKS = { menu: '/iron-front/audio/menu.m4a', combat: '/iron-front/audio/combat.m4a', boss: '/iron-front/audio/boss.m4a' }
export type MusicScene = keyof typeof MUSIC_TRACKS
export const GUN_SOUNDS: Record<Weapon, { pitch: number, decay: number, crack: number, filter: number, weight: number }> = {
  rifle: { pitch: 155, decay: .12, crack: .065, filter: 3600, weight: .6 },
  spread: { pitch: 100, decay: .23, crack: .15, filter: 2300, weight: .85 },
  pulse: { pitch: 230, decay: .17, crack: .09, filter: 4300, weight: .62 },
  rapid: { pitch: 175, decay: .075, crack: .045, filter: 3100, weight: .44 },
  rocket: { pitch: 75, decay: .38, crack: .25, filter: 900, weight: .9 },
  beam: { pitch: 560, decay: .32, crack: .11, filter: 5000, weight: .65 },
}
export function musicForMode(mode: string, boss: boolean, hidden = false): MusicScene | null {
  if (hidden || ['paused', 'dead'].includes(mode)) return null
  if (mode === 'playing') return boss ? 'boss' : 'combat'
  return 'menu'
}
// One shared mixer, bounded transient voices, and a limiter keep fast gunfire punchy without clipping.
export class FrontSoundBank {
  private context: AudioContext | null = null
  private bus: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private ropeBuffer: AudioBuffer | null = null
  private voices = 0
  private enabled = true
  private volume = .8
  private lastImpact = -1
  private cueTimes = new Map<SoundCue, number>()
  private cueGain = 1
  private pan = 0
  private ropeLoop: { source: AudioBufferSourceNode, filter: BiquadFilterNode, gain: GainNode } | null = null
  private machineryState=new Map<string,{aim:number,turnAt:number,trackAt:number,reloadAt?:number,age:number}>()
  private ladderAt = -1
  private factory: () => AudioContext
  constructor(factory: () => AudioContext = () => new AudioContext()) { this.factory = factory }
  configure(enabled: boolean, volume: number) {
    if (!enabled || volume <= 0) this.stopTraversal()
    this.enabled = enabled; this.volume = Math.max(0, Math.min(1, volume))
    if (this.context && this.bus) this.bus.gain.setTargetAtTime(enabled ? this.volume * .85 : 0, this.context.currentTime, .012)
  }
  async unlock() {
    if (!this.context) {
      const c = this.context = this.factory(), bus = this.bus = c.createGain(), limiter = c.createDynamicsCompressor()
      bus.gain.value = this.enabled ? this.volume * .85 : 0
      limiter.threshold.value = -5; limiter.knee.value = 6; limiter.ratio.value = 8; limiter.attack.value = .003; limiter.release.value = .08
      bus.connect(limiter); limiter.connect(c.destination)
      const buffer = this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate), values = buffer.getChannelData(0)
      for (let i = 0; i < values.length; i++) values[i] = Math.random() * 2 - 1
    }
    if(!this.ropeBuffer){const c=this.context!,buffer=this.ropeBuffer=c.createBuffer(1,c.sampleRate,c.sampleRate),data=buffer.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;low=low*.9+white*.1;const t=i/data.length;data[i]=low*(.55+.25*Math.sin(t*Math.PI*16)+.12*Math.sin(t*Math.PI*62))}}
    await this.context.resume()
  }
  get ready() { return this.context?.state === 'running' }
  private connectSpatial(gain: GainNode) {
    const c = this.context!
    if (typeof c.createStereoPanner !== 'function') { gain.connect(this.bus!); return null }
    const pan = c.createStereoPanner(); pan.pan.value = this.pan; gain.connect(pan); pan.connect(this.bus!); return pan
  }
  private tone(time: number, pitch: number, end: number, duration: number, amplitude: number, type: OscillatorType = 'sine') {
    const c = this.context!, osc = c.createOscillator(), gain = c.createGain()
    this.voices++; osc.type = type; osc.frequency.setValueAtTime(pitch, time); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + duration)
    gain.gain.setValueAtTime(.0001, time); gain.gain.exponentialRampToValueAtTime(amplitude * this.cueGain, time + .002); gain.gain.exponentialRampToValueAtTime(.0001, time + duration)
    osc.connect(gain); const pan = this.connectSpatial(gain); osc.onended = () => { this.voices--; osc.disconnect(); gain.disconnect(); pan?.disconnect() }; osc.start(time); osc.stop(time + duration + .01)
  }
  private noise(time: number, duration: number, frequency: number, amplitude: number, type: BiquadFilterType = 'bandpass') {
    const c = this.context!, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain()
    this.voices++; source.buffer = this.noiseBuffer; source.loop = true; filter.type = type; filter.frequency.value = frequency; filter.Q.value = .6
    gain.gain.setValueAtTime(amplitude * this.cueGain, time); gain.gain.exponentialRampToValueAtTime(.0001, time + duration)
    source.connect(filter); filter.connect(gain); const pan = this.connectSpatial(gain); source.onended = () => { this.voices--; source.disconnect(); filter.disconnect(); gain.disconnect(); pan?.disconnect() }; source.start(time, Math.random() * .4, duration); source.stop(time + duration + .01)
  }
  shot(weapon: Weapon) {
    if (!this.enabled || !this.ready || this.voices > 80) return
    const p = GUN_SOUNDS[weapon], t = this.context!.currentTime
    this.noise(t, .018, 4200, p.weight * .85, 'highpass')
    this.noise(t, p.crack * 1.15, p.filter * .7, p.weight * 1.2, 'lowpass')
    this.tone(t, p.pitch, weapon === 'beam' ? 95 : 42, p.decay, p.weight * .45, weapon === 'pulse' || weapon === 'beam' ? 'triangle' : 'sine')
    this.noise(t + .038, .034, 2100, .16, 'bandpass')
    if (weapon === 'spread' || weapon === 'rocket') this.tone(t, 60, 30, p.decay, .25)
    if (weapon === 'pulse' || weapon === 'beam') this.tone(t + .012, weapon === 'beam' ? 1200 : 760, 160, .12, .08, 'sawtooth')
  }
  impact(explosion: boolean) {
    if (!this.enabled || !this.ready || this.voices > 40) return
    const t = this.context!.currentTime
    if (t - this.lastImpact < (explosion ? .1 : .065)) return
    this.lastImpact = t
    if (explosion) { this.noise(t, .42, 650, .65, 'lowpass'); this.tone(t, 95, 28, .4, .55); this.noise(t + .04, .25, 1800, .1, 'highpass') }
    else { this.noise(t, .09, 2400, .55); this.tone(t, 700, 170, .065, .15, 'triangle') }
  }
  cue(kind: SoundCue, pan = 0, gain = 1) {
    if (!this.enabled || this.volume <= 0 || !this.ready || this.voices > 64) return
    const t = this.context!.currentTime, gap = ['hit', 'metalHit', 'sandHit', 'stoneHit', 'woodHit', 'shield', 'armorBreak', 'weakHit'].includes(kind) ? .045 : ['explosion', 'tankBoom', 'barrelBoom'].includes(kind) ? .12 : .09
    if (t - (this.cueTimes.get(kind) ?? -10) < gap) return
    this.cueTimes.set(kind, t); this.pan = Math.max(-.85, Math.min(.85, pan)); this.cueGain = Math.max(0, Math.min(1, gain))
    try {
      if(kind==='sandHit'){this.noise(t,.095,750,.24,'lowpass');this.noise(t,.045,1800,.1,'bandpass')}
      else if(kind==='stoneHit'){this.noise(t,.035,2300,.32,'highpass');this.noise(t+.012,.11,900,.22,'lowpass')}
      else if(kind==='woodHit'){this.noise(t,.055,1350,.3,'bandpass');this.tone(t,160,70,.06,.1)}
      else if(kind==='trackMove'){this.noise(t,.09,390,.14,'lowpass');this.noise(t+.025,.04,1500,.07,'bandpass');this.tone(t,95,65,.08,.045)}
      else if(kind==='turretTurn'){this.noise(t,.13,640,.09,'bandpass');this.tone(t,145,125,.12,.025,'triangle')}
      else if(kind==='reload'){this.noise(t,.022,2200,.12,'highpass');this.noise(t+.06,.035,1300,.09,'bandpass')}
      else if(kind==='supportFire'){this.noise(t,.06,2600,.48,'highpass');this.noise(t+.008,.09,850,.35,'lowpass');this.tone(t,160,55,.1,.25)}
      else if(kind==='armorBreak'){this.noise(t,.045,3700,.42,'highpass');this.noise(t+.025,.11,1200,.24,'bandpass');this.tone(t,1800,320,.14,.13,'triangle')}
      else if(kind==='weakHit'){this.noise(t,.045,1800,.4,'bandpass');this.tone(t,620,210,.1,.22,'triangle');this.tone(t+.018,940,340,.075,.1,'triangle')}
      else if (kind === 'hit' || kind === 'metalHit') {
        this.noise(t, .085, kind === 'hit' ? 1600 : 3100, .62)
        this.tone(t, kind === 'hit' ? 230 : 1050, 95, .09, .2, 'triangle')
        if (kind === 'metalHit') this.tone(t + .008, 1680, 440, .12, .1, 'triangle')
      } else if (['explosion', 'barrelBoom', 'tankBoom'].includes(kind)) {
        const large = kind === 'tankBoom', fuel = kind === 'barrelBoom'
        this.noise(t, .035, 2800, .8, 'highpass'); this.noise(t, large ? 1.15 : fuel ? .8 : .4, 750, .85, 'lowpass')
        this.tone(t, large ? 115 : 90, 27, large ? 1.1 : .55, .7)
        this.noise(t + .07, large ? .8 : .35, 1900, .3, 'bandpass')
        if (large) { this.noise(t + .2, .5, 1100, .45); this.tone(t + .12, 260, 35, .7, .22, 'triangle') }
        if (fuel) this.noise(t + .1, .65, 1000, .3, 'highpass')
      } else if (kind === 'hurt' || kind === 'armorHit' || kind === 'death') {
        this.noise(t, .12, kind === 'armorHit' ? 2900 : 950, .7)
        this.tone(t, kind === 'armorHit' ? 740 : 170, 48, kind === 'death' ? .6 : .22, .4, 'triangle')
        if (kind !== 'armorHit') this.tone(t + .09, 90, 42, .2, .27)
      } else if(kind==='ropeGrab'){
        this.noise(t,.026,2100,.18,'highpass');this.noise(t+.028,.055,700,.15,'lowpass')
      } else if(kind==='ropeRelease'){
        this.noise(t,.025,1800,.12,'highpass');this.noise(t+.018,.075,850,.12,'lowpass')
      } else if (kind === 'ladderGrab' || kind === 'equip') {
        this.noise(t, .045, 2500, .34); this.tone(t, 1200, 330, .08, .13, 'triangle'); this.noise(t + .055, .035, 1700, .17)
      } else if (kind === 'jump') {
        this.noise(t, .12, 1100, .28, 'bandpass')
      } else if (kind === 'land' || kind === 'ladderStep' || kind === 'enemyDown') {
        this.noise(t, .08, 600, kind === 'land' ? .42 : .26, 'lowpass'); this.tone(t, 120, 45, .12, .17)
      } else if (kind === 'shield') {
        this.noise(t, .09, 3500, .35); this.tone(t, 1350, 500, .16, .14, 'sawtooth')
      } else if (kind === 'ui') this.tone(t, 610, 420, .045, .12, 'triangle')
      else {
        const notes = kind === 'victory' ? [330, 440, 554, 660] : kind === 'objective' ? [440, 554, 660] : [440, 660]
        notes.forEach((f, i) => this.tone(t + i * .075, f, f * .99, .19, .18, 'triangle'))
      }
    } finally { this.pan = 0; this.cueGain = 1 }
  }
  machinery(sources:MechanicalSource[],listener:number,width:number,time:number){
    if(!this.enabled||this.volume<=0||!this.ready){this.machineryState.clear();return}
    const audible=sources.filter(s=>Math.abs(s.x-listener)<Math.min(620,width*.65)).sort((a,b)=>Math.abs(a.x-listener)-Math.abs(b.x-listener)).slice(0,8),present=new Set(audible.map(s=>s.id))
    for(const id of this.machineryState.keys())if(!present.has(id))this.machineryState.delete(id)
    for(const s of audible){
      let state=this.machineryState.get(s.id)
      if(!state||s.age<state.age){state={aim:s.aim,turnAt:time,trackAt:time-.2,reloadAt:s.shotAt,age:s.age};this.machineryState.set(s.id,state)}
      const gain=Math.max(0,1-Math.abs(s.x-listener)/Math.min(620,width*.65)),pan=(s.x-listener)/(width*.65)
      if(s.kind==='vehicle'&&Math.abs(s.speed)>3&&time-state.trackAt>.14){state.trackAt=time;this.cue('trackMove',pan,gain*Math.min(.7,Math.abs(s.speed)/100))}
      const turn=Math.abs(Math.atan2(Math.sin(s.aim-state.aim),Math.cos(s.aim-state.aim)))
      if(s.kind==='vehicle'&&turn>.065&&time-state.turnAt>.24){state.turnAt=time;state.aim=s.aim;this.cue('turretTurn',pan,gain*.6)}
      if(s.shotAt!==undefined&&s.age-s.shotAt>.25&&s.age-s.shotAt<.8&&state.reloadAt!==s.shotAt){state.reloadAt=s.shotAt;this.cue('reload',pan,gain*(s.kind==='vehicle'?.5:.3))}
      state.age=s.age
    }
  }
  traversal(rope: boolean, speed: number, ladderMoving: boolean) {
    if (!this.enabled || this.volume <= 0 || !this.ready) { this.stopTraversal(); return }
    const c = this.context!
    if (!rope) this.stopTraversal()
    else {
      if (!this.ropeLoop) {
        const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain()
        source.buffer = this.ropeBuffer; source.loop = true; filter.type = 'lowpass'; filter.Q.value = .3; gain.gain.value = 0
        source.connect(filter); filter.connect(gain); gain.connect(this.bus!); source.start(); this.ropeLoop = { source, filter, gain }
      }
      const movement = Math.min(1, Math.abs(speed) / 2.5)
      this.ropeLoop.filter.frequency.setTargetAtTime(650 + movement * 450, c.currentTime, .06)
      this.ropeLoop.gain.gain.setTargetAtTime(movement < .03 ? 0 : .035 + movement * .12, c.currentTime, .06)
    }
    if (ladderMoving && c.currentTime - this.ladderAt > .23) { this.ladderAt = c.currentTime; this.cue('ladderStep') }
  }
  stopTraversal() {
    const loop = this.ropeLoop; this.ropeLoop = null
    if (loop) { loop.source.stop(); loop.source.disconnect(); loop.filter.disconnect(); loop.gain.disconnect() }
  }
  async suspend() { this.machineryState.clear();this.stopTraversal(); if (this.context?.state === 'running') await this.context.suspend() }
  async dispose() { this.machineryState.clear();this.stopTraversal(); const c = this.context; this.context = null; this.bus = null; this.noiseBuffer = null; this.ropeBuffer=null; if (c) await c.close() }
}
