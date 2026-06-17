import { pick, splitPipe } from './xml.js';
import { category, lightLevel, difficulty, tempRange } from './normalize.js';

// 목록 item에서 대표이미지 URL. rtnImgSeCode가 '209006'인 위치의 URL,
// 없으면 첫 URL, 그것도 없으면 null.
export function representativeImage(listItemXml) {
  const urls = splitPipe(pick(listItemXml, 'rtnFileUrl'));
  if (urls.length === 0) return null;
  const codes = splitPipe(pick(listItemXml, 'rtnImgSeCode'));
  const i = codes.findIndex((c) => c === '209006');
  return (i >= 0 ? urls[i] : urls[0]) || null;
}

// 목록 item + 상세 XML → CatalogItem. 필수값 없으면 null(호출부에서 제외).
export function buildCatalogItem(listItemXml, detailXml) {
  const cntntsNo = pick(listItemXml, 'cntntsNo');
  const commonName = pick(listItemXml, 'cntntsSj');
  // cntntsNo·commonName·detailXml 중 하나라도 없으면(빈 문자열 포함) 도감에서 제외
  if (!cntntsNo || !commonName || !detailXml) return null;
  return {
    id: `garden:${cntntsNo}`,
    commonName,
    scientificName: pick(detailXml, 'plntbneNm') ?? null,
    category: category(pick(detailXml, 'clCodeNm')),
    thumbnailURL: representativeImage(listItemXml),
    lightLevel: lightLevel(pick(detailXml, 'lighttdemanddoCodeNm')),
    waterBySeason: null,
    difficulty: difficulty(pick(detailXml, 'managelevelCodeNm')),
    tempRange: tempRange(pick(detailXml, 'grwhTpCodeNm')),
    sowingSeason: pick(detailXml, 'prpgtEraInfo') ?? null,
    description: pick(detailXml, 'fncltyInfo') ?? null,
    sourceService: 'garden',
  };
}
