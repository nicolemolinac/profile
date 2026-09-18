type CloudProgressResponse={configured:boolean;data?:Record<string,any>|null;updated_at?:string|null}

const KEY='telcb1'
let remoteReady=false
let applyingRemote=false
let lastSent=''
let lastRemoteUpdatedAt=''

function rawLocal(){return localStorage.getItem(KEY)||''}
function parseRaw(raw:string){try{return raw?JSON.parse(raw):null}catch{return null}}

async function fetchRemote():Promise<CloudProgressResponse>{
  const r=await fetch('/api/progress',{headers:{Accept:'application/json'},cache:'no-store'})
  if(!r.ok)throw new Error(`German cloud progress GET failed (${r.status})`)
  return r.json()
}

async function pushRaw(raw:string){
  if(!raw||applyingRemote)return
  const data=parseRaw(raw);if(!data)return
  const r=await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data}),keepalive:true})
  if(!r.ok)throw new Error(`German cloud progress POST failed (${r.status})`)
  const saved=await r.json().catch(()=>({}))
  lastSent=raw;remoteReady=true
  if(saved?.updated_at)lastRemoteUpdatedAt=saved.updated_at
}

function applyRemote(data:Record<string,any>){
  const raw=JSON.stringify(data)
  if(raw===rawLocal()){lastSent=raw;return false}
  applyingRemote=true;localStorage.setItem(KEY,raw);applyingRemote=false;lastSent=raw
  window.dispatchEvent(new CustomEvent('telcb1:remote-progress',{detail:data}))
  return true
}

function whenBodyReady(fn:()=>void){if(document.body)fn();else window.addEventListener('DOMContentLoaded',fn,{once:true})}
function styleButton(button:HTMLButtonElement){Object.assign(button.style,{position:'fixed',right:'16px',bottom:'16px',zIndex:'99999',border:'0',borderRadius:'999px',padding:'11px 15px',background:'#2f5946',color:'#fff',font:'700 12px system-ui',boxShadow:'0 10px 30px #0002',cursor:'pointer'})}
function addLocalExportButton(){if(document.getElementById('german-cloud-export'))return;const b=document.createElement('button');b.id='german-cloud-export';b.type='button';b.textContent='☁️ Copiar progreso para cloud';styleButton(b);b.onclick=async()=>{const raw=rawLocal()||'{}';try{await navigator.clipboard.writeText(raw);b.textContent='✓ Progreso copiado';setTimeout(()=>b.textContent='☁️ Copiar progreso para cloud',2200)}catch{window.prompt('Copia este progreso completo:',raw)}};document.body.appendChild(b)}
function addCloudImportButton(){if(document.getElementById('german-cloud-import'))return;const b=document.createElement('button');b.id='german-cloud-import';b.type='button';b.textContent='Importar mi progreso anterior';styleButton(b);b.onclick=async()=>{let raw='';try{raw=await navigator.clipboard.readText()}catch{}if(!raw)raw=window.prompt('Pega aquí el progreso copiado desde tu German Coach local:')||'';if(!raw)return;try{JSON.parse(raw);await pushRaw(raw);localStorage.setItem(KEY,raw);b.textContent='✓ Progreso importado';setTimeout(()=>location.reload(),500)}catch(err:any){alert(err?.message||'No pude importar ese progreso.')}};document.body.appendChild(b)}

export async function bootstrapCloudProgress(){
  const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
  if(localHost){whenBodyReady(addLocalExportButton);return}
  try{
    const remote=await fetchRemote()
    if(remote?.data&&typeof remote.data==='object'){
      applyRemote(remote.data);remoteReady=true;lastRemoteUpdatedAt=remote.updated_at||'';return
    }
    const local=rawLocal();if(local){await pushRaw(local);return}
  }catch(err){console.warn('German cloud progress bootstrap failed',err)}
  whenBodyReady(addCloudImportButton)
}

export function installCloudProgressSync(){
  const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
  if(localHost){whenBodyReady(addLocalExportButton);return}
  let lastObserved=rawLocal()
  window.setInterval(async()=>{
    const raw=rawLocal()
    if(remoteReady&&raw&&raw!==lastObserved&&raw!==lastSent){lastObserved=raw;try{await pushRaw(raw)}catch(err){console.warn('German cloud progress sync failed',err)}}
    try{
      const remote=await fetchRemote();remoteReady=true
      if(remote.updated_at&&remote.updated_at!==lastRemoteUpdatedAt){
        lastRemoteUpdatedAt=remote.updated_at
        if(remote.data&&typeof remote.data==='object')applyRemote(remote.data)
      }
    }catch(err){console.warn('German cloud progress refresh failed',err)}
  },2500)
  const flush=()=>{const raw=rawLocal();if(raw&&raw!==lastSent)void pushRaw(raw).catch(()=>{})}
  window.addEventListener('pagehide',flush)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()})
}
