import p1 from './corpus/part1';import p2 from './corpus/part2';import p3 from './corpus/part3';import p4 from './corpus/part4';import p5 from './corpus/part5';import p6 from './corpus/part6';import p7 from './corpus/part7';

export type CorpusWord={id:string;de:string;freq:number;speaking:number;writing:number;listening:number;rank:number;roi:number;category:'corpus'};

async function gunzipBase64(b64:string){
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const DS=(globalThis as any).DecompressionStream;
  if(!DS)throw new Error('Este navegador no soporta DecompressionStream.');
  const stream=new Blob([bytes]).stream().pipeThrough(new DS('gzip'));
  return await new Response(stream).text();
}

let cache:CorpusWord[]|null=null;
export async function loadCorpusWords():Promise<CorpusWord[]>{
  if(cache)return cache;
  const text=await gunzipBase64(p1+p2+p3+p4+p5+p6+p7);
  const rows=text.trim().split('\n').filter(Boolean);
  const total=Math.max(1,rows.length-1);
  cache=rows.map((line,i)=>{const[de,f,s,w,l]=line.split('|');return{id:`c:${de.toLowerCase()}`,de,freq:+f,speaking:+s,writing:+w,listening:+l,rank:i+1,roi:Math.max(1,Math.round(100-(i*99/total))),category:'corpus' as const}});
  return cache;
}

const DICT_URL='https://raw.githubusercontent.com/zenogantner/ding-es-de/master/es-de';
const CACHE_KEY='telcb1-corpus-es-v1';
function clean(x:string){return x.replace(/\{[^}]*\}|\[[^\]]*\]|\([^)]*\)/g,'').replace(/<[^>]*>/g,'').trim()}
function candidates(word:string){
  const w=word.toLowerCase();const out=[w];
  const irregular:Record<string,string>={gibt:'geben',geht:'gehen',ging:'gehen',gegangen:'gehen',kommt:'kommen',kam:'kommen',finde:'finden',fand:'finden',macht:'machen',gemacht:'machen',weiß:'wissen',wusste:'wissen',fährt:'fahren',fuhr:'fahren',gefahren:'fahren',läuft:'laufen',lief:'laufen',sieht:'sehen',sah:'sehen',gesehen:'sehen',bleibt:'bleiben',blieb:'bleiben',hilft:'helfen',half:'helfen',nimmt:'nehmen',nahm:'nehmen',spricht:'sprechen',sprach:'sprechen',liest:'lesen',las:'lesen',schreibt:'schreiben',schrieb:'schreiben',isst:'essen',aß:'essen',trifft:'treffen',traf:'treffen',hält:'halten',hielt:'halten',lässt:'lassen',ließ:'lassen',fällt:'fallen',fiel:'fallen',beginnt:'beginnen',begann:'beginnen',gefällt:'gefallen',denke:'denken',glaube:'glauben',wurde:'werden',gewesen:'sein',gesagt:'sagen',gefunden:'finden',gearbeitet:'arbeiten',gelernt:'lernen'};
  if(irregular[w])out.push(irregular[w]);
  if(w.endsWith('est'))out.push(w.slice(0,-3)+'en');
  if(w.endsWith('st'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('et'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('te'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('t'))out.push(w.slice(0,-1)+'en');
  if(w.endsWith('e'))out.push(w.slice(0,-1)+'en');
  if(w.endsWith('en'))out.push(w.slice(0,-2));
  if(w.endsWith('er'))out.push(w.slice(0,-2));
  if(w.endsWith('n'))out.push(w.slice(0,-1));
  if(w.endsWith('s'))out.push(w.slice(0,-1));
  return [...new Set(out)];
}
export async function loadSpanishMap(words:CorpusWord[]):Promise<Record<string,string>>{
  try{const saved=localStorage.getItem(CACHE_KEY);if(saved)return JSON.parse(saved)}catch{}
  const wanted=new Set<string>();for(const x of words)for(const c of candidates(x.de))wanted.add(c);
  const result:Record<string,string>={};
  try{
    const text=await fetch(DICT_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()});
    const dict:Record<string,string>={};
    for(const line of text.split('\n')){if(!line||line.startsWith('#')||!line.includes('::'))continue;const[esRaw,deRaw]=line.split('::',2);const es=clean(esRaw).split(';')[0].trim();if(!es)continue;for(const piece of deRaw.split(';')){const de=clean(piece).replace(/^sich\s+/i,'').toLowerCase();if(de&&wanted.has(de)&&!dict[de])dict[de]=es}}
    for(const x of words){for(const c of candidates(x.de)){if(dict[c]){result[x.de.toLowerCase()]=dict[c];break}}}
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(result))}catch{}
  }catch(e){console.warn('No se pudo cargar traducción del corpus',e)}
  return result;
}

export function approxPronunciation(s:string){return s.toLowerCase().replace(/sch/g,'sh').replace(/tsch/g,'ch').replace(/ch/g,'j').replace(/z/g,'ts').replace(/w/g,'v').replace(/j/g,'y').replace(/ä/g,'e').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'s')}
