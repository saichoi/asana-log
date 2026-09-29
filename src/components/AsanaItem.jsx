import AsanaFigure from './AsanaFigure.jsx';
import { CheckIcon, ChevronIcon } from './Icons.jsx';

/**
 * 아사나 한 줄 — 이미지와 한국어 / English / Sanskrit 을 함께 보여 준다.
 * - onToggle: 선택 가능한 체크 버튼 (기록 작성의 아사나 선택)
 * - onOpen:   누르면 상세 페이지로 이동 (아사나 사전)
 */
export default function AsanaItem({ asana, selected = false, onToggle, onOpen, showCategory = false }) {
  const body = (
    <>
      <AsanaFigure asana={asana} />
      <span className="asana-item__names">
        <span className="asana-item__ko">
          {asana.ko}
          {showCategory && <span className="asana-item__category">{asana.category}</span>}
          {asana.isCustom && <span className="asana-item__category asana-item__category--custom">내가 추가</span>}
        </span>
        {asana.en && <span className="asana-item__en">{asana.en}</span>}
        {asana.sa && <span className="asana-item__sa">{asana.sa}</span>}
      </span>
      {onToggle && (
        <span className={`check${selected ? ' is-checked' : ''}`} aria-hidden="true">
          {selected && <CheckIcon width={16} height={16} strokeWidth={2.2} />}
        </span>
      )}
      {onOpen && <ChevronIcon className="asana-item__chevron" width={18} height={18} />}
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        className={`asana-item asana-item--selectable${selected ? ' is-selected' : ''}`}
        aria-pressed={selected}
        onClick={() => onToggle(asana.id)}
      >
        {body}
      </button>
    );
  }
  if (onOpen) {
    return (
      <button type="button" className="asana-item asana-item--link" onClick={() => onOpen(asana.id)}>
        {body}
      </button>
    );
  }
  return <div className="asana-item">{body}</div>;
}
