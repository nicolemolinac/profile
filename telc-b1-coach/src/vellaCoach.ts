import'./bellaCoach.css';

type Progress={known?:string[];listenDone?:number;listenCorrect?:number;speakDone?:number;writeDone?:number};
const GOOD=['Sehr gut!','Klasse!','Super gemacht!','Richtig! Weiter so!','Das war stark!'];
const TRY=['Fast! Versuch es noch einmal.','Kein Problem. Du schaffst das!','Weiter so – du kannst das!','Nicht aufgeben!','Beim nächsten Mal klappt es!'];
const SPEAK=['Sehr gut! Übung macht den Meister.','Toll! Weiter sprechen!','Klasse – du wirst sicherer!'];
const IDLE=['Na, versuchen wir es?','Du schaffst das!','Ich warte auf deine Antwort …','Komm, noch eine Aufgabe!'];
const pick=(a:string[])=>a[Math.floor(Math.random()*a.length)];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));
const setText=(el:Element|null,v:string)=>{if(el&&el.textContent!==v)el.textContent=v};

// Maltese-style caricature based on real breed traits: long silky white coat, black round eyes,
// compact muzzle, black nose, and distinctly low, floppy ears covered in hair.
function malteseSvg(){return `<svg class="bella-svg" viewBox="0 0 240 240" role="img" aria-label="Bella, perrita maltés">
<defs>
 <linearGradient id="fur" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".55" stop-color="#fbfbfd"/><stop offset="1" stop-color="#e9e5ee"/></linearGradient>
 <linearGradient id="earfur" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#faf9fc"/><stop offset="1" stop-color="#e9e5ee"/></linearGradient>
</defs>
<ellipse class="bella-shadow" cx="120" cy="215" rx="72" ry="11" fill="#2f2740" opacity=".10"/>
<!-- tail -->
<path class="bella-tail" d="M171 164c35-21 50 4 32 19-10 8-26 4-34-3" fill="none" stroke="#f7f6fa" stroke-width="18" stroke-linecap="round"/>
<!-- body and floor-length coat -->
<path class="bella-body" d="M72 138c4-31 25-49 48-49 28 0 49 20 52 53l10 58c2 14-10 20-23 13l-19-10c-8 14-34 14-42 0l-20 10c-14 6-26-3-21-19Z" fill="url(#fur)" stroke="#ddd8e5" stroke-width="2.4"/>
<!-- long dropped Maltese ears behind face -->
<path class="bella-ear bella-ear-left" d="M80 63c-25-3-43 13-45 40-2 30 16 57 37 67 11 5 20-3 16-14-8-22-7-47 3-67 7-14 3-24-11-26Z" fill="url(#earfur)" stroke="#d9d4e1" stroke-width="3"/>
<path class="bella-ear bella-ear-right" d="M160 63c25-3 43 13 45 40 2 30-16 57-37 67-11 5-20-3-16-14 8-22 7-47-3-67-7-14-3-24 11-26Z" fill="url(#earfur)" stroke="#d9d4e1" stroke-width="3"/>
<!-- extra ear hair strands -->
<path d="M52 91c5 18 10 39 22 57M188 91c-5 18-10 39-22 57" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".9"/>
<!-- round Maltese head -->
<path class="bella-head" d="M69 91c0-42 20-68 51-68s51 26 51 68c0 42-22 72-51 72S69 133 69 91Z" fill="url(#fur)" stroke="#ddd8e5" stroke-width="2.5"/>
<!-- silky crown / center-parted fringe -->
<path d="M77 62c8-26 25-40 43-40 19 0 36 14 43 40-12-10-23-12-34-6-6 3-12 4-18 0-11-6-22-4-34 6Z" fill="#fff"/>
<path d="M120 28c-1 17-2 28-8 40M120 28c2 17 3 28 10 40" fill="none" stroke="#ece9f0" stroke-width="3" stroke-linecap="round"/>
<!-- eye fur framing -->
<path d="M82 87c8-9 21-11 30-4M128 83c9-7 22-5 30 4" fill="none" stroke="#ebe7ef" stroke-width="7" stroke-linecap="round"/>
<!-- large dark Maltese eyes -->
<ellipse class="bella-eye bella-eye-left" cx="97" cy="101" rx="10" ry="11" fill="#1f1c25"/>
<ellipse class="bella-eye bella-eye-right" cx="143" cy="101" rx="10" ry="11" fill="#1f1c25"/>
<circle cx="94" cy="97" r="3" fill="#fff"/><circle cx="140" cy="97" r="3" fill="#fff"/>
<!-- muzzle beard -->
<ellipse cx="120" cy="129" rx="34" ry="26" fill="#fff" opacity=".98"/>
<path d="M108 118c6-7 18-7 24 0-1 9-7 14-12 14s-11-5-12-14Z" fill="#1d1a22"/>
<path class="bella-mouth-happy" d="M102 137c10 11 26 11 36 0" fill="none" stroke="#7d6477" stroke-width="3.4" stroke-linecap="round"/>
<path class="bella-mouth-sad" d="M103 147c10-9 24-9 34 0" fill="none" stroke="#7d6477" stroke-width="3.4" stroke-linecap="round"/>
<ellipse class="bella-tear" cx="154" cy="118" rx="3.5" ry="7" fill="#70c9f3"/>
<!-- front paws -->
<g class="bella-paws"><path class="bella-paw-left" d="M83 163c-14 12-17 37-5 45 13 8 25-4 29-27l2-17Z" fill="url(#fur)" stroke="#ddd8e5" stroke-width="2"/><path class="bella-paw-right" d="M157 163c14 12 17 37 5 45-13 8-25-4-29-27l-2-17Z" fill="url(#fur)" stroke="#ddd8e5" stroke-width="2"/></g>
<!-- bow and collar -->
<g class="bella-bow"><path d="M102 46c-12-10-23-2-18 8 5 9 14 8 22 2M138 46c12-10 23-2 18 8-5 9-14 8-22 2" fill="#ef9bc1" stroke="#d97fad" stroke-width="2"/><circle cx="120" cy="52" r="8" fill="#e889b4"/></g>
<path d="M98 158h44l-6 14h-32Z" fill="#e889b4"/><circle cx="120" cy="171" r="5.5" fill="#ffd36f"/>
</svg>`}

let lastMessage='Du schaffst das!';let hideTimer:number|undefined;let idleTimer:number|undefined;
let audioCtx:AudioContext|null=null;
function bark(){try{const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return;audioCtx=audioCtx||new C();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;const noise=audioCtx.createBufferSource(),buf=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*.18),audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*.22));noise.buffer=buf;const f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();f.type='bandpass';f.frequency.value=520;f.Q.value=1.2;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.12,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+.18);noise.connect(f);f.connect(g);g.connect(audioCtx.destination);noise.start(now);noise.stop(now+.2)}catch{}}
function ensureMascot(){if(document.getElementById('bella-coach'))return;const el=document.createElement('div');el.id='bella-coach';el.className='bella-coach';el.innerHTML=`<div class="bella-bubble"><b>Bella</b><span>${esc(lastMessage)}</span></div><button class="bella-dog" aria-label="Bella sagt Hallo">${malteseSvg()}<span>BELLA</span></button>`;document.body.appendChild(el);el.querySelector('.bella-dog')?.addEventListener('click',()=>{bark();cheer('Wuff! Los geht’s!','good')})}
function setMood(kind:'good'|'try'|'sad'|'neutral'){const root=document.getElementById('bella-coach');if(!root)return;root.classList.remove('good','try','sad','talking');void(root as HTMLElement).offsetWidth;if(kind!=='neutral')root.classList.add(kind)}
export function cheer(message?:string,kind:'good'|'try'|'sad'|'neutral'='neutral'){ensureMascot();lastMessage=message||(kind==='good'?pick(GOOD):kind==='try'?pick(TRY):kind==='sad'?pick(IDLE):'Du schaffst das!');const root=document.getElementById('bella-coach');if(!root)return;const bubble=root.querySelector('.bella-bubble') as HTMLElement|null;setText(bubble?.querySelector('span')||null,lastMessage);setMood(kind);root.classList.add('talking');if(hideTimer)clearTimeout(hideTimer);hideTimer=window.setTimeout(()=>{root.classList.remove('talking');if(kind!=='sad')root.classList.remove('good','try')},3600)}
function resetIdle(){if(idleTimer)clearTimeout(idleTimer);document.getElementById('bella-coach')?.classList.remove('sad');idleTimer=window.setTimeout(()=>{const exercise=document.querySelector('.flash,.listenCard,.task,.sentenceCard');if(exercise)cheer(undefined,'sad')},24000)}
function readProgress():Progress{try{return JSON.parse(localStorage.getItem('telcb1')||'{}')}catch{return{}}}
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
function scores(p:Progress){const known=(p.known||[]).length,vocab=clamp(known/300*100),done=p.listenDone||0,correct=p.listenCorrect||0,accuracy=done?correct/done:0,sample=Math.min(1,done/20),listening=clamp(accuracy*sample*100),speaking=clamp((p.speakDone||0)/15*100),writing=clamp((p.writeDone||0)/12*100),readiness=clamp(vocab*.15+listening*.4+speaking*.25+writing*.2);return{vocab,listening,speaking,writing,readiness,done}}
let patching=false;
function patchHome(){if(patching)return;const stats=[...document.querySelectorAll('.stats .stat')] as HTMLElement[];if(stats.length<4)return;patching=true;const p=readProgress(),s=scores(p);const vals:[string,string,number|null,string][]=[['Listening',s.done?`${s.listening}%`:'Sin medir',s.done?s.listening:null,s.done?`${s.done} respuestas registradas`:'Responde ejercicios para medirlo'],['Speaking',(p.speakDone||0)?`${s.speaking}%`:'Sin medir',(p.speakDone||0)?s.speaking:null,'Basado en prácticas completadas'],['Writing',(p.writeDone||0)?`${s.writing}%`:'Sin medir',(p.writeDone||0)?s.writing:null,'Basado en bloques practicados'],['Vocab',`${s.vocab}%`,s.vocab,`${(p.known||[]).length}/300 palabras objetivo`]];stats.slice(0,4).forEach((el,i)=>{const[label,text,pct,note]=vals[i],bar=el.querySelector('.bar i') as HTMLElement|null;setText(el.querySelector('span'),label);setText(el.querySelector('b'),text);if(bar)bar.style.width=(pct??0)+'%';el.title=note});setText(document.querySelector('.orb strong'),s.readiness+'%');setText(document.querySelector('.orb span'),'progreso medido');patching=false}
function classifyClick(target:Element){const btn=target.closest('button');if(!btn)return;const txt=(btn.textContent||'').trim();if(txt.includes('Sí, fácil')||txt.includes('Ya lo sé')){resetIdle();setTimeout(()=>cheer(undefined,'good'),30);setTimeout(patchHome,100);return}if(txt.includes('Todavía no')){resetIdle();setTimeout(()=>cheer(undefined,'try'),30);setTimeout(patchHome,100);return}if(btn.closest('.options')){resetIdle();setTimeout(()=>{if(btn.classList.contains('right'))cheer(undefined,'good');else if(btn.classList.contains('wrong'))cheer(undefined,'try');patchHome()},50);return}if(txt.includes('Responder')){resetIdle();setTimeout(()=>cheer(pick(SPEAK),'good'),900);setTimeout(patchHome,1300)}}
function start(){ensureMascot();patchHome();resetIdle();document.addEventListener('click',e=>classifyClick(e.target as Element),true);let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patchHome()})});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',patchHome)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
