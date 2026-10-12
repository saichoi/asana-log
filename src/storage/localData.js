/**
 * 이 기기에 저장된 데이터 전체를 한 덩어리로 읽고 쓰기 + 삭제 표시 관리
 * ------------------------------------------------------------
 * 전체 데이터 형태 (동기화·합치기에서 쓰는 모양)
 * { records, customAsanas, images, imageTimes, deleted: { records, customAsanas, images } }
 * ------------------------------------------------------------
 */
import {
  loadAsanaImages,
  loadCustomAsanas,
  loadRecords,
  loadSyncMeta,
  saveAsanaImages,
  saveCustomAsanas,
  saveRecords,
  saveSyncMeta,
} from './localStorageAdapter.js';

export function readLocalData() {
  return { records: loadRecords(), customAsanas: loadCustomAsanas(), images: loadAsanaImages(), ...loadSyncMeta() };
}

export function writeLocalData({ records, customAsanas, images, imageTimes, deleted }) {
  saveRecords(records);
  saveCustomAsanas(customAsanas);
  saveSyncMeta({ imageTimes, deleted });
  // 사진은 용량이 커서 마지막에 저장 (공간이 부족해도 기록은 먼저 저장되도록)
  saveAsanaImages(images);
}

/** kind: 'records' | 'customAsanas' — 지운 시각을 남겨 다른 기기에서도 지워지게 한다 */
export function markDeleted(kind, id) {
  const meta = loadSyncMeta();
  meta.deleted[kind][id] = new Date().toISOString();
  saveSyncMeta(meta);
}

/**
 * 백업에서 가져오는 항목 중 예전에 지웠던 것은 "지금 되살린 것"으로 만든다.
 * (수정 시각을 지금으로 올려야 동기화가 다시 지우지 않는다)
 */
export function reviveDeleted(kind, items) {
  const meta = loadSyncMeta();
  const deleted = meta.deleted[kind];
  const now = new Date().toISOString();
  const revived = items.map((item) => {
    if (!(item.id in deleted)) return item;
    const stale = (item.updatedAt ?? '') <= deleted[item.id];
    delete deleted[item.id];
    return stale ? { ...item, updatedAt: now } : item;
  });
  saveSyncMeta(meta);
  return revived;
}

/** 사진을 올리거나(present: true) 지운 시각 기록 */
export function markImages(ids, present) {
  const meta = loadSyncMeta();
  const now = new Date().toISOString();
  for (const id of ids) {
    if (present) {
      meta.imageTimes[id] = now;
      delete meta.deleted.images[id];
    } else {
      delete meta.imageTimes[id];
      meta.deleted.images[id] = now;
    }
  }
  saveSyncMeta(meta);
}
