import { fetchGardenList, fetchGardenDetail, sleep } from './client.js';
import { pick } from './xml.js';
import { buildCatalogItem } from './adapter.js';

// 동시성 제한 매핑(순서 보존).
export async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  const worker = async () => {
    while (i < arr.length) {
      const idx = i++;
      out[idx] = await fn(arr[idx], idx);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, arr.length)) }, worker));
  return out;
}

// 목록+상세 수집 → { items, missing }. 상세 실패는 제외하고 누락 기록.
export async function collectGarden(serviceKey, {
  concurrency = 5, log = console,
  _fetchList = fetchGardenList, _fetchDetail = fetchGardenDetail, _sleep = sleep,
} = {}) {
  const listItems = await _fetchList(serviceKey);
  log.log(`목록 ${listItems.length}종 수집`);
  const missing = [];
  const results = await mapLimit(listItems, concurrency, async (itemXml) => {
    const cntntsNo = pick(itemXml, 'cntntsNo');
    try {
      const detail = await _fetchDetail(serviceKey, cntntsNo);
      return buildCatalogItem(itemXml, detail);
    } catch (e) {
      missing.push({ cntntsNo, reason: e.message });
      return null;
    } finally {
      await _sleep(150); // 성공·실패 모두 요청 간격 유지
    }
  });
  const items = results.filter(Boolean);
  if (missing.length) log.warn(`상세 실패/제외 ${missing.length}종: ${missing.map((m) => m.cntntsNo).join(',')}`);
  return { items, missing };
}

// {meta, items} 조립.
export function buildCatalog(items, generatedAt) {
  return {
    meta: { generatedAt, source: '농사로', count: items.length, services: ['garden'] },
    items,
  };
}

// 발행 가드: 0건이거나 직전 대비 급감(<50%)이면 거부.
export function shouldPublish(newCount, prevCount) {
  if (newCount === 0) return false;
  if (prevCount > 0 && newCount < prevCount * 0.5) return false;
  return true;
}
