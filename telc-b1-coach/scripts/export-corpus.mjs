import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=path.resolve(process.cwd(),'telc-b1-coach');
const parts=[];
for(let i=1;i<=7;i++){
  const src=fs.readFileSync(path.join(root,'src','corpus',`part${i}.ts`),'utf8');
  const m=src.match(/export default `([\s\S]*?)`;/);
  if(!m)throw new Error(`Cannot parse corpus part ${i}`);
  parts.push(m[1]);
}
const text=zlib.gunzipSync(Buffer.from(parts.join(''),'base64')).toString('utf8');
const rows=text.split(/\r?\n/).filter(Boolean).map((line,index)=>{
  const [de,f='0',s='0',w='0',l='0']=line.split('|');
  return {index:index+1,de,f:Number(f),s:Number(s),w:Number(w),l:Number(l)};
});
const out=path.join(root,'audit');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'corpus-raw.json'),JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync(path.join(out,'corpus-raw.tsv'),'index\tde\tfreq\tspeaking\twriting\tlistening\n'+rows.map(r=>[r.index,r.de,r.f,r.s,r.w,r.l].join('\t')).join('\n')+'\n');
console.log(`Exported ${rows.length} corpus rows to ${out}`);
