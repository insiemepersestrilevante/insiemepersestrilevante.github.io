'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const register=require('./api-originale-scrittura.js');
const cols=[
 {name:'id',generated:false,identity:false},
 {name:'created_at',generated:false,identity:false},
 {name:'nome',generated:false,identity:false},
 {name:'importo',generated:false,identity:false},
 {name:'numero',generated:true,identity:false}
];
test('rifiuta campi non presenti nello schema e campi gestiti dal database',()=>{
 for(const body of [{id:'x'},{created_at:'2026-01-01'},{numero:1},{'nome";DROP TABLE soci;--':'x'},{}]){
  assert.throws(()=>register.validateBody(body,cols));
 }
});
test('accetta campi autorizzati, null, numeri e booleani',()=>{
 assert.deepEqual(register.validateBody({nome:'test',importo:25.5},cols),['nome','importo']);
 assert.deepEqual(register.validateBody({nome:null},cols),['nome']);
 assert.throws(()=>register.validateBody({nome:{a:1}},cols));
 assert.throws(()=>register.validateBody({importo:Infinity},cols));
});
test('rifiuta installazione senza autenticazione e CSRF',()=>{
 assert.throws(()=>register({app:{},pool:{}}),/Protezioni obbligatorie/);
});
test('route di inserimento verifica tabella e non esegue query per tabella estranea',async()=>{
 const handlers={};
 const app={post(path,...fns){handlers[path]=fns},patch(path,...fns){handlers[path]=fns}};
 const pool={query(){throw Error('Query non prevista')}};
 const next=(req,res,go)=>go();
 register({app,pool,richiediAccesso:next,richiediCsrf:next});
 const route=handlers['/api/originale/:table'].at(-1);
 let status=200,payload;
 const res={status(n){status=n;return this},json(v){payload=v;return this}};
 await route({params:{table:'utenti'},body:{nome:'test'}},res);
 assert.equal(status,404);
 assert.match(payload.errore,/non consentita/);
});

test('ricevute: blocca inserimento se mancano i trigger contabili',async()=>{
 const routes={};
 const app={post(p,...h){routes[p]=h},patch(p,...h){routes[p]=h}};
 const pool={async query(sql){
   assert.match(sql,/pg_trigger/);
   return {rows:[]};
 }};
 const guard=(req,res,next)=>next();
 register({app,pool,richiediAccesso:guard,richiediCsrf:guard});
 const handler=routes['/api/originale/:table'].at(-1);
 let status=200,payload;
 const res={status(n){status=n;return this},json(data){payload=data;return this}};
 await handler({params:{table:'ricevute'},body:{pagamento_id:'00000000-0000-4000-8000-000000000000'}},res);
 assert.equal(status,503);
 assert.match(payload.errore,/trigger/);
});
