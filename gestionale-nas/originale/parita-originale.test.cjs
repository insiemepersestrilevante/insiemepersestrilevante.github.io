'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=__dirname;
const html=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'app.js'),'utf8');
const adapter=readFileSync(join(root,'nas-adapter.js'),'utf8');

test('la pagina originale è mantenuta e carica adapter prima del gestionale',()=>{
  assert.match(html,/id="loginform"/);
  assert.match(html,/id="dashboard"/);
  assert.match(html,/id="records"/);
  assert.ok(html.indexOf('src="./nas-adapter.js"')<html.indexOf('src="app.js"'));
  assert.doesNotMatch(html,/window\.supabase\.createClient/);
  assert.doesNotMatch(html,/dccuvlfceuontjniehhf\.supabase\.co/);
});
test('il codice originale mantiene le funzioni per ricevute, PDF, Excel e archivi',()=>{
  for(const name of ['receiptPdf','downloadReceipt','createReceipt','exportLibroSoci','openArchivedReceipt','openFile','activateGestionale']){
    assert.match(app,new RegExp('(?:function\\s+|window\\.)'+name+'\\b'));
  }
});
test('le chiamate originali usano solo le nove tabelle note',()=>{
  const allowed=new Set(['soci','annualita','categorie_movimenti','verbali','iscrizioni','pagamenti','documenti','movimenti','ricevute']);
  const tables=[...app.matchAll(/db\.from\('([^']+)'\)/g)].map(m=>m[1]);
  assert.ok(tables.length>10);
  for(const table of tables)assert.ok(allowed.has(table),'Tabella non censita: '+table);
});
test('nessun codice dell adapter contatta Supabase o incorpora chiavi',()=>{
  assert.doesNotMatch(adapter,/supabase\.co|sb_publishable_|service_role|eyJhbGci/);
  assert.match(adapter,/credentials:'same-origin'/);
});
