'use strict';
// Collaudo offline delle API originali: non richiede NAS, database o credenziali.
// Eseguire dalla cartella gestionale-nas: node test-contratti-nas.js
const assert=require('node:assert/strict');
const {safePath,MAX}=require('./api-originale-archivio');
const {validateBody}=require('./api-originale-scrittura');
let tests=0;
function check(label,fn){fn();tests++;console.log('OK '+label)}
const cols=[{name:'id',generated:false,identity:false},{name:'nome',generated:false,identity:false},{name:'importo',generated:false,identity:false},{name:'created_at',generated:false,identity:false},{name:'numero',generated:true,identity:false}];
check('scrittura campi ammessi',()=>assert.deepEqual(validateBody({nome:'Quota',importo:15},cols),['nome','importo']));
check('id non modificabile',()=>assert.throws(()=>validateBody({id:'abc'},cols),/Campo non consentito/));
check('created_at non modificabile',()=>assert.throws(()=>validateBody({created_at:'2026-01-01'},cols),/Campo non consentito/));
check('colonna generata non modificabile',()=>assert.throws(()=>validateBody({numero:'42'},cols),/Campo non consentito/));
check('campi ignoti bloccati',()=>assert.throws(()=>validateBody({evil:'x'},cols),/Campo non consentito/));
check('payload vuoto bloccato',()=>assert.throws(()=>validateBody({},cols),/Campi non validi/));
check('array bloccato',()=>assert.throws(()=>validateBody([{nome:'x'}],cols),/Dati non validi/));
check('oggetti annidati bloccati',()=>assert.throws(()=>validateBody({nome:{x:1}},cols),/Tipo campo non valido/));
check('numeri non finiti bloccati',()=>assert.throws(()=>validateBody({importo:Infinity},cols),/Numero non valido/));
check('file storico ammesso',()=>assert.deepEqual(safePath('verbale.pdf'),['verbale.pdf']));
const owner='084247bb-729d-494e-a26a-e003520e0932';
const id='084247bb-729d-494e-a26a-e003520e0932';
check('allegato UUID ammesso',()=>assert.equal(safePath(owner+'/'+id+'.pdf').length,2));
check('ricevuta contabile ammessa',()=>assert.equal(safePath(owner+'/ricevute/2026/ledger:'+id+':'+id+'.pdf').length,4));
check('attraversamento percorso bloccato',()=>assert.throws(()=>safePath('../segreti.pdf'),/Percorso non valido/));
check('backslash bloccato',()=>assert.throws(()=>safePath('..\\segreti.pdf'),/Percorso non valido/));
check('estensione eseguibile bloccata',()=>assert.throws(()=>safePath('malware.exe'),/Estensione non consentita/));
check('percent encoding bloccato',()=>assert.throws(()=>safePath('%2e%2e.pdf'),/Percorso non valido/));
check('limite upload 20MB',()=>assert.equal(MAX,20*1024*1024));
console.log('CONTRATTI NAS: '+tests+' verifiche superate (offline; non prova il database)');
