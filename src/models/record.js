import { isValidDateString, todayString } from '../utils/date.js';

/**
 * 수련 기록 스키마
 * 서버 DB로 옮길 때도 이 형태를 그대로 테이블/문서 구조로 쓰면 된다.
 *
 * {
 *   id:        string   // UUID
 *   date:      string   // 'YYYY-MM-DD'
 *   lesson:    string   // 수업 이름 (예: '새벽요가(빈야샤)')
 *   asanaIds:  string[] // src/data/asanas.js 의 id 목록
 *   content:   string   // 수업 내용
 *   challenge: string   // 오늘의 도전
 *   change:    string   // 오늘의 변화
 *   memo:      string   // 메모
 *   createdAt: string   // ISO datetime
 *   updatedAt: string   // ISO datetime
 * }
 */

/**
 * 폼에 표시하는 텍스트 항목 — 라벨/안내 문구를 한곳에서 관리
 * markdown: true 인 항목은 마크다운으로 작성하고, 상세 화면에서 서식이 적용되어 보인다.
 */
export const TEXT_FIELDS = [
  { key: 'content', label: '수업 내용', placeholder: '오늘 배운 동작이나 수업의 흐름을 적어 보세요\n예) - 다운독 5호흡', markdown: true },
  { key: 'challenge', label: '오늘의 도전', placeholder: '어려웠던 자세, 새롭게 시도해 본 자세', markdown: true },
  { key: 'change', label: '오늘의 변화', placeholder: '몸의 감각, 유연성, 균형, 호흡에서 느낀 점', markdown: true },
  { key: 'memo', label: '메모', placeholder: '선생님의 설명이나 궁금했던 점', markdown: true },
];

export const MAX_TEXT_LENGTH = 2000;
export const MAX_LESSON_LENGTH = 40;

export function createEmptyDraft() {
  return { date: todayString(), lesson: '', asanaIds: [], content: '', challenge: '', change: '', memo: '' };
}

/** 저장 전 공백 정리 */
export function cleanDraft(draft) {
  return {
    date: draft.date,
    lesson: (draft.lesson ?? '').trim(),
    asanaIds: [...new Set(draft.asanaIds)],
    ...Object.fromEntries(TEXT_FIELDS.map(({ key }) => [key, (draft[key] ?? '').trim()])),
  };
}

/** 검증 결과: { 필드키: 에러메시지 }. 비어 있으면 통과 */
export function validateDraft(draft) {
  const errors = {};

  if (!draft.date) {
    errors.date = '날짜를 선택해 주세요.';
  } else if (!isValidDateString(draft.date)) {
    errors.date = '올바른 날짜가 아니에요.';
  } else if (draft.date > todayString()) {
    errors.date = '미래의 날짜는 기록할 수 없어요.';
  }

  if ((draft.lesson ?? '').trim().length > MAX_LESSON_LENGTH) {
    errors.lesson = `수업 이름은 ${MAX_LESSON_LENGTH}자까지 쓸 수 있어요.`;
  }

  for (const { key, label } of TEXT_FIELDS) {
    if ((draft[key] ?? '').length > MAX_TEXT_LENGTH) {
      errors[key] = `${label}은(는) ${MAX_TEXT_LENGTH.toLocaleString()}자까지 쓸 수 있어요.`;
    }
  }

  const hasText = TEXT_FIELDS.some(({ key }) => (draft[key] ?? '').trim());
  if (!hasText && !(draft.lesson ?? '').trim() && draft.asanaIds.length === 0) {
    errors.form = '아사나를 하나 이상 선택하거나, 오늘의 수련을 한 줄이라도 적어 주세요.';
  }

  return errors;
}

/** 전에 입력한 수업 이름 목록 (최근에 쓴 순서, 중복 없이) — 수업 이름 빠른 선택용 */
export function recentLessons(records, limit = 8) {
  const names = [];
  for (const record of sortRecords(records)) {
    const name = record.lesson?.trim();
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}

/** 최신 날짜가 위로, 같은 날짜면 나중에 쓴 기록이 위로 */
export function sortRecords(records) {
  return [...records].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}
