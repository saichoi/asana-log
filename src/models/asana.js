import { CATEGORIES } from '../data/asanas.js';
import { normalize } from '../utils/search.js';

/**
 * 앱에서 추가하는 아사나 스키마
 * { id, ko, en, sa, category, description, isCustom: true, createdAt, updatedAt }
 */
export const ASANA_LIMITS = { ko: 40, en: 60, sa: 60, description: 1000 };

export function createEmptyAsanaDraft() {
  return { ko: '', en: '', sa: '', category: CATEGORIES[0], description: '' };
}

export function cleanAsanaDraft(draft) {
  return {
    ko: draft.ko.trim(),
    en: draft.en.trim(),
    sa: draft.sa.trim(),
    category: draft.category,
    description: draft.description.trim(),
    isCustom: true,
  };
}

/** 검증 결과: { 필드키: 에러메시지 }. editingId 는 수정 중인 자기 자신을 중복 검사에서 빼기 위함 */
export function validateAsanaDraft(draft, allAsanas, editingId = null) {
  const errors = {};
  const others = allAsanas.filter((asana) => asana.id !== editingId);

  if (!draft.ko.trim()) errors.ko = '한국어 이름을 입력해 주세요.';

  for (const key of ['ko', 'en', 'sa']) {
    const value = draft[key].trim();
    if (value.length > ASANA_LIMITS[key]) {
      errors[key] = `${ASANA_LIMITS[key]}자까지 입력할 수 있어요.`;
    } else if (value && others.some((asana) => asana[key] && normalize(asana[key]) === normalize(value))) {
      errors[key] = '사전에 같은 이름의 자세가 이미 있어요.';
    }
  }

  if (!CATEGORIES.includes(draft.category)) errors.category = '분류를 선택해 주세요.';
  if (draft.description.length > ASANA_LIMITS.description) {
    errors.description = `${ASANA_LIMITS.description.toLocaleString()}자까지 입력할 수 있어요.`;
  }
  return errors;
}
