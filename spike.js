// 연결 스파이크 (임시) — 농사로 "실내정원용 식물"(garden) API가
// 서버(Node)에서 발급키로 호출되는지 + 응답 필드/코드값 확인.
// 실행: NONGSARO_KEY='발급받은_Decoding_키' node spike.js
// (키는 명령줄에만 — 소스/깃에 남기지 않음. 결과 XML엔 키가 안 들어갑니다.)
// 확인 후 이 파일은 삭제하고 정식 src/ 구조로 옮깁니다.

const KEY = process.env.NONGSARO_KEY;
if (!KEY) {
  console.error('환경변수 NONGSARO_KEY 가 필요합니다. 예: NONGSARO_KEY=\'키\' node spike.js');
  process.exit(1);
}

const BASE = 'http://api.nongsaro.go.kr/service/garden';

// CDATA 래퍼 벗기기 — <![CDATA[12938]]> → 12938  (상세 호출 실패 원인이었음)
const stripCdata = (s) =>
  s == null ? s : s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();

// XML에서 첫 번째 태그 값 추출(의존성 0, 거친 정규식 — 스파이크 전용). CDATA는 벗김.
const pick = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? stripCdata(m[1]) : undefined;
};

// <body> 안의 모든 리프 태그(이름:값) 덤프 — 어댑터에 쓸 실제 필드명을 보려고.
// 값이 CDATA이거나 '<'가 없는 텍스트인 태그만 잡으면 컨테이너(item 등)는 자동 제외.
const dumpLeaves = (xml) => {
  const body = (xml.match(/<body>([\s\S]*?)<\/body>/) || [])[1] || xml;
  const re = /<([a-zA-Z][\w]*)>(<!\[CDATA\[[\s\S]*?\]\]>|[^<]*?)<\/\1>/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) out.push([m[1], stripCdata(m[2])]);
  return out;
};

async function getText(url, label) {
  const safe = url.replace(encodeURIComponent(KEY), 'KEY').replace(KEY, 'KEY');
  console.log(`\n--- ${label} ---\nGET ${safe}`);
  const res = await fetch(url);
  const text = await res.text();
  console.log('HTTP', res.status, '| length', text.length);
  return text;
}

async function main() {
  // 1) 목록 — apiKey 통하는지 + 결과코드 + 첫 콘텐츠번호
  const listUrl = `${BASE}/gardenList?apiKey=${encodeURIComponent(KEY)}&numOfRows=3&pageNo=1`;
  const listXml = await getText(listUrl, 'gardenList (목록)');
  const resultCode = pick(listXml, 'resultCode') ?? pick(listXml, 'returnReasonCode');
  console.log('resultCode:', resultCode, '(00=정상, 11=인증키오류, 12=중지, 13=미제공, 15=AJAX도메인, 22=초과)');
  console.log('--- 목록 XML 앞부분 ---\n' + listXml.slice(0, 1200));

  const cntntsNo = pick(listXml, 'cntntsNo');
  if (!cntntsNo) {
    console.log('\n첫 cntntsNo를 못 찾음 — 위 결과코드/메시지를 확인하세요.');
    return;
  }
  console.log('\n추출한 cntntsNo:', JSON.stringify(cntntsNo), '(CDATA 벗긴 값 — 숫자만 나와야 정상)');

  // 2) 상세 — 광요구도/계절 물주기/생육온도/관리수준 필드 존재 확인
  const dtlUrl = `${BASE}/gardenDtl?apiKey=${encodeURIComponent(KEY)}&cntntsNo=${encodeURIComponent(cntntsNo)}`;
  const dtlXml = await getText(dtlUrl, `gardenDtl (상세, cntntsNo=${cntntsNo})`);
  const dtlCode = pick(dtlXml, 'resultCode') ?? pick(dtlXml, 'returnReasonCode');
  console.log('상세 resultCode:', dtlCode);

  // 상세 응답의 모든 리프 필드 — 실제 필드명/값 전체 보기(어댑터 매핑 확정용)
  console.log('\n--- 상세 전체 필드(리프 태그) ---');
  const leaves = dumpLeaves(dtlXml);
  if (leaves.length === 0) {
    console.log('(body/리프 없음 — 위 resultCode 확인)\n' + dtlXml.slice(0, 1000));
  } else {
    for (const [k, v] of leaves) {
      const val = v.length > 140 ? v.slice(0, 140) + '…' : v;
      console.log(`${k}: ${JSON.stringify(val)}`);
    }
  }

  // 내가 예상한 후보 필드명이 맞는지 대조(한글 의미 주석과 함께)
  const fields = [
    'cntntsSj', 'plntbneNm', 'plntzrNm',          // 국명/학명/영명
    'lighttdemanddoCodeNm',                        // 광요구도
    'watercycleSprngCodeNm', 'watercycleSummerCodeNm', 'watercycleAutumnCodeNm', 'watercycleWinterCodeNm', // 계절 물주기
    'grwhTpmpCodeNm', 'winterLwetTpCodeNm',        // 생육적온/겨울최저
    'managelevelCodeNm', 'managedemanddoCodeNm',   // 관리수준/요구도
    'toxctyInfo',                                  // 독성
  ];
  console.log('\n--- 후보 필드 점검(예상 이름 대조) ---');
  for (const f of fields) {
    const v = pick(dtlXml, f);
    console.log(`${f}: ${v === undefined ? '(없음)' : JSON.stringify(v)}`);
  }
}

main().catch((e) => { console.error('\n스파이크 실패:', e.message); process.exit(1); });
