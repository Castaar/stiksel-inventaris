import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duplicateGroups, groupModels, sizesIn, sortModels } from '../lib/models.js';

const v = (fields) => ({ db: 'stock', collection: 'hoodies', refnr: 'jh001', modelnaam: 'college hoodie', stock: 2, value: 10, has_price: true, ...fields });

test('one model per refnr with its colours, sizes and totals', () => {
  const [model, other] = groupModels([
    v({ _id: 1, kleur: 'navy', maat: 'l' }),
    v({ _id: 2, kleur: 'zwart', maat: 's', stock: 0 }),
    v({ _id: 3, kleur: 'navy', maat: 's', low_below: 3 }),
    v({ _id: 4, refnr: 'jh050', modelnaam: 'zoodie', kleur: 'zwart', maat: 'm' }),
  ]);
  assert.equal(model.variants.length, 3);
  assert.deepEqual(model.colors, ['navy', 'zwart']);
  assert.deepEqual(model.sizes, ['s', 'l']);
  assert.equal(model.stock, 4);
  assert.equal(model.value, 30);
  assert.equal(model.empty, 1);
  assert.equal(model.low, 1);
  assert.equal(other.title, 'zoodie');
});

test('the same refnr in another category is another model', () => {
  assert.equal(groupModels([v({ _id: 1 }), v({ _id: 2, collection: 'polos' })]).length, 2);
});

test('sorting and the size filter', () => {
  const models = groupModels([v({ _id: 1, refnr: 'b', modelnaam: 'polo', stock: 9 }), v({ _id: 2, refnr: 'a', modelnaam: 'tee', stock: 1 })]);
  assert.deepEqual(sortModels(models, 'naam').map((m) => m.title), ['polo', 'tee']);
  assert.deepEqual(sortModels(models, 'laag').map((m) => m.title), ['tee', 'polo']);
  assert.deepEqual(sizesIn([v({ maat: 'xl' }), v({ maat: 's' }), v({ maat: 's' })]), [['s', 2], ['xl', 1]]);
});

test('duplicate groups: per name, only the same name and price can merge', () => {
  const groups = duplicateGroups([
    v({ _id: 1, kleur: 'navy', maat: 's', stock: 1 }),
    v({ _id: 2, kleur: 'Navy', maat: 'S', stock: 2 }),
    v({ _id: 3, kleur: 'navy', maat: 'm' }),
    v({ _id: 4, kleur: 'onbekend', modelnaam: 'cruiser' }),
    v({ _id: 5, kleur: 'onbekend', modelnaam: 'cruiser' }),
    v({ _id: 6, kleur: 'onbekend', modelnaam: 'slammer' }),
    v({ _id: 7, kleur: 'wit', maat: 'm', akp: 10 }),
    v({ _id: 8, kleur: 'wit', maat: 'm', akp: '12' }),
  ]);
  assert.deepEqual(groups.map((g) => [g.kleur, g.otherNames]), [['navy', false], ['onbekend', true], ['wit', false]]);
  assert.equal(groups[0].parts[0].mergeable, true);
  assert.equal(groups[0].parts[0].stock, 3);
  assert.deepEqual(groups[1].parts.map((p) => [p.name, p.rows.length, p.mergeable]), [['cruiser', 2, true], ['slammer', 1, false]]);
  assert.equal(groups[2].parts[0].mergeable, false);
  assert.match(groups[2].parts[0].problem, /AKP/);
});
