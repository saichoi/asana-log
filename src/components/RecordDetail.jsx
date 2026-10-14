import { useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import { TEXT_FIELDS } from '../models/record.js';
import { formatDate } from '../utils/date.js';
import AsanaItem from './AsanaItem.jsx';
import EmptyState from './EmptyState.jsx';
import Markdown from './Markdown.jsx';
import SortableAsanaList from './SortableAsanaList.jsx';
import { BackIcon } from './Icons.jsx';

// 아사나가 많으면 글이 한참 아래로 밀리므로 처음 몇 개만 보여 주고 나머지는 접어 둔다.
// 숨길 게 한두 개뿐이면 접는 의미가 없으니 그때는 모두 보여 준다.
const COLLAPSED_COUNT = 5;
const COLLAPSE_MIN_HIDDEN = 2;

export default function RecordDetail({ record, onBack, onEdit, onDelete, onOpenAsana, onReorder }) {
  const { getAsana } = useAsanas();
  const [confirming, setConfirming] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
  const hiddenCount = record.asanaIds.length - COLLAPSED_COUNT;
  const collapsible = hiddenCount >= COLLAPSE_MIN_HIDDEN;
  const visibleIds = collapsible && !expanded ? record.asanaIds.slice(0, COLLAPSED_COUNT) : record.asanaIds;

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
          <>
          <ul className="asana-list">
            {visibleIds.map((id) => {
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
          {collapsible && (
            <button
              type="button"
              className="button button--ghost button--block asana-list__toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? '접기' : `${hiddenCount}개 더보기`}
            </button>
          )}
          </>
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
