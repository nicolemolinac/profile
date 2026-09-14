import{SPEAKING}from'./data';import s1 from'./examSpeaking1';import s2 from'./examSpeaking2';import s3 from'./examSpeaking3';import s4 from'./examSpeaking4';
type T={id:number;title:string;source:string;ideas:string[]};type PackedT=T&{pack:number;packIndex:number;packTotal:number};
const speakingPacks=[s1,s2,s3,s4] as T[][];
const tasks:PackedT[]=speakingPacks.flatMap((pack,pi)=>pack.map((t,i)=>({...t,pack:pi+1,packIndex:i+1,packTotal:pack.length}))).filter(t=>String(t.title||'').trim().length>0);
const template=['In dem Text geht es um [TEMA].','Die Person / der Text meint, dass [POSICIÓN].','Ich persönlich finde, dass [OPINIÓN], weil [RAZÓN].','Ein Vorteil / Nachteil ist, dass [IDEA].','Aus meiner Erfahrung kann ich sagen, dass [EXPERIENCIA].','Deshalb denke ich, dass [CONCLUSIÓN].','Was meinst du dazu?'];
function firstUsefulSentence(x:string){return String(x||'').replace(/^[„“"']+|[„“"']+$/g,'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).find(s=>s.length>=25&&s.length<=180)||''}
const rows=tasks.map((t,i)=>{
 const source=t.source?.trim()||'';const positions=(t.ideas||[]).filter(Boolean);const realExamples=positions.map(firstUsefulSentence).filter(Boolean).slice(0,2);
 const prompt=`DE TU MATERIAL · Speaking ${i+1}/${tasks.length} · Prueba ${t.pack}/4 · Ej. ${t.packIndex}/${t.packTotal}\n\nTEMA REAL #${t.id}: ${t.title}\n\nTEXTO BASE REAL:\n${source||'Este ejercicio no trae texto base limpio en el material.'}\n\nTU MISIÓN: 1) resume lo esencial, 2) di tu opinión, 3) da una razón, 4) ventaja/desventaja, 5) experiencia personal, 6) conclusión, 7) pregunta al compañero.${realExamples.length?`\n\nDespués de responder, compara tu idea con las frases modelo del material que aparecen en Guided.`:''}`;
 const guided=[...template,...realExamples.map(x=>`MODELO REAL · ${x}`)];
 return[`DE TU MATERIAL · Speaking ${i+1}/${tasks.length} · Prueba ${t.pack}/4 · ${t.title}`,prompt,guided]
});
(SPEAKING as any[]).splice(0,(SPEAKING as any[]).length,...rows);
export const FULL_SPEAKING_COUNT=rows.length;
export const SPEAKING_PACK_COUNT=speakingPacks.length;
