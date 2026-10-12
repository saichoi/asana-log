import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config.js';

let instance = null;

/**
 * Firebase 앱·인증·Firestore 를 한 번만 만들어서 돌려준다. 설정이 없으면 null.
 * Firestore 는 예전 버전과 같은 기기 캐시 설정으로 열어서,
 * 오프라인에서 써 두고 아직 서버에 올라가지 않은 기록까지 읽어 올 수 있게 한다.
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
