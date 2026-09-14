import type {CorpusWord} from './corpus';

export type VocabFamily={
 id:string; lemma:string; forms:string[]; freq:number; speaking:number; writing:number; listening:number; rank:number; roi:number; members:CorpusWord[];
};

const IRREGULAR:Record<string,string>={
 bin:'sein',bist:'sein',ist:'sein',sind:'sein',seid:'sein',war:'sein',waren:'sein',gewesen:'sein',
 habe:'haben',hast:'haben',hat:'haben',haben:'haben',hatte:'haben',hatten:'haben',gehabt:'haben',
 werde:'werden',wirst:'werden',wird:'werden',werden:'werden',wurde:'werden',wurden:'werden',geworden:'werden',
 gehe:'gehen',gehst:'gehen',geht:'gehen',ging:'gehen',gingen:'gehen',gegangen:'gehen',
 komme:'kommen',kommst:'kommen',kommt:'kommen',kam:'kommen',kamen:'kommen',gekommen:'kommen',
 fahre:'fahren',fährst:'fahren',fährt:'fahren',fuhr:'fahren',fuhren:'fahren',gefahren:'fahren',
 sehe:'sehen',siehst:'sehen',sieht:'sehen',sah:'sehen',sahen:'sehen',gesehen:'sehen',
 nehme:'nehmen',nimmst:'nehmen',nimmt:'nehmen',nahm:'nehmen',nahmen:'nehmen',genommen:'nehmen',
 gebe:'geben',gibst:'geben',gibt:'geben',gab:'geben',gaben:'geben',gegeben:'geben',
 finde:'finden',findest:'finden',findet:'finden',fand:'finden',fanden:'finden',gefunden:'finden',
 spreche:'sprechen',sprichst:'sprechen',spricht:'sprechen',sprach:'sprechen',sprachen:'sprechen',gesprochen:'sprechen',
 helfe:'helfen',hilfst:'helfen',hilft:'helfen',half:'helfen',halfen:'helfen',geholfen:'helfen',
 treffe:'treffen',triffst:'treffen',trifft:'treffen',traf:'treffen',trafen:'treffen',getroffen:'treffen',
 esse:'essen',isst:'essen',aß:'essen',aßen:'essen',gegessen:'essen',
 trinke:'trinken',trinkst:'trinken',trinkt:'trinken',trank:'trinken',tranken:'trinken',getrunken:'trinken',
 weiß:'wissen',weißt:'wissen',wusste:'wissen',wussten:'wissen',gewusst:'wissen',
 kann:'können',kannst:'können',könnt:'können',konnte:'können',konnten:'können',
 muss:'müssen',musst:'müssen',müsst:'müssen',musste:'müssen',mussten:'müssen',
 will:'wollen',willst:'wollen',wollt:'wollen',wollte:'wollen',wollten:'wollen',
 soll:'sollen',sollst:'sollen',sollt:'sollen',sollte:'sollen',sollten:'sollen',
 darf:'dürfen',darfst:'dürfen',dürft:'dürfen',durfte:'dürfen',durften:'dürfen',
 mag:'mögen',magst:'mögen',mochte:'mögen',mochten:'mögen',
 tat:'tun',taten:'tun',getan:'tun',brachte:'bringen',brachten:'bringen',gebracht:'bringen',
 dachte:'denken',dachten:'denken',gedacht:'denken',blieb:'bleiben',blieben:'bleiben',geblieben:'bleiben',
 hieß:'heißen',hießen:'heißen',ließ:'lassen',ließen:'lassen',gelassen:'lassen',
 las:'lesen',lasen:'lesen',gelesen:'lesen',schrieb:'schreiben',schrieben:'schreiben',geschrieben:'schreiben'
};

const NOUN_IRREGULAR:Record<string,string>={
 kinder:'kind',kindern:'kind',leute:'leute',menschen:'mensch',männer:'mann',frauen:'frau',
 häuser:'haus',städte:'stadt',länder:'land',bücher:'buch',wörter:'wort',ärzte:'arzt',mütter:'mutter',väter:'vater',
 brüder:'bruder',schwestern:'schwester',freunde:'freund',freunden:'freund',nachbarn:'nachbar',eltern:'eltern'
};

const clean=(s:string)=>s.toLocaleLowerCase('de-DE').replace(/^(der|die|das)\s+/,'').replace(/^sich\s+/,'').replace(/[.,!?;:"„“()]/g,'').trim();

export function familyLemma(word:string,known:Set<string>){
 const w=clean(word); if(!w)return w;
 if(IRREGULAR[w])return IRREGULAR[w];
 if(NOUN_IRREGULAR[w])return NOUN_IRREGULAR[w];
 // Prefer an actual corpus lemma. Conservative rules avoid merging unrelated words.
 const candidates:string[]=[];
 if(w.startsWith('ge')&&w.endsWith('t')&&w.length>5)candidates.push(w.slice(2,-1)+'en');
 if(w.startsWith('ge')&&w.endsWith('en')&&w.length>6)candidates.push(w.slice(2));
 if(w.endsWith('est'))candidates.push(w.slice(0,-3)+'en');
 if(w.endsWith('st'))candidates.push(w.slice(0,-2)+'en');
 if(w.endsWith('et'))candidates.push(w.slice(0,-2)+'en');
 if(w.endsWith('t'))candidates.push(w.slice(0,-1)+'en');
 if(w.endsWith('en'))candidates.push(w);
 if(w.endsWith('ern'))candidates.push(w.slice(0,-1));
 if(w.endsWith('ern'))candidates.push(w.slice(0,-2));
 if(w.endsWith('en'))candidates.push(w.slice(0,-1),w.slice(0,-2));
 if(w.endsWith('er'))candidates.push(w.slice(0,-2));
 if(w.endsWith('e'))candidates.push(w.slice(0,-1));
 if(w.endsWith('n'))candidates.push(w.slice(0,-1));
 if(w.endsWith('s'))candidates.push(w.slice(0,-1));
 for(const c of candidates)if(c!==w&&known.has(c))return c;
 return w;
}

function displayForms(lemma:string,members:CorpusWord[]){
 const forms=[...new Set(members.map(x=>x.de))];
 const preferred=[lemma,...forms.filter(x=>clean(x)!==lemma).sort((a,b)=>{
   const ai=IRREGULAR[clean(a)]===lemma?0:1,bi=IRREGULAR[clean(b)]===lemma?0:1;
   return ai-bi||(b.length-a.length);
 })];
 return [...new Set(preferred)].slice(0,7);
}

export function groupCorpusFamilies(rows:CorpusWord[]):VocabFamily[]{
 const known=new Set(rows.map(x=>clean(x.de)));
 const groups=new Map<string,CorpusWord[]>();
 for(const row of rows){const lemma=familyLemma(row.de,known);const a=groups.get(lemma)||[];a.push(row);groups.set(lemma,a)}
 return [...groups.entries()].map(([lemma,members])=>({
   id:`f:${lemma}`,lemma,forms:displayForms(lemma,members),members,
   freq:members.reduce((n,x)=>n+x.freq,0),speaking:members.reduce((n,x)=>n+x.speaking,0),writing:members.reduce((n,x)=>n+x.writing,0),listening:members.reduce((n,x)=>n+x.listening,0),
   rank:Math.min(...members.map(x=>x.rank)),roi:Math.max(...members.map(x=>x.roi))
 })).sort((a,b)=>b.freq-a.freq||b.roi-a.roi||a.rank-b.rank).map((x,i)=>({...x,rank:i+1}));
}
