import { useEffect, useRef, useState } from 'react';
import { applyImport, createBackup, getDataStats, parseBackup, previewImport } from '../storage/backupRepository.js';
import { todayString } from '../utils/date.js';
import { BackIcon } from './Icons.jsx';

const fileName = () => `asana-log-backup-${todayString()}.json`;

/** 백업 화면: 기록·추가한 아사나·사진을 파일로 내보내고, 다른 주소/기기에서 가져온다 */
export default function DataBackup({ onBack, onImported }) {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null); // { backup, preview, name }
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const loadStats = () => getDataStats().then(setStats).catch((e) => setMessage({ type: 'error', text: e.message }));
  useEffect(() => {
    loadStats();
  }, []);

  const makeFile = async () => {
    const backup = await createBackup();
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
      setPending({ backup, preview: await previewImport(backup), name: file.name });
    } catch (err) {
      setPending(null);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const result = await applyImport(pending.backup);
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
      loadStats();
    }
  };

  const p = pending?.preview;
  const nothingNew = p && p.records.added + p.records.updated + p.asanas.added + p.asanas.updated + p.images === 0;

  return (
    <section className="page page--detail">
      <div className="topbar">
        <button type="button" className="icon-button" aria-label="뒤로" onClick={onBack}>
          <BackIcon />
        </button>
      </div>
      <header className="page__header">
        <p className="page__eyebrow">Backup</p>
        <h1 className="page__title">데이터 백업</h1>
        <p className="page__subtitle">
          기록은 이 브라우저 안에만 저장돼요. 다른 주소나 기기로 옮기거나 백업하려면 파일로 내보내 주세요.
        </p>
      </header>

      {stats && (
        <dl className="backup-stats">
          <div><dt>수련 기록</dt><dd>{stats.records}개</dd></div>
          <div><dt>내가 추가한 아사나</dt><dd>{stats.customAsanas}개</dd></div>
          <div><dt>올린 사진</dt><dd>{stats.images}장</dd></div>
        </dl>
      )}

      {message && (
        <p className={`notice ${message.type === 'ok' ? 'notice--ok' : 'notice--error'}`} role={message.type === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      <section className="detail-section">
        <h2 className="detail-section__label">내보내기</h2>
        <p className="muted backup-desc">지금 이 브라우저의 기록, 추가한 아사나, 사진을 백업 파일 하나로 만들어요.</p>
        <div className="backup-actions">
          <button type="button" className="button button--primary" onClick={handleDownload}>파일로 저장</button>
          {canShareFiles && <button type="button" className="button" onClick={handleShare}>공유하기</button>}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">가져오기</h2>
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
                <li>기록: 새로 추가 {p.records.added}개{p.records.updated > 0 && ` · 최신 내용으로 바뀜 ${p.records.updated}개`}</li>
                {p.asanas.total > 0 && (
                  <li>추가한 아사나: 새로 추가 {p.asanas.added}개{p.asanas.updated > 0 && ` · 바뀜 ${p.asanas.updated}개`}</li>
                )}
                {p.images > 0 && <li>사진: {p.images}장</li>}
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
