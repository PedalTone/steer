import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const scope='https://example.github.io/steer/',worker=await readFile('dist/sw.js','utf8');
const handlers={},buckets=new Map([['another-app',new Map()],['steer-shell-/steer/-old',new Map()]]);let network=0,claimed=false,activatedWithoutClosing=false;
const caches={keys:async()=>[...buckets.keys()],delete:async k=>buckets.delete(k),open:async name=>{if(!buckets.has(name))buckets.set(name,new Map());const store=buckets.get(name);return {addAll:async assets=>{for(const asset of assets){await access('dist/'+asset.replace(/^\.\//,''));store.set(new URL(asset,scope).href,'cached:'+asset);}},match:async req=>store.get(typeof req==='string'?req:req.url)};}};
vm.runInNewContext(worker,{URL,Promise,caches,fetch:async()=>{network++;throw new Error('Offline');},self:{skipWaiting:async()=>{assert.ok([...buckets.values()].some(bucket=>bucket.has(scope+'index.html')));activatedWithoutClosing=true;},registration:{scope},clients:{claim:async()=>{claimed=true;}},addEventListener:(name,handler)=>{handlers[name]=handler;}}});
async function event(name){let job;handlers[name]({waitUntil:p=>{job=p;}});await job;}
await event('install');assert.equal(activatedWithoutClosing,true);await event('activate');assert.equal(claimed,true);assert.equal(buckets.has('another-app'),true);assert.equal(buckets.has('steer-shell-/steer/-old'),false);
let response;handlers.fetch({request:{url:scope,method:'GET',mode:'navigate'},respondWith:p=>{response=p;}});assert.equal(await response,'cached:./index.html');
handlers.fetch({request:{url:scope+'illustrations/splash-recipe-v2.webp',method:'GET',mode:'cors'},respondWith:p=>{response=p;}});assert.equal(await response,'cached:./illustrations/splash-recipe-v2.webp');assert.equal(network,0);
let intercepted=false;handlers.fetch({request:{url:'https://outside.example/',method:'GET'},respondWith:()=>{intercepted=true;}});assert.equal(intercepted,false);
const html=await readFile('dist/index.html','utf8');assert.match(html,/src="\.\/assets\//);assert.doesNotMatch(html,/signin-with-chatgpt|\/api\/journal/);
const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');for(const icon of manifest.icons)await access('dist/'+icon.src);
console.log('Offline checks passed: complete asset cache, repository subpath, offline navigation, offline illustration, scoped cleanup, and Home Screen manifest.');

let prematureActivation=false;const failedHandlers={};
vm.runInNewContext(worker,{URL,Promise,caches:{open:async()=>({addAll:async()=>{throw new Error('Download failed');}})},self:{registration:{scope},skipWaiting:async()=>{prematureActivation=true;},addEventListener:(name,handler)=>{failedHandlers[name]=handler;}}});
let failedInstall;failedHandlers.install({waitUntil:job=>{failedInstall=job;}});await assert.rejects(failedInstall,/Download failed/);assert.equal(prematureActivation,false);
console.log('Update checks passed: complete download activates without closing tabs; failed download never replaces the working version.');
