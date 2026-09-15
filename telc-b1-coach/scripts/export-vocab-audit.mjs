import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=path.resolve(process.cwd(),'telc-b1-coach');
const dir=path.join(root,'src','corpus');
let b64='';
for(let i=1;i<=7;i++){
  const src=fs.readFileSync(path.join(dir,`part${i}.ts`),'utf8');
  const m=src.match(/export default `([\s\S]*?)`;/);
  if(!m) throw new Error(`Cannot parse corpus part ${i}`);
  b64+=m[1];
}
const text=zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8');
const rows=text.split(/\r?\n/).filter(Boolean).map((line,index)=>{
  const [de,f='0',s='0',w='0',l='0']=line.split('|');
  return {index:index+1,de,f:Number(f)||0,s:Number(s)||0,w:Number(w)||0,l:Number(l)||0};
});
const out=path.join(root,'audit-output');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'corpus-rows.json'),JSON.stringify(rows,null,2));
fs.writeFileSync(path.join(out,'corpus-rows.tsv'),['index\tde\tfreq\tspeaking\twriting\tlistening',...rows.map(r=>`${r.index}\t${r.de}\t${r.f}\t${r.s}\t${r.w}\t${r.l}`)].join('\n'));
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({rows:rows.length,uniqueGerman:new Set(rows.map(r=>r.de.toLocaleLowerCase('de-DE'))).size,generatedAt:new Date().toISOString()},null,2));
console.log(`Exported ${rows.length} corpus rows (${new Set(rows.map(r=>r.de.toLocaleLowerCase('de-DE'))).size} unique German forms)`);
