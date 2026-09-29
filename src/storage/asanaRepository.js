/**
 * 내가 추가한 아사나 + 아사나 사진 저장소
 * ------------------------------------------------------------
 * 기본 아사나(src/data/asanas.js)는 코드에 들어 있고,
 * 앱에서 추가한 아사나와 올린 사진만 여기에서 저장한다.
 * recordRepository 와 마찬가지로 모든 함수가 Promise 를 반환한다.
 */
import { loadAsanaImages, loadCustomAsanas, saveAsanaImages, saveCustomAsanas } from './localStorageAdapter.js';
import { cleanAsanaDraft } from '../models/asana.js';

function newId() {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  return `custom-${random}`;
}

export async function listCustomAsanas() {
  return loadCustomAsanas();
}

export async function createCustomAsana(draft) {
  const now = new Date().toISOString();
  const asana = { id: newId(), ...cleanAsanaDraft(draft), createdAt: now, updatedAt: now };
  saveCustomAsanas([...loadCustomAsanas(), asana]);
  return asana;
}

export async function updateCustomAsana(id, draft) {
  const asanas = loadCustomAsanas();
  const index = asanas.findIndex((asana) => asana.id === id);
  if (index === -1) throw new Error('수정할 아사나를 찾을 수 없어요.');
  asanas[index] = { ...asanas[index], ...cleanAsanaDraft(draft), updatedAt: new Date().toISOString() };
  saveCustomAsanas(asanas);
  return asanas[index];
}

export async function deleteCustomAsana(id) {
  saveCustomAsanas(loadCustomAsanas().filter((asana) => asana.id !== id));
  await setAsanaImage(id, null);
}

export async function listAsanaImages() {
  return loadAsanaImages();
}

/** dataUrl 이 null 이면 사진 삭제 */
export async function setAsanaImage(id, dataUrl) {
  const images = loadAsanaImages();
  if (dataUrl) images[id] = dataUrl;
  else delete images[id];
  saveAsanaImages(images);
  return images;
}
