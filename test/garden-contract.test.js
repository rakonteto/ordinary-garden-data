import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { items } from '../src/garden/xml.js';
import { buildCatalogItem } from '../src/garden/adapter.js';
import { buildCatalog } from '../src/garden/build-catalog.js';

const listXml = await readFile(new URL('./fixtures/garden-list.xml', import.meta.url), 'utf8');
const detailXml = await readFile(new URL('./fixtures/garden-detail.xml', import.meta.url), 'utf8');

const CATEGORIES = ['vegetable', 'herb', 'flower', 'fruit', 'foliage', 'other'];
const LIGHTS = ['low', 'medium', 'high', null];
const DIFFS = ['easy', 'medium', 'hard', null];

test('생성물이 PlantCatalog 계약을 만족', () => {
  const item = buildCatalogItem(items(listXml)[0], detailXml);
  const catalog = buildCatalog([item], '2026-06-17T00:00:00.000Z');

  // meta
  assert.equal(typeof catalog.meta.generatedAt, 'string');
  assert.equal(catalog.meta.count, catalog.items.length);
  assert.deepEqual(catalog.meta.services, ['garden']);
  assert.equal(catalog.meta.source, '농사로');

  // item — 필수/enum/타입
  const it = catalog.items[0];
  assert.equal(typeof it.id, 'string');
  assert.equal(typeof it.commonName, 'string'); // 필수
  assert.ok(CATEGORIES.includes(it.category));
  assert.ok(LIGHTS.includes(it.lightLevel));
  assert.ok(DIFFS.includes(it.difficulty));
  assert.equal(it.waterBySeason, null); // 7b: 물주기 미생성
  assert.equal(it.sourceService, 'garden');
});
