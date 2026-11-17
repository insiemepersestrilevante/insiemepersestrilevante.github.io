'use strict';
// Modulo separato e NON attivato: API CRUD delle altre tabelle.
// Prima dell'attivazione verificare schema, permessi, backup e test sul NAS.
const tables = new Set(['annualita','iscrizioni','pagamenti','verbali','documenti','movimenti','categorie_movimenti','ricevute']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identifier = /^[a-z_][a-z0-9_]*$/;
function validateBody(body, columns, partial=false) {
  if (!body || typeof body!=='object' || Array.isArray(body)) throw Error('Dati non validi');
  const keys=Object.keys(body);
  if (!keys.length || keys.length>50) throw Error('Campi non validi');
  const writable=new Set(columns.filter(c=>!c.generated && !c.identity && !['id','created_at','updated_at'].includes(c.name)).map(c=>c.name));
  if (keys.some(k=>!identifier.test(k)||!writable.has(k))) throw Error('Campo non consentito');
  for(const k of keys){
    const value=body[k];
    if(value!==null && typeof value!=='string' && typeof value!=='number' && typeof value!=='boolean')throw Error('Tipo campo non valido');
    if(typeof value==='string'&&value.length>20000)throw Error('Valore troppo lungo');
    if(typeof value==='number'&&!Number.isFinite(value))throw Error('Numero non valido');
  }
  return keys;
}
async function columnsFor(pool,table) {
  const result=await pool.query(
    `SELECT column_name, is_generated, is_identity
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1`,[table]);
  if(!result.rows.length)throw Error('Tabella assente');
  return result.rows.map(r=>({name:r.column_name,generated:r.is_generated!=='NEVER',identity:r.is_identity==='YES'}));
}
module.exports = function register({app,pool,richiediAccesso,richiediCsrf}){
  if(!app||!pool||typeof richiediAccesso!=='function'||typeof richiediCsrf!=='function')throw Error('Protezioni obbligatorie');
  const guards=[richiediAccesso,richiediCsrf];
  app.post('/api/originale/:table',...guards,async(req,res)=>{
    const table=req.params.table;
    if(!tables.has(table))return res.status(404).json({errore:'Tabella non consentita'});
    try{
      const cols=await columnsFor(pool,table);
      const keys=validateBody(req.body,cols);
      const values=keys.map(k=>req.body[k]);
      const quoted=keys.map(k=>'"'+k+'"').join(',');
      const placeholders=keys.map((_,i)=>'$'+(i+1)).join(',');
      const result=await pool.query('INSERT INTO "'+table+'" ('+quoted+') VALUES ('+placeholders+') RETURNING *',values);
      return res.status(201).json(result.rows[0]);
    }catch(e){
      if(e.code==='23505')return res.status(409).json({errore:'Record duplicato'});
      if(['23502','23503','23514','22P02','22007'].includes(e.code))return res.status(400).json({errore:'Dati o riferimenti non validi'});
      if(e.message==='Tabella assente')return res.status(404).json({errore:'Tabella assente'});
      if(/^(Dati|Campi|Campo|Tipo|Valore|Numero)/.test(e.message))return res.status(400).json({errore:e.message});
      return res.status(500).json({errore:'Inserimento non riuscito'});
    }
  });
  app.patch('/api/originale/:table/:id',...guards,async(req,res)=>{
    const {table,id}=req.params;
    if(!tables.has(table)||!uuid.test(id))return res.status(400).json({errore:'Tabella o ID non valido'});
    try{
      const cols=await columnsFor(pool,table);
      const keys=validateBody(req.body,cols,true);
      const values=keys.map(k=>req.body[k]);
      const assignments=keys.map((k,i)=>'"'+k+'"=$'+(i+1)).join(',');
      const result=await pool.query('UPDATE "'+table+'" SET '+assignments+' WHERE id=$'+(keys.length+1)+' RETURNING *',[...values,id]);
      if(!result.rowCount)return res.status(404).json({errore:'Record non trovato'});
      return res.json(result.rows[0]);
    }catch(e){
      if(e.code==='23505')return res.status(409).json({errore:'Record duplicato'});
      if(['23502','23503','23514','22P02','22007'].includes(e.code))return res.status(400).json({errore:'Dati o riferimenti non validi'});
      if(e.message==='Tabella assente')return res.status(404).json({errore:'Tabella assente'});
      if(/^(Dati|Campi|Campo|Tipo|Valore|Numero)/.test(e.message))return res.status(400).json({errore:e.message});
      return res.status(500).json({errore:'Modifica non riuscita'});
    }
  });
};
module.exports.validateBody=validateBody;
