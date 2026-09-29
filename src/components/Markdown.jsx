import { Fragment, useMemo } from 'react';
import { parseMarkdown } from '../utils/markdown.js';

function Inline({ nodes }) {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'strong':
        return <strong key={i}><Inline nodes={node.children} /></strong>;
      case 'em':
        return <em key={i}><Inline nodes={node.children} /></em>;
      case 'del':
        return <del key={i}><Inline nodes={node.children} /></del>;
      case 'code':
        return <code key={i}>{node.value}</code>;
      case 'link':
        return (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">
            <Inline nodes={node.children} />
          </a>
        );
      default:
        return <Fragment key={i}>{node.value}</Fragment>;
    }
  });
}

function Blocks({ blocks }) {
  return blocks.map((block, i) => {
    switch (block.type) {
      case 'heading': {
        // 페이지 제목보다 작게: # → h3, ## → h4, ### → h5
        const Tag = `h${block.level + 2}`;
        return <Tag key={i}><Inline nodes={block.children} /></Tag>;
      }
      case 'hr':
        return <hr key={i} />;
      case 'quote':
        return <blockquote key={i}><Blocks blocks={block.children} /></blockquote>;
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag key={i} start={block.ordered && block.start !== 1 ? block.start : undefined}>
            {block.items.map((item, j) => (
              <li key={j} className={item.checked !== null ? `md-task${item.checked ? ' is-done' : ''}` : undefined}>
                {item.checked !== null && (
                  <span className={`md-checkbox${item.checked ? ' is-checked' : ''}`} role="img" aria-label={item.checked ? '완료' : '미완료'} />
                )}
                <span><Inline nodes={item.children} /></span>
                {item.sub.length > 0 && <Blocks blocks={item.sub} />}
              </li>
            ))}
          </Tag>
        );
      }
      default:
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline nodes={line} />
              </Fragment>
            ))}
          </p>
        );
    }
  });
}

/** 마크다운 텍스트를 화면에 그린다 */
export default function Markdown({ text }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return <div className="markdown"><Blocks blocks={blocks} /></div>;
}
