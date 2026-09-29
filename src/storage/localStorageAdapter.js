/**
 * localStorage 어댑터 — 브라우저 저장소에 직접 접근하는 유일한 파일.
 * 각 키에는 { version: 1, data: ... } 형태로 저장한다.
 */
const VERSION = 1;

export const KEYS = {
  records: 'asana-log:records',
  customAsanas: 'asana-log:custom-asanas',
  asanaImages: 'asana-log:asana-images',
};

export class StorageError extends Error {}

function read(key, fallback) {
  let raw;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    throw new StorageError('브라우저 저장소에 접근할 수 없어요. 사생활 보호 모드인지 확인해 주세요.');
  }
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    // 이전 버전은 기록을 { records: [...] } 로 저장했으므로 함께 읽어 준다.
    return parsed?.data ?? parsed?.records ?? fallback;
  } catch {
    // 데이터가 손상된 경우: 원본을 백업 키에 남겨 두고 기본값으로 시작
    try {
      window.localStorage.setItem(`${key}:corrupted-backup`, raw);
    } catch {
      /* 백업 실패는 무시 */
    }
    return fallback;
  }
}

function write(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: VERSION, data }));
  } catch {
    throw new StorageError('저장 공간이 부족하거나 저장소를 사용할 수 없어 저장하지 못했어요.');
  }
}

export const loadRecords = () => {
  const records = read(KEYS.records, []);
  return Array.isArray(records) ? records : [];
};
export const saveRecords = (records) => write(KEYS.records, records);

export const loadCustomAsanas = () => {
  const asanas = read(KEYS.customAsanas, []);
  return Array.isArray(asanas) ? asanas : [];
};
export const saveCustomAsanas = (asanas) => write(KEYS.customAsanas, asanas);

/** { [asanaId]: 'data:image/jpeg;base64,...' } */
export const loadAsanaImages = () => {
  const images = read(KEYS.asanaImages, {});
  return images && typeof images === 'object' ? images : {};
};
export const saveAsanaImages = (images) => write(KEYS.asanaImages, images);

/** 이 기기에 저장된 기록이 있는지 (로그인 시 계정으로 옮길 게 있는지 확인용) */
export const hasLocalData = () =>
  loadRecords().length > 0 || loadCustomAsanas().length > 0 || Object.keys(loadAsanaImages()).length > 0;

/** 계정으로 옮긴 뒤 이 기기의 기록 비우기 */
export function clearLocalData() {
  try {
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* 저장소 접근 불가 시 무시 */
  }
}
