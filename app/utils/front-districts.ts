import type {Level,Rect,Enemy} from './front.ts'
import {surfaceY} from './front-route-features.ts'
function slice(g:Rect,x:number,end:number):Rect{const y=surfaceY(g,x);return{x,y,w:end-x,h:g.y+g.h-y,...(g.rise?{rise:surfaceY(g,end)-y}:{})}}
function room(l:Level,start:number,end:number,name:string){
 if(l.encounters.some(a=>a.x<end&&a.end>start)||l.storyTerminals.some(t=>t.x<end&&t.x+t.w>start))throw Error('District overlaps mission: '+name)
 const left=l.ground.find(p=>start>=p.x&&start<p.x+p.w),right=l.ground.find(p=>end>=p.x&&end<p.x+p.w)??l.ground.filter(p=>p.x>=end).sort((a,b)=>a.x-b.x)[0],floor=left?surfaceY(left,start):400,exit=right?surfaceY(right,end):floor
 l.ground=l.ground.flatMap(g=>{if(g.x+g.w<=start||g.x>=end)return[g];return[...(g.x<start?[slice(g,g.x,start)]:[]),...(g.x+g.w>end?[slice(g,end,g.x+g.w)]:[])]})
 for(const key of ['platforms','hazards','spikes','ropes','ladders','pickups']as const){const items=l[key];for(let i=items.length-1;i>=0;i--)if(items[i]!.x>=start&&items[i]!.x<end)items.splice(i,1)}
 l.enemies=l.enemies.filter(e=>e.x<start||e.x>=end||e.boss)
 l.barriers=l.barriers.filter(b=>b.x<start||b.x>=end||b.requiredWeapon)
 for(const b of l.barriers)if(b.x>=start&&b.x<end){b.x=end-140;b.y=exit-b.h}
 l.checkpoints=l.checkpoints.filter(x=>x<start||x>=end);l.checkpoints.push(start-70)
 l.segments=l.segments.filter(s=>s.x<start||s.x>=end);l.segments.push({x:start,name})
 let serial=220000+l.id*10000+start
 const ground=(x:number,w:number,dy=0,rise=0)=>l.ground.push({x:start+x,y:floor+dy,w,h:580-floor-dy,...(rise?{rise}:{})})
 const deck=(x:number,y:number,w:number)=>l.platforms.push({x:start+x,y:floor+y,w,h:14})
 const spawn=(type:Enemy['type'],x:number,dy=0)=>{const t=l.enemies.find(e=>e.type===type&&!e.boss)??l.enemies.find(e=>!e.boss)!;const h=type==='drone'?25:type==='turret'?38:38,w=type==='turret'?38:28,hp=type==='heavy'?22:type==='turret'?10:type==='drone'?8:5;const e:Enemy={...t,id:serial++,type,x:start+x,home:start+x,y:floor+dy-h,homeY:floor+dy-h,w,h,hp,maxHp:hp,boss:false,guard:false,dormant:false,wakeAfter:undefined,wakeTimer:undefined,tower:undefined,crossfire:undefined,role:type==='heavy'&&l.id===3?'shield':type==='soldier'&&l.id===0?'boarding':undefined,zone:l.id,age:0,windup:0,cooldown:.8,aim:Math.PI,volleys:0,drawScale:1};l.enemies.push(e);return e}
 const finish=()=>{ground(end-start-200,200,0,exit-floor);l.ground.sort((a,b)=>a.x-b.x);l.checkpoints.sort((a,b)=>a-b);l.segments.sort((a,b)=>a.x-b.x)}
 return{ground,deck,spawn,floor,exit,finish,size:end-start}
}
const labels=[['Tidal cargo crossing','潮汐货运航道'],['Assembly line bypass','装配线停机通道'],['Skyway service shuttle','高架检修穿梭台'],['Bunker flanking route','堡垒侧翼突入'],['Rooftop billboard crossing','屋顶广告牌通路'],['Power routing chamber','供电切换机房']]
export function installDistricts(l:Level){
 l.districts=[]
 l.field={decks:[],switches:[],bridges:[]}
 // Each chapter has authored rooms of different lengths, away from armory and story gates.
 const ranges:[[number,number],[number,number],[number,number]]=[[1600,4100],[20000,22600],[38600,40800]]
 for(const [index,[start,end]]of ranges.entries()){
  const name=labels[l.id]![1]+' / '+(index+1);l.districts.push({x:start,end,name});const r=room(l,start,end,name),size=r.size,circuit=100+l.id*10+index,field=l.field
  if(l.id===0){
   if(index===0){
    r.ground(0,640);r.ground(770,size-970);r.deck(150,-65,180);r.deck(365,-105,155);r.deck(875,-75,205)
    r.spawn('soldier',480);r.spawn('turret',1030,-75);r.spawn('drone',1370,-110)
    l.hazards.push({x:start+210,y:r.floor-20,w:360,h:20,type:'tide',offset:1})
   }else if(index===1){
    r.ground(0,640);r.ground(1120,size-1320)
    field.decks.push({id:circuit,kind:'barge',x:start+610,y:r.floor-14,w:180,h:18,dx:390,dy:0,period:8})
    r.deck(150,-65,200);r.deck(1320,-70,190);r.spawn('soldier',1440,-70);r.spawn('drone',1750,-100)
   }else{
    r.ground(0,size-200);r.deck(170,-65,200);r.deck(470,-105,200);r.deck(765,-65,200);r.deck(1090,-100,210)
    field.switches.push({id:circuit,x:start+70,y:r.floor-32,label:{en:"Open floodgate",zh:'开启排水闸'}})
    l.hazards.push({x:start+290,y:r.floor-22,w:980,h:22,type:'tide',offset:0,circuit})
    r.spawn('soldier',560,-105);r.spawn('turret',1160,-100);r.spawn('drone',1500,-130)
   }
  }else if(l.id===1){
   r.ground(0,size-200)
   field.switches.push({id:circuit,x:start+130,y:r.floor-32,label:{en:"Stop press / start lift",zh:'停止冲压 · 启动货梯'},doors:[{x:start+1130,y:r.floor-175,w:30,h:175}]})
   for(const x of [480,790])l.hazards.push({x:start+x,y:r.floor-120,w:80,h:120,type:'crusher',offset:index+x/100,circuit})
   l.hazards.push({x:start+350,y:r.floor-10,w:610,h:10,type:'conveyor',offset:index,circuit})
   r.deck(370,-85,170);r.deck(670,-85,160)
   field.decks.push({id:circuit,kind:'lift',x:start+1440,y:r.floor-5,w:180,h:16,dx:0,dy:-92,period:7,circuit})
   r.deck(1640,-92,250);r.spawn('heavy',1010);r.spawn('soldier',1750,-92);r.spawn('drone',2040,-130)
  }else if(l.id===2){
   r.ground(0,600);r.ground(1410,size-1610)
   r.deck(570,-65,150);r.deck(975,-100,160);r.deck(1330,-45,170)
   field.decks.push({id:circuit,kind:'shuttle',x:start+660,y:r.floor-60,w:175,h:16,dx:570,dy:-10,period:9})
   l.ziplines??=[];l.ziplines.push({id:100+index,x:start+430,y:r.floor-65,endX:start+1530,endY:r.floor-80})
   l.hazards.push({x:start+825,y:r.floor-190,w:300,h:170,type:'gust',offset:index})
   r.spawn('drone',1080,-140);r.spawn('soldier',1640);r.spawn('drone',1960,-150)
  }else if(l.id===3){
   r.ground(0,310);r.ground(310,260,0,-45);r.ground(570,600,-45);r.ground(1170,260,-45,45);r.ground(1430,size-1630)
   r.deck(380,-130,160);r.deck(700,-170,170);r.deck(1210,-120,170)
   const sentry=r.spawn('turret',890,-45);r.spawn('heavy',680,-45);r.spawn('soldier',1490);r.spawn('drone',1740,-120)
   field.bridges.push({target:sentry.id,kind:'sentry',deck:{x:start+870,y:r.floor-170,w:350,h:14}})
  }else if(l.id===4){
   r.ground(0,600);r.ground(810,size-1010);r.deck(170,-70,210);r.deck(905,-90,210)
   const target=240000+start
   l.barriers.push({id:target,x:start+570,y:r.floor-135,w:28,h:135,hp:8,maxHp:8,material:'crate',billboard:true})
   field.bridges.push({target,kind:'billboard',deck:{x:start+580,y:r.floor-12,w:250,h:14}})
   field.decks.push({id:circuit,kind:'lift',x:start+1400,y:r.floor-4,w:155,h:16,dx:0,dy:-100,period:7})
   r.deck(1570,-100,240);l.hazards.push({x:start+1000,y:r.floor-165,w:260,h:165,type:'searchlight',offset:index})
   r.spawn('sniper',1700,-100);r.spawn('drone',1940,-135)
  }else{
   r.ground(0,size-200)
   field.switches.push({id:circuit,x:start+150,y:r.floor-32,label:{en:"Route auxiliary power",zh:'切换辅助供电'},doors:[{x:start+900,y:r.floor-190,w:35,h:190}]})
   for(const x of [480,710])l.hazards.push({x:start+x,y:r.floor-26,w:100,h:26,type:'surge',offset:x/100,circuit})
   field.decks.push({id:circuit,kind:'lift',x:start+1210,y:r.floor-6,w:160,h:16,dx:0,dy:-100,period:7,circuit})
   r.deck(1390,-100,220);r.deck(1700,-60,170);r.spawn('turret',1490,-100);r.spawn('heavy',1900)
  }
  r.spawn(index===1?'drone':'soldier',150,index===1?-115:0);r.spawn('drone',size-330,-125)
  r.finish()
  const coverX=end-440,support=l.ground.find(g=>!g.rise&&coverX>=g.x&&coverX+48<=g.x+g.w)
  if(support&&!l.barriers.some(b=>coverX+48>b.x&&coverX<b.x+b.w))l.barriers.push({id:280000+l.id*10000+index,x:coverX,y:support.y-38,w:48,h:38,hp:6,maxHp:6,material:index%2?'bunker':'crate'})
 }
 // Remove out-of-theme generic traps. Their authored replacements carry the chapter identity.
 l.checkpoints=l.checkpoints.map(x=>[0,-40,40,-80,80,-120,120,-180].map(dx=>x+dx).find(at=>l.ground.some(g=>!g.rise&&at>=g.x+2&&at+28<=g.x+g.w-2)&&!l.barriers.some(b=>at+28>b.x&&at<b.x+b.w))??x).sort((a,b)=>a-b)
 if(l.id===0){l.hazards=l.hazards.filter(h=>h.type==='tide');l.spikes=[]}
 if(l.id===2)l.hazards=l.hazards.filter(h=>h.type==='gust')
 if(l.id===4){for(const p of l.setPieces??[])if(p.kind==='escape'){p.kind='chase';const s=l.segments.find(s=>s.x===p.x);if(s)s.name='屋顶封锁追击 · 躲避锁定射线'}l.hazards=l.hazards.filter(h=>h.type==='searchlight');l.spikes=[]}
 if(l.id===5)l.spikes=[]
}
