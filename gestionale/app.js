(()=>{'use strict';
const db=window.gestionaleDb,ADMIN='084247bb-729d-494e-a26a-e003520e0932',BUCKET='archivio-associazione',$=id=>document.getElementById(id);
const config={
solleciti:{title:'Solleciti',cols:[]},
soci:{title:'Soci',cols:[['codice_socio','Numero tessera','text'],['nome','Nome','text',1],['cognome','Cognome','text',1],['codice_fiscale','Codice fiscale'],['data_nascita','Data di nascita','date'],['luogo_nascita','Luogo di nascita'],['indirizzo','Indirizzo'],['cap','CAP'],['comune','Comune'],['provincia','Provincia'],['telefono','Telefono'],['email','Email','email'],['data_iscrizione','Data iscrizione','date'],['stato','Stato','select',['attivo','sospeso','cessato']],['note','Note','textarea']]},
annualita:{title:'Annualità',cols:[['anno','Anno','number',1],['data_inizio','Data inizio','date'],['data_fine','Data fine','date'],['quota_base','Quota base (€)','number',1],['saldo_iniziale_cassa','Saldo iniziale cassa (€)','number'],['saldo_iniziale_banca','Saldo iniziale banca (€)','number'],['saldo_finale_cassa','Saldo finale cassa (€)','number'],['saldo_finale_banca','Saldo finale banca (€)','number'],['imposte_gestione','Imposte gestione (€)','number'],['conto_imposte_gestione','Conto imposte gestione','select',['banca','cassa']],['imposte_investimenti','Imposte investimenti (€)','number'],['conto_imposte_investimenti','Conto imposte investimenti','select',['banca','cassa']],['note','Note','textarea']]},
iscrizioni:{title:'Iscrizioni',cols:[['socio_id','Socio','fk:soci',1],['annualita_id','Annualità','fk:annualita',1],['data_iscrizione','Data iscrizione','date'],['stato','Stato','select',['attiva','scaduta','annullata']],['importo_quota','Quota (€)','number',1],['note','Note','textarea']]},
pagamenti:{title:'Pagamenti',cols:[['socio_id','Socio','fk:soci',1],['iscrizione_id','Iscrizione (facoltativa)','fk:iscrizioni'],['annualita_id','Annualità','fk:annualita',1],['data_pagamento','Data pagamento','date'],['importo','Importo (€)','number',1],['metodo','Metodo','select',['contanti','bonifico','carta','assegno','altro']],['categoria_id','Voce rendiconto','fk:categorie_movimenti',1],['conto','Conto','select',['cassa','banca']],['causale','Causale'],['riferimento','Riferimento'],['note','Note','textarea']]},
verbali:{title:'Verbali',cols:[['numero','Numero'],['data_verbale','Data','date',1],['tipo','Tipo','select',['assemblea','direttivo','altro']],['oggetto','Oggetto','text',1],['contenuto','Contenuto','textarea'],['note','Note','textarea']]},
documenti:{title:'Documenti',cols:[['titolo','Titolo','text',1],['categoria','Categoria','text',1],['data_documento','Data documento','date'],['descrizione','Descrizione','textarea'],['socio_id','Socio (facoltativo)','fk:soci'],['verbale_id','Verbale (facoltativo)','fk:verbali'],['__file','Allega file (max 20 MB)','file']]},
movimenti:{title:'Rendiconto',cols:[['data_movimento','Data','date',1],['annualita_id','Annualità','fk:annualita',1],['tipo','Tipo movimento','select',['entrata','uscita','investimento','disinvestimento','finanziamento_ricevuto','rimborso_finanziamento','costo_figurativo','provento_figurativo'],1],['descrizione','Descrizione','text',1],['importo','Importo (€)','number',1],['categoria_id','Voce / codice','fk:categorie_movimenti',1],['conto','Conto','select',['banca','cassa']],['numero_documento','Numero documento'],['tipo_documento','Tipo documento','select',['ricevuta','scontrino','fattura','bonifico','altro']],['nominativo','Nominativo'],['fornitore','Fornitore / ente'],['volontario','Volontario'],['anticipo','Anticipo','select',['false','true']],['rimborso','Rimborso','select',['false','true']],['metodo','Metodo'],['riferimento','Riferimento'],['note','Note','textarea']]},
categorie_movimenti:{title:'Categorie movimenti',cols:[['nome','Nome','text',1],['tipo','Tipo','select',['entrata','uscita'],1],['attiva','Attiva','select',['true','false'],1]]}
};
const state={tab:'soci',rows:[],refs:{},edit:null,rendicontoYear:null,rendicontoRows:[]};
const style=document.createElement('style');style.textContent=`.crud-actions{display:flex;gap:7px;flex-wrap:wrap}.mini{border:1px solid #d8e2da;background:#f5f8f5;color:#174b3b;border-radius:7px;padding:6px 9px;cursor:pointer;font:inherit;font-size:12px}.danger{color:#a33b35;border-color:#e8cecb;background:#fff8f7}.primary{background:#174b3b;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:650}.modalback{position:fixed;inset:0;background:#13251dcc;z-index:50;display:grid;place-items:center;padding:16px}.modal{background:white;border-radius:14px;padding:22px;width:min(680px,100%);max-height:90vh;overflow:auto;box-shadow:0 18px 60px #0003}.formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.formgrid .full{grid-column:1/-1}.modal input,.modal select,.modal textarea{width:100%;padding:10px;border:1px solid #ccd8cf;border-radius:8px;font:inherit}.modal textarea{min-height:90px}.modal label{display:block;margin:12px 0 5px;font-size:13px;font-weight:650}.modalfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.statusmsg{font-size:13px;color:#a33b35;min-height:20px;margin-top:8px}.filelink{color:#174b3b;font-weight:650}.report-toolbar{display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:16px}.report-toolbar label{margin:0 0 5px}.report-toolbar select{padding:9px;border:1px solid #ccd8cf;border-radius:8px;font:inherit}.report-kpis,.report-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.report-kpis>div,.report-grid>div{background:#f5f8f5;border:1px solid #e1e8e2;border-radius:9px;padding:12px}.report-kpis small,.report-grid small{display:block;color:#69766f;font-size:12px}.report-kpis strong,.report-grid b{display:block;margin-top:5px;color:#174b3b}.report-panel{background:#fff;border:1px solid #e1e8e2;border-radius:10px;padding:15px;margin:14px 0}.report-panel h3{font-size:15px;margin:0 0 12px;color:#174b3b}.report-status{margin-top:12px;font-weight:700}.report-ok{color:#167246}.report-bad{color:#a33b35}.report-pending{color:#8b6500}@media(max-width:650px){.report-toolbar{align-items:stretch}.report-toolbar .crud-actions{width:100%}}`;document.head.append(style);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function display(table,row){if(table==='soci')return [row.cognome,row.nome].filter(Boolean).join(' ')+' · '+(row.codice_socio||'senza tessera');if(table==='annualita')return String(row.anno);if(table==='iscrizioni')return (state.refs.soci||[]).find(x=>x.id===row.socio_id)?.label+' · '+(state.refs.annualita||[]).find(x=>x.id===row.annualita_id)?.label;if(table==='pagamenti')return (state.refs.soci||[]).find(x=>x.id===row.socio_id)?.label+' · '+row.data_pagamento+' · €'+row.importo;if(table==='verbali')return (row.numero?row.numero+' · ':'')+row.oggetto;if(table==='documenti')return row.titolo;if(table==='categorie_movimenti')return (row.codice?row.codice+' · ':'')+row.nome;return row.descrizione}
async function fetchRefs(tables=[]){const unique=[...new Set(tables)];const results=await Promise.all(unique.map(async t=>{const {data,error}=await db.from(t).select('*').limit(500);if(error)throw new Error('Riferimenti '+t+': '+error.message);return [t,data||[]]}));for(const [t,data] of results)state.refs[t]=data.map(r=>({...r,label:display(t,r)}))}
function makeField(c,row){const [key,label,type='text',opts]=c;const value=row?.[key]??'';if(type==='textarea')return '<div class="full"><label>'+esc(label)+'</label><textarea name="'+key+'">'+esc(value)+'</textarea></div>';if(type==='file')return '<div class="full"><label>'+esc(label)+'</label><input name="'+key+'" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"><small>PDF, immagini e documenti Office. I file restano in archivio privato.</small></div>';if(type?.startsWith('fk:')){const t=type.slice(3),items=(state.refs[t]||[]).filter(x=>key==='categoria_id'?['EA1','EA2'].includes(x.codice):true);return '<div><label>'+esc(label)+'</label><select name="'+key+'"'+(opts===1?' required':'')+'><option value="">— Seleziona —</option>'+items.map(x=>'<option value="'+x.id+'" '+(value===x.id?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></div>'}if(type==='select')return '<div><label>'+esc(label)+'</label><select name="'+key+'"'+(opts===1?' required':'')+'>'+opts.map(x=>'<option value="'+x+'" '+(String(value??opts[0])===x?'selected':'')+'>'+esc(x==='true'?'Sì':x==='false'?'No':x)+'</option>').join('')+'</select></div>';return '<div><label>'+esc(label)+'</label><input name="'+key+'" type="'+type+'" '+(type==='number'?'step="0.01" min="0"':'')+(opts===1?' required':'')+' value="'+esc(value)+'"></div>'}
function modal(table,row){state.edit=row?.id||null;const cfg=config[table];const back=document.createElement('div');back.className='modalback';back.id='crudmodal';back.innerHTML='<section class="modal" role="dialog" aria-modal="true"><h2>'+(row?'Modifica':'Nuovo')+' · '+esc(cfg.title)+'</h2><form id="crudform"><div class="formgrid">'+cfg.cols.map(c=>makeField(c,row)).join('')+'</div><div id="formmsg" class="statusmsg" role="status"></div><div class="modalfoot"><button type="button" class="mini" id="cancelmodal">Annulla</button><button class="primary" id="savebtn">Salva</button></div></form></section>';document.body.append(back);if(table==='pagamenti'&&!row){const cat=$('crudform').elements.namedItem('categoria_id');if(cat)cat.value='5609abaa-9094-443f-abc7-1b549fcfee96';const date=$('crudform').elements.namedItem('data_pagamento');if(date&&!date.value)date.value=new Date().toISOString().slice(0,10);const annual=$('crudform').elements.namedItem('annualita_id');if(annual&&!annual.value){const current=(state.refs.annualita||[]).find(a=>Number(a.anno)===new Date().getFullYear());if(current)annual.value=current.id}const method=$('crudform').elements.namedItem('metodo'),account=$('crudform').elements.namedItem('conto');if(method&&account){const syncAccount=()=>{if(method.value==='contanti')account.value='cassa';else if(method.value==='altro')account.value='';else account.value='banca'};method.addEventListener('change',syncAccount);syncAccount()}}$('cancelmodal').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});$('crudform').onsubmit=e=>save(e,table,row)}
async function save(e,table,row){e.preventDefault();const form=e.currentTarget,fd=new FormData(form),payload={};for(const c of config[table].cols){const [k,,type]=c;if(k==='__file')continue;let v=fd.get(k);if(type==='number')v=v===''?(table==='annualita'&&['quota_base','saldo_iniziale_cassa','saldo_iniziale_banca','imposte_gestione','imposte_investimenti'].includes(k)?0:null):Number(v);if(type==='select'&&['attiva','anticipo','rimborso'].includes(k))v=v==='true';if(v===''||v===null)v=null;payload[k]=v}const msg=$('formmsg'),btn=$('savebtn');btn.disabled=true;msg.textContent='Salvataggio…';try{if(table==='pagamenti'&&row){const issued=await db.from('ricevute').select('numero,stato').eq('pagamento_id',row.id).maybeSingle();if(issued.error)throw issued.error;if(issued.data)throw Error('Questo pagamento è già associato alla ricevuta '+issued.data.numero+' ('+issued.data.stato+'). Per conservare la ricevuta e il rendiconto, il pagamento non può essere modificato. Registra un nuovo pagamento per eventuali correzioni.')}if(table==='movimenti'){const annual=(state.refs.annualita||[]).find(x=>x.id===payload.annualita_id);const cat=(state.refs.categorie_movimenti||[]).find(x=>x.id===payload.categoria_id);if(!annual)throw Error('Seleziona l’annualità.');if(!cat?.codice)throw Error('Seleziona una voce con codice.');if(payload.data_movimento?.slice(0,4)!==String(annual.anno))throw Error('La data deve appartenere all’annualità selezionata.');const code=cat.codice;let expected='';if(/^E[A-E][0-9]+$/.test(code))expected='entrata';else if(/^U[A-E][0-9]+$/.test(code))expected='uscita';else if(/^EF[1-3]$/.test(code))expected='disinvestimento';else if(code==='EF4')expected='finanziamento_ricevuto';else if(/^UF[1-3]$/.test(code))expected='investimento';else if(code==='UF4')expected='rimborso_finanziamento';else if(/^EG[1-2]$/.test(code))expected='provento_figurativo';else if(/^UG[1-2]$/.test(code))expected='costo_figurativo';if(payload.tipo!==expected)throw Error('La voce '+code+' richiede il tipo movimento '+expected.replace(/_/g,' ')+'.');if(!Number.isFinite(payload.importo)||payload.importo<=0)throw Error('L’importo deve essere maggiore di zero.');}if(table==='documenti'){const file=fd.get('__file');if(file&&file.size){if(file.size>20*1024*1024)throw Error('Il file supera il limite di 20 MB.');const ext=(file.name.split('.').pop()||'file').toLowerCase(),path=ADMIN+'/'+crypto.randomUUID()+'.'+ext;const {error}=await db.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(error)throw error;payload.file_path=path}else if(row?.file_path)payload.file_path=row.file_path}
let result;if(row)result=await db.from(table).update(payload).eq('id',row.id);else result=await db.from(table).insert(payload);if(result.error)throw result.error; $('crudmodal').remove();await load()}catch(err){msg.textContent='Non è stato possibile salvare: '+(err.message||'errore');btn.disabled=false}}
async function createAnnualityFromPrevious(previous,year,button){
 if(!confirm('Creo annualita '+year+' con i saldi finali '+(year-1)+' come saldi iniziali. I movimenti precedenti restano nello storico e non vengono duplicati. Procedere?'))return;
 button.disabled=true;button.textContent='Creazione in corso...';
 try{
  const check=await db.from('annualita').select('id').eq('anno',year).limit(1);if(check.error)throw check.error;if(check.data&&check.data.length)throw Error('Annualita gia presente.');
  if(previous.saldo_finale_cassa==null||previous.saldo_finale_banca==null)throw Error('Inserisci prima entrambi i saldi finali del '+(year-1)+'.');
  const payload={anno:year,data_inizio:year+'-01-01',data_fine:year+'-12-31',quota_base:Number(previous.quota_base)||0,saldo_iniziale_cassa:Number(previous.saldo_finale_cassa),saldo_iniziale_banca:Number(previous.saldo_finale_banca),saldo_finale_cassa:null,saldo_finale_banca:null,imposte_gestione:0,conto_imposte_gestione:previous.conto_imposte_gestione||'banca',imposte_investimenti:0,conto_imposte_investimenti:previous.conto_imposte_investimenti||'banca',note:'Annualita creata riportando i saldi finali '+(year-1)+'. Inserire i movimenti del nuovo anno.'};
  const made=await db.from('annualita').insert(payload);if(made.error)throw made.error;
  alert('Annualita '+year+' creata. Saldi iniziali riportati: cassa '+euro(payload.saldo_iniziale_cassa)+', banca '+euro(payload.saldo_iniziale_banca)+'. I movimenti del '+(year-1)+' non sono stati modificati.');await load();
 }catch(err){alert('Creazione non riuscita: '+(err.message||'errore'));button.disabled=false;button.textContent='Crea nuova annualità'}
}
async function removeRow(table,row){if(!confirm('Vuoi eliminare questo elemento? L’operazione non può essere annullata.'))return;if(table==='documenti'&&row.file_path){const {error}=await db.storage.from(BUCKET).remove([row.file_path]);if(error){alert('File non eliminato: '+error.message);return}}const {error}=await db.from(table).delete().eq('id',row.id);if(error){alert('Eliminazione non riuscita: '+error.message);return}await load()}
async function openFile(path){const {data,error}=await db.storage.from(BUCKET).createSignedUrl(path,90);if(error){alert('Documento non disponibile: '+error.message);return}window.open(data.signedUrl,'_blank','noopener')}

function reportTypeLabel(type){return ({entrata:'Entrata',uscita:'Uscita',investimento:'Investimento',disinvestimento:'Disinvestimento',finanziamento_ricevuto:'Finanziamento ricevuto',rimborso_finanziamento:'Rimborso finanziamento',costo_figurativo:'Costo figurativo',provento_figurativo:'Provento figurativo'})[type]||type}
function euro(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0)}
function cashReportStats(annual,movements,cats){
 const byId=new Map(cats.map(c=>[c.id,c])),byCode={},cashDelta={cassa:0,banca:0};
 let incomes=0,expenses=0,specialIn=0,specialOut=0,figureIn=0,figureOut=0;
 for(const m of movements){
  const code=byId.get(m.categoria_id)?.codice||'',amount=Number(m.importo)||0;if(!code)continue;byCode[code]=(byCode[code]||0)+amount;
  if(/^E[A-E]\d+$/.test(code))incomes+=amount;else if(/^U[A-E]\d+$/.test(code))expenses+=amount;
  else if(/^EF[1-4]$/.test(code))specialIn+=amount;else if(/^UF[1-4]$/.test(code))specialOut+=amount;
  else if(/^EG[1-2]$/.test(code))figureIn+=amount;else if(/^UG[1-2]$/.test(code))figureOut+=amount;
  if(!/^[EU]G[1-2]$/.test(code))cashDelta[m.conto==='cassa'?'cassa':'banca']+=(code[0]==='E'?1:-1)*amount;
 }
 const taxOp=Number(annual.imposte_gestione)||0,taxSpecial=Number(annual.imposte_investimenti)||0;
 cashDelta[annual.conto_imposte_gestione||'banca']-=taxOp;cashDelta[annual.conto_imposte_investimenti||'banca']-=taxSpecial;
 const expected={cassa:(Number(annual.saldo_iniziale_cassa)||0)+cashDelta.cassa,banca:(Number(annual.saldo_iniziale_banca)||0)+cashDelta.banca};
 const actualCash=annual.saldo_finale_cassa===null||annual.saldo_finale_cassa===undefined?null:Number(annual.saldo_finale_cassa);
 const actualBank=annual.saldo_finale_banca===null||annual.saldo_finale_banca===undefined?null:Number(annual.saldo_finale_banca);
 const complete=actualCash!==null&&actualBank!==null;
 return {byCode,incomes,expenses,specialIn,specialOut,figureIn,figureOut,taxOp,taxSpecial,operating:incomes-expenses-taxOp,special:specialIn-specialOut-taxSpecial,net:incomes-expenses-taxOp+specialIn-specialOut-taxSpecial,expected,actualCash,actualBank,complete,ok:complete&&Math.abs(actualCash-expected.cassa)<0.01&&Math.abs(actualBank-expected.banca)<0.01};
}
async function fetchAllMovements(annualId){
 const all=[];let offset=0;const pageSize=1000;
 while(true){const r=await db.from('movimenti').select('*').eq('annualita_id',annualId).order('data_movimento',{ascending:true}).range(offset,offset+pageSize-1);if(r.error)throw r.error;all.push(...(r.data||[]));if(!r.data||r.data.length<pageSize)break;offset+=pageSize}
 return all;
}
function goTab(tab){const b=$('nav')?.querySelector('[data-tab="'+tab+'"]');if(b)b.click()}
async function loadRendiconto(){
 const records=$('records');records.textContent='Caricamento rendiconto…';
 try{
  await fetchRefs(['annualita','categorie_movimenti']);
  const cats=(state.refs.categorie_movimenti||[]).filter(c=>c.attiva!==false&&c.codice),annualities=(state.refs.annualita||[]).sort((a,b)=>Number(a.anno)-Number(b.anno));
  if(!annualities.length){records.innerHTML='<div class="empty"><b>Nessuna annualità configurata.</b><br>Crea il 2025 o il 2026 nella scheda Annualità e inserisci i saldi iniziali verificati. I saldi finali si compilano a fine anno.</div><div class="crud-actions"><button class="primary" id="reportannuality">Crea annualità</button><button class="mini" id="exportemptyreport">Scarica modello Excel vuoto (6 fogli)</button></div>';$('reportannuality').onclick=()=>goTab('annualita');$('exportemptyreport').onclick=async()=>{try{await exportRendiconto()}catch(err){alert('Esportazione non riuscita: '+(err.message||err))}};return}
  let annual=annualities.find(a=>String(a.id)===String(state.rendicontoYear));
  if(!annual){annual=annualities.find(a=>Number(a.anno)===new Date().getFullYear())||annualities[annualities.length-1];state.rendicontoYear=annual.id}
  const movements=await fetchAllMovements(annual.id),stats=cashReportStats(annual,movements,cats),prior=annualities.find(a=>Number(a.anno)===Number(annual.anno)-1);
  const status=stats.ok?'<span class="report-ok">Quadratura OK</span>':stats.complete?'<span class="report-bad">Differenza da verificare</span>':'<span class="report-pending">Inserire i saldi finali</span>';
  const opts=annualities.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===annual.id?'selected':'')+'>'+esc(a.anno)+'</option>').join('');
  let html='<div class="report-toolbar"><div><label for="reportyear">Annualità</label><select id="reportyear">'+opts+'</select></div><div class="crud-actions"><button class="mini" id="annualityedit">Saldi e imposte</button><button class="mini" id="newmovement">+ Nuovo movimento</button><button class="primary" id="exportreport">Esporta Excel</button></div></div>';
  html+='<div class="report-kpis"><div><small>Entrate gestione</small><strong>'+euro(stats.incomes)+'</strong></div><div><small>Uscite gestione</small><strong>'+euro(stats.expenses)+'</strong></div><div><small>Avanzo/disavanzo operativo</small><strong>'+euro(stats.operating)+'</strong></div><div><small>Entrate da disinvestimenti e finanziamenti</small><strong>'+euro(stats.specialIn)+'</strong></div><div><small>Uscite da investimenti e rimborsi</small><strong>'+euro(stats.specialOut)+'</strong></div><div><small>Avanzo/disavanzo complessivo</small><strong>'+euro(stats.net)+'</strong></div></div>';
  html+='<div class="report-panel"><h3>Saldi e controllo quadratura</h3><div class="report-grid"><div><small>Iniziale cassa</small><b>'+euro(annual.saldo_iniziale_cassa)+'</b></div><div><small>Iniziale banca</small><b>'+euro(annual.saldo_iniziale_banca)+'</b></div><div><small>Finale atteso cassa</small><b>'+euro(stats.expected.cassa)+'</b></div><div><small>Finale atteso banca</small><b>'+euro(stats.expected.banca)+'</b></div><div><small>Finale dichiarato cassa</small><b>'+(stats.actualCash===null?'Da inserire':euro(stats.actualCash))+'</b></div><div><small>Finale dichiarato banca</small><b>'+(stats.actualBank===null?'Da inserire':euro(stats.actualBank))+'</b></div></div><div class="report-status">'+status+(stats.complete&&!stats.ok?' · Cassa: '+euro(stats.actualCash-stats.expected.cassa)+' · Banca: '+euro(stats.actualBank-stats.expected.banca):'')+'</div>';
  if(prior&&prior.saldo_finale_cassa!==null&&prior.saldo_finale_banca!==null){const carry=Number(prior.saldo_finale_cassa)+Number(prior.saldo_finale_banca),opening=(Number(annual.saldo_iniziale_cassa)||0)+(Number(annual.saldo_iniziale_banca)||0);html+='<p class="hint">Riporto da '+prior.anno+': '+euro(carry)+'. Saldo iniziale '+annual.anno+': '+euro(opening)+'. '+(Math.abs(carry-opening)<0.01?'Riporto coerente.':'Verificare il riporto.')+'</p>'}
  html+='<p class="hint">Imposte di gestione: '+euro(annual.imposte_gestione)+' ('+esc(annual.conto_imposte_gestione||'banca')+'). Imposte su investimenti e finanziamenti: '+euro(annual.imposte_investimenti)+' ('+esc(annual.conto_imposte_investimenti||'banca')+').</p></div><div class="report-panel"><h3>Movimenti figurativi (non modificano cassa e banca)</h3><div class="report-grid"><div><small>Proventi figurativi</small><b>'+euro(stats.figureIn)+'</b></div><div><small>Costi figurativi</small><b>'+euro(stats.figureOut)+'</b></div></div></div><div class="report-panel"><h3>Movimenti registrati · '+movements.length+'</h3>';
  if(!movements.length)html+='<div class="empty">Nessun movimento registrato.</div>';
  else{const catMap=new Map(cats.map(c=>[c.id,c]));html+='<div class="tablewrap"><table><thead><tr><th>Azioni</th><th>Data</th><th>Tipo</th><th>Descrizione</th><th>Importo</th><th>Codice</th><th>Conto</th></tr></thead><tbody>';
   for(const m of movements){const c=catMap.get(m.categoria_id);html+='<tr><td><div class="crud-actions"><button class="mini" data-report-edit="'+esc(m.id)+'">Modifica</button><button class="mini danger" data-report-del="'+esc(m.id)+'">Elimina</button></div></td><td>'+esc(m.data_movimento)+'</td><td>'+esc(reportTypeLabel(m.tipo))+'</td><td>'+esc(m.descrizione)+'</td><td>'+euro(m.importo)+'</td><td>'+esc(c?.codice||'—')+'</td><td>'+esc(m.conto||'banca')+'</td></tr>'}
   html+='</tbody></table></div>'}
  html+='</div>';records.innerHTML=html;
  $('reportyear').onchange=()=>{state.rendicontoYear=$('reportyear').value;loadRendiconto()};
  $('annualityedit').onclick=()=>modal('annualita',annual);$('newmovement').onclick=()=>modal('movimenti');
  $('exportreport').onclick=async()=>{const b=$('exportreport');b.disabled=true;b.textContent='Preparo Excel…';try{await exportRendiconto()}catch(err){alert('Esportazione non riuscita: '+(err.message||err))}finally{b.disabled=false;b.textContent='Esporta Excel'}};
  records.querySelectorAll('[data-report-edit]').forEach(b=>b.onclick=()=>modal('movimenti',movements.find(m=>m.id===b.dataset.reportEdit)));
  records.querySelectorAll('[data-report-del]').forEach(b=>b.onclick=()=>removeRow('movimenti',movements.find(m=>m.id===b.dataset.reportDel)));
 }catch(err){records.innerHTML='<div class="empty">Caricamento rendiconto non riuscito: '+esc(err.message||'errore imprevisto')+'</div>'}
}
async function loadExcelJs(){
 if(window.ExcelJS)return window.ExcelJS;
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Libreria Excel non disponibile.'));document.head.append(script)});
 if(!window.ExcelJS)throw new Error('Libreria Excel non inizializzata.');return window.ExcelJS;
}
function setExcelFormula(ws,cell,formula,result){ws.getCell(cell).value={formula:formula,result:Number.isFinite(result)?result:0};ws.getCell(cell).numFmt='#,##0.00 [$€-it-IT]'}
function sumCode(movements,catById,code){return movements.reduce((n,m)=>n+(catById.get(m.categoria_id)?.codice===code?Number(m.importo)||0:0),0)}
function makeDataSheet(book,year,movements,cats,isIncome){
 const ws=book.addWorksheet((isIncome?'Entrate ':'Uscite ')+year);
 const headers=isIncome?['Numero Ricevuta','Nominativo','Data','Importo','Voci di entrata','Voci Generali','NOTE']:['Numero Scontrino/Fattura','Negozio/Ente','Data','Importo','Descrizione bene','Volontario','Anticipi','Rimborso','Voci di Uscita','Voci Generali'];
 ws.mergeCells(1,1,1,headers.length);ws.getCell(1,1).value=(isIncome?'ENTRATE ':'USCITE ')+year;ws.getRow(1).height=25;ws.getRow(1).font={bold:true,size:13,color:{argb:'FFFFFFFF'}};ws.getRow(1).alignment={horizontal:'center',vertical:'middle'};ws.getRow(1).eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF174B3B'}});
 ws.addRow(headers);ws.getRow(2).height=34;ws.getRow(2).font={bold:true,color:{argb:'FFFFFFFF'}};ws.getRow(2).alignment={wrapText:true,vertical:'middle',horizontal:'center'};ws.getRow(2).eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2F6954'}});
 const catById=new Map(cats.map(c=>[c.id,c])),rows=movements.filter(m=>(catById.get(m.categoria_id)?.codice||'').startsWith(isIncome?'E':'U'));
 for(const m of rows){const c=catById.get(m.categoria_id),d=m.data_movimento?new Date(m.data_movimento+'T00:00:00Z'):null;if(isIncome)ws.addRow([m.numero_documento||'',m.nominativo||'',d,Number(m.importo)||0,c?.nome||'',c?.codice||'',m.note||'']);else ws.addRow([m.numero_documento||'',m.fornitore||'',d,Number(m.importo)||0,m.descrizione||'',m.volontario||'',m.anticipo?'si':'',m.rimborso?'si':'',c?.nome||'',c?.codice||''])}
 const total=ws.addRow([]);total.getCell(3).value='Totale';total.getCell(4).value={formula:rows.length?'SUM(D3:D'+(total.number-1)+')':'0',result:rows.reduce((n,m)=>n+(Number(m.importo)||0),0)};total.font={bold:true};total.getCell(4).numFmt='#,##0.00 [$€-it-IT]';
 ws.columns=isIncome?[{width:22},{width:29},{width:14},{width:14},{width:54},{width:14},{width:48}]:[{width:23},{width:32},{width:14},{width:14},{width:46},{width:20},{width:12},{width:12},{width:54},{width:15}];
 ws.getColumn(3).numFmt='dd/mm/yyyy';ws.getColumn(4).numFmt='#,##0.00 [$€-it-IT]';ws.views=[{state:'frozen',ySplit:2}];ws.autoFilter={from:{row:2,column:1},to:{row:2,column:headers.length}};ws.pageSetup={orientation:'landscape',paperSize:ws.PAPER_SIZE_A4,fitToPage:true,fitToWidth:1,fitToHeight:0};
 ws.eachRow({includeEmpty:false},row=>row.eachCell(cell=>{cell.alignment={vertical:'top',wrapText:true};if(row.number>2)cell.border={bottom:{style:'hair',color:{argb:'FFE0E7E2'}}}}));
}
function makeGeneralSheet(book,year,current,previous,annual,previousAnnual,cats){
 const ws=book.addWorksheet('Generale '+year),catById=new Map(cats.map(c=>[c.id,c])),catByCode=new Map(cats.map(c=>[c.codice,c]));
 const put=(row,col,value)=>{ws.getCell(row,col).value=value};
 const expenseRows={UA:[6,7,8,9,10],UB:[20,21,22,23,24],UC:[30,31,32],UD:[37,38,39,40,41],UE:[46,47,48,49,50],UF:[60,61,62,63],UG:[81,82]};
 const incomeRows={EA:[6,7,8,9,10,11,12,13,14,15],EB:[20,21,22,23,24,25],EC:[30,31,32],ED:[37,38,39,40,41],EE:[46,47],EF:[60,61,62,63],EG:[81,82]};
 ws.getColumn(1).width=10;ws.getColumn(2).width=67;ws.getColumn(3).width=15;ws.getColumn(4).width=15;ws.getColumn(5).width=3;ws.getColumn(6).width=10;ws.getColumn(7).width=67;ws.getColumn(8).width=15;ws.getColumn(9).width=15;
 put(2,2,'ASSOCIAZIONE INSIEME PER SESTRI LEVANTE ODV - RENDICONTO PER CASSA ANNO '+year);put(4,2,'USCITE');put(4,7,'ENTRATE');[4,59,80].forEach(r=>{put(r,3,new Date(year,11,31));put(r,4,new Date(year-1,11,31));put(r,8,new Date(year,11,31));put(r,9,new Date(year-1,11,31))});put(75,8,new Date(year,11,31));put(75,9,new Date(year-1,11,31));put(69,8,new Date(year,11,31));put(69,9,new Date(year-1,11,31));
 put(5,2,'A) Uscite da attività di interesse generale');put(5,7,'A) Entrate da attività di interesse generale');put(19,2,'B) Uscite da attività diverse');put(19,7,'B) Entrate da attività diverse');
 put(29,2,'C) Uscite da attività di raccolta fondi');put(29,7,'C) Entrate da attività di raccolta fondi');put(36,2,'D) Uscite da attività finanziarie e patrimoniali');put(36,7,'D) Entrate da attività finanziarie e patrimoniali');
 put(45,2,'E) Uscite di supporto generale');put(45,7,'E) Entrate di supporto generale');put(59,2,'Uscite da investimenti in immobilizzazioni o da deflussi di capitale di terzi');put(59,7,'Entrate da disinvestimenti in immobilizzazioni o da flussi di capitale di terzi');put(75,2,'Cassa e banca');put(80,2,'Costi figurativi');put(80,7,'Proventi figurativi');
 function desc(code){return (catByCode.get(code)?.nome||code).replace(new RegExp('^'+code+'\\s*-\\s*'),'')}
 function putCodeGroup(rows,income){
  for(const [prefix,positions] of Object.entries(rows)){for(let i=0;i<positions.length;i++){
   const code=prefix+(i+1),row=positions[i],codeCol=income?6:1,descCol=income?7:2;
   put(row,codeCol,code);put(row,descCol,desc(code));
   const cur=sumCode(current,catById,code),prev=sumCode(previous,catById,code),dataName=(income?'Entrate ':'Uscite ')+year,prevName=(income?'Entrate ':'Uscite ')+(year-1),codeColumn=income?'F':'J',summaryCodeColumn=income?'F':'A';
   setExcelFormula(ws,(income?'H':'C')+row,"SUMIF('"+dataName+"'!$"+codeColumn+":$"+codeColumn+",$"+summaryCodeColumn+row+",'"+dataName+"'!$D:$D)",cur);
   if(year===2025){ws.getCell((income?'I':'D')+row).value=prev;ws.getCell((income?'I':'D')+row).numFmt='#,##0.00 [$€-it-IT]'}else setExcelFormula(ws,(income?'I':'D')+row,"SUMIF('"+prevName+"'!$"+codeColumn+":$"+codeColumn+",$"+summaryCodeColumn+row+",'"+prevName+"'!$D:$D)",prev);
  }}
 }
 putCodeGroup(expenseRows,false);putCodeGroup(incomeRows,true);
 const exGroups=[{start:6,end:10,total:16,diff:17},{start:20,end:24,total:26,diff:27},{start:30,end:32,total:33,diff:34},{start:37,end:41,total:42,diff:43},{start:46,end:50,total:51}],inGroups=[{start:6,end:15,total:16},{start:20,end:25,total:26},{start:30,end:32,total:33},{start:37,end:41,total:42},{start:46,end:47,total:51}];
 for(const g of exGroups){put(g.total,2,'Totale');const c=exGroups.length?current:current;const sumCols=(arr,col)=>{let n=0;for(let row=g.start;row<=g.end;row++){const v=ws.getCell(row,col).value;n+=Number(v&&typeof v==='object'&&'result'in v?v.result:v)||0}return n};setExcelFormula(ws,'C'+g.total,'SUM(C'+g.start+':C'+g.end+')',sumCols(current,3));setExcelFormula(ws,'D'+g.total,'SUM(D'+g.start+':D'+g.end+')',sumCols(previous,4))}
 for(const g of inGroups){put(g.total,7,'Totale');const sumCol=(col)=>{let n=0;for(let row=g.start;row<=g.end;row++){const v=ws.getCell(row,col).value;n+=Number(v&&typeof v==='object'&&'result'in v?v.result:v)||0}return n};setExcelFormula(ws,'H'+g.total,'SUM(H'+g.start+':H'+g.end+')',sumCol(8));setExcelFormula(ws,'I'+g.total,'SUM(I'+g.start+':I'+g.end+')',sumCol(9))}
 for(let i=0;i<4;i++){const g=exGroups[i];put(g.diff,2,'Avanzo/disavanzo (+/-)');const inTotal=Number(ws.getCell(g.total,8).value?.result??ws.getCell(g.total,8).value)||0,exTotal=Number(ws.getCell(g.total,3).value?.result??ws.getCell(g.total,3).value)||0,prevIn=Number(ws.getCell(g.total,9).value?.result??ws.getCell(g.total,9).value)||0,prevEx=Number(ws.getCell(g.total,4).value?.result??ws.getCell(g.total,4).value)||0;setExcelFormula(ws,'H'+g.diff,'H'+g.total+'-C'+g.total,inTotal-exTotal);setExcelFormula(ws,'I'+g.diff,'I'+g.total+'-D'+g.total,prevIn-prevEx)}
 const total=(arr,re)=>arr.reduce((n,m)=>n+(re.test(catById.get(m.categoria_id)?.codice||'')?Number(m.importo)||0:0),0);
 const ex=total(current,/^U[A-E]/),inc=total(current,/^E[A-E]/),spEx=total(current,/^UF/),spIn=total(current,/^EF/),figEx=total(current,/^UG/),figIn=total(current,/^EG/);
 const pEx=total(previous,/^U[A-E]/),pIn=total(previous,/^E[A-E]/),pSpEx=total(previous,/^UF/),pSpIn=total(previous,/^EF/),pFigIn=total(previous,/^EG/);
 const tax=Number(annual?.imposte_gestione)||0,taxSp=Number(annual?.imposte_investimenti)||0,pTax=Number(previousAnnual?.imposte_gestione)||0,pTaxSp=Number(previousAnnual?.imposte_investimenti)||0;
 put(53,2,'TOTALE ONERI E COSTI');put(53,7,'TOTALE ENTRATE DELLA GESTIONE');setExcelFormula(ws,'C53','SUM(C16,C26,C33,C42,C51)',ex);setExcelFormula(ws,'D53','SUM(D16,D26,D33,D42,D51)',pEx);setExcelFormula(ws,'H53','SUM(H16,H26,H33,H42,H51)',inc);setExcelFormula(ws,'I53','SUM(I16,I26,I33,I42,I51)',pIn);
 put(54,2,'Avanzo/disavanzo d’esercizio prima delle imposte (+/-)');setExcelFormula(ws,'H54','H53-C53',inc-ex);setExcelFormula(ws,'I54','I53-D53',pIn-pEx);put(55,2,'Imposte');setExcelFormula(ws,'H55','0',tax);setExcelFormula(ws,'I55','0',pTax);
 put(56,2,'Avanzo/disavanzo d’esercizio prima di investimenti e disinvestimenti patrimoniali e finanziamenti (+/-)');setExcelFormula(ws,'H56','H54-H55',inc-ex-tax);setExcelFormula(ws,'I56','I54-I55',pIn-pEx-pTax);
 put(64,2,'Totale');put(64,7,'Totale');setExcelFormula(ws,'C64','SUM(C60:C63)',spEx);setExcelFormula(ws,'D64','SUM(D60:D63)',pSpEx);setExcelFormula(ws,'H64','SUM(H60:H63)',spIn);setExcelFormula(ws,'I64','SUM(I60:I63)',pSpIn);
 put(65,2,'Imposte');setExcelFormula(ws,'H65','0',taxSp);setExcelFormula(ws,'I65','0',pTaxSp);put(66,2,'Avanzo/disavanzo da entrate e uscite per investimenti e disinvestimenti patrimoniali e finanziamenti (+/-)');setExcelFormula(ws,'H66','H64-C64-H65',spIn-spEx-taxSp);setExcelFormula(ws,'I66','I64-D64-I65',pSpIn-pSpEx-pTaxSp);
 put(70,2,'Avanzo/disavanzo d’esercizio prima di investimenti e disinvestimenti patrimoniali e finanziamenti (+/-)');setExcelFormula(ws,'H70','H56',inc-ex-tax);setExcelFormula(ws,'I70','I56',pIn-pEx-pTax);put(71,2,'Avanzo/disavanzo da entrate e uscite per investimenti e disinvestimenti patrimoniali e finanziamenti (+/-)');setExcelFormula(ws,'H71','H66',spIn-spEx-taxSp);setExcelFormula(ws,'I71','I66',pSpIn-pSpEx-pTaxSp);put(72,2,'Avanzo/disavanzo complessivo (+/-)');setExcelFormula(ws,'H72','H70+H71',inc-ex-tax+spIn-spEx-taxSp);setExcelFormula(ws,'I72','I70+I71',pIn-pEx-pTax+pSpIn-pSpEx-pTaxSp);
 put(76,2,'Cassa');put(77,2,'Depositi bancari e postali');ws.getCell('H76').value=annual?.saldo_finale_cassa??null;const bankStats=annual?cashReportStats(annual,current,cats):null,previousBankStats=previousAnnual?cashReportStats(previousAnnual,previous,cats):null;const initialBank=Number(annual?.saldo_iniziale_banca)||0,calculatedBank=bankStats?.expected?.banca??null; if(calculatedBank!==null)setExcelFormula(ws,'H77',String(initialBank)+'+('+String(calculatedBank-initialBank)+')',calculatedBank);else ws.getCell('H77').value=null;const priorCashValue=previousAnnual?.saldo_finale_cassa,priorBankValue=previousBankStats?.expected?.banca??previousAnnual?.saldo_finale_banca;if(priorCashValue!==null&&priorCashValue!==undefined)setExcelFormula(ws,'I76',String(Number(priorCashValue)) ,Number(priorCashValue));else ws.getCell('I76').value=null;if(priorBankValue!==null&&priorBankValue!==undefined)setExcelFormula(ws,'I77',String(Number(priorBankValue)),Number(priorBankValue));else ws.getCell('I77').value=null;
 put(81,1,'UG1');put(81,2,desc('UG1'));put(82,1,'UG2');put(82,2,desc('UG2'));put(81,6,'EG1');put(81,7,desc('EG1'));put(82,6,'EG2');put(82,7,desc('EG2'));put(83,2,'Totale');put(83,7,'Totale');setExcelFormula(ws,'C83','SUM(C81:C82)',figEx);setExcelFormula(ws,'H83','SUM(H81:H82)',figIn);setExcelFormula(ws,'I83','SUM(I81:I82)',pFigIn);
 put(88,2,'CONTROLLO QUADRATURA *');put(89,2,'Cassa e Banca anno precedente');put(90,2,'Avanzo/Disavanzo corrente');put(91,2,'Cassa e Banca anno corrente');put(92,2,'Esito controllo');
 const priorCash=previousAnnual?.saldo_finale_cassa,priorBank=previousBankStats?.expected?.banca??previousAnnual?.saldo_finale_banca,priorTotal=previousAnnual&&priorCash!==null&&priorCash!==undefined&&priorBank!==null&&priorBank!==undefined?Number(priorCash)+Number(priorBank):(Number(annual?.saldo_iniziale_cassa)||0)+(Number(annual?.saldo_iniziale_banca)||0);
 const close=annual&&annual.saldo_finale_cassa!==null&&annual.saldo_finale_cassa!==undefined&&calculatedBank!==null?Number(annual.saldo_finale_cassa)+Number(calculatedBank):null,net=inc-ex-tax+spIn-spEx-taxSp;
 ws.getCell('C89').value=priorTotal;setExcelFormula(ws,'C90','H72',net);setExcelFormula(ws,'C91','H76+H77',close);ws.getCell('C92').value=close===null?'DA COMPLETARE':Math.abs(priorTotal+net-close)<0.01?'Quadratura OK':'Errore quadratura';
 ['B92','C92'].forEach(addr=>{ws.getCell(addr).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD9EAD3'}};ws.getCell(addr).font={bold:true,color:{argb:'FF274E13'}}});
 put(94,2,'* Saldo iniziale + movimenti monetari - imposte = saldo finale. Le voci figurative non modificano cassa e banca.');ws.mergeCells('B94:I94');
 ws.getRow(2).height=30;ws.getRow(59).height=40;ws.getRow(88).height=24;ws.getRow(94).height=30;ws.getRow(2).font={bold:true,size:12,color:{argb:'FF174B3B'}};ws.getRow(2).alignment={horizontal:'center',vertical:'middle',wrapText:true};
 [4,5,16,19,26,29,33,36,42,45,51,53,59,64,66,69,72,75,80,83,88].forEach(n=>{ws.getRow(n).font={bold:true,color:{argb:'FF174B3B'}};for(let col=2;col<=9;col++)ws.getCell(n,col).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEAF1EC'}}});
 ['C','D','H','I'].forEach(col=>ws.getColumn(col).numFmt='#,##0.00 [$€-it-IT]');['C4','D4','H4','I4','C59','D59','H59','I59','H69','I69','H75','I75','C80','D80','H80','I80'].forEach(addr=>ws.getCell(addr).numFmt='dd/mm/yyyy');ws.views=[{state:'frozen',ySplit:4,xSplit:2}];ws.pageSetup={orientation:'landscape',paperSize:ws.PAPER_SIZE_A4,fitToPage:true,fitToWidth:1,fitToHeight:2};
}
async function exportRendiconto(){
 const ExcelJS=await loadExcelJs();await fetchRefs(['annualita','categorie_movimenti']);const cats=state.refs.categorie_movimenti||[],annualities=state.refs.annualita||[],years=[...new Set(annualities.map(a=>Number(a.anno)).filter(y=>Number.isInteger(y)&&y>=1900&&y<=9999))].sort((a,b)=>a-b),data={};if(!years.length)throw new Error('Non ci sono annualità da esportare.');
 for(const year of years){const annual=annualities.find(a=>Number(a.anno)===year)||null,previousAnnual=annualities.find(a=>Number(a.anno)===year-1)||null;data[year]={annual,previousAnnual,current:annual?await fetchAllMovements(annual.id):[],previous:previousAnnual?await fetchAllMovements(previousAnnual.id):[]}}
 const book=new ExcelJS.Workbook();book.creator='Insieme per Sestri Levante ODV';book.created=new Date();
 for(const year of years){const d=data[year];makeGeneralSheet(book,year,d.current,d.previous,d.annual,d.previousAnnual,cats);makeDataSheet(book,year,d.current,cats,true);makeDataSheet(book,year,d.current,cats,false)}
 const buffer=await book.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Rendiconto_per_cassa_'+years[0]+'_'+years[years.length-1]+'.xlsx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}


const RECEIPT_TEMPLATE_PATH='084247bb-729d-494e-a26a-e003520e0932/713ebbbe-a6ef-47ae-939f-51af43c5b1d7.pdf';
async function receiptScript(url,globalName){
 if(window[globalName])return window[globalName];
 await new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src=url;sc.onload=resolve;sc.onerror=()=>reject(new Error('Impossibile caricare la libreria PDF.'));document.head.append(sc)});
 if(!window[globalName])throw Error('Libreria PDF non disponibile.');return window[globalName];
}
function receiptDate(s){if(!/^\d{4}-\d{2}-\d{2}/.test(String(s||'')))throw Error('Data del pagamento mancante o non valida.');const a=String(s).slice(0,10).split('-');return a[2]+'/'+a[1]+'/'+a[0]}
function receiptNorm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').trim().replace(/\\s+/g,' ')}
async function ledgerReceiptData(key){
 const [prefix,movementId,memberId]=String(key).split(':');
 if(prefix!=='ledger'||!movementId||!memberId)throw Error('Collegamento ricevuta non valido.');
 const [mv,member,allMembers]=await Promise.all([
  db.from('movimenti').select('*').eq('id',movementId).single(),
  db.from('soci').select('id,nome,cognome,codice_fiscale,email').eq('id',memberId).single(),
  db.from('soci').select('id,nome,cognome').limit(5000)
 ]);
 // La verifica della categoria è fatta separatamente usando l'ID effettivo del movimento.
 for(const r of [mv,member,allMembers])if(r.error)throw r.error;
 const p=mv.data,m=member.data;
 const category=await db.from('categorie_movimenti').select('codice').eq('id',p.categoria_id).single();
 if(category.error)throw category.error;
 if(category.data.codice!=='EA1'||Number(p.importo)<=0||!/quota|iscrizion|rinnov|tesser/i.test(String(p.descrizione||''))||/donazion|liberalit|anticipo|rimborso/i.test(String(p.descrizione||'')))throw Error('Questo movimento non è una quota associativa.');
 const label=receiptNorm(p.nominativo);
 const matches=(allMembers.data||[]).filter(x=>{const first=receiptNorm(x.nome),last=receiptNorm(x.cognome);return label===last||label===first+' '+last||label===last+' '+first});
 if(matches.length!==1||matches[0].id!==m.id)throw Error('Il nominativo del Rendiconto non identifica univocamente questo socio.');
 if(!p.numero_documento||!/^[0-9]+$/.test(String(p.numero_documento).trim()))throw Error('Il movimento non ha un numero di ricevuta valido.');
 const annual=await db.from('annualita').select('anno').eq('id',p.annualita_id).single();
 if(annual.error)throw annual.error;
 const year=Number(annual.data.anno),amount=Number(p.importo);
 if(!m.nome||!m.cognome||!m.codice_fiscale||!p.data_movimento||!Number.isInteger(year)||amount<=0)throw Error('Dati incompleti per la ricevuta.');
 return {p:{data_pagamento:p.data_movimento},r:{numero:String(p.numero_documento)},m,year,amount};
}
async function receiptData(paymentId){
 if(String(paymentId).startsWith('ledger:'))return ledgerReceiptData(paymentId);
 const [pRes,rRes]=await Promise.all([db.from('pagamenti').select('*').eq('id',paymentId).single(),db.from('ricevute').select('id,numero,stato').eq('pagamento_id',paymentId).maybeSingle()]);
 if(pRes.error)throw pRes.error;if(rRes.error)throw rRes.error;
 const p=pRes.data,r=rRes.data;if(!r)throw Error('Assegna prima il numero della ricevuta.');
 const [mRes,aRes]=await Promise.all([db.from('soci').select('nome,cognome,codice_fiscale,email').eq('id',p.socio_id).single(),db.from('annualita').select('anno').eq('id',p.annualita_id).single()]);
 if(mRes.error)throw mRes.error;if(aRes.error)throw aRes.error;
 const m=mRes.data,year=Number(aRes.data.anno),amount=Number(p.importo);
 if(!m.nome||!m.cognome||!m.codice_fiscale||!p.data_pagamento||!Number.isFinite(amount)||amount<=0||!Number.isInteger(year))throw Error('Dati incompleti: controlla socio, codice fiscale, pagamento e annualità.');
 return {p,r,m,year,amount};
}
async function receiptPdf(paymentId){
 const {p,r,m,year,amount}=await receiptData(paymentId);
 const {data:blob,error}=await db.storage.from(BUCKET).download(RECEIPT_TEMPLATE_PATH);
 if(error)throw Error('Modello ufficiale non accessibile: '+error.message);
 const pdfjs=await receiptScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib');
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const jspdf=await receiptScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js','jspdf');
 const doc=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;
 const page=await doc.getPage(1),scale=2.5,view=page.getViewport({scale});
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
 const ctx=canvas.getContext('2d',{alpha:false});await page.render({canvasContext:ctx,viewport:view}).promise;
 // Il logo approvato è conservato in gestionale/logo.jpeg; sostituisce quello del PDF di esempio.
 const officialLogo=await new Promise((resolve,reject)=>{
  const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Logo ufficiale non disponibile.'));
  im.src='./logo.jpeg';
 });
 ctx.fillStyle='#fff';ctx.fillRect(58*scale,22*scale,105*scale,92*scale);
 ctx.drawImage(officialLogo,66*scale,27*scale,82*scale,84*scale);

 // Cancellazione definitiva dei dati dell'esempio sul raster: il PDF originale non viene incorporato.
 ctx.fillStyle='#fff';ctx.fillRect(65*scale,150*scale,465*scale,265*scale);
 const draw=(text,x,y,size,bold=false)=>{ctx.fillStyle='#000';ctx.font=(bold?'bold ':'')+(size*scale)+'px Arial, sans-serif';ctx.fillText(text,x*scale,y*scale)};
 const number=String(r.numero).trim();const num=number.includes('/')?number:number+' / '+year;
 const title='RICEVUTA QUOTA ASSOCIATIVA N° '+num;
 ctx.font='bold '+(16*scale)+'px Arial, sans-serif';
 if(ctx.measureText(title).width>465*scale)throw Error('Numero ricevuta troppo lungo per il modello.');
 draw(title,(595.28-ctx.measureText(title).width/scale)/2,176,16,true);
 const member=(m.nome+' '+m.cognome).trim(),money=amount.toFixed(2);
 const lines=[
  ['Si certifica che il socio: '+member,250],
  ['Codice Fiscale: '+m.codice_fiscale,273],
  ['ha versato in data '+receiptDate(p.data_pagamento)+' la quota sociale di Euro: € '+money,295],
  ["per l'anno sociale: "+year,318],
  ['Causale: Versamento quota associativa annuale.',363],
  ["Operazione fuori campo IVA ai sensi dell'art. 4 DPR 633/72.",409]
 ];
 for(const [line,y] of lines){ctx.font=(12*scale)+'px Arial, sans-serif';if(ctx.measureText(line).width>465*scale)throw Error('Testo troppo lungo per il modello ufficiale: '+line.slice(0,40));draw(line,71,y,12)}
 const pdf=new jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'a4',compress:true});
 pdf.addImage(canvas.toDataURL('image/jpeg',0.93),'JPEG',0,0,595.28,841.89);
 const filename='Ricevuta_'+num.replace(/[^0-9a-z]+/gi,'_')+'_'+m.cognome.replace(/[^0-9a-zà-ÿ]+/gi,'_')+'_'+m.nome.replace(/[^0-9a-zà-ÿ]+/gi,'_')+'.pdf';
 return {pdf,filename,details:{p,r,m,year,amount}};
}
async function downloadReceipt(paymentId){
 try{const {pdf,filename}=await receiptPdf(paymentId);pdf.save(filename)}
 catch(err){alert('Non è stato possibile creare il PDF: '+(err.message||err))}
}
async function prepareReceiptEmail(paymentId){
 try{
  const {pdf,filename,details}=await receiptPdf(paymentId),{m,year}=details;
  if(!m.email)throw Error('Manca l’indirizzo email del socio.');
  pdf.save(filename);
  const subject='Grazie per aver rinnovato la tua iscrizione!';
  const message='Gentile '+m.nome+' '+m.cognome+',\n\n'
   +'grazie per aver rinnovato la tua iscrizione all’Associazione Insieme per Sestri Levante ODV.\n'
   +'Il tuo sostegno è prezioso e ci aiuta a portare avanti le attività dell’associazione.\n\n'
   +'In allegato trovi la ricevuta relativa al versamento della quota associativa per l’anno '+year+'.\n\n'
   +'Grazie ancora per la fiducia e la partecipazione.\n\n'
   +'Associazione Insieme per Sestri Levante ODV';
  alert('La ricevuta PDF è stata scaricata. Si aprirà una bozza email: per completarla, allega il PDF '+filename+'. Il gestionale non può ancora inviare automaticamente allegati.');
  window.location.href='mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
 }catch(err){alert('Preparazione email non riuscita: '+(err.message||err))}
}

async function createReceipt(paymentId){try{const existing=await db.from('ricevute').select('id,numero,stato').eq('pagamento_id',paymentId).maybeSingle();if(existing.error)throw existing.error;if(existing.data){alert('Ricevuta già presente: '+existing.data.numero+' ('+existing.data.stato+').');return}const {data:p,error:pe}=await db.from('pagamenti').select('*').eq('id',paymentId).single();if(pe)throw pe;const payload={pagamento_id:p.id,socio_id:p.socio_id,importo:p.importo,metodo:p.metodo,causale:p.causale,data_emissione:new Date().toISOString().slice(0,10)};const {data,error}=await db.from('ricevute').insert(payload).select('id,numero').single();if(error)throw error;alert('Numero ricevuta assegnato: '+data.numero+'. Il PDF verrà completato con i dati ufficiali dell’associazione.');await load()}catch(err){alert('Non è stato possibile generare la ricevuta: '+(err.message||err))}}
async function loadSolleciti(){
 const records=$('records');records.textContent='Verifica rinnovi in corso…';
 try{
  const year=new Date().getFullYear();
  const [annualityRes,sociRes,paymentsRes]=await Promise.all([
   db.from('annualita').select('id,anno,quota_base').eq('anno',year).maybeSingle(),
   db.from('soci').select('id,codice_socio,nome,cognome,email').eq('stato','attivo').order('cognome',{ascending:true}),
   db.from('pagamenti').select('socio_id,annualita_id,data_pagamento').eq('categoria_id','5609abaa-9094-443f-abc7-1b549fcfee96').limit(5000)
  ]);
  if(annualityRes.error)throw annualityRes.error;if(sociRes.error)throw sociRes.error;if(paymentsRes.error)throw paymentsRes.error;
  const annuality=annualityRes.data;
  if(!annuality){records.innerHTML='<div class="empty">Non è ancora configurata l’annualità '+year+'. Crea prima l’annualità nella scheda Annualità.</div><div class="crud-actions"><button class="primary" id="sollecitiAnnualita">Apri annualità</button></div>';$('sollecitiAnnualita').onclick=()=>goTab('annualita');return}
  const paid=new Set((paymentsRes.data||[]).filter(p=>p.annualita_id===annuality.id||(!p.annualita_id&&String(p.data_pagamento||'').slice(0,4)===String(year))).map(p=>p.socio_id));
  const unpaid=(sociRes.data||[]).filter(m=>!paid.has(m.id));
  let html='<div class="hint" style="margin-bottom:12px">Solleciti per la quota associativa EA1 dell’annualità '+year+'. Sono esclusi i soci con un versamento EA1 registrato per questa annualità. Ogni messaggio viene inviato singolarmente, solo dopo la tua conferma.</div>';
  html+='<div class="report-kpis"><div><small>Soci attivi</small><strong>'+((sociRes.data||[]).length)+'</strong></div><div><small>Quota già versata</small><strong>'+((sociRes.data||[]).length-unpaid.length)+'</strong></div><div><small>Da sollecitare</small><strong>'+unpaid.length+'</strong></div></div>';
  if(!unpaid.length)html+='<div class="empty">Tutti i soci attivi risultano in regola per il '+year+'.</div>';
  else{
   html+='<div class="tablewrap"><table><thead><tr><th>Socio</th><th>Numero tessera</th><th>E-mail</th><th>Quota</th><th>Azione</th></tr></thead><tbody>';
   for(const m of unpaid){
    const amount=Number(annuality.quota_base)||0;
    html+='<tr><td>'+esc((m.cognome||'')+' '+(m.nome||''))+'</td><td>'+esc(m.codice_socio||'—')+'</td><td>'+esc(m.email||'E-mail mancante')+'</td><td>'+(amount>0?euro(amount):'Da definire')+'</td><td>'+(m.email?'<button class="mini primary" data-reminder="'+esc(m.id)+'">Invia sollecito</button>':'<span class="hint">Inserire e-mail</span>')+'</td></tr>';
   }
   html+='</tbody></table></div><p class="hint" style="margin-top:10px">L’invio avviene dal tuo account Google dell’associazione. Nessun messaggio viene spedito senza la conferma finale.</p>';
  }
  records.innerHTML=html;
  records.querySelectorAll('[data-reminder]').forEach(b=>b.onclick=async()=>{
   const m=unpaid.find(x=>x.id===b.dataset.reminder);if(!m||!m.email)return;
   const subject='Rinnovo quota associativa '+year+' – Insieme per Sestri Levante';
   const amount=Number(annuality.quota_base)||0;
   const message='Gentile '+(m.nome||'socio/a')+' '+(m.cognome||'')+',\n\n'
    +'ti ricordiamo che la quota associativa annuale '+year+' di Insieme per Sestri Levante risulta ancora da regolarizzare.\n'
    +'La quota associativa scade il 31 dicembre '+year+'.\n'
    +(amount>0?'Importo della quota: '+amount.toLocaleString('it-IT',{style:'currency',currency:'EUR'})+'.\n':'')
    +'Per conoscere le modalità di versamento puoi rispondere a questa e-mail.\n\n'
    +'Grazie per il tuo sostegno.\n'
    +'Associazione Insieme per Sestri Levante\n'
    +'Via Alessandro Manzoni 5, 16039 Sestri Levante (GE)\n'
    +'Codice fiscale 90088290102';
   b.disabled=true;b.textContent='Verifica…';
   try{
    const check=await db.functions.invoke('send-reminder',{body:{to:m.email,subject,message,send:false}});
    if(check.error)throw new Error(check.error.message||'Verifica non riuscita');
    if(check.data?.result!=='validated')throw new Error(check.data?.error||'Il messaggio non ha superato la verifica.');
    const preview='Destinatario: '+m.email+'\nOggetto: '+subject+'\n\n'+message+'\n\nConfermi l’invio effettivo di questa email?';
    if(!window.confirm(preview)){b.disabled=false;b.textContent='Invia sollecito';return}
    b.textContent='Invio…';
    const sent=await db.functions.invoke('send-reminder',{body:{to:m.email,subject,message,send:true}});
    if(sent.error)throw new Error(sent.error.message||'Invio non riuscito');
    if(sent.data?.result!=='success'||sent.data?.sent!==true)throw new Error(sent.data?.error||'Il servizio non ha confermato l’invio.');
    b.textContent='Inviata';b.disabled=true;
    alert('Email inviata a '+m.email+'.');
   }catch(err){
    b.disabled=false;b.textContent='Riprova';
    alert('Non è stato possibile inviare il sollecito: '+(err.message||'errore imprevisto'));
   }
  });
 }catch(err){records.innerHTML='<div class="empty">Caricamento solleciti non riuscito: '+esc(err.message||'errore imprevisto')+'</div>'}
}
async function load(){const table=state.tab,cfg=config[table];if(!cfg)return;if(table==='movimenti')return loadRendiconto();if(table==='solleciti')return loadSolleciti();const records=$('records');records.textContent='Caricamento soci…';const refs=cfg.cols.map(c=>c[2]).filter(t=>typeof t==='string'&&t.startsWith('fk:')).map(t=>t.slice(3));try{await fetchRefs(refs);if(table==='pagamenti'){const rr=await db.from('ricevute').select('id,pagamento_id,numero,stato').limit(1000);if(rr.error)throw rr.error;state.receipts=rr.data||[]}const {data,error}=await db.from(table).select('*').limit(500);if(error)throw error;state.rows=data||[];let memberRenewals={};let ledgerReceipts={};if(table==='soci'){
 const [payments,annualities,movements,categories]=await Promise.all([
  db.from('pagamenti').select('socio_id,data_pagamento,annualita_id').eq('categoria_id','5609abaa-9094-443f-abc7-1b549fcfee96').limit(5000),
  db.from('annualita').select('id,anno'),
  db.from('movimenti').select('id,annualita_id,data_movimento,descrizione,nominativo,importo,categoria_id,pagamento_id,numero_documento').limit(5000),
  db.from('categorie_movimenti').select('id,codice')
 ]);
 for(const r of [payments,annualities,movements,categories])if(r.error)throw r.error;
 const years=Object.fromEntries((annualities.data||[]).map(a=>[a.id,Number(a.anno)]));
 const ea1=new Set((categories.data||[]).filter(c=>c.codice==='EA1').map(c=>c.id));
 const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').trim().replace(/\\s+/g,' ');
 const people=state.rows.map(m=>({...m,_first:norm(m.nome),_last:norm(m.cognome)}));
 const paidById=new Map();
 const register=(id,year)=>{if(Number.isInteger(year)&&year>=2000&&year<=2100)paidById.set(id,Math.max(paidById.get(id)||0,year))};
 for(const p of payments.data||[]){const year=years[p.annualita_id]||Number(String(p.data_pagamento||'').slice(0,4));register(p.socio_id,year)}
 for(const m of movements.data||[]){
  if(!ea1.has(m.categoria_id)||Number(m.importo)<=0)continue;
  if(/donazion|liberalit|anticipo|rimborso/i.test(String(m.descrizione||'')))continue;
  if(!/quota|iscrizion|rinnov|tesser/i.test(String(m.descrizione||'')))continue;
  const year=years[m.annualita_id]||Number(String(m.data_movimento||'').slice(0,4));
  const label=norm(m.nominativo);if(!label)continue;
  // Il cognome da solo vale soltanto se individua un unico socio.
  const candidates=people.filter(p=>label===p._last||label===p._first+' '+p._last||label===p._last+' '+p._first);
  if(candidates.length===1){register(candidates[0].id,year);if(m.numero_documento&&/^[0-9]+$/.test(String(m.numero_documento).trim())&&(!ledgerReceipts[candidates[0].id]||year>ledgerReceipts[candidates[0].id].year))ledgerReceipts[candidates[0].id]={id:m.id,year,number:m.numero_documento};}
 }
 for(const [id,year] of paidById)memberRenewals[id]='Pagato '+year+' · scadenza 31/12/'+year;
}const cols=table==='soci'?[['codice_socio','Numero tessera'],['nome','Nome'],['cognome','Cognome'],['codice_fiscale','Codice fiscale'],['email','E-mail'],['__scadenza','Scadenza / rinnovo tessera']]:cfg.cols.filter(c=>c[0]!=='__file').slice(0,6);let html='<div class="crud-actions" style="margin-bottom:14px"><button class="primary" id="newrecord">'+(table==='soci'?'+ Nuovo socio':'+ Nuovo elemento')+'</button>'+(table==='documenti'?'<span class="hint" style="align-self:center">Archivio privato · max 20 MB per file</span>':'')+'</div>';if(!state.rows.length)html+='<div class="empty">Nessun dato registrato per ora.</div>';else{html+='<div class="tablewrap"><table><thead><tr><th>Azioni</th>'+cols.map(c=>'<th>'+esc(c[1])+'</th>').join('')+'</tr></thead><tbody>';for(const row of state.rows){html+='<tr><td><div class="crud-actions"><button class="mini" data-edit="'+esc(row.id)+'">Modifica</button><button class="mini danger" data-del="'+esc(row.id)+'">Elimina</button>'+(table==='documenti'&&row.file_path?'<button class="mini" data-file="'+esc(row.id)+'">Apri file</button>':'')+(table==='soci'&&ledgerReceipts[row.id]?'<button class="mini" data-ledger-pdf="'+esc(ledgerReceipts[row.id].id+':'+row.id)+'">Scarica ricevuta '+esc(ledgerReceipts[row.id].number)+'</button><button class="mini" data-ledger-email="'+esc(ledgerReceipts[row.id].id+':'+row.id)+'">Prepara email</button>':'')+(table==='pagamenti'?(()=>{const receipt=(state.receipts||[]).find(x=>x.pagamento_id===row.id);return receipt?'<span class="mini">Ricevuta '+esc(receipt.numero)+'</span><button class="mini" data-receipt-pdf="'+esc(row.id)+'">Scarica PDF</button><button class="mini" data-receipt-email="'+esc(row.id)+'">Prepara email</button>':'<button class="mini" data-receipt="'+esc(row.id)+'">Assegna ricevuta</button>'})():'')+'</div></td>'+cols.map(c=>{let v=row[c[0]];if(c[0].endsWith('_id')){const t=c[0]==='socio_id'?'soci':c[0]==='annualita_id'?'annualita':c[0]==='verbale_id'?'verbali':c[0]==='categoria_id'?'categorie_movimenti':'pagamenti';v=(state.refs[t]||[]).find(x=>x.id===v)?.label||'—'}if(c[0]==='tipo'&&table==='movimenti')v=({entrata:'Entrata',uscita:'Uscita',investimento:'Investimento',disinvestimento:'Disinvestimento',finanziamento_ricevuto:'Finanziamento ricevuto',rimborso_finanziamento:'Rimborso finanziamento',costo_figurativo:'Costo figurativo',provento_figurativo:'Provento figurativo'})[v]||v;if(c[0]==='__scadenza')v=memberRenewals[row.id]||'Nessun versamento EA1';return '<td>'+esc(v??'—')+'</td>'}).join('')+'</tr>'}html+='</tbody></table></div>'}records.innerHTML=html;$('newrecord').onclick=()=>modal(table);$('annualityrollover')?.remove();if(table==='annualita'){const annualities=(state.rows||[]).filter(a=>Number.isInteger(Number(a.anno))).sort((a,b)=>Number(b.anno)-Number(a.anno)),prior=annualities[0],year=prior?Number(prior.anno)+1:null;if(prior&&year&&!annualities.some(a=>Number(a.anno)===year)){const b=document.createElement('button');b.id='annualityrollover';b.className='btn';b.type='button';b.textContent='Crea nuova annualità';b.style.marginRight='8px';$('reload').before(b);b.onclick=()=>createAnnualityFromPrevious(prior,year,b)}}records.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>modal(table,state.rows.find(r=>r.id===b.dataset.edit)));records.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeRow(table,state.rows.find(r=>r.id===b.dataset.del)));records.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>openFile(state.rows.find(r=>r.id===b.dataset.file).file_path));records.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>createReceipt(b.dataset.receipt));records.querySelectorAll('[data-receipt-pdf]').forEach(b=>b.onclick=()=>downloadReceipt(b.dataset.receiptPdf));records.querySelectorAll('[data-receipt-email]').forEach(b=>b.onclick=()=>prepareReceiptEmail(b.dataset.receiptEmail));records.querySelectorAll('[data-ledger-pdf]').forEach(b=>b.onclick=()=>downloadReceipt('ledger:'+b.dataset.ledgerPdf));records.querySelectorAll('[data-ledger-email]').forEach(b=>b.onclick=()=>prepareReceiptEmail('ledger:'+b.dataset.ledgerEmail))}catch(err){records.innerHTML='<div class="empty">Caricamento non riuscito: '+esc(err.message||'errore imprevisto')+'</div>'}}


function activate(){const nav=$('nav');if(!nav||nav.dataset.crud==='1')return;nav.dataset.crud='1';nav.onclick=null;nav.insertAdjacentHTML('beforeend','<button data-tab="solleciti">Solleciti</button><button data-tab="categorie_movimenti">Categorie</button>');nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b||!config[b.dataset.tab])return;state.tab=b.dataset.tab;nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));$('title').textContent=config[state.tab].title;$('desc').textContent=state.tab==='annualita'?'Gestione annualità e riporto saldi':state.tab==='soci'?'Anagrafica soci':state.tab==='solleciti'?'Promemoria rinnovo quota annuale':config[state.tab].title;load()});$('reload').onclick=load;const original=$('nav').querySelector('[data-tab="soci"]');if(original){original.classList.add('active');load()}}
window.activateGestionale=activate;

})();