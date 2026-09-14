const CACHE_KEY='telcb1-complete-es-v1';
const ENDPOINT='https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=es&dt=t&q=';

function readCache():Record<string,string>{try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')}catch{return{}}}
function saveCache(x:Record<string,string>){try{localStorage.setItem(CACHE_KEY,JSON.stringify(x))}catch{}}
function cleanTranslation(x:string){return String(x||'').replace(/^[-–—\s]+|[-–—\s]+$/g,'').trim()}

async function translateOne(de:string):Promise<string>{
 const r=await fetch(ENDPOINT+encodeURIComponent(de));
 if(!r.ok)throw new Error(`translation ${r.status}`);
 const data=await r.json();
 return cleanTranslation((data?.[0]||[]).map((x:any)=>x?.[0]||'').join(''));
}

async function worker(queue:string[],cache:Record<string,string>){
 while(queue.length){
  const de=queue.shift()!;
  const key=de.toLocaleLowerCase('de-DE');
  if(cache[key])continue;
  try{const es=await translateOne(de);if(es)cache[key]=es}catch{}
 }
}

/** Fill only gaps left by the curated/Ding dictionary. Existing reviewed translations always win. */
export async function completeSpanishTranslations(words:{de:string}[],existing:Record<string,string>):Promise<Record<string,string>>{
 const cache=readCache();
 const missing=words.filter(w=>!existing[w.de.toLocaleLowerCase('de-DE')]&&!cache[w.de.toLocaleLowerCase('de-DE')]).map(w=>w.de);
 // A few parallel workers keep the initial fill quick without firing hundreds of requests at once.
 const queue=[...missing];
 await Promise.all(Array.from({length:Math.min(8,queue.length)},()=>worker(queue,cache)));
 saveCache(cache);
 const out={...existing};
 for(const w of words){const key=w.de.toLocaleLowerCase('de-DE');if(!out[key]&&cache[key])out[key]=cache[key]}
 return out;
}
