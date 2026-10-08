import {useEffect,useState} from 'react';
export default function OfflineStatus({visible}:{visible:boolean}){
 const [message,setMessage]=useState('Preparing offline access…');
 useEffect(()=>{
  let active=true,ready=false;
  const update=()=>{if(active&&ready)setMessage(navigator.onLine?'Ready for offline use':'Offline · your journal still saves on this device');};
  const warn=()=>{if(active)setMessage('Offline setup is incomplete. Reopen Steer online to try again.');};
  if('serviceWorker' in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
    if(reg.active){ready=true;update();}
    const worker=reg.installing??reg.waiting;
    worker?.addEventListener('statechange',()=>{if(worker.state==='activated'){ready=true;update();}if(worker.state==='redundant'&&!reg.active)warn();});
    reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&reg.active&&active)setMessage('An app update is ready. Close all Steer windows and reopen after saving.');});});
   }).catch(warn);
  }else setMessage('Local preview · offline access is enabled in the published app');
  window.addEventListener('online',update);window.addEventListener('offline',update);
  return()=>{active=false;window.removeEventListener('online',update);window.removeEventListener('offline',update);};
 },[]);
 return visible ? <p className="small offline-status" role="status">{message}</p> : null;
}
