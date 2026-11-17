'use strict';
// Preflight di sola lettura per il database NAS: nessuna modifica ai dati.
// Uso sul NAS: node verifica-schema-originale.js (con PG* già configurati).
const {Pool}=require('pg');
const TABLES=['soci','annualita','iscrizioni','pagamenti','verbali','documenti','movimenti','categorie_movimenti','ricevute'];
const FIELDS={
 soci:['id','nome','cognome','codice_socio','stato'],
 annualita:['id','anno','quota_base','saldo_iniziale_cassa','saldo_iniziale_banca'],
 iscrizioni:['id','socio_id','annualita_id','data_iscrizione','stato','importo_quota'],
 pagamenti:['id','socio_id','annualita_id','data_pagamento','importo','categoria_id'],
 verbali:['id','data_verbale','tipo','oggetto'],
 documenti:['id','titolo','categoria','file_path'],
 movimenti:['id','annualita_id','data_movimento','tipo','descrizione','importo','categoria_id'],
 categorie_movimenti:['id','nome','tipo','codice'],
 ricevute:['id','pagamento_id','numero','stato']
};
async function verify(pool){
  const report={tables:[],ok:true};
  for(const table of TABLES){
    const meta=await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,[table]);
    const columns=new Set(meta.rows.map(r=>r.column_name));
    const missing=FIELDS[table].filter(x=>!columns.has(x));
    let count=null;
    if(columns.size){
      const r=await pool.query('SELECT COUNT(*)::integer AS n FROM "'+table+'"');
      count=r.rows[0].n;
    }
    report.tables.push({table,count,missing,exists:columns.size>0});
    if(!columns.size||missing.length)report.ok=false;
  }
  return report;
}
if(require.main===module){
  const pool=new Pool();
  verify(pool).then(report=>{
    for(const t of report.tables)console.log(t.table+': '+(t.exists?t.count+' record':'ASSENTE')+(t.missing.length?' | colonne mancanti: '+t.missing.join(', '):''));
    console.log(report.ok?'SCHEMA BASE COMPATIBILE':'SCHEMA NON COMPATIBILE: NON ATTIVARE SCRITTURE');
    process.exitCode=report.ok?0:1;
  }).catch(e=>{console.error('Verifica impossibile: '+e.message);process.exitCode=2}).finally(()=>pool.end());
}
module.exports={verify,FIELDS,TABLES};
