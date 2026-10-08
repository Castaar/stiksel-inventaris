import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { api, startApp, stopApp } from './setup.js';

let client;
const realFetch = globalThis.fetch;
let geminiRequests;

// Replies from the fake Gemini, in order; every other request goes to the real fetch
function fakeGemini(...replies) {
  geminiRequests = [];
  vi.stubGlobal('fetch', async (url, init) => {
    if (!String(url).includes('generativelanguage.googleapis.com')) return realFetch(url, init);
    geminiRequests.push(JSON.parse(init.body));
    const parts = replies.shift();
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] }), { status: 200 });
  });
}

beforeAll(async () => {
  client = await startApp();
  process.env.GEMINI_API_KEY = 'test-key';
});
afterAll(stopApp);
afterEach(() => vi.unstubAllGlobals());
beforeEach(async () => {
  await client.db('winkel').dropDatabase();
  await client.db('stiksel_inventaris').collection('ask_usage').deleteMany({});
});

test('answers with the products found by the search function, shown as cards', async () => {
  const { insertedIds } = await client.db('winkel').collection('hoodies').insertMany([
    { refnr: 'jh001', modelnaam: 'college hoodie', kleur: 'navy', maat: 'm', stock: 12 },
    { refnr: 'jh001', modelnaam: 'college hoodie', kleur: 'fire red', maat: 'm', stock: 4 },
    { refnr: 'jh001', modelnaam: 'college hoodie', kleur: 'navy', maat: 'l', stock: 0 },
  ]);
  const key = `winkel:hoodies:${insertedIds[0]}`;
  fakeGemini(
    [{ functionCall: { name: 'zoek_producten', args: { zoektermen: ['hoodie'], kleur: 'blauw' } } }],
    [{ functionCall: { name: 'toon_producten', args: { ids: [key, 'winkel:hoodies:verzonnen'] } } }],
    [{ text: 'Er zijn 12 navy hoodies in M.' }]
  );

  const { status, data } = await api('ask', { body: { question: 'Blauwe hoodies?' } });
  expect(status).toBe(200);
  // A made-up id never reaches the page
  expect(data).toEqual({ answer: 'Er zijn 12 navy hoodies in M.', products: [key] });

  const result = geminiRequests[1].contents.at(-1).parts[0].functionResponse;
  expect(result.name).toBe('zoek_producten');
  // "blauw" finds navy, the empty size L is left out
  expect(result.response).toMatchObject({ aantal_varianten: 1, totaal_stuks: 12, producten: [{ id: key, kleur: 'navy', maat: 'm' }] });
});

test('no products when nothing is shown', async () => {
  fakeGemini([{ text: 'Geen stock: dit is niet mogelijk met de huidige stock.' }]);
  const { data } = await api('ask', { body: { question: '500 gele polo’s?' } });
  expect(data).toEqual({ answer: 'Geen stock: dit is niet mogelijk met de huidige stock.', products: [] });
});

test('stops at the daily limit', async () => {
  await client.db('stiksel_inventaris').collection('ask_usage').insertOne({ date: new Date().toISOString().slice(0, 10), count: 150 });
  fakeGemini([{ text: 'mag niet' }]);
  const { status } = await api('ask', { body: { question: 'test' } });
  expect(status).toBe(429);
  expect(geminiRequests).toHaveLength(0);
});

test('refuses an empty or too long question', async () => {
  expect((await api('ask', { body: { question: ' ' } })).status).toBe(400);
  expect((await api('ask', { body: { question: 'x'.repeat(501) } })).status).toBe(400);
});
