/**
 * Firestore 저장소 — users/{uid}/records, asanas, images 컬렉션
 * ------------------------------------------------------------
 * 쓰기는 기다리지 않는다(fire-and-forget). Firestore 가 기기 캐시에 먼저 반영하고
 * 화면에 바로 보여 준 뒤, 인터넷이 연결되면 서버로 보낸다.
 * (서버 응답을 기다리면 오프라인에서 "저장 중…" 이 끝나지 않기 때문)
 * 실패한 쓰기는 onCloudError 로 알린다.
 * ------------------------------------------------------------
 */
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebase } from '../firebase/client.js';

export const COLLECTIONS = { records: 'records', asanas: 'asanas', images: 'images' };

const col = (uid, name) => collection(getFirebase().db, 'users', uid, name);

const errorListeners = new Set();
export function onCloudError(listener) {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}
function report(error) {
  console.error('[cloud]', error);
  errorListeners.forEach((listener) => listener(error));
}

/** 컬렉션을 실시간으로 구독. 다른 기기에서 바꾼 내용도 바로 들어온다. 해제 함수를 돌려준다. */
export function subscribe(uid, name, onData, onError) {
  return onSnapshot(
    col(uid, name),
    (snap) => onData(snap.docs.map((d) => d.data())),
    (error) => {
      report(error);
      onError?.(error);
    },
  );
}

export function putDoc(uid, name, id, data) {
  setDoc(doc(col(uid, name), id), data).catch(report);
}

export function removeDoc(uid, name, id) {
  deleteDoc(doc(col(uid, name), id)).catch(report);
}

export async function fetchAll(uid, name) {
  const snap = await getDocs(col(uid, name));
  return snap.docs.map((d) => d.data());
}

/**
 * 여러 문서를 한꺼번에 저장 (가져오기·기기 기록 옮기기용). 이건 서버 저장까지 기다린다.
 * 사진처럼 큰 문서는 요청 크기 제한 때문에 적은 개수씩 나눠 보낸다.
 */
export async function putMany(uid, name, items, chunkSize = 400) {
  const { db } = getFirebase();
  for (let i = 0; i < items.length; i += chunkSize) {
    const batch = writeBatch(db);
    for (const item of items.slice(i, i + chunkSize)) batch.set(doc(col(uid, name), item.id), item);
    await batch.commit();
  }
}
