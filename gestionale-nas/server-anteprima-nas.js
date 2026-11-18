'use strict';
// Server NAS di sviluppo: attivare solo dopo test e backup verificato.
// Il sito pubblico su main non viene modificato.
const express = require('express');
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const {Pool} = require('pg');
const {rateLimit} = require('express-rate-limit');
const {verificaPassword} = require('./autenticazione.js');
const {createSecurity} = require('./sicurezza-nas.js');

const ORIGIN = 'https://terramaster.tail668e01.ts.net:8443';
if (!process.env.API_SECRET || !process.env.PGPASSWORD) throw new Error('Configurazione riservata mancante');
const app = express();
const pool = new Pool();
const security = createSecurity(ORIGIN);
app.disable('x-powered-by');
app.set('trust proxy', '172.18.0.1');
app.use(express.json({limit:'4kb'}));
app.use(session({
  store:new PgStore({pool,tableName:'session'}),
  secret:process.env.API_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{path:'/',httpOnly:true,secure:true,sameSite:'lax',maxAge:8*60*60*1000}
}));
const loginLimiter = rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false});
app.post('/api/login',security.originGuard,loginLimiter,(req,res)=>{
  const password=req.body?.password;
  if (typeof password !== 'string' || !verificaPassword(password)) return res.status(401).json({errore:'Credenziali non valide'});
  req.session.regenerate(err=>{
    if(err)return res.status(500).json({errore:'Errore creazione sessione'});
    req.session.authenticated=true;
    req.session.save(err=>err?res.status(500).json({errore:'Errore salvataggio sessione'}):res.json({risultato:'ACCESSO OK'}));
  });
});
app.get('/api/sessione',(req,res)=>res.status(req.session?.authenticated?200:401).json({autenticato:req.session?.authenticated===true}));
app.get('/api/csrf',security.richiediAccesso,security.token);
app.post('/api/logout',security.richiediAccesso,security.richiediCsrf,(req,res)=>{
  req.session.destroy(err=>{
    if(err)return res.status(500).json({errore:'Errore uscita'});
    res.clearCookie('connect.sid',{path:'/',httpOnly:true,secure:true,sameSite:'lax'});
    res.json({risultato:'USCITA OK'});
  });
});
if(process.env.NAS_ORIGINALE_SOLLECITI_VERIFICATI==='true') {
  require('./api-originale-solleciti.js')({app,richiediAccesso:security.richiediAccesso,richiediCsrf:security.richiediCsrf});
}
require('./api-soci.js')(app,pool);
require('./api-tabelle.js')(app,pool);
require('./api-soci-scrittura.js')({app,pool,richiediAccesso:security.richiediAccesso,richiediCsrf:security.richiediCsrf});
// Lettura originale separata, inattiva finché non verificata sul NAS.
if(process.env.NAS_ORIGINALE_LETTURA_VERIFICATA==='true') {
  require('./api-originale-lettura.js')({app,pool,richiediAccesso:security.richiediAccesso});
}
// Non attivare finché schema, backup e test CRUD non sono verificati sul NAS.
if(process.env.NAS_ORIGINALE_SCRITTURE_VERIFICATE==='true') {
  require('./api-originale-scrittura.js')({app,pool,richiediAccesso:security.richiediAccesso,richiediCsrf:security.richiediCsrf});
}
// Archivio privato solo con flag server e cartella assoluta dedicata.
if(process.env.NAS_ORIGINALE_ARCHIVIO_VERIFICATO==='true'){
  require('./api-originale-archivio.js')({
    app,
    richiediAccesso:security.richiediAccesso,
    richiediCsrf:security.richiediCsrf,
    root:process.env.NAS_ORIGINALE_ARCHIVIO_ROOT
  });
}
app.use(express.static('/node/app/anteprima-nas'));
app.listen(3003,'0.0.0.0',()=>console.log('Anteprima NAS con protezioni HTTPS e CSRF pronta'));
