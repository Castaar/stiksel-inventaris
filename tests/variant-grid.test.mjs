import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTags, filledVariants, gridKey } from '../lib/variant-grid.js';

test('tags: comma separated, lower case, no doubles', () => {
  assert.deepEqual(addTags(['navy'], ' Zwart, NAVY; wit ,'), ['navy', 'zwart', 'wit']);
});

test('only filled cells become variants', () => {
  const quantities = { [gridKey('navy', 's')]: '2', [gridKey('navy', 'm')]: '', [gridKey('zwart', 'm')]: '1,5', [gridKey('zwart', 's')]: '0' };
  assert.deepEqual(filledVariants(['navy', 'zwart'], ['s', 'm'], quantities), [
    { kleur: 'navy', maat: 's', stock: 2 },
    { kleur: 'zwart', maat: 'm', stock: 1.5 },
  ]);
});

test('no colours or sizes is one cell, and a wrong amount is refused', () => {
  assert.deepEqual(filledVariants([], [], { [gridKey('', '')]: '3' }), [{ kleur: '', maat: '', stock: 3 }]);
  assert.deepEqual(filledVariants([], ['s'], { [gridKey('', 's')]: '1' }), [{ kleur: '', maat: 's', stock: 1 }]);
  assert.equal(filledVariants(['navy'], [], { [gridKey('navy', '')]: 'veel' }), null);
  assert.equal(filledVariants(['navy'], [], { [gridKey('navy', '')]: '-1' }), null);
});
