import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { items } from '../src/garden/xml.js';
import { representativeImage, buildCatalogItem } from '../src/garden/adapter.js';

const listXml = await readFile(new URL('./fixtures/garden-list.xml', import.meta.url), 'utf8');
const detailXml = await readFile(new URL('./fixtures/garden-detail.xml', import.meta.url), 'utf8');
const listItem = items(listXml)[0];

test('representativeImage: 209006 위치의 URL', () => {
  assert.equal(
    representativeImage(listItem),
    'https://nongsaro.go.kr/cms_contents/301/12938_MF_REPR_ATTACH_01.jpg'
  );
});

test('buildCatalogItem: 목록+상세 → CatalogItem', () => {
  assert.deepEqual(buildCatalogItem(listItem, detailXml), {
    id: 'garden:12938',
    commonName: '가울테리아',
    scientificName: 'Gaultheria procumbens',
    category: 'fruit',
    thumbnailURL: 'https://nongsaro.go.kr/cms_contents/301/12938_MF_REPR_ATTACH_01.jpg',
    lightLevel: 'medium',
    waterBySeason: null,
    difficulty: 'medium',
    tempRange: '16~20',
    sowingSeason: '파종-9~11월/분주-3~5월',
    description: '진달래과의 작은 관목으로 척박한 산성토양에서 잘 자라며 키는 20cm정도로 포복형이다.',
    sourceService: 'garden',
  });
});

test('buildCatalogItem: 상세 없으면 null', () => {
  assert.equal(buildCatalogItem(listItem, undefined), null);
});

test('representativeImage: 209006 없으면 첫 URL, URL 없으면 null', () => {
  assert.equal(
    representativeImage('<rtnFileUrl><![CDATA[a.jpg|b.jpg]]></rtnFileUrl><rtnImgSeCode><![CDATA[209002|209002]]></rtnImgSeCode>'),
    'a.jpg'
  );
  assert.equal(representativeImage('<x></x>'), null);
});
