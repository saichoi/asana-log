import { useEffect, useMemo, useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import { searchAsanas } from '../utils/search.js';
import AsanaItem from './AsanaItem.jsx';
import EmptyState from './EmptyState.jsx';
import SearchInput from './SearchInput.jsx';
import { CloseIcon } from './Icons.jsx';

/**
 * 아사나 선택 하단 시트
 * 시트 안에서 고른 내용은 '선택 완료'를 눌러야 기록에 반영된다.
 */
export default function AsanaPicker({ selectedIds, onConfirm, onClose }) {
  const { asanas } = useAsanas();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(() => new Set(selectedIds));
  const results = useMemo(() => searchAsanas(asanas, query), [asanas, query]);

  // 시트가 열려 있는 동안 뒤 화면 스크롤 막기 + ESC로 닫기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // 기존 선택 순서를 유지하고, 새로 고른 자세는 뒤에 붙인다.
  const confirm = () => {
    const kept = selectedIds.filter((id) => picked.has(id));
    const added = [...picked].filter((id) => !selectedIds.includes(id));
    onConfirm([...kept, ...added]);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <h2 id="picker-title" className="sheet__title">아사나 선택</h2>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="sheet__search">
          <SearchInput value={query} onChange={setQuery} />
        </div>

        <div className="sheet__body">
          {results.length === 0 ? (
            <EmptyState
              title="찾는 자세가 없어요"
              description={'다른 이름으로 검색하거나,\n아사나 사전 탭에서 새 자세를 추가할 수 있어요.'}
            />
          ) : (
            <ul className="asana-list">
              {results.map((asana) => (
                <li key={asana.id}>
                  <AsanaItem asana={asana} selected={picked.has(asana.id)} onToggle={toggle} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="sheet__footer">
          <button type="button" className="button button--primary button--block" onClick={confirm}>
            {picked.size > 0 ? `${picked.size}개 선택 완료` : '선택 완료'}
          </button>
        </footer>
      </div>
    </div>
  );
}
