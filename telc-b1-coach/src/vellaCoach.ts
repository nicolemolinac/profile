import'./bellaCoach.css';

type Progress={known?:string[];listenDone?:number;listenCorrect?:number;speakDone?:number;writeDone?:number};
const GOOD=['Sehr gut!','Klasse!','Super gemacht!','Richtig! Weiter so!','Das war stark!'];
const TRY=['Fast! Versuch es noch einmal.','Kein Problem. Du schaffst das!','Weiter so – du kannst das!','Nicht aufgeben!','Beim nächsten Mal klappt es!'];
const SPEAK=['Sehr gut! Übung macht den Meister.','Toll! Weiter sprechen!','Klasse – du wirst sicherer!'];
const IDLE=['Na, versuchen wir es?','Du schaffst das!','Ich warte auf deine Antwort …','Komm, noch eine Aufgabe!'];
const pick=(a:string[])=>a[Math.floor(Math.random()*a.length)];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const setText=(el:Element|null,v:string)=>{if(el&&el.textContent!==v)el.textContent=v};

// Breed-specific Maltese silhouette: long white coat, rounded muzzle and LOW, DROPPED ears.
function malteseSvg(){return `<svg class="bella-svg" viewBox="0 0 220 220" role="img" aria-label="Bella, perrita maltés">
<defs>
 <linearGradient id="fur" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff"/><stop offset=".72" stop-color="#faf9fc"/><stop offset="1" stop-color="#e8e4ee"/></linearGradient>
 <filter id="soft"><feGaussianBlur stdDeviation=".45"/></filter>
</defs>
<ellipse class="bella-shadow" cx="111" cy="199" rx="65" ry="12" fill="#312642" opacity=".10"/>
<!-- tail -->
<path class="bella-tail" d="M163 147c31-18 45-1 31 15-8 9-22 5-29-2" fill="none" stroke="#f7f5fa" stroke-width="18" stroke-linecap="round"/>
<!-- body + long coat -->
<path class="bella-body" d="M65 121c5-28 25-42 46-42 25 0 45 17 49 47l9 57c2 13-9 20-21 14l-16-8c-7 12-34 12-42 0l-18 8c-13 5-23-4-19-17Z" fill="url(#fur)" stroke="#ddd8e6" stroke-width="2.5"/>
<!-- floppy ears BEHIND face -->
<path class="bella-ear bella-ear-left" d="M74 54c-24 2-38 22-34 48 3 22 17 41 34 46 7 2 13-4 10-12-7-19-4-43 5-60 5-10-3-23-15-22Z" fill="#f3f0f6" stroke="#dcd6e4" stroke-width="3"/>
<path class="bella-ear bella-ear-right" d="M148 54c24 2 38 22 34 48-3 22-17 41-34 46-7 2-13-4-10-12 7-19 4-43-5-60-5-10 3-23 15-22Z" fill="#f3f0f6" stroke="#dcd6e4" stroke-width="3"/>
<!-- fluffy round head -->
<path class="bella-head" d="M67 84c0-38 18-62 44-62 29 0 47 23 47 62 0 37-20 66-47 66S67 121 67 84Z" fill="url(#fur)" stroke="#ddd8e6" stroke-width="2.5"/>
<!-- top-knot / fluffy crown -->
<path d="M76 55c8-23 22-34 36-34 17 0 31 11 38 34-10-8-19-9-28-5-7 3-14 3-21 0-9-4-17-2-25 5Z" fill="#fff"/>
<!-- eyes -->
<ellipse class="bella-eye bella-eye-left" cx="91" cy="89" rx="8" ry="9" fill="#211d27"/><ellipse class="bella-eye bella-eye-right" cx="132" cy="89" rx="8" ry="9" fill="#211d27"/>
<circle cx="88" cy="85" r="2.5" fill="#fff"/><circle cx="129" cy="85" r="2.5" fill="#fff"/>
<!-- muzzle -->
<ellipse cx="111" cy="112" rx="28" ry="22" fill="#fff" opacity=".96"/>
<path d="M102 105c5-6 13-6 19 0-1 8-6 12-10 12-4 0-8-4-9-12Z" fill="#211d27"/>
<path class="bella-mouth-happy" d="M95 121c8 9 24 9 32 0" fill="none" stroke="#7f6679" stroke-width="3.5" stroke-linecap="round"/>
<path class="bella-mouth-sad" d="M96 132c9-8 22-8 30 0" fill="none" stroke="#7f6679" stroke-width="3.5" stroke-linecap="round"/>
<ellipse class="bella-tear" cx="141" cy="104" rx="3.5" ry="7" fill="#70c9f3"/>
<!-- front paws -->
<g class="bella-paws"><path class="bella-paw-left" d="M78 148c-13 12-15 35-4 42 12 7 23-5 26-25l2-15Z" fill="url(#fur)" stroke="#ddd8e6" stroke-width="2"/><path class="bella-paw-right" d="M144 148c13 12 15 35 4 42-12 7-23-5-26-25l-2-15Z" fill="url(#fur)" stroke="#ddd8e6" stroke-width="2"/></g>
<!-- pink collar -->
<path d="M91 143h40l-5 13H96Z" fill="#e889b4"/><circle cx="111" cy="155" r="5" fill="#ffd36f"/>
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
function patchHome(){if(patching)return;const stats=[...document.querySelectorAll('.stats .stat')] as HTMLElement[];if(stats.length<4)return;patching=true;const p=readProgress(),s=scores(p);const values:[string,string,number|null,string][][]=[] as any;const vals:[string,string,number|null,string][]=[['Listening',s.done?`${s.listening}%`:'Sin medir',s.done?s.listening:null,s.done?`${s.done} respuestas registradas`:'Responde ejercicios para medirlo'],['Speaking',(p.speakDone||0)?`${s.speaking}%`:'Sin medir',(p.speakDone||0)?s.speaking:null,'Basado en prácticas completadas'],['Writing',(p.writeDone||0)?`${s.writing}%`:'Sin medir',(p.writeDone||0)?s.writing:null,'Basado en bloques practicados'],['Vocab',`${s.vocab}%`,s.vocab,`${(p.known||[]).length}/300 palabras objetivo`]];stats.slice(0,4).forEach((el,i)=>{const[label,text,pct,note]=vals[i],bar=el.querySelector('.bar i') as HTMLElement|null;setText(el.querySelector('span'),label);setText(el.querySelector('b'),text);if(bar)bar.style.width=(pct??0)+'%';el.title=note});setText(document.querySelector('.orb strong'),s.readiness+'%');setText(document.querySelector('.orb span'),'progreso medido');patching=false}
function classifyClick(target:Element){const btn=target.closest('button');if(!btn)return;const txt=(btn.textContent||'').trim();if(txt.includes('Sí, fácil')||txt.includes('Ya lo sé')){resetIdle();setTimeout(()=>cheer(undefined,'good'),30);setTimeout(patchHome,100);return}if(txt.includes('Todavía no')){resetIdle();setTimeout(()=>cheer(undefined,'try'),30);setTimeout(patchHome,100);return}if(btn.closest('.options')){resetIdle();setTimeout(()=>{if(btn.classList.contains('right'))cheer(undefined,'good');else if(btn.classList.contains('wrong'))cheer(undefined,'try');patchHome()},50);return}if(txt.includes('Responder')){resetIdle();setTimeout(()=>cheer(pick(SPEAK),'good'),900);setTimeout(patchHome,1300)}}
function start(){ensureMascot();patchHome();resetIdle();document.addEventListener('click',e=>classifyClick(e.target as Element),true);let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patchHome()})});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',patchHome)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
