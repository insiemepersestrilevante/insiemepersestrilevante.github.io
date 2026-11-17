# Migrazione diretta del gestionale originale — inventario tecnico

## Decisione

Il riferimento unico dell'interfaccia è il codice **originale** del ramo `main`:
- `gestionale/index.html` — layout, autenticazione Supabase attuale e statistiche.
- `gestionale/app.js` — CRUD, rendiconto, libro soci, rinnovi, ricevute, PDF, allegati e invio email.

NON ricreare la UI con `gestionale-nas/index.html`. Quella è un'anteprima diagnostica, non la base del gestionale finale.

## Dipendenze da sostituire, non schermate da riscrivere

Inventario ricavato dal codice originale `gestionale/app.js`:
- 39 chiamate `db.from(...)` al Data API Supabase; richiedono adapter NAS compatibile con le catene di query e con le risposte `{data,error,count}`.
- 7 chiamate `db.storage.from(...)`; richiedono storage privato sul NAS per upload, remove, info, URL temporanei e archivio PDF.
- 4 chiamate `db.functions.invoke('send-reminder',...)`; richiedono sostituto server-side per verifica e invio email.
- Il PDF delle ricevute è già prodotto dal frontend originale: conservare le funzioni `receiptPdf`, `downloadReceipt`, `createReceipt`, `openArchivedReceipt`, non riscriverne l'impaginazione.
- L'esportazione Excel del libro soci è già nel frontend originale: conservare `exportLibroSoci`.
- `gestionale/index.html` usa `supabase.auth` per login/logout/sessione: sostituire solo il provider di autenticazione, conservando la struttura grafica.
- Conservare UUID e relazioni delle righe: nascondere gli ID tecnici nella UI non significa rigenerarli nel database.

## Precondizioni per il passaggio

1. Confrontare schema completo, vincoli, funzioni e contenuti del PostgreSQL NAS con Supabase; le nove tabelle finora osservate non provano che sia tutto completo.
2. Inventariare e copiare tutti gli oggetti del bucket privato `archivio-associazione`, verificando dimensioni e checksum.
3. Verificare l'eventuale servizio email e le Edge Functions.
4. Servire copia integrale dei file frontend originali dal NAS, applicando soltanto l'adapter necessario alle API locali.
5. Testare login, CRUD, PDF, Excel, archivi e rendiconto con dati isolati.
6. Solo dopo la sincronizzazione finale e l'approvazione dell'utente, aggiornare il link del sito pubblico.

## Materiale provvisorio

`gestionale-nas/index.html`, `client.js` e i relativi endpoint sono strumenti dell'anteprima attualmente attiva: **non eliminarli finché il server li usa**. Non copiare il loro layout nel gestionale definitivo. Il server, le sessioni, il backup e l'accesso HTTPS NAS già funzionanti possono essere riutilizzati. Evitare cancellazioni di database, backup e dati di produzione.

## Stato

Questo documento è un inventario tecnico e un cambio di architettura, non una dichiarazione di migrazione completata. Non sono state effettuate scritture sul database NAS o su Supabase.
