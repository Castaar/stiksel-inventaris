import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareSizes, productValue, variantKey } from '../lib/product.js';
import { matches, sortProducts, status } from '../lib/stock-view.js';

test('sizes sort in size order', () => {
  const sizes = ['XL', 'm', '2XL', 's', 'xs', 'L', '128', '98', 'one size'];
  assert.deepEqual(sizes.sort(compareSizes), ['98', '128', 'xs', 's', 'm', 'L', 'XL', '2XL', 'one size']);
});

test('value is stock x akp, also for text from old imports', () => {
  assert.equal(productValue({ stock: '4', akp: '2,5' }), 10);
  assert.equal(productValue({ stock: 3, akp: null }), 0);
  assert.equal(productValue({ stock: -2, akp: 5 }), 0);
});

test('variant key ignores case and spaces', () => {
  assert.equal(variantKey({ refnr: 'JH001 ', kleur: 'Navy', maat: 'M' }), variantKey({ refnr: 'jh001', kleur: 'navy', maat: 'm', gender: '' }));
  assert.notEqual(variantKey({ refnr: 'jh001', kleur: 'navy', maat: 'm' }), variantKey({ refnr: 'jh001', kleur: 'navy', maat: 'l' }));
});

test('status: op, bijna op (per inventory), ok', () => {
  assert.equal(status({ stock: 0 }), 'empty');
  assert.equal(status({ stock: 4, low_below: 5 }), 'low');
  assert.equal(status({ stock: 5, low_below: 5 }), 'ok');
  // Without a limit for the inventory there is no "bijna op"
  assert.equal(status({ stock: 1 }), 'ok');
});

test('search: every word, colour families find their shades', () => {
  const navy = { refnr: 'jh001', modelnaam: 'college hoodie', kleur: 'navy', maat: 'm' };
  const red = { refnr: 'jh001', modelnaam: 'college hoodie', kleur: 'fire red', maat: 'm' };
  assert.ok(matches(navy, 'hoodie blauw'));
  assert.ok(!matches(red, 'hoodie blauw'));
  assert.ok(matches(red, 'JH001 red'));
});

test('sorting by model keeps colours together and sizes in order', () => {
  const list = [
    { refnr: 'a', modelnaam: 'tee', kleur: 'zwart', maat: 'l' },
    { refnr: 'a', modelnaam: 'tee', kleur: 'wit', maat: 'm' },
    { refnr: 'a', modelnaam: 'tee', kleur: 'zwart', maat: 's' },
  ];
  assert.deepEqual(sortProducts(list, 'naam').map((p) => `${p.kleur} ${p.maat}`), ['wit m', 'zwart s', 'zwart l']);
});
