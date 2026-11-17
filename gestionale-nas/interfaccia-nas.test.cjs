'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {Script}=require('node:vm');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'index.html'),'utf8');
test('javascript incorporato nella pagina ha sintassi valida',()=>{
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
  assert.ok(scripts.length>0);
  for(const script of scripts) assert.doesNotThrow(()=>new Script(script));
});
test('interfaccia contiene azioni soci e non include password predefinite',()=>{
  for(const id of ['socio-form','new-socio','socio-save','socio-cancel']) assert.ok(html.includes('id="'+id+'"'));
  assert.ok(html.includes('api.createSocio('));
  assert.ok(html.includes('api.updateSocio('));
  assert.ok(!html.includes('PGPASSWORD='));
});
