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
// v6 invalidates every older translation cache after a full quality-pass of the vocabulary pipeline.
const CACHE_KEY='telcb1-corpus-es-v6';
const AUDIT_KEY='telcb1-corpus-es-audit-v1';
function clean(x:string){return x.replace(/\{[^}]*\}|\[[^\]]*\]|\([^)]*\)/g,'').replace(/<[^>]*>/g,'').trim()}
function primary(x:string){return x.split('/')[0].split(';')[0].trim()}

// Neutral, everyday Spanish for B1 study. These meanings always win over raw dictionary glosses.
// The goal is recognition for TELC, not rare literary or hyper-literal dictionary senses.
const STANDARD_ES:Record<string,string>={
'aber':'pero','alle':'todos','allein':'solo','als':'como / que','also':'entonces','alt':'viejo / mayor','am':'en el','an':'en','andere':'otro','anderen':'otros','auch':'también','auf':'en / sobre','aus':'de / desde','bei':'en / con','beim':'al','beispiel':'ejemplo','bekommen':'recibir','bereits':'ya','besonders':'especialmente','besser':'mejor','bis':'hasta','bisschen':'un poco','bleiben':'quedarse','brauchen':'necesitar','da':'ahí','dabei':'al hacerlo','dann':'entonces / después','das':'eso','dass':'que','dein':'tu','deine':'tu','dem':'el / al','den':'el / a los','denn':'porque / pues','der':'el','deshalb':'por eso','die':'la','dies':'esto','diese':'este / esta','dieser':'este','doch':'sin embargo / sí que','dort':'allí','du':'tú','durch':'por','ein':'un','eine':'una','einem':'un','einen':'un','einer':'una','eigentlich':'en realidad','erst':'primero / recién','es':'eso','etwas':'algo','etwa':'aproximadamente','familie':'familia','fast':'casi','finden':'encontrar / parecer','für':'para','ganz':'completamente / todo','geben':'dar / haber','gegen':'contra','gehen':'ir','gehören':'pertenecer','geld':'dinero','genau':'exactamente','genug':'suficiente','gerade':'ahora mismo / justo','gern':'con gusto','gerne':'con gusto','gut':'bueno / bien','haben':'tener','hat':'tiene','heute':'hoy','hier':'aquí','häufig':'frecuentemente','ich':'yo','ihm':'a él','ihn':'a él','ihr':'a ella / su','ihre':'su','immer':'siempre','in':'en','ist':'es / está','ja':'sí','jahr':'año','jahre':'años','jahren':'años','jeder':'cada uno','jetzt':'ahora','kann':'puede','kein':'ningún','keine':'ninguna','kinder':'niños','kindern':'niños','kommen':'venir','können':'poder','lang':'largo','leben':'vivir / vida','leider':'lamentablemente','leute':'gente','machen':'hacer','mal':'vez','man':'uno / se','manchmal':'a veces','mehr':'más','mein':'mi','meine':'mi','meistens':'la mayoría de las veces','mensch':'persona','menschen':'personas','mit':'con','möglich':'posible','muss':'debe / tiene que','müssen':'deber / tener que','nach':'después de / hacia','natürlich':'por supuesto','nein':'no','neu':'nuevo','nicht':'no','nichts':'nada','noch':'todavía / aún','nur':'solo','ob':'si','oder':'o','oft':'a menudo','ohne':'sin','schon':'ya','sehr':'muy','sein':'ser / estar','seine':'su','seit':'desde','selbst':'mismo','selten':'rara vez','sie':'ella / ellos / usted','sind':'son / están','so':'así / tan','soll':'debe','sollen':'deber','später':'más tarde','tag':'día','tage':'días','tagen':'días','tun':'hacer','über':'sobre','um':'a / para / alrededor de','und':'y','uns':'nos','unser':'nuestro','unsere':'nuestra','unter':'debajo de / entre','viel':'mucho','viele':'muchos','vielen':'muchos','vielleicht':'quizás','vom':'del','von':'de','vor':'antes / delante de','war':'era / estaba','waren':'eran / estaban','was':'qué / lo que','weil':'porque','weiter':'continuar / más','wenig':'poco','weniger':'menos','wenn':'si / cuando','werden':'convertirse / llegar a ser','wie':'cómo / como','wieder':'otra vez','will':'quiere','wir':'nosotros','wirklich':'realmente','wissen':'saber','wo':'dónde','wohl':'probablemente','wollen':'querer','zu':'a / demasiado','zum':'al','zur':'a la','zusammen':'juntos','zwischen':'entre','zeit':'tiempo','uhr':'hora',
'arbeit':'trabajo','arbeiten':'trabajar','arbeitsplatz':'puesto de trabajo','arbeitszeit':'horario laboral','beruf':'profesión','firma':'empresa','chef':'jefe','chefin':'jefa','kollege':'colega','kollegin':'colega','ausbildung':'formación profesional','praktikum':'práctica profesional','bewerbung':'solicitud / postulación','bewerben':'postular / solicitar','gehalt':'sueldo','verdienen':'ganar / cobrar','kündigen':'renunciar / despedir','vertrag':'contrato','unterschreiben':'firmar','unterschrift':'firma',
'wohnung':'departamento','wohnungen':'departamentos','haus':'casa','häuser':'casas','zimmer':'habitación','miete':'arriendo / alquiler','mieten':'arrendar / alquilar','vermieten':'arrendar / alquilar a alguien','vermieter':'arrendador / propietario','umziehen':'mudarse','umzug':'mudanza','nachbar':'vecino','nachbarn':'vecinos','möbel':'muebles','küche':'cocina','bad':'baño','balkon':'balcón','stock':'piso / planta','adresse':'dirección','straße':'calle','ort':'lugar / localidad','stadt':'ciudad','land':'país','umgebung':'alrededores',
'freund':'amigo','freunde':'amigos','freunden':'amigos','freundin':'amiga / novia','frau':'mujer / señora','mann':'hombre','kind':'niño','kinder':'niños','eltern':'padres','mutter':'madre','vater':'padre','bruder':'hermano','schwester':'hermana','familie':'familia','verheiratet':'casado','ledig':'soltero','geburtstag':'cumpleaños','hochzeit':'boda',
'schule':'escuela','lernen':'aprender','kurs':'curso','prüfung':'examen','aufgabe':'tarea / ejercicio','übung':'ejercicio / práctica','antwort':'respuesta','antworten':'responder','frage':'pregunta','fragen':'preguntar','sprache':'idioma','wort':'palabra','wörter':'palabras','satz':'frase / oración','text':'texto','lesen':'leer','schreiben':'escribir','sprechen':'hablar','hören':'escuchar','verstehen':'entender','erklären':'explicar','wiederholen':'repetir','üben':'practicar','bestehen':'aprobar / existir','note':'nota','fehler':'error','richtig':'correcto','falsch':'incorrecto',
'essen':'comer / comida','trinken':'beber','frühstück':'desayuno','mittagessen':'almuerzo','abendessen':'cena','getränk':'bebida','wasser':'agua','kaffee':'café','tee':'té','brot':'pan','fleisch':'carne','fisch':'pescado','obst':'fruta','gemüse':'verduras','restaurant':'restaurante','café':'café','bestellen':'pedir / ordenar','bezahlen':'pagar','rechnung':'cuenta / factura','schmecken':'tener buen sabor / saber',
'fahren':'ir / conducir','zug':'tren','bahn':'tren / ferrocarril','bahnhof':'estación de tren','bus':'bus / autobús','auto':'auto','fahrrad':'bicicleta','flug':'vuelo','flughafen':'aeropuerto','ticket':'boleto / ticket','fahrkarte':'boleto / pasaje','gleis':'andén','abfahrt':'salida','ankunft':'llegada','verspätung':'retraso','verkehr':'tráfico','weg':'camino','kreuzung':'cruce','ampel':'semáforo','haltestelle':'parada','einsteigen':'subir / entrar','aussteigen':'bajar / salir','umsteigen':'hacer transbordo','abholen':'recoger',
'urlaub':'vacaciones','reise':'viaje','reisen':'viajar','hotel':'hotel','unterkunft':'alojamiento','koffer':'maleta','gepäck':'equipaje','reservieren':'reservar','buchen':'reservar','besuchen':'visitar','ausflug':'excursión','strand':'playa','meer':'mar','berg':'montaña','berge':'montañas',
'termin':'cita','wochenende':'fin de semana','woche':'semana','wochen':'semanas','morgen':'mañana','abend':'tarde / noche','mittag':'mediodía','nacht':'noche','stunde':'hora','stunden':'horas','minute':'minuto','minuten':'minutos','heute':'hoy','gestern':'ayer','morgen':'mañana','übermorgen':'pasado mañana','vorgestern':'anteayer','monat':'mes','monate':'meses','datum':'fecha','kalender':'calendario',
'preis':'precio','preise':'precios','kosten':'costar / costos','kaufen':'comprar','verkaufen':'vender','geschäft':'tienda / negocio','laden':'tienda / cargar','markt':'mercado','supermarkt':'supermercado','angebot':'oferta','rabatt':'descuento','günstig':'económico','teuer':'caro','kostenlos':'gratis','geld':'dinero','konto':'cuenta bancaria','bank':'banco','karte':'tarjeta / mapa','bar':'en efectivo','sparen':'ahorrar','zahlen':'pagar','wechseln':'cambiar',
'gesund':'saludable','gesundheit':'salud','krank':'enfermo','arzt':'médico','ärztin':'médica','krankenhaus':'hospital','apotheke':'farmacia','medizin':'medicina','medikament':'medicamento','schmerz':'dolor','schmerzen':'dolores','kopf':'cabeza','bauch':'vientre / abdomen','rücken':'espalda','fieber':'fiebre','husten':'tos','unfall':'accidente','versicherung':'seguro','hilfe':'ayuda','helfen':'ayudar',
'problem':'problema','probleme':'problemas','wichtig':'importante','idee':'idea','ideen':'ideas','meinung':'opinión','erfahrung':'experiencia','erfahrungen':'experiencias','vorteil':'ventaja','vorteile':'ventajas','nachteil':'desventaja','nachteile':'desventajas','möglichkeit':'posibilidad','möglichkeiten':'posibilidades','internet':'internet','handy':'celular','computer':'computadora','nachricht':'mensaje','email':'correo electrónico','brief':'carta','paket':'paquete','post':'correo / oficina de correos','telefon':'teléfono',
'anfangen':'empezar','beginnen':'empezar','aufhören':'parar / dejar de','ende':'fin','enden':'terminar','treffen':'encontrarse / encuentro','bringen':'traer','nehmen':'tomar','sehen':'ver','denken':'pensar','glauben':'creer','meinen':'opinar / querer decir','zeigen':'mostrar','kennen':'conocer','heißen':'llamarse / significar','wohnen':'vivir / residir','spielen':'jugar','feiern':'celebrar','planen':'planificar','entscheiden':'decidir','öffnen':'abrir','schließen':'cerrar','anmelden':'inscribirse / registrarse','abmelden':'darse de baja','ausfüllen':'rellenar / completar','absagen':'cancelar','zusagen':'aceptar / confirmar','schicken':'enviar','senden':'enviar','erhalten':'recibir','benutzen':'usar','ändern':'cambiar','verbessern':'mejorar','vorbereiten':'preparar','vergessen':'olvidar','erinnern':'recordar','warten':'esperar','suchen':'buscar','verlieren':'perder','gewinnen':'ganar','passieren':'pasar / ocurrir','schaffen':'lograr / crear','versuchen':'intentar','wünschen':'desear','hoffen':'esperar / tener esperanza','brauchen':'necesitar','dürfen':'poder / tener permiso','mögen':'gustar','möchte':'quisiera','sollen':'deber','müssen':'tener que','können':'poder',
'geschlossen':'cerrado','geöffnet':'abierto','schnell':'rápido','langsam':'lento','groß':'grande','klein':'pequeño','schön':'bonito','schlecht':'malo','einfach':'fácil / sencillo','schwer':'difícil / pesado','frei':'libre','fertig':'listo','früh':'temprano','spät':'tarde','warm':'cálido','kalt':'frío','heiß':'caliente','nett':'agradable / simpático','freundlich':'amable','müde':'cansado','glücklich':'feliz','zufrieden':'satisfecho','interessant':'interesante','langweilig':'aburrido','gefährlich':'peligroso','sicher':'seguro','erlaubt':'permitido','verboten':'prohibido','laut':'ruidoso / fuerte','leise':'silencioso / bajo','sauber':'limpio','schmutzig':'sucio','modern':'moderno','praktisch':'práctico','bequem':'cómodo',
'zusätzlich':'adicional','ungefähr':'aproximadamente','wahrscheinlich':'probablemente','trotzdem':'aun así','außerdem':'además','zuerst':'primero','danach':'después','gemeinsam':'juntos','stattfinden':'tener lugar','teilnehmen':'participar','einladen':'invitar','einladung':'invitación','pünktlich':'puntual','freizeit':'tiempo libre','umwelt':'medioambiente','bildung':'educación','veranstaltung':'evento','empfehlen':'recomendar','verschieben':'aplazar / posponer','vereinbaren':'acordar / concertar','besorgen':'conseguir / comprar','unterstützen':'apoyar','erledigen':'resolver / hacer','sofort':'inmediatamente','bald':'pronto','früher':'antes / anteriormente','spätestens':'a más tardar','mindestens':'al menos','höchstens':'como máximo','obwohl':'aunque','damit':'para que / con eso','deswegen':'por eso','während':'mientras / durante','wegen':'por / debido a','trotz':'a pesar de','bevor':'antes de que','nachdem':'después de que','falls':'en caso de que / si','sondern':'sino','gegenüber':'enfrente de / frente a',
'wetter':'clima / tiempo','regen':'lluvia','regnen':'llover','schnee':'nieve','schneien':'nevar','sonne':'sol','wind':'viento','wolke':'nube','wolken':'nubes','temperatur':'temperatura'
};

const IRREGULAR_BASE:Record<string,string>={gibt:'geben',geht:'gehen',ging:'gehen',gegangen:'gehen',kommt:'kommen',kam:'kommen',finde:'finden',fand:'finden',macht:'machen',gemacht:'machen',weiß:'wissen',wusste:'wissen',fährt:'fahren',fuhr:'fahren',gefahren:'fahren',läuft:'laufen',lief:'laufen',sieht:'sehen',sah:'sehen',gesehen:'sehen',bleibt:'bleiben',blieb:'bleiben',hilft:'helfen',half:'helfen',nimmt:'nehmen',nahm:'nehmen',spricht:'sprechen',sprach:'sprechen',liest:'lesen',las:'lesen',schreibt:'schreiben',schrieb:'schreiben',isst:'essen',aß:'essen',trifft:'treffen',traf:'treffen',hält:'halten',hielt:'halten',lässt:'lassen',ließ:'lassen',fällt:'fallen',fiel:'fallen',beginnt:'beginnen',begann:'beginnen',gefällt:'gefallen',denke:'denken',glaube:'glauben',wurde:'werden',geworden:'werden',gewesen:'sein',gesagt:'sagen',gefunden:'finden',gearbeitet:'arbeiten',gelernt:'lernen',gebracht:'bringen',genommen:'nehmen',geschrieben:'schreiben',gelesen:'lesen',gesprochen:'sprechen',getrunken:'trinken',gegessen:'essen',getroffen:'treffen',verstanden:'verstehen',vergessen:'vergessen',gewonnen:'gewinnen',verloren:'verlieren'};

// Only generate an inflection base when that base is already curated. This prevents accidental
// matches such as a random adjective/noun being transformed into an unrelated dictionary word.
function candidates(word:string){
  const w=word.toLowerCase();const out=[w];
  if(IRREGULAR_BASE[w])out.push(IRREGULAR_BASE[w]);
  const possible:string[]=[];
  if(w.endsWith('est'))possible.push(w.slice(0,-3)+'en');
  if(w.endsWith('st'))possible.push(w.slice(0,-2)+'en');
  if(w.endsWith('tet'))possible.push(w.slice(0,-3)+'en');
  if(w.endsWith('et'))possible.push(w.slice(0,-2)+'en');
  if(w.endsWith('te'))possible.push(w.slice(0,-2)+'en');
  if(w.endsWith('t'))possible.push(w.slice(0,-1)+'en');
  if(w.endsWith('e'))possible.push(w.slice(0,-1)+'en');
  if(w.endsWith('n'))possible.push(w.slice(0,-1));
  if(w.endsWith('en'))possible.push(w.slice(0,-2),w.slice(0,-1));
  if(w.endsWith('er'))possible.push(w.slice(0,-2));
  if(w.endsWith('s'))possible.push(w.slice(0,-1));
  for(const p of possible)if(STANDARD_ES[p])out.push(p);
  return [...new Set(out)];
}

const BAD_GLOSSES=new Set(['jota','ápice','miaja','adarme','poquedad','pizca','tilde','maravedí','ochavo','ardite','ápice de','ni jota']);
const COMMON_ES=new Set(('a al algo alguien algunos antes aquí así aunque ayer bajo bien bueno cada casi casa como con contra cuando de del desde después donde dos durante el ella ellos en entre era es esa ese eso estar este esto familia gente haber hacer hasta hay hoy ir la las lo los más me menos mi muy nada ni no nos o para pero poco por porque puede que qué quien se ser si sí sin sobre solo son su sus también te tener tiempo todo trabajo tres tu un una unos usted va vez vida y ya yo aprender hablar escuchar leer escribir entender preguntar responder comprar pagar viajar llegar salir entrar vivir trabajar estudiar examen curso problema ayuda dinero precio oferta casa departamento ciudad país amigo madre padre niño comida agua salud médico tren bus auto calle día semana mes año hora tarde noche mañana feliz cansado enfermo importante fácil difícil rápido lento grande pequeño nuevo viejo bonito malo caro barato gratis posible seguro peligroso abierto cerrado primero después pronto siempre nunca todavía quizás realmente aproximadamente juntos mismo otro mejor peor mucho muchos suficiente menos').split(/\s+/));

function glossParts(esRaw:string){
  const cleaned=clean(esRaw).replace(/\s+/g,' ').trim();if(!cleaned)return[];
  return cleaned.split(/\s*[;/]\s*/).map(x=>x.trim()).filter(Boolean);
}
function glossScore(gloss:string){
  const g=gloss.toLowerCase().trim();if(!g)return-999;if(BAD_GLOSSES.has(g))return-999;
  let score=0;const words=g.split(/\s+/).filter(Boolean);
  if(words.length<=3)score+=8;else if(words.length>6)score-=10;
  if(/^[a-záéíóúüñ¿?¡! -]+$/i.test(g))score+=4;else score-=6;
  if(/[0-9=@<>|]/.test(g))score-=20;
  if(/\b(fig|lit|fam|coloq|arcaic|ant|poét|vulg|bot|zool|jur|mil)\b/i.test(g))score-=20;
  const common=words.filter(w=>COMMON_ES.has(w.replace(/[¿?¡!.,]/g,''))).length;
  score+=common*5;
  if(words.length&&common===words.length)score+=8;
  if(g.length>45)score-=8;
  return score;
}
function chooseGloss(values:string[],rank:number){
  const unique=[...new Set(values.map(v=>primary(v)).filter(Boolean))];
  const ranked=unique.map(v=>({v,score:glossScore(v)})).sort((a,b)=>b.score-a.score||a.v.length-b.v.length);
  const best=ranked[0];const threshold=rank<=800?8:4;
  return best&&best.score>=threshold?best.v:'';
}

export async function loadSpanishMap(words:CorpusWord[]):Promise<Record<string,string>>{
  try{const saved=localStorage.getItem(CACHE_KEY);if(saved)return JSON.parse(saved)}catch{}
  const wanted=new Set<string>();for(const x of words)for(const c of candidates(x.de))wanted.add(c);
  const result:Record<string,string>={};
  for(const x of words){const key=x.de.toLowerCase();for(const c of candidates(x.de)){if(STANDARD_ES[c]){result[key]=STANDARD_ES[c];break}}}
  const questionable:string[]=[];const missing:string[]=[];
  try{
    const text=await fetch(DICT_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()});
    const dict:Record<string,string[]>={};
    for(const line of text.split('\n')){
      if(!line||line.startsWith('#')||!line.includes('::'))continue;
      const[esRaw,deRaw]=line.split('::',2);const options=glossParts(esRaw);if(!options.length)continue;
      for(const piece of deRaw.split(';')){
        const de=clean(piece).replace(/^sich\s+/i,'').toLowerCase();
        if(de&&wanted.has(de)){if(!dict[de])dict[de]=[];dict[de].push(...options)}
      }
    }
    for(const x of words){
      const key=x.de.toLowerCase();if(result[key])continue;
      let selected='';
      for(const c of candidates(x.de)){const options=dict[c]||[];if(options.length){selected=chooseGloss(options,x.rank);if(selected)break}}
      if(selected)result[key]=selected;else missing.push(x.de);
    }
    // Quality audit: anything that still looks like a rare/technical gloss is removed rather than taught incorrectly.
    for(const x of words){const key=x.de.toLowerCase(),value=result[key];if(!value)continue;if(STANDARD_ES[key])continue;const score=glossScore(value);if(score<4||BAD_GLOSSES.has(value.toLowerCase())){questionable.push(`${x.de} → ${value}`);delete result[key]}}
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(result));localStorage.setItem(AUDIT_KEY,JSON.stringify({checked:words.length,translated:Object.keys(result).length,missing:missing.slice(0,250),questionable:questionable.slice(0,250),generatedAt:new Date().toISOString()}))}catch{}
    if(questionable.length)console.warn('Traducciones excluidas por baja confianza:',questionable);
    if(missing.length)console.info('Palabras sin traducción suficientemente confiable:',missing.length);
  }catch(e){console.warn('No se pudo cargar traducción del corpus',e)}
  return result;
}

export function getSpanishTranslationAudit(){try{return JSON.parse(localStorage.getItem(AUDIT_KEY)||'null')}catch{return null}}
export function approxPronunciation(s:string){return s.toLowerCase().replace(/sch/g,'sh').replace(/tsch/g,'ch').replace(/ch/g,'j').replace(/z/g,'ts').replace(/w/g,'v').replace(/j/g,'y').replace(/ä/g,'e').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'s')}
