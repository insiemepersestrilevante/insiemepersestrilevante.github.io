'use strict';
// Diagnostica ricevute esclusivamente in lettura: non inserisce né modifica dati.
const {Pool}=require('pg');
const names=['assegna_numero_ricevuta','blocca_modifica_numero_ricevuta','collega_ricevuta_movimento','impedisci_eliminazione_ricevuta'];
(async()=>{
 const pool=new Pool({connectionTimeoutMillis:5000});
 try{
  const f=await pool.query("SELECT proname,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname=ANY($1)",[names]);
  for(const name of names){
   const row=f.rows.find(x=>x.proname===name);
   console.log((row?'OK ':'NO ')+name);
   if(row)console.log(row.definition);
  }
  const seq=await pool.query("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='private' AND table_name='ricevute_progressivi') AS presente");
  console.log('Tabella progressivi:',seq.rows[0].presente?'presente':'assente');
 }finally{await pool.end()}
})().catch(e=>{console.error('Diagnostica non riuscita:',e.message);process.exitCode=1});
