import { z } from 'zod';
import { defaults, settingsSchema, mutationSchema, type Entry, type Settings } from './journal.ts';
const DB_NAME='steer-local-journal-v1';
const entrySchema=z.object({id:z.string().uuid(),categoryId:z.string().min(1).max(80),categoryLabel:z.string().min(1).max(80),choice:z.enum(['plan','original']),mode:z.enum(['moment','reflection']),occurredAt:z.string().datetime(),recordedAt:z.string().datetime(),note:z.string().max(1000)});
const backupSchema=z.object({app:z.literal('steer'),version:z.literal(1),exportedAt:z.string().datetime(),settings:settingsSchema,entries:z.array(entrySchema).max(50000)}).refine(v=>new Set(v.entries.map(e=>e.id)).size===v.entries.length,'Duplicate entries in backup');
export type Journal={settings:Settings;entries:Entry[]};
export type Backup=z.infer<typeof backupSchema>;
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(new Error('Local storage is unavailable. Open Steer in Safari or from your Home Screen and try again.'));return;}
 const req=indexedDB.open(DB_NAME,1);
 req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('entries',{keyPath:'id'});db.createObjectStore('preferences');};
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(new Error('Your local journal could not open. Please try again without clearing website data.'));
 req.onblocked=()=>reject(new Error('Close other Steer windows, then try again.'));
});}
// Only acknowledge writes after the full transaction commits, including disk errors.
async function transaction<T>(stores:string[],mode:IDBTransactionMode,run:(tx:IDBTransaction,setResult:(value:T)=>void)=>void):Promise<T>{
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  let value:T, tx:IDBTransaction;
  try{tx=db.transaction(stores,mode);}catch(e){db.close();reject(e);return;}
  tx.oncomplete=()=>{db.close();resolve(value);};
  tx.onabort=()=>{db.close();reject(new Error('This change was not saved on this device. Keep this screen open, check available storage, and try again.'));};
  try{run(tx,v=>{value=v;});}catch(e){tx.abort();db.close();reject(e);}
 });
}
export async function readJournal():Promise<Journal>{
 const data=await transaction<{settings:unknown;entries:unknown[]}>(['entries','preferences'],'readonly',(tx,set)=>{
  const entries=tx.objectStore('entries').getAll(),settings=tx.objectStore('preferences').get('settings');
  const collect=()=>{if(entries.readyState==='done'&&settings.readyState==='done')set({entries:entries.result,settings:settings.result??defaults});};entries.onsuccess=collect;settings.onsuccess=collect;
 });
 const parsedSettings=settingsSchema.safeParse(data.settings),parsedEntries=z.array(entrySchema).safeParse(data.entries);
 if(!parsedSettings.success||!parsedEntries.success)throw new Error('Your journal needs recovery. Your stored data has been left untouched.');
 return {settings:parsedSettings.data,entries:parsedEntries.data.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))};
}
export async function writeJournal(body:unknown):Promise<Entry|undefined>{
 const parsed=mutationSchema.safeParse(body);if(!parsed.success)throw new Error(parsed.error.issues[0].message);const v=parsed.data;
 return transaction<Entry|undefined>(['entries','preferences'],'readwrite',(tx,set)=>{
  if(v.action==='settings'){tx.objectStore('preferences').put(v.settings,'settings');set(undefined);return;}
  const store=tx.objectStore('entries'),existing=store.get(v.id);
  existing.onsuccess=()=>{
   if(v.action==='delete'){store.delete(v.id);set(undefined);return;}
   // A retry of a completed save returns the existing entry, never another copy.
   if(v.action==='record'&&existing.result){set(existing.result);return;}
   if(v.action==='edit'&&!existing.result){tx.abort();return;}
   const entry:Entry={id:v.id,categoryId:v.categoryId,categoryLabel:v.categoryLabel,choice:v.choice,mode:v.mode,occurredAt:v.occurredAt,note:v.note,recordedAt:existing.result?.recordedAt??new Date().toISOString()};
   store.put(entry);set(entry);
  };
 });
}
export function makeBackup(journal:Journal):Backup{return backupSchema.parse({app:'steer',version:1,exportedAt:new Date().toISOString(),...journal});}
export function parseBackup(text:string):Backup{
 if(text.length>20_000_000)throw new Error('This file is too large. Choose a Steer backup under 20 MB.');
 try{return backupSchema.parse(JSON.parse(text));}catch{throw new Error('This is not a valid Steer backup. Your journal has not changed.');}
}
export async function importBackup(backup:Backup,restoreSettings:boolean):Promise<number>{
 const valid=backupSchema.parse(backup);
 return transaction<number>(['entries','preferences'],'readwrite',(tx,set)=>{
  let added=0;set(0);const store=tx.objectStore('entries');
  for(const entry of valid.entries){const req=store.get(entry.id);req.onsuccess=()=>{if(!req.result){store.add(entry);set(++added);}};}
  if(restoreSettings)tx.objectStore('preferences').put(valid.settings,'settings');
 });
}
export async function requestPersistentStorage(){try{return await navigator.storage?.persist?.()??false;}catch{return false;}}
