import React from 'react';
import{createRoot}from'react-dom/client';
import'./styles.css';
import'./vocabCoach.css';
import'./vellaCoach.css';
import'./naturalGermanVoice';
import'./feedbackSounds';
import'./neutralLatam';
import'./vellaCoach';
import{bootstrapCompleteTranslations}from'./translationFallback';
import{bootstrapCloudProgress,installCloudProgressSync}from'./cloudProgress';

function esc(message:string){return message.replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]||m))}
function showFatal(message:string){
  const root=document.getElementById('root');
  if(!root)return;
  root.innerHTML=`<div style="font-family:system-ui;padding:32px;max-width:900px;margin:40px auto;background:#fff;color:#221a33;border-radius:16px;box-shadow:0 20px 60px #0002"><h1>La app encontró un error</h1><p>Copia este mensaje y mándamelo:</p><pre style="white-space:pre-wrap;overflow:auto">${esc(message)}</pre></div>`;
}
window.addEventListener('error',e=>showFatal(e.error?.stack||e.message||'Error desconocido'));
window.addEventListener('unhandledrejection',e=>showFatal((e.reason&&e.reason.stack)||String(e.reason)));

async function boot(){
  try{
    if('serviceWorker'in navigator){
      if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
        const regs=await navigator.serviceWorker.getRegistrations();
        regs.forEach(r=>r.unregister());
        if('caches'in window){for(const k of await caches.keys())await caches.delete(k)}
      }else{
        window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
      }
    }

    // Only hydrate cloud progress before React. This is fast and preserves the exact
    // telcb1 state on a new device.
    await bootstrapCloudProgress();

    // Render the UI immediately. The translation completion can make hundreds of
    // external requests on a fresh browser, so it must never block first paint.
    const{default:App}=await import('./App');
    createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
    installCloudProgressSync();

    // Warm heavy/optional datasets after the app is already usable.
    void Promise.allSettled([
      bootstrapCompleteTranslations(),
      import('./examCorpus'),
      import('./fullExamTraining'),
      import('./fullSpeakingTraining'),
    ]).then(results=>{
      results.forEach(r=>{if(r.status==='rejected')console.warn('German Coach background warmup failed',r.reason)});
    });
  }catch(err:any){
    console.error('TELC B1 boot error',err);
    showFatal(err?.stack||err?.message||String(err));
  }
}

boot();
