import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, shouldPublish, mapLimit, collectGarden } from '../src/garden/build-catalog.js';

test('buildCatalog: meta+items 조립', () => {
  const items = [{ id: 'garden:1' }, { id: 'garden:2' }];
  const cat = buildCatalog(items, '2026-06-17T00:00:00.000Z');
  assert.deepEqual(cat.meta, {
    generatedAt: '2026-06-17T00:00:00.000Z', source: '농사로', count: 2, services: ['garden'],
  });
  assert.equal(cat.items.length, 2);
});

test('shouldPublish: 0건 거부, 급감(<50%) 거부, 정상 허용', () => {
  assert.equal(shouldPublish(0, 100), false);
  assert.equal(shouldPublish(40, 100), false); // 급감
  assert.equal(shouldPublish(80, 100), true);
  assert.equal(shouldPublish(120, 0), true);   // 첫 발행(직전 0)
});

test('mapLimit: 동시성 제한해도 전부 처리·순서 보존', async () => {
  const out = await mapLimit([1, 2, 3, 4], 2, async (n) => n * 10);
  assert.deepEqual(out, [10, 20, 30, 40]);
});

test('mapLimit: 빈 배열은 []', async () => {
  assert.deepEqual(await mapLimit([], 2, async (n) => n), []);
});

test('collectGarden: 상세 실패 1건은 제외하고 나머지 발행', async () => {
  const list = [
    '<item><cntntsNo><![CDATA[1]]></cntntsNo><cntntsSj><![CDATA[A]]></cntntsSj></item>',
    '<item><cntntsNo><![CDATA[2]]></cntntsNo><cntntsSj><![CDATA[B]]></cntntsSj></item>',
  ];
  const detail = '<item><cntntsNo><![CDATA[1]]></cntntsNo></item>';
  const { items, missing } = await collectGarden('KEY', {
    log: { log() {}, warn() {} },
    _fetchList: async () => list,
    _fetchDetail: async (k, no) => { if (no === '2') throw new Error('91'); return detail; },
    _sleep: async () => {},
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'garden:1');
  assert.equal(missing.length, 1);
  assert.equal(missing[0].cntntsNo, '2');
});
