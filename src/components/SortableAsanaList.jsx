import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAsanas } from '../context/AsanaContext.jsx';
import AsanaFigure from './AsanaFigure.jsx';
import { CloseIcon, GripIcon } from './Icons.jsx';

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * 선택한 아사나를 수업 순서대로 정렬하는 목록
 * - 손잡이(⋮⋮)를 끌어서 순서 변경 (마우스·터치 모두)
 * - 손잡이에 초점을 두고 ↑ / ↓ 키로도 이동
 * - × 버튼으로 선택 취소
 */
export default function SortableAsanaList({ ids, onChange, onRemove }) {
  const { getAsana } = useAsanas();
  const [dragOrder, setDragOrder] = useState(null); // 끄는 동안의 임시 순서
  const [draggingId, setDraggingId] = useState(null);
  const itemRefs = useRef(new Map());
  const drag = useRef(null); // { id, pointerId, startY, order, layoutPending }
  const focusId = useRef(null);
  const removeListeners = useRef(null);
  // window 이벤트 핸들러에서 최신 props 를 읽기 위한 참조
  const latest = useRef({ ids, onChange });
  latest.current = { ids, onChange };

  const order = dragOrder ?? ids;

  // 순서가 바뀌어 다시 그려진 뒤에야 다음 자리 바꾸기를 계산한다.
  useLayoutEffect(() => {
    if (drag.current) drag.current.layoutPending = false;
  }, [dragOrder]);

  // 키보드로 옮긴 뒤에도 같은 손잡이에 초점 유지
  useEffect(() => {
    if (!focusId.current) return;
    itemRefs.current.get(focusId.current)?.querySelector('.sortable__handle')?.focus();
    focusId.current = null;
  }, [ids]);

  const setTranslate = (id, y) => {
    const el = itemRefs.current.get(id);
    if (el) el.style.transform = y ? `translateY(${y}px)` : '';
  };

  /*
   * 끄는 동안의 이벤트는 window 에서 받는다.
   * 순서가 바뀔 때 React 가 끌고 있는 항목의 DOM 을 옮기면
   * 요소에 걸어 둔 포인터 캡처가 풀릴 수 있기 때문이다.
   */
  const handlePointerDown = (e, id) => {
    if (e.button !== 0 || drag.current) return;
    e.preventDefault();
    drag.current = { id, pointerId: e.pointerId, startY: e.clientY, order: [...ids], layoutPending: false };
    setDragOrder([...ids]);
    setDraggingId(id);
    const onMove = (ev) => handlePointerMove(ev);
    const onEnd = (ev) => endDrag(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    removeListeners.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      removeListeners.current = null;
    };
  };

  // 끄는 도중 화면을 벗어나면(컴포넌트 해제) 이벤트 정리
  useEffect(() => () => removeListeners.current?.(), []);

  function handlePointerMove(e) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    let dy = e.clientY - d.startY;

    if (!d.layoutPending) {
      const index = d.order.indexOf(d.id);
      const cur = itemRefs.current.get(d.id);
      const next = itemRefs.current.get(d.order[index + 1]);
      const prev = itemRefs.current.get(d.order[index - 1]);

      // 옆 항목의 절반을 넘어가면 자리를 바꾸고, 기준점을 옮겨 손가락 위치를 그대로 따라가게 한다.
      if (next && dy > next.offsetHeight / 2) {
        d.startY += next.offsetTop + next.offsetHeight - (cur.offsetTop + cur.offsetHeight);
        d.order = move(d.order, index, index + 1);
      } else if (prev && -dy > prev.offsetHeight / 2) {
        d.startY += prev.offsetTop - cur.offsetTop;
        d.order = move(d.order, index, index - 1);
      }
      if (d.order[index] !== d.id) {
        d.layoutPending = true;
        setDragOrder(d.order);
        dy = e.clientY - d.startY;
      }
    }
    setTranslate(d.id, dy);
  }

  function endDrag(e) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    removeListeners.current?.();
    setTranslate(d.id, 0);
    drag.current = null;
    setDraggingId(null);
    setDragOrder(null);
    const { ids: currentIds, onChange: notify } = latest.current;
    if (d.order.some((id, i) => id !== currentIds[i])) notify(d.order);
  }

  const handleKeyDown = (e, index) => {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (to < 0 || to >= ids.length) return;
    focusId.current = ids[index];
    onChange(move(ids, index, to));
  };

  return (
    <ol className={`sortable${draggingId ? ' is-sorting' : ''}`} aria-label="선택한 아사나 (수업 순서)">
      {order.map((id, index) => {
        const asana = getAsana(id);
        const name = asana?.ko ?? '삭제된 자세';
        return (
          <li
            key={id}
            ref={(el) => (el ? itemRefs.current.set(id, el) : itemRefs.current.delete(id))}
            className={`sortable__item${draggingId === id ? ' is-dragging' : ''}`}
          >
            <AsanaFigure asana={asana ?? { id }} size="xs" />
            <span className="sortable__names">
              <span className="sortable__ko">{name}</span>
              {asana?.en && <span className="sortable__en">{asana.en}</span>}
            </span>
            {order.length > 1 && (
              <button
                type="button"
                className="sortable__handle"
                aria-label={`${name} 순서 옮기기 (위아래 화살표 키로 이동)`}
                onPointerDown={(e) => handlePointerDown(e, id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <GripIcon width={20} height={20} />
              </button>
            )}
            {onRemove && (
              <button type="button" className="sortable__remove" aria-label={`${name} 선택 취소`} onClick={() => onRemove(id)}>
                <CloseIcon width={16} height={16} strokeWidth={2} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
