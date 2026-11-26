import type {Level,Run} from './front.ts'
import {arcadeCamera} from './front-contra.ts'
export type BattleView={x:number,y:number,zoom:number,worldWidth:number,worldHeight:number,anchor:number,look:number,facing:number,requested:number,turnAge:number,playerX?:number}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
export function battleView(l:Level,r:Run,width:number,previous?:BattleView,dt=0):BattleView{
 if(l.biome==='desert'||l.id!==0){const base=arcadeCamera(l,r,width);return{...base,zoom:1,worldWidth:width,worldHeight:480,anchor:.29,look:1,facing:1,requested:1,turnAge:0,playerX:r.x}}
 // 港口全程使用同一视野和地面线；互动区、起跳及首领状态不再触发重新取景。
 // .18 锚点在 765 单位宽的全屏画面中仍保留 620 单位前方预警空间。
 const zoom=1,worldWidth=width,worldHeight=480,anchor=.18
 // Facing remains changed after a tap; only sustained real travel may steer the look-ahead.
 const dx=previous?.playerX===undefined?0:r.x-previous.playerX,moving=Math.abs(dx)>.02
 const requested=moving?(dx<0?-1:1):previous?.requested??(r.facing<0?-1:1)
 const turnAge=moving?(previous?.requested===requested?previous.turnAge+dt:0):0
 const facing=previous?(moving&&turnAge>=.18?requested:previous.facing):requested
 const weight=previous?1-Math.exp(-Math.max(0,dt)*7):1
 const look=previous?previous.look+(facing-previous.look)*(moving?weight:0):facing
 const base=arcadeCamera(l,r,worldWidth)
 const locked=l.setPieces?.some(p=>p.kind==='climb'&&r.x>p.x-50&&r.x<p.end+60)&&r.arcade.some(s=>s.phase==='active'||s.phase==='return')
 const x=locked?base.x:clamp(r.x-worldWidth*anchor-(1-look)*Math.min(36,worldWidth*.03),0,Math.max(0,l.width-worldWidth))
 const y=400-480*.78+base.y
 return{x,y,zoom,worldWidth,worldHeight,anchor,look,facing,requested,turnAge,playerX:r.x}
}
