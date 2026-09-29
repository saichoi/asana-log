/**
 * 가벼운 마크다운 파서 (외부 라이브러리 없음)
 * ------------------------------------------------------------
 * 지원 문법
 *   # 제목 / ## 제목 / ### 제목
 *   **굵게**  *기울임*  ~~취소선~~  `코드`  [링크](https://...)
 *   - 목록 / 1. 번호 목록 / - [ ] 체크리스트 (들여쓰기로 하위 목록)
 *   > 인용
 *   --- 구분선
 *   줄바꿈은 입력한 그대로 유지 (일기처럼 쓰기 편하도록)
 *
 * HTML 문자열이 아니라 구조(AST)로 바꾸고, 화면은 components/Markdown.jsx 가 React 요소로 그린다.
 * 그래서 입력에 <script> 같은 태그가 있어도 글자로만 보이고 실행되지 않는다.
 * ------------------------------------------------------------
 */

const HEADING = /^(#{1,3})\s+(.*)$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const CHECKBOX = /^\[([ xX])\]\s+(.*)$/;

const indentOf = (line) => line.match(/^\s*/)[0].replace(/\t/g, '  ').length;
const isOrdered = (marker) => /\d/.test(marker);

/** 블록 단위 파싱 */
export function parseMarkdown(text = '') {
  return parseBlocks(text.replace(/\r\n?/g, '\n').split('\n'));
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, children: parseInline(heading[2].trim()) });
      i += 1;
      continue;
    }

    if (HR.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        inner.push(lines[i].match(QUOTE)[1]);
        i += 1;
      }
      blocks.push({ type: 'quote', children: parseBlocks(inner) });
      continue;
    }

    const item = line.match(LIST_ITEM);
    if (item) {
      i = parseList(lines, i, blocks);
      continue;
    }

    // 문단: 빈 줄이나 다른 블록이 나오기 전까지의 줄들 (줄바꿈 유지)
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !HEADING.test(lines[i]) &&
      !HR.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !LIST_ITEM.test(lines[i])
    ) {
      paragraph.push(parseInline(lines[i].trim()));
      i += 1;
    }
    blocks.push({ type: 'paragraph', lines: paragraph });
  }

  return blocks;
}

/** 같은 들여쓰기·같은 종류의 목록 항목을 모으고, 더 들여쓴 줄은 하위 내용으로 처리 */
function parseList(lines, start, blocks) {
  const [, indent, marker] = lines[start].match(LIST_ITEM);
  const baseIndent = indentOf(indent);
  const ordered = isOrdered(marker);
  const list = { type: 'list', ordered, start: ordered ? parseInt(marker, 10) : 1, items: [] };

  let i = start;
  while (i < lines.length) {
    const match = lines[i].match(LIST_ITEM);
    if (!match || indentOf(match[1]) !== baseIndent || isOrdered(match[2]) !== ordered) break;

    let content = match[3];
    let checked = null;
    const checkbox = content.match(CHECKBOX);
    if (checkbox) {
      checked = checkbox[1] !== ' ';
      content = checkbox[2];
    }

    // 더 깊게 들여쓴 다음 줄들은 이 항목의 하위 내용
    const subLines = [];
    i += 1;
    while (i < lines.length && lines[i].trim() && indentOf(lines[i]) > baseIndent) {
      subLines.push(lines[i].replace(/\t/g, '  ').slice(baseIndent + 2));
      i += 1;
    }

    list.items.push({ checked, children: parseInline(content), sub: subLines.length ? parseBlocks(subLines) : [] });
  }

  blocks.push(list);
  return i;
}

/** 줄 안의 강조·코드·링크 파싱 */
const INLINE = /(`[^`]+`)|(\*\*(.+?)\*\*)|(~~(.+?)~~)|(\*([^*\s](?:[^*]*[^*\s])?)\*)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/;

export function parseInline(text) {
  const nodes = [];
  let rest = text;

  while (rest) {
    const match = rest.match(INLINE);
    if (!match) {
      nodes.push({ type: 'text', value: rest });
      break;
    }
    if (match.index > 0) nodes.push({ type: 'text', value: rest.slice(0, match.index) });

    const [whole, code, bold, boldText, strike, strikeText, italic, italicText, link, linkText, href] = match;
    if (code) nodes.push({ type: 'code', value: code.slice(1, -1) });
    else if (bold) nodes.push({ type: 'strong', children: parseInline(boldText) });
    else if (strike) nodes.push({ type: 'del', children: parseInline(strikeText) });
    else if (italic) nodes.push({ type: 'em', children: parseInline(italicText) });
    else if (link) nodes.push({ type: 'link', href, children: parseInline(linkText) });

    rest = rest.slice(match.index + whole.length);
  }

  return nodes;
}

/** 목록 카드 미리보기용: 마크다운 기호를 걷어 낸 한 줄 텍스트 */
export function stripMarkdown(text = '') {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(HEADING, '$2')
        .replace(HR, '')
        .replace(/^\s*>\s?/, '')
        .replace(/^\s*([-*+]|\d+[.)])\s+/, '')
        .replace(/^\[[ xX]\]\s+/, ''),
    )
    .join(' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
