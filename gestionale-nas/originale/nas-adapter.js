/* Adapter sperimentale per la COPIA del gestionale originale.
 * NON distribuire: parità funzionale con Supabase ancora incompleta.
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
      const endpoint=window.NAS_ORIGINALE_LETTURA_VERIFICATA===true?'/api/originale/lettura/':'/api/';
      let rows=await request(endpoint+encodeURIComponent(table));
      if(!Array.isArray(rows))throw Error('Formato API NAS inatteso');
      // PostgreSQL serializza le colonne DATE come timestamp ISO; Supabase le restituiva YYYY-MM-DD.
      // Normalizziamo solo le date senza orario, prima dei filtri e della visualizzazione.
      rows=rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[
        key,typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)?value.slice(0,10):value
      ])));
      rows=rows.filter(r=>filters.every(fn=>fn(r)));
      for(let i=orders.length-1;i>=0;i--){const {k,asc}=orders[i];rows.sort((a,b)=>{const av=a[k],bv=b[k];return (av==null?bv==null?0:-1:bv==null?1:String(av).localeCompare(String(bv),'it',{numeric:true}))*(asc?1:-1)})}
      const count=rows.length;
      rows=rows.slice(offset,Number.isFinite(maximum)?offset+maximum:undefined);
      if(columns!=='*'){const fields=columns.split(',').map(x=>x.trim());if(fields.some(x=>!/^[a-z_][a-z_0-9]*$/i.test(x)))throw Error('Selezione campi non supportata');rows=rows.map(r=>Object.fromEntries(fields.map(k=>[k,r[k]??null])))}
      if(one){if(rows.length>1)throw Error('Più risultati per single()');if(!rows.length&&!optional)throw Error('Nessun risultato');return {data:rows[0]||null,error:null,count:wantCount?count:null}}
      return {data:head?null:rows,error:null,count:wantCount?count:null};
    }catch(e){return {data:null,error:{message:e.message},count:null}}
  }
  // Le scritture sono abilitate solo per i soci. Le altre tabelle richiedono
  // un consenso esplicito lato client E lato server, dopo verifica dello schema NAS.
  for(const method of ['insert','update','upsert','delete'])builder[method]=(payload)=>{
    let id=null,returnRows=false,returnOne=false;
    const write={
      select(){returnRows=true;return write},
      eq(field,value){if(field==='id')id=value;else id=null;return write},
      single(){returnOne=true;return write},
      maybeSingle(){returnOne=true;return write},
      then(resolve,reject){return executeWrite().then(resolve,reject)},
      catch(fn){return executeWrite().catch(fn)}
    };
    async function executeWrite(){
      if(!['insert','update','delete'].includes(method))return forbidden();
      if(method==='delete'&&(table==='ricevute'||table==='soci'))return forbidden();
      if(table!=='soci'&&window.NAS_ORIGINALE_SCRITTURE_VERIFICATE!==true)return forbidden();
      try{
        if(method==='insert'&&Array.isArray(payload))throw Error('Inserimento multiplo non supportato');
        if((method==='update'||method==='delete')&&!id)throw Error('ID record obbligatorio');
        const {csrfToken}=await request('/api/csrf');
        if(!csrfToken)throw Error('Token CSRF assente');
        const base=table==='soci'?'/api/soci':'/api/originale/'+encodeURIComponent(table);
        const path=method==='insert'?base:base+'/'+encodeURIComponent(id);
        const data=await request(path,{
          method:method==='insert'?'POST':method==='update'?'PATCH':'DELETE',
          headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},
          ...(method==='delete'?{}:{body:JSON.stringify(payload)})
        });
        return {data:returnRows?(returnOne?data:[data]):null,error:null};
      }catch(e){return {data:null,error:{message:e.message}}}
    }
    return write;
  };
  return builder;
}
const auth={
  async signInWithPassword({email,password}){
    if(typeof email!=='string'||email.trim().toLowerCase()!==EMAIL)return {data:{session:null},error:{message:'Credenziali non valide'}};
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
const filePath=p=>'/api/originale/files/'+p.split('/').map(encodeURIComponent).join('/');
function storage(bucket){
  const enabled=()=>bucket==='archivio-associazione'&&window.NAS_ORIGINALE_ARCHIVIO_VERIFICATO===true;
  return {
    async upload(p,file,opts={}){
      if(!enabled()||opts.upsert===true)return forbidden();
      try{
        const {csrfToken}=await request('/api/csrf');
        const result=await request(filePath(p),{method:'PUT',headers:{'Content-Type':'application/octet-stream','X-CSRF-Token':csrfToken},body:file});
        return {data:result,error:null};
      }catch(e){return {data:null,error:{message:e.message}}}
    },
    async remove(paths){
      if(!enabled()||!Array.isArray(paths)||paths.length!==1)return forbidden();
      try{
        const {csrfToken}=await request('/api/csrf');
        const result=await request(filePath(paths[0]),{method:'DELETE',headers:{'X-CSRF-Token':csrfToken}});
        return {data:result,error:null};
      }catch(e){return {data:null,error:{message:e.message}}}
    },
    async info(p){
      if(!enabled())return forbidden();
      try{
        const response=await fetch(filePath(p),{method:'HEAD',credentials:'same-origin',cache:'no-store'});
        if(!response.ok)throw Error('File non trovato (HTTP '+response.status+')');
        return {data:{name:p.split('/').at(-1)},error:null};
      }catch(e){return {data:null,error:{message:e.message}}}
    },
    async createSignedUrl(p){
      if(!enabled())return forbidden();
      try{
        // URL a sessione NAS, NON link firmato condivisibile: accessibile solo dopo login.
        const url=filePath(p);
        return {data:{signedUrl:url},error:null};
      }catch(e){return {data:null,error:{message:e.message}}}
    }
  };
}
window.gestionaleNasCompat=Object.freeze({auth,from:query,storage:{from:storage},functions:{invoke:async()=>forbidden()}});
})();
