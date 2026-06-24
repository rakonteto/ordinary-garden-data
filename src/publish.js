import { mkdir, writeFile } from 'node:fs/promises';
import { latLonToGrid } from './grid.js';
import { ncstBaseDateTime, vilageBaseDateTime } from './baseTime.js';
import { fetchKma, parseNcst, parseVilage } from './kma.js';
import { fetchAir, parseAir } from './air.js';
import { buildWeatherBundle } from './fuse.js';

// 이미 배포돼 있는 직전 weather.json (새 발행 실패 시 그대로 유지하기 위해 가져온다).
const LIVE_WEATHER_URL = 'https://rakonteto.github.io/ordinary-garden-data/weather.json';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 누락`);
  return v;
}

// 기상청·에어코리아에서 새 날씨를 만들어 public/weather.json에 쓴다.
async function buildFresh() {
  const lat = parseFloat(requireEnv('HOME_LAT'));
  const lon = parseFloat(requireEnv('HOME_LON'));
  const kmaKey = requireEnv('KMA_SERVICE_KEY');
  const airKey = requireEnv('AIR_SERVICE_KEY');
  const station = requireEnv('AIR_STATION');
  const label = process.env.LOCATION_LABEL || '우리 정원';

  const now = Date.now();
  const { nx, ny } = latLonToGrid(lat, lon);
  const nb = ncstBaseDateTime(now);
  const vb = vilageBaseDateTime(now);

  const [ncstItems, vilageItems, airItem] = await Promise.all([
    fetchKma('getUltraSrtNcst', { ...nb, nx: String(nx), ny: String(ny) }, kmaKey),
    fetchKma('getVilageFcst', { ...vb, nx: String(nx), ny: String(ny) }, kmaKey),
    fetchAir(station, airKey),
  ]);

  const bundle = buildWeatherBundle({
    ncst: parseNcst(ncstItems),
    vilage: parseVilage(vilageItems),
    air: parseAir(airItem),
    label,
    generatedAt: new Date(now).toISOString(), // UTC ISO — 앱이 "○분 전" 계산
  });

  await mkdir('public', { recursive: true });
  await writeFile('public/weather.json', JSON.stringify(bundle, null, 2) + '\n');
  console.log(`published public/weather.json (current.tempC=${bundle.current.tempC})`);
}

// 새 발행이 실패했을 때, 이미 배포돼 있는 직전 weather.json을 그대로 유지한다.
// weather.json은 repo에 커밋하지 않으므로 라이브 사본을 받아 다시 쓴다.
// → 일시적 기상청 오류가 워크플로 실패(=이메일/GitHub 알림)로 번지지 않고,
//   앱은 직전 날씨를 신선도("○분 전")와 함께 계속 보여준다. codex 사진 배포도 막지 않는다.
async function preservePrevious() {
  const res = await fetch(LIVE_WEATHER_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`직전 weather.json 가져오기 실패: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir('public', { recursive: true });
  await writeFile('public/weather.json', text);
  console.log('직전 weather.json 유지(라이브 사본).');
}

async function main() {
  try {
    await buildFresh();
  } catch (e) {
    console.error('새 날씨 발행 실패:', e.message, '— 직전 날씨 유지로 흡수합니다.');
    await preservePrevious(); // 이마저 실패하면 아래 catch에서 진짜 실패로 처리
  }
}

main().catch((e) => {
  console.error('발행 실패(직전 날씨도 가져오지 못함):', e.message);
  process.exit(1);
});
