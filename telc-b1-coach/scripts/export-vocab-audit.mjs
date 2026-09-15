import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=path.resolve(process.cwd(),'telc-b1-coach');
const src=path.join(root,'src');
const norm=s=>String(s||'').trim().toLocaleLowerCase('de-DE');
const parsePairs=(file)=>{
  const text=fs.readFileSync(file,'utf8');
  const out=new Map();
  const re=/['"]([^'"\n]+)['"]\s*:\s*['"]([^'"\n]+)['"]/g;
  let m; while((m=re.exec(text))) out.set(norm(m[1]),m[2].trim());
  return out;
};

let b64='';
for(let i=1;i<=7;i++){
  const text=fs.readFileSync(path.join(src,'corpus',`part${i}.ts`),'utf8');
  const m=text.match(/export default `([\s\S]*?)`;/);
  if(!m)throw new Error(`Cannot parse corpus part ${i}`);
  b64+=m[1];
}
const raw=zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8');
const rows=raw.split(/\r?\n/).filter(Boolean).map((line,index)=>{
  const [de,f='0',s='0',w='0',l='0']=line.split('|');
  return {index:index+1,de,f:Number(f)||0,s:Number(s)||0,w:Number(w)||0,l:Number(l)||0};
});

const sources=[
  ['TELC_OFFICIAL',parsePairs(path.join(src,'telcOfficialSpanish.ts'))],
  ['TELC_COVERAGE',parsePairs(path.join(src,'telcCoverageBoost.ts'))],
  ['EXAM_BOOST',parsePairs(path.join(src,'examVocabBoost.ts'))],
  ['STANDARD_CURATED',parsePairs(path.join(src,'corpus.ts'))],
  ['COMMON_B1',parsePairs(path.join(src,'translationFallback.ts'))],
];
const suspicious=(de,es)=>!es||norm(de)===norm(es)||es.length>100||/https?:|<[^>]+>/.test(es)||/\b(jota|ápice|miaja|adarme|maravedí|ochavo|ardite)\b/i.test(es);
const audited=rows.map(r=>{
  const key=norm(r.de); let translation=''; let source='MISSING';
  for(const [name,map] of sources){const v=map.get(key);if(v&&!suspicious(r.de,v)){translation=v;source=name;break;}}
  return {...r,translation,source,status:translation?'STATIC_REVIEW_SOURCE':'NEEDS_MANUAL_REVIEW'};
});
const counts=Object.fromEntries([...sources.map(([n])=>n),'MISSING'].map(n=>[n,audited.filter(r=>r.source===n).length]));
const missing=audited.filter(r=>!r.translation);
const out=path.join(root,'audit-output'); fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'vocab-audit.json'),JSON.stringify(audited,null,2)+'\n');
fs.writeFileSync(path.join(out,'vocab-audit.tsv'),['index\tde\ttranslation\tsource\tstatus\tfreq\tspeaking\twriting\tlistening',...audited.map(r=>[r.index,r.de,r.translation,r.source,r.status,r.f,r.s,r.w,r.l].join('\t'))].join('\n')+'\n');
fs.writeFileSync(path.join(out,'needs-manual-review.tsv'),['index\tde\tfreq\tspeaking\twriting\tlistening',...missing.map(r=>[r.index,r.de,r.f,r.s,r.w,r.l].join('\t'))].join('\n')+'\n');
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({rows:rows.length,uniqueGerman:new Set(rows.map(r=>norm(r.de))).size,staticReviewed:audited.length-missing.length,needsManualReview:missing.length,coverage:Number(((audited.length-missing.length)/audited.length*100).toFixed(2)),bySource:counts,generatedAt:new Date().toISOString()},null,2)+'\n');
console.log(`Audited ${rows.length}: ${audited.length-missing.length} static-source translations, ${missing.length} need manual review.`);
