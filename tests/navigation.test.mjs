import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import {act,create} from 'react-test-renderer';

test('moment flow requires a goal selection before actions, then records the selected goal',async()=>{
 const dir=await mkdtemp(new URL('../.navigation-test-',import.meta.url));
 let renderer;
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,window:{scrollTo(){},addEventListener(){},removeEventListener(){},matchMedia(){return {matches:false,addEventListener(){},removeEventListener(){}}}},document:{hidden:false,addEventListener(){},removeEventListener(){}}});
 try {
  for(const file of await readdir(new URL('../src/',import.meta.url))){
   if(!/\.tsx?$/.test(file))continue;
   const source=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
   const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/(from\s*['"]\.\/[^'"]+?)(?:\.tsx?)?(['"])/g,'$1.js$2').replaceAll('import.meta.env.PROD','false');
   await writeFile(dir+'/'+file.replace(/\.tsx?$/,'.js'),output);
  }
  const {default:Steer}=await import(dir+'/Steer.js');
  await act(async()=>{renderer=create(React.createElement(Steer));});
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,40));});
  assert.equal(renderer.root.findAllByProps({className:'build-info'}).length,1);
  const textOf=(node)=>typeof node==='string'?node:Array.isArray(node)?node.map(textOf).join(' '):node?.props?textOf(node.props.children):'';
  const button=(text)=>renderer.root.findAllByType('button').find(b=>textOf(b.props.children).includes(text));
  await act(async()=>button('I’m in a moment').props.onClick());
  let cards=renderer.root.findAllByProps({className:'choice-card'});
  assert.equal(cards.length,7);
  assert.equal(renderer.root.findAllByType('img').length,0);
  assert.equal(renderer.root.findAllByProps({className:'goal-icon'}).length,7);
  assert.equal(renderer.root.findAllByProps({className:'moment-options'}).length,0);
  await act(async()=>cards.find(c=>textOf(c.props.children).includes('Eat Well')).props.onClick());
  assert.equal(renderer.root.findAllByProps({className:'choice-card'}).length,0);
  assert.equal(renderer.root.findAllByProps({className:'moment-options'}).length,1);
  const options=renderer.root.findAllByProps({className:'secondary action-option'});
  assert.equal(options.length,5);
  assert.equal(renderer.root.findAllByType('img').length,0);
  assert.equal(button('Next encouragement'),undefined);
  assert.equal(button('Pause cycling'),undefined);
  assert.equal(button('Choose another step toward my plan'),undefined);
  assert.equal(button('Continue as I was'),undefined);
  assert.ok(!JSON.stringify(renderer.toJSON()).includes('Both choices count'));
  await act(async()=>options[0].props.onClick());
  assert.equal(renderer.root.findAllByProps({className:'review'}).length,1);
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Eat Well'));
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Pause and check whether I’m hungry'));
  await act(async()=>button('Save to my journal').props.onClick());
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,40));});
  assert.ok(button('Save journal to Files'));
  let offered;
  Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true});
  Object.defineProperty(navigator,'share',{value:async data=>{offered=data.files[0];throw new DOMException('Canceled','AbortError');},configurable:true});
  await act(async()=>button('Save journal to Files').props.onClick());
  assert.ok(JSON.stringify(renderer.toJSON()).includes('File save canceled'));
  const contents=JSON.parse(await offered.text());
  assert.equal(contents.entries.length,1);
  assert.equal(contents.entries[0].alternative,'Pause and check whether I’m hungry');
  assert.equal(contents.settings.categories.length,7);
  assert.match(offered.name,/^steer-journal-.*\.json$/);
  Object.defineProperty(navigator,'share',{value:async()=>{},configurable:true});
  await act(async()=>button('Save journal to Files').props.onClick());
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Check Files to confirm'));
  delete navigator.canShare;delete navigator.share;

 } finally {if(renderer)await act(async()=>renderer.unmount());await rm(dir,{recursive:true,force:true});}
});

test('an activated update waits until unsaved screens are left before reloading',async()=>{
 const dir=await mkdtemp(new URL('../.update-test-',import.meta.url));let renderer,reloads=0;
 const handlers=new Map();
 const sw={controller:{},register:async()=>({active:{},update:async()=>{},addEventListener(){}}),addEventListener:(event,handler)=>handlers.set(event,handler),removeEventListener:event=>handlers.delete(event)};
 Object.defineProperty(navigator,'serviceWorker',{value:sw,configurable:true});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,window:{location:{reload(){reloads++;}},addEventListener(){},removeEventListener(){}}});
 try{
  const source=await readFile(new URL('../src/OfflineStatus.tsx',import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('import.meta.env.PROD','true');
  await writeFile(dir+'/OfflineStatus.js',output);const {default:Status}=await import(dir+'/OfflineStatus.js');
  await act(async()=>{renderer=create(React.createElement(Status,{visible:false,canReload:false}));});
  await act(async()=>handlers.get('controllerchange')());assert.equal(reloads,0);
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Save your changes'));
  await act(async()=>renderer.update(React.createElement(Status,{visible:false,canReload:true})));assert.equal(reloads,1);
 }finally{if(renderer)await act(async()=>renderer.unmount());delete navigator.serviceWorker;await rm(dir,{recursive:true,force:true});}
});
