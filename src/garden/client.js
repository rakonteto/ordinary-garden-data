import { resultCode, items } from './xml.js';

const BASE = 'http://api.nongsaro.go.kr/service/garden';
const STOP_CODES = ['11', '12', '22']; // 인증·중지·한도초과 → 재시도 무의미

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 농사로 GET + resultCode 검사 + 지수 백오프 재시도.
async function getXml(path, params, { retries = 3 } = {}) {
  const url = `${BASE}/${path}?${new URLSearchParams(params)}`;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`농사로 ${path} HTTP ${res.status}`);
      const xml = await res.text();
      const code = resultCode(xml);
      if (code !== '00') {
        const stop = STOP_CODES.includes(code);
        const err = new Error(`농사로 ${path} 오류코드 ${code}${stop ? ' (재시도 안 함)' : ''}`);
        err.stop = stop;
        throw err;
      }
      return xml;
    } catch (e) {
      lastErr = e;
      if (e.stop || attempt === retries) break;
      await sleep(500 * 2 ** attempt); // 0.5s → 1s → 2s
    }
  }
  throw lastErr;
}

// 목록 전체 페이지 순회 → item 블록 XML 문자열[].
export async function fetchGardenList(serviceKey, { numOfRows = 100 } = {}) {
  const all = [];
  for (let pageNo = 1; ; pageNo++) {
    const xml = await getXml('gardenList', {
      apiKey: serviceKey, numOfRows: String(numOfRows), pageNo: String(pageNo),
    });
    const page = items(xml);
    all.push(...page);
    if (page.length < numOfRows) break; // 마지막 페이지(정확히 가득 차면 다음 빈 페이지에서 종료)
    await sleep(300);
  }
  return all;
}

// 상세 1건. 실패 시 throw(호출부에서 잡아 제외).
export async function fetchGardenDetail(serviceKey, cntntsNo) {
  return getXml('gardenDtl', { apiKey: serviceKey, cntntsNo: String(cntntsNo) });
}
