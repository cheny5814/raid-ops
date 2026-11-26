import { createRun, MAX_HEALTH, WEAPON_ORDER, type Level, type Run } from './front.ts'
export type CampaignId = 'grayhaven' | 'sandstorm'
export type SavedSession = { campaign: CampaignId, levelId: number, savedAt: number, run: Run }
const VERSION = 1
const LIMIT = 4_000_000
const hash = (text: string) => { let n=2166136261; for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619); return (n>>>0).toString(16) }
const layouts = new WeakMap<Level,string>()
function layoutHash(level:Level) { let value=layouts.get(level); if(!value){value=hash(JSON.stringify(level));layouts.set(level,value)} return value }
const record = (v: unknown): v is Record<string, any> => !!v && typeof v==='object' && !Array.isArray(v)
// Reject truncated, non-finite or oversized data before it reaches the physics loop.
function jsonSafe(v: unknown, depth=0): boolean {
  if(depth>24)return false
  if(v===null||typeof v==='boolean'||typeof v==='string')return typeof v!=='string'||v.length<10000
  if(typeof v==='number')return Number.isFinite(v)
  if(Array.isArray(v))return v.length<10000&&v.every(item=>jsonSafe(item,depth+1))
  return record(v)&&Object.entries(v).every(([k,item])=>!['__proto__','constructor','prototype'].includes(k)&&jsonSafe(item,depth+1))
}
function fields(v:unknown, sample:Record<string,unknown>):boolean {
  if(!record(v))return false
  return Object.entries(sample).every(([key,item])=>item===undefined||item===null ? key in v || item===undefined : Array.isArray(item)?Array.isArray(v[key]):record(item)?fields(v[key],item):typeof v[key]===typeof item)
}
function arrayShape(v:unknown,sample:Record<string,unknown>) { return Array.isArray(v)&&v.every(item=>fields(item,sample)) }
function battlefield(v:Record<string,any>):boolean {
  return arrayShape(v.enemies,{id:0,type:'',x:0,y:0,w:0,h:0,hp:0,maxHp:0,home:0,homeY:0,cooldown:0,windup:0,aim:0,age:0,volleys:0,guard:false})
    && arrayShape(v.barriers,{id:0,x:0,y:0,w:0,h:0,hp:0,maxHp:0,material:''})
    && arrayShape(v.pickups,{id:0,x:0,y:0,type:'',taken:false})
    && arrayShape(v.interactives,{id:0,x:0,y:0,w:0,h:0,kind:'',hp:0,timer:0,triggered:false,heat:0,overheated:false})
    && arrayShape(v.arcade,{id:0}) && arrayShape(v.tactics,{id:0})
    && Array.isArray(v.arsenal)&&v.arsenal.includes('rifle')&&v.arsenal.every((w:unknown)=>WEAPON_ORDER.includes(w as any))&&v.arsenal.includes(v.weapon)
    && Array.isArray(v.storyCompleted)&&v.storyCompleted.every((id:unknown)=>typeof id==='string')
}
function validRun(v:unknown,level:Level):v is Run {
  if(!record(v)||!fields(v,createRun(level))||!jsonSafe(v)||!battlefield(v))return false
  if(v.status!=='playing'||!['raven','fox'].includes(v.operative)||v.hp<=0||v.hp>MAX_HEALTH||v.time<0||v.x< -1000||v.x>level.width+1000||Math.abs(v.y)>10000)return false
  if(!Array.isArray(v.initialArsenal)||!v.initialArsenal.every((w:unknown)=>WEAPON_ORDER.includes(w as any)))return false
  if(!arrayShape(v.bullets,{x:0,y:0,vx:0,vy:0,friendly:false,damage:0,life:0,pierce:0,hit:[],kind:''}))return false
  if(v.rope!==null&&!level.ropes.some(r=>r.id===v.rope)||v.ladder!==null&&!level.ladders.some(l=>l.id===v.ladder))return false
  if(v.zipline!==null&&(!fields(v.zipline,{id:0,t:0,speed:0})||!level.ziplines?.some(z=>z.id===v.zipline.id)))return false
  if(v.tacticalControl!==null&&!v.tactics.some((t:any)=>t.id===v.tacticalControl)||v.mountedGun!==null&&!v.interactives.some((p:any)=>p.id===v.mountedGun))return false
  if(v.saved!==null&&(!record(v.saved)||!fields(v.saved,{x:0,y:0,score:0,kills:0,armor:0,grenades:0,checkpoint:0})||!battlefield(v.saved)))return false
  return v.storyRequired===level.storyTerminals.length&&v.storyCompleted.every((id:string)=>level.storyTerminals.some(t=>t.id===id))
}
export function encodeSession(campaign:CampaignId,level:Level,run:Run,savedAt=Date.now()):string {
  const payload=JSON.stringify(run)
  if(!validRun(JSON.parse(payload),level))throw new Error('Battlefield cannot be saved')
  if(payload.length>LIMIT)throw new Error('Save is too large')
  return JSON.stringify({version:VERSION,campaign,levelId:level.id,savedAt,layout:layoutHash(level),payload,checksum:hash(payload)})
}
export function decodeSession(raw:string|null,levels:readonly Level[],desert:Level):SavedSession|null {
  if(!raw||raw.length>LIMIT+10000)return null
  try {
    const data=JSON.parse(raw)
    if(!record(data)||data.version!==VERSION||!['grayhaven','sandstorm'].includes(data.campaign)||!Number.isInteger(data.levelId)||!Number.isFinite(data.savedAt)||typeof data.payload!=='string'||hash(data.payload)!==data.checksum)return null
    const level=data.campaign==='sandstorm'&&data.levelId===desert.id?desert:data.campaign==='grayhaven'?levels.find(l=>l.id===data.levelId):null
    if(!level||data.layout!==layoutHash(level))return null
    const run=JSON.parse(data.payload)
    if(!validRun(run,level))return null
    // Transient sound notifications must not replay on restoration.
    run.soundEvents=[]
    return {campaign:data.campaign,levelId:data.levelId,savedAt:data.savedAt,run}
  } catch { return null }
}
