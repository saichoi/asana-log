import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { getFirebase } from '../firebase/client.js';
import { onCloudError } from '../storage/cloudStore.js';
import { hasLocalData } from '../storage/localStorageAdapter.js';
import { migrateLocalToCloud } from '../storage/backupRepository.js';
import { setCloudUid } from '../storage/session.js';

const AuthContext = createContext(null);

function authMessage(error) {
  switch (error?.code) {
    case 'auth/unauthorized-domain':
      return '이 주소에서는 로그인이 허용되지 않았어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 이 주소를 추가해 주세요.';
    case 'auth/network-request-failed':
      return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
    case 'auth/operation-not-allowed':
      return 'Google 로그인이 아직 켜져 있지 않아요. Firebase 콘솔 → Authentication 에서 Google 을 사용 설정해 주세요.';
    default:
      return `로그인하지 못했어요. (${error?.code ?? error?.message ?? '알 수 없는 오류'})`;
  }
}

function cloudMessage(error) {
  switch (error?.code) {
    case 'permission-denied':
      return '계정 저장소에 접근할 권한이 없어요. Firestore 보안 규칙을 확인해 주세요.';
    case 'resource-exhausted':
      return '오늘의 무료 사용량을 넘어서 동기화가 잠시 멈췄어요. 기록은 이 기기에 보관되고 나중에 올라가요.';
    default:
      return `동기화 중 문제가 생겼어요. (${error?.code ?? error?.message ?? '알 수 없는 오류'})`;
  }
}

/**
 * Google 로그인 상태를 관리하고, 로그인하면 기록 저장 위치를 계정(Firestore)으로 바꾼다.
 * status: 'disabled'(Firebase 설정 없음) | 'loading' | 'signedOut' | 'signedIn'
 */
export function AuthProvider({ children }) {
  const firebase = getFirebase();
  const [status, setStatus] = useState(firebase ? 'loading' : 'disabled');
  const [user, setUser] = useState(null);
  const [migration, setMigration] = useState(null); // { status: 'running' | 'done' | 'error', result?, message? }
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!firebase) return undefined;
    getRedirectResult(firebase.auth).catch((e) => setSyncError(authMessage(e)));
    const offError = onCloudError((e) => setSyncError(cloudMessage(e)));
    const offAuth = onAuthStateChanged(firebase.auth, (nextUser) => {
      // 화면이 다시 그려지기 전에 저장 위치부터 바꾼다.
      setCloudUid(nextUser?.uid ?? null);
      setUser(nextUser);
      setStatus(nextUser ? 'signedIn' : 'signedOut');

      if (nextUser && hasLocalData()) {
        setMigration({ status: 'running' });
        migrateLocalToCloud(nextUser.uid)
          .then((result) => setMigration({ status: 'done', result }))
          .catch((e) => setMigration({ status: 'error', message: e.code ? cloudMessage(e) : e.message }));
      }
    });
    return () => {
      offAuth();
      offError();
    };
  }, [firebase]);

  const signIn = useCallback(async () => {
    setSyncError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(firebase.auth, provider);
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      // 팝업을 쓸 수 없는 환경(일부 모바일 브라우저·홈 화면 앱)에서는 페이지 이동 방식으로 로그인
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(firebase.auth, provider);
        return;
      }
      throw new Error(authMessage(e));
    }
  }, [firebase]);

  /** 로그아웃: 이 기기에 남은 계정 캐시까지 지우고 새로 시작 */
  const signOut = useCallback(async () => {
    await firebaseSignOut(firebase.auth);
    setCloudUid(null);
    try {
      await terminate(firebase.db);
      await clearIndexedDbPersistence(firebase.db);
    } catch {
      /* 캐시 정리 실패는 무시 */
    }
    window.location.reload();
  }, [firebase]);

  const value = useMemo(
    () => ({
      status,
      user,
      uid: user?.uid ?? null,
      enabled: Boolean(firebase),
      migration,
      clearMigration: () => setMigration(null),
      syncError,
      clearSyncError: () => setSyncError(''),
      signIn,
      signOut,
    }),
    [status, user, firebase, migration, syncError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있어요.');
  return context;
}
