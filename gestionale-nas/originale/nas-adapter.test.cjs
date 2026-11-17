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
  const r=await db.from('pagamenti').insert({importo:100});
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


test('inserimento socio richiede CSRF e restituisce il record NAS',async()=>{
  const {db,calls}=adapter({
    '/api/csrf':{body:{csrfToken:'test-token'}},
    '/api/soci':{status:201,body:{id:'s1',nome:'Anna',cognome:'Rossi'}}
  });
  const result=await db.from('soci').insert({nome:'Anna',cognome:'Rossi'}).select('id').single();
  assert.equal(result.error,null);
  assert.equal(result.data.id,'s1');
  assert.equal(calls[1].options.method,'POST');
  assert.equal(calls[1].options.headers['X-CSRF-Token'],'test-token');
});
test('modifica socio invia PATCH soltanto con id e CSRF',async()=>{
  const {db,calls}=adapter({
    '/api/csrf':{body:{csrfToken:'token'}},
    '/api/soci/s1':{body:{id:'s1',nome:'Nuovo'}}
  });
  const result=await db.from('soci').update({nome:'Nuovo'}).eq('id','s1').select('*').single();
  assert.equal(result.error,null);
  assert.equal(result.data.nome,'Nuovo');
  assert.equal(calls[1].options.method,'PATCH');
});
test('scritture diverse dai soci, eliminazione e update senza id restano bloccati',async()=>{
  const {db,calls}=adapter({});
  const operations=[
    db.from('pagamenti').insert({importo:1}).select('id').single(),
    db.from('soci').delete().eq('id','s1'),
    db.from('soci').upsert({id:'s1'}).select('*').maybeSingle(),
    db.from('soci').update({nome:'A'}).eq('nome','A')
  ];
  for(const operation of operations){
    const result=await operation;
    assert.ok(result.error);
  }
  assert.equal(calls.length,0);
});

test('altre tabelle rimangono bloccate anche se la route NAS è predisposta',async()=>{
  const {db,calls}=adapter({});
  const result=await db.from('annualita').insert({anno:2027});
  assert.ok(result.error);
  assert.equal(calls.length,0);
});

test('login con email differente non raggiunge il NAS',async()=>{
  const {db,calls}=adapter({});
  const result=await db.auth.signInWithPassword({email:'non-autorizzato@example.org',password:'test'});
  assert.ok(result.error);
  assert.equal(calls.length,0);
});
