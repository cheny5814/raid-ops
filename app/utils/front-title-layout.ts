// Bounds cover the running soldier and the complete rifle, in model coordinates.
const FIGURE_LEFT=-12,FIGURE_RIGHT=34
export function titleFigurePlacement(left:number,right:number,nominalScale:number){
  const available=Math.max(0,right-left),scale=Math.min(nominalScale,available/(FIGURE_RIGHT-FIGURE_LEFT))
  return {x:(left+right)/2-(FIGURE_LEFT+FIGURE_RIGHT)/2*scale,scale}
}
