# Migrazione gestionale: criteri di parità e rilascio

Riferimento funzionale: `gestionale/index.html` e `gestionale/app.js` del ramo `main`. Non modificare il ramo `main` prima del collaudo e del via libera esplicito.

## Parità richiesta

- [ ] Intestazione, navigazione, pannelli e stili identici all'originale.
- [ ] Soci: colonne Numero tessera, Nome, Cognome, Codice fiscale, E-mail, Scadenza / rinnovo tessera; azioni di modifica ed eliminazione; esportazione Excel del libro soci.
- [ ] Anagrafica soci: stessi 15 campi del modulo originale e medesime validazioni.
- [ ] Annualità: quote, saldi, imposte e relative funzioni.
- [ ] Pagamenti: archivio storico e selezione annualità; corretta correlazione ai movimenti.
- [ ] Rendiconto: movimenti, categorie, annualità, controlli e riepiloghi.
- [ ] Archivio documenti: verbali assemblea, verbali direttivo, altri documenti, file allegati e download.
- [ ] Ricevute e PDF: contenuto, numerazione, modello, impaginazione, generazione e download equivalenti.
- [ ] Collegamenti fra soci, iscrizioni, annualità, pagamenti, documenti, verbali e ricevute conservati.
- [ ] Confronto quantitativo e per contenuto dei dati e degli allegati tra originale e NAS.
- [ ] Accesso dal sito pubblico reindirizzato all'HTTPS Tailscale del NAS solo dopo collaudo e approvazione.

## Stato verificato sul NAS il 17/11/2026

- [x] Anteprima HTTPS privata attivata su porta 3003, backup PostgreSQL creato.
- [x] Login, visualizzazione elenco soci e logout verificati nel browser dall'utente.
- [ ] Creazione/modifica soci: endpoint presenti, ma scritture reali non collaudate.
- [ ] Parità completa delle pagine, funzioni e documenti: NON raggiunta.
- [ ] Allineamento definitivo dati e allegati: NON verificato.
- [ ] Sostituzione del link del sito pubblico: NON effettuata.

## Regole di sicurezza del rilascio

1. Nessuna modifica automatica al sito pubblico o a Supabase.
2. Nessun inserimento o modifica di dati reali per i test; usare fixture isolate.
3. Test automatici su sintassi, API e UI prima di distribuire.
4. Backup verificato prima di ogni attivazione, con rollback in caso di errore.
5. Ultima sincronizzazione dati/allegati e controllo ricevute prima del passaggio.
6. La migrazione è completa solo dopo il confronto pagina per pagina e funzione per funzione.
