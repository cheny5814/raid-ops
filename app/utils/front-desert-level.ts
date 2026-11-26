import {clearLevelPatrols} from './front-enemy-placement.ts'
import {installLieutenants} from './front-boss-tactics.ts'
import {fortifyPatrols,addRoutePatrols} from './front-balance.ts'
import {thinFieldSupplies} from './front-route-features.ts'
import { FRONT_LEVELS,DIFFICULTIES,enemy,type Enemy, type Level } from './front.ts'
const text=(en:string,zh:string)=>({en,zh})
export const DESERT_RULES={rule:text('Choose between the sand floor and the fuel-depot rooftops. Ride fixed ziplines across the canyons, watch crosswinds, and shoot marked water-tower supports to cover quicksand.','在沙地与油站高处之间选择路线，借固定滑索跨越峡谷，留意沙暴侧风；击毁水塔支架可铺出流沙硬路。'),boss:text('Break the wheels to stop the Sand Scorpion. Its rear engine opens between cannon salvos; aim at the glowing vent.','先击毁轮组，阻止沙蝎装甲车冲撞；等炮击后的尾部散热口打开，再集中攻击引擎。'),weapon:text('Rifle / Piercing Rifle / Grenades','步枪 / 穿透步枪 / 手雷')}
export const DESERT_STORY={brief:text('Black Tide’s cargo records lead to a desert relay. Cross the abandoned fuel depot, seize the convoy coordinates and clear the canyon exit.','灰港货运记录指向沙漠中继站。穿越废弃加油站，夺取车队坐标，打通峡谷出口。'),intro:text("Control: Grayhaven records are confirmed. The relay is inland. Raven: Crossing the outpost. I’ll find their supply route.",'指挥部：灰港情报已确认，中继站位于沙漠腹地。渡鸦：正在穿越前哨，我会找到他们的补给路线。'),outcome:text('The Sand Scorpion is down. Convoy coordinates recovered. The canyon transport route is our next lead.','沙蝎装甲车已摧毁，运输坐标已取得。峡谷运输线将是下一步目标。'),next:text('Canyon Convoy is the next operation. This first desert mission is now complete.','下一场行动为峡谷运输线；当前已完成沙漠前哨首战。'),goals:[{title:text('Recover the desert route map','夺取沙漠路线图'),report:text('Route map secured. Reach the abandoned fuel depot.','路线图已取得，前往废弃加油站。')},{title:text('Trace the convoy fuel manifest','查明车队燃料清单'),report:text('Convoy records found. The canyon exit is guarded by an armored vehicle.','已找到车队记录；峡谷出口由装甲车把守。')},{title:text('Upload the relay coordinates','上传中继站坐标'),report:text('Coordinates transmitted. Neutralize the Sand Scorpion and open the route.','坐标已上传；摧毁沙蝎装甲车，打通路线。')}]}
export function createDesertLevel():Level{
 const width=67500,ground:Level['ground']=[],gaps:[[number,number],[number,number],[number,number],[number,number]]=[[8500,8950],[20700,21300],[38400,39000],[52800,53300]]
 let left=0;for(const [x,end]of gaps){ground.push({x:left,y:400,w:x-left,h:180});left=end}ground.push({x:left,y:400,w:width-left,h:180})
 const l:Level={id:0,biome:'desert',name:'沙海前哨',subtitle:'沙暴行动 / 赤砂峡谷与燃料基地',width,color:'#c18b51',difficulty:{...DIFFICULTIES[1]!,bulletSpeed:205,cooldown:1.7,windup:.34,runnerSpeed:80},
  dungeon:{name:'赤砂边境',description:'沿风蚀沙丘与岩壁推进，穿越流沙、燃料基地和跨谷滑索。',surface:'desert',chapters:['风蚀沙丘','废弃油站','赤砂峡谷','车队集结区']},
  ground,platforms:[],barriers:[],spikes:[],hazards:[],enemies:[],pickups:[],ropes:[],ladders:[],ziplines:[],encounters:[],missions:[],storyTerminals:[],checkpoints:[],setPieces:[],field:{decks:[],switches:[],bridges:[]},segments:[],desert:{sand:[],towerIds:[]}}
 // Authored dune chains have different lengths, slopes and sightlines. Armories stay on firm ground.
 const dunes=[[1000,520,44],[3650,660,55],[9400,580,40],[14700,720,50],[21800,640,52],[26700,720,46],[33800,600,48],[41800,800,60],[47900,660,42],[55400,780,55],[61300,620,46]]
 for(const[x,w,rise]of dunes){const i=l.ground.findIndex(g=>x>=g.x&&x+w<=g.x+g.w);if(i<0)continue;const g=l.ground[i]!;l.ground.splice(i,1,{x:g.x,y:400,w:x-g.x,h:180},{x,y:400,w:w*.46,h:180,rise:-rise},{x:x+w*.46,y:400-rise,w:w*.18,h:180+rise},{x:x+w*.64,y:400-rise,w:w*.36,h:180+rise,rise},{x:x+w,y:400,w:g.x+g.w-x-w,h:180})}
 const floor=(x:number)=>{const p=l.ground.find(g=>x>=g.x&&x<g.x+g.w);return p?p.y+(p.rise??0)*(x-p.x)/p.w:undefined}
 let serial=300000
 const spawn=(type:Enemy['type'],x:number,dy=0)=>{const e=enemy(serial++,type,x,false,false),y=floor(x+e.w/2);if(y===undefined)return null;e.y=e.homeY=y-e.h+dy;e.desert=true;e.zone=0;e.cooldown=.65+(e.id%5)*.17;e.drawScale=type==='heavy'?1.1:1;l.enemies.push(e);return e}
 for(const [i,x]of [5900,11800,17700,23900,30000].entries()){
  const first=[spawn('heavy',x+220),spawn('turret',x+460)].filter(Boolean) as Enemy[]
  const second=[spawn('soldier',x+120),spawn('drone',x+350,-115),spawn('runner',x+185)].filter(Boolean) as Enemy[]
  for(const e of second){e.dormant=true;e.wakeAfter=first.map(e=>e.id);e.wakeTimer=1}
  l.encounters.push({x,end:x+780,enemies:[...first,...second].map(e=>e.id)})
  l.missions.push({...FRONT_LEVELS[0]!.missions[i]!,encounter:i,title:['沙丘补给车','油站军械库','岩壁防空库','峡谷爆破库','中继能源库'][i]!})
  l.checkpoints.push(x-80)
 }
 // Skirmishes follow the terrain, rather than inheriting the dock's repeated obstacle modules.
 const stretches=[[400,5500,390],[7100,8300,350],[9700,11400,420],[13200,17300,440],[18800,20400,370],[21900,23500,380],[25100,29600,460],[31400,37900,410],[39800,47500,470],[48700,52300,430],[54000,60700,490],[62000,66100,390]]
 let n=0
 for(const[start,end,stride]of stretches)for(let x=start;x<end;x+=stride){
  const group=n++,type=(['soldier','runner','soldier','drone','heavy','soldier','sniper']as const)[group%7]!;spawn(type,x,type==='drone'?-110:0)
  // Patrols advance in ground/air formations, matching the harbor's route density.
  if(x+90<end)spawn(group%4===0?'runner':'soldier',x+90)
  if(x+190<end)spawn(group%3===0?'drone':group%3===1?'soldier':'sniper',x+190,group%3===0?-130:0)
 }
 for(const [i,[x,end]]of gaps.entries()){
  l.ziplines!.push({id:i,x:x-145,y:340,endX:end+90,endY:334})
  l.segments.push({x:x-210,name:['风蚀断崖 · 跨谷滑索','油站峡口 · 高低路线','赤砂深谷 · 长索穿越','车队山口 · 岩壁横渡'][i]!})
  l.checkpoints.push(x-220)
 }
 // Two optional ridgeline routes overlook the fuel depot and the convoy approach.
 for(const [x,w]of [[12800,270],[45400,320]]){l.platforms.push({x,y:315,w,h:20});l.ladders.push({id:l.ladders.length,x:x+35,y:315,w:26,h:85});const e=spawn('sniper',x+170);if(e)e.y=e.homeY=315-e.h}
 const sands=[2450,4900,10100,13700,16000,19400,22450,25800,28200,32500,36000,40200,43800,46100,49500,57200,59500,63300]
 for(const [i,x]of sands.entries()){
  const p=l.ground.find(g=>!g.rise&&x>=g.x+30&&x+230<g.x+g.w-30);if(!p)continue
  l.desert!.sand.push({x,y:p.y-4,w:200+(i%3)*15,h:22})
  if([0,3,8,12,16].includes(i)){const id=180000+i;l.barriers.push({id,x:x-30,y:p.y-165,w:25,h:165,hp:18,maxHp:18,material:'crate',waterTower:true});l.desert!.towerIds.push(id)}
 }
 for(const [i,x]of [10400,27300,44500,58100].entries())l.hazards.push({x,y:225,w:330,h:175,type:'gust',offset:i*1.1})
 // Fuel-station barricades are spaced independently from the armory fights.
 for(const [i,x]of [10600,22600,31500,35600,43900,58500].entries()){const required=i===1?'pulse':i===2?'rocket':i===3?'beam':undefined;l.barriers.push({id:190000+i,x,y:400-(required?240:44),w:required?45:55,h:required?240:44,hp:required?18:4,maxHp:required?18:4,material:required?'bunker':'crate',requiredWeapon:required})}
 // Staggered low barricades and overhead routes break up the long desert sightlines.
 for(const [i,x]of [1800,4200,7500,11100,15200,19800,23200,26600,29100,34200,37000,41000,45000,50300,54400,57700,60500,64200].entries()){
  const g=l.ground.find(g=>!g.rise&&x>=g.x+40&&x+76<g.x+g.w-40);if(!g||l.barriers.some(b=>x+160>b.x&&x-80<b.x+b.w)||l.desert!.sand.some(s=>x+140>s.x&&x-80<s.x+s.w))continue
  const h=[38,46,54][i%3]!;l.barriers.push({id:195000+i,x,y:g.y-h,w:i%2?68:54,h,hp:i%2?10:7,maxHp:i%2?10:7,material:i%2?'bunker':'crate'})
  if(i%3===1){l.platforms.push({x:x+110,y:g.y-82,w:165,h:18});const guard=spawn('soldier',x+200);if(guard)guard.y=guard.homeY=g.y-82-guard.h}
 }
 for(const [i,encounter]of [1,3,4].entries()){const a=l.encounters[encounter]!;l.storyTerminals.push({id:`sand-outpost-${i}`,encounter,goal:i,kind:i===2?'uplink':'intel',duration:i===2?3:.3,x:a.end-95,y:356,w:28,h:44})}
 for(const [i,x]of [1600,5400,9800,14200,18800,22900,28000,33300,40300,46500,52300,58400,66950].entries()){const y=floor(x);if(y===undefined)continue;l.pickups.push({id:i*2,x,y:y-22,type:'med',taken:false});l.pickups.push({id:i*2+1,x:x+130,y:(floor(x+130)??y)-22,type:i%3===1?'grenades':'armor',taken:false})}
 l.checkpoints.push(33500,45500,56000,width-720);l.checkpoints.sort((a,b)=>a-b)
 for(const [x,name]of [[0,'风蚀沙丘 · 起伏沙脊'],[11600,'废弃油站 · 燃料与军械'],[20700,'赤砂峡谷 · 沿岩壁穿越'],[39300,'车队集结区 · 高地侦察'],[width-850,'峡谷出口 · 沙蝎封锁']]as const)l.segments.push({x,name})
 l.segments.sort((a,b)=>a.x-b.x)
 const boss=enemy(90000,'tank',width-320,true,true);boss.desert=true;boss.desertBoss=true;boss.zone=0;boss.w=155;boss.h=78;boss.y=boss.homeY=322;boss.hp=boss.maxHp=150;boss.parts={tracks:48,gun:0,engine:102};l.enemies.push(boss)
 // Barricades are authored after patrols; move any overlapping spawn to a clear flank.
 for(const e of l.enemies){if(e.boss||e.dormant)continue
  const overlaps=(x:number,y:number)=>l.barriers.some(b=>x+e.w>b.x&&x<b.x+b.w&&y+e.h>b.y&&y<b.y+b.h)
  if(!overlaps(e.x,e.y))continue
  for(const dx of[-80,80,-140,140,-220,220]){const x=e.x+dx,y=floor(x+e.w/2);if(y===undefined)continue;const top=y-e.h+(e.type==='drone'?-110:0);if(overlaps(x,top))continue;e.x=e.home=x;e.y=e.homeY=top;break}
 }
 thinFieldSupplies(l)
 addRoutePatrols(l)
 fortifyPatrols(l)
 installLieutenants(l)
 clearLevelPatrols(l)
 return l
}
export const DESERT_LEVEL=createDesertLevel()
