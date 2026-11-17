/* Adapter sperimentale per la COPIA del gestionale originale.
 * NON distribuire: lettura soltanto, non ancora parità funzionale con Supabase.
 * Nessun accesso al progetto Supabase; nessuna credenziale incorporata.
 */
(() => {
'use strict';
const ADMIN='084247bb-729d-494e-a26a-e003520e0932';
const EMAIL='gioinsa@inwind.it';
const tables=new Set(['soci','annualita','categorie_movimenti','verbali','iscrizioni','pagamenti','documenti','movimenti','ricevute']);
const forbidden=()=>({data:null,error:{message:'Funzione non ancora migrata sul NAS: operazione bloccata per sicurezza'}});
const currentUser={id:ADMIN,email:EMAIL};
let authenticated=false;
const subscribers=new Set();
async function request(path,options={}) {
  const response=await fetch(path,{...options,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(options.headers||{})}});
  const data=await response.json();
  if(!response.ok)throw Error(data.errore||'HTTP '+response.status);
  return data;
}
function notify(event,session){for(const fn of subscribers)try{fn(event,session)}catch(e){console.error(e)}}
function query(table){
  const filters=[],orders=[];
  let columns='*',offset=0,maximum=Infinity,one=false,optional=false,head=false,wantCount=false;
  const builder={
    select(c='*',opts={}){columns=c;head=opts.head===true;wantCount=opts.count==='exact';return builder},
    eq(k,v){filters.push(r=>String(r[k]??'')===String(v??''));return builder},
    not(k,op,v){if(op!=='is'||v!==null)throw Error('Filtro NAS non supportato');filters.push(r=>r[k]!==null&&r[k]!==undefined);return builder},
    order(k,opts={}){orders.push({k,asc:opts.ascending!==false});return builder},
    limit(n){maximum=Math.min(maximum,n);return builder},
    range(a,b){offset=a;maximum=b-a+1;return builder},
    single(){one=true;return builder},
    maybeSingle(){one=true;optional=true;return builder},
    then(resolve,reject){return execute().then(resolve,reject)},
    catch(fn){return execute().catch(fn)}
  };
  async function execute(){
    try{
      if(!tables.has(table))throw Error('Tabella NAS non autorizzata');
      let rows=await request('/api/'+encodeURIComponent(table));
      if(!Array.isArray(rows))throw Error('Formato API NAS inatteso');
      rows=rows.filter(r=>filters.every(fn=>fn(r)));
      for(let i=orders.length-1;i>=0;i--){const {k,asc}=orders[i];rows.sort((a,b)=>{const av=a[k],bv=b[k];return (av==null?bv==null?0:-1:bv==null?1:String(av).localeCompare(String(bv),'it',{numeric:true}))*(asc?1:-1)})}
      const count=rows.length;
      rows=rows.slice(offset,Number.isFinite(maximum)?offset+maximum:undefined);
      if(columns!=='*'){const fields=columns.split(',').map(x=>x.trim());if(fields.some(x=>!/^[a-z_][a-z_0-9]*$/i.test(x)))throw Error('Selezione campi non supportata');rows=rows.map(r=>Object.fromEntries(fields.map(k=>[k,r[k]??null])))}
      if(one){if(rows.length>1)throw Error('Più risultati per single()');if(!rows.length&&!optional)throw Error('Nessun risultato');return {data:rows[0]||null,error:null,count:wantCount?count:null}}
      return {data:head?null:rows,error:null,count:wantCount?count:null};
    }catch(e){return {data:null,error:{message:e.message},count:null}}
  }
  // Mantiene la sintassi Supabase anche quando la scrittura non è ancora disponibile:
  // un errore esplicito è più sicuro di un TypeError o di un successo simulato.
  for(const method of ['insert','update','upsert','delete'])builder[method]=()=>{
    const blocked={
      select(){return blocked},
      eq(){return blocked},
      order(){return blocked},
      limit(){return blocked},
      single(){return blocked},
      maybeSingle(){return blocked},
      then(resolve,reject){return Promise.resolve(forbidden()).then(resolve,reject)},
      catch(fn){return Promise.resolve(forbidden()).catch(fn)}
    };
    return blocked;
  };
  return builder;
}
const auth={
  async signInWithPassword({password}){
    try{
      await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      authenticated=true;
      const session={user:currentUser};notify('SIGNED_IN',session);
      return {data:{session},error:null};
    }catch(e){return {data:{session:null},error:{message:e.message}}}
  },
  async getSession(){
    try{const result=await request('/api/sessione');authenticated=result.autenticato===true;return {data:{session:authenticated?{user:currentUser}:null},error:null}}
    catch(e){authenticated=false;return {data:{session:null},error:{message:e.message}}}
  },
  async signOut(){
    try{
      const token=await request('/api/csrf');
      await request('/api/logout',{method:'POST',headers:{'X-CSRF-Token':token.csrfToken}});
      authenticated=false;notify('SIGNED_OUT',null);return {error:null}
    }catch(e){return {error:{message:e.message}}}
  },
  onAuthStateChange(fn){subscribers.add(fn);return {data:{subscription:{unsubscribe(){subscribers.delete(fn)}}}}}
};
const unavailable=()=>({upload:async()=>forbidden(),remove:async()=>forbidden(),info:async()=>forbidden(),createSignedUrl:async()=>forbidden()});
window.gestionaleNasCompat=Object.freeze({auth,from:query,storage:{from:unavailable},functions:{invoke:async()=>forbidden()}});
})();
