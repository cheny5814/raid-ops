const clamp=(v:number)=>Math.max(0,Math.min(1,v))
const smooth=(v:number)=>{const t=clamp(v);return clamp(t*t*t*(10+t*(-15+6*t)))}
// The full turn ends before landing; tuck and extension overlap without pose jumps.
export function frontFlip(age:number,vy:number){
 const p=clamp(age/.52)
 return{turn:smooth(p),fold:smooth((p-.06)/.23)*(1-smooth((p-.57)/.35)),open:smooth((p-.65)/.35)*smooth((vy-30)/350)}
}
