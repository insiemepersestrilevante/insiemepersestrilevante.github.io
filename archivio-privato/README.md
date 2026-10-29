# Archivio privato — fase di test

Questa cartella contiene una prima interfaccia statica per autenticarsi con Supabase, elencare i file del bucket privato, caricare file e scaricarli. È separata dalla pagina `admin/` esistente e questa modifica è sul branch `sviluppo-archivio-privato`, non su `main`.

## Prima di usarla

1. In Supabase apri **Project Settings → API** (la voce può essere chiamata **API Keys**).
2. Copia la chiave **publishable** oppure la vecchia chiave **anon/public**. Non copiare mai `service_role`, `secret` o altre chiavi private.
3. Apri `archivio-privato/index.html` su questo branch e sostituisci il valore di `SUPABASE_ANON_KEY` con la chiave publishable/anon.
4. Salva la modifica solo sul branch `sviluppo-archivio-privato`.

L'URL del progetto e il nome del bucket sono già inseriti. La chiave publishable/anon è pensata per il frontend, ma **non sostituisce le policy RLS**: la sicurezza dei file dipende dalle policy di Storage.

## Test locale consigliato

Prima di pubblicare la pagina, scarica il file `index.html` dal branch e aprilo tramite un piccolo server HTTP locale, oppure usa una preview GitHub Pages configurata per il branch se disponibile. Aprire il file direttamente con `file://` può causare problemi di autenticazione/redirect.

- Accedi con l'account amministratore creato in Supabase.
- Verifica che l'elenco mostri solo file autorizzati.
- Carica e scarica un file di prova non sensibile.
- Esci e controlla che l'interfaccia ritorni alla schermata di accesso.
- Prova una sessione senza autenticazione: non deve poter elencare, caricare o scaricare file.
- Verifica anche con un secondo account autenticato non autorizzato, se possibile: le policy devono negargli l'accesso.

## Redirect URL in Supabase

In **Authentication → URL Configuration**, configura solo gli URL effettivamente usati nei test e nell'eventuale futura pubblicazione. Non aggiungere redirect generici o domini non controllati. Il login con password non richiede una pagina di registrazione pubblica.

## Avvertenze importanti

- Il bucket `archivio-associazione` deve restare **privato**.
- Le policy attuali limitano le operazioni Storage all'UUID amministratore configurato. Non allargare le policy a tutti gli utenti `authenticated`.
- La chiave `service_role` o una secret key non deve mai essere inserita in HTML, JavaScript, repository GitHub o browser.
- La pagina HTML/JavaScript è pubblica come codice; sono i controlli di autenticazione e le policy Supabase a proteggere i documenti.
- Il file di prova caricato dal pannello amministrativo Supabase non dimostra da solo che le policy funzionino dal browser. Serve il test tramite questa interfaccia.
- Non caricare documenti reali o dati personali finché i test di autorizzazione non sono superati.
- Questa è una prima versione di test, non ancora una soluzione pronta per l'uso quotidiano. L'elenco iniziale mostra i file nella radice del bucket e non gestisce ancora cartelle, ricerca, categorie o cancellazione.

## File presenti

- `index.html` — interfaccia di accesso e gestione dei file.
- `README.md` — queste istruzioni.
