#!/usr/bin/env bash
# Attivazione controllata anteprima NAS (non tocca porta 3000 o Supabase).
set -Eeuo pipefail
ROOT=/Volume1/Docker/server-gestionale
STAGE="$ROOT/aggiornamento-nas"
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="$ROOT/backup-attivazione-$STAMP"
mkdir -p "$BACKUP/anteprima-nas"
for name in index.html client.js server-anteprima-nas.js sicurezza-nas.js api-soci-scrittura.js; do
  test -s "$STAGE/$name" || { echo "Manca $name: rieseguire preparazione"; exit 1; }
done
for name in autenticazione.js api-soci.js api-tabelle.js server-anteprima.js admin.json; do
  test -s "$ROOT/$name" || { echo "Manca componente NAS: $name"; exit 1; }
done
# Verifica che le dipendenze siano compatibili PRIMA di fermare il vecchio processo.
docker exec server-gestionale node -e "
const {createRequire}=require('node:module');
const appRequire=createRequire('/node/app/server.js');
const a=appRequire('/node/app/autenticazione.js');
if(typeof a.verificaPassword!=='function') process.exit(31);
for(const m of ['express','express-session','connect-pg-simple','pg','express-rate-limit']) appRequire(m);
for(const f of ['api-soci.js','api-tabelle.js']) if(typeof appRequire('/node/app/'+f)!=='function') process.exit(32);
" || { echo "Moduli NAS non compatibili: nessuna modifica eseguita"; exit 1; }
# Backup reale PostgreSQL prima di abilitare qualsiasi scrittura.
docker exec postgres-associazione pg_dump -U associazione -d associazione_db -Fc > "$BACKUP/associazione_db.dump"
test -s "$BACKUP/associazione_db.dump" || { echo "Backup database non riuscito"; exit 1; }
# Il file dump è sul NAS host, non dentro il container: verifica con pg_restore via stdin.
docker exec -i postgres-associazione pg_restore -l < "$BACKUP/associazione_db.dump" > "$BACKUP/backup-indice.txt" || { echo "Backup non leggibile"; exit 1; }
grep -q 'TABLE DATA' "$BACKUP/backup-indice.txt" || { echo "Backup senza tabelle dati: attivazione annullata"; exit 1; }
for name in server-anteprima.js server-anteprima-nas.js sicurezza-nas.js api-soci-scrittura.js; do
  if test -f "$ROOT/$name"; then cp -p "$ROOT/$name" "$BACKUP/$name"; fi
done
for name in index.html client.js; do
  if test -f "$ROOT/anteprima-nas/$name"; then cp -p "$ROOT/anteprima-nas/$name" "$BACKUP/anteprima-nas/$name"; fi
done
# Moduli copiati in root: require('./...') usa questa directory.
cp "$STAGE/sicurezza-nas.js" "$ROOT/sicurezza-nas.js"
cp "$STAGE/api-soci-scrittura.js" "$ROOT/api-soci-scrittura.js"
cp "$STAGE/server-anteprima-nas.js" "$ROOT/server-anteprima-nas.js"
mkdir -p "$ROOT/anteprima-nas"
# La UI viene sostituita solo dopo che il server è avviato.
OLD_PID=$(docker exec server-gestionale node -e "
const fs=require('fs');
for(const p of fs.readdirSync('/proc')){
 if(!Number.isInteger(Number(p))||Number(p)<=1)continue;
 try{
  const cmd=fs.readFileSync('/proc/'+p+'/cmdline','utf8').split(String.fromCharCode(0)).filter(Boolean);
  if(cmd.some(x=>x==='/node/app/server-anteprima.js'||x==='/node/app/server-anteprima-nas.js'))console.log(p);
 }catch{}
}" | head -n1)
restore() {
  echo "Avvio non riuscito: ripristino dell'anteprima precedente..."
  for name in server-anteprima-nas.js sicurezza-nas.js api-soci-scrittura.js; do
    if test -f "$BACKUP/$name"; then cp -p "$BACKUP/$name" "$ROOT/$name"; else rm -f "$ROOT/$name"; fi
  done
  for name in index.html client.js; do
    if test -f "$BACKUP/anteprima-nas/$name"; then cp -p "$BACKUP/anteprima-nas/$name" "$ROOT/anteprima-nas/$name"; fi
  done
  docker exec -d server-gestionale node /node/app/server-anteprima.js || true
}
if test -n "$OLD_PID"; then
  docker exec server-gestionale node -e "process.kill(Number(process.argv[1]),'SIGTERM')" "$OLD_PID"
  sleep 2
else
  IN_USE=$(docker exec server-gestionale node -e "require('http').get('http://127.0.0.1:3003/api/sessione',r=>{console.log('YES');r.resume()}).on('error',()=>console.log('NO'))" 2>/dev/null || true)
  if test "$IN_USE" = YES; then echo "Porta 3003 occupata da processo sconosciuto: attivazione annullata"; exit 1; fi
  echo "Nessun processo anteprima rilevato: procedo con avvio separato."
fi
trap restore ERR
docker exec -d server-gestionale node /node/app/server-anteprima-nas.js
READY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  CODE=$(docker exec server-gestionale node -e "require('http').get('http://127.0.0.1:3003/api/sessione',r=>{console.log(r.statusCode);r.resume()}).on('error',()=>console.log('ERR'))" 2>/dev/null || true)
  if test "$CODE" = 401; then READY=1; break; fi
  sleep 1
done
if test "$READY" -ne 1; then false; fi
cp "$STAGE/index.html" "$ROOT/anteprima-nas/index.html"
cp "$STAGE/client.js" "$ROOT/anteprima-nas/client.js"
trap - ERR
echo "ATTIVAZIONE COMPLETATA. Anteprima NAS su HTTPS privato, porta 3003."
echo "Backup database e file: $BACKUP"
echo "Server originale porta 3000 e sito Supabase invariati."
echo "Verificare login, elenco soci, logout; non salvare dati reali prima del collaudo browser."
