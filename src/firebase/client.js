import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config.js';

let instance = null;

/**
 * Firebase 앱·인증·Firestore 를 한 번만 만들어서 돌려준다. 설정이 없으면 null.
 * Firestore 는 기기에 캐시를 두어 오프라인에서도 읽고 쓸 수 있고,
 * 인터넷이 연결되면 자동으로 서버와 맞춘다.
 */
export function getFirebase() {
  if (!isFirebaseConfigured) return null;
  if (!instance) {
    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
    instance = { app, auth: getAuth(app), db };
  }
  return instance;
}
