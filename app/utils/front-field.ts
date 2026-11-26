import type {Level,Run,Rect} from './front.ts'
import {emitSound} from './front-sound-events.ts'
export type MovingDeck=Rect&{id:number,kind:'barge'|'lift'|'shuttle',dx:number,dy:number,period:number,phase?:number,circuit?:number}
export type FieldSwitch={id:number,x:number,y:number,label:{en:string,zh:string},doors?:Rect[]}
export type FieldLayout={decks:MovingDeck[],switches:FieldSwitch[],bridges:{target:number,deck:Rect,kind:'billboard'|'sentry'}[]}
export function switchOn(r:Run,id:number){return(r.fieldSwitches??[]).includes(id)}
export function movingDeck(l:Level,r:Run,p:MovingDeck,time=r.time):Rect{
 const t=p.circuit!==undefined&&!switchOn(r,p.circuit)?0:(1-Math.cos((time/(p.period||8)+(p.phase??0))*Math.PI*2))/2
 return{x:p.x+p.dx*t,y:p.y+p.dy*t,w:p.w,h:p.h}
}
export function fieldDecks(l:Level,r:Run,time=r.time):Rect[]{
 const f=l.field;if(!f)return[]
 return [...f.decks.map(p=>movingDeck(l,r,p,time)),...f.bridges.filter(p=>p.kind==='billboard'?r.barriers.some(b=>b.id===p.target&&b.hp<=0):r.tactics.some(t=>t.target===p.target&&(t.state==='allied'||t.state==='spent'))).map(p=>p.deck)]
}
export function fieldWalls(l:Level,r:Run){return(l.field?.switches??[]).filter(s=>!switchOn(r,s.id)).flatMap(s=>s.doors??[])}
export function carryField(l:Level,r:Run,dt:number){
 if(!r.grounded||r.rope!==null||r.ladder!==null||r.zipline||r.tacticalControl!==null)return
 for(const p of l.field?.decks??[]){const before=movingDeck(l,r,p,r.time-dt),after=movingDeck(l,r,p);if(r.x+13>=before.x&&r.x+13<=before.x+before.w&&Math.abs(r.y+40-before.y)<1.5){r.x+=after.x-before.x;r.y+=after.y-before.y;return}}
}
// Door-side panels share the circuit with the main console, including existing runs.
export function fieldControls(s:FieldSwitch):{x:number,y:number,door?:Rect}[]{return[{x:s.x,y:s.y},...(s.doors??[]).map(door=>({x:door.x-52,y:door.y+door.h-32,door}))]}
export function nearbyFieldSwitch(l:Level,r:Run){return l.field?.switches.find(s=>fieldControls(s).some(p=>Math.abs(p.x+12-r.x-13)<44&&Math.abs(p.y+32-r.y-40)<32))}
export function operateField(l:Level,r:Run){
 const p=nearbyFieldSwitch(l,r);if(!p||!r.grounded||r.rope!==null||r.ladder!==null||r.zipline||r.tacticalControl!==null||r.mountedGun!==null)return false
 const on=switchOn(r,p.id)
 if(on&&p.doors?.some(b=>r.x+26>b.x&&r.x<b.x+b.w&&r.y+40>b.y&&r.y<b.y+b.h))return true
 r.fieldSwitches??=[];r.fieldSwitches=on?r.fieldSwitches.filter(id=>id!==p.id):[...r.fieldSwitches,p.id];emitSound(r,'equip',r.x);return true
}
