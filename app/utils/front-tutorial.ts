import {environmentalKind,ENVIRONMENT_TEXT} from './front-environment.ts'
import type{Run,Level,Input}from'./front.ts'
export const LESSONS=['environment','move','shoot','jump','interact','switch','up','duck','grenade','raven-skill','fox-skill']as const
export type Lesson=typeof LESSONS[number]
export type Tutorial={done:Lesson[]}
export type TeachingHint={id:Lesson,key:string,en:string,zh:string}
export function readTutorial(raw:unknown,experienced=false):Tutorial{
 const done=raw&&typeof raw==='object'&&Array.isArray((raw as Tutorial).done)?LESSONS.filter(k=>(raw as Tutorial).done.includes(k)):experienced?['move','shoot','jump']as Lesson[]:[]
 return{done:[...done]}
}
export function learn(t:Tutorial,id:Lesson){return t.done.includes(id)?t:{done:[...t.done,id]}}
export function lessonFor(t:Tutorial,r:Run,l:Level):TeachingHint|null{
 const need=(id:Lesson)=>!t.done.includes(id),hint=(id:Lesson,key:string,en:string,zh:string)=>({id,key,en,zh})
 if(need('move'))return hint('move','A / D','Move left or right.','向左或向右移动。')
 if(need('shoot'))return hint('shoot','J','Hold to fire. Aim assist helps track enemies.','按住连续射击，辅助瞄准会帮助锁定敌人。')
 const ahead=(p:{x:number,w:number})=>p.x-r.x<190&&p.x+p.w>r.x+20
 const edge=l.ground.find(g=>r.x+13>=g.x&&r.x+13<g.x+g.w)
 if(need('jump')&&(r.time>18||l.barriers.some(p=>p.hp>0&&ahead(p))||l.spikes.some(ahead)||edge&&edge.x+edge.w-r.x<150))return hint('jump','Space / K','Jump over obstacles and gaps.','跳过障碍与缺口。')
 if(need('environment')){const p=r.interactives.find(p=>environmentalKind(p.kind)&&Math.abs(p.x-r.x)<180&&Math.abs(p.y+p.h-r.y-40)<110);if(p&&environmentalKind(p.kind))return hint('environment',p.kind==='cooling'||p.kind==='steam'&&p.hp<=0?'E':'J',ENVIRONMENT_TEXT[p.kind].en[1],ENVIRONMENT_TEXT[p.kind].zh[1])}
 if(need('interact')){
  const near=(p:{x:number,y:number})=>Math.abs(p.x-r.x)<95&&Math.abs(p.y-r.y)<120
  const machine=r.tactics.find(p=>near(p)&&p.state==='ready')
  if(machine)return hint('interact','E',machine.kind==='crane'?'Use the crane. A/D moves cargo; E drops it.':machine.kind==='vehicle'?'Drive the armored car. J fires; E or Space exits.':'Hack the sentry. Hold position until complete.',machine.kind==='crane'?'操作吊机：A/D 移箱，再按 E 投放。':machine.kind==='vehicle'?'驾驶装甲车：J 开炮，E 或空格撤离。':'破解炮台：保持位置直到完成。')
  if(l.ziplines?.some(p=>Math.abs(p.x-r.x)<110))return hint('interact','E','Ride the zipline. A/D slides; Space jumps off.','挂上滑索：A/D 滑行，空格提前跳离。')
  if(l.ladders.some(near))return hint('interact','E','Grab the ladder, then use W/S to climb.','抓住梯子，再用 W/S 上下攀爬。')
  if(r.interactives.some(p=>p.kind==='gun'&&near(p)))return hint('interact','E','Use the machine gun. J fires; E or Space exits.','操作固定机枪：J 开火，E 或空格离开。')
  if(l.field?.switches.some(near))return hint('interact','E','Use the control panel.','操作控制台。')
 }
 if(need('up')&&r.enemies.some(e=>e.hp>0&&!e.dormant&&e.y<r.y-45&&Math.abs(e.x-r.x)<430))return hint('up','W + J','Aim upward to hit enemies above you.','向上瞄准并开火，攻击高处敌人。')
 if(need('duck')&&r.bullets.some(b=>!b.friendly&&Math.abs(b.x-r.x)<170&&b.y>r.y&&b.y<r.y+18))return hint('duck','S','Crouch under high shots. You can keep firing.','下蹲躲过高处射线，也可以继续开火。')
 if(need('switch')&&r.arsenal.length>1)return hint('switch','Q / 1–6','Tap Q to cycle unlocked weapons, or use a number key.','Q 循环切换已解锁武器，数字键可直接选择。')
 const skill=r.operative==='fox'?'fox-skill':'raven-skill'
 if(need(skill)&&r.skillCooldown<=0&&(r.operative==='fox'?!r.grounded:r.hp<7||r.bullets.some(b=>!b.friendly&&Math.abs(b.x-r.x)<180)))return hint(skill,'U',r.operative==='fox'?'Use one extra leap while airborne.':'Dash through danger with brief damage protection.',r.operative==='fox'?'空中再翻跃一次，修正落点。':'冲刺突破火线，期间短暂免伤。')
 if(need('grenade')&&r.grenades>0&&r.enemies.filter(e=>e.hp>0&&!e.dormant&&Math.abs(e.x-r.x)<300).length>=2)return hint('grenade','L','Throw a grenade into grouped enemies.','向扎堆的敌人投掷手雷。')
 return null
}
export function observeLessons(t:Tutorial,before:Pick<Run,'x'|'weapon'|'grenades'|'skillCooldown'|'rope'|'zipline'|'ladder'|'mountedGun'|'tacticalControl'|'fieldSwitches'|'stats'>,r:Run,input:Input){
 let next=t
 if(r.interactives.some(p=>environmentalKind(p.kind)&&Math.abs(p.x-r.x)<200&&(input.shoot&&p.hp<=0||input.interact&&(p.kind==='cooling'&&p.timer>1||p.kind==='steam'&&p.triggered))))next=learn(next,'environment')
 if((input.left||input.right)&&Math.abs(r.x-before.x)>.2)next=learn(next,'move')
 if(input.shoot&&r.stats.shots>before.stats.shots)next=learn(next,'shoot')
 if(input.jump&&!r.grounded&&r.vy< -20)next=learn(next,'jump')
 if(input.up&&r.stats.shots>before.stats.shots&&r.fireAngle!==undefined&&Math.sin(r.fireAngle)<-.3)next=learn(next,'up')
 if(r.duck)next=learn(next,'duck')
 if(r.grenades<before.grenades)next=learn(next,'grenade')
 if(r.skillCooldown>before.skillCooldown)next=learn(next,r.operative==='fox'?'fox-skill':'raven-skill')
 if(input.interact&&(r.rope!==before.rope||r.zipline!==before.zipline||r.ladder!==before.ladder||r.mountedGun!==before.mountedGun||r.tacticalControl!==before.tacticalControl||r.fieldSwitches.length!==before.fieldSwitches.length))next=learn(next,'interact')
 return next
}
