// 농사로 XML 응답을 의존성 없이 파싱하는 유틸 (연결 스파이크에서 승격).

// CDATA 래퍼 제거: <![CDATA[12938]]> → 12938
export const stripCdata = (s) =>
  s == null ? s : s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();

// 첫 번째 <tag>…</tag> 값(CDATA 벗김). 없으면 undefined.
export const pick = (xml, tag) => {
  if (xml == null) return undefined;
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? stripCdata(m[1]) : undefined;
};

// header 결과코드 (00=정상). 일부 서비스는 returnReasonCode를 씀.
export const resultCode = (xml) => pick(xml, 'resultCode') ?? pick(xml, 'returnReasonCode');

// 목록 <item>…</item> 블록 내용을 각각 문자열로.
export const items = (xml) => {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
};

// 파이프(|) 구분 다중값 → 배열.
export const splitPipe = (v) => (v == null || v === '' ? [] : v.split('|'));
