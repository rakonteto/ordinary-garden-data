import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseAir } from '../src/air.js';

const air = JSON.parse(await readFile(new URL('./fixtures/air.json', import.meta.url)));

test('parseAir: 미세먼지 정규화', () => {
  assert.deepEqual(parseAir(air), {
    pm10: 23, pm10Grade: 1,
    pm25: 12, pm25Grade: 1,
    khai: 45, khaiGrade: 1,
  });
});

test('parseAir: 결측("-")은 null', () => {
  const out = parseAir({ pm10Value: '-', pm10Grade: '-', pm25Value: '12', pm25Grade: '1', khaiValue: '45', khaiGrade: '1' });
  assert.equal(out.pm10, null);
  assert.equal(out.pm10Grade, null);
  assert.equal(out.pm25, 12);
});
