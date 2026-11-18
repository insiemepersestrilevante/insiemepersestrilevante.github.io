'use strict';
// Compatibilità letture Supabase: API JSON in sola lettura, tabelle consentite.
// Il client applica filtri e ordinamenti; nessun nome tabella esterno all'allowlist.
const allowed=new Set(['annualita','iscrizioni','pagamenti','verbali','documenti','movimenti','categorie_movimenti','ricevute']);
module.exports=function register(app,pool){
 app.get('/api/:table',async(req,res)=>{
  if(req.session?.authenticated!==true)return res.status(401).json({errore:'Accesso non autorizzato'});
  const table=req.params.table;
  if(!allowed.has(table))return res.status(404).json({errore:'Tabella non disponibile'});
  try{
   const result=await pool.query('SELECT * FROM public."'+table+'"');
   return res.json(result.rows);
  }catch(e){return res.status(500).json({errore:'Lettura dati non riuscita'})}
 });
};
