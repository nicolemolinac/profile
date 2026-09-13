import React,{useEffect,useMemo,useState}from'react';
import{Volume2,CheckCircle2,Search}from'lucide-react';
import{VOCAB}from'./data';
import{loadCorpusWords,loadSpanishMap,approxPronunciation,type CorpusWord}from'./corpus';

type View='study'|'all'|'learned'|'review'|'pending';
type StudyMode='new'|'errors';
type WordRow={id:string;de:string;es:string;pron:string;chunk:string;roi:number;category:string;rank:number;freq?:number;speaking?:number;writing?:number;listening?:number;isCorpus:boolean};
type Example={de:string;es:string;fromExam:boolean};
const norm=(s:string)=>s.toLowerCase().replace(/^(der|die|das)\s+/,'').replace(/^sich\s+/,'').trim();
const say=(t:string,r=.82)=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=r;speechSynthesis.speak(u)};
const audio=(e:React.MouseEvent,t:string,r=.82)=>{e.preventDefault();e.stopPropagation();say(t,r)};
const H=({e,t,s}:{e:string,t:string,s:string})=><header className="vocabHeader"><div className="eyebrow">{e}</div><h1>{t}</h1><p>{s}</p></header>;

// Sentences are taken from the user's SPEAKING B1 / WRITING B1 practice documents.
const EXAM_EXAMPLES:Record<string,[string,string]>={
 internet:['Ich finde, dass das Internet sehr wichtig ist.','Creo que Internet es muy importante.'],
 kaufen:['Wer regelmäßig selbst einkauft und kocht, spart auf Dauer viel Geld.','Quien compra y cocina regularmente por su cuenta ahorra mucho dinero a largo plazo.'],
 sparen:['Man kann Geld sparen.','Se puede ahorrar dinero.'],
 geld:['Viele Menschen haben nicht viel Geld.','Muchas personas no tienen mucho dinero.'],
 wohnung:['Ich wohne in einer kleinen Stadtwohnung.','Vivo en un departamento pequeño en la ciudad.'],
 miete:['Wenn man mit anderen zusammenwohnt, kann man die Miete und die Nebenkosten teilen.','Cuando se vive con otras personas, se pueden compartir el alquiler y los gastos adicionales.'],
 teilen:['Mit Nachbarn kann man auch schöne Momente teilen.','Con los vecinos también se pueden compartir momentos bonitos.'],
 nachbarn:['Mit Nachbarn kann man auch schöne Momente teilen.','Con los vecinos también se pueden compartir momentos bonitos.'],
 einladen:['Man kann Freunde einladen, Musik hören oder einfach mal allein sein.','Se puede invitar a amigos, escuchar música o simplemente estar solo un rato.'],
 freunde:['Meine Freunde hatten frei, aber ich musste arbeiten.','Mis amigos tenían libre, pero yo tenía que trabajar.'],
 familie:['Ich kann mit meiner Familie essen, mit Freunden sprechen oder Sport machen.','Puedo comer con mi familia, hablar con amigos o hacer deporte.'],
 arbeit:['Ich habe früher im Supermarkt gearbeitet.','Antes trabajaba en un supermercado.'],
 arbeiten:['Viele Menschen haben nicht viel Geld.','Muchas personas no tienen mucho dinero.'],
 arbeitszeiten:['Ich finde: Feste Arbeitszeiten sind besser.','Creo que los horarios de trabajo fijos son mejores.'],
 job:['Jetzt habe ich einen Job mit festen Zeiten.','Ahora tengo un trabajo con horarios fijos.'],
 kurs:['Man kann alles nachlesen, lernen, Sprachen üben, Hausaufgaben machen, Kurse besuchen.','Se puede consultar todo, aprender, practicar idiomas, hacer tareas y asistir a cursos.'],
 lernen:['Man kann alles nachlesen, lernen, Sprachen üben, Hausaufgaben machen, Kurse besuchen.','Se puede consultar todo, aprender, practicar idiomas, hacer tareas y asistir a cursos.'],
 schule:['Besonders in der Schule kann das Kind Probleme bekommen.','Especialmente en la escuela, el niño puede tener problemas.'],
 helfen:['Dann braucht es viel Hilfe und Unterstützung.','Entonces necesita mucha ayuda y apoyo.'],
 hilfe:['Vielleicht machen wir einen Hilfeplan, damit nicht alles auf eine Person fällt.','Quizás podemos hacer un plan de ayuda para que no todo recaiga sobre una sola persona.'],
 vorteil:['Wissen ist überall - das ist ein großer Vorteil.','El conocimiento está en todas partes: eso es una gran ventaja.'],
 vorteile:['Ich glaube, eine Stadtwohnung hat viele Vorteile.','Creo que un departamento en la ciudad tiene muchas ventajas.'],
 nachteil:['Dann ist das ein Nachteil.','Entonces eso es una desventaja.'],
 meinung:['Man kann seine Meinung sagen oder ein eigenes Projekt starten.','Se puede expresar la propia opinión o empezar un proyecto propio.'],
 reisen:['Es macht viel Spaß, zusammen neue Orte zu entdecken.','Es muy entretenido descubrir lugares nuevos juntos.'],
 urlaub:['Ich überlege gerade, ob ich nach der Feier noch ein paar Tage dortbleiben und ein bisschen Urlaub machen soll.','Estoy pensando si quedarme unos días después de la celebración y tomarme unas pequeñas vacaciones.'],
 zug:['Ich finde, wir könnten mit dem Zug nach Garmisch-Partenkirchen fahren.','Creo que podríamos ir en tren a Garmisch-Partenkirchen.'],
 hotel:['Ich habe bereits ein kleines Hotel in der Nähe gefunden.','Ya encontré un pequeño hotel cerca.'],
 feiern:['Ich finde, eine Hochzeit sollte man mit Familie und Freunden feiern.','Creo que una boda debería celebrarse con la familia y los amigos.'],
 hochzeit:['Eine Hochzeit ist ein besonderer Moment im Leben.','Una boda es un momento especial en la vida.'],
 geschenk:['Für das Geschenk könnten wir vielleicht ein Buch und ein paar Süßigkeiten kaufen.','Para el regalo podríamos comprar un libro y algunos dulces.'],
 krankenhaus:['Ich komme diese Woche gern mit ins Krankenhaus.','Esta semana iré encantado contigo al hospital.'],
 bewerbung:['In meiner Bewerbung habe ich zuerst kurz geschrieben, wer ich bin, wo ich lebe und was ich mache.','En mi postulación primero escribí brevemente quién soy, dónde vivo y qué hago.'],
 bewerben:['Ich würde mich gern bewerben.','Me gustaría postular.'],
 zuverlässig:['Wichtig ist, dass du schreibst, dass du zuverlässig, freundlich und geduldig bist.','Es importante que escribas que eres responsable, amable y paciente.'],
 treffen:['Ich hoffe sehr, dass wir uns dann treffen können!','Espero mucho que podamos encontrarnos entonces.'],
 musik:['Was die Musik betrifft, höre ich am liebsten Pop und Rock.','En cuanto a la música, lo que más me gusta escuchar es pop y rock.'],
 stadt:['In der Stadt ist alles nah.','En la ciudad todo está cerca.'],
 auto:['Man spart Zeit und braucht kein Auto.','Se ahorra tiempo y no se necesita auto.'],
 kochen:['Zu Hause zu kochen ist nämlich viel Aufwand.','Cocinar en casa requiere bastante esfuerzo.'],
 essen:['Man kann zusammen kochen, essen und reden.','Se puede cocinar, comer y conversar juntos.'],
 gesund:['Selbst kochen ist gesünder, umweltfreundlicher und bringt mehr Lebensqualität.','Cocinar uno mismo es más saludable, más ecológico y aporta más calidad de vida.'],
 wochenende:['Auch am Wochenende musste ich oft arbeiten.','También tenía que trabajar a menudo los fines de semana.'],
 zeit:['Das spart Zeit.','Eso ahorra tiempo.'],
 prüfen:['Die Blutkonserve wird später geprüft und zur richtigen Klinik gebracht.','La bolsa de sangre se revisa después y se lleva a la clínica adecuada.'],
 planen:['Ich konnte nie etwas planen.','Nunca podía planificar nada.'],
 besuchen:['Man kann Kurse besuchen.','Se puede asistir a cursos.'],
 schreiben:['Ich habe über das Internet gelernt, wie man ein Bewerbungsschreiben schreibt.','Aprendí por Internet cómo escribir una carta de postulación.']
};
const FIXED_ES:Record<string,string>={teilen:'compartir'};
function examExample(w:WordRow):Example{
 const k=norm(w.de),hit=EXAM_EXAMPLES[k];
 if(hit)return{de:hit[0],es:hit[1],fromExam:true};
 const es=w.es.split('/')[0].trim();
 if(/^der |^die |^das /.test(w.de.toLowerCase())||/^[A-ZÄÖÜ]/.test(w.de))return{de:`Das Thema „${w.de}“ ist im Alltag oft wichtig.`,es:`El tema «${es}» suele ser importante en la vida cotidiana.`,fromExam:false};
 if(/en$/.test(k))return{de:`Ich kann „${w.de}“ in einer typischen B1-Situation benutzen.`,es:`Puedo usar «${es}» en una situación típica de nivel B1.`,fromExam:false};
 return{de:`In der Prüfung kann das Wort „${w.de}“ nützlich sein.`,es:`En el examen puede ser útil la palabra «${es}».`,fromExam:false};
}

export default function VocabCoach({p,setP}:any){
 const[view,setView]=useState<View>('study'),[mode,setMode]=useState<StudyMode>('new'),[i,setI]=useState(0),[flip,setFlip]=useState(false),[q,setQ]=useState(''),[corpus,setCorpus]=useState<CorpusWord[]>([]),[esMap,setEsMap]=useState<Record<string,string>>({}),[loading,setLoading]=useState(true),[visible,setVisible]=useState(150);
 useEffect(()=>{let live=true;loadCorpusWords().then(async rows=>{if(!live)return;setCorpus(rows);const tr=await loadSpanishMap(rows);if(live)setEsMap(tr);setLoading(false)}).catch(e=>{console.error(e);setLoading(false)});return()=>{live=false}},[]);
 useEffect(()=>{setVisible(150);setI(0);setFlip(false)},[view,q,mode]);
 const curatedByNorm=useMemo(()=>new Map(VOCAB.map(x=>[norm(x.de),x])),[]);
 const words=useMemo<WordRow[]>(()=>{if(!corpus.length)return VOCAB.map((x:any,idx:number)=>({...x,rank:idx+1,isCorpus:false}));const corpusNorm=new Set(corpus.map(x=>norm(x.de)));const rows=corpus.map(x=>{const c:any=curatedByNorm.get(norm(x.de)),fixed=FIXED_ES[norm(x.de)];return{id:x.id,de:x.de,es:fixed||c?.es||esMap[x.de.toLowerCase()]||'',pron:c?.pron||approxPronunciation(x.de),chunk:c?.chunk||'',roi:x.roi,category:c?.category||'corpus',rank:x.rank,freq:x.freq,speaking:x.speaking,writing:x.writing,listening:x.listening,isCorpus:true}});const extras=VOCAB.filter(x=>!corpusNorm.has(norm(x.de))).map((x:any,idx:number)=>({...x,es:FIXED_ES[norm(x.de)]||x.es,rank:corpus.length+idx+1,isCorpus:false}));return[...rows,...extras]},[corpus,esMap,curatedByNorm]);
 const ordered=useMemo(()=>[...words].sort((a,b)=>b.roi-a.roi||a.rank-b.rank),[words]);
 const reviewIds:string[]=p.review||[];
 const translated=useMemo(()=>ordered.filter(v=>!!v.es),[ordered]);
 const learned=p.known.filter((id:string)=>words.some(x=>x.id===id)).length;
 const errorWords=useMemo(()=>translated.filter(v=>reviewIds.includes(v.id)&&!p.known.includes(v.id)),[translated,reviewIds,p.known]);
 const newWords=useMemo(()=>translated.filter(v=>!p.known.includes(v.id)&&!reviewIds.includes(v.id)),[translated,p.known,reviewIds]);
 const remainingTotal=Math.max(0,words.length-learned);
 const queue=mode==='errors'?errorWords:newWords;
 const v=queue.length?queue[i%queue.length]:undefined;
 const reviewCount=errorWords.length;
 const missing=words.filter(x=>!x.es).length;
 const filtered=useMemo(()=>ordered.filter(v=>(view==='learned'?p.known.includes(v.id):view==='review'?reviewIds.includes(v.id):view==='pending'?!p.known.includes(v.id):true)&&(`${v.de} ${v.es}`.toLowerCase().includes(q.toLowerCase()))),[ordered,view,p.known,reviewIds,q]);
 function reveal(){if(!v||flip)return;setFlip(true);say(v.de)}
 function mark(ok:boolean){if(!v)return;setP({...p,xp:p.xp+(ok?8:2),known:ok?[...new Set([...p.known,v.id])]:p.known.filter((x:string)=>x!==v.id),review:ok?reviewIds.filter(x=>x!==v.id):[...new Set([...reviewIds,v.id])]});setI(x=>x+1);setFlip(false)}
 const example=v?examExample(v):null;
 return <div className="vocabPage"><H e={loading?'CARGANDO CORPUS…':`${learned}/${words.length} APRENDIDAS · ${reviewCount} PARA REPASAR`} t="2.000+ palabras TELC por ROI." s="Avanza por vocabulario nuevo sin que tus errores vuelvan al inicio. Cuando quieras, cambia a Repasar errores."/>
 <div className="segmented vocabTabs"><button className={view==='study'?'sel':''} onClick={()=>setView('study')}>Estudiar</button><button className={view==='all'?'sel':''} onClick={()=>setView('all')}>Todas ({words.length})</button><button className={view==='learned'?'sel':''} onClick={()=>setView('learned')}>Aprendidas ({learned})</button><button className={view==='review'?'sel':''} onClick={()=>setView('review')}>Repaso ({reviewCount})</button><button className={view==='pending'?'sel':''} onClick={()=>setView('pending')}>Faltan ({remainingTotal})</button></div>
 {view==='study'?<><div className="segmented vocabModes"><button className={mode==='new'?'sel':''} onClick={()=>setMode('new')}>Seguir avanzando ({remainingTotal})</button><button className={mode==='errors'?'sel':''} onClick={()=>setMode('errors')}>Repasar errores ({reviewCount})</button></div>{loading?<div className="glass sideCard"><h3>Preparando vocabulario…</h3></div>:v?<div className="studyGrid vocabStudy"><div className={'flash '+(flip?'flipped':'')} onClick={()=>!flip&&reveal()}><span className="roi">ROI {v.roi}</span>{!flip?<><small>{mode==='errors'?'REPASO DE ERRORES':'PALABRA NUEVA · AVANZA HASTA EL FINAL'}</small><h2>{v.de}</h2>{v.isCorpus&&<p>Corpus #{v.rank} · frecuencia {v.freq} · S {v.speaking} · W {v.writing} · L {v.listening}</p>}<p>Piensa el significado en español y luego revela.</p><button className="primary" onClick={e=>{e.preventDefault();e.stopPropagation();reveal()}}>Revelar significado</button></>:<><small>TRADUCCIÓN</small><h2>{v.es}</h2><div className="pron">🇩🇪 {v.de} · 🗣 {v.pron}</div>{example&&<blockquote><small>{example.fromExam?'DE TUS EXÁMENES TELC':'EJEMPLO B1'}</small><b>{example.de}</b><br/><span>{example.es}</span></blockquote>}<button className="audioBtn" onClick={e=>audio(e,example?.de||v.de)}><Volume2/>Escuchar ejemplo</button></>}</div><div className="glass sideCard"><h3>¿Reconociste el significado?</h3><p>“Todavía no” guarda la palabra en Repasar errores, pero no la vuelve a meter en tu cola de palabras nuevas.</p><button onClick={()=>mark(false)}>Todavía no</button><button className="good" onClick={()=>mark(true)}><CheckCircle2/>Sí, fácil</button></div></div>:<div className="glass sideCard"><h3>{mode==='errors'?'No tienes errores pendientes 🎉':'Terminaste las palabras nuevas con traducción 🎉'}</h3><p>{missing?`${missing} entradas todavía no tienen traducción y por eso no aparecen como tarjeta hasta que el diccionario las resuelva.`:mode==='errors'?'Puedes volver a Seguir avanzando.':'Ahora sí puedes dedicarte al repaso.'}</p></div>}</>:<><div className="search"><Search size={17}/><input placeholder="Buscar en 2.000+ palabras…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="wordList">{filtered.slice(0,visible).map(x=><div className="wordRow" key={x.id}><span className="rank">#{x.rank}</span><div><b>{x.de}</b><small>{x.es||'Sin traducción — excluida de estudio'}{x.isCorpus?` · freq ${x.freq} · S${x.speaking} W${x.writing} L${x.listening}`:` · ${x.category}`}{reviewIds.includes(x.id)?' · REPASO':''}</small></div><span className="score">ROI {x.roi}</span><button onClick={e=>audio(e,x.de)}><Volume2 size={15}/></button><span className={p.known.includes(x.id)?'doneDot':'todoDot'}>{p.known.includes(x.id)?'✓':reviewIds.includes(x.id)?'↻':'•'}</span></div>)}</div>{visible<filtered.length&&<button className="ghost" onClick={()=>setVisible(x=>x+150)}>Cargar 150 más ({filtered.length-visible} restantes)</button>}</>}</div>
}
