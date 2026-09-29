import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/** 동기화 · 백업 화면 위쪽: Google 로그인 / 동기화 상태 */
export default function SyncPanel() {
  const { status, user, enabled, migration, clearMigration, syncError, signIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!enabled) return null;

  const handleSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await signIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const migrated = migration?.status === 'done' && migration.result;
  const migratedParts = migrated
    ? [
        migrated.records && `기록 ${migrated.records}개`,
        migrated.asanas && `아사나 ${migrated.asanas}개`,
        migrated.images && `사진 ${migrated.images}장`,
      ].filter(Boolean)
    : [];

  return (
    <section className="sync-panel">
      <h2 className="detail-section__label">PC · 휴대폰 동기화</h2>

      {status === 'loading' && <p className="muted">로그인 상태를 확인하고 있어요…</p>}

      {status === 'signedOut' && (
        <>
          <p className="muted sync-panel__desc">
            Google 계정으로 로그인하면 PC와 휴대폰에서 같은 기록을 볼 수 있어요. 이 기기에 있던 기록은 계정으로 옮겨져요.
          </p>
          <button type="button" className="button button--google" disabled={busy} onClick={handleSignIn}>
            <GoogleMark /> {busy ? '로그인하는 중…' : 'Google로 로그인'}
          </button>
        </>
      )}

      {status === 'signedIn' && user && (
        <>
          <div className="sync-account">
            {user.photoURL ? (
              <img className="sync-account__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="sync-account__avatar sync-account__avatar--empty" aria-hidden="true">{(user.displayName || user.email || '?')[0]}</span>
            )}
            <span className="sync-account__info">
              <span className="sync-account__name">{user.displayName || user.email}</span>
              {user.displayName && <span className="sync-account__email">{user.email}</span>}
            </span>
            <span className="sync-badge">동기화 켜짐</span>
          </div>
          <p className="muted sync-panel__desc">
            기록이 계정에 저장되고 다른 기기에도 바로 반영돼요. 인터넷이 없을 때 쓴 기록은 연결되면 자동으로 올라가요.
          </p>

          {confirmSignOut ? (
            <div className="confirm confirm--neutral">
              <p className="confirm__text">로그아웃하면 이 기기에서는 기록이 보이지 않아요. 기록은 계정에 남아 있고, 다시 로그인하면 돌아와요.</p>
              <div className="confirm__actions">
                <button type="button" className="button" onClick={() => setConfirmSignOut(false)}>취소</button>
                <button type="button" className="button button--primary" onClick={signOut}>로그아웃</button>
              </div>
            </div>
          ) : (
            <button type="button" className="button button--small" onClick={() => setConfirmSignOut(true)}>로그아웃</button>
          )}
        </>
      )}

      {migration?.status === 'running' && <p className="notice notice--ok" role="status">이 기기에 있던 기록을 계정으로 옮기고 있어요…</p>}
      {migration?.status === 'done' && migratedParts.length > 0 && (
        <p className="notice notice--ok" role="status">
          이 기기에 있던 {migratedParts.join(', ')}를 계정으로 옮겼어요.{' '}
          <button type="button" className="link-button" onClick={clearMigration}>닫기</button>
        </p>
      )}
      {migration?.status === 'error' && (
        <p className="notice notice--error" role="alert">
          이 기기의 기록을 계정으로 옮기지 못했어요. 기록은 이 기기에 그대로 있고, 다음에 앱을 열면 다시 시도해요. ({migration.message})
        </p>
      )}
      {(error || syncError) && <p className="notice notice--error" role="alert">{error || syncError}</p>}
    </section>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
