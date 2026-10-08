import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planCollection } from '../lib/import-plan.js';

const doc = (id, fields) => ({ _id: id, refnr: 'jh001', modelnaam: 'hoodie', merk: '', kleur: 'navy', gender: '', maat: 'm', stock: 3, akp: 10, ...fields });

test('matches on id, then on refnr + kleur + maat; deletes what is missing', () => {
  const existing = [doc('a'), doc('b', { maat: 'l' }), doc('c', { maat: 'xl' })];
  const plan = planCollection(
    [
      { line: 2, id: 'a', versie: '', fields: { refnr: 'jh001', kleur: 'navy', maat: 'm', stock: 5 } },
      { line: 3, id: '', versie: '', fields: { refnr: 'jh001', kleur: 'navy', maat: 'l', stock: 3 } },
      { line: 4, id: '', versie: '', fields: { refnr: 'jh001', kleur: 'navy', maat: 's', stock: 1 } },
    ],
    existing
  );
  assert.deepEqual(plan.updates.map((u) => [u.doc._id, u.set]), [['a', { stock: 5 }]]);
  assert.equal(plan.unchanged, 1);
  assert.deepEqual(plan.inserts.map((i) => i.doc.maat), ['s']);
  assert.deepEqual(plan.deletes.map((d) => d._id), ['c']);
});

test('columns that are not in the file are kept', () => {
  const plan = planCollection([{ line: 2, id: '', versie: '', fields: { refnr: 'jh001', kleur: 'navy', maat: 'm' } }], [doc('a', { akp: 12 })]);
  assert.equal(plan.updates.length, 0);
  assert.equal(plan.unchanged, 1);
});

test('rows changed in the app after the export are skipped, not deleted', () => {
  const changed = doc('a', { updated_at: new Date('2026-10-01T10:00:00Z') });
  const plan = planCollection([{ line: 2, id: 'a', versie: '2026-09-01T10:00:00.000Z', fields: { refnr: 'jh001', stock: 0 } }], [changed]);
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.deletes.length, 0);
  assert.equal(plan.updates.length, 0);
});
