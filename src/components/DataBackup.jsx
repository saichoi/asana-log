import { useRef, useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { applyPlan, buildBackup, isEmptyPlan, parseBackup, planImport } from '../storage/backupRepository.js';
import { todayString } from '../utils/date.js';
import SyncPanel from './SyncPanel.jsx';
import { BackIcon } from './Icons.jsx';

const fileName = () => `asana-log-backup-${todayString()}.json`;

/**
 * 동기화 · 백업 화면
 * - 위: Google 로그인으로 PC·휴대폰 동기화
 * - 아래: 기록·추가한 아사나·사진을 파일로 내보내고, 백업 파일에서 가져오기
 */
export default function DataBackup({ records, onBack, onImported }) {
  const { status } = useAuth();
  const { customAsanas, images } = useAsanas();
  const [pending, setPending] = useState(null); // { backup, plan, name }
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const current = { records, customAsanas, images };
  const stats = { records: records.length, customAsanas: customAsanas.length, images: Object.keys(images).length };

  const makeFile = async () => {
    const backup = buildBackup(current);
    return new File([JSON.stringify(backup)], fileName(), { type: 'application/json' });
  };

  const handleDownload = async () => {
    setMessage(null);
    try {
      const file = await makeFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ type: 'ok', text: `${file.name} 파일로 저장했어요.` });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // 휴대폰에서는 공유 창으로 AirDrop·메시지·파일 앱 등에 바로 보낼 수 있다.
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [new File(['{}'], 'test.json', { type: 'application/json' })] });

  const handleShare = async () => {
    setMessage(null);
    try {
      const file = await makeFile();
      await navigator.share({ files: [file], title: 'Asana Log 백업' });
    } catch (e) {
      if (e.name !== 'AbortError') setMessage({ type: 'error', text: '공유하지 못했어요. "파일로 저장"을 이용해 주세요.' });
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      const backup = parseBackup(await file.text());
      setPending({ backup, plan: planImport(current, backup), name: file.name });
    } catch (err) {
      setPending(null);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const result = await applyPlan(pending.plan);
      const parts = [
        result.records && `기록 ${result.records}개`,
        result.asanas && `아사나 ${result.asanas}개`,
        result.images && `사진 ${result.images}장`,
      ].filter(Boolean);
      setMessage({ type: 'ok', text: parts.length ? `${parts.join(', ')}를 가져왔어요.` : '새로 가져올 내용이 없었어요. 이미 모두 들어 있어요.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      // 일부만 저장된 경우도 있으므로 항상 화면을 새로 고친다.
      setPending(null);
      setBusy(false);
      await onImported();
    }
  };

  const p = pending?.plan;
  const nothingNew = p && isEmptyPlan(p);

  return (
    <section className="page page--detail">
      <div className="topbar">
        <button type="button" className="icon-button" aria-label="뒤로" onClick={onBack}>
          <BackIcon />
        </button>
      </div>
      <header className="page__header">
        <p className="page__eyebrow">Sync &amp; Backup</p>
        <h1 className="page__title">동기화 · 백업</h1>
        <p className="page__subtitle">
          {status === 'signedIn'
            ? '기록이 Google 계정에 저장되고 있어요.'
            : '지금은 기록이 이 기기의 브라우저 안에만 저장돼요.'}
        </p>
      </header>

      <SyncPanel />

      <dl className="backup-stats">
        <div><dt>수련 기록</dt><dd>{stats.records}개</dd></div>
        <div><dt>내가 추가한 아사나</dt><dd>{stats.customAsanas}개</dd></div>
        <div><dt>올린 사진</dt><dd>{stats.images}장</dd></div>
      </dl>

      {message && (
        <p className={`notice ${message.type === 'ok' ? 'notice--ok' : 'notice--error'}`} role={message.type === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      <section className="detail-section">
        <h2 className="detail-section__label">파일로 내보내기</h2>
        <p className="muted backup-desc">지금 보이는 기록, 추가한 아사나, 사진을 백업 파일 하나로 만들어요. 가끔 저장해 두면 안전해요.</p>
        <div className="backup-actions">
          <button type="button" className="button button--primary" onClick={handleDownload}>파일로 저장</button>
          {canShareFiles && <button type="button" className="button" onClick={handleShare}>공유하기</button>}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">파일에서 가져오기</h2>
        <p className="muted backup-desc">
          백업 파일의 내용을 지금 기록에 합쳐요. 기존 기록은 지워지지 않고, 같은 기록은 더 최근에 수정된 쪽이 남아요.
        </p>

        {pending ? (
          <div className="confirm confirm--neutral">
            <p className="confirm__text">
              <strong>{pending.name}</strong>
              {pending.backup.exportedAt && ` (${pending.backup.exportedAt.slice(0, 10)} 백업)`}
            </p>
            {nothingNew ? (
              <p className="confirm__text">새로 가져올 내용이 없어요. 이미 모두 들어 있어요.</p>
            ) : (
              <ul className="backup-preview">
                <li>기록: 새로 추가 {p.records.added.length}개{p.records.updated.length > 0 && ` · 최신 내용으로 바뀜 ${p.records.updated.length}개`}</li>
                {p.asanas.items.length > 0 && (
                  <li>추가한 아사나: 새로 추가 {p.asanas.added.length}개{p.asanas.updated.length > 0 && ` · 바뀜 ${p.asanas.updated.length}개`}</li>
                )}
                {p.images.length > 0 && <li>사진: {p.images.length}장</li>}
              </ul>
            )}
            <div className="confirm__actions">
              <button type="button" className="button" onClick={() => setPending(null)}>취소</button>
              {!nothingNew && (
                <button type="button" className="button button--primary" disabled={busy} onClick={handleImport}>
                  {busy ? '가져오는 중…' : '가져오기'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <button type="button" className="button" onClick={() => inputRef.current?.click()}>백업 파일 고르기</button>
        )}
        <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
      </section>
    </section>
  );
}
