/**
 * 백업 내보내기 / 가져오기
 * ------------------------------------------------------------
 * 기록은 주소(사이트)마다 브라우저 안에 따로 저장되므로,
 * 다른 주소·다른 기기로 옮길 때는 백업 파일(JSON)을 거쳐야 한다.
 *
 * 백업 파일 형태
 * { app: 'asana-log', version: 1, exportedAt, records, customAsanas, asanaImages }
 *
 * 가져오기는 "합치기" 방식이다. 기존 기록은 지우지 않고,
 * 같은 기록(id)이 양쪽에 있으면 더 최근에 수정된 쪽을 남긴다.
 * ------------------------------------------------------------
 */
import {
  loadAsanaImages,
  loadCustomAsanas,
  loadRecords,
  saveAsanaImages,
  saveCustomAsanas,
  saveRecords,
} from './localStorageAdapter.js';
import { isValidDateString } from '../utils/date.js';

const APP = 'asana-log';
const VERSION = 1;

export async function createBackup() {
  return {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    records: loadRecords(),
    customAsanas: loadCustomAsanas(),
    asanaImages: loadAsanaImages(),
  };
}

export async function getDataStats() {
  return {
    records: loadRecords().length,
    customAsanas: loadCustomAsanas().length,
    images: Object.keys(loadAsanaImages()).length,
  };
}

const str = (value) => (typeof value === 'string' ? value : '');

/** 파일 내용이 올바른 기록인지 확인하고, 빠진 항목은 빈 값으로 채운다 */
function normalizeRecord(r) {
  if (!r || typeof r !== 'object' || !str(r.id) || !isValidDateString(r.date)) return null;
  return {
    id: r.id,
    date: r.date,
    lesson: str(r.lesson),
    asanaIds: Array.isArray(r.asanaIds) ? r.asanaIds.filter((id) => typeof id === 'string') : [],
    content: str(r.content),
    challenge: str(r.challenge),
    change: str(r.change),
    memo: str(r.memo),
    createdAt: str(r.createdAt) || new Date().toISOString(),
    updatedAt: str(r.updatedAt) || str(r.createdAt),
  };
}

function normalizeAsana(a) {
  if (!a || typeof a !== 'object' || !str(a.id) || !str(a.ko).trim()) return null;
  return {
    id: a.id,
    ko: str(a.ko),
    en: str(a.en),
    sa: str(a.sa),
    category: str(a.category),
    description: str(a.description),
    isCustom: true,
    createdAt: str(a.createdAt),
    updatedAt: str(a.updatedAt),
  };
}

/** 백업 파일 텍스트 → 검증된 백업 데이터. 형식이 맞지 않으면 Error */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('파일을 읽을 수 없어요. Asana Log에서 내보낸 백업 파일인지 확인해 주세요.');
  }
  if (data?.app !== APP || !Array.isArray(data.records)) {
    throw new Error('Asana Log 백업 파일이 아니에요.');
  }
  const images = data.asanaImages && typeof data.asanaImages === 'object' ? data.asanaImages : {};
  return {
    exportedAt: str(data.exportedAt),
    records: data.records.map(normalizeRecord).filter(Boolean),
    customAsanas: (Array.isArray(data.customAsanas) ? data.customAsanas : []).map(normalizeAsana).filter(Boolean),
    asanaImages: Object.fromEntries(
      Object.entries(images).filter(([id, url]) => typeof url === 'string' && url.startsWith('data:image/') && id),
    ),
  };
}

/** id 기준 합치기: 새 항목은 추가, 겹치면 updatedAt 이 더 최근인 쪽 */
function mergeById(local, incoming) {
  const merged = [...local];
  const index = new Map(local.map((item, i) => [item.id, i]));
  let added = 0;
  let updated = 0;
  for (const item of incoming) {
    if (!index.has(item.id)) {
      index.set(item.id, merged.length);
      merged.push(item);
      added += 1;
    } else {
      const i = index.get(item.id);
      if ((item.updatedAt ?? '') > (merged[i].updatedAt ?? '')) {
        merged[i] = item;
        updated += 1;
      }
    }
  }
  return { merged, added, updated };
}

/** 가져오면 어떻게 바뀌는지 미리 계산 (저장하지 않음) */
export async function previewImport(backup) {
  const records = mergeById(loadRecords(), backup.records);
  const asanas = mergeById(loadCustomAsanas(), backup.customAsanas);
  const localImages = loadAsanaImages();
  const newImages = Object.keys(backup.asanaImages).filter((id) => !localImages[id]).length;
  return {
    records: { added: records.added, updated: records.updated, total: backup.records.length },
    asanas: { added: asanas.added, updated: asanas.updated, total: backup.customAsanas.length },
    images: newImages,
  };
}

/** 실제로 합쳐서 저장. 사진은 이 기기에 없는 것만 추가한다. */
export async function applyImport(backup) {
  const records = mergeById(loadRecords(), backup.records);
  const asanas = mergeById(loadCustomAsanas(), backup.customAsanas);
  saveRecords(records.merged);
  saveCustomAsanas(asanas.merged);

  // 사진은 용량이 커서 마지막에 저장 (공간이 부족해도 기록은 먼저 옮겨지도록)
  const images = loadAsanaImages();
  let imageCount = 0;
  for (const [id, url] of Object.entries(backup.asanaImages)) {
    if (!images[id]) {
      images[id] = url;
      imageCount += 1;
    }
  }
  if (imageCount > 0) {
    try {
      saveAsanaImages(images);
    } catch {
      throw new Error('기록과 아사나는 가져왔지만, 저장 공간이 부족해서 사진은 가져오지 못했어요.');
    }
  }
  return { records: records.added + records.updated, asanas: asanas.added + asanas.updated, images: imageCount };
}
