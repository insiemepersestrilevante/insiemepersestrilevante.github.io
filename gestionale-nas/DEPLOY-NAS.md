# Piano di distribuzione NAS — ambiente separato

**Non eseguire modifiche a produzione senza verifica.** Il sito GitHub Pages su `main` continua a usare Supabase. Questo branch contiene un prototipo di sola lettura, non il gestionale completo.

## Architettura prevista

- Browser → URL HTTPS privato sul NAS/Tailscale → stesso origin per pagina e `/api/*`.
- Node/Express → PostgreSQL sulla rete Docker privata `rete-gestionale`.
- Niente password, chiavi o IP privati dentro i file pubblici di GitHub.
- Non pubblicare la porta 3001/3002 su Internet; attualmente i server di prova ascoltano solo su `127.0.0.1` **dentro il container**.
- La porta 3000 ospita ancora il server di prova originale; non sostituirlo finché non c'è un piano di ripristino.

## Verifiche preliminari in SSH

Comandi di sola lettura, da eseguire **sul NAS**, non nel container:

```sh
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker exec server-gestionale node --check /node/app/server-api.js
docker exec server-gestionale node --check /node/app/api-tabelle.js
docker exec server-gestionale node --check /node/app/api-soci.js
```

Per il test degli endpoint senza autenticazione, copiare prima `verifica-api-nas.cjs` in `/Volume1/Docker/server-gestionale/` sul NAS e poi eseguire:

```sh
docker exec server-gestionale node /node/app/verifica-api-nas.cjs
```

Il test è **solo lettura**: si aspetta `HTTP 401` JSON su sessione e tutte le nove tabelle. Non verifica le credenziali, non espone dati, non sostituisce il test autenticato già completato.

## Requisiti prima di abilitare il browser

1. HTTPS privato realmente funzionante e certificato valido, con pagina e API sullo stesso origin.
2. Cookie `Secure` e configurazione proxy affidabile; sessioni persistenti e test di login/logout.
3. Identità amministratore, limitazione tentativi, protezioni CSRF per mutazioni future.
4. Backup del database e verifica del ripristino; nessuna interruzione di Supabase.
5. Test UI completa e CRUD prima di migrare il sito principale.

## Stato attuale

Il frontend `index.html` è una **anteprima read-only**: non gestisce ancora modifica, stampa, archivio o documenti. Il codice non è stato installato sul NAS. L'accesso SSH aperto nel terminale Windows dell'amministratore non concede accesso SSH diretto a ChatGPT.
