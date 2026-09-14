import{loadCorpusWords,loadSpanishMap}from'./corpus';

const FALLBACK_CACHE='telcb1-complete-es-v1';
const CORPUS_CACHE='telcb1-corpus-es-v6';
const DONE_KEY='telcb1-complete-es-bootstrap-v1';
const ENDPOINT='https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=es&dt=t&q=';

function read(key:string):Record<string,string>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}}
function save(key:string,x:Record<string,string>){try{localStorage.setItem(key,JSON.stringify(x))}catch{}}
function clean(x:string){return String(x||'').replace(/^[-–—\s]+|[-–—\s]+$/g,'').trim()}
async function translateOne(de:string){const r=await fetch(ENDPOINT+encodeURIComponent(de));if(!r.ok)throw new Error(String(r.status));const d=await r.json();return clean((d?.[0]||[]).map((x:any)=>x?.[0]||'').join(''))}
async function worker(queue:string[],cache:Record<string,string>){while(queue.length){const de=queue.shift()!,key=de.toLocaleLowerCase('de-DE');if(cache[key])continue;try{const es=await translateOne(de);if(es)cache[key]=es}catch{}}}

export async function completeSpanishTranslations(words:{de:string}[],existing:Record<string,string>){
 const cache=read(FALLBACK_CACHE),queue=words.filter(w=>!existing[w.de.toLocaleLowerCase('de-DE')]&&!cache[w.de.toLocaleLowerCase('de-DE')]).map(w=>w.de);
 await Promise.all(Array.from({length:Math.min(8,queue.length)},()=>worker(queue,cache)));save(FALLBACK_CACHE,cache);
 const out={...existing};for(const w of words){const k=w.de.toLocaleLowerCase('de-DE');if(!out[k]&&cache[k])out[k]=cache[k]}return out;
}

// One-time migration: finish every gap, merge it into the cache already consumed by VocabCoach,
// then reload once so no word is excluded from the study queue.
export async function bootstrapCompleteTranslations(){
 if(sessionStorage.getItem(DONE_KEY)==='1')return;
 const words=await loadCorpusWords(),base=await loadSpanishMap(words),before=Object.keys(base).length;
 const complete=await completeSpanishTranslations(words,base);save(CORPUS_CACHE,complete);
 sessionStorage.setItem(DONE_KEY,'1');
 if(Object.keys(complete).length>before)location.reload();
}
bootstrapCompleteTranslations().catch(e=>console.warn('No se pudieron completar todas las traducciones',e));
