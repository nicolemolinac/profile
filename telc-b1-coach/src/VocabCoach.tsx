import React,{useEffect,useMemo,useState}from'react';
import{Volume2,CheckCircle2,Search}from'lucide-react';
import{VOCAB}from'./data';
import{loadCorpusWords,loadSpanishMap,approxPronunciation,type CorpusWord}from'./corpus';
import{findExamExample}from'./examExamples';

type View='study'|'all'|'learned'|'review'|'pending';
type StudyMode='new'|'errors';
type WordRow={id:string;de:string;es:string;pron:string;chunk:string;roi:number;category:string;rank:number;freq?:number;speaking?:number;writing?:number;listening?:number;isCorpus:boolean};
type Example={de:string;es:string;source:string;invented?:boolean};
const norm=(s:string)=>s.toLowerCase().replace(/^(der|die|das)\s+/,'').replace(/^sich\s+/,'').trim();
const say=(t:string,r=.82)=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=r;speechSynthesis.speak(u)};
const audio=(e:React.MouseEvent,t:string,r=.82)=>{e.preventDefault();e.stopPropagation();say(t,r)};
const H=({e,t,s}:{e:string,t:string,s:string})=><header className="vocabHeader"><div className="eyebrow">{e}</div><h1>{t}</h1><p>{s}</p></header>;
const FIXED_ES:Record<string,string>={teilen:'compartir'};

const INVENTED:Record<string,[string,string]>={
 übernehmen:['Kannst du nächste Woche die Organisation übernehmen?','¿Puedes hacerte cargo de la organización la próxima semana?'],
 luft:['Ich brauche kurz frische Luft.','Necesito un poco de aire fresco.'],
 entscheiden:['Wir müssen heute entscheiden, was wir am Wochenende machen.','Tenemos que decidir hoy qué haremos el fin de semana.'],
 absagen:['Ich muss den Termin leider absagen.','Lamentablemente tengo que cancelar la cita.'],
 verschieben:['Können wir den Termin auf Montag verschieben?','¿Podemos aplazar la cita para el lunes?'],
 empfehlen:['Ich kann dir diesen Kurs wirklich empfehlen.','Realmente puedo recomendarte este curso.'],
 vereinbaren:['Ich möchte einen Termin für nächste Woche vereinbaren.','Quisiera concertar una cita para la próxima semana.'],
 teilnehmen:['Ich möchte gern an dem Kurs teilnehmen.','Me gustaría participar en el curso.'],
 ausfüllen:['Sie müssen dieses Formular zuerst ausfüllen.','Primero tiene que completar este formulario.'],
 anmelden:['Ich möchte mich für den Deutschkurs anmelden.','Quiero inscribirme en el curso de alemán.'],
 erlauben:['Meine Eltern erlauben mir, am Wochenende länger auszugehen.','Mis padres me permiten salir hasta más tarde el fin de semana.'],
 vergessen:['Ich habe leider meinen Termin vergessen.','Lamentablemente olvidé mi cita.'],
 erinnern:['Kannst du mich morgen an den Termin erinnern?','¿Puedes recordarme mañana la cita?'],
 vorbereiten:['Ich muss mich gut auf die Prüfung vorbereiten.','Tengo que prepararme bien para el examen.'],
 verbessern:['Ich möchte mein Deutsch vor der Prüfung verbessern.','Quiero mejorar mi alemán antes del examen.'],
 erklären:['Kannst du mir bitte erklären, wie das funktioniert?','¿Puedes explicarme, por favor, cómo funciona eso?'],
 helfen:['Kannst du mir bitte bei der Aufgabe helfen?','¿Puedes ayudarme, por favor, con el ejercicio?'],
 bekommen:['Ich habe gestern eine wichtige Nachricht bekommen.','Ayer recibí un mensaje importante.'],
 schicken:['Kannst du mir die Adresse per E-Mail schicken?','¿Puedes enviarme la dirección por correo electrónico?'],
 wohnen:['Ich wohne seit zwei Jahren in Berlin.','Vivo en Berlín desde hace dos años.'],
 suchen:['Ich suche gerade eine neue Wohnung.','Ahora mismo estoy buscando un departamento nuevo.'],
 finden:['Ich finde diese Idee sehr praktisch.','Me parece muy práctica esta idea.'],
 brauchen:['Für die Reise brauche ich nur einen kleinen Koffer.','Para el viaje solo necesito una maleta pequeña.'],
 bezahlen:['Kann ich mit Karte bezahlen?','¿Puedo pagar con tarjeta?'],
 bestellen:['Ich möchte einen Kaffee und ein Stück Kuchen bestellen.','Quisiera pedir un café y un trozo de pastel.'],
 sparen:['Wenn ich mit dem Fahrrad fahre, kann ich Geld sparen.','Si voy en bicicleta, puedo ahorrar dinero.'],
 gesund:['Ich versuche, gesund zu essen und genug zu schlafen.','Intento comer de forma saludable y dormir lo suficiente.'],
 wichtig:['Für mich ist es wichtig, genug Zeit für meine Familie zu haben.','Para mí es importante tener suficiente tiempo para mi familia.'],
 möglich:['Ist es möglich, den Termin zu verschieben?','¿Es posible aplazar la cita?'],
 praktisch:['Mit dem Zug zu fahren ist für mich praktischer.','Para mí es más práctico ir en tren.'],
 günstig:['Wir haben ein günstiges Hotel in der Nähe gefunden.','Encontramos un hotel económico cerca.'],
 teuer:['Die Wohnung ist schön, aber leider zu teuer.','El departamento es bonito, pero lamentablemente demasiado caro.']
};

function makeInventedExample(w:WordRow):Example{
 const k=norm(w.de),exact=INVENTED[k];
 if(exact)return{de:exact[0],es:exact[1],source:'B1 creado',invented:true};
 const es=w.es.split('/')[0].trim();
 const raw=w.de.trim();
 const lower=raw.toLowerCase();
 if(/en$/.test(k))return{de:`Kannst du bitte „${raw}“ genauer erklären oder in einer Situation benutzen?`,es:`¿Puedes explicar mejor «${es}» o usarlo en una situación?`,source:'B1 creado',invented:true};
 if(/^[A-ZÄÖÜ]/.test(raw))return{de:`Heute sprechen wir im Deutschkurs über „${raw}“.`,es:`Hoy hablamos en el curso de alemán sobre «${es}».`,source:'B1 creado',invented:true};
 if(/^(sehr|ganz|wirklich|besonders|oft|immer|manchmal|selten|heute|morgen|gestern)$/.test(lower))return{de:`Das ist ${raw} eine gute Idee.`,es:`Eso es ${es} una buena idea.`,source:'B1 creado',invented:true};
 return{de:`Ich versuche, „${raw}“ in meinem Alltag richtig zu benutzen.`,es:`Intento usar «${es}» correctamente en mi vida cotidiana.`,source:'B1 creado',invented:true};
}

export default function VocabCoach({p,setP}:any){
 const[view,setView]=useState<View>('study'),[mode,setMode]=useState<StudyMode>('new'),[i,setI]=useState(0),[flip,setFlip]=useState(false),[q,setQ]=useState(''),[corpus,setCorpus]=useState<CorpusWord[]>([]),[esMap,setEsMap]=useState<Record<string,string>>({}),[loading,setLoading]=useState(true),[visible,setVisible]=useState(150);
 useEffect(()=>{let live=true;loadCorpusWords().then(async rows=>{if(!live)return;setCorpus(rows);const tr=await loadSpanishMap(rows);if(live)setEsMap(tr);setLoading(false)}).catch(e=>{console.error(e);setLoading(false)});return()=>{live=false}},[]);
 useEffect(()=>{setVisible(150);setI(0);setFlip(false)},[view,q,mode]);
 const curatedByNorm=useMemo(()=>new Map(VOCAB.map(x=>[norm(x.de),x])),[]);
 const words=useMemo<WordRow[]>(()=>{if(!corpus.length)return VOCAB.map((x:any,idx:number)=>({...x,es:FIXED_ES[norm(x.de)]||x.es,rank:idx+1,isCorpus:false}));const corpusNorm=new Set(corpus.map(x=>norm(x.de)));const rows=corpus.map(x=>{const c:any=curatedByNorm.get(norm(x.de)),fixed=FIXED_ES[norm(x.de)];return{id:x.id,de:x.de,es:fixed||c?.es||esMap[x.de.toLowerCase()]||'',pron:c?.pron||approxPronunciation(x.de),chunk:c?.chunk||'',roi:x.roi,category:c?.category||'corpus',rank:x.rank,freq:x.freq,speaking:x.speaking,writing:x.writing,listening:x.listening,isCorpus:true}});const extras=VOCAB.filter(x=>!corpusNorm.has(norm(x.de))).map((x:any,idx:number)=>({...x,es:FIXED_ES[norm(x.de)]||x.es,rank:corpus.length+idx+1,isCorpus:false}));return[...rows,...extras]},[corpus,esMap,curatedByNorm]);
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
 const corpusExample=v?findExamExample(v.de):null;
 const example:Example|null=v?(corpusExample?{...corpusExample,source:corpusExample.source}:makeInventedExample(v)):null;
 return <div className="vocabPage"><H e={loading?'CARGANDO CORPUS…':`${learned}/${words.length} APRENDIDAS · ${reviewCount} PARA REPASAR`} t="2.000+ palabras TELC por ROI." s="Avanza por vocabulario nuevo sin que tus errores vuelvan al inicio. Cuando quieras, cambia a Repasar errores."/>
 <div className="segmented vocabTabs"><button className={view==='study'?'sel':''} onClick={()=>setView('study')}>Estudiar</button><button className={view==='all'?'sel':''} onClick={()=>setView('all')}>Todas ({words.length})</button><button className={view==='learned'?'sel':''} onClick={()=>setView('learned')}>Aprendidas ({learned})</button><button className={view==='review'?'sel':''} onClick={()=>setView('review')}>Repaso ({reviewCount})</button><button className={view==='pending'?'sel':''} onClick={()=>setView('pending')}>Faltan ({remainingTotal})</button></div>
 {view==='study'?<><div className="segmented vocabModes"><button className={mode==='new'?'sel':''} onClick={()=>setMode('new')}>Seguir avanzando ({remainingTotal})</button><button className={mode==='errors'?'sel':''} onClick={()=>setMode('errors')}>Repasar errores ({reviewCount})</button></div>{loading?<div className="glass sideCard"><h3>Preparando vocabulario…</h3></div>:v?<div className="studyGrid vocabStudy"><div className={'flash '+(flip?'flipped':'')} onClick={()=>!flip&&reveal()}><span className="roi">ROI {v.roi}</span>{!flip?<><small>{mode==='errors'?'REPASO DE ERRORES':'PALABRA NUEVA · AVANZA HASTA EL FINAL'}</small><h2>{v.de}</h2>{v.isCorpus&&<p>Corpus #{v.rank} · frecuencia {v.freq} · S {v.speaking} · W {v.writing} · L {v.listening}</p>}<p>Piensa el significado en español y luego revela.</p><button className="primary" onClick={e=>{e.preventDefault();e.stopPropagation();reveal()}}>Revelar significado</button></>:<><small>TRADUCCIÓN</small><h2>{v.es}</h2><div className="pron">🇩🇪 {v.de} · 🗣 {v.pron}</div>{example&&<blockquote><small>{example.invented?'EJEMPLO B1 CREADO PARA TI':`DE TU EXAMEN · ${example.source.toUpperCase()}`}</small><b>{example.de}</b><br/><span>{example.es}</span></blockquote>}<button className="audioBtn" onClick={e=>audio(e,example?.de||v.de)}><Volume2/>Escuchar ejemplo</button></>}</div><div className="glass sideCard"><h3>¿Reconociste el significado?</h3><p>“Todavía no” guarda la palabra en Repasar errores, pero no la vuelve a meter en tu cola de palabras nuevas.</p><button onClick={()=>mark(false)}>Todavía no</button><button className="good" onClick={()=>mark(true)}><CheckCircle2/>Sí, fácil</button></div></div>:<div className="glass sideCard"><h3>{mode==='errors'?'No tienes errores pendientes 🎉':'Terminaste las palabras nuevas con traducción 🎉'}</h3><p>{missing?`${missing} entradas todavía no tienen traducción y por eso no aparecen como tarjeta hasta que el diccionario las resuelva.`:mode==='errors'?'Puedes volver a Seguir avanzando.':'Ahora sí puedes dedicarte al repaso.'}</p></div>}</>:<><div className="search"><Search size={17}/><input placeholder="Buscar en 2.000+ palabras…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="wordList">{filtered.slice(0,visible).map(x=><div className="wordRow" key={x.id}><span className="rank">#{x.rank}</span><div><b>{x.de}</b><small>{x.es||'Sin traducción — excluida de estudio'}{x.isCorpus?` · freq ${x.freq} · S${x.speaking} W${x.writing} L${x.listening}`:` · ${x.category}`}{reviewIds.includes(x.id)?' · REPASO':''}</small></div><span className="score">ROI {x.roi}</span><button onClick={e=>audio(e,x.de)}><Volume2 size={15}/></button><span className={p.known.includes(x.id)?'doneDot':'todoDot'}>{p.known.includes(x.id)?'✓':reviewIds.includes(x.id)?'↻':'•'}</span></div>)}</div>{visible<filtered.length&&<button className="ghost" onClick={()=>setVisible(x=>x+150)}>Cargar 150 más ({filtered.length-visible} restantes)</button>}</>}</div>
}
