import { useRef, useState } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import Markdown from './Markdown.jsx';

/** 서식 버튼: wrap 은 선택한 글자를 감싸고, prefix 는 줄 앞에 기호를 붙인다(한 번 더 누르면 해제). */
const TOOLS = [
  { label: 'B', title: '굵게', wrap: '**', className: 'md-tool--bold' },
  { label: 'I', title: '기울임', wrap: '*', className: 'md-tool--italic' },
  { label: 'H', title: '제목', prefix: '## ' },
  { label: '•', title: '목록', prefix: '- ' },
  { label: '1.', title: '번호 목록', prefix: '1. ' },
  { label: '☐', title: '체크리스트', prefix: '- [ ] ' },
  { label: '❝', title: '인용', prefix: '> ' },
];

const PREFIX_PATTERN = /^(#{1,3} |- \[[ xX]\] |[-*+] |\d+[.)] |> )/;

const CHEATSHEET = [
  ['## 제목', '제목'],
  ['**굵게**', '굵게'],
  ['*기울임*', '기울임'],
  ['~~취소선~~', '취소선'],
  ['- 항목', '목록 (앞에 공백 2칸이면 하위 목록)'],
  ['1. 항목', '번호 목록'],
  ['- [ ] 할 일', '체크리스트 ([x] 는 완료)'],
  ['> 인용', '선생님 말씀 인용 등'],
  ['---', '구분선'],
];

/**
 * 마크다운 입력창: 서식 버튼 + 작성/미리보기 전환 + 목록 자동 이어쓰기
 * onChange 에는 새 문자열이 바로 전달된다.
 */
export default function MarkdownEditor({ id, value, onChange, placeholder, invalid }) {
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  /** 값을 바꾸고 커서 위치를 되돌린다 */
  const apply = (next, selStart, selEnd = selStart) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  };

  const runTool = (tool) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;

    if (tool.wrap) {
      const w = tool.wrap;
      const selected = value.slice(start, end);
      // 이미 감싸져 있으면 해제
      if (value.slice(start - w.length, start) === w && value.slice(end, end + w.length) === w) {
        apply(value.slice(0, start - w.length) + selected + value.slice(end + w.length), start - w.length, end - w.length);
      } else {
        apply(value.slice(0, start) + w + selected + w + value.slice(end), start + w.length, end + w.length);
      }
      return;
    }

    // 선택한 줄들 전체에 접두어 적용
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = value.indexOf('\n', end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const lines = value.slice(lineStart, lineEnd).split('\n');
    const allHave = lines.every((line) => line.startsWith(tool.prefix));
    const replaced = lines
      .map((line, i) => {
        if (allHave) return line.slice(tool.prefix.length);
        const bare = line.replace(PREFIX_PATTERN, '');
        const prefix = tool.prefix === '1. ' ? `${i + 1}. ` : tool.prefix;
        return prefix + bare;
      })
      .join('\n');
    const next = value.slice(0, lineStart) + replaced + value.slice(lineEnd);
    const cursor = lineStart + replaced.length;
    apply(next, lines.length === 1 ? cursor : lineStart, cursor);
  };

  /** 목록에서 Enter 를 누르면 다음 항목 기호를 자동으로 붙인다. 빈 항목에서 Enter 면 목록 종료 */
  const handleKeyDown = (e) => {
    // 한글 조합 중 Enter 는 건드리지 않는다
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    const el = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    if (start !== end) return;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const line = value.slice(lineStart, start);
    const match = line.match(/^(\s*)(- \[[ xX]\] |[-*+] |(\d+)([.)]) |> )/);
    if (!match) return;

    e.preventDefault();
    const [marker, indent, , num, sep] = match;
    if (line.trim() === marker.trim()) {
      // 내용 없는 항목 → 기호 지우고 목록 끝내기
      apply(value.slice(0, lineStart) + value.slice(start), lineStart);
      return;
    }
    let nextMarker = marker;
    if (num) nextMarker = `${indent}${Number(num) + 1}${sep} `;
    else if (/\[[ xX]\]/.test(marker)) nextMarker = `${indent}- [ ] `;
    const insert = `\n${nextMarker}`;
    apply(value.slice(0, start) + insert + value.slice(end), start + insert.length);
  };

  return (
    <div className={`md-editor${invalid ? ' is-invalid' : ''}`}>
      <div className="md-editor__bar">
        <div className="md-editor__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!preview} className={`md-tab${!preview ? ' is-active' : ''}`} onClick={() => setPreview(false)}>
            작성
          </button>
          <button type="button" role="tab" aria-selected={preview} className={`md-tab${preview ? ' is-active' : ''}`} onClick={() => setPreview(true)}>
            미리보기
          </button>
        </div>
        <button
          type="button"
          className={`md-tool md-tool--help${helpOpen ? ' is-active' : ''}`}
          aria-label="마크다운 사용법"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((o) => !o)}
        >
          ?
        </button>
      </div>

      {helpOpen && (
        <dl className="md-help">
          {CHEATSHEET.map(([syntax, desc]) => (
            <div key={syntax}>
              <dt><code>{syntax}</code></dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      )}

      {preview ? (
        <div className="md-editor__preview">
          {value.trim() ? <Markdown text={value} /> : <p className="muted">미리 볼 내용이 없어요.</p>}
        </div>
      ) : (
        <>
          <div className="md-toolbar" role="toolbar" aria-label="서식">
            {TOOLS.map((tool) => (
              <button
                key={tool.title}
                type="button"
                className={`md-tool ${tool.className ?? ''}`}
                title={tool.title}
                aria-label={tool.title}
                // 버튼을 눌러도 입력창 포커스(모바일 키보드)가 유지되도록
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runTool(tool)}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <AutoTextarea
            id={id}
            textareaRef={textareaRef}
            className="md-editor__input"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={invalid}
          />
        </>
      )}
    </div>
  );
}
