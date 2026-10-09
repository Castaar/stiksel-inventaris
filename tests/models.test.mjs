import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupModels, sizesIn, sortModels } from '../lib/models.js';

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
