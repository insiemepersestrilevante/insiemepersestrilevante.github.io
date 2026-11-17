'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {safePath,MAX}=require('./api-originale-archivio.js');
const admin='084247bb-729d-494e-a26a-e003520e0932';
const file='6b5b1e52-7b2d-4c69-a40e-6f7681129b3d';
test('ammette percorsi documenti e ricevute originali',()=>{
 assert.deepEqual(safePath(admin+'/'+file+'.pdf'),[admin,file+'.pdf']);
 assert.deepEqual(safePath(admin+'/ricevute/2026/'+file+'.pdf'),[admin,'ricevute','2026',file+'.pdf']);
 assert.deepEqual(safePath(admin+'/ricevute/2026/ledger:'+file+':'+file+'.pdf'),[admin,'ricevute','2026','ledger:'+file+':'+file+'.pdf']);
 assert.deepEqual(safePath('prova-archivio.txt'),['prova-archivio.txt']);
 assert.deepEqual(safePath('2026-10-29T20-25-18-120Z_prova-archivio.txt'),['2026-10-29T20-25-18-120Z_prova-archivio.txt']);
 assert.equal(MAX,20*1024*1024);
});
test('rifiuta attraversamento cartelle, file arbitrari ed estensioni vietate',()=>{
 for(const p of ['../segreti','/etc/passwd',admin+'/../x.pdf',admin+'/file.js',admin+'/ricevute/2026/../../secret.pdf',admin+'/ricevute/abc/'+file+'.pdf',admin+'/'+file+'.exe',admin+'/ricevute/2026/'+file+'.html']){
  assert.throws(()=>safePath(p),p);
 }
});
