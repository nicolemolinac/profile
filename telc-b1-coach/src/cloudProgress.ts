type CloudProgressResponse={configured:boolean;data?:Record<string,any>|null;updated_at?:string|null}

const KEY='telcb1'
let remoteReady=false
let applyingRemote=false
let lastSent=''

function readLocal(){
  const raw=localStorage.getItem(KEY)
  if(!raw)return null
  try{return JSON.parse(raw)}catch{return null}
}

async function fetchRemote():Promise<CloudProgressResponse>{
  const r=await fetch('/api/progress',{headers:{Accept:'application/json'}})
  if(!r.ok)throw new Error(`German cloud progress GET failed (${r.status})`)
  return r.json()
}

async function pushRaw(raw:string){
  if(!raw||applyingRemote)return
  let data:any
  try{data=JSON.parse(raw)}catch{return}
  const r=await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data})})
  if(!r.ok)throw new Error(`German cloud progress POST failed (${r.status})`)
  lastSent=raw
  remoteReady=true
}

function styleButton(button:HTMLButtonElement){
  Object.assign(button.style,{position:'fixed',right:'16px',bottom:'16px',zIndex:'99999',border:'0',borderRadius:'999px',padding:'11px 15px',background:'#2f5946',color:'#fff',font:'700 12px system-ui',boxShadow:'0 10px 30px #0002',cursor:'pointer'})
}

function addLocalExportButton(){
  if(document.getElementById('german-cloud-export'))return
  const b=document.createElement('button')
  b.id='german-cloud-export'
  b.type='button'
  b.textContent='☁️ Copiar progreso para cloud'
  styleButton(b)
  b.onclick=async()=>{
    const raw=localStorage.getItem(KEY)||'{}'
    try{
      await navigator.clipboard.writeText(raw)
      b.textContent='✓ Progreso copiado'
      setTimeout(()=>b.textContent='☁️ Copiar progreso para cloud',2200)
    }catch{
      window.prompt('Copia este progreso completo:',raw)
    }
  }
  document.body.appendChild(b)
}

function addCloudImportButton(){
  if(document.getElementById('german-cloud-import'))return
  const b=document.createElement('button')
  b.id='german-cloud-import'
  b.type='button'
  b.textContent='Importar mi progreso anterior'
  styleButton(b)
  b.onclick=async()=>{
    let raw=''
    try{raw=await navigator.clipboard.readText()}catch{}
    if(!raw)raw=window.prompt('Pega aquí el progreso copiado desde tu German Coach local:')||''
    if(!raw)return
    try{
      JSON.parse(raw)
      await pushRaw(raw)
      localStorage.setItem(KEY,raw)
      b.textContent='✓ Progreso importado'
      setTimeout(()=>location.reload(),500)
    }catch(err:any){alert(err?.message||'No pude importar ese progreso.')}
  }
  document.body.appendChild(b)
}

export async function bootstrapCloudProgress(){
  const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
  if(localHost){
    window.addEventListener('DOMContentLoaded',addLocalExportButton,{once:true})
    return
  }

  try{
    const remote=await fetchRemote()
    if(remote?.data&&typeof remote.data==='object'){
      const raw=JSON.stringify(remote.data)
      applyingRemote=true
      localStorage.setItem(KEY,raw)
      applyingRemote=false
      lastSent=raw
      remoteReady=true
      return
    }

    const local=localStorage.getItem(KEY)
    if(local){
      await pushRaw(local)
      return
    }
  }catch(err){
    console.warn('German cloud progress bootstrap failed',err)
  }

  window.addEventListener('DOMContentLoaded',addCloudImportButton,{once:true})
}

export function installCloudProgressSync(){
  const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
  if(localHost){addLocalExportButton();return}

  let lastObserved=localStorage.getItem(KEY)||''
  window.setInterval(()=>{
    const raw=localStorage.getItem(KEY)||''
    if(!remoteReady||!raw||raw===lastObserved||raw===lastSent)return
    lastObserved=raw
    void pushRaw(raw).catch(err=>console.warn('German cloud progress sync failed',err))
  },1800)
}
