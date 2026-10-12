/**
 * 동기화 파일 형태와 합치기 규칙 (저장소·네트워크를 건드리지 않는 순수 함수)
 * ------------------------------------------------------------
 * 파일 형태는 백업 파일에 imageTimes · deleted 가 더해진 것이다.
 * { app: 'asana-log', version: 1, exportedAt, records, customAsanas, asanaImages, imageTimes, deleted }
 *
 * 합치기 규칙
 * - 한쪽에만 있는 항목은 그대로 둔다.
 * - 같은 항목(id)이 양쪽에 있으면 더 최근에 수정된(updatedAt) 쪽을 남긴다.
 * - 지운 항목은 deleted 에 지운 시각이 남아 있어서 다른 기기에서도 지워진다.
 *   단, 지운 뒤에 다시 수정·추가된 항목은 살아남는다.
 * ------------------------------------------------------------
 */
import { isValidDateString } from '../utils/date.js';

const APP = 'asana-log';
const VERSION = 1;

/** 키 순서와 상관없이 같은 내용이면 같은 문자열 */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

const same = (a, b) => a === b || (a !== undefined && b !== undefined && stable(a) === stable(b));

/** a 가 b 를 이기는지: 더 최근 것, 시각이 같으면 어느 기기에서나 같은 쪽이 이기도록 내용으로 정한다 */
function wins(a, b) {
  const ta = a.updatedAt ?? '';
  const tb = b.updatedAt ?? '';
  if (ta !== tb) return ta > tb;
  return stable(a) > stable(b);
}

function mergeKind(local, remote, localDeleted, remoteDeleted) {
  const deleted = { ...localDeleted };
  for (const [id, time] of Object.entries(remoteDeleted)) {
    if (!(deleted[id] >= time)) deleted[id] = time;
  }

  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteById = new Map(remote.map((item) => [item.id, item]));
  const merged = new Map(localById);
  for (const item of remote) {
    const current = merged.get(item.id);
    if (!current || wins(item, current)) merged.set(item.id, item);
  }

  for (const [id, time] of Object.entries(deleted)) {
    const item = merged.get(id);
    if (!item) continue;
    if ((item.updatedAt ?? '') > time) delete deleted[id];
    else merged.delete(id);
  }

  const differsFrom = (byId, sideDeleted) =>
    byId.size !== merged.size || [...merged].some(([id, item]) => !same(byId.get(id), item)) || !same(sideDeleted, deleted);

  return {
    items: [...merged.values()],
    deleted,
    localChanged: differsFrom(localById, localDeleted),
    remoteChanged: differsFrom(remoteById, remoteDeleted),
  };
}

const imageItems = ({ images, imageTimes }) =>
  Object.entries(images).map(([id, dataUrl]) => ({ id, dataUrl, updatedAt: imageTimes[id] ?? '' }));

/**
 * 이 기기 데이터(local)와 Drive 파일(remote)을 합친다.
 * localChanged / remoteChanged: 합친 결과가 각각과 달라서 다시 저장·업로드해야 하는지
 */
export function mergeData(local, remote) {
  const records = mergeKind(local.records, remote.records, local.deleted.records, remote.deleted.records);
  const asanas = mergeKind(local.customAsanas, remote.customAsanas, local.deleted.customAsanas, remote.deleted.customAsanas);
  const images = mergeKind(imageItems(local), imageItems(remote), local.deleted.images, remote.deleted.images);

  return {
    data: {
      records: records.items,
      customAsanas: asanas.items,
      images: Object.fromEntries(images.items.map((item) => [item.id, item.dataUrl])),
      imageTimes: Object.fromEntries(images.items.filter((item) => item.updatedAt).map((item) => [item.id, item.updatedAt])),
      deleted: { records: records.deleted, customAsanas: asanas.deleted, images: images.deleted },
    },
    localChanged: records.localChanged || asanas.localChanged || images.localChanged,
    remoteChanged: records.remoteChanged || asanas.remoteChanged || images.remoteChanged,
  };
}

export function serializeSyncFile({ records, customAsanas, images, imageTimes, deleted }) {
  return JSON.stringify({
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    records,
    customAsanas,
    asanaImages: images,
    imageTimes,
    deleted,
  });
}

const list = (value) => (Array.isArray(value) ? value : []);
const stringMap = (value, keep = () => true) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === 'string' && keep(v)))
    : {};

/** Drive 파일 텍스트 → 전체 데이터. 빈 파일은 빈 데이터로 보고, 알 수 없는 내용이면 Error */
export function parseSyncFile(text) {
  let file = {};
  if (text.trim()) {
    try {
      file = JSON.parse(text);
    } catch {
      file = null;
    }
    if (file?.app !== APP) {
      throw new Error('Google Drive의 동기화 파일을 읽을 수 없어요. 파일이 손상됐다면 Drive에서 지운 뒤 다시 동기화해 주세요.');
    }
  }
  return {
    records: list(file.records).filter((r) => r && typeof r.id === 'string' && r.id && isValidDateString(r.date)),
    customAsanas: list(file.customAsanas).filter((a) => a && typeof a.id === 'string' && a.id && typeof a.ko === 'string' && a.ko.trim()),
    images: stringMap(file.asanaImages, (url) => url.startsWith('data:image/')),
    imageTimes: stringMap(file.imageTimes),
    deleted: {
      records: stringMap(file.deleted?.records),
      customAsanas: stringMap(file.deleted?.customAsanas),
      images: stringMap(file.deleted?.images),
    },
  };
}
