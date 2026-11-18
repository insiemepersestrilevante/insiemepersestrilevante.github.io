'use strict';
// Riproduzione NAS della Edge Function Supabase send-reminder.
// Non inserire il segreto Apps Script nel repository o nel browser.
const URL='https://script.google.com/macros/s/AKfycbxbTdXmct6IGY_TmqHwW2tpnptmHRw8N2RPQ5OmUnUKkD-ZH1E18nWsurghEAyWlnVHtw/exec';
const email=/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
module.exports=function register({app,richiediAccesso,richiediCsrf}){
 app.post('/api/originale/send-reminder',richiediAccesso,richiediCsrf,async(req,res)=>{
  const b=req.body||{};
  const to=String(b.to||'').trim(),subject=String(b.subject||'').trim(),message=String(b.message||'').trim();
  if(!email.test(to))return res.status(400).json({error:'Indirizzo email non valido'});
  if(!subject||subject.length>200||/[\r\n]/.test(subject)||!message||message.length>10000)
   return res.status(400).json({error:'Oggetto o messaggio non valido'});
  const secret=process.env.APPS_SCRIPT_REMINDER_SECRET;
  if(!secret)return res.status(503).json({error:'Configurazione invio incompleta'});
  // Fase di sola verifica prima della conferma: non si invia alcuna email.
  const send=b.send===true;
  try{
   const response=await fetch(URL,{method:'POST',redirect:'follow',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'send_reminder',secret,to,subject,message,send}),
    signal:AbortSignal.timeout(20000)});
   const raw=await response.text();let result;
   try{result=JSON.parse(raw)}catch{return res.status(502).json({error:'Risposta non valida dal servizio email'})}
   if(!response.ok||result.result==='error')
    return res.status(502).json({error:String(result.error||'Invio non riuscito')});
   if(!send&&result.result!=='validated')return res.status(502).json({error:'Verifica non confermata dal servizio email'});
   if(send&&(result.result!=='success'||result.sent!==true))
    return res.status(502).json({error:'Invio non confermato dal servizio email'});
   return res.json(result);
  }catch(e){console.error('Servizio solleciti non disponibile:',e.message);
   return res.status(502).json({error:'Servizio email temporaneamente non disponibile'})}
 });
};
