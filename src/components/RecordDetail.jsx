import { useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import { TEXT_FIELDS } from '../models/record.js';
import { formatDate } from '../utils/date.js';
import AsanaItem from './AsanaItem.jsx';
import EmptyState from './EmptyState.jsx';
import Markdown from './Markdown.jsx';
import SortableAsanaList from './SortableAsanaList.jsx';
import { BackIcon } from './Icons.jsx';

export default function RecordDetail({ record, onBack, onEdit, onDelete, onOpenAsana, onReorder }) {
  const { getAsana } = useAsanas();
  const [confirming, setConfirming] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [error, setError] = useState('');

  if (!record) {
    return (
      <section className="page">
        <EmptyState
          title="기록을 찾을 수 없어요"
          description="삭제되었거나 존재하지 않는 기록이에요."
          action={<button type="button" className="button" onClick={onBack}>목록으로</button>}
        />
      </section>
    );
  }

  const date = formatDate(record.date);
  const filledFields = TEXT_FIELDS.filter(({ key }) => record[key]);

  const handleReorder = async (ids) => {
    try {
      setError('');
      await onReorder(record.id, ids);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(record.id);
    } catch (e) {
      setError(e.message);
      setConfirming(false);
    }
  };

  return (
    <section className="page page--detail">
      <div className="topbar">
        <button type="button" className="icon-button" aria-label="목록으로" onClick={onBack}>
          <BackIcon />
        </button>
        <button type="button" className="button button--ghost" onClick={() => onEdit(record.id)}>수정</button>
      </div>

      <header className="page__header">
        <p className="page__eyebrow">{date.year}</p>
        <h1 className="page__title">{date.month} {date.day}일 <span className="page__title-sub">{date.weekday}요일</span></h1>
        {record.lesson && <p className="lesson-badge">{record.lesson}</p>}
      </header>

      {record.asanaIds.length > 0 && (
        <section className="detail-section">
          <div className="detail-section__head">
            <h2 className="detail-section__label">오늘의 아사나</h2>
            {record.asanaIds.length > 1 && (
              <button type="button" className="button button--ghost button--small" onClick={() => setSorting((s) => !s)}>
                {sorting ? '완료' : '순서 바꾸기'}
              </button>
            )}
          </div>
          {sorting ? (
            <>
              <p className="muted detail-section__hint">⋮⋮ 를 끌어서 옮기면 바로 저장돼요.</p>
              <SortableAsanaList ids={record.asanaIds} onChange={handleReorder} />
            </>
          ) : (
          <ul className="asana-list">
            {record.asanaIds.map((id) => {
              const asana = getAsana(id);
              return (
                <li key={id}>
                  {asana ? (
                    <AsanaItem asana={asana} onOpen={onOpenAsana} />
                  ) : (
                    <div className="asana-item asana-item--missing">사전에서 삭제된 자세</div>
                  )}
                </li>
              );
            })}
          </ul>
          )}
        </section>
      )}

      {filledFields.map(({ key, label, markdown }) => (
        <section key={key} className="detail-section">
          <h2 className="detail-section__label">{label}</h2>
          {markdown ? <Markdown text={record[key]} /> : <p className="detail-section__text">{record[key]}</p>}
        </section>
      ))}

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <div className="danger-zone">
        {confirming ? (
          <div className="confirm">
            <p className="confirm__text">이 기록을 삭제할까요? 삭제하면 되돌릴 수 없어요.</p>
            <div className="confirm__actions">
              <button type="button" className="button" onClick={() => setConfirming(false)}>취소</button>
              <button type="button" className="button button--danger" onClick={handleDelete}>삭제</button>
            </div>
          </div>
        ) : (
          <button type="button" className="button button--text-danger" onClick={() => setConfirming(true)}>
            이 기록 삭제하기
          </button>
        )}
      </div>
    </section>
  );
}
