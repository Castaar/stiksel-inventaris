import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { ObjectId } from 'mongodb';
import { api, startApp, stopApp } from './setup.js';

let client;
const winkel = () => client.db('winkel');
const hoodies = () => winkel().collection('hoodies');

beforeAll(async () => {
  client = await startApp();
});

afterAll(stopApp);

beforeEach(async () => {
  for (const db of ['winkel', 'stiksel_inventaris']) {
    await client.db(db).dropDatabase();
  }
  // A database only exists once it has a collection
  await winkel().createCollection('hoodies');
});

const product = (fields = {}) => ({ refnr: 'jh001', modelnaam: 'college hoodie', merk: 'just hoods', kleur: 'navy', gender: 'unisex', maat: 'm', stock: 10, akp: 12.5, ...fields });

describe('products/add', () => {
  test('stores the fields in lower case with numbers', async () => {
    const { status, data } = await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ refnr: 'JH001', kleur: 'Navy', stock: '10', akp: '12,5' }) } });
    expect(status).toBe(201);
    const doc = await hoodies().findOne({ _id: new ObjectId(data.productId) });
    expect(doc).toMatchObject({ refnr: 'jh001', kleur: 'navy', stock: 10, akp: 12.5, lang_in_stock: false });
    expect(doc.updated_at).toBeInstanceOf(Date);
  });

  test('refuses the same variant twice and points to the existing one', async () => {
    const first = await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product() } });
    const second = await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ kleur: 'NAVY ' }) } });
    expect(second.status).toBe(409);
    expect(second.data.productId).toBe(first.data.productId);
    // Another size is fine
    expect((await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ maat: 'l' }) } })).status).toBe(201);
  });

  test('rejects bad input and unknown databases', async () => {
    expect((await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ refnr: '' }) } })).status).toBe(400);
    expect((await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ stock: 'veel' }) } })).status).toBe(400);
    expect((await api('products/add', { body: { db: 'winkel', collection: 'hoodies', ...product({ akp: -1 }) } })).status).toBe(400);
    expect((await api('products/add', { body: { db: 'bestaatniet', collection: 'hoodies', ...product() } })).status).toBe(404);
    expect((await api('products/add', { body: { db: 'admin', collection: 'hoodies', ...product() } })).status).toBe(400);
    expect((await api('products/add', { body: { db: 'winkel', collection: '$where', ...product() } })).status).toBe(400);
    expect((await api('products/add', { method: 'GET' })).status).toBe(405);
  });
});

describe('products/adjust', () => {
  test('adds and takes out atomically, never below 0', async () => {
    const { insertedId } = await hoodies().insertOne(product({ stock: 2 }));
    const body = (delta) => ({ db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), delta });

    await Promise.all([1, 2, 3].map(() => api('products/adjust', { body: body(1) })));
    expect((await hoodies().findOne({ _id: insertedId })).stock).toBe(5);

    const results = await Promise.all([1, 2, 3, 4, 5, 6].map(() => api('products/adjust', { body: body(-1) })));
    expect(results.filter((r) => r.status === 200)).toHaveLength(5);
    expect(results.filter((r) => r.status === 409)).toHaveLength(1);
    expect((await hoodies().findOne({ _id: insertedId })).stock).toBe(0);
  });

  test('works on a stock stored as text by an old import', async () => {
    const { insertedId } = await hoodies().insertOne(product({ stock: '7' }));
    const { status, data } = await api('products/adjust', { body: { db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), delta: -2 } });
    expect(status).toBe(200);
    expect(data.stock).toBe(5);
  });

  test('writes history', async () => {
    const { insertedId } = await hoodies().insertOne(product({ stock: 4 }));
    await api('products/adjust', { body: { db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), delta: -3 } });
    const { data } = await api(`history?db=winkel&collection=hoodies&id=${insertedId}`, { method: 'GET' });
    expect(data.entries[0]).toMatchObject({ before: 4, after: 1, delta: -3, source: 'afboeken', refnr: 'jh001', kleur: 'navy', maat: 'm' });
  });
});

describe('products/update', () => {
  test('only changes the fields that are sent', async () => {
    const { insertedId } = await hoodies().insertOne(product());
    const { status } = await api('products/update', { body: { db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), akp: '9,99' } });
    expect(status).toBe(200);
    expect(await hoodies().findOne({ _id: insertedId })).toMatchObject({ akp: 9.99, stock: 10, kleur: 'navy' });
  });

  test('refuses to overwrite a change made by someone else', async () => {
    const loadedAt = new Date('2026-01-01T10:00:00Z');
    const { insertedId } = await hoodies().insertOne(product({ updated_at: loadedAt }));
    const body = (fields) => ({ db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), ...fields });

    const first = await api('products/update', { body: body({ stock: 5, expected_updated_at: loadedAt.toISOString() }) });
    expect(first.status).toBe(200);
    const stale = await api('products/update', { body: body({ stock: 9, expected_updated_at: loadedAt.toISOString() }) });
    expect(stale.status).toBe(409);
    expect((await hoodies().findOne({ _id: insertedId })).stock).toBe(5);
  });

  test('refuses to turn a product into a duplicate of another', async () => {
    await hoodies().insertOne(product({ maat: 'l' }));
    const { insertedId } = await hoodies().insertOne(product());
    const { status } = await api('products/update', { body: { db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), maat: 'L' } });
    expect(status).toBe(409);
  });

  test('delivery date and flag', async () => {
    const { insertedId } = await hoodies().insertOne(product());
    const body = (fields) => ({ db: 'winkel', collection: 'hoodies', _id: insertedId.toString(), ...fields });
    await api('products/update', { body: body({ leverdatum: '31/01/2026', lang_in_stock: true }) });
    expect(await hoodies().findOne({ _id: insertedId })).toMatchObject({ leverdatum: '2026-01-31', lang_in_stock: true });
    expect((await api('products/update', { body: body({ leverdatum: '31/02/2026' }) })).status).toBe(400);
  });
});

describe('products/delete', () => {
  test('deletes once, then 404', async () => {
    const { insertedId } = await hoodies().insertOne(product());
    const body = { db: 'winkel', collection: 'hoodies', _id: insertedId.toString() };
    expect((await api('products/delete', { body })).status).toBe(200);
    expect((await api('products/delete', { body })).status).toBe(404);
    expect((await api('products/delete', { body: { ...body, _id: 'geen-id' } })).status).toBe(400);
  });
});

describe('collections', () => {
  test('create, rename and delete only when empty', async () => {
    const created = await api('collections', { body: { db: 'winkel', action: 'create', name: 'T-shirts Kids' } });
    expect(created).toMatchObject({ status: 201, data: { name: 't_shirts_kids' } });
    expect((await api('collections', { body: { db: 'winkel', action: 'create', name: 't-shirts kids' } })).status).toBe(409);

    const renamed = await api('collections', { body: { db: 'winkel', action: 'rename', name: 't_shirts_kids', newName: 'tees kids' } });
    expect(renamed.data.name).toBe('tees_kids');

    await winkel().collection('tees_kids').insertOne(product());
    expect((await api('collections', { body: { db: 'winkel', action: 'delete', name: 'tees_kids' } })).status).toBe(409);
    await winkel().collection('tees_kids').deleteMany({});
    expect((await api('collections', { body: { db: 'winkel', action: 'delete', name: 'tees_kids' } })).status).toBe(200);
  });
});

describe('export and import', () => {
  const upload = (csv, query, headers) => {
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'stock.csv');
    return api(`import?${query}`, { body: form, headers });
  };

  test('an export can be imported again without changes', async () => {
    await hoodies().insertMany([product(), product({ maat: 'l', kleur: 'wit/zwart, gestreept' })]);
    const exported = await api('export?db=winkel', { method: 'GET' });
    expect(exported.status).toBe(200);
    expect(exported.headers.get('content-type')).toMatch(/text\/csv/);
    const csv = exported.data.toString('utf-8');
    expect(csv.split('\r\n')[0]).toBe('﻿collectie,refnr,modelnaam,merk,kleur,gender,maat,stock,akp,waarde,leverdatum,lang_in_stock,id,versie');

    const { data } = await upload(csv, 'db=winkel&dryRun=1');
    expect(data).toMatchObject({ insertsCount: 0, updatesCount: 0, deletesCount: 0, errorCount: 0 });
    expect(data.collections[0]).toMatchObject({ name: 'hoodies', unchanged: 2 });
  });

  test('dry run first, then the real import with history and a backup', async () => {
    await hoodies().insertMany([product(), product({ maat: 'xl' })]);
    const csv = 'collectie;refnr;kleur;maat;gender;stock;akp\nhoodies;JH001;Navy;M;unisex;4;12,5\nhoodies;jh001;navy;s;unisex;2;12,5\npolos;pk100;wit;l;;6;\n';

    const preview = await upload(csv, 'db=winkel&dryRun=1');
    expect(preview.data).toMatchObject({ insertsCount: 2, updatesCount: 1, deletesCount: 1 });
    expect(preview.data.collections.find((c) => c.name === 'polos').isNew).toBe(true);
    expect(await hoodies().countDocuments()).toBe(2);

    const run = await upload(csv, 'db=winkel');
    expect(run.status).toBe(200);
    const docs = await hoodies().find({}).toArray();
    expect(docs.map((d) => `${d.maat}:${d.stock}`).sort()).toEqual(['m:4', 's:2']);
    expect(await winkel().collection('polos').findOne({})).toMatchObject({ refnr: 'pk100', stock: 6, akp: null });
    expect(await client.db('stiksel_inventaris').collection('import_backups').countDocuments()).toBe(2);
    const history = await client.db('stiksel_inventaris').collection('stock_history').find({ source: 'import' }).toArray();
    expect(history).toHaveLength(4);
  });

  test('a file with errors is shown but never imported', async () => {
    await hoodies().insertOne(product());
    const csv = 'collectie,refnr,maat,stock\nhoodies,jh001,m,veel\nhoodies,jh002,l,3\n';
    const preview = await upload(csv, 'db=winkel&dryRun=1');
    expect(preview.data.errorCount).toBe(1);
    expect(preview.data.errors[0]).toMatchObject({ line: 2 });
    expect((await upload(csv, 'db=winkel')).status).toBe(400);
    expect(await hoodies().countDocuments()).toBe(1);
  });

  test('a category from the request for files without a collectie column', async () => {
    const { data } = await upload('refnr,kleur,maat,stock\njh001,navy,m,3\n', 'db=winkel&collection=hoodies&dryRun=1');
    expect(data.collections).toEqual([expect.objectContaining({ name: 'hoodies', inserts: 1 })]);
  });

  test('asks for the import password when one is set', async () => {
    process.env.IMPORT_PASSWORD = 'geheim';
    try {
      expect((await upload('refnr\njh001\n', 'db=winkel&collection=hoodies&dryRun=1')).status).toBe(401);
      expect((await upload('refnr\njh001\n', 'db=winkel&collection=hoodies&dryRun=1', { 'x-import-password': 'geheim' })).status).toBe(200);
    } finally {
      delete process.env.IMPORT_PASSWORD;
    }
  });
});

describe('health', () => {
  test('reports the database as up', async () => {
    const { status, data } = await api('health', { method: 'GET' });
    expect(status).toBe(200);
    expect(data).toMatchObject({ status: 'ok', database: 'up' });
  });
});

describe('dashboard data', () => {
  test('hides our own database and flags duplicates', async () => {
    await hoodies().insertMany([product(), product({ stock: 3 }), product({ maat: 'l' })]);
    await client.db('stiksel_inventaris').collection('stock_history').insertOne({ at: new Date() });
    const { loadInventories } = await import('../../lib/inventory.js');
    const data = await loadInventories();
    expect(Object.keys(data)).toEqual(['winkel']);
    expect(data.winkel.products.filter((p) => p.duplicate)).toHaveLength(2);
    expect(data.winkel.products.find((p) => p.maat === 'l').value).toBe(125);
  });
});
