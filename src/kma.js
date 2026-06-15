import { num, int, rn1, pcp, isoKst, isoDate } from './helpers.js';

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

// SKY(하늘상태) 코드 → enum
const SKY = { '1': 'clear', '3': 'partly', '4': 'cloudy' };

// 단기예보 item[] → { hourly[], daily[], currentSky }
export function parseVilage(items) {
  const byTime = new Map(); // key: fcstDate+fcstTime
  const tmn = new Map();    // fcstDate → 최저
  const tmx = new Map();    // fcstDate → 최고

  for (const it of items) {
    if (it.category === 'TMN') { tmn.set(it.fcstDate, num(it.fcstValue)); continue; }
    if (it.category === 'TMX') { tmx.set(it.fcstDate, num(it.fcstValue)); continue; }
    const key = it.fcstDate + it.fcstTime;
    if (!byTime.has(key)) byTime.set(key, { fcstDate: it.fcstDate, fcstTime: it.fcstTime });
    byTime.get(key)[it.category] = it.fcstValue;
  }

  const slots = [...byTime.values()].sort(
    (a, b) => (a.fcstDate + a.fcstTime).localeCompare(b.fcstDate + b.fcstTime)
  );

  const hourly = slots.map((s) => ({
    time: isoKst(s.fcstDate, s.fcstTime),
    tempC: num(s.TMP),
    pop: int(s.POP),
    precipType: PTY[s.PTY] ?? 'none',
    precipMm: pcp(s.PCP),
    sky: SKY[s.SKY] ?? null,
  }));

  // 날짜별 집계
  const dates = [...new Set(slots.map((s) => s.fcstDate))];
  const daily = dates.map((date) => {
    const daySlots = slots.filter((s) => s.fcstDate === date);
    const pops = daySlots.map((s) => int(s.POP)).filter((v) => v != null);
    const noon = daySlots.find((s) => s.fcstTime === '1200') ?? daySlots[0];
    return {
      date: isoDate(date),
      minC: tmn.get(date) ?? null,
      maxC: tmx.get(date) ?? null,
      pop: pops.length ? Math.max(...pops) : null,
      sky: noon ? (SKY[noon.SKY] ?? null) : null,
    };
  });

  return { hourly, daily, currentSky: hourly[0]?.sky ?? null };
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
