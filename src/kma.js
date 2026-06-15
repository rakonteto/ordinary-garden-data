import { num, int, rn1 } from './helpers.js';

const KMA_BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

// PTY(강수형태) 코드 → 앱 enum. 실황/예보 공통.
const PTY = { '0': 'none', '1': 'rain', '2': 'rainSnow', '3': 'snow', '5': 'rain', '6': 'rainSnow', '7': 'snow' };

// data.go.kr 디코딩 서비스키를 URLSearchParams로 안전 인코딩해 호출.
export async function fetchKma(path, params, serviceKey) {
  const q = new URLSearchParams({
    serviceKey,
    dataType: 'JSON',
    numOfRows: '1000',
    pageNo: '1',
    ...params,
  });
  const res = await fetch(`${KMA_BASE}/${path}?${q}`);
  if (!res.ok) throw new Error(`KMA ${path} HTTP ${res.status}`);
  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '00') {
    throw new Error(`KMA ${path} 응답 오류 ${header?.resultCode ?? '(헤더 없음)'}: ${header?.resultMsg ?? ''}`);
  }
  const item = json?.response?.body?.items?.item;
  if (!item) throw new Error(`KMA ${path}: 응답에 items.item 없음`);
  return item;
}

// 초단기실황 item[] → current 부분
export function parseNcst(items) {
  const m = {};
  for (const it of items) m[it.category] = it.obsrValue;
  return {
    tempC: num(m.T1H),
    humidity: int(m.REH),
    precip1h: rn1(m.RN1),
    precipType: PTY[m.PTY] ?? 'none',
    windDeg: int(m.VEC),
    windSpeed: num(m.WSD),
  };
}
