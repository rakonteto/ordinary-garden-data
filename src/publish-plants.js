import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { collectGarden, buildCatalog, shouldPublish } from './garden/build-catalog.js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 누락`);
  return v;
}

async function prevCount(path) {
  try {
    const json = JSON.parse(await readFile(path, 'utf8'));
    return Array.isArray(json.items) ? json.items.length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const key = requireEnv('NONGSARO_SERVICE_KEY');
  const out = 'public/plants.json';
  const { items, missing } = await collectGarden(key);
  const prev = await prevCount(out);
  if (!shouldPublish(items.length, prev)) {
    throw new Error(`발행 거부: 신규 ${items.length}종 / 직전 ${prev}종 (직전의 50% 미만) — 기존 유지`);
  }
  const catalog = buildCatalog(items, new Date().toISOString());
  await mkdir('public', { recursive: true });
  await writeFile(out, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`published ${out} (${items.length}종, 제외 ${missing.length}종)`);
}

main().catch((e) => {
  console.error('발행 실패:', e.message);
  process.exit(1);
});
