import{loadCorpusWords,loadSpanishMap}from'./corpus';
import{officialTelcSpanish}from'./telcOfficialSpanish';

const FALLBACK_CACHE='telcb1-complete-es-v2';
const CORPUS_CACHE='telcb1-corpus-es-v6';
const DONE_KEY='telcb1-complete-es-bootstrap-v2';
const AUDIT_KEY='telcb1-translation-qc-v2';
const ENDPOINT='https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=es&dt=t&q=';

function key(de:string){return de.toLocaleLowerCase('de-DE').trim()}
function read(k:string):Record<string,string>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}}
function save(k:string,x:any){try{localStorage.setItem(k,JSON.stringify(x))}catch{}}
function clean(x:string){return String(x||'').replace(/^[-–—\s]+|[-–—\s]+$/g,'').replace(/\s+/g,' ').trim()}
function suspicious(de:string,es:string){const d=key(de),s=clean(es).toLocaleLowerCase('es-ES');return !s||s===d||s.length>80||/\b(jota|ápice|miaja|adarme|maravedí|ochavo|ardite)\b/i.test(s)}

// Small set of common B1 senses where generic machine/dictionary translations are
// often technically possible but pedagogically wrong for TELC-style everyday German.
const COMMON_B1:Record<string,string>={
'bekommen':'recibir','machen':'hacer','gehen':'ir','fahren':'ir / conducir','laufen':'caminar / correr','treffen':'encontrarse / quedar','meinen':'opinar / querer decir','finden':'encontrar / parecer','sollen':'deber','dürfen':'poder / tener permiso','müssen':'deber / tener que','mögen':'gustar','brauchen':'necesitar','passen':'quedar bien / encajar','ziehen':'tirar / mudarse','halten':'parar / sostener','stellen':'poner / colocar','legen':'poner / colocar','setzen':'sentar / poner','lassen':'dejar','tragen':'llevar','holen':'ir a buscar / recoger','bringen':'traer / llevar','abholen':'recoger','bestellen':'pedir','zahlen':'pagar','kosten':'costar','verdienen':'ganar / cobrar','kündigen':'renunciar / despedir','anmelden':'inscribirse / registrarse','absagen':'cancelar','zusagen':'aceptar / confirmar','vereinbaren':'acordar / concertar','verschieben':'aplazar / posponer','teilnehmen':'participar','übernehmen':'hacerse cargo de / asumir','erledigen':'hacer / resolver','besorgen':'conseguir / comprar','sich erinnern':'recordar','erinnern':'recordar','sich kümmern':'ocuparse de','kümmern':'ocuparse de','sich bewerben':'postular / solicitar','bewerben':'postular / solicitar','sich beschweren':'quejarse','beschweren':'quejarse','sich entscheiden':'decidirse','entscheiden':'decidir','sich treffen':'encontrarse / quedar','sich fühlen':'sentirse','fühlen':'sentir','sich interessieren':'interesarse','interessieren':'interesar','teilen':'compartir','luft':'aire','termin':'cita','wohnung':'departamento / vivienda','miete':'alquiler / arriendo','vermieter':'propietario / arrendador','nachbar':'vecino','umzug':'mudanza','arbeit':'trabajo','arbeitsplatz':'puesto de trabajo','beruf':'profesión','gehalt':'salario','ausbildung':'formación profesional','prüfung':'examen','aufgabe':'tarea / ejercicio','übung':'ejercicio / práctica','nachricht':'mensaje','brief':'carta','rechnung':'cuenta / factura','angebot':'oferta','günstig':'económico','teuer':'caro','gesund':'saludable','krank':'enfermo','arzt':'médico','hilfe':'ayuda','verkehr':'tráfico','fahrkarte':'boleto / pasaje','verspätung':'retraso','urlaub':'vacaciones','unterkunft':'alojamiento','umgebung':'alrededores','möglichkeit':'posibilidad','erfahrung':'experiencia','meinung':'opinión','vorteil':'ventaja','nachteil':'desventaja','wichtig':'importante','möglich':'posible','wahrscheinlich':'probablemente','eigentlich':'en realidad','trotzdem':'aun así','außerdem':'además','deswegen':'por eso','deshalb':'por eso','obwohl':'aunque','falls':'en caso de que / si','während':'mientras / durante','gegenüber':'frente a / enfrente de'
};

async function translateOne(de:string){
 const r=await fetch(ENDPOINT+encodeURIComponent(de));if(!r.ok)throw new Error(String(r.status));
 const d=await r.json();return clean((d?.[0]||[]).map((x:any)=>x?.[0]||'').join(''));
}
async function worker(queue:string[],cache:Record<string,string>){
 while(queue.length){const de=queue.shift()!,k=key(de);if(cache[k])continue;try{const es=await translateOne(de);if(!suspicious(de,es))cache[k]=es}catch{}}
}

/**
 * Translation priority after QC:
 * 1) official TELC B1 Spanish vocabulary wording;
 * 2) hand-reviewed common B1 sense;
 * 3) existing curated/Ding result if it passed its own confidence checks;
 * 4) machine translation only for genuine gaps.
 */
export async function completeSpanishTranslations(words:{de:string}[],existing:Record<string,string>){
 const out:Record<string,string>={...existing};
 let official=0,common=0,existingKept=0,fallback=0;
 for(const w of words){
  const k=key(w.de),telc=officialTelcSpanish(w.de),commonGloss=COMMON_B1[k]||COMMON_B1[k.replace(/^sich\s+/,'')];
  if(telc){out[k]=telc;official++;continue}
  if(commonGloss){out[k]=commonGloss;common++;continue}
  if(out[k]&&!suspicious(w.de,out[k]))existingKept++;else delete out[k];
 }
 const cache=read(FALLBACK_CACHE);
 const queue=words.filter(w=>!out[key(w.de)]&&!cache[key(w.de)]).map(w=>w.de);
 await Promise.all(Array.from({length:Math.min(6,queue.length)},()=>worker(queue,cache)));
 save(FALLBACK_CACHE,cache);
 for(const w of words){const k=key(w.de);if(!out[k]&&cache[k]&&!suspicious(w.de,cache[k])){out[k]=cache[k];fallback++}}
 const missing=words.filter(w=>!out[key(w.de)]).map(w=>w.de);
 save(AUDIT_KEY,{checked:words.length,translated:words.length-missing.length,missing,official,common,existingKept,fallback,generatedAt:new Date().toISOString(),reference:'telc Einfach gut! B1.1/B1.2 Spanish vocabulary lists'});
 return out;
}

export function getTranslationQualityAudit(){try{return JSON.parse(localStorage.getItem(AUDIT_KEY)||'null')}catch{return null}}

// Called before React mounts. It deliberately rewrites the cache consumed by
// VocabCoach so stale/low-quality translations from older versions are replaced.
export async function bootstrapCompleteTranslations(){
 if(sessionStorage.getItem(DONE_KEY)==='1')return;
 const words=await loadCorpusWords();
 const base=await loadSpanishMap(words);
 const complete=await completeSpanishTranslations(words,base);
 save(CORPUS_CACHE,complete);
 sessionStorage.setItem(DONE_KEY,'1');
}
