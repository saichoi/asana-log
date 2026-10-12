/**
 * 예전 방식(Firebase 계정에 저장)으로 동기화하던 기록을 읽어 오기
 * ------------------------------------------------------------
 * 지금은 기록을 이 기기에 저장하고 Google Drive 로 동기화하므로 Firebase 는 더 쓰지 않는다.
 * 이 파일은 예전 계정에 남아 있는 기록을 한 번 옮겨 오기 위한 것이고,
 * 필요할 때만 불러오도록(동적 import) 되어 있어 평소에는 Firebase SDK 가 로드되지 않는다.
 * 모든 기기의 기록을 옮긴 뒤에는 src/firebase 폴더와 firebase 패키지를 지워도 된다.
 * ------------------------------------------------------------
 */
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebase } from './client.js';

/** 이 기기에 예전 로그인이 남아 있으면 그 사용자, 없으면 null */
export async function currentLegacyUser() {
  const { auth } = getFirebase();
  await auth.authStateReady();
  return auth.currentUser;
}

export async function signInLegacy() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return (await signInWithPopup(getFirebase().auth, provider)).user;
}

/** users/{uid}/ 아래의 기록·아사나·사진 → { records, customAsanas, images } */
export async function fetchLegacyData(uid) {
  const { db } = getFirebase();
  const read = async (name) => (await getDocs(collection(db, 'users', uid, name))).docs.map((d) => d.data());
  const [records, customAsanas, imageDocs] = await Promise.all([read('records'), read('asanas'), read('images')]);
  return { records, customAsanas, images: Object.fromEntries(imageDocs.map((d) => [d.id, d.dataUrl])) };
}

export const signOutLegacy = () => signOut(getFirebase().auth);
