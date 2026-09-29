/**
 * 검색용 문자열 정규화
 * - 대소문자 무시
 * - 발음 기호 제거 (Vṛkṣāsana → vrksasana)
 * - 공백, 하이픈, 따옴표 무시 (Downward-Facing → downwardfacing, 전사 2번 → 전사2번)
 */
export function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\-_'’.·]/g, '');
}

/** 한국어·영어·산스크리트어 이름과 별칭 중 하나라도 검색어를 포함하면 결과에 포함 */
export function searchAsanas(asanas, query) {
  const q = normalize(query);
  if (!q) return asanas;
  return asanas.filter((asana) =>
    [asana.ko, asana.en, asana.sa, ...(asana.aliases ?? [])].some((name) => normalize(name).includes(q)),
  );
}
