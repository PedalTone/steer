import {useEffect,useState} from 'react';
import {splashTime} from './splashTime';
export default function SplashArt(){
 const [time,setTime]=useState(()=>splashTime());
 useEffect(()=>{
  const update=()=>setTime(splashTime());
  const timer=window.setInterval(update,30000);
  document.addEventListener('visibilitychange',update);window.addEventListener('focus',update);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update);};
 },[]);
 return <img className="splash-landscape" src={`./illustrations/splash-${time}.png`} alt={time==='day'?'A four-season tree beside a lake in warm morning light':'A four-season tree beside a lake under a crescent moon'} width="1672" height="941" fetchPriority="high"/>;
}
