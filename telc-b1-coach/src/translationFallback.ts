import{loadCorpusWords,loadSpanishMap}from'./corpus';
import{officialTelcSpanish}from'./telcOfficialSpanish';
import{EXAM_BOOST_ES}from'./examVocabBoost';

const FALLBACK_CACHE='telcb1-complete-es-v3';
const CORPUS_CACHE='telcb1-corpus-es-v6';
const AUDIT_KEY='telcb1-translation-qc-v3';
const ENDPOINT='https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=es&dt=t&q=';

function key(de:string){return de.toLocaleLowerCase('de-DE').trim()}
function read(k:string):Record<string,string>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}}
function save(k:string,x:any){try{localStorage.setItem(k,JSON.stringify(x))}catch{}}
function clean(x:string){return String(x||'').replace(/^[-–—\s]+|[-–—\s]+$/g,'').replace(/\s+/g,' ').trim()}
function suspicious(de:string,es:string){const d=key(de),s=clean(es).toLocaleLowerCase('es-ES');return !s||s===d||s.length>80||/\b(jota|ápice|miaja|adarme|maravedí|ochavo|ardite)\b/i.test(s)}

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

export async function completeSpanishTranslations(words:{de:string}[],existing:Record<string,string>){
 // Curated exam glosses are static and win over stale/browser-generated values.
 const out:Record<string,string>={...existing,...EXAM_BOOST_ES};
 let official=0,common=0,existingKept=0,fallback=0;
 for(const w of words){
  const k=key(w.de),telc=officialTelcSpanish(w.de),commonGloss=COMMON_B1[k]||COMMON_B1[k.replace(/^sich\s+/,'')];
  if(telc){out[k]=telc;official++;continue}
  if(commonGloss){out[k]=commonGloss;common++;continue}
  if(out[k]&&!suspicious(w.de,out[k]))existingKept++;else delete out[k];
 }
 // Re-apply the manually checked exam translations after the generic audit.
 Object.assign(out,EXAM_BOOST_ES);
 const cache=read(FALLBACK_CACHE);
 let queue=words.filter(w=>!out[key(w.de)]&&!cache[key(w.de)]).map(w=>w.de);
 for(let pass=0;pass<2&&queue.length;pass++){
  const pending=[...queue];
  await Promise.all(Array.from({length:Math.min(4,pending.length)},()=>worker(pending,cache)));
  queue=queue.filter(de=>!cache[key(de)]);
 }
 save(FALLBACK_CACHE,cache);
 for(const w of words){const k=key(w.de);if(!out[k]&&cache[k]&&!suspicious(w.de,cache[k])){out[k]=cache[k];fallback++}}
 Object.assign(out,EXAM_BOOST_ES);
 const missing=words.filter(w=>!out[key(w.de)]).map(w=>w.de);
 save(AUDIT_KEY,{checked:words.length,translated:words.length-missing.length,missing,official,common,existingKept,fallback,generatedAt:new Date().toISOString(),reference:'telc Einfach gut! B1.1/B1.2 Spanish vocabulary lists + curated user exam corpus'});
 save(CORPUS_CACHE,out);
 return out;
}

export function getTranslationQualityAudit(){try{return JSON.parse(localStorage.getItem(AUDIT_KEY)||'null')}catch{return null}}

export async function bootstrapCompleteTranslations(){
 const words=await loadCorpusWords();
 const current={...read(CORPUS_CACHE),...EXAM_BOOST_ES};
 const currentMissing=words.filter(w=>!current[key(w.de)]).length;
 if(currentMissing===0){
  save(CORPUS_CACHE,current);
  save(AUDIT_KEY,{checked:words.length,translated:words.length,missing:[],generatedAt:new Date().toISOString(),reference:'cached complete corpus + curated user exam corpus'});
  return current;
 }
 const base=Object.keys(current).length?current:await loadSpanishMap(words);
 return await completeSpanishTranslations(words,base);
}
