'use strict';
// Preflight NAS: solo SELECT sul database e lettura metadati filesystem.
// Non abilita funzionalità, non scrive dati, non cambia l'interfaccia.
const fs=require('node:fs/promises');
const path=require('node:path');
const {Pool}=require('pg');
const REQUIRED=['soci','annualita','iscrizioni','pagamenti','verbali','documenti','movimenti','categorie_movimenti','ricevute'];
const TRIGGERS=['ricevute_collega_movimento','ricevute_no_delete','ricevute_numero_immutabile','ricevute_numero_progressivo'];
async function main(){
 const pool=new Pool({connectionTimeoutMillis:4000});
 let ok=true;
 try{
  const tables=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
  const found=new Set(tables.rows.map(x=>x.table_name));
  for(const name of REQUIRED){const present=found.has(name);console.log((present?'OK ':'NO ')+'tabella '+name);if(!present)ok=false}
  if(found.has('ricevute')){
   const triggers=await pool.query("SELECT tgname, tgenabled FROM pg_trigger WHERE NOT tgisinternal AND tgrelid='public.ricevute'::regclass");
   const existing=new Set(triggers.rows.filter(x=>x.tgenabled==='O'||x.tgenabled==='A').map(x=>x.tgname));
   for(const name of TRIGGERS){const present=existing.has(name);console.log((present?'OK ':'NO ')+'trigger '+name);if(!present)ok=false}
  }
  const root=process.env.NAS_ORIGINALE_ARCHIVIO_ROOT;
  if(!root||!path.isAbsolute(root)){console.log('NO archivio: impostare NAS_ORIGINALE_ARCHIVIO_ROOT assoluta');ok=false}
  else {
   try{
    const stat=await fs.stat(root);
    const present=stat.isDirectory();
    console.log((present?'OK ':'NO ')+'cartella archivio '+root);
    if(!present)ok=false;
   }catch(e){console.log('NO archivio: '+e.code);ok=false}
  }
  console.log(ok?'PRE-FLIGHT SUPERATO: attivazione NON eseguita':'PRE-FLIGHT INCOMPLETO: attivazione NON eseguita');
  if(!ok)process.exitCode=1;
 }finally{await pool.end()}
}
main().catch(e=>{console.error('Preflight non riuscito:',e.message);process.exitCode=1});
