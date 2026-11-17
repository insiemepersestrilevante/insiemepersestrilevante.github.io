'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const register=require('./api-originale-lettura.js');
function setup(pool){
 const routes={};
 const app={get(path,...handlers){routes[path]=handlers}};
 const auth=(req,res,next)=>next();
 register({app,pool,richiediAccesso:auth});
 const run=routes['/api/originale/lettura/:table'].at(-1);
 return run;
}
function response(){
 let status=200,body=null;
 return {res:{status(n){status=n;return this},set(){return this},json(v){body=v;return this}},read:()=>({status,body})};
}
test('nega tabella non autorizzata prima di interrogare PostgreSQL',async()=>{
 const run=setup({query(){throw Error('Query non prevista')}});
 const r=response();
 await run({params:{table:'session'}},r.res);
 assert.equal(r.read().status,404);
});
test('restituisce dati senza filtri SQL provenienti dal browser',async()=>{
 let sql;
 const run=setup({async query(q){sql=q;return {rows:[{id:'s1'}]}}});
 const r=response();
 await run({params:{table:'soci'},query:{sort:'DROP TABLE soci'}},r.res);
 assert.equal(sql,'SELECT * FROM "soci" LIMIT 10001');
 assert.deepEqual(r.read().body,[{id:'s1'}]);
});
test('non tronca silenziosamente risultati oltre la soglia',async()=>{
 const run=setup({async query(){return {rows:Array.from({length:10001},()=>({}))}}});
 const r=response();
 await run({params:{table:'soci'}},r.res);
 assert.equal(r.read().status,409);
});
test('rifiuta attivazione senza middleware di autenticazione',()=>{
 assert.throws(()=>register({app:{},pool:{}}),/autenticato/);
});
