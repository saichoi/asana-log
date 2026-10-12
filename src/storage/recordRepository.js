/**
 * 기록 저장소 인터페이스
 * ------------------------------------------------------------
 * 화면(컴포넌트)은 이 파일의 함수만 사용한다.
 * 기록은 항상 이 기기(localStorage)에 저장한다.
 * Google Drive 를 연결했다면 sync/syncEngine 이 바뀐 내용을 따로 Drive 파일과 맞춘다.
 * ------------------------------------------------------------
 */
import { loadRecords, saveRecords } from './localStorageAdapter.js';
import { markDeleted, reviveDeleted } from './localData.js';
import { emitDataChange } from './changes.js';
import { cleanDraft, sortRecords } from '../models/record.js';

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listRecords() {
  return sortRecords(loadRecords());
}

function putAll(items) {
  const byId = new Map(loadRecords().map((r) => [r.id, r]));
  items.forEach((r) => byId.set(r.id, r));
  saveRecords([...byId.values()]);
  emitDataChange('local');
}

export async function createRecord(draft) {
  const now = new Date().toISOString();
  const record = { id: newId(), ...cleanDraft(draft), createdAt: now, updatedAt: now };
  putAll([record]);
  return record;
}

/** existing: 지금 화면에 있는 원래 기록 */
export async function updateRecord(existing, draft) {
  if (!existing) throw new Error('수정할 기록을 찾을 수 없어요.');
  const updated = { ...existing, ...cleanDraft(draft), updatedAt: new Date().toISOString() };
  putAll([updated]);
  return updated;
}

export async function deleteRecord(id) {
  saveRecords(loadRecords().filter((record) => record.id !== id));
  markDeleted('records', id);
  emitDataChange('local');
}

/** 백업 가져오기용: 이미 합칠 대상으로 고른 기록들을 그대로 저장 */
export async function putRecords(items) {
  if (items.length === 0) return;
  putAll(reviveDeleted('records', items));
}
