export default function BuildInfo(){
 const version=import.meta.env?.VITE_APP_VERSION??'dev';
 const builtAt=import.meta.env?.VITE_BUILD_TIME;
 return <p className="build-info">Version {version}{builtAt&&<> · Built <time dateTime={builtAt}>{new Date(builtAt).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}</time></>}</p>;
}
