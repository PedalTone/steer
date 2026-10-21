import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quickProgress,periodBounds,shiftPeriod,entriesInPeriod,type Entry} from '../src/journal.ts';
test('quick rewards count local days and Monday weeks, including original decisions',()=>{
 const dates=['2026-10-04T23:59:00','2026-10-05T00:00:00','2026-10-08T00:00:00','2026-10-08T23:59:00','2026-10-09T00:00:00'];
 const entries=dates.map((date,i):Entry=>({id:String(i),categoryId:'scrolling',categoryLabel:'Be Present',choice:i===3?'original':'plan',mode:'moment',occurredAt:new Date(date).toISOString(),recordedAt:new Date(date).toISOString(),note:''}));
 const result=quickProgress(entries,new Date('2026-10-08T23:59:59'));
 assert.equal(result.today.total,2);assert.equal(result.today.plan,1);
 assert.equal(result.week.total,4);assert.equal(result.week.plan,3);
 assert.equal(quickProgress([],new Date()).today.total,0);
});

test('day metrics use local midnight and daily navigation crosses months and DST',()=>{
 const day=new Date(2026,10,1,12);const {start,end}=periodBounds(day,'day');
 assert.equal(start.getHours(),0);assert.equal(end.getDate(),2);
 assert.equal((end.getTime()-start.getTime())/3600000,25);
 const previous=shiftPeriod(new Date(2026,9,1),'day',-1);
 assert.equal(previous.getMonth(),8);assert.equal(previous.getDate(),30);
 assert.equal(entriesInPeriod([{id:'x',categoryId:'x',categoryLabel:'x',choice:'plan',mode:'moment',occurredAt:end.toISOString(),recordedAt:end.toISOString(),note:''}],day,'day').length,0);
});
