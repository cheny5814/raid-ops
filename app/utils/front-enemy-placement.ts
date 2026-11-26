import type {Enemy,Level,Rect} from './front.ts'
import {surfaceY} from './front-route-features.ts'
const overlaps=(a:Rect,b:Rect)=>a.x+a.w>b.x+.001&&a.x<b.x+b.w-.001&&a.y+a.h>b.y+.001&&a.y<b.y+b.h-.001
export function patrolObstructed(e:Rect,solids:Rect[]){return solids.some(p=>overlaps(e,p))}
const blocked=(e:Rect,platforms:Rect[],barriers:Rect[])=>patrolObstructed(e,platforms)||barriers.some(p=>(!('hp' in p)||(p as {hp:number}).hp>0)&&overlaps(e,p))
export function patrolSupported(e:Rect,surfaces:Rect[]){const center=e.x+e.w/2;return surfaces.some(p=>e.x+2>=p.x&&e.x+e.w-2<=p.x+p.w&&Math.abs(surfaceY(p,center)-e.y-e.h)<8)}
// Platforms stop projectiles, so a patrol must have a clear body as well as supported feet.
// Put units on a supporting low deck, or move along the existing floor to a clear flank.
export function clearPatrolSpawn(e:Enemy,l:Level,platforms=l.platforms,barriers:Rect[]=l.barriers,ensureFooting=false){
 if(e.boss)return
 if(!blocked(e,platforms,barriers)&&(!ensureFooting||e.type==='drone'||patrolSupported(e,[...l.ground,...platforms])))return
 const x=e.x,y=e.y,bottom=y+e.h,surfaces=[...l.ground,...platforms]
 // A low deck cutting through a ground unit becomes its support, leaving the whole body visible.
 if(e.type!=='drone')for(const p of platforms){
  if(e.x<p.x+2||e.x+e.w>p.x+p.w-2||!overlaps(e,p))continue
  const nextY=p.y-e.h
  if(blocked({x:e.x,y:nextY,w:e.w,h:e.h},platforms,barriers))continue
  e.y=nextY;e.homeY+=nextY-y;return
 }
 // Recover an idle ground unit whose old platform no longer exists beneath it.
 if(ensureFooting&&e.type!=='drone')for(const support of surfaces.filter(p=>x+2>=p.x&&x+e.w-2<=p.x+p.w&&surfaceY(p,x+e.w/2)>=bottom-8&&surfaceY(p,x+e.w/2)<=bottom+240).sort((a,b)=>surfaceY(a,x+e.w/2)-surfaceY(b,x+e.w/2))){
  const nextY=surfaceY(support,x+e.w/2)-e.h
  if(blocked({x,y:nextY,w:e.w,h:e.h},platforms,barriers))continue
  e.y=nextY;e.homeY+=nextY-y;return
 }
 for(let distance=0;distance<=640;distance+=8)for(const direction of[-1,1]){
  const nextX=x+distance*direction,center=nextX+e.w/2
  if(nextX<0||nextX+e.w>l.width)continue
  const support=surfaces.find(p=>nextX+2>=p.x&&nextX+e.w-2<=p.x+p.w&&Math.abs(surfaceY(p,center)-bottom)<8)
  if(e.type!=='drone'&&!support)continue
  const nextY=e.type==='drone'?y:surfaceY(support!,center)-e.h
  if(blocked({x:nextX,y:nextY,w:e.w,h:e.h},platforms,barriers))continue
  e.x=nextX;e.y=nextY;e.home+=nextX-x;e.homeY+=nextY-y
  return
 }
}
// Patrol animation is not physics: reject a blocked sweep before it can carry a unit through a deck.
export function constrainPatrol(e:Enemy,previous:{x:number,y:number},l:Level,platforms=l.platforms,barriers:Rect[]=l.barriers){
 if(e.boss)return
 if(e.x===previous.x&&e.y===previous.y){clearPatrolSpawn(e,l,platforms,barriers,true);return}
 const sweep={x:Math.min(previous.x,e.x),y:Math.min(previous.y,e.y),w:e.w+Math.abs(e.x-previous.x),h:e.h+Math.abs(e.y-previous.y)}
 if(!blocked(sweep,platforms,barriers)&&(e.type==='drone'||patrolSupported(e,[...l.ground,...platforms])))return
 e.x=previous.x;e.y=previous.y
 // Also recover enemies from older checkpoint snapshots that already intersect a deck.
 clearPatrolSpawn(e,l,platforms,barriers,true)
}
export function clearLevelPatrols(l:Level){for(const e of l.enemies)clearPatrolSpawn(e,l)}
