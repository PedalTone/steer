import {useRef,useState} from 'react';
import {makeBackup,type Journal} from './storage';

export default function FileSave({journal}:{journal:Journal}){
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),pending=useRef(false);
 async function saveFile(){
  if(pending.current)return;pending.current=true;setBusy(true);setMessage('');
  try{
   // Prepare synchronously from the committed journal to retain iPhone user activation.
   const backup=makeBackup(journal),name=`steer-journal-${backup.exportedAt.replace(/[:.]/g,'-')}.json`;
   const file=new File([JSON.stringify(backup,null,2)],name,{type:'application/json'});
   if(navigator.canShare?.({files:[file]})){
    await navigator.share({files:[file],title:'Steer journal'});
    setMessage('Share sheet closed. Check Files to confirm your copy was saved.');
   }else{
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    setMessage('Download requested. Check Files or Downloads for your journal copy.');
   }
  }catch(error){setMessage((error as Error).name==='AbortError'?'File save canceled. Your choice is still in Steer. Tap below to try again.':'Could not save the file. Your choice is still in Steer. Please try again.');}
  finally{pending.current=false;setBusy(false);}
 }
 return <div className="file-save"><h2>Keep a copy in Files.</h2><p>Save your complete journal, including this choice, to a file on your iPhone.</p><button type="button" className="primary" disabled={busy} onClick={()=>void saveFile()}>{busy?'Opening file save…':'Save journal to Files'}</button><p className="small">Choose Save to Files → On My iPhone → Save. Each copy includes all your choices and settings and can be restored in Steer.</p>{message&&<p className="small" role="status">{message}</p>}</div>;
}
