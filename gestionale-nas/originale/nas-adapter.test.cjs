'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');
const {join}=require('node:path');
const source=readFileSync(join(__dirname,'nas-adapter.js'),'utf8');
function adapter(responses){
  const calls=[];
  const window={};
  const fetch=async(path,options)=>{
    calls.push({path,options});
    const reply=responses[path]||{status:404,body:{errore:'Non trovato'}};
    return {ok:(reply.status||200)<400,status:reply.status||200,json:async()=>reply.body};
  };
  runInNewContext(source,{window,fetch,console});
  return {db:window.gestionaleNasCompat,calls};
}
test('l adapter legge, filtra, ordina, pagina e proietta i soci dal NAS',async()=>{
  const {db,calls}=adapter({'/api/soci':{body:[{id:'a',nome:'Anna',cognome:'Rossi'},{id:'b',nome:'Bruno',cognome:'Verdi'},{id:'c',nome:'Alba',cognome:'Rossi'}]}});
  const r=await db.from('soci').select('nome,cognome').eq('cognome','Rossi').order('nome',{ascending:false}).range(0,0);
  assert.equal(r.error,null);
  assert.equal(r.data.length,1);
  assert.equal(r.data[0].nome,'Anna');
  assert.deepEqual(Object.keys(r.data[0]),['nome','cognome']);
  assert.equal(calls[0].options.credentials,'same-origin');
});
test('non fa chiamate Supabase e blocca scritture non migrate',async()=>{
  const {db,calls}=adapter({});
  const r=await db.from('soci').insert({nome:'Prova'});
  assert.ok(r.error);
  const f=await db.functions.invoke('send-reminder',{});
  assert.ok(f.error);
  assert.equal(calls.length,0);
});
test('sessione NAS e uscita non simulano successo se server rifiuta',async()=>{
  const {db}=adapter({'/api/sessione':{status:401,body:{autenticato:false}},'/api/csrf':{status:401,body:{errore:'Non autorizzato'}}});
  const r=await db.auth.getSession();
  assert.equal(r.data.session,null);
  const logout=await db.auth.signOut();
  assert.ok(logout.error);
});
