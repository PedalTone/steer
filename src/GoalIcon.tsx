const icons:Record<string,{symbol:string;color:string,label:string}>={
 'scrolling':{symbol:'🌿',color:'#e4f5e9',label:'Be Present'},
 'eat-well':{symbol:'🥑',color:'#f0f3d5',label:'Eat Well'},
 'staying-up-late':{symbol:'🌙',color:'#ece8fc',label:'Rest Well'},
 'negative-self-talk':{symbol:'💗',color:'#ffe7ef',label:'Be Kind to Myself'},
 'lingering-in-bed':{symbol:'☀️',color:'#fff1cf',label:'Start My Day'},
 'watching-movies':{symbol:'🎨',color:'#e2efff',label:'Use My Time Well'},
 'move-well':{symbol:'💪',color:'#ffe9d8',label:'Move Well'},
 'custom':{symbol:'✨',color:'#e9ecff',label:'Something good'}
};
export const goalIcons=Object.entries(icons).map(([id,value])=>({id,...value}));
export default function GoalIcon({id,image}:{id?:string;image?:string}){
 const key=image?.startsWith('icon:')?image.slice(5):id&&icons[id]?id:image==='move-well.webp'?'move-well':image?.replace('option-a-','').replace('-v2.webp','');
 const icon=icons[key??'custom']??icons.custom;
 return <span className="goal-icon" aria-hidden="true" style={{background:icon.color}}>{icon.symbol}</span>;
}
