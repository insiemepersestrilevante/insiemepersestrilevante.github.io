# Gestionale TerraMaster — sviluppo isolato

Questo branch **non modifica** il gestionale pubblicato in `main`.

## Stato verificato

Le nove API di sola lettura sono state provate all'interno del container NAS (porta di prova 3002), con sessione autenticata e risposta HTTP 200. Non sono ancora pronte per l'accesso web esterno.

## Modulo client

`client.js` è il primo modulo JavaScript per il nuovo backend. Offre `session()`, `login(password)`, `logout()` e `read(tabella)` sulle nove tabelle consentite. Non contiene IP NAS, password o segreti. Usa soltanto richieste **same-origin**, cookie di sessione e JSON. Non è ancora collegato alla UI esistente.

**Non usare il modulo da GitHub Pages per inserire credenziali.** Il nuovo frontend deve essere distribuito tramite lo stesso host HTTPS dell'API NAS. L'attuale `gestionale/index.html` usa ancora Supabase.

## Prima della migrazione

1. Rendere persistente il nuovo server API come processo principale del container, dopo i test.
2. Attivare HTTPS, cookie `Secure`, protezione CSRF sulle richieste di modifica, controllo dell'identità amministratore e accesso limitato.
3. Implementare API di scrittura con validazione, permessi e transazioni; verificare i file dell'archivio.
4. Adattare e collaudare l'interfaccia completa, comprese ricevute, documenti, pagamenti e rendiconti.
5. Eseguire backup e test di ripristino prima del passaggio definitivo. Mantenere Supabase funzionante fino alla verifica finale.

## Anteprima isolata

`index.html` è una **nuova interfaccia di sola lettura**, separata dal gestionale originale. Mostra le nove tabelle con login, logout, stato sessione, selezione e aggiornamento dei record. I valori delle celle vengono inseriti come testo, senza interpretare HTML proveniente dal database.

Il browser chiama `/api/...` sullo **stesso dominio** che serve la pagina. Perciò non funzionerà da GitHub Pages: prima serve una pubblicazione privata HTTPS sul NAS con proxy verso l'API. **Non immettere password nella pagina di anteprima aperta su github.io.**

La pagina non ha pulsanti di modifica o eliminazione e non implementa le funzioni avanzate dell'interfaccia originale.

## Test del client

Da una copia locale del repository con Node installato:

```bash
node --test gestionale-nas/client.test.cjs
```

I test controllano il vincolo same-origin, le nove tabelle consentite, il login POST e la gestione degli errori. **I test non sostituiscono una prova reale sul NAS.**

## Sicurezza e limiti

- Le API NAS testate sono attualmente su porta 3002, raggiungibile solo nel container; non sono pubblicate sul sito.
- Il backend attuale accetta la password senza verificare l'email: prima dell'uso finale va completato il controllo dell'identità amministratore.
- Il cookie attuale ha `secure:false` perché usato solo in HTTP locale: in HTTPS va impostato `secure:true`, con corretta gestione del reverse proxy.
- Proteggere da CSRF le future operazioni di scrittura e mantenere i file dei soci accessibili solo dopo autenticazione.
- Non attivare scritture né migrare la UI originale prima di aver verificato gli schemi, i vincoli e i flussi di ricevute e documenti.
