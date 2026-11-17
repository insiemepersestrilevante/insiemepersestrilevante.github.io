#!/usr/bin/env node
'use strict';
// Verifica locale e non distruttiva del backend NAS.
// Eseguire dentro server-gestionale: node /node/app/verifica-api-nas.cjs
// Nessuna password richiesta, nessuna scrittura nel database.
const http = require('node:http');
const ports = [3002, 3001];
const paths = ['/api/sessione','/api/soci','/api/annualita','/api/categorie_movimenti','/api/verbali','/api/iscrizioni','/api/pagamenti','/api/documenti','/api/movimenti','/api/ricevute'];
function check(port, path) {
  return new Promise(resolve => {
    const req = http.get({hostname:'127.0.0.1',port,path,timeout:3000},res=>{
      let body=''; res.setEncoding('utf8');
      res.on('data',chunk=>{ if(body.length<500) body+=chunk; });
      res.on('end',()=>resolve({port,path,status:res.statusCode,type:res.headers['content-type']||'',body}));
    });
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    req.on('error',err=>resolve({port,path,error:err.code||err.message}));
  });
}
(async()=>{
  let selected;
  for(const port of ports){
    const result=await check(port,'/api/sessione');
    if(result.status===401 && result.type.includes('application/json')) {selected=port;break;}
  }
  if(!selected){ console.error('Nessun server API di prova attivo sulle porte 3002/3001.');process.exitCode=1;return; }
  console.log('Server API trovato sulla porta',selected);
  let failures=0;
  for(const path of paths){
    const r=await check(selected,path);
    const ok=r.status===401 && r.type.includes('application/json');
    console.log(ok?'OK  ':'FAIL',path,'HTTP',r.status||r.error);
    if(!ok) failures++;
  }
  console.log(failures?'Verifica non superata: '+failures+' errori':'Verifica completata: tutti gli endpoint richiedono autenticazione.');
  if(failures) process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1;});
