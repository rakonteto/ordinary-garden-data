import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latLonToGrid } from '../src/grid.js';

test('서울시청 → nx 60, ny 127', () => {
  assert.deepEqual(latLonToGrid(37.5665, 126.9780), { nx: 60, ny: 127 });
});

test('부산시청 → nx 98, ny 76', () => {
  assert.deepEqual(latLonToGrid(35.1796, 129.0756), { nx: 98, ny: 76 });
});

test('대전시청 → nx 67, ny 100', () => {
  assert.deepEqual(latLonToGrid(36.3504, 127.3845), { nx: 67, ny: 100 });
});
