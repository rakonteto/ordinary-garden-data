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

import { parseVilage } from '../src/kma.js';

const vilage = JSON.parse(await readFile(new URL('./fixtures/vilage.json', import.meta.url)));

test('parseVilage: hourly 시간별 정규화', () => {
  const { hourly } = parseVilage(vilage);
  assert.equal(hourly.length, 2);
  assert.deepEqual(hourly[0], {
    time: '2026-06-16T15:00:00+09:00',
    tempC: 22,
    pop: 20,
    precipType: 'none',
    precipMm: 0,
    sky: 'partly',
  });
  assert.equal(hourly[1].sky, 'clear');
});

test('parseVilage: daily 최저/최고/강수확률(최대)/하늘', () => {
  const { daily } = parseVilage(vilage);
  assert.equal(daily.length, 1);
  assert.deepEqual(daily[0], {
    date: '2026-06-16',
    minC: 16,
    maxC: 26,
    pop: 30, // 그날 시간별 POP의 최대
    sky: 'partly', // 정오(1200) 부재 시 첫 시각 대표
  });
});

test('parseVilage: currentSky는 첫 시간 하늘', () => {
  assert.equal(parseVilage(vilage).currentSky, 'partly');
});
