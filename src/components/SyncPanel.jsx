import { useState } from 'react';
import { isSyncOn, useSync } from '../hooks/useSync.js';
import { SYNC_FILE_NAME } from '../sync/config.js';

const BADGES = {
  syncing: '동기화 중…',
  synced: '동기화됨',
  offline: '오프라인',
  needsAuth: '다시 연결 필요',
  error: '확인 필요',
};

const formatTime = (iso) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** 동기화 · 백업 화면 위쪽: Google Drive 연결 / 동기화 상태 */
export default function SyncPanel() {
  const { status, email, lastSyncedAt, error, connect, disconnect, syncNow } = useSync();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleConnect = () => connect('backup');

  if (status === 'unconfigured') {
    return (
      <section className="sync-panel">
        <h2 className="detail-section__label">Google Drive 동기화</h2>
        <p className="muted">아직 설정되지 않았어요. README의 “Google Drive 동기화 설정”을 참고해 주세요.</p>
      </section>
    );
  }

  return (
    <section className="sync-panel">
      <h2 className="detail-section__label">Google Drive 동기화</h2>

      {!isSyncOn(status) ? (
        <>
          <p className="muted sync-panel__desc">
            내 Google Drive를 연결하면 PC와 휴대폰에서 같은 기록을 볼 수 있어요. 기록은 지금처럼 이 기기에 저장되고,
            내 드라이브의 <code>{SYNC_FILE_NAME}</code> 파일을 통해 기기끼리 맞춰져요.
          </p>
          <button type="button" className="button button--google" onClick={handleConnect}>
            <DriveMark /> Google Drive 연결
          </button>
        </>
      ) : (
        <>
          <div className="sync-account">
            <span className="sync-account__avatar sync-account__avatar--empty" aria-hidden="true"><DriveMark /></span>
            <span className="sync-account__info">
              <span className="sync-account__name">{email || '내 Google Drive'}</span>
              <span className="sync-account__email">
                {lastSyncedAt ? `마지막 동기화 ${formatTime(lastSyncedAt)}` : '아직 동기화하지 않았어요'}
              </span>
            </span>
            <span className={`sync-badge${status === 'needsAuth' || status === 'error' ? ' sync-badge--warn' : ''}`} role="status">
              {BADGES[status]}
            </span>
          </div>

          {status === 'needsAuth' ? (
            <>
              <p className="muted sync-panel__desc">
                Google Drive 연결은 보안을 위해 약 1시간마다 만료돼요. 그동안 쓴 기록은 이 기기에 저장되어 있고,
                다시 연결하면 바로 동기화돼요.
              </p>
              <button type="button" className="button button--primary" onClick={handleConnect}>다시 연결</button>
            </>
          ) : (
            <p className="muted sync-panel__desc">
              기록은 이 기기에 저장되고, 내 드라이브의 <code>{SYNC_FILE_NAME}</code> 파일과 자동으로 맞춰져요.
              {status === 'offline' && ' 인터넷이 연결되면 이어서 동기화해요.'}
            </p>
          )}

          {confirmDisconnect ? (
            <div className="confirm confirm--neutral">
              <p className="confirm__text">
                연결을 끊어도 이 기기의 기록과 Drive의 파일은 그대로 남아요. 이 기기에서 동기화만 멈춰요.
              </p>
              <div className="confirm__actions">
                <button type="button" className="button" onClick={() => setConfirmDisconnect(false)}>취소</button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => {
                    disconnect();
                    setConfirmDisconnect(false);
                  }}
                >
                  연결 끊기
                </button>
              </div>
            </div>
          ) : (
            <div className="backup-actions sync-panel__actions">
              {status !== 'needsAuth' && (
                <button type="button" className="button button--small" disabled={status === 'syncing' || status === 'offline'} onClick={syncNow}>
                  지금 동기화
                </button>
              )}
              <button type="button" className="button button--small" onClick={() => setConfirmDisconnect(true)}>연결 끊기</button>
            </div>
          )}
        </>
      )}

      {error && <p className="notice notice--error" role="alert">{error}</p>}
    </section>
  );
}

function DriveMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 87.3 78" aria-hidden="true">
      <path fill="#0066DA" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" />
      <path fill="#00AC47" d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 0 0 0 53h27.5z" />
      <path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" />
      <path fill="#00832D" d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
      <path fill="#2684FC" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" />
      <path fill="#FFBA00" d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" />
    </svg>
  );
}
