// Normaliza regionalismos en español para que toda la interfaz use español latinoamericano neutro.
// Se aplica solo al texto visible de la UI; no modifica el alemán ni los datos fuente del examen.
const REPLACEMENTS:[RegExp,string][]=[
  [/\bcabros\b/gi,'chicos'],[/\bcabras\b/gi,'chicas'],[/\bcabro\b/gi,'chico'],[/\bcabra\b/gi,'chica'],
  [/\bbacán\b/gi,'muy bueno'],[/\bbacan\b/gi,'muy bueno'],[/\bbacanes\b/gi,'muy buenos'],
  [/\bweones\b/gi,'personas'],[/\bweón\b/gi,'persona'],[/\bweon\b/gi,'persona'],[/\bhuevón\b/gi,'persona'],[/\bhuevon\b/gi,'persona'],
  [/\bpololos\b/gi,'novios'],[/\bpololas\b/gi,'novias'],[/\bpololo\b/gi,'novio'],[/\bpolola\b/gi,'novia'],[/\bpololear\b/gi,'salir con alguien'],
  [/\bpega\b/gi,'trabajo'],[/\blucas\b/gi,'dinero'],[/\bluca\b/gi,'dinero'],[/\bfome\b/gi,'aburrido'],
  [/\bguaguas\b/gi,'bebés'],[/\bguagua\b/gi,'bebé'],[/\bcachái\b/gi,'entiendes'],[/\bcachai\b/gi,'entiendes'],
  [/\bal tiro\b/gi,'de inmediato'],[/\bcarrete\b/gi,'fiesta'],[/\bcopete\b/gi,'bebida alcohólica'],
  [/\bcuático\b/gi,'complicado'],[/\bcuatico\b/gi,'complicado'],[/\bpiola\b/gi,'tranquilo'],
  // Otros regionalismos frecuentes para mantener una variante LATAM neutral.
  [/\bcurro\b/gi,'trabajo'],[/\bcurrar\b/gi,'trabajar'],[/\bguay\b/gi,'muy bueno'],[/\bchamba\b/gi,'trabajo'],[/\bchévere\b/gi,'muy bueno'],[/\bchevere\b/gi,'muy bueno'],
  [/\bordenador\b/gi,'computadora'],[/\bmóvil\b/gi,'celular'],[/\bmovil\b/gi,'celular'],[/\bcoche\b/gi,'auto'],
  [/\bpiso\b/gi,'departamento'],[/\bautobús\b/gi,'bus'],[/\bautobus\b/gi,'bus']
];

function neutralizeText(text:string){
  let out=text;
  for(const[r,to]of REPLACEMENTS)out=out.replace(r,to);
  return out;
}

function cleanNode(node:Node){
  if(node.nodeType===Node.TEXT_NODE){
    const old=node.nodeValue||'';
    const next=neutralizeText(old);
    if(next!==old)node.nodeValue=next;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const el=node as HTMLElement;
  if(el.tagName==='SCRIPT'||el.tagName==='STYLE'||el.tagName==='CODE')return;
  for(const child of Array.from(el.childNodes))cleanNode(child);
}

function run(){cleanNode(document.body)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();

const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of Array.from(record.addedNodes))cleanNode(node);
    if(record.type==='characterData')cleanNode(record.target);
  }
});
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

export{neutralizeText};
