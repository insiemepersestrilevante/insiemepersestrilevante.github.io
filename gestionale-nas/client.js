/* Client di prova NAS, esclusivamente same-origin. Non caricare credenziali su GitHub Pages. */
(() => {
  'use strict';
  const tables = Object.freeze(['soci','annualita','categorie_movimenti','verbali','iscrizioni','pagamenti','documenti','movimenti','ricevute']);
  const allowed = new Set(tables);
  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', ...(options.headers || {}) },
      cache: 'no-store'
    });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('Risposta API non JSON (HTTP ' + response.status + ')');
    const data = await response.json();
    if (!response.ok) throw new Error(data.errore || 'Errore API HTTP ' + response.status);
    return data;
  }
  const api = Object.freeze({
    tables,
    session: () => request('/api/sessione'),
    login: (password) => request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    }),
    logout: () => request('/api/logout', { method: 'POST' }),
    read: (table) => {
      if (!allowed.has(table)) return Promise.reject(new Error('Tabella non consentita'));
      return request('/api/' + table);
    }
  });
  window.gestionaleNasApi = api;
})();
