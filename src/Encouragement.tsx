import {useEffect,useMemo,useState,type RefObject} from 'react';

export default function Encouragement({initial,phrases,heading}:{initial:string;phrases:string[];heading:RefObject<HTMLHeadingElement|null>}) {
 const messages=useMemo(()=>[...new Set([initial,...phrases].filter(Boolean))],[initial,phrases.join('\n')]);
 const [index,setIndex]=useState(0),[phase,setPhase]=useState<'still'|'out'|'in'>('still');
 const [paused,setPaused]=useState(false),[allowMotion,setAllowMotion]=useState(false);
 const [hidden,setHidden]=useState(document.hidden),[reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const visibility=()=>setHidden(document.hidden),media=window.matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(media.matches);
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);
  return()=>{document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);};
 },[]);
 const motionEnabled=!reduced||allowMotion;
 const advance=()=>{if(phase!=='still')return;if(!motionEnabled)setIndex(i=>(i+1)%messages.length);else setPhase('out');};
 useEffect(()=>{
  if(phase==='out'){const timer=setTimeout(()=>{setIndex(i=>(i+1)%messages.length);setPhase('in');},340);return()=>clearTimeout(timer);}
  if(phase==='in'){const timer=setTimeout(()=>setPhase('still'),360);return()=>clearTimeout(timer);}
  if(messages.length<2||paused||hidden||!motionEnabled)return;
  const timer=setTimeout(()=>setPhase('out'),Math.max(6500,messages[index].length*65));
  return()=>clearTimeout(timer);
 },[phase,index,messages,paused,hidden,motionEnabled]);
 return <div className={`encouragement-carousel${allowMotion?' motion-enabled':''}`}>
  <div className="encouragement-window">
   {messages.map(message=><div className="encouragement-size" aria-hidden="true" key={message}>{message}</div>)}
   <h1 ref={heading} tabIndex={-1} className={`encouragement-message swish-${phase}`}>{messages[index]}</h1>
  </div>
  {messages.length>1&&<div className="encouragement-controls">
   <button type="button" className="text-button" disabled={phase!=='still'} onClick={advance}>Next encouragement</button>
   {motionEnabled&&<button type="button" className="text-button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Resume cycling':'Pause cycling'}</button>}
  </div>}
  {reduced&&!allowMotion&&messages.length>1&&<div className="motion-notice"><p className="small">Reduce Motion is on, so automatic animation is off.</p><button type="button" className="text-button" onClick={()=>{setAllowMotion(true);setPaused(false);setPhase('out');}}>Play with motion</button></div>}
 </div>;
}
