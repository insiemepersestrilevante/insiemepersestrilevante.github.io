#!/usr/bin/env bash
# Preparazione sicura dell'anteprima NAS. Non riavvia container e non attiva scritture.
set -Eeuo pipefail
ROOT=/Volume1/Docker/server-gestionale
STAGE="$ROOT/aggiornamento-nas"
BACKUP="$ROOT/backup-anteprima-$(date +%Y%m%d-%H%M%S)"
BASE="https://raw.githubusercontent.com/insiemepersestrilevante/insiemepersestrilevante.github.io/gestionale-terramaster/gestionale-nas"
test -d "$ROOT" || { echo "Cartella server non trovata"; exit 1; }
command -v docker >/dev/null || { echo "Docker non disponibile"; exit 1; }
command -v curl >/dev/null || { echo "curl non disponibile"; exit 1; }
mkdir -p "$STAGE" "$BACKUP"
for name in client.js index.html sicurezza-nas.js sicurezza-nas.test.cjs interfaccia-nas.test.cjs api-soci-scrittura.js api-soci-scrittura.test.cjs api-originale-lettura.js api-originale-lettura.test.cjs api-originale-scrittura.js api-originale-scrittura.test.cjs api-originale-archivio.js api-originale-archivio.test.cjs verifica-schema-originale.js verifica-schema-originale.test.cjs server-anteprima-nas.js; do
  curl --fail --silent --show-error --location --max-time 30 "$BASE/$name" -o "$STAGE/$name"
  test -s "$STAGE/$name"
done
for name in server-anteprima-nas.js sicurezza-nas.js api-soci-scrittura.js api-originale-lettura.js api-originale-scrittura.js api-originale-archivio.js verifica-schema-originale.js client.js; do
  docker exec server-gestionale node --check "/node/app/aggiornamento-nas/$name"
done
docker exec server-gestionale node --test /node/app/aggiornamento-nas/sicurezza-nas.test.cjs /node/app/aggiornamento-nas/api-soci-scrittura.test.cjs /node/app/aggiornamento-nas/interfaccia-nas.test.cjs /node/app/aggiornamento-nas/api-originale-lettura.test.cjs /node/app/aggiornamento-nas/api-originale-scrittura.test.cjs /node/app/aggiornamento-nas/api-originale-archivio.test.cjs /node/app/aggiornamento-nas/verifica-schema-originale.test.cjs
for name in server-anteprima.js api-soci.js api-tabelle.js autenticazione.js admin.json; do
  if test -f "$ROOT/$name"; then cp -p "$ROOT/$name" "$BACKUP/$name"; fi
done
echo "PREPARAZIONE COMPLETATA: codice scaricato, sintassi e test superati."
echo "Backup file di servizio: $BACKUP"
echo "Anteprima in esecuzione NON modificata; nessuna scrittura dati eseguita."
