# Copia diretta del gestionale originale — area di lavoro, NON distribuire

- `app.js`: copia byte-per-byte del file `gestionale/app.js` dal ramo `main` al momento dell'importazione (84.312 caratteri). Include la logica originale di schermate, PDF, ricevute, Excel, rendiconto e documenti.
- `index.html`: copia della pagina originale con **solo** due modifiche: rimozione dello script CDN Supabase e sostituzione di `supabase.createClient(...)` con `window.gestionaleNasCompat`.
- Non esiste ancora `nas-adapter.js`: la pagina si arresta intenzionalmente, anziché collegarsi per errore al progetto Supabase. **Non pubblicare né attivare questa directory** finché l'adapter non implementa tutte le funzioni usate dall'originale e i test non sono superati.
- Non sostituire `gestionale-nas/index.html` dell'anteprima attiva, né modificare `main`.
- Prossimo passaggio: adapter compatibile per query PostgREST, sessione NAS, Storage privato ed Edge Functions, con backend autenticato e test. Nessuna password o chiave privilegiata nel browser.
