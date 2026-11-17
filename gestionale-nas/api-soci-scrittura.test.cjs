'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const register = require('./api-soci-scrittura');
function setup() {
  const routes = new Map(), queries = [];
  const app = {post(path,...handlers){routes.set('POST '+path,handlers)},patch(path,...handlers){routes.set('PATCH '+path,handlers)}};
  const pool = {async query(sql,values){queries.push({sql,values});return {rowCount:1,rows:[{id:'test',...Object.fromEntries((values||[]).map((v,i)=>[i,v]))}]}}};
  const guard = (_req,_res,next)=>next();
  register({app,pool,richiediAccesso:guard,richiediCsrf:guard});
  async function call(method,path,body,id) {
    const handlers = routes.get(method+' '+path);
    const res={statusCode:200,status(n){this.statusCode=n;return this},json(data){this.data=data;return this}};
    const req={body,params:{id}};
    for(const handler of handlers) {
      let nextCalled=false;
      await handler(req,res,()=>{nextCalled=true});
      if(!nextCalled) break;
    }
    return res;
  }
  return {call,queries};
}
test('requires both security middlewares',()=>{
  assert.throws(()=>register({app:{},pool:{},richiediAccesso:()=>{}}),/CSRF/);
});
test('rejects unknown fields and SQL injection keys',async()=>{
  const s=setup();
  const r=await s.call('POST','/api/soci',{nome:'Ada',cognome:'Rossi','nome;DROP TABLE soci':'x'});
  assert.equal(r.statusCode,400);assert.equal(s.queries.length,0);
});
test('requires name and surname',async()=>{
  const s=setup();
  const r=await s.call('POST','/api/soci',{nome:'Ada'});
  assert.equal(r.statusCode,400);assert.equal(s.queries.length,0);
});
test('parameterizes user input and creates member',async()=>{
  const s=setup();
  const r=await s.call('POST','/api/soci',{nome:"O'Neil",cognome:'Rossi',stato:'attivo'});
  assert.equal(r.statusCode,201);
  assert.match(s.queries[0].sql,/VALUES \(\$1,\$2,\$3\)/);
  assert.equal(s.queries[0].values[0],"O'Neil");
  assert.ok(!s.queries[0].sql.includes("O'Neil"));
});
test('rejects invalid state and invalid dates',async()=>{
  const s=setup();
  assert.equal((await s.call('POST','/api/soci',{nome:'A',cognome:'B',stato:'ignoto'})).statusCode,400);
  assert.equal((await s.call('POST','/api/soci',{nome:'A',cognome:'B',data_nascita:'2026-02-30'})).statusCode,400);
  assert.equal(s.queries.length,0);
});
test('rejects invalid UUID and empty patch',async()=>{
  const s=setup();
  assert.equal((await s.call('PATCH','/api/soci/:id',{nome:'A'},'invalid')).statusCode,400);
  assert.equal((await s.call('PATCH','/api/soci/:id',{},'550e8400-e29b-41d4-a716-446655440000')).statusCode,400);
  assert.equal(s.queries.length,0);
});
test('patch uses parameters and updates timestamp',async()=>{
  const s=setup();
  const id='550e8400-e29b-41d4-a716-446655440000';
  const r=await s.call('PATCH','/api/soci/:id',{telefono:'123'},id);
  assert.equal(r.statusCode,200);
  assert.match(s.queries[0].sql,/updated_at = NOW\(\)/);
  assert.deepEqual(s.queries[0].values,['123',id]);
});
