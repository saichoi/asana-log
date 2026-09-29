/**
 * 기록 저장소 인터페이스
 * ------------------------------------------------------------
 * 화면(컴포넌트)은 이 파일의 함수만 사용한다.
 * 로그인하지 않았으면 이 기기(localStorage)에, Google 로그인 상태면 Firestore 에 저장한다.
 * (어디에 저장할지는 session.js 의 cloudUid() 로 판단)
 *
 * 로그인 상태의 목록은 useRecords 가 Firestore 를 실시간 구독해서 받는다.
 * ------------------------------------------------------------
 */
import { loadRecords, saveRecords } from './localStorageAdapter.js';
import { COLLECTIONS, putDoc, putMany, removeDoc } from './cloudStore.js';
import { cloudUid } from './session.js';
import { cleanDraft, sortRecords } from '../models/record.js';

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 이 기기에 저장된 기록 (로그인 상태에서는 쓰지 않음) */
export async function listRecords() {
  return sortRecords(loadRecords());
}

function save(record) {
  const uid = cloudUid();
  if (uid) {
    putDoc(uid, COLLECTIONS.records, record.id, record);
    return;
  }
  const records = loadRecords();
  const index = records.findIndex((r) => r.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
  saveRecords(records);
}

export async function createRecord(draft) {
  const now = new Date().toISOString();
  const record = { id: newId(), ...cleanDraft(draft), createdAt: now, updatedAt: now };
  save(record);
  return record;
}

/** existing: 지금 화면에 있는 원래 기록 */
export async function updateRecord(existing, draft) {
  if (!existing) throw new Error('수정할 기록을 찾을 수 없어요.');
  const updated = { ...existing, ...cleanDraft(draft), updatedAt: new Date().toISOString() };
  save(updated);
  return updated;
}

export async function deleteRecord(id) {
  const uid = cloudUid();
  if (uid) removeDoc(uid, COLLECTIONS.records, id);
  else saveRecords(loadRecords().filter((record) => record.id !== id));
}

/** 백업 가져오기용: 이미 합칠 대상으로 고른 기록들을 그대로 저장 */
export async function putRecords(items) {
  if (items.length === 0) return;
  const uid = cloudUid();
  if (uid) return putMany(uid, COLLECTIONS.records, items);
  const byId = new Map(loadRecords().map((r) => [r.id, r]));
  items.forEach((r) => byId.set(r.id, r));
  saveRecords([...byId.values()]);
}
