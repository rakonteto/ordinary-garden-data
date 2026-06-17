// 농사로 코드/텍스트 → plants.json enum. 미상은 null(category는 'other').
// 키워드 매핑은 가울테리아 1종 실측 기준 잠정 — 1차 수집 분포로 보강.

// 분류: clCodeNm("잎&꽃보기식물,열매보기식물") → category. 구체적인 것 우선(열매>꽃>잎).
export const category = (clCodeNm) => {
  const s = clCodeNm ?? '';
  if (s.includes('열매')) return 'fruit';
  if (s.includes('꽃')) return 'flower';
  if (s.includes('잎')) return 'foliage';
  return 'other';
};

// 광요구도: lighttdemanddoCodeNm 복수 → 최소 단계(낮은<중간<높은).
export const lightLevel = (codeNm) => {
  const s = codeNm ?? '';
  if (s.includes('낮은 광도') || s.includes('음지')) return 'low';
  if (s.includes('중간 광도')) return 'medium';
  if (s.includes('높은 광도') || s.includes('양지')) return 'high';
  return null;
};

// 관리수준: managelevelCodeNm → difficulty.
export const difficulty = (codeNm) => {
  const s = codeNm ?? '';
  if (s.includes('초보') || s.includes('초심')) return 'easy';
  if (s.includes('경험')) return 'medium';
  if (s.includes('전문')) return 'hard';
  return null;
};

// 생육적온: grwhTpCodeNm("16~20℃") → "16~20". 범위 없으면 원문(trim), 빈값 null.
export const tempRange = (codeNm) => {
  if (!codeNm) return null;
  const m = codeNm.match(/(\d+)\s*~\s*(\d+)/);
  return m ? `${m[1]}~${m[2]}` : codeNm.trim();
};
