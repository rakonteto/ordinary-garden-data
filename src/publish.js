import { mkdir, writeFile } from 'node:fs/promises';
import { latLonToGrid } from './grid.js';
import { ncstBaseDateTime, vilageBaseDateTime } from './baseTime.js';
import { fetchKma, parseNcst, parseVilage } from './kma.js';
import { fetchAir, parseAir } from './air.js';
import { buildWeatherBundle } from './fuse.js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 누락`);
  return v;
}

async function main() {
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

main().catch((e) => {
  console.error('발행 실패:', e.message);
  process.exit(1);
});
