# Trasferimento diretto del gestionale originale — NON ancora distribuibile

- `app.js`: copia integrale dell'originale (`gestionale/app.js` su `main`) con schermate, PDF, ricevute, Excel, rendiconto e archivio.
- `index.html`: interfaccia originale, con sola sostituzione della connessione Supabase con `nas-adapter.js`.
- `nas-adapter.js`: lettura delle nove tabelle tramite API NAS, login/logout NAS, inserimento e modifica dei soci. Le altre scritture sono predisposte ma bloccate finché `window.NAS_ORIGINALE_SCRITTURE_VERIFICATE` non è esplicitamente `true`.
- `api-originale-scrittura.js`: backend delle altre tabelle, registrato dal server soltanto con `NAS_ORIGINALE_SCRITTURE_VERIFICATE=true` nell'ambiente server. Prima dell'attivazione verificare schema PostgreSQL reale, trigger, vincoli, dati, backup e autorizzazioni.
- `api-originale-archivio.js`: archivio NAS privato con autenticazione, limite 20 MB, percorso controllato, upload, download, eliminazione e controllo esistenza. Si registra soltanto con `NAS_ORIGINALE_ARCHIVIO_VERIFICATO=true` e `NAS_ORIGINALE_ARCHIVIO_ROOT` impostata a cartella assoluta privata. L'adapter richiede anche `window.NAS_ORIGINALE_ARCHIVIO_VERIFICATO=true`. Non pubblicare la cartella file con `express.static`.
- `send-reminder`: **non migrata**, invio email bloccato. Verificare SMTP e protezioni antispam prima di implementarla.
- `delete`: **non migrata** per tabelle; nessuna cancellazione database consentita dalla nuova copia.
- La compatibilità Storage `createSignedUrl` restituisce un URL NAS accessibile soltanto con sessione attiva, **non** un URL firmato condivisibile. Verificare questo comportamento nel browser.
- Le API `info` e l'archiviazione delle ricevute supportano il percorso originale `<admin>/ricevute/<anno>/<uuid>.pdf`, da collaudare con documenti reali.
- Non sono state eseguite verifiche sul database NAS né test end-to-end. I test automatici nel repository non dimostrano da soli la riuscita della migrazione.
- Non modificare `main`, l'anteprima NAS attiva, il database o i file originali finché backup, confronto dati e collaudo completo non siano superati.

**Blocchi per il passaggio definitivo:** schema e conteggi aggiornati di tutte le tabelle; inventario e copia di tutti gli allegati Supabase; prova di login, CRUD, PDF, ricevute, Excel, rendiconto, archivio e email; backup e procedura di ritorno alla versione precedente; approvazione dell'utente.
