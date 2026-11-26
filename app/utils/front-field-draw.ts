import type {Level,Run} from './front'
import {movingDeck,switchOn,fieldControls} from './front-field'
import {rect,line,polygon,disc,metal} from './front-art'
import {frontFont} from './front-font'
export function drawField(c:CanvasRenderingContext2D,l:Level,r:Run,camera:number,width:number,language:'en'|'zh'='zh'){
 const f=l.field;if(!f)return
 for(const d of f.decks){const p=movingDeck(l,r,d);if(p.x+p.w<camera-40||p.x>camera+width+40)continue
  if(d.kind==='barge'){
   polygon(c,[p.x-8,p.y+7,p.x+p.w+8,p.y+7,p.x+p.w-12,p.y+29,p.x+13,p.y+29],'#284e60');line(c,[p.x,p.y+9,p.x+p.w,p.y+9],'#7da9ad',2);rect(c,p.x+8,p.y+2,p.w-16,6,'#7d8c7d')
   for(let x=p.x+15;x<p.x+p.w-8;x+=24){rect(c,x,p.y+13,14,4,'#183543',1);disc(c,x+5,p.y+21,1,'#8a9d97')}
   for(const x of[p.x+22,p.x+p.w-22]){metal(c,x,p.y-10,5,12,'#a1afa1','#476575',1);line(c,[x-3,p.y-10,x+8,p.y-10],'#bcc4aa',2)}
   for(let i=0;i<4;i++){const x=p.x-14-i*12;line(c,[x,p.y+27,x+8,p.y+28],'#91c0c577',1)}
  }else{
   for(const x of[d.x+12,d.x+d.w-12]){metal(c,x,d.y+Math.min(0,d.dy)-12,4,Math.abs(d.dy)+45,'#758e98','#294655',1);for(let y=d.y+Math.min(0,d.dy);y<d.y+Math.max(0,d.dy)+20;y+=20)line(c,[x-3,y,x+7,y],'#3a5665',2)}
   metal(c,p.x,p.y,p.w,14,'#a2ada0','#405c6b',2);rect(c,p.x+4,p.y+2,p.w-8,3,'#d0bf83');for(let x=p.x+12;x<p.x+p.w-10;x+=20)line(c,[x,p.y+2,x+6,p.y+5],'#4b564b',3)
   if(d.kind==='shuttle'){line(c,[d.x,d.y-24,d.x+d.dx+d.w,d.y+d.dy-24],'#476575',4);line(c,[p.x+20,p.y-24,p.x+20,p.y,p.x+p.w-20,p.y,p.x+p.w-20,p.y-24],'#8ea2a1',1.5)}
  }
  c.font=frontFont(8,language);c.textAlign='center';c.fillStyle='#cfdbcb';c.fillText(language==='en'?(d.kind==='barge'?"Cargo barge":d.kind==='lift'?"Freight lift":"Service shuttle"):(d.kind==='barge'?'货运浮台':d.kind==='lift'?'货运升降台':'检修穿梭台'),p.x+p.w/2,p.y-17)
 }
 for(const s of f.switches){const active=switchOn(r,s.id)
  // A remote console leaving the viewport must never hide a collidable gate.
  for(const b of s.doors??[]){if(b.x+b.w<camera-40||b.x>camera+width+40)continue
   line(c,[b.x-28,b.y+b.h-3,b.x+b.w/2,b.y+b.h-3,b.x+b.w/2,b.y],'#617e7b',1)
   metal(c,b.x-5,b.y-6,b.w+10,9,'#8a9f9e','#304e60',1)
   if(!active){metal(c,b.x,b.y,b.w,b.h,'#748c94','#2b485b',1);for(let y=b.y+10;y<b.y+b.h;y+=15){line(c,[b.x+3,y,b.x+b.w-3,y],'#263e50',2);rect(c,b.x+5,y+3,b.w-10,2,'#baa276')}}
   disc(c,b.x+b.w/2,b.y-2,2,active?'#a0d4ad':'#d39779')
  }
  for(const p of fieldControls(s)){if(p.x+25<camera-40||p.x>camera+width+40)continue
   metal(c,p.x,p.y,25,32,'#92a49d','#355462',2);rect(c,p.x+4,p.y+4,17,12,'#193744',1);rect(c,p.x+6,p.y+6,13,7,active?'#87b79c':'#bd9c64',1)
   line(c,[p.x+7,p.y+24,p.x+7,p.y+20,p.x+15,p.y+(active?17:24)],'#c4cbb6',2);disc(c,p.x+19,p.y+24,2,active?'#a0d4ad':'#e5bd7e')
   if(Math.abs(p.x-r.x)<230){c.font=frontFont(9,language);c.textAlign='center';c.fillStyle=active?'#a7d5b5':'#ebcc94'
    c.fillText(p.door?(language==='en'?(active?'Gate open':'Gate locked'):(active?'闸门已打开':'闸门已锁定')):s.label[language],p.x+12,p.y-20)
    c.fillStyle='#c9dad0';c.fillText(p.door?(language==='en'?(active?'E close gate':'E open gate'):(active?'E 关闭闸门':'E 打开闸门')):(language==='en'?'E operate':'E 操作'),p.x+12,p.y-7)
   }
  }
 }
 for(const p of f.bridges){if(p.deck.x+p.deck.w<camera-50||p.deck.x>camera+width+50)continue
  const b=r.barriers.find(b=>b.id===p.target),ready=p.kind==='sentry'?r.tactics.some(t=>t.target===p.target&&['allied','spent'].includes(t.state)):b&&b.hp<=0
  if(p.kind==='billboard'&&b&&!ready){metal(c,b.x-10,b.y+8,b.w+20,69,'#9ca499','#3b5463',2);rect(c,b.x-6,b.y+14,b.w+12,47,'#5c6577');line(c,[b.x-3,b.y+26,b.x+b.w+3,b.y+26],'#d7b479',2);line(c,[b.x-3,b.y+35,b.x+b.w-4,b.y+35],'#9dafa9',2);for(const x of[b.x+3,b.x+b.w-5])metal(c,x,b.y+75,3,b.h-75,'#6f8790','#2b4354');c.font=frontFont(8,language);c.textAlign='center';c.fillStyle='#d8bd85';c.fillText(language==='en'?"Shoot support":'射击支架',b.x+b.w/2,b.y-8)}
  if(ready){metal(c,p.deck.x,p.deck.y,p.deck.w,p.deck.h,'#9da89a','#375362',2);for(let x=p.deck.x+8;x<p.deck.x+p.deck.w;x+=22)line(c,[x,p.deck.y+3,x+7,p.deck.y+9],'#bfa773',2)}
 }
}
