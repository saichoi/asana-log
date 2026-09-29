/**
 * 내가 추가한 아사나 + 아사나 사진 저장소
 * ------------------------------------------------------------
 * 기본 아사나(src/data/asanas.js)는 코드에 들어 있고,
 * 앱에서 추가한 아사나와 올린 사진만 여기에서 저장한다.
 * recordRepository 와 마찬가지로 로그인 상태면 Firestore, 아니면 이 기기에 저장한다.
 * ------------------------------------------------------------
 */
import { loadAsanaImages, loadCustomAsanas, saveAsanaImages, saveCustomAsanas } from './localStorageAdapter.js';
import { COLLECTIONS, putDoc, putMany, removeDoc } from './cloudStore.js';
import { cloudUid } from './session.js';
import { cleanAsanaDraft } from '../models/asana.js';

function newId() {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  return `custom-${random}`;
}

/** 이 기기에 저장된 것 (로그인 상태에서는 AsanaContext 가 Firestore 를 구독) */
export async function listCustomAsanas() {
  return loadCustomAsanas();
}

export async function listAsanaImages() {
  return loadAsanaImages();
}

function saveAsana(asana) {
  const uid = cloudUid();
  if (uid) {
    putDoc(uid, COLLECTIONS.asanas, asana.id, asana);
    return;
  }
  const asanas = loadCustomAsanas();
  const index = asanas.findIndex((a) => a.id === asana.id);
  if (index === -1) asanas.push(asana);
  else asanas[index] = asana;
  saveCustomAsanas(asanas);
}

export async function createCustomAsana(draft) {
  const now = new Date().toISOString();
  const asana = { id: newId(), ...cleanAsanaDraft(draft), createdAt: now, updatedAt: now };
  saveAsana(asana);
  return asana;
}

/** existing: 지금 화면에 있는 원래 아사나 */
export async function updateCustomAsana(existing, draft) {
  if (!existing) throw new Error('수정할 아사나를 찾을 수 없어요.');
  const updated = { ...existing, ...cleanAsanaDraft(draft), updatedAt: new Date().toISOString() };
  saveAsana(updated);
  return updated;
}

export async function deleteCustomAsana(id) {
  const uid = cloudUid();
  if (uid) removeDoc(uid, COLLECTIONS.asanas, id);
  else saveCustomAsanas(loadCustomAsanas().filter((asana) => asana.id !== id));
  await setAsanaImage(id, null);
}

/** dataUrl 이 null 이면 사진 삭제 */
export async function setAsanaImage(id, dataUrl) {
  const uid = cloudUid();
  if (uid) {
    if (dataUrl) putDoc(uid, COLLECTIONS.images, id, { id, dataUrl, updatedAt: new Date().toISOString() });
    else removeDoc(uid, COLLECTIONS.images, id);
    return;
  }
  const images = loadAsanaImages();
  if (dataUrl) images[id] = dataUrl;
  else delete images[id];
  saveAsanaImages(images);
}

/** 백업 가져오기용 */
export async function putCustomAsanas(items) {
  if (items.length === 0) return;
  const uid = cloudUid();
  if (uid) return putMany(uid, COLLECTIONS.asanas, items);
  const byId = new Map(loadCustomAsanas().map((a) => [a.id, a]));
  items.forEach((a) => byId.set(a.id, a));
  saveCustomAsanas([...byId.values()]);
}

/** entries: [[asanaId, dataUrl], ...] */
export async function putAsanaImages(entries) {
  if (entries.length === 0) return;
  const uid = cloudUid();
  const now = new Date().toISOString();
  if (uid) {
    // 사진 문서는 커서 조금씩 나눠 보낸다.
    return putMany(uid, COLLECTIONS.images, entries.map(([id, dataUrl]) => ({ id, dataUrl, updatedAt: now })), 20);
  }
  const images = loadAsanaImages();
  entries.forEach(([id, url]) => {
    images[id] = url;
  });
  saveAsanaImages(images);
}
