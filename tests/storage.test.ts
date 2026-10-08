import {legacyCategories} from '../src/journal.ts';
import 'fake-indexeddb/auto';
import {IDBObjectStore} from 'fake-indexeddb';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readJournal,writeJournal,makeBackup,parseBackup,importBackup} from '../src/storage.ts';
import {defaults} from '../src/journal.ts';
beforeEach(async()=>{await new Promise<void>((resolve,reject)=>{const req=indexedDB.deleteDatabase('steer-local-journal-v1');req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);});});
const choice=()=>({action:'record' as const,id:crypto.randomUUID(),categoryId:'junk-food',categoryLabel:'Eating junk food',choice:'plan' as const,mode:'moment' as const,occurredAt:new Date().toISOString(),note:'Local test only'});
test('first launch is empty and saving survives closing/reopening database connections',async()=>{assert.equal((await readJournal()).entries.length,0);const value=choice();const saved=await writeJournal(value);assert.equal(saved?.id,value.id);assert.equal((await readJournal()).entries[0].note,value.note);});
test('retrying a save is idempotent and keeps original committed choice',async()=>{const value=choice();await writeJournal(value);const retry=await writeJournal({...value,choice:'original'});assert.equal(retry?.choice,'plan');assert.equal((await readJournal()).entries.length,1);});
test('concurrent saves retain both entries',async()=>{await Promise.all([writeJournal(choice()),writeJournal(choice())]);assert.equal((await readJournal()).entries.length,2);});
test('edit and delete change the stored journal',async()=>{const value=choice();await writeJournal(value);await writeJournal({...value,action:'edit',choice:'original',note:'Corrected'});assert.equal((await readJournal()).entries[0].choice,'original');await writeJournal({action:'delete',id:value.id});assert.equal((await readJournal()).entries.length,0);});
test('settings stay on device and reload',async()=>{await writeJournal({action:'settings',settings:{...defaults,headline:'My local reminder'}});assert.equal((await readJournal()).settings.headline,'My local reminder');});
test('storage failure rejects the save and preserves earlier records',async()=>{await writeJournal(choice());const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Storage full','QuotaExceededError');};try{await assert.rejects(writeJournal({action:'settings',settings:{...defaults,headline:'Must not be saved'}}));}finally{IDBObjectStore.prototype.put=original;}const journal=await readJournal();assert.equal(journal.settings.headline,defaults.headline);assert.equal(journal.entries.length,1);});
test('backup round trip and import are additive, idempotent, and preserve settings by default',async()=>{const value=choice();await writeJournal(value);const backup=parseBackup(JSON.stringify(makeBackup(await readJournal())));await writeJournal({...value,action:'edit',note:'Newer local edit'});await writeJournal({action:'settings',settings:{...defaults,headline:'Keep me'}});backup.entries.push({...backup.entries[0],id:crypto.randomUUID()});assert.equal(await importBackup(backup,false),1);assert.equal(await importBackup(backup,false),0);let current=await readJournal();assert.equal(current.entries.find(e=>e.id===value.id)?.note,'Newer local edit');assert.equal(current.settings.headline,'Keep me');await importBackup(backup,true);current=await readJournal();assert.equal(current.settings.headline,defaults.headline);});
test('invalid backup leaves journal untouched',async()=>{await writeJournal(choice());for(const value of ['{}','not JSON',JSON.stringify({app:'steer',version:9})])assert.throws(()=>parseBackup(value));assert.equal((await readJournal()).entries.length,1);});
test('journal storage never uses the network',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('Network must not be used');};try{await writeJournal(choice());assert.equal((await readJournal()).entries.length,1);const backup=makeBackup(await readJournal());await importBackup(backup,false);}finally{globalThis.fetch=original;}});

test('new choices and phrase lists persist and survive backup restore',async()=>{const category={id:crypto.randomUUID(),label:'Putting things off',image:'splash-recipe-v2.webp',active:true};const settings={...defaults,categories:[...defaults.categories,category],encouragements:['Start small.','Remember tomorrow.']};await writeJournal({action:'settings',settings});let journal=await readJournal();assert.deepEqual(journal.settings.encouragements,settings.encouragements);assert.equal(journal.settings.categories.at(-1)?.label,category.label);await writeJournal({...choice(),categoryId:category.id,categoryLabel:category.label});const backup=parseBackup(JSON.stringify(makeBackup(await readJournal())));await writeJournal({action:'settings',settings:defaults});await importBackup(backup,true);journal=await readJournal();assert.equal(journal.entries[0].categoryId,category.id);assert.deepEqual(journal.settings.encouragements,settings.encouragements);});
test('old backup without phrase list remains importable',()=>{const {encouragements:_,...oldSettings}=defaults;const restored=parseBackup(JSON.stringify({app:'steer',version:1,exportedAt:new Date().toISOString(),settings:{...oldSettings,headline:'My original words'},entries:[]}));assert.equal(restored.settings.encouragements[0],'My original words');});

test('older backup imports seven directions and retains original food entry fields',async()=>{const {directionsVersion:_,...oldSettings}=defaults;const record={...choice(),categoryId:'seconds',categoryLabel:'Going for seconds',recordedAt:new Date().toISOString()};const backup=parseBackup(JSON.stringify({app:'steer',version:1,exportedAt:new Date().toISOString(),settings:{...oldSettings,categories:legacyCategories},entries:[record]}));await importBackup(backup,true);const journal=await readJournal();assert.equal(journal.settings.categories.length,7);assert.equal(journal.entries[0].categoryId,'seconds');assert.equal(journal.entries[0].categoryLabel,'Going for seconds');assert.equal(journal.entries[0].id,record.id);});
test('editing a direction’s reminder remains saved after reload and backup',async()=>{const settings={...defaults,categories:defaults.categories.map(c=>c.id==='move-well'?{...c,encouragement:'Just start.',guidance:'Put on my shoes.'}:c)};await writeJournal({action:'settings',settings});const backup=parseBackup(JSON.stringify(makeBackup(await readJournal())));assert.equal(backup.settings.categories.find(c=>c.id==='move-well')?.guidance,'Put on my shoes.');});

test('edited options and selected actions survive reload and backup restore',async()=>{
 const settings={...defaults,categories:defaults.categories.map((c,i)=>({...c,alternatives:i===0?['Call my sister','Play piano']:[]}))};
 await writeJournal({action:'settings',settings});
 const value={...choice(),alternative:'Call my sister'};
 await writeJournal(value);
 let journal=await readJournal();
 assert.deepEqual(journal.settings.categories[0].alternatives,['Call my sister','Play piano']);
 assert.equal(journal.entries[0].alternative,'Call my sister');
 const backup=parseBackup(JSON.stringify(makeBackup(journal)));
 await writeJournal({action:'delete',id:value.id});
 await writeJournal({action:'settings',settings:defaults});
 await importBackup(backup,true);
 journal=await readJournal();
 assert.equal(journal.entries[0].alternative,'Call my sister');
 assert.deepEqual(journal.settings.categories[1].alternatives,[]);
 await writeJournal({...value,action:'edit',choice:'original'});
 assert.equal((await readJournal()).entries[0].alternative,undefined);
});
