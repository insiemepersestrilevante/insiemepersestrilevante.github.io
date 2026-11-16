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
