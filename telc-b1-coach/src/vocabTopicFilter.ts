const TOPICS:[string,string[]][]=[
  ['Todos',[]],
  ['Viajes y transporte',['zug','bahn','bahnhof','gleis','fahrt','fahren','reise','reisen','urlaub','hotel','unterkunft','flughafen','flug','bus','auto','verkehr','ticket','fahrkarte','ankunft','abfahrt','gepäck','koffer','straße','weg','stadt','land']],
  ['Trabajo y estudios',['arbeit','arbeiten','job','beruf','firma','büro','kolleg','chef','stelle','bewerb','schule','schüler','unterricht','lernen','studium','universität','kurs','prüfung','lehrer','bildung','ausbildung']],
  ['Familia y relaciones',['familie','eltern','mutter','vater','kind','kinder','schwester','bruder','freund','freundin','partner','mann','frau','hochzeit','heirat','verwandt','beziehung','nachbar']],
  ['Casa y vida diaria',['wohnung','haus','zimmer','küche','bad','möbel','miete','umzieh','wohnen','haushalt','putzen','waschen','essen','trinken','kochen','einkauf','laden','geschäft','supermarkt']],
  ['Salud y cuerpo',['gesund','krank','arzt','praxis','medizin','körper','sport','bewegung','schmerz','kranken','apotheke','essen','ernährung','schlaf','stress']],
  ['Tiempo libre y cultura',['freizeit','hobby','musik','film','kino','theater','tanz','tanzen','buch','lesen','party','fest','veranstaltung','museum','ausflug','spielen','urlaub','restaurant','café']],
  ['Comunicación y tecnología',['internet','online','handy','smartphone','computer','email','mail','nachricht','telefon','anruf','sprechen','sagen','fragen','antwort','information','digital','technik','foto']],
  ['Medioambiente y sociedad',['umwelt','klima','natur','garten','tier','energie','müll','stadt','gemeinschaft','sozial','öffentlich','gesellschaft','nachhalt','park','verkehr']],
  ['Dinero y compras',['geld','preis','kosten','kostenlos','günstig','teuer','euro','kaufen','verkaufen','angebot','rabatt','geschäft','laden','bestellen','bezahlen','konto','bank']],
  ['Fechas, tiempo y citas',['zeit','uhr','tag','woche','monat','jahr','heute','morgen','abend','vormittag','nachmittag','termin','datum','samstag','sonntag','montag','dienstag','mittwoch','donnerstag','freitag','pünktlich','verspätung']],
  ['Opinión y examen',['meinung','vorteil','nachteil','finden','denken','glauben','zustimm','ablehn','vorschlag','schlagen','deshalb','trotzdem','außerdem','erfahrung','möglich','wichtig','notwendig','gemeinsam','planen']]
];

function topicFor(text:string){
  const s=text.toLowerCase();
  for(const [topic,keys] of TOPICS.slice(1)) if(keys.some(k=>s.includes(k))) return topic;
  return 'General';
}

function enhance(){
  const list=document.querySelector('.wordList');
  if(!list)return;
  const parent=list.parentElement;
  if(!parent)return;
  let bar=parent.querySelector<HTMLElement>('[data-vocab-topic-filter]');
  if(!bar){
    bar=document.createElement('div');
    bar.dataset.vocabTopicFilter='1';
    bar.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px 14px;border:1px solid rgba(120,105,154,.14);background:rgba(255,255,255,.82);border-radius:14px;box-shadow:0 8px 24px rgba(62,47,91,.05)';
    const label=document.createElement('strong');label.textContent='Tema';label.style.cssText='font-size:12px;color:#756d90;letter-spacing:.04em';
    const select=document.createElement('select');select.setAttribute('aria-label','Filtrar vocabulario por tema');select.style.cssText='border:1px solid #e0d9eb;background:white;border-radius:10px;padding:9px 11px;font:600 13px DM Sans,sans-serif;color:#3a2c57;min-width:190px;outline:none';
    for(const [name] of TOPICS){const o=document.createElement('option');o.value=name;o.textContent=name;select.appendChild(o)}
    const general=document.createElement('option');general.value='General';general.textContent='General / conectores';select.appendChild(general);
    bar.append(label,select);
    const search=parent.querySelector('.search');parent.insertBefore(bar,search||list);
    select.addEventListener('change',()=>apply(select.value));
  }
  const select=bar.querySelector('select') as HTMLSelectElement|null;
  if(select)apply(select.value);
}

function apply(selected:string){
  document.querySelectorAll<HTMLElement>('.wordRow').forEach(row=>{
    const word=row.querySelector('b')?.textContent||'';
    const details=row.querySelector('small')?.textContent||'';
    const topic=topicFor(word+' '+details);
    row.dataset.topic=topic;
    row.style.display=selected==='Todos'||selected===topic?'':'none';
  });
}

let queued=false;
const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})};
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',run);
