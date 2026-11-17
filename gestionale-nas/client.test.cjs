// Eseguire: node --test gestionale-nas/client.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'client.js'), 'utf8');
function setup(responses = []) {
  const calls = [];
  const context = {
    window: {},
    fetch: async (url, options) => {
      calls.push({ url, options });
      const response = responses.shift() || { status: 200, data: [] };
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        headers: { get: () => response.type || 'application/json' },
        json: async () => response.data
      };
    }
  };
  vm.runInNewContext(source, context);
  return { api: context.window.gestionaleNasApi, calls };
}
test('lettura delle nove tabelle usa soltanto path relativi e cookie same-origin', async () => {
  const { api, calls } = setup();
  assert.equal(api.tables.length, 9);
  for (const table of api.tables) await api.read(table);
  assert.deepEqual(calls.map(c => c.url), Array.from(api.tables, t => '/api/' + t));
  assert.ok(calls.every(c => c.options.credentials === 'same-origin'));
  assert.ok(calls.every(c => c.options.cache === 'no-store'));
});
test('tabella non consentita non produce richieste', async () => {
  const { api, calls } = setup();
  await assert.rejects(api.read('../admin'));
  assert.equal(calls.length, 0);
});
test('login usa POST JSON e non include password nella URL', async () => {
  const { api, calls } = setup([{ status: 200, data: { risultato: 'ACCESSO OK' } }]);
  await api.login('password-fittizia');
  assert.equal(calls[0].url, '/api/login');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(JSON.parse(calls[0].options.body).password, 'password-fittizia');
});
test('errori HTTP non vengono scambiati per successo', async () => {
  const { api } = setup([{ status: 401, data: { errore: 'Accesso non autorizzato' } }]);
  await assert.rejects(api.read('soci'), /Accesso non autorizzato/);
});
test('risposte non JSON vengono rifiutate', async () => {
  const { api } = setup([{ status: 200, data: [], type: 'text/html' }]);
  await assert.rejects(api.read('soci'), /non JSON/);
});
