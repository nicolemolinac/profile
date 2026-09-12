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
  cache=rows.map((line,i)=>{const[de,f,s,w,l]=line.split('|');const sections=(+s>0?1:0)+(+w>0?1:0)+(+l>0?1:0);const frequencyScore=100-(i*85/total);const coverageBonus=sections===3?15:sections===2?8:0;return{id:`c:${de.toLowerCase()}`,de,freq:+f,speaking:+s,writing:+w,listening:+l,rank:i+1,roi:Math.max(1,Math.min(100,Math.round(frequencyScore+coverageBonus))),category:'corpus' as const}});
  return cache;
}

const DICT_URL='https://raw.githubusercontent.com/zenogantner/ding-es-de/master/es-de';
// v3 invalidates earlier cached translations after correcting case/plural handling.
const CACHE_KEY='telcb1-corpus-es-v3';
function clean(x:string){return x.replace(/\{[^}]*\}|\[[^\]]*\]|\([^)]*\)/g,'').replace(/<[^>]*>/g,'').trim()}
function primary(x:string){return x.split('/')[0].split(';')[0].trim()}

// Neutral LATAM Spanish, with one primary meaning only. These values beat the raw dictionary.
const STANDARD_ES:Record<string,string>={
'aber':'pero','alle':'todos','allein':'solo','als':'como','also':'entonces','alt':'viejo','am':'en el','an':'en','andere':'otro','anderen':'otros','auch':'también','auf':'en','aus':'de','bei':'en','beim':'al','beispiel':'ejemplo','bekommen':'recibir','bereits':'ya','besonders':'especialmente','besser':'mejor','bis':'hasta','bleiben':'quedarse','brauchen':'necesitar','da':'ahí','dabei':'al hacerlo','dann':'entonces','das':'eso','dass':'que','dein':'tu','deine':'tu','dem':'el','den':'el','denn':'porque','der':'el','deshalb':'por eso','die':'la','dies':'esto','diese':'este','dieser':'este','doch':'sin embargo','dort':'allí','du':'tú','durch':'por','ein':'un','eine':'una','einem':'un','einen':'un','einer':'una','eigentlich':'en realidad','erst':'primero','es':'eso','etwas':'algo','familie':'familia','finden':'encontrar','für':'para','ganz':'completamente','geben':'dar','gegen':'contra','gehen':'ir','gehören':'pertenecer','geld':'dinero','genau':'exactamente','gerade':'ahora mismo','gern':'con gusto','gerne':'con gusto','gut':'bueno','haben':'tener','hat':'tiene','heute':'hoy','hier':'aquí','ich':'yo','ihm':'a él','ihn':'a él','ihr':'a ella','ihre':'su','immer':'siempre','in':'en','ist':'es','ja':'sí','jahr':'año','jahre':'años','jahren':'años','jeder':'cada uno','jetzt':'ahora','kann':'puede','kein':'ningún','keine':'ninguna','kinder':'niños','kindern':'niños','kommen':'venir','können':'poder','lang':'largo','leben':'vivir','leider':'lamentablemente','leute':'gente','machen':'hacer','mal':'vez','man':'uno','mehr':'más','mein':'mi','meine':'mi','mensch':'persona','menschen':'personas','mit':'con','möglich':'posible','muss':'debe','müssen':'deber','nach':'después de','natürlich':'por supuesto','nein':'no','neu':'nuevo','nicht':'no','nichts':'nada','noch':'todavía','nur':'solo','ob':'si','oder':'o','oft':'a menudo','ohne':'sin','schon':'ya','sehr':'muy','sein':'ser','seine':'su','seit':'desde','selbst':'mismo','sie':'ella','sind':'son','so':'así','soll':'debe','sollen':'deber','später':'más tarde','tag':'día','tage':'días','tagen':'días','tun':'hacer','über':'sobre','um':'a','und':'y','uns':'nos','unser':'nuestro','unsere':'nuestra','unter':'debajo de','viel':'mucho','viele':'muchos','vielen':'muchos','vielleicht':'quizás','vom':'del','von':'de','vor':'antes','war':'era','waren':'eran','was':'qué','weil':'porque','weiter':'continuar','wenn':'si','werden':'convertirse','wie':'cómo','wieder':'otra vez','will':'quiere','wir':'nosotros','wirklich':'realmente','wissen':'saber','wo':'dónde','wohl':'probablemente','wollen':'querer','zu':'a','zum':'al','zur':'a la','zusammen':'juntos','zwischen':'entre','zeit':'tiempo','uhr':'hora','arbeit':'trabajo','arbeiten':'trabajar','wohnung':'departamento','wohnungen':'departamentos','stadt':'ciudad','land':'país','freund':'amigo','freunde':'amigos','freunden':'amigos','frau':'mujer','mann':'hombre','kind':'niño','schule':'escuela','lernen':'aprender','sprechen':'hablar','sagen':'decir','frage':'pregunta','fragen':'preguntar','antwort':'respuesta','antworten':'responder','essen':'comer','trinken':'beber','fahren':'ir','zug':'tren','bahnhof':'estación de tren','auto':'auto','straße':'calle','weg':'camino','urlaub':'vacaciones','reise':'viaje','termin':'cita','wochenende':'fin de semana','woche':'semana','wochen':'semanas','morgen':'mañana','abend':'tarde','mittag':'mediodía','nacht':'noche','stunde':'hora','stunden':'horas','minute':'minuto','minuten':'minutos','preis':'precio','preise':'precios','kosten':'costar','kaufen':'comprar','geschäft':'tienda','haus':'casa','häuser':'casas','zimmer':'habitación','gesund':'saludable','gesundheit':'salud','problem':'problema','probleme':'problemas','wichtig':'importante','idee':'idea','ideen':'ideas','meinung':'opinión','erfahrung':'experiencia','erfahrungen':'experiencias','vorteil':'ventaja','vorteile':'ventajas','nachteil':'desventaja','nachteile':'desventajas','möglichkeit':'posibilidad','möglichkeiten':'posibilidades','internet':'internet','handy':'celular','computer':'computadora','eltern':'padres','mutter':'madre','vater':'padre','bruder':'hermano','schwester':'hermana','arzt':'médico','krankenhaus':'hospital','hilfe':'ayuda','helfen':'ayudar','anfangen':'empezar','beginnen':'empezar','ende':'fin','enden':'terminar','treffen':'encuentro','besuchen':'visitar','bringen':'traer','nehmen':'tomar','sehen':'ver','hören':'escuchar','lesen':'leer','schreiben':'escribir','verstehen':'entender','denken':'pensar','glauben':'creer','meinen':'opinar','zeigen':'mostrar','erklären':'explicar','kennen':'conocer','heißen':'llamarse','wohnen':'vivir','spielen':'jugar','feiern':'celebrar','planen':'planificar','entscheiden':'decidir','bezahlen':'pagar','öffnen':'abrir','geschlossen':'cerrado','geöffnet':'abierto','schnell':'rápido','langsam':'lento','groß':'grande','klein':'pequeño','teuer':'caro','günstig':'económico','kostenlos':'gratis','schön':'bonito','schlecht':'malo','einfach':'fácil','schwer':'difícil','richtig':'correcto','falsch':'incorrecto','frei':'libre','fertig':'listo','früh':'temprano','spät':'tarde','zusätzlich':'adicional','ungefähr':'aproximadamente','wahrscheinlich':'probablemente','trotzdem':'aun así','außerdem':'además','zuerst':'primero','danach':'después','gemeinsam':'juntos','stattfinden':'tener lugar','teilnehmen':'participar','einladen':'invitar','einladung':'invitación','nachricht':'mensaje','reservieren':'reservar','vergessen':'olvidar','pünktlich':'puntual','verkehr':'tráfico','unterkunft':'alojamiento','umgebung':'alrededores','freizeit':'tiempo libre','umwelt':'medioambiente','bildung':'educación','beruf':'profesión','bewerbung':'solicitud','bewerben':'postular','verspätung':'retraso','gleis':'andén','abfahrt':'salida','ankunft':'llegada','veranstaltung':'evento','empfehlen':'recomendar','verschieben':'aplazar','vereinbaren':'acordar','abholen':'recoger','besorgen':'conseguir','unterstützen':'apoyar','erledigen':'resolver','bequem':'cómodo'
};

function candidates(word:string){
  const w=word.toLowerCase();const out=[w];const noun=/^[A-ZÄÖÜ]/.test(word);
  const irregular:Record<string,string>={gibt:'geben',geht:'gehen',ging:'gehen',gegangen:'gehen',kommt:'kommen',kam:'kommen',finde:'finden',fand:'finden',macht:'machen',gemacht:'machen',weiß:'wissen',wusste:'wissen',fährt:'fahren',fuhr:'fahren',gefahren:'fahren',läuft:'laufen',lief:'laufen',sieht:'sehen',sah:'sehen',gesehen:'sehen',bleibt:'bleiben',blieb:'bleiben',hilft:'helfen',half:'helfen',nimmt:'nehmen',nahm:'nehmen',spricht:'sprechen',sprach:'sprechen',liest:'lesen',las:'lesen',schreibt:'schreiben',schrieb:'schreiben',isst:'essen',aß:'essen',trifft:'treffen',traf:'treffen',hält:'halten',hielt:'halten',lässt:'lassen',ließ:'lassen',fällt:'fallen',fiel:'fallen',beginnt:'beginnen',begann:'beginnen',gefällt:'gefallen',denke:'denken',glaube:'glauben',wurde:'werden',gewesen:'sein',gesagt:'sagen',gefunden:'finden',gearbeitet:'arbeiten',gelernt:'lernen'};
  if(irregular[w])out.push(irregular[w]);
  // For German nouns, dative plurals like Jahren/Freunden should resolve to Jahre/Freunde before singular Jahr/Freund.
  if(noun&&w.endsWith('n'))out.push(w.slice(0,-1));
  if(w.endsWith('est'))out.push(w.slice(0,-3)+'en');
  if(w.endsWith('st'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('et'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('te'))out.push(w.slice(0,-2)+'en');
  if(w.endsWith('t'))out.push(w.slice(0,-1)+'en');
  if(w.endsWith('e'))out.push(w.slice(0,-1)+'en');
  if(w.endsWith('en'))out.push(w.slice(0,-2));
  if(w.endsWith('er'))out.push(w.slice(0,-2));
  if(!noun&&w.endsWith('n'))out.push(w.slice(0,-1));
  if(w.endsWith('s'))out.push(w.slice(0,-1));
  return [...new Set(out)];
}

export async function loadSpanishMap(words:CorpusWord[]):Promise<Record<string,string>>{
  try{const saved=localStorage.getItem(CACHE_KEY);if(saved)return JSON.parse(saved)}catch{}
  const wanted=new Set<string>();for(const x of words)for(const c of candidates(x.de))wanted.add(c);
  const result:Record<string,string>={};
  for(const x of words){const w=x.de.toLowerCase();if(STANDARD_ES[w])result[w]=primary(STANDARD_ES[w])}
  try{
    const text=await fetch(DICT_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()});
    const dict:Record<string,string>={};
    for(const line of text.split('\n')){if(!line||line.startsWith('#')||!line.includes('::'))continue;const[esRaw,deRaw]=line.split('::',2);const es=primary(clean(esRaw));if(!es)continue;for(const piece of deRaw.split(';')){const de=clean(piece).replace(/^sich\s+/i,'').toLowerCase();if(de&&wanted.has(de)&&!dict[de])dict[de]=es}}
    for(const x of words){const key=x.de.toLowerCase();if(result[key])continue;
      const forms=candidates(x.de).slice(1);
      // Prefer a curated lemma/plural form before a raw exact dictionary hit. This avoids e.g. Jahren -> año.
      let found='';for(const c of forms){if(STANDARD_ES[c]){found=primary(STANDARD_ES[c]);break}}
      if(found){result[key]=found;continue}
      if(dict[key]){result[key]=primary(dict[key]);continue}
      for(const c of forms){if(dict[c]){result[key]=primary(dict[c]);break}}
    }
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(result))}catch{}
  }catch(e){console.warn('No se pudo cargar traducción del corpus',e)}
  return result;
}

export function approxPronunciation(s:string){return s.toLowerCase().replace(/sch/g,'sh').replace(/tsch/g,'ch').replace(/ch/g,'j').replace(/z/g,'ts').replace(/w/g,'v').replace(/j/g,'y').replace(/ä/g,'e').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'s')}
