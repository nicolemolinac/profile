import { SPEAKING } from './data';

// Speaking should work like Writing: memorize a safe skeleton and only adapt the
// content inside [brackets] to the exam topic. We mutate the existing task data
// so the current Guided / Semi-guided UI can present the template immediately.
const templates: Record<string, { description: string; lines: string[] }> = {
  'Teil 1': {
    description: 'Usa esta plantilla fija y cambia solo lo que está entre [corchetes]. No inventes una estructura nueva en el examen.',
    lines: [
      'Ich heiße [NOMBRE] und komme aus [PAÍS].',
      'Seit [TIEMPO] wohne ich in [CIUDAD].',
      'Zurzeit [TRABAJO / ESTUDIO].',
      'Ich spreche [IDIOMAS].',
      'In meiner Freizeit [HOBBIES / ACTIVIDADES].',
      'Und du? / Wie ist es bei dir?'
    ]
  },
  'Teil 2': {
    description: 'Plantilla universal para casi cualquier tema de Teil 2: resumen → opinión → razón → experiencia → cierre/pregunta. Cambia solo [TEMA], [OPINIÓN], [RAZÓN] y [EXPERIENCIA].',
    lines: [
      'In dem Text geht es um [TEMA].',
      'Die Person meint, dass [POSICIÓN DEL TEXTO].',
      'Ich persönlich finde, dass [TU OPINIÓN], weil [RAZÓN SIMPLE].',
      'Ein Vorteil / Nachteil ist, dass [IDEA].',
      'Aus meiner Erfahrung kann ich sagen, dass [EXPERIENCIA PROPIA].',
      'Deshalb denke ich, dass [CONCLUSIÓN SIMPLE].',
      'Was meinst du dazu? / Wie siehst du das?'
    ]
  },
  'Teil 3': {
    description: 'Plantilla universal para planificar juntos: abrir → proponer → reaccionar → resolver detalles → cerrar acuerdo. Cambia solo lo que está entre [corchetes].',
    lines: [
      'Okay, wir müssen [ACTIVIDAD / EVENTO] planen.',
      'Ich schlage vor, dass wir [PROPUESTA].',
      'Wie wäre es mit [ALTERNATIVA]?',
      'Das passt mir gut. / Leider passt mir das nicht, weil [RAZÓN].',
      'Dann könnten wir [NUEVA PROPUESTA / DETALLE].',
      'Was brauchen wir noch? / Wer kümmert sich um [DETALLE]?',
      'Also machen wir es so: [ACUERDO FINAL].'
    ]
  }
};

for (const task of SPEAKING as any[]) {
  const title = String(task[0] || '');
  const key = title.startsWith('Teil 1') ? 'Teil 1' : title.startsWith('Teil 2') ? 'Teil 2' : title.startsWith('Teil 3') ? 'Teil 3' : '';
  const template = templates[key];
  if (!template) continue;
  task[1] = template.description;
  task[2] = template.lines;
}

// Bridge browser-local German progress into Chief's backend. The Coach itself is a
// Vite-only app, so Chief cannot read its localStorage directly across ports.
// App.tsx imports this module on startup, which makes the bridge available without
// coupling the learning UI to Chief.
const CHIEF_API='http://localhost:8100';
const TARGET_WORDS=2000;
let chiefSyncTimer:number|undefined;

function chiefProgress(raw:string){
  try{
    const p=JSON.parse(raw||'{}');
    const known=Array.isArray(p.known)?p.known.length:0;
    const listening=Number(p.listening||0),speaking=Number(p.speaking||0),writing=Number(p.writing||0),reading=Number(p.reading||0);
    const readiness=Math.round(listening*.4+speaking*.3+writing*.2+reading*.1);
    return {
      words_learned:known,
      words_target:TARGET_WORDS,
      vocab_coverage_pct:Math.round((known/TARGET_WORDS)*1000)/10,
      progress_pct:readiness,
      readiness,
      listen_done:Number(p.listenDone||0),
      listen_correct:Number(p.listenCorrect||0),
      speak_done:Number(p.speakDone||0),
      write_done:Number(p.writeDone||0),
      xp:Number(p.xp||0),
      exam_date:p.examDate||null,
      latest:new Date().toISOString()
    };
  }catch{return null}
}

async function pushChief(raw:string){
  const progress=chiefProgress(raw);if(!progress)return;
  try{
    const r=await fetch(`${CHIEF_API}/memory`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'agent_output',key:'german_progress',value:JSON.stringify(progress),source_agent:'german'})});
    if(r.ok)fetch(`${CHIEF_API}/home/refresh`,{method:'POST'}).catch(()=>{});
  }catch{}
}

function scheduleChiefSync(raw:string){
  if(chiefSyncTimer)window.clearTimeout(chiefSyncTimer);
  chiefSyncTimer=window.setTimeout(()=>pushChief(raw),500);
}

if(typeof window!=='undefined'&&!(window as any).__telcChiefSyncInstalled){
  (window as any).__telcChiefSyncInstalled=true;
  const nativeSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key:string,value:string){
    nativeSetItem.call(this,key,value);
    if(this===window.localStorage&&key==='telcb1')scheduleChiefSync(value);
  };
  const existing=window.localStorage.getItem('telcb1');
  if(existing)scheduleChiefSync(existing);
}
