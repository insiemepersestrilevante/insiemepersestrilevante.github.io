'use strict';
// Protezioni per le API NAS. Richiede sessione Express già configurata.
// ORIGIN_HTTPS è un'origine esatta, ad es. https://host.tailnet.ts.net:8443
const crypto = require('node:crypto');
function createSecurity(origin) {
  if (!/^https:\/\/[^/]+$/.test(origin || '')) throw new Error('Origine HTTPS obbligatoria');
  function originGuard(req, res, next) {
    if (req.get('origin') !== origin) return res.status(403).json({errore:'Origine non autorizzata'});
    next();
  }
  function richiediAccesso(req,res,next) {
    if (req.session?.authenticated !== true) return res.status(401).json({errore:'Accesso non autorizzato'});
    next();
  }
  function token(req,res) {
    if (req.session?.authenticated !== true) return res.status(401).json({errore:'Accesso non autorizzato'});
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    req.session.save(err => err ? res.status(500).json({errore:'Errore sessione'}) : res.json({csrfToken:req.session.csrfToken}));
  }
  function richiediCsrf(req,res,next) {
    if (req.get('origin') !== origin) return res.status(403).json({errore:'Origine non autorizzata'});
    const expected=req.session?.csrfToken, actual=req.get('x-csrf-token');
    if (typeof expected !== 'string' || typeof actual !== 'string') return res.status(403).json({errore:'Token CSRF mancante'});
    const a=Buffer.from(expected), b=Buffer.from(actual);
    if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return res.status(403).json({errore:'Token CSRF non valido'});
    next();
  }
  return {originGuard,richiediAccesso,token,richiediCsrf};
}
module.exports={createSecurity};
