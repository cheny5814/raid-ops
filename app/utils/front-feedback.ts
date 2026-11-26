import { effectDuration } from './front-impact.ts'
import { WEAPONS, type Run } from './front'
// 仅影响绘制，不改变碰撞、瞄准或玩家的世界坐标。
export function combatShake(run: Run, camera: number, width: number, reduced = false) {
  if (reduced || run.status !== 'playing') return { x: 0, y: 0 }
  let strength = run.damageCue > 0 ? 2 * Math.pow(run.damageCue / .55, 2) : 0
  for (const fx of run.effects) {
    if (fx.x < camera - 80 || fx.x > camera + width + 80 || Math.abs(fx.y - run.y) > 360) continue
    const duration = effectDuration(fx),age=duration-fx.time
    const power = fx.kind === 'boss' ? 6 : fx.kind === 'blast' ? 5 : fx.kind === 'destroy' ? 1.8 : fx.kind === 'hit' ? .45 : fx.kind === 'land' ? .45 : 0
    strength = Math.max(strength, power * Math.pow(Math.max(0,1-age/.22),2))
  }
  const delay = run.mountedGun !== null ? .075 : WEAPONS[run.weapon].delay
  if (run.fireDelay > delay - .045) strength = Math.max(strength, run.weapon === 'rocket' || run.weapon === 'beam' ? 1.3 : .35)
  return { x: Math.sin(run.time * 137) * strength, y: Math.cos(run.time * 173) * strength * .55 }
}
type HealthEcho={hp:number,echo:number,max:number,changed:number,time:number}
const healthEchoes=new WeakMap<object,HealthEcho>()
export function healthEcho(owner:object,hp:number,max:number,time:number,reduced=false){
  let state=healthEchoes.get(owner)
  if(!state||time<state.time||max!==state.max||hp>state.hp||reduced){state={hp,echo:hp,max,changed:time,time};healthEchoes.set(owner,state);return hp}
  const dt=Math.max(0,time-state.time)
  if(hp<state.hp){state.changed=time;state.hp=hp}
  if(time-state.changed>.16)state.echo=hp+(state.echo-hp)*Math.exp(-dt*9)
  if(state.echo-hp<.015)state.echo=hp
  state.time=time;return state.echo
}
export function drawHealthBar(c: CanvasRenderingContext2D, x: number, y: number, width: number, hp: number, maxHp: number, color: string, height = 3, style:{owner?:object,time?:number,reduced?:boolean,armor?:boolean,energy?:boolean}={}) {
  const ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp))),fill=ratio*width
  c.save()
  c.fillStyle='#071721e8';c.beginPath();c.roundRect(x-2,y-2,width+4,height+4,1.5);c.fill()
  c.fillStyle='#223b47';c.fillRect(x,y,width,height)
  const g=c.createLinearGradient(0,y,0,y+height);g.addColorStop(0,color);g.addColorStop(1,color+'88')
  c.fillStyle=g;c.fillRect(x,y,fill,height)
  c.fillStyle='#edf1d666';c.fillRect(x,y,fill,1)
  if(style.owner){const echo=healthEcho(style.owner,hp,maxHp,style.time??0,style.reduced);if(echo>hp){c.fillStyle='#e3b996';c.fillRect(x+fill,y,Math.min(width-fill,(echo-hp)/Math.max(1,maxHp)*width),height)}}
  c.fillStyle='#829b9b8c';c.fillRect(x-1,y-1,width+2,.65);c.fillStyle='#0b202c';c.fillRect(x-1,y+height,width+2,1)
  c.fillStyle=style.energy?'#b7b0d5':style.armor?'#b6bda6':'#899e9c';c.fillRect(x-2,y-1,1,height+2);c.fillRect(x+width+1,y-1,1,height+2)
  if(style.armor||style.energy){c.fillStyle='#142c38a6';for(let i=1;i<4;i++)c.fillRect(x+width*i/4,y,1,height)}
  if(fill>1){c.fillStyle='#e5ead5b3';c.fillRect(x+fill-1,y,.65,height)}
  c.restore()
}
