import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripCdata, pick, resultCode, items, splitPipe } from '../src/garden/xml.js';

test('stripCdata: CDATA 래퍼 제거', () => {
  assert.equal(stripCdata('<![CDATA[12938]]>'), '12938');
  assert.equal(stripCdata('  <![CDATA[가울테리아]]> '), '가울테리아');
  assert.equal(stripCdata('plain'), 'plain');
  assert.equal(stripCdata(undefined), undefined);
});

test('pick: 첫 태그 값(CDATA 벗김), 없으면 undefined', () => {
  const xml = '<item><cntntsNo><![CDATA[12938]]></cntntsNo><x></x></item>';
  assert.equal(pick(xml, 'cntntsNo'), '12938');
  assert.equal(pick(xml, 'x'), '');
  assert.equal(pick(xml, 'nope'), undefined);
});

test('resultCode: header 코드 추출', () => {
  assert.equal(resultCode('<header><resultCode>00</resultCode></header>'), '00');
  assert.equal(resultCode('<header><resultCode>11</resultCode></header>'), '11');
});

test('items: <item> 블록들을 문자열 배열로', () => {
  const xml = '<body><items><item><a>1</a></item><item><a>2</a></item></items></body>';
  const out = items(xml);
  assert.equal(out.length, 2);
  assert.equal(pick(out[0], 'a'), '1');
  assert.equal(pick(out[1], 'a'), '2');
});

test('splitPipe: 파이프 다중값 → 배열', () => {
  assert.deepEqual(splitPipe('a|b|c'), ['a', 'b', 'c']);
  assert.deepEqual(splitPipe(undefined), []);
});

test('resultCode: returnReasonCode 폴백', () => {
  assert.equal(resultCode('<header><returnReasonCode>99</returnReasonCode></header>'), '99');
});

test('pick: null/undefined xml은 undefined', () => {
  assert.equal(pick(null, 'a'), undefined);
  assert.equal(pick(undefined, 'a'), undefined);
});

test('splitPipe: 빈 문자열은 []', () => {
  assert.deepEqual(splitPipe(''), []);
});
