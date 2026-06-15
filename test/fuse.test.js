import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWeatherBundle } from '../src/fuse.js';

const sample = {
  ncst: { tempC: 21.3, humidity: 55, precip1h: 0, precipType: 'none', windDeg: 270, windSpeed: 2.4 },
  vilage: {
    hourly: [{ time: '2026-06-16T15:00:00+09:00', tempC: 22, pop: 20, precipType: 'none', precipMm: 0, sky: 'partly' }],
    daily: [{ date: '2026-06-16', minC: 16, maxC: 26, pop: 30, sky: 'partly' }],
    currentSky: 'partly',
  },
  air: { pm10: 23, pm10Grade: 1, pm25: 12, pm25Grade: 1, khai: 45, khaiGrade: 1 },
  label: '우리 정원',
  generatedAt: '2026-06-16T06:12:03.000Z',
};

test('buildWeatherBundle: 스키마 조립', () => {
  const b = buildWeatherBundle(sample);
  assert.equal(b.current.tempC, 21.3);
  assert.equal(b.current.sky, 'partly'); // 실황에 없는 하늘은 단기예보 첫 시각에서 보강
  assert.equal(b.hourly.length, 1);
  assert.equal(b.daily.length, 1);
  assert.deepEqual(b.alerts, []); // 특보는 후속 보강(스키마만 고정)
  assert.equal(b.airQuality.pm10, 23);
  assert.equal(b.meta.locationLabel, '우리 정원');
  assert.deepEqual(b.meta.sources, ['KMA', 'AirKorea']);
  assert.equal(b.meta.generatedAt, '2026-06-16T06:12:03.000Z');
  // 예상치 못한 top-level 필드(좌표 등) 유입 차단
  assert.deepEqual(Object.keys(b).sort(), ['airQuality', 'alerts', 'current', 'daily', 'hourly', 'meta']);
});

test('위치 식별자가 발행물 어디에도 없어야 한다 (좌표 완전 비공개)', () => {
  // 이 단언은 fuse가 위치 식별자를 *추가*하지 않음을 검증한다.
  // 상류(parseVilage/parseAir)가 식별자를 이미 제거했음을 전제로 한다(Task 5·6 테스트가 보장).
  // 최종 발행물의 식별자 부재는 Task 10에서 실제 weather.json으로 재검증한다.
  const json = JSON.stringify(buildWeatherBundle(sample));
  for (const banned of ['"nx"', '"ny"', '"lat"', '"lon"', '"stationName"', '"station"', '"gridX"', '"gridY"']) {
    assert.equal(json.includes(banned), false, `발행물에 ${banned} 가 포함됨`);
  }
});
