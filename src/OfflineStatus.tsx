import {useEffect,useState} from 'react';
export default function OfflineStatus({visible}:{visible:boolean}){
 const [message,setMessage]=useState('Preparing offline access…');
 useEffect(()=>{
  let active=true,ready=false,hasUpdate=false;
  const changed=()=>{if(active){hasUpdate=true;setMessage('A new version is ready. Save any changes, then refresh Steer to use it.');}};
  const update=()=>{if(active&&ready&&!hasUpdate)setMessage(navigator.onLine?'Ready for offline use':'Offline · your journal still saves on this device');};
  const warn=()=>{if(active)setMessage('Offline setup is incomplete. Reopen Steer online to try again.');};
  if('serviceWorker' in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    if(reg.active){ready=true;update();}
    void reg.update().catch(()=>{});
    const worker=reg.installing??reg.waiting;
    worker?.addEventListener('statechange',()=>{if(worker.state==='activated'){ready=true;update();}if(worker.state==='redundant'&&!reg.active)warn();});
    reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&reg.active&&active)setMessage('An app update is downloading. Save your changes before refreshing.');});});
   }).catch(warn);
  }else setMessage('Local preview · offline access is enabled in the published app');
  navigator.serviceWorker?.addEventListener('controllerchange',changed);
  window.addEventListener('online',update);window.addEventListener('offline',update);
  return()=>{active=false;navigator.serviceWorker?.removeEventListener('controllerchange',changed);window.removeEventListener('online',update);window.removeEventListener('offline',update);};
 },[]);
 return visible ? <p className="small offline-status" role="status">{message}</p> : null;
}
