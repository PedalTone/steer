import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splashTime} from '../src/splashTime.ts';
test('splash follows local day and evening boundaries',()=>{
 for(const [hour,minute,expected] of [[0,0,'evening'],[5,59,'evening'],[6,0,'day'],[12,0,'day'],[17,59,'day'],[18,0,'evening'],[23,59,'evening']] as const){assert.equal(splashTime(new Date(2026,9,20,hour,minute)),expected);}
});
