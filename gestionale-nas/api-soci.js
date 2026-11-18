'use strict';
// Lettura soci per adapter NAS; la sessione è obbligatoria.
module.exports=function register(app,pool){
 app.get('/api/soci',async(req,res)=>{
  if(req.session?.authenticated!==true)return res.status(401).json({errore:'Accesso non autorizzato'});
  try{
   const result=await pool.query('SELECT * FROM public.soci');
   return res.json(result.rows);
  }catch(e){return res.status(500).json({errore:'Lettura soci non riuscita'})}
 });
};
