import type { Level, Rect, Run } from './front.ts'
export type Zipline = { id:number, x:number, y:number, endX:number, endY:number }
export function surfaceY(p:Rect,x:number){return p.y+(p.rise??0)*Math.max(0,Math.min(1,(x-p.x)/p.w))}
export function ziplinePoint(z:Zipline,t:number){return{x:z.x+(z.endX-z.x)*t,y:z.y+(z.endY-z.y)*t+Math.sin(t*Math.PI)*10}}
export function nearbyZipline(l:Level,r:Run){
 return(l.ziplines??[]).map(z=>{const t=Math.max(0,Math.min(1,(r.x+13-z.x)/(z.endX-z.x))),p=ziplinePoint(z,t);return{z,t,d:Math.hypot(p.x-r.x-13,p.y+18-r.y)}}).filter(p=>p.d<=52&&(p.t<=.08||p.t>=.92)).sort((a,b)=>a.d-b.d)[0]
}
// Fine collision strips are only for shot sweeps; walking samples the exact incline.
export function terrainSolids(ground:Rect[]):Rect[]{return ground.flatMap(p=>{
 if(!p.rise)return[p]
 const count=Math.ceil(p.w/12),w=p.w/count
 return Array.from({length:count},(_,i)=>{const x=p.x+i*w,y=surfaceY(p,x+w/2);return{x,y,w,h:p.y+p.h-y}})
})}
export function installRouteFeatures(l:Level){
 // Thin existing supply placements evenly by type; retain the medical pack before the boss.
 const counts={med:0,armor:0,grenades:0}
 l.pickups=l.pickups.filter(p=>{const n=counts[p.type]++;return p.type==='med'&&p.x>l.width-1000||n%3!==1})
 l.ziplines=l.ropes.filter((_,i)=>i%2===1).map((r,i)=>{
  const left=l.ground.find(g=>Math.abs(g.x+g.w-(r.x-175))<1)!,right=l.ground.find(g=>Math.abs(g.x-(r.x+210))<1)!
  // A short bank's setback may put the anchor over an adjacent, higher ledge.
  // Sample the actual support at each anchor so dismounting stays above ground.
  const x=left.x+left.w-140,endX=right.x+75
  const startBank=l.ground.find(g=>x>=g.x&&x<g.x+g.w)??left,endBank=l.ground.find(g=>endX>=g.x&&endX<g.x+g.w)??right
  return{id:i,x,y:Math.min(surfaceY(left,x),surfaceY(startBank,x))-60,endX,endY:Math.min(surfaceY(right,endX),surfaceY(endBank,endX))-66}
 })
 // Add low rolling rises on otherwise clear stretches; keep scripted arenas and gap banks flat.
 let last=-3000,added=0
 const shaped:Rect[]=[]
 for(const g of l.ground){
  let at:number|undefined
  if(g.w>=330&&g.x<l.width-1600&&g.x>last+3500&&!l.setPieces?.some(s=>g.x<s.end+180&&g.x+g.w>s.x-180)){
   for(let x=g.x+45;x+280<g.x+g.w-25;x+=25){
    const blocked=[...l.barriers,...l.hazards,...l.spikes,...l.ladders,...l.storyTerminals,...l.platforms].some(p=>p.x+p.w>x-20&&p.x<x+280+20)||l.checkpoints.some(c=>c>x-55&&c<x+335)||l.pickups.some(p=>p.x>x-30&&p.x<x+310)
    if(!blocked){at=x;break}
   }
  }
  if(at===undefined||added>=8){shaped.push(g);continue}
  const rise=-Math.min(added%2?28:36,g.y-300),base=g.y+g.h
  shaped.push({...g,w:at-g.x},{x:at,y:g.y,w:140,h:g.h,rise},{x:at+140,y:g.y+rise,w:140,h:base-g.y-rise,rise:-rise},{...g,x:at+280,w:g.x+g.w-at-280})
  for(const e of l.enemies)if(e.type!=='drone'&&Math.abs(e.y+e.h-g.y)<3&&e.x+e.w/2>=at&&e.x+e.w/2<=at+280){const x=e.x+e.w/2;e.y=e.homeY=g.y+rise*(x<=at+140?(x-at)/140:(at+280-x)/140)-e.h}
  last=at;added++
 }
 l.ground=shaped
}

// Apply the same final supply budget after each campaign has authored its route.
export function thinFieldSupplies(l:Level){const counts={med:0,armor:0,grenades:0};l.pickups=l.pickups.filter(p=>{const n=counts[p.type]++;return p.type==='med'&&p.x>l.width-1000||n%(p.type==='med'?6:4)!==1})}

// Visual contact on the first solid touched by the projectile's swept radius.
export function projectileContact(from:{x:number,y:number},to:{x:number,y:number},solids:Rect[],radius=3){
 const dx=to.x-from.x,dy=to.y-from.y;let best:{x:number,y:number,nx:number,ny:number,t:number}|null=null
 for(const p of solids){
  let near=0,far=1,nx=0,ny=0,valid=true
  for(const [origin,delta,min,max,ax,ay]of[[from.x,dx,p.x-radius,p.x+p.w+radius,1,0],[from.y,dy,p.y-radius,p.y+p.h+radius,0,1]]){
   if(Math.abs(delta!)<1e-9){if(origin!<min!||origin!>max!)valid=false;continue}
   const a=(min!-origin!)/delta!,b=(max!-origin!)/delta!,entry=Math.min(a,b)
   if(entry>near){near=entry;nx=ax?-Math.sign(delta!):0;ny=ay?-Math.sign(delta!):0}far=Math.min(far,Math.max(a,b));if(near>far)valid=false
  }
  if(!valid||far<0||near>1||best&&near>=best.t)continue
  if(!nx&&!ny){nx=Math.abs(dx)>=Math.abs(dy)?-Math.sign(dx):0;ny=nx?0:-Math.sign(dy)}
  let x=Math.max(p.x,Math.min(p.x+p.w,from.x+dx*near)),y=Math.max(p.y,Math.min(p.y+p.h,from.y+dy*near))
  if(nx)x=nx<0?p.x:p.x+p.w;if(ny)y=ny<0?p.y:p.y+p.h
  best={x,y,nx,ny,t:near}
 }
 return best
}
