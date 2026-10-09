import {useEffect,useRef,useState} from 'react';
export default function OfflineStatus({visible,canReload}:{visible:boolean;canReload:boolean}){
 const safeToReload=useRef(canReload);safeToReload.current=canReload;
 const [updateReady,setUpdateReady]=useState(false);
 useEffect(()=>{if(updateReady&&canReload)window.location.reload();},[updateReady,canReload]);
 const [message,setMessage]=useState('Preparing offline access…');
 useEffect(()=>{
  let active=true,ready=false,hasUpdate=false;
  const hadController=Boolean(navigator.serviceWorker?.controller);
  let registration:ServiceWorkerRegistration|undefined;
  const changed=()=>{if(active&&hadController){hasUpdate=true;if(safeToReload.current){window.location.reload();return;}setUpdateReady(true);setMessage('Update ready. Save your changes, then return to My day to load it.');}};
  const check=()=>{if(active)void registration?.update().catch(()=>{});};
  const update=()=>{if(active&&ready&&!hasUpdate)setMessage(navigator.onLine?'Ready for offline use':'Offline · your journal still saves on this device');};
  const warn=()=>{if(active)setMessage('Offline setup is incomplete. Reopen Steer online to try again.');};
  if('serviceWorker' in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;
    if(reg.active){ready=true;update();}
    void reg.update().catch(()=>{});
    const worker=reg.installing??reg.waiting;
    worker?.addEventListener('statechange',()=>{if(worker.state==='activated'){ready=true;update();}if(worker.state==='redundant'&&!reg.active)warn();});
    reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&reg.active&&active)setMessage('An app update is downloading. Save your changes before refreshing.');});});
   }).catch(warn);
  }else setMessage('Local preview · offline access is enabled in the published app');
  navigator.serviceWorker?.addEventListener('controllerchange',changed);
  window.addEventListener('focus',check);window.addEventListener('online',check);
  window.addEventListener('online',update);window.addEventListener('offline',update);
  return()=>{active=false;window.removeEventListener('focus',check);window.removeEventListener('online',check);navigator.serviceWorker?.removeEventListener('controllerchange',changed);window.removeEventListener('online',update);window.removeEventListener('offline',update);};
 },[]);
 return visible||updateReady ? <p className="small offline-status" role="status">{message}</p> : null;
}
