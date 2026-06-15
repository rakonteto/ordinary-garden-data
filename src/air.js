import { int } from './helpers.js';

const AIR_BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

// 측정소명으로 실시간 측정값 1건 조회.
export async function fetchAir(stationName, serviceKey) {
  const q = new URLSearchParams({
    serviceKey,
    returnType: 'json',
    numOfRows: '1',
    pageNo: '1',
    stationName,
    dataTerm: 'DAILY',
    ver: '1.3',
  });
  const res = await fetch(`${AIR_BASE}/getMsrstnAcctoRltmMesureDnsty?${q}`);
  if (!res.ok) throw new Error(`AirKorea HTTP ${res.status}`);
  const json = await res.json();
  const header = json?.response?.header;
  if (header && header.resultCode !== '00') {
    throw new Error(`AirKorea ${header.resultCode}: ${header.resultMsg}`);
  }
  const item = json?.response?.body?.items?.[0];
  if (!item) throw new Error(`AirKorea: 측정소 "${stationName}" 데이터 없음`);
  return item;
}

// items[0] → airQuality. 측정소명·좌표는 의도적으로 버린다(위치 비공개).
export function parseAir(item) {
  return {
    pm10: int(item.pm10Value),
    pm10Grade: int(item.pm10Grade),
    pm25: int(item.pm25Value),
    pm25Grade: int(item.pm25Grade),
    khai: int(item.khaiValue),
    khaiGrade: int(item.khaiGrade),
  };
}
