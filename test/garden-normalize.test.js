import { test } from 'node:test';
import assert from 'node:assert/strict';
import { category, lightLevel, difficulty, tempRange } from '../src/garden/normalize.js';

test('category: clCodeNm → 우선순위 열매>꽃>잎', () => {
  assert.equal(category('잎&꽃보기식물,열매보기식물'), 'fruit');
  assert.equal(category('꽃보기식물'), 'flower');
  assert.equal(category('잎보기식물'), 'foliage');
  assert.equal(category('다육식물'), 'other');
  assert.equal(category(undefined), 'other');
});

test('lightLevel: 복수면 최소 광량', () => {
  assert.equal(lightLevel('중간 광도(800~1,500 Lux),높은 광도(1,500~10,000 Lux)'), 'medium');
  assert.equal(lightLevel('높은 광도(1,500~10,000 Lux)'), 'high');
  assert.equal(lightLevel('낮은 광도,중간 광도'), 'low');
  assert.equal(lightLevel('높은 광도(1,500 Lux),낮은 광도(200 Lux)'), 'low');
  assert.equal(lightLevel(undefined), null);
});

test('difficulty: 관리수준 매핑', () => {
  assert.equal(difficulty('초보자'), 'easy');
  assert.equal(difficulty('경험자'), 'medium');
  assert.equal(difficulty('전문가'), 'hard');
  assert.equal(difficulty(''), null);
});

test('tempRange: "16~20℃" → "16~20", 없으면 원문/null', () => {
  assert.equal(tempRange('16~20℃'), '16~20');
  assert.equal(tempRange('16 ~ 25'), '16~25');
  assert.equal(tempRange('상온'), '상온');
  assert.equal(tempRange(''), null);
  assert.equal(tempRange(undefined), null);
});
