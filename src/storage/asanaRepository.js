/**
 * 내가 추가한 아사나 + 아사나 사진 저장소
 * ------------------------------------------------------------
 * 기본 아사나(src/data/asanas.js)는 코드에 들어 있고,
 * 앱에서 추가한 아사나와 올린 사진만 여기에서 저장한다.
 * recordRepository 와 마찬가지로 항상 이 기기에 저장한다.
 * ------------------------------------------------------------
 */
import { loadAsanaImages, loadCustomAsanas, saveAsanaImages, saveCustomAsanas } from './localStorageAdapter.js';
import { markDeleted, markImages, reviveDeleted } from './localData.js';
import { emitDataChange } from './changes.js';
import { cleanAsanaDraft } from '../models/asana.js';

function newId() {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  return `custom-${random}`;
}

export async function listCustomAsanas() {
  return loadCustomAsanas();
}

export async function listAsanaImages() {
  return loadAsanaImages();
}

function putAll(items) {
  const byId = new Map(loadCustomAsanas().map((a) => [a.id, a]));
  items.forEach((a) => byId.set(a.id, a));
  saveCustomAsanas([...byId.values()]);
  emitDataChange('local');
}

export async function createCustomAsana(draft) {
  const now = new Date().toISOString();
  const asana = { id: newId(), ...cleanAsanaDraft(draft), createdAt: now, updatedAt: now };
  putAll([asana]);
  return asana;
}

/** existing: 지금 화면에 있는 원래 아사나 */
export async function updateCustomAsana(existing, draft) {
  if (!existing) throw new Error('수정할 아사나를 찾을 수 없어요.');
  const updated = { ...existing, ...cleanAsanaDraft(draft), updatedAt: new Date().toISOString() };
  putAll([updated]);
  return updated;
}

export async function deleteCustomAsana(id) {
  saveCustomAsanas(loadCustomAsanas().filter((asana) => asana.id !== id));
  markDeleted('customAsanas', id);
  await setAsanaImage(id, null);
}

/** dataUrl 이 null 이면 사진 삭제 */
export async function setAsanaImage(id, dataUrl) {
  const images = loadAsanaImages();
  const had = id in images;
  if (dataUrl) images[id] = dataUrl;
  else delete images[id];
  saveAsanaImages(images);
  if (dataUrl || had) markImages([id], Boolean(dataUrl));
  emitDataChange('local');
}

/** 백업 가져오기용 */
export async function putCustomAsanas(items) {
  if (items.length === 0) return;
  putAll(reviveDeleted('customAsanas', items));
}

/** entries: [[asanaId, dataUrl], ...] */
export async function putAsanaImages(entries) {
  if (entries.length === 0) return;
  const images = loadAsanaImages();
  entries.forEach(([id, url]) => {
    images[id] = url;
  });
  saveAsanaImages(images);
  markImages(entries.map(([id]) => id), true);
  emitDataChange('local');
}
