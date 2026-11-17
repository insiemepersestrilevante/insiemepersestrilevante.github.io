'use strict';
// Lettura indipendente dalle API di anteprima, destinata alla copia originale.
// Nessun parametro SQL arriva direttamente dal browser.
const TABLES=new Set(['soci','annualita','iscrizioni','pagamenti','verbali','documenti','movimenti','categorie_movimenti','ricevute']);
module.exports=function register({app,pool,richiediAccesso}){
  if(!app||!pool||typeof richiediAccesso!=='function')throw Error('Accesso autenticato obbligatorio');
  app.get('/api/originale/lettura/:table',richiediAccesso,async(req,res)=>{
    const table=req.params.table;
    if(!TABLES.has(table))return res.status(404).json({errore:'Tabella non autorizzata'});
    try{
      // Le query e i filtri della UI sono applicati dall'adapter; il limite
      // evita risposte smisurate e impedisce troncamenti silenziosi.
      const result=await pool.query('SELECT * FROM "'+table+'" LIMIT 10001');
      if(result.rows.length>10000)return res.status(409).json({errore:'Troppi record: migrare a paginazione server prima di procedere'});
      res.set('Cache-Control','no-store');
      return res.json(result.rows);
    }catch(e){return res.status(500).json({errore:'Lettura tabella non riuscita'})}
  });
};
