let ctx:AudioContext|null=null;
function ac(){
  if(typeof window==='undefined')return null;
  const C=(window.AudioContext||(window as any).webkitAudioContext) as typeof AudioContext|undefined;
  if(!C)return null;
  if(!ctx)ctx=new C();
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return ctx;
}
function tone(freq:number,start:number,duration:number,volume:number,type:OscillatorType='sine'){
  const c=ac();if(!c)return;
  const o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,c.currentTime+start);
  g.gain.setValueAtTime(0.0001,c.currentTime+start);
  g.gain.exponentialRampToValueAtTime(volume,c.currentTime+start+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+start+duration);
  o.connect(g);g.connect(c.destination);o.start(c.currentTime+start);o.stop(c.currentTime+start+duration+0.02);
}
export function playCorrect(){
  // Short, satisfying two-note chime. Positive without sounding like a videogame.
  tone(660,0,.12,.055,'sine');
  tone(880,.085,.18,.05,'sine');
  tone(1320,.17,.14,.025,'triangle');
}
export function playWrong(){
  // Soft low "oops" sound: noticeable, not aggressive.
  tone(220,0,.16,.045,'triangle');
  tone(165,.11,.20,.04,'triangle');
}

let last=0;
function once(fn:()=>void){const now=performance.now();if(now-last<180)return;last=now;fn()}

document.addEventListener('click',ev=>{
  const button=(ev.target as HTMLElement|null)?.closest('button') as HTMLButtonElement|null;
  if(!button)return;
  const text=(button.textContent||'').trim().toLowerCase();

  // Explicit self-evaluation buttons.
  if(text.includes('sí, fácil')||text.includes('ya lo sé')){once(playCorrect);return}
  if(text.includes('todavía no')){once(playWrong);return}

  // Listening answers receive .right / .wrong immediately after React updates state.
  if(button.closest('.options')){
    requestAnimationFrame(()=>{
      if(button.classList.contains('right'))once(playCorrect);
      else if(button.classList.contains('wrong'))once(playWrong);
    });
  }
},{capture:true});
