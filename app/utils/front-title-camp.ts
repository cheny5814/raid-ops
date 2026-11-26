import {rect,line,polygon,disc,metal,glow} from './front-art'
import {drawFieldCrate} from './front-materials'
type C=CanvasRenderingContext2D
// Layered staging-area scenery stays inside the illustration column, clear of the title and actions.
export function drawTitleCamp(c:C,left:number,right:number,time:number,reduced=false){
 const span=right-left;if(span<105)return
 const mast=right-23,t=reduced?0:time
 c.save()
 // A transport aircraft and distant navigation lamps fill the upper skyline.
 const s=Math.min(1.1,span/300),margin=72*s+8,travel=Math.max(0,span-margin*2)
 const flightX=left+span/2+Math.sin(t*.23)*travel*.5,flightY=113+(reduced?0:Math.sin(t*.46)*9)
 c.save();c.translate(flightX,flightY);c.scale(s,s);c.rotate(reduced?0:Math.cos(t*.23)*.035)
 polygon(c,[-31,3,-19,-8,10,-8,27,-1,31,8,18,13,-22,12],'#263e50')
 polygon(c,[-25,3,-57,-3,-62,-10,-68,-10,-65,8,-29,10],'#294657')
 polygon(c,[11,-6,24,0,17,4,7,2],'#86a4a0');line(c,[-18,-8,8,-8],'#68848e',1)
 metal(c,-7,-15,5,8,'#68848d','#263f51',1)
 // Translucent rotor disc keeps the fast blades soft, rather than flashing.
 c.fillStyle='#9eb7bb12';c.beginPath();c.ellipse(-2,-15,48,2.5,0,0,Math.PI*2);c.fill()
 for(const phase of[0,Math.PI/2]){const angle=reduced?phase:t*31+phase,dx=Math.cos(angle)*47,dy=Math.sin(angle)*2.2;line(c,[-2-dx,-15-dy,-2+dx,-15+dy],'#8aa2a68c',1.1)}
 c.save();c.translate(-64,-2);c.rotate(reduced?0:t*29);line(c,[-3,0,3,0,0,0,0,-3,0,3],'#8ba6a18c',.8);c.restore()
 line(c,[-20,15,-20,20,21,20,25,16],'#6e8790',1.5);disc(c,-33,7,1.4,'#d6a372');disc(c,27,8,1.3,'#9bc8b1')
 c.restore()
 // Mast, dish, guy wires and a restrained work light sit behind the operative.
 line(c,[mast-36,410,mast,190,mast+15,410],'#344f60',2)
 metal(c,mast-3,187,6,223,'#6d8790','#263f52',1)
 for(let y=207;y<400;y+=25){line(c,[mast-10,y,mast+8,y+15],'#5b7783',1);line(c,[mast-4,y,mast+5,y],'#94a5a180',.7)}
 line(c,[mast-17,196,mast+15,196],'#93aaa5',2);line(c,[mast,179,mast,205],'#acb9ac',1.5)
 c.save();c.translate(mast-7,231);c.rotate(-.3);polygon(c,[-22,-12,-13,8,0,15,16,8,23,-12,3,4],'#6e8b91');line(c,[-19,-10,2,5,20,-10],'#adc0b3',1);line(c,[2,5,9,-14],'#c4cbbb',1.1);disc(c,9,-14,2,'#d7c491');c.restore()
 const lightY=265,lightX=mast-23
 const targetX=left+span*(.18+.5*(.5+.5*Math.sin(t*.28-.7))),targetY=389+Math.sin(t*.28)*12
 const angle=Math.atan2(targetY-lightY,targetX-lightX),dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx,beam=Math.min(46,span*.13)
 line(c,[mast,lightY+7,lightX,lightY+7],'#607a86',3);disc(c,lightX,lightY,4,'#90a49c')
 c.save();c.translate(lightX,lightY);c.rotate(angle)
 metal(c,-11,-6,17,12,'#a2afa3','#3d5969',2);rect(c,4,-4,3,8,'#e7d8ab',.5);c.restore()
 const originX=lightX+dx*7,originY=lightY+dy*7,cone=c.createLinearGradient(originX,originY,targetX,targetY)
 cone.addColorStop(0,'#f0dba92e');cone.addColorStop(.6,'#e8d5a316');cone.addColorStop(1,'#e8d5a300')
 c.save();c.beginPath();c.rect(left,65,span,347);c.clip()
 polygon(c,[originX+nx*3,originY+ny*3,originX-nx*3,originY-ny*3,targetX-nx*beam,targetY-ny*beam,targetX+nx*beam,targetY+ny*beam],cone as unknown as string)
 c.restore()

 c.restore()
}
export function drawTitleSupplies(c:C,left:number,right:number){
 const span=right-left;if(span<105)return
 c.save()
 const x=right-84
 drawFieldCrate(c,x,376,57,36)
 drawFieldCrate(c,x+7,351,43,24)
 metal(c,x+60,382,18,30,'#7b8c7a','#344e56',3);for(const y of[387,404])line(c,[x+61,y,x+77,y],'#a2afa1',1)
 if(span>270){const caseX=left+25;metal(c,caseX,390,43,22,'#92a38b','#3a565b',3);rect(c,caseX+3,394,37,3,'#bda46d');for(const px of[caseX+9,caseX+30])rect(c,px,391,3,8,'#263e4c',.6);line(c,[caseX+16,389,caseX+16,386,caseX+28,386,caseX+28,389],'#bbc4aa',1.3)}
 for(const px of[left+10,right-8]){metal(c,px,392,5,20,'#8ba098','#3b5665',1);disc(c,px+2.5,392,2,'#d6b378');glow(c,px+2,391,11,'#d8be85',.08)}
 c.restore()
}
