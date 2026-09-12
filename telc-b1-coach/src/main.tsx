import React from 'react';
import{createRoot}from'react-dom/client';
import App from'./App';
import'./styles.css';
import'./examCorpus';
import'./fullExamTraining';
import'./fullSpeakingTraining';

function showFatal(message:string){
  const root=document.getElementById('root');
  if(!root)return;
  root.innerHTML=`<div style="font-family:system-ui;padding:32px;max-width:900px;margin:40px auto;background:#fff;color:#221a33;border-radius:16px"><h1>La app encontró un error</h1><pre style="white-space:pre-wrap">${message.replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]||m))}</pre></div>`;
}
window.addEventListener('error',e=>showFatal(e.error?.stack||e.message||'Error desconocido'));
window.addEventListener('unhandledrejection',e=>showFatal((e.reason&&e.reason.stack)||String(e.reason)));

if('serviceWorker'in navigator){
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
    caches?.keys?.().then(keys=>keys.forEach(k=>caches.delete(k)));
  }else{
    window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
  }
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
