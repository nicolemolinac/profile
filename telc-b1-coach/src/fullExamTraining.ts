import{LISTENING,WRITING}from'./data';
import w1 from'./examWriting1';import w2 from'./examWriting2';import w3 from'./examWriting3';import w4 from'./examWriting4';
import l1 from'./examListening1';import l2 from'./examListening2';import l3 from'./examListening3';import l4 from'./examListening4';import l5 from'./examListening5';import l6 from'./examListening6';import l7 from'./examListening7';

type W={id:string;title:string;bullets:string[];model:string};type L={n:string;text:string};
type PackedW=W&{pack:number;packIndex:number;packTotal:number};type PackedL=L&{pack:number;packIndex:number;packTotal:number};
const writingPacks=[w1,w2,w3,w4] as W[][];
const listeningPacks=[l1,l2,l3,l4,l5,l6,l7] as L[][];
const writing:PackedW[]=writingPacks.flatMap((pack,pi)=>pack.map((x,i)=>({...x,pack:pi+1,packIndex:i+1,packTotal:pack.length})));
// Keep EVERY non-empty transcript from every uploaded listening pack. Short clips
// are valid training too; nothing is discarded just because it has few words.
const listening:PackedL[]=listeningPacks.flatMap((pack,pi)=>pack.map((x,i)=>({...x,pack:pi+1,packIndex:i+1,packTotal:pack.length}))).filter(x=>String(x.text||'').trim().length>0);

const TEMPLATE=`PLANTILLA SEGURA\n\nLiebe/r [NAME],\nvielen Dank für deine Nachricht! Ich habe mich sehr gefreut, wieder von dir zu hören.\n\n[PUNTO 1: respuesta directa + detalle]\n[PUNTO 2: respuesta + weil/denn + razón]\n[PUNTO 3: propuesta/opinión + detalle]\n[PUNTO 4: respuesta/pregunta + detalle]\n\nIch freue mich auf deine Antwort. Schreib mir bitte bald!\nLiebe Grüße\nNicole\n\nREGLA DE APROBADO: cubre SIEMPRE los 4 puntos. Frase corta y correcta > frase ambiciosa con errores.`;
function modelSentences(model:string){return String(model||'').replace(/\([^)]*\?\)/g,'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>=28&&s.length<=170).slice(0,5)}
const writingRows=writing.map((x,i)=>{
 const examples=modelSentences(x.model);
 const sourceBlock=x.model?`\n\nMODELO REAL DE TU MATERIAL — SOLO DESPUÉS DE INTENTAR:\n${x.model}${examples.length?`\n\nFRASES REUTILIZABLES EXTRAÍDAS DEL MODELO:\n${examples.map(s=>`• ${s}`).join('\n')}`:''}`:'\n\nEste ejercicio de tu material no trae un modelo limpio. Practica los 4 puntos con la plantilla fija.';
 return[`DE TU MATERIAL · Writing ${i+1}/${writing.length} · Prueba ${x.pack}/4 · Ej. ${x.packIndex}/${x.packTotal} · ${x.title}`,`${TEMPLATE}\n\nLOS 4 PUNTOS REALES DE ESTE EJERCICIO:\n${x.bullets.map((b,j)=>`${j+1}. ${b}`).join('\n')}${sourceBlock}`]
});
(WRITING as any[]).splice(0,(WRITING as any[]).length,...writingRows);

const STOP=new Set('ich du er sie es wir ihr und oder aber dass das die der den dem des ein eine einen einem einer ist sind war waren wird werden habe hat haben hatte mit von zu im in am an auf für bei nach aus um als auch noch nicht nur so sehr dann wenn wie was wer wo warum mein meine dein deine sich man zum zur über vor mehr schon'.split(' '));
function words(t:string){return t.toLowerCase().replace(/[^a-zäöüß\s]/g,' ').split(/\s+/).filter(Boolean)}
function keys(t:string){const ws=words(t).filter(w=>w.length>4&&!STOP.has(w));const c=new Map<string,number>();ws.forEach(w=>c.set(w,(c.get(w)||0)+1));return[...c].sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0])}
function detailChunk(t:string){const ws=t.replace(/\s+/g,' ').trim().split(' ').filter(Boolean);if(ws.length<=11)return ws.join(' ');const content=keys(t);let at=content.length?ws.findIndex(w=>w.toLowerCase().replace(/[^a-zäöüß]/g,'')===content[0]):-1;if(at<0)at=Math.floor(ws.length/3);const start=Math.max(0,Math.min(ws.length-10,at-3));return ws.slice(start,start+10).join(' ')}
function otherChunk(i:number,offset:number){if(listening.length<=1)return'otro detalle';return detailChunk(listening[(i+offset)%listening.length].text)}
const bank=listening.map((x,i)=>{
 const k=keys(x.text),right=detailChunk(x.text),d1=otherChunk(i,7),d2=otherChunk(i,19),pos=i%3;
 const opts=[d1,d2];opts.splice(pos,0,right);
 return[`DE TU EXAMEN · Listening ${i+1}/${listening.length} · Prueba ${x.pack}/7 · Audio ${x.packIndex}/${x.packTotal}`,x.text,'¿Qué detalle aparece realmente en el audio?',opts,pos,k.length?k:['hören','detail','verstehen']]
});
(LISTENING as any[]).splice(0,(LISTENING as any[]).length,...bank);
export const FULL_EXAM_COUNTS={writing:writingRows.length,listening:bank.length,writingPacks:writingPacks.length,listeningPacks:listeningPacks.length};
