import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchGardenDetail, fetchGardenList } from '../src/garden/client.js';

const ok = (xml) => ({ ok: true, status: 200, text: async () => xml });
const detailXml = '<response><header><resultCode>00</resultCode></header><body><item><cntntsNo><![CDATA[1]]></cntntsNo></item></body></response>';

test('fetchGardenDetail: resultCode 00이면 XML 반환', async () => {
  globalThis.fetch = async () => ok(detailXml);
  const xml = await fetchGardenDetail('KEY', '12938');
  assert.match(xml, /12938|<item>/);
});

test('fetchGardenDetail: 11(인증오류)은 재시도 없이 throw', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return ok('<header><resultCode>11</resultCode></header>'); };
  await assert.rejects(() => fetchGardenDetail('KEY', '1'), /11/);
  assert.equal(calls, 1); // 재시도 안 함
});

test('fetchGardenDetail: 91(일시오류)은 재시도 후 성공', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return ok(calls === 1 ? '<header><resultCode>91</resultCode></header>' : detailXml);
  };
  const xml = await fetchGardenDetail('KEY', '1');
  assert.match(xml, /<item>/);
  assert.equal(calls, 2); // 91 한 번 → 재시도 → 00 성공
});

test('fetchGardenDetail: 12·22도 재시도 없이 즉시 throw', async () => {
  for (const code of ['12', '22']) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return ok(`<header><resultCode>${code}</resultCode></header>`); };
    await assert.rejects(() => fetchGardenDetail('KEY', '1'), new RegExp(code));
    assert.equal(calls, 1);
  }
});

test('fetchGardenList: 페이징 — 마지막(부족한) 페이지에서 종료', async () => {
  const page1 = '<body><items>' + '<item><cntntsNo><![CDATA[1]]></cntntsNo></item>'.repeat(2) + '</items></body>';
  const head = '<header><resultCode>00</resultCode></header>';
  let n = 0;
  globalThis.fetch = async () => { n++; return ok('<response>' + head + (n === 1 ? page1 : '<body><items></items></body>') + '</response>'); };
  const list = await fetchGardenList('KEY', { numOfRows: 2 });
  assert.equal(list.length, 2);
  assert.equal(n, 2); // 1페이지(2건=가득) → 2페이지(0건) → 종료
});
