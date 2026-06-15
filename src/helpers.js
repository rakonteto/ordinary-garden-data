// 공용 순수 변환기. 결측/특이값은 null 또는 0으로 정규화.
export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
export const int = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
// 1시간 강수량(RN1): "강수없음" → 0
export const rn1 = (v) =>
  v == null || v === '강수없음' || v === '-' ? 0 : (parseFloat(v) || 0);
// 강수량(PCP): "강수없음"/"1.0mm"/"1mm 미만" 등 → 숫자(mm)
// "1mm 미만"은 parseFloat로 1(보수적 상한)으로 매핑된다.
export const pcp = (v) =>
  v == null || v === '강수없음' || v === '-' ? 0 : (parseFloat(v) || 0);

// YYYYMMDD + HHMM → ISO8601(+09:00)
export const isoKst = (yyyymmdd, hhmm) =>
  `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}` +
  `T${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}:00+09:00`;
// YYYYMMDD → YYYY-MM-DD
export const isoDate = (yyyymmdd) =>
  `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
