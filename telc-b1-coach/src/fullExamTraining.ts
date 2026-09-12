import{LISTENING,WRITING}from'./data';
import w1 from'./examWriting1';import w2 from'./examWriting2';import w3 from'./examWriting3';import w4 from'./examWriting4';
import l1 from'./examListening1';import l2 from'./examListening2';import l3 from'./examListening3';import l4 from'./examListening4';import l5 from'./examListening5';import l6 from'./examListening6';import l7 from'./examListening7';

type W={id:string;title:string;bullets:string[];model:string};type L={n:string;text:string};
const writing=[...w1,...w2,...w3,...w4] as W[];
const listening=[...l1,...l2,...l3,...l4,...l5,...l6,...l7] as L[];
const TEMPLATE=`PLANTILLA SEGURA\n\nLiebe/r [NAME],\nvielen Dank für deine Nachricht! Ich habe mich sehr gefreut, wieder von dir zu hören.\n\n[PUNTO 1: respuesta directa + detalle]\n[PUNTO 2: respuesta + weil/denn + razón]\n[PUNTO 3: propuesta/opinión + detalle]\n[PUNTO 4: respuesta/pregunta + detalle]\n\nIch freue mich auf deine Antwort. Schreib mir bitte bald!\nLiebe Grüße\nNicole\n\nREGLA: cubre SIEMPRE los 4 puntos. No necesitas alemán perfecto: respuesta clara + razón/detalle.`;
(WRITING as any[]).splice(0,(WRITING as any[]).length,...writing.map(x=>[`Ejercicio ${x.id} · ${x.title}`,`${TEMPLATE}\n\nLOS 4 PUNTOS DE ESTE EJERCICIO:\n${x.bullets.map((b,j)=>`${j+1}. ${b}`).join('\n')}\n\n${x.model?`MODELO DEL MATERIAL (míralo solo después de intentar):\n${x.model}`:'Este ejercicio no trae modelo limpio en el material; practica cubriendo los cuatro puntos con la plantilla.'}`]));

const STOP=new Set('ich du er sie es wir ihr und oder aber dass das die der den dem des ein eine einen einem einer ist sind war waren wird werden habe hat haben hatte mit von zu im in am an auf für bei nach aus um als auch noch nicht nur so sehr dann wenn wie was wer wo warum mein meine dein deine sich man zum zur über vor mehr schon'.split(' '));
function keys(t:string){const ws=t.toLowerCase().replace(/[^a-zäöüß\s]/g,' ').split(/\s+/).filter(w=>w.length>4&&!STOP.has(w));const c=new Map<string,number>();ws.forEach(w=>c.set(w,(c.get(w)||0)+1));return[...c].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);}
const distract=[['Bahnhof','Verspätung','Gleis'],['Arzt','Termin','Praxis'],['Reise','Hotel','Urlaub'],['Arbeit','Kollegen','Büro'],['Familie','Freunde','Treffen'],['Wetter','Regen','Sonne'],['Einkaufen','Preis','Geschäft'],['Schule','Kurs','Prüfung']];
const bank=listening.filter(x=>x.text&&x.text.trim().length>35).map((x,i)=>{const k=keys(x.text);const right=k.length?k.join(' · '):'idea principal del audio';const d1=distract[(i+2)%distract.length].join(' · '),d2=distract[(i+5)%distract.length].join(' · ');const pos=i%3;const opts=[d1,d2];opts.splice(pos,0,right);return[`Corpus Listening · ${i+1}/${listening.length}`,x.text,'¿Qué grupo de palabras/ideas pertenece realmente al audio?',opts,pos,k.length?k:['escuchar','reconocer','detalle']];});
(LISTENING as any[]).splice(0,(LISTENING as any[]).length,...bank);
export const FULL_EXAM_COUNTS={writing:writing.length,listening:bank.length};
