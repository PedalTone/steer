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
  const textOf=(node)=>typeof node==='string'?node:Array.isArray(node)?node.map(textOf).join(' '):node?.props?textOf(node.props.children):'';
  const button=(text)=>renderer.root.findAllByType('button').find(b=>textOf(b.props.children).includes(text));
  await act(async()=>button('I’m in a moment').props.onClick());
  let cards=renderer.root.findAllByProps({className:'choice-card'});
  assert.equal(cards.length,7);
  assert.equal(renderer.root.findAllByProps({className:'moment-options'}).length,0);
  await act(async()=>cards.find(c=>textOf(c.props.children).includes('Eat Well')).props.onClick());
  assert.equal(renderer.root.findAllByProps({className:'choice-card'}).length,0);
  assert.equal(renderer.root.findAllByProps({className:'moment-options'}).length,1);
  const options=renderer.root.findAllByProps({className:'secondary action-option'});
  assert.equal(options.length,5);
  await act(async()=>options[0].props.onClick());
  assert.equal(renderer.root.findAllByProps({className:'review'}).length,1);
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Eat Well'));
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Pause and check whether I’m hungry'));
 } finally {if(renderer)await act(async()=>renderer.unmount());await rm(dir,{recursive:true,force:true});}
});
