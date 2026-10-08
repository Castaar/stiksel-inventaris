import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, toCsv } from '../lib/csv.js';

test('reads comma files with quotes, commas and line breaks in a field', () => {
  const rows = parseCsv('﻿Refnr,Kleur,Stock\r\njh001,"navy, blauw",3\njh002,"wit ""optic""\nnieuw",0\n\n');
  assert.deepEqual(rows, [
    { refnr: 'jh001', kleur: 'navy, blauw', stock: '3' },
    { refnr: 'jh002', kleur: 'wit "optic"\nnieuw', stock: '0' },
  ]);
});

test('reads semicolon files from Excel and skips empty lines', () => {
  const rows = parseCsv('collectie;refnr;akp\nhoodies;jh001;12,5\n;;\n');
  assert.deepEqual(rows, [{ collectie: 'hoodies', refnr: 'jh001', akp: '12,5' }]);
});

test('writes what it reads', () => {
  const csv = toCsv(['refnr', 'kleur'], [['jh001', 'navy, "blauw"'], ['jh002', '']]);
  assert.ok(csv.startsWith('﻿'));
  assert.deepEqual(parseCsv(csv), [{ refnr: 'jh001', kleur: 'navy, "blauw"' }, { refnr: 'jh002', kleur: '' }]);
});
