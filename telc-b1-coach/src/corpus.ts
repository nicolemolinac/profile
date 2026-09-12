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
// v2 intentionally invalidates the old cache, which contained several regional/secondary senses.
const CACHE_KEY='telcb1-corpus-es-v2';
function clean(x:string){return x.replace(/\{[^}]*\}|\[[^\]]*\]|\([^)]*\)/g,'').replace(/<[^>]*>/g,'').trim()}

// Standard, neutral Spanish for high-frequency TELC/B1 vocabulary.
// These always win over the raw dictionary so the learner sees the common sense first.
const STANDARD_ES:Record<string,string>={
'aber':'pero','alle':'todos','allein':'solo','als':'como / que','also':'así que / entonces','alt':'viejo / mayor','am':'en el / a la','an':'en / a','andere':'otro','anderen':'otros','auch':'también','auf':'en / sobre','aus':'de / desde','bei':'en / con','beim':'al / durante','beispiel':'ejemplo','bekommen':'recibir','bereits':'ya','besonders':'especialmente','besser':'mejor','bis':'hasta','bleiben':'quedarse','brauchen':'necesitar','da':'ahí / ya que','dabei':'al hacerlo / allí','dann':'entonces / después','das':'eso / el / la','dass':'que','dein':'tu','deine':'tu','dem':'el / al','den':'el / los','denn':'porque / pues','der':'el','deshalb':'por eso','die':'la / los / las','dies':'esto','diese':'este / esta','dieser':'este','doch':'sin embargo / sí','dort':'allí','du':'tú','durch':'por / a través de','ein':'un','eine':'una','einem':'un','einen':'un','einer':'una','eigentlich':'en realidad / por cierto','erst':'primero / recién','es':'eso','etwas':'algo','familie':'familia','finden':'encontrar / considerar','für':'para','ganz':'completamente / bastante','geben':'dar / haber','gegen':'contra / hacia','gehen':'ir','gehören':'pertenecer','geld':'dinero','genau':'exactamente','gerade':'justo / ahora mismo','gern':'con gusto','gerne':'con gusto','gut':'bueno / bien','haben':'tener','hat':'tiene','heute':'hoy','hier':'aquí','ich':'yo','ihm':'a él','ihn':'a él','ihr':'a ella / vuestro','ihre':'su / sus','immer':'siempre','in':'en','ist':'es / está','ja':'sí','jahr':'año','jahre':'años','jeder':'cada uno','jetzt':'ahora','kann':'puede','kein':'ningún','keine':'ninguna','kinder':'niños','kommen':'venir','können':'poder','lang':'largo','leben':'vivir / vida','leider':'lamentablemente','leute':'gente','machen':'hacer','mal':'vez','man':'uno / se','mehr':'más','mein':'mi','meine':'mi / mis','mensch':'persona','menschen':'personas / gente','mit':'con','möglich':'posible','muss':'debe / tiene que','müssen':'tener que / deber','nach':'después de / hacia','natürlich':'naturalmente / por supuesto','nein':'no','neu':'nuevo','nicht':'no','nichts':'nada','noch':'todavía / aún','nur':'solo','ob':'si','oder':'o','oft':'a menudo','ohne':'sin','schon':'ya','sehr':'muy','sein':'ser / estar','seine':'su / sus','seit':'desde','selbst':'mismo / incluso','sie':'ella / ellos / usted','sind':'son / están','so':'así / tan','soll':'debe','sollen':'deber','später':'más tarde','tag':'día','tage':'días','tun':'hacer','über':'sobre / por encima de','um':'a / alrededor de / para','und':'y','uns':'nos / nosotros','unser':'nuestro','unsere':'nuestra / nuestros','unter':'debajo de / entre','viel':'mucho','viele':'muchos','vielen':'muchos','vielleicht':'quizás','vom':'del','von':'de','vor':'antes / delante de','war':'era / estaba','waren':'eran / estaban','was':'qué / lo que','weil':'porque','weiter':'más / continuar','wenn':'si / cuando','werden':'convertirse / ser','wie':'cómo / como','wieder':'otra vez','will':'quiere','wir':'nosotros','wirklich':'realmente','wissen':'saber','wo':'dónde','wohl':'bien / probablemente','wollen':'querer','zu':'a / demasiado','zum':'al / para el','zur':'a la / para la','zusammen':'juntos','zwischen':'entre','zeit':'tiempo','uhr':'hora','arbeit':'trabajo','arbeiten':'trabajar','wohnung':'vivienda / piso','stadt':'ciudad','land':'país / campo','freund':'amigo','freunde':'amigos','frau':'mujer / señora','mann':'hombre / marido','kind':'niño','schule':'escuela','lernen':'aprender','sprechen':'hablar','sagen':'decir','frage':'pregunta','fragen':'preguntar','antwort':'respuesta','antworten':'responder','essen':'comer / comida','trinken':'beber','fahren':'ir / conducir','zug':'tren','bahnhof':'estación de tren','auto':'coche','straße':'calle','weg':'camino','urlaub':'vacaciones','reise':'viaje','termin':'cita','wochenende':'fin de semana','woche':'semana','morgen':'mañana','abend':'tarde / noche','mittag':'mediodía','nacht':'noche','stunde':'hora','stunden':'horas','minute':'minuto','minuten':'minutos','preis':'precio','kosten':'costar / costes','kaufen':'comprar','geschäft':'tienda / negocio','haus':'casa','zimmer':'habitación','essen':'comida / comer','gesund':'saludable / sano','gesundheit':'salud','problem':'problema','wichtig':'importante','idee':'idea','meinung':'opinión','erfahrung':'experiencia','vorteil':'ventaja','nachteil':'desventaja','möglichkeit':'posibilidad','internet':'internet','handy':'móvil','computer':'ordenador','eltern':'padres','mutter':'madre','vater':'padre','bruder':'hermano','schwester':'hermana','arzt':'médico','krankenhaus':'hospital','hilfe':'ayuda','helfen':'ayudar','fragen':'preguntar','antwort':'respuesta','anfangen':'empezar','beginnen':'empezar','ende':'fin','enden':'terminar','treffen':'encontrarse / reunión','besuchen':'visitar','bringen':'traer','nehmen':'tomar','sehen':'ver','hören':'oír / escuchar','lesen':'leer','schreiben':'escribir','verstehen':'entender','denken':'pensar','glauben':'creer','meinen':'opinar / querer decir','zeigen':'mostrar','erklären':'explicar','kennen':'conocer','heißen':'llamarse / significar','wohnen':'vivir / residir','spielen':'jugar','feiern':'celebrar','planen':'planificar','entscheiden':'decidir','bezahlen':'pagar','öffnen':'abrir','geschlossen':'cerrado','geöffnet':'abierto','schnell':'rápido','langsam':'lento','groß':'grande','klein':'pequeño','teuer':'caro','günstig':'económico','kostenlos':'gratis','schön':'bonito','schlecht':'malo','einfach':'fácil / sencillo','schwer':'difícil / pesado','richtig':'correcto','falsch':'incorrecto','frei':'libre','fertig':'listo','früh':'temprano','spät':'tarde','zusätzlich':'adicional','ungefähr':'aproximadamente','wahrscheinlich':'probablemente','trotzdem':'aun así','außerdem':'además','zuerst':'primero','danach':'después','gemeinsam':'juntos','stattfinden':'tener lugar','teilnehmen':'participar','einladen':'invitar','einladung':'invitación','nachricht':'mensaje','reservieren':'reservar','vergessen':'olvidar','pünktlich':'puntual','verkehr':'tráfico','unterkunft':'alojamiento','umgebung':'alrededores','freizeit':'tiempo libre','umwelt':'medioambiente','bildung':'educación','beruf':'profesión','bewerbung':'postulación / solicitud','bewerben':'postular / solicitar','verspätung':'retraso','gleis':'vía / andén','abfahrt':'salida','ankunft':'llegada','veranstaltung':'evento','empfehlen':'recomendar','verschieben':'aplazar','vereinbaren':'acordar / concertar','abholen':'recoger','besorgen':'conseguir / comprar','unterstützen':'apoyar','entscheiden':'decidir','erledigen':'hacer / resolver','bequem':'cómodo'
};

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
  // Apply curated neutral translations first.
  for(const x of words){const w=x.de.toLowerCase();if(STANDARD_ES[w])result[w]=STANDARD_ES[w]}
  try{
    const text=await fetch(DICT_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()});
    const dict:Record<string,string>={};
    for(const line of text.split('\n')){if(!line||line.startsWith('#')||!line.includes('::'))continue;const[esRaw,deRaw]=line.split('::',2);const es=clean(esRaw).split(';')[0].trim();if(!es)continue;for(const piece of deRaw.split(';')){const de=clean(piece).replace(/^sich\s+/i,'').toLowerCase();if(de&&wanted.has(de)&&!dict[de])dict[de]=es}}
    for(const x of words){const key=x.de.toLowerCase();if(result[key])continue;
      // Exact dictionary matches are safer than guessed stems.
      if(dict[key]){result[key]=dict[key];continue}
      for(const c of candidates(x.de).slice(1)){if(STANDARD_ES[c]){result[key]=STANDARD_ES[c];break}if(dict[c]){result[key]=dict[c];break}}
    }
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(result))}catch{}
  }catch(e){console.warn('No se pudo cargar traducción del corpus',e)}
  return result;
}

export function approxPronunciation(s:string){return s.toLowerCase().replace(/sch/g,'sh').replace(/tsch/g,'ch').replace(/ch/g,'j').replace(/z/g,'ts').replace(/w/g,'v').replace(/j/g,'y').replace(/ä/g,'e').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'s')}
