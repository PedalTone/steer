import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await files(p));else if(!['sw.js','.nojekyll'].includes(entry.name))result.push(p);}return result;}
const paths=(await files('dist')).sort(),hash=createHash('sha256');for(const p of paths){hash.update(p);hash.update(await readFile(p));}
const revision=hash.digest('hex').slice(0,16),assets=paths.map(p=>'./'+p.slice(5));
const worker=`// Static app files only. Journal data is never cached here or sent over the network.
const PREFIX='steer-shell-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+${JSON.stringify(revision)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
// Wait for all open app windows to close before activating a newer app version.
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',scope).href)).then(hit=>hit||fetch(request)));return;}
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(request)).then(hit=>hit||fetch(request)));
});
`;
await writeFile('dist/sw.js',worker);await writeFile('dist/.nojekyll','');console.log(`Offline app shell: ${assets.length} assets, revision ${revision}`);
