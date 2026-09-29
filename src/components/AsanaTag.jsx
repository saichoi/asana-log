import { useAsanas } from '../context/AsanaContext.jsx';
import { CloseIcon } from './Icons.jsx';

/** 선택된 아사나 태그. onRemove 가 있으면 × 버튼으로 선택을 취소할 수 있다. */
export default function AsanaTag({ id, onRemove }) {
  const { getAsana } = useAsanas();
  const asana = getAsana(id);
  // 사전에서 지워진 자세라도 기록은 남아 있도록 표시해 준다.
  const label = asana ? asana.ko : '삭제된 자세';

  return (
    <span className={`tag${asana ? '' : ' tag--missing'}`} title={asana ? [asana.en, asana.sa].filter(Boolean).join(' · ') : undefined}>
      {label}
      {onRemove && (
        <button type="button" className="tag__remove" aria-label={`${label} 선택 취소`} onClick={() => onRemove(id)}>
          <CloseIcon width={14} height={14} strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
