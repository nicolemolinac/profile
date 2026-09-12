import{SPEAKING}from'./data';import s1 from'./examSpeaking1';import s2 from'./examSpeaking2';import s3 from'./examSpeaking3';import s4 from'./examSpeaking4';
type T={id:number;title:string;source:string;ideas:string[]};
const tasks=[...s1,...s2,...s3,...s4] as T[];
const template=['In dem Text geht es um [TEMA].','Die Person / der Text meint, dass [POSICIÓN].','Ich persönlich finde, dass [OPINIÓN], weil [RAZÓN].','Ein Vorteil / Nachteil ist, dass [IDEA].','Aus meiner Erfahrung kann ich sagen, dass [EXPERIENCIA].','Deshalb denke ich, dass [CONCLUSIÓN].','Was meinst du dazu?'];
const rows=tasks.map(t=>{const source=t.source?.trim()||'';const positions=(t.ideas||[]).filter(Boolean);const prompt=`TEMA REAL #${t.id}: ${t.title}\n\nTEXTO BASE DEL MATERIAL:\n${source}\n\nTU MISIÓN: 1) resume lo esencial, 2) di tu opinión, 3) da una razón, 4) ventaja/desventaja, 5) experiencia personal, 6) conclusión, 7) pregunta al compañero.${positions.length?`\n\nEl material incluye ${positions.length} respuesta(s)/posición(es) modelo para comparar DESPUÉS de intentar.`:''}`;return[`Teil 2 · ${t.title}`,prompt,template]});
(SPEAKING as any[]).splice(0,(SPEAKING as any[]).length,...rows);
export const FULL_SPEAKING_COUNT=rows.length;
