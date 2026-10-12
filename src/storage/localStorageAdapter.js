/**
 * localStorage 어댑터 — 브라우저 저장소에 직접 접근하는 유일한 파일.
 * 각 키에는 { version: 1, data: ... } 형태로 저장한다.
 */
const VERSION = 1;

export const KEYS = {
  records: 'asana-log:records',
  customAsanas: 'asana-log:custom-asanas',
  asanaImages: 'asana-log:asana-images',
  syncMeta: 'asana-log:sync-meta',
  syncState: 'asana-log:sync-state',
  legacyChecked: 'asana-log:legacy-checked',
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

/**
 * 동기화할 때 필요한 부가 정보 (기록과 함께 Drive 파일에도 들어간다)
 * - imageTimes: { [asanaId]: 사진을 올린 시각 }
 * - deleted:    지운 항목의 { [id]: 지운 시각 } — 다른 기기에서도 지워지도록 남겨 두는 표시
 */
export const loadSyncMeta = () => {
  const meta = read(KEYS.syncMeta, null);
  const map = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
  return {
    imageTimes: map(meta?.imageTimes),
    deleted: {
      records: map(meta?.deleted?.records),
      customAsanas: map(meta?.deleted?.customAsanas),
      images: map(meta?.deleted?.images),
    },
  };
};
export const saveSyncMeta = (meta) => write(KEYS.syncMeta, meta);

/** Google Drive 연결 상태 (이 기기에만 저장, 동기화 대상 아님) */
export const loadSyncState = () => {
  const state = read(KEYS.syncState, null);
  return state && typeof state === 'object' ? state : {};
};
export const saveSyncState = (state) => write(KEYS.syncState, state);

/** 예전 Firebase 계정의 기록을 이 기기로 옮겼는지 한 번만 확인하기 위한 표시 */
export const isLegacyChecked = () => read(KEYS.legacyChecked, false) === true;
export const setLegacyChecked = () => write(KEYS.legacyChecked, true);
