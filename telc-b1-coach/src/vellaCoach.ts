import'./bellaCoach.css';

type Progress={known?:string[];listenDone?:number;listenCorrect?:number;speakDone?:number;writeDone?:number};

const GOOD=['Sehr gut!','Klasse!','Super gemacht!','Richtig! Weiter so!','Das war stark!'];
const TRY=['Fast! Versuch es noch einmal.','Kein Problem. Du schaffst das!','Weiter so – du kannst das!','Nicht aufgeben!','Beim nächsten Mal klappt es!'];
const SPEAK=['Sehr gut! Übung macht den Meister.','Toll! Weiter sprechen!','Klasse – du wirst sicherer!'];
const IDLE=['Na, versuchen wir es?','Du schaffst das!','Ich warte auf deine Antwort …','Komm, noch eine Aufgabe!'];

function pick(a:string[]){return a[Math.floor(Math.random()*a.length)]}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))}
function setText(el:Element|null,value:string){if(el&&el.textContent!==value)el.textContent=value}

function malteseSvg(){return `<svg class="vella-svg" viewBox="0 0 180 180" role="img" aria-label="Bella, perro maltés">
<defs><linearGradient id="bf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#eeeaf5"/></linearGradient></defs>
<ellipse cx="90" cy="151" rx="44" ry="15" fill="#dcd5e9" opacity=".42"/>
<path class="bella-tail" d="M126 127c23-7 31 8 22 17-7 7-17 2-20-5" fill="none" stroke="#f5f1f8" stroke-width="14" stroke-linecap="round"/>
<path class="bella-ear-left" d="M52 74C27 67 22 36 41 28c14-6 25 11 26 31" fill="url(#bf)" stroke="#d9d2e7" stroke-width="3"/>
<path class="bella-ear-right" d="M128 74c25-7 30-38 11-46-14-6-25 11-26 31" fill="url(#bf)" stroke="#d9d2e7" stroke-width="3"/>
<path d="M46 84c0-35 18-58 44-58s44 23 44 58c0 24-15 51-44 51S46 108 46 84Z" fill="url(#bf)" stroke="#ddd6e8" stroke-width="3"/>
<path d="M59 47c13-17 48-18 62 0-8 1-14 7-17 13-8-8-20-8-28 0-4-7-9-11-17-13Z" fill="#fff"/>
<circle cx="72" cy="82" r="7" fill="#292436"/><circle cx="108" cy="82" r="7" fill="#292436"/><circle cx="70" cy="79" r="2" fill="#fff"/><circle cx="106" cy="79" r="2" fill="#fff"/>
<ellipse class="bella-tear" cx="116" cy="94" rx="3" ry="6" fill="#6bc8f3"/>
<path d="M84 99c4-5 8-5 12 0-1 6-4 9-6 9s-5-3-6-9Z" fill="#26202f"/>
<path class="bella-mouth-happy" d="M77 112c8 8 18 8 26 0" fill="none" stroke="#8a6d83" stroke-width="3" stroke-linecap="round"/>
<path class="bella-mouth-sad" d="M79 118c7-7 15-7 22 0" fill="none" stroke="#8a6d83" stroke-width="3" stroke-linecap="round"/>
<path d="M58 125c-18 12-20 34-7 39 13 5 24-6 28-19M122 125c18 12 20 34 7 39-13 5-24-6-28-19" fill="url(#bf)" stroke="#ddd6e8" stroke-width="3"/>
<path d="M78 127h24l-4 15H82Z" fill="#d98ab6"/><circle cx="90" cy="141" r="4" fill="#ffd36f"/>
</svg>`}

let lastMessage='Du schaffst das!';
let hideTimer:number|undefined;
let idleTimer:number|undefined;
let wanderTimer:number|undefined;

function ensureMascot(){
  if(document.getElementById('vella-coach'))return;
  const el=document.createElement('div');el.id='vella-coach';el.className='vella-coach';
  el.innerHTML=`<div class="vella-bubble"><b>Bella</b><span>${esc(lastMessage)}</span></div><button class="vella-dog" aria-label="Bella sagt Hallo">${malteseSvg()}<span>BELLA</span></button>`;
  document.body.appendChild(el);
  el.querySelector('.vella-dog')?.addEventListener('click',()=>{cheer('Hallo! Los geht’s!','neutral');moveBella(true)});
}

function setMood(kind:'good'|'try'|'sad'|'neutral'){
  const root=document.getElementById('vella-coach');if(!root)return;
  root.classList.remove('good','try','sad','talking');
  void (root as HTMLElement).offsetWidth;
  if(kind!=='neutral')root.classList.add(kind);
}

export function cheer(message?:string,kind:'good'|'try'|'sad'|'neutral'='neutral'){
  ensureMascot();lastMessage=message||(kind==='good'?pick(GOOD):kind==='try'?pick(TRY):kind==='sad'?pick(IDLE):'Du schaffst das!');
  const root=document.getElementById('vella-coach');if(!root)return;
  const bubble=root.querySelector('.vella-bubble') as HTMLElement|null;const span=bubble?.querySelector('span');
  setText(span,lastMessage);setMood(kind);root.classList.add('talking');
  if(bubble)bubble.style.opacity='1';
  if(hideTimer)window.clearTimeout(hideTimer);hideTimer=window.setTimeout(()=>{root.classList.remove('talking');if(kind!=='sad')root.classList.remove('good','try')},4200);
}

function moveBella(force=false){
  ensureMascot();const root=document.getElementById('vella-coach') as HTMLElement|null;if(!root)return;
  if(root.classList.contains('good')&&!force)return;
  const w=window.innerWidth,h=window.innerHeight;
  const mascotW=w<700?105:w<1100?125:150;
  const minX=w<700?8:Math.min(250,w*.18);
  const maxX=Math.max(minX,w-mascotW-18);
  const minY=Math.max(80,h*.48),maxY=Math.max(minY,h-mascotW-28);
  const x=Math.round(minX+Math.random()*(maxX-minX));
  const y=Math.round(minY+Math.random()*(maxY-minY));
  root.classList.add('walking');root.style.left=x+'px';root.style.top=y+'px';
  window.setTimeout(()=>root.classList.remove('walking'),2450);
}

function scheduleWander(){
  if(wanderTimer)window.clearTimeout(wanderTimer);
  wanderTimer=window.setTimeout(()=>{moveBella();scheduleWander()},6500+Math.random()*4500);
}

function resetIdle(){
  if(idleTimer)window.clearTimeout(idleTimer);
  const root=document.getElementById('vella-coach');root?.classList.remove('sad');
  idleTimer=window.setTimeout(()=>{cheer(undefined,'sad');moveBella(true)},18000);
}

function readProgress():Progress{try{return JSON.parse(localStorage.getItem('telcb1')||'{}')}catch{return{}}}
function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)))}
function scores(p:Progress){
  const known=(p.known||[]).length;
  const vocab=clamp((known/300)*100);
  const done=p.listenDone||0,correct=p.listenCorrect||0;
  const accuracy=done?correct/done:0;const sample=Math.min(1,done/20);
  const listening=clamp(accuracy*sample*100);
  const speaking=clamp(((p.speakDone||0)/15)*100);
  const writing=clamp(((p.writeDone||0)/12)*100);
  const readiness=clamp(vocab*.15+listening*.40+speaking*.25+writing*.20);
  return{vocab,listening,speaking,writing,readiness,done};
}

let patching=false;
function patchHome(){
  if(patching)return;const stats=[...document.querySelectorAll('.stats .stat')] as HTMLElement[];if(stats.length<4)return;
  patching=true;const p=readProgress();const s=scores(p);
  const values:[string,string,number|null,string][]=[
    ['Listening',s.done?`${s.listening}%`:'Sin medir',s.done?s.listening:null,s.done?`${s.done} respuestas registradas`:'Responde ejercicios para medirlo'],
    ['Speaking',(p.speakDone||0)?`${s.speaking}%`:'Sin medir',(p.speakDone||0)?s.speaking:null,'Basado en prácticas completadas'],
    ['Writing',(p.writeDone||0)?`${s.writing}%`:'Sin medir',(p.writeDone||0)?s.writing:null,'Basado en bloques practicados'],
    ['Vocab',`${s.vocab}%`,s.vocab,`${(p.known||[]).length}/300 palabras objetivo`]
  ];
  stats.slice(0,4).forEach((el,i)=>{const [label,text,pct,note]=values[i];const span=el.querySelector('span');const b=el.querySelector('b');const bar=el.querySelector('.bar i') as HTMLElement|null;setText(span,label);setText(b,text);const width=(pct??0)+'%';if(bar&&bar.style.width!==width)bar.style.width=width;if(el.title!==note)el.title=note});
  setText(document.querySelector('.orb strong'),s.readiness+'%');setText(document.querySelector('.orb span'),'progreso medido');
  patching=false;
}

function classifyClick(target:Element){
  resetIdle();const btn=target.closest('button');if(!btn)return;
  const txt=(btn.textContent||'').trim();
  if(txt.includes('Sí, fácil')||txt.includes('Ya lo sé')){setTimeout(()=>{cheer(undefined,'good');moveBella(true)},30);setTimeout(patchHome,100);return}
  if(txt.includes('Todavía no')){setTimeout(()=>cheer(undefined,'try'),30);setTimeout(patchHome,100);return}
  if(btn.closest('.options')){setTimeout(()=>{if(btn.classList.contains('right')){cheer(undefined,'good');moveBella(true)}else if(btn.classList.contains('wrong'))cheer(undefined,'try');patchHome()},50);return}
  if(txt.includes('Responder')){setTimeout(()=>{cheer(pick(SPEAK),'good');moveBella(true)},900);setTimeout(patchHome,1300)}
}

function start(){
  ensureMascot();patchHome();moveBella(true);scheduleWander();resetIdle();
  document.addEventListener('click',e=>classifyClick(e.target as Element),true);
  document.addEventListener('keydown',resetIdle,true);
  document.addEventListener('pointermove',resetIdle,{passive:true});
  window.addEventListener('resize',()=>moveBella(true));
  let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patchHome()})});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',patchHome);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
