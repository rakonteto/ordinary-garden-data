import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ncstBaseDateTime, vilageBaseDateTime } from '../src/baseTime.js';

// 2026-06-16 06:12 UTC == 15:12 KST
const utc_1512_kst = Date.UTC(2026, 5, 16, 6, 12);
// 2026-06-16 16:30 UTC == 2026-06-17 01:30 KST
const utc_0130_kst = Date.UTC(2026, 5, 16, 16, 30);
// 2026-06-16 15:20 UTC == 2026-06-17 00:20 KST
const utc_0020_kst = Date.UTC(2026, 5, 16, 15, 20);

test('초단기실황: 분<40이면 직전 정시', () => {
  // 15:12 KST → 정시+40분 전 → 14:00 회차
  assert.deepEqual(ncstBaseDateTime(utc_1512_kst), { base_date: '20260616', base_time: '1400' });
});

test('초단기실황: 자정 직후(00:20 KST)는 전날 23시로 롤백', () => {
  // 00:20 KST → 분20<40 → 직전 정시는 전날 23:00
  assert.deepEqual(ncstBaseDateTime(utc_0020_kst), { base_date: '20260616', base_time: '2300' });
});

test('초단기실황: 분>=40이면 현재 정시 유지', () => {
  // Date.UTC(2026,5,16,6,50) = 15:50 KST → 분50>=40 → 15:00 회차
  assert.deepEqual(ncstBaseDateTime(Date.UTC(2026, 5, 16, 6, 50)), { base_date: '20260616', base_time: '1500' });
});

test('단기예보: 15:12 KST면 14시 발표', () => {
  assert.deepEqual(vilageBaseDateTime(utc_1512_kst), { base_date: '20260616', base_time: '1400' });
});

test('단기예보: 01:30 KST면 전날 23시 발표', () => {
  assert.deepEqual(vilageBaseDateTime(utc_0130_kst), { base_date: '20260616', base_time: '2300' });
});
