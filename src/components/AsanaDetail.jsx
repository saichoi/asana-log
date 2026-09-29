import { useMemo, useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import { POSE_FIGURES } from '../data/poseFigures.js';
import { formatDate } from '../utils/date.js';
import { stripMarkdown } from '../utils/markdown.js';
import AsanaFigure from './AsanaFigure.jsx';
import EmptyState from './EmptyState.jsx';
import PhotoPicker from './PhotoPicker.jsx';
import { BackIcon, ChevronIcon } from './Icons.jsx';

/** 아사나 상세 페이지: 큰 이미지, 세 가지 이름, 설명, 이 자세로 수련한 기록 */
export default function AsanaDetail({ asanaId, records, onBack, onEdit, onDelete, onOpenRecord }) {
  const { getAsana, images, setImage } = useAsanas();
  const asana = getAsana(asanaId);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const practiced = useMemo(() => records.filter((r) => r.asanaIds.includes(asanaId)), [records, asanaId]);

  if (!asana) {
    return (
      <section className="page">
        <EmptyState
          title="자세를 찾을 수 없어요"
          description="삭제되었거나 존재하지 않는 자세예요."
          action={<button type="button" className="button" onClick={onBack}>사전으로</button>}
        />
      </section>
    );
  }

  const hasPhoto = Boolean(images[asana.id]);
  const hasFigure = Boolean(POSE_FIGURES[asana.id]);

  const handleDelete = async () => {
    try {
      await onDelete(asana.id);
    } catch (e) {
      setError(e.message);
      setConfirming(false);
    }
  };

  return (
    <section className="page page--detail">
      <div className="topbar">
        <button type="button" className="icon-button" aria-label="뒤로" onClick={onBack}>
          <BackIcon />
        </button>
        {asana.isCustom && (
          <button type="button" className="button button--ghost" onClick={() => onEdit(asana.id)}>수정</button>
        )}
      </div>

      <div className="asana-hero">
        <AsanaFigure asana={asana} size="lg" />
        <PhotoPicker hasPhoto={hasPhoto} onChange={(dataUrl) => setImage(asana.id, dataUrl)} />
        {hasPhoto && hasFigure && <p className="asana-hero__hint">사진을 지우면 기본 일러스트가 다시 보여요.</p>}
      </div>

      <header className="asana-names">
        <div className="asana-names__chips">
          <span className="asana-item__category">{asana.category}</span>
          {asana.isCustom && <span className="asana-item__category asana-item__category--custom">내가 추가</span>}
        </div>
        <h1 className="page__title">{asana.ko}</h1>
        <dl className="asana-names__list">
          <div><dt>English</dt><dd>{asana.en || '—'}</dd></div>
          <div><dt>Sanskrit</dt><dd className="asana-item__sa">{asana.sa || '—'}</dd></div>
        </dl>
      </header>

      {asana.description && (
        <section className="detail-section">
          <h2 className="detail-section__label">설명</h2>
          <p className="detail-section__text">{asana.description}</p>
        </section>
      )}

      <section className="detail-section">
        <h2 className="detail-section__label">
          이 자세로 수련한 기록 {practiced.length > 0 && <span className="count">{practiced.length}회</span>}
        </h2>
        {practiced.length === 0 ? (
          <p className="muted">아직 이 자세로 수련한 기록이 없어요.</p>
        ) : (
          <ul className="practice-list">
            {practiced.map((record) => {
              const preview = stripMarkdown(record.challenge || record.change || record.content || record.memo);
              return (
                <li key={record.id}>
                  <button type="button" className="practice-item" onClick={() => onOpenRecord(record.id)}>
                    <span className="practice-item__date">
                      {formatDate(record.date).full}
                      {record.lesson && <span className="practice-item__lesson"> · {record.lesson}</span>}
                    </span>
                    {preview && <span className="practice-item__preview">{preview}</span>}
                    <ChevronIcon className="practice-item__chevron" width={16} height={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {asana.isCustom && (
        <div className="danger-zone">
          {confirming ? (
            <div className="confirm">
              <p className="confirm__text">
                이 자세를 사전에서 삭제할까요?
                {practiced.length > 0 && ` ${practiced.length}개의 기록에 쓰인 자세라, 해당 기록에는 '삭제된 자세'로 표시돼요.`}
              </p>
              <div className="confirm__actions">
                <button type="button" className="button" onClick={() => setConfirming(false)}>취소</button>
                <button type="button" className="button button--danger" onClick={handleDelete}>삭제</button>
              </div>
            </div>
          ) : (
            <button type="button" className="button button--text-danger" onClick={() => setConfirming(true)}>
              이 자세 삭제하기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
