import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseNcst } from '../src/kma.js';

const ncst = JSON.parse(await readFile(new URL('./fixtures/ncst.json', import.meta.url)));

test('parseNcst: 실황을 current로 정규화', () => {
  assert.deepEqual(parseNcst(ncst), {
    tempC: 21.3,
    humidity: 55,
    precip1h: 0,
    precipType: 'none',
    windDeg: 270,
    windSpeed: 2.4,
  });
});

test('parseNcst: PTY 1은 rain', () => {
  const items = [{ category: 'T1H', obsrValue: '18' }, { category: 'PTY', obsrValue: '1' }];
  assert.equal(parseNcst(items).precipType, 'rain');
});
