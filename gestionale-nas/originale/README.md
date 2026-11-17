# Copia diretta del gestionale originale — area di lavoro, NON distribuire

- `app.js`: copia byte-per-byte del file `gestionale/app.js` dal ramo `main` al momento dell'importazione (84.312 caratteri). Include la logica originale di schermate, PDF, ricevute, Excel, rendiconto e documenti.
- `index.html`: copia della pagina originale con **solo** due modifiche: rimozione dello script CDN Supabase e sostituzione di `supabase.createClient(...)` con `window.gestionaleNasCompat`.
- `nas-adapter.js` è presente: implementa lettura delle nove tabelle e inserimento/modifica dei soci tramite le API NAS già predisposte e CSRF. Elimina, altre scritture, Storage e invio email restano bloccati. **Non pubblicare né attivare questa directory** finché l'adapter non implementa tutte le funzioni usate dall'originale e i test non sono superati.
- Non sostituire `gestionale-nas/index.html` dell'anteprima attiva, né modificare `main`.
- Prossimo passaggio: completare CRUD di tutte le tabelle, Storage privato, invio email, verifiche dati e collaudi su NAS. I test aggiunti al repository non equivalgono a test eseguiti o a un collaudo sul NAS. Nessuna password o chiave privilegiata nel browser.
