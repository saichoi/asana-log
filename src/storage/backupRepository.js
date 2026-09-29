/**
 * 백업 내보내기 / 가져오기 + 로그인 시 기기 기록을 계정으로 옮기기
 * ------------------------------------------------------------
 * 백업 파일 형태
 * { app: 'asana-log', version: 1, exportedAt, records, customAsanas, asanaImages }
 *
 * 가져오기(와 계정으로 옮기기)는 "합치기" 방식이다. 기존 기록은 지우지 않고,
 * 같은 기록(id)이 양쪽에 있으면 더 최근에 수정된 쪽을 남긴다.
 * 저장은 recordRepository / asanaRepository 를 거치므로
 * 로그인 상태면 계정(Firestore)에, 아니면 이 기기에 들어간다.
 * ------------------------------------------------------------
 */
import { clearLocalData, loadAsanaImages, loadCustomAsanas, loadRecords } from './localStorageAdapter.js';
import { COLLECTIONS, fetchAll } from './cloudStore.js';
import { putRecords } from './recordRepository.js';
import { putAsanaImages, putCustomAsanas } from './asanaRepository.js';
import { isValidDateString } from '../utils/date.js';

const APP = 'asana-log';
const VERSION = 1;

/** data: { records, customAsanas, images } — 지금 화면에 보이는 데이터 */
export function buildBackup({ records, customAsanas, images }) {
  return {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    records,
    customAsanas,
    asanaImages: images,
  };
}

const str = (value) => (typeof value === 'string' ? value : '');

/** 올바른 기록인지 확인하고, 빠진 항목은 빈 값으로 채운다 */
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

function normalizeImages(images) {
  if (!images || typeof images !== 'object') return {};
  return Object.fromEntries(
    Object.entries(images).filter(([id, url]) => id && typeof url === 'string' && url.startsWith('data:image/')),
  );
}

function normalizeData({ records = [], customAsanas = [], images = {} }) {
  return {
    records: (Array.isArray(records) ? records : []).map(normalizeRecord).filter(Boolean),
    customAsanas: (Array.isArray(customAsanas) ? customAsanas : []).map(normalizeAsana).filter(Boolean),
    images: normalizeImages(images),
  };
}

/** 백업 파일 텍스트 → { exportedAt, records, customAsanas, images }. 형식이 맞지 않으면 Error */
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
  return {
    exportedAt: str(data.exportedAt),
    ...normalizeData({ records: data.records, customAsanas: data.customAsanas, images: data.asanaImages }),
  };
}

/** 합칠 항목 고르기: 없는 건 추가, 겹치면 updatedAt 이 더 최근인 쪽 */
function pickNewer(current, incoming) {
  const byId = new Map(current.map((item) => [item.id, item]));
  const added = [];
  const updated = [];
  for (const item of incoming) {
    const existing = byId.get(item.id);
    if (!existing) added.push(item);
    else if ((item.updatedAt ?? '') > (existing.updatedAt ?? '')) updated.push(item);
  }
  return { added, updated, items: [...added, ...updated] };
}

/**
 * current(지금 데이터)에 incoming(가져올 데이터)을 합치면 무엇이 바뀌는지 계산 (저장하지 않음)
 * 사진은 지금 없는 것만 추가한다.
 */
export function planImport(current, incoming) {
  return {
    records: pickNewer(current.records, incoming.records),
    asanas: pickNewer(current.customAsanas, incoming.customAsanas),
    images: Object.entries(incoming.images).filter(([id]) => !current.images[id]),
  };
}

export const isEmptyPlan = (plan) => plan.records.items.length + plan.asanas.items.length + plan.images.length === 0;

/** 계산한 내용을 실제로 저장 */
export async function applyPlan(plan) {
  await putRecords(plan.records.items);
  await putCustomAsanas(plan.asanas.items);
  // 사진은 용량이 커서 마지막에 저장 (공간이 부족해도 기록은 먼저 옮겨지도록)
  try {
    await putAsanaImages(plan.images);
  } catch {
    throw new Error('기록과 아사나는 가져왔지만, 저장 공간이 부족해서 사진은 가져오지 못했어요.');
  }
  return { records: plan.records.items.length, asanas: plan.asanas.items.length, images: plan.images.length };
}

/**
 * Google 로그인 직후: 이 기기에 있던 기록을 계정으로 옮긴다.
 * 서버 저장이 끝난 뒤에만 이 기기의 기록을 비운다. (실패하면 그대로 두고 다음에 다시 시도)
 */
export async function migrateLocalToCloud(uid) {
  const local = normalizeData({ records: loadRecords(), customAsanas: loadCustomAsanas(), images: loadAsanaImages() });
  const [records, customAsanas, imageDocs] = await Promise.all([
    fetchAll(uid, COLLECTIONS.records),
    fetchAll(uid, COLLECTIONS.asanas),
    fetchAll(uid, COLLECTIONS.images),
  ]);
  const cloud = { records, customAsanas, images: Object.fromEntries(imageDocs.map((d) => [d.id, d.dataUrl])) };
  const result = await applyPlan(planImport(cloud, local));
  clearLocalData();
  return result;
}
