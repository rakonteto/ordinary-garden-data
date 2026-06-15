const KST = 9 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// epoch(ms, UTC)에 KST 오프셋을 더해, UTC 필드를 KST '벽시계'로 읽는다.
function kstWall(nowMs) {
  return new Date(nowMs + KST);
}
function ymd(d) {
  return `${d.getUTCFullYear()}` +
    `${String(d.getUTCMonth() + 1).padStart(2, '0')}` +
    `${String(d.getUTCDate()).padStart(2, '0')}`;
}

// 초단기실황: 매시 정시 관측이나 API 제공은 매시 40분 이후.
// 분<40이면 이번 정시 자료가 아직 없어 직전 정시 회차를 쓴다.
export function ncstBaseDateTime(nowMs) {
  let t = kstWall(nowMs).getTime();
  if (new Date(t).getUTCMinutes() < 40) t -= HOUR;
  const d = new Date(t);
  return { base_date: ymd(d), base_time: `${String(d.getUTCHours()).padStart(2, '0')}00` };
}

// 단기예보 발표 회차: 02,05,08,11,14,17,20,23시. 발표 후 10분 여유.
const VILAGE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
export function vilageBaseDateTime(nowMs) {
  const w = kstWall(nowMs);
  const hour = w.getUTCHours();
  const min = w.getUTCMinutes();
  const avail = VILAGE_HOURS.filter((h) => hour > h || (hour === h && min >= 10));
  if (avail.length === 0) {
    // 당일 02시 발표 전 → 전날 23시 회차
    const y = new Date(nowMs + KST - 24 * HOUR);
    return { base_date: ymd(y), base_time: '2300' };
  }
  const h = avail[avail.length - 1];
  return { base_date: ymd(w), base_time: `${String(h).padStart(2, '0')}00` };
}
