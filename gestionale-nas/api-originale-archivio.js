'use strict';
// Archivio NAS privato. Modulo NON attivo fino a configurazione NAS e collaudo.
// I file non sono mai serviti da express.static; download solo con sessione.
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const ALLOWED=new Set(['.pdf','.jpg','.jpeg','.png','.webp','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt']);
const MAX=20*1024*1024;
function safePath(value){
  if(typeof value!=='string'||value.length>240||!value.length||value.includes('\\')||value.includes('%')||value.includes('\0'))throw Error('Percorso non valido');
  const parts=value.split('/');
  if(parts.length!==2||parts.some(x=>!x||x==='.'||x==='..'||!/^[a-zA-Z0-9._-]+$/.test(x)))throw Error('Percorso non valido');
  if(!/^[0-9a-f-]{36}$/i.test(parts[0])||!/^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i.test(parts[1]))throw Error('Nome file non valido');
  if(!ALLOWED.has(path.extname(parts[1]).toLowerCase()))throw Error('Estensione non consentita');
  return parts;
}
function rootPath(root,relative){return path.join(root,...safePath(relative))}
module.exports=function register({app,richiediAccesso,richiediCsrf,root}){
  if(!app||typeof richiediAccesso!=='function'||typeof richiediCsrf!=='function'||!path.isAbsolute(root||''))throw Error('Configurazione archivio incompleta');
  const guards=[richiediAccesso,richiediCsrf];
  const raw=require('express').raw({type:'application/octet-stream',limit:MAX});
  app.put('/api/originale/files/*',...guards,raw,async(req,res)=>{
    try{
      const rel=decodeURIComponent(req.params[0]);
      const parts=safePath(rel);
      if(!Buffer.isBuffer(req.body)||!req.body.length||req.body.length>MAX)return res.status(400).json({errore:'File vuoto o troppo grande'});
      await fs.mkdir(path.join(root,parts[0]),{recursive:true,mode:0o700});
      const file=rootPath(root,rel);
      await fs.writeFile(file,req.body,{flag:'wx',mode:0o600});
      return res.status(201).json({path:rel});
    }catch(e){
      if(e.code==='EEXIST')return res.status(409).json({errore:'File già presente'});
      if(e.message?.includes('non valido')||e.message?.includes('non consentita'))return res.status(400).json({errore:e.message});
      return res.status(500).json({errore:'Caricamento non riuscito'});
    }
  });
  app.get('/api/originale/files/*',richiediAccesso,async(req,res)=>{
    try{
      const file=rootPath(root,decodeURIComponent(req.params[0]));
      const stat=await fs.lstat(file);
      if(!stat.isFile()||stat.size>MAX)return res.status(404).end();
      res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'attachment; filename="'+path.basename(file)+'"','Content-Type':'application/octet-stream'});
      return res.sendFile(file);
    }catch(e){return res.status(404).json({errore:'File non trovato'})}
  });
  app.delete('/api/originale/files/*',...guards,async(req,res)=>{
    try{
      const file=rootPath(root,decodeURIComponent(req.params[0]));
      const stat=await fs.lstat(file);
      if(!stat.isFile())return res.status(404).json({errore:'File non trovato'});
      await fs.unlink(file);
      return res.json({removed:true});
    }catch(e){return res.status(404).json({errore:'File non trovato'})}
  });
};
module.exports.safePath=safePath;
module.exports.MAX=MAX;
