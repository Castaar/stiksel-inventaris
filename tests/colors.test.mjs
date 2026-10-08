import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorFamily, colorSwatches, familyForWord, swatchBackground } from '../lib/colors.js';

test('known colour names in Dutch and English get a swatch', () => {
  assert.equal(colorSwatches('zwart')[0].hex, '#111111');
  assert.equal(colorSwatches('Black')[0].hex, '#111111');
  assert.equal(colorFamily('french navy'), 'blauw');
  assert.equal(colorFamily('heather grey'), 'grijs');
  assert.equal(colorFamily('bottle green'), 'groen');
});

test('light and dark shades, also glued', () => {
  const base = colorSwatches('blauw')[0].hex;
  assert.notEqual(colorSwatches('lichtblauw')[0].hex, base);
  assert.notEqual(colorSwatches('donkerblauw')[0].hex, base);
  assert.equal(colorFamily('donkergrijs'), 'grijs');
});

test('two colours give two halves, unknown names nothing', () => {
  const two = colorSwatches('wit/zwart');
  assert.equal(two.length, 2);
  assert.match(swatchBackground(two), /linear-gradient/);
  assert.deepEqual(colorSwatches('spring special'), []);
  assert.equal(swatchBackground([]), null);
});

test('family words', () => {
  assert.equal(familyForWord('Blue'), 'blauw');
  assert.equal(familyForWord('rood'), 'rood');
  assert.equal(familyForWord('hoodie'), null);
});
