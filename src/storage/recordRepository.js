/**
 * 기록 저장소 인터페이스
 * ------------------------------------------------------------
 * 화면(컴포넌트)은 이 파일의 함수만 사용한다.
 * 모든 함수가 Promise를 반환하므로, 나중에 서버 DB로 옮길 때는
 * 함수 내부만 fetch('/api/records') 등으로 바꾸면 화면 코드는 그대로 둘 수 있다.
 */
import { loadRecords, saveRecords } from './localStorageAdapter.js';
import { cleanDraft, sortRecords } from '../models/record.js';

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listRecords() {
  return sortRecords(loadRecords());
}

export async function getRecord(id) {
  return loadRecords().find((record) => record.id === id) ?? null;
}

export async function createRecord(draft) {
  const now = new Date().toISOString();
  const record = { id: newId(), ...cleanDraft(draft), createdAt: now, updatedAt: now };
  saveRecords([...loadRecords(), record]);
  return record;
}

export async function updateRecord(id, draft) {
  const records = loadRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error('수정할 기록을 찾을 수 없어요.');
  const updated = { ...records[index], ...cleanDraft(draft), updatedAt: new Date().toISOString() };
  records[index] = updated;
  saveRecords(records);
  return updated;
}

export async function deleteRecord(id) {
  saveRecords(loadRecords().filter((record) => record.id !== id));
}
