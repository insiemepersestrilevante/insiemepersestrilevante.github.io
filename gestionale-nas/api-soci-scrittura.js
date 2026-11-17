'use strict';
// Modulo sperimentale: NON attivare sul NAS senza protezione CSRF e collaudo.
// Contratto: require('./api-soci-scrittura')({app, pool, richiediAccesso, richiediCsrf}).
// richiediCsrf DEVE rifiutare richieste prive di token valido e origine autorizzata.
const editable = ['codice_socio','nome','cognome','codice_fiscale','data_nascita','luogo_nascita','indirizzo','cap','comune','provincia','telefono','email','data_iscrizione','stato','note'];
const allowed = new Set(editable);
const states = new Set(['attivo','sospeso','cessato']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dates = new Set(['data_nascita','data_iscrizione']);
function parse(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dati non validi');
  const keys = Object.keys(body);
  if (!keys.length || keys.some(k => !allowed.has(k))) throw new Error('Campi non consentiti');
  const data = {};
  for (const k of keys) {
    let v = body[k];
    if (v !== null && typeof v !== 'string') throw new Error('Formato non valido: ' + k);
    if (typeof v === 'string') {
      v = v.trim();
      if (v.length > 5000) throw new Error('Campo troppo lungo: ' + k);
      if (dates.has(k) && v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v)) throw new Error('Data non valida: ' + k);
      if (v === '') v = null;
    }
    if (k === 'stato' && !states.has(v)) throw new Error('Stato non valido');
    if ((k === 'nome' || k === 'cognome') && !v) throw new Error('Nome e cognome obbligatori');
    data[k] = v;
  }
  if (!partial && (!data.nome || !data.cognome)) throw new Error('Nome e cognome obbligatori');
  return data;
}
module.exports = function register({app, pool, richiediAccesso, richiediCsrf}) {
  if (!app || !pool || typeof richiediAccesso !== 'function' || typeof richiediCsrf !== 'function') {
    throw new Error('Middleware di autenticazione e CSRF obbligatori');
  }
  const guards = [richiediAccesso, richiediCsrf];
  app.post('/api/soci', ...guards, async (req,res) => {
    let data;
    try { data = parse(req.body); } catch(e) { return res.status(400).json({errore:e.message}); }
    const keys = Object.keys(data);
    try {
      const sql = 'INSERT INTO soci (' + keys.map(k=>'"'+k+'"').join(',') + ') VALUES (' + keys.map((_,i)=>'$'+(i+1)).join(',') + ') RETURNING *';
      const result = await pool.query(sql, keys.map(k=>data[k]));
      return res.status(201).json(result.rows[0]);
    } catch(e) {
      if (e.code === '23505') return res.status(409).json({errore:'Codice socio già presente'});
      return res.status(500).json({errore:'Impossibile inserire il socio'});
    }
  });
  app.patch('/api/soci/:id', ...guards, async (req,res) => {
    if (!uuid.test(req.params.id)) return res.status(400).json({errore:'ID non valido'});
    let data;
    try { data = parse(req.body, true); } catch(e) { return res.status(400).json({errore:e.message}); }
    const keys = Object.keys(data);
    const values = keys.map(k=>data[k]);
    const set = keys.map((k,i)=>'"'+k+'" = $'+(i+1)).join(', ');
    try {
      const result = await pool.query('UPDATE soci SET '+set+', updated_at = NOW() WHERE id = $'+(keys.length+1)+' RETURNING *', [...values,req.params.id]);
      if (!result.rowCount) return res.status(404).json({errore:'Socio non trovato'});
      return res.json(result.rows[0]);
    } catch(e) {
      if (e.code === '23505') return res.status(409).json({errore:'Codice socio già presente'});
      if (e.code === '23514' || e.code === '23502') return res.status(400).json({errore:'Dati non validi'});
      return res.status(500).json({errore:'Impossibile modificare il socio'});
    }
  });
};
