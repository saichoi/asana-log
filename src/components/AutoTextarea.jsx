import { useEffect, useRef } from 'react';

/** 내용에 맞춰 높이가 늘어나는 textarea. textareaRef 로 DOM 에 접근할 수 있다. */
export default function AutoTextarea({ value, textareaRef, rows = 3, ...props }) {
  const innerRef = useRef(null);
  const ref = textareaRef ?? innerRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);

  return <textarea ref={ref} value={value} rows={rows} {...props} />;
}
