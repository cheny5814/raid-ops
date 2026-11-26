import type {Level,Run,Rect,Enemy} from './front.ts'
import {emitSound} from './front-sound-events.ts'
export function desertDecks(run:Run):Rect[]{return run.barriers.filter(b=>b.waterTower&&b.hp<=0&&(b.fallAge??0)>=.65).map(b=>({x:b.x-12,y:b.y+b.h,w:270,h:12}))}
export function desertSand(level:Level,run:Run){return level.desert?.sand.find(p=>run.x+23>p.x&&run.x+3<p.x+p.w&&Math.abs(run.y+40-p.y-4)<10&&!desertDecks(run).some(d=>run.x+23>d.x&&run.x<d.x+d.w))}
export function tickDesert(level:Level,run:Run,dt:number){
 if(level.biome!=='desert')return
 for(const b of run.barriers)if(b.waterTower&&b.hp<=0){if(b.fallAge===undefined){emitSound(run,'barrelBoom',b.x);run.effects.push({x:b.x,y:b.y+b.h-40,kind:'destroy',time:1.3,duration:1.3,blastStyle:'dust',size:40,floor:b.y+b.h})}b.fallAge=Math.min(1,(b.fallAge??0)+dt)}
 if(desertSand(level,run)&&run.grounded&&run.dashTime<=0){run.sandTime=(run.sandTime??0)+dt;if(run.sandTime>2.8&&run.invincible<=0){run.hp--;run.stats.damage++;run.damageCue=.8;run.invincible=1;run.sandTime=1.8;emitSound(run,'hurt',run.x)}}else run.sandTime=Math.max(0,(run.sandTime??0)-dt*4)
}
export function desertBossState(e:Enemy){const wheels=(e.parts?.tracks??1)>0,open=!wheels&&e.age%6>=3.2;return{open,label:{en:wheels?"Break the wheels · jump the charge":open?"Engine vent open · fire":"Armored · dodge the salvo",zh:wheels?'击毁轮组 · 跳过冲撞 · 远离轮组':open?'引擎散热口打开 · 集中射击':'装甲闭合 · 躲避齐射'}}}
