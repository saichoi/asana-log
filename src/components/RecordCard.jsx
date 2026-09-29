import { formatDate } from '../utils/date.js';
import { stripMarkdown } from '../utils/markdown.js';
import AsanaTag from './AsanaTag.jsx';

const MAX_TAGS = 4;

export default function RecordCard({ record, onOpen }) {
  const date = formatDate(record.date);
  const extra = record.asanaIds.length - MAX_TAGS;
  // 도전·변화가 비어 있으면 수업 내용으로 미리보기를 대신한다.
  // 목록에서는 마크다운 기호를 걷어 낸 글만 보여 준다.
  const previews = [
    { label: '도전', text: stripMarkdown(record.challenge) },
    { label: '변화', text: stripMarkdown(record.change) },
  ].filter((p) => p.text);
  if (previews.length === 0 && record.content) previews.push({ label: '수업', text: stripMarkdown(record.content) });

  return (
    <button type="button" className="record-card" onClick={() => onOpen(record.id)}>
      <div className="record-card__date">
        <span className="record-card__day">{date.day}</span>
        <span className="record-card__meta">{date.month} · {date.weekday}</span>
      </div>

      <div className="record-card__body">
        {record.lesson && <p className="record-card__lesson">{record.lesson}</p>}
        {record.asanaIds.length > 0 && (
          <div className="tags">
            {record.asanaIds.slice(0, MAX_TAGS).map((id) => <AsanaTag key={id} id={id} />)}
            {extra > 0 && <span className="tag tag--more">+{extra}</span>}
          </div>
        )}
        {previews.map(({ label, text }) => (
          <p key={label} className="record-card__preview">
            <span className="record-card__label">{label}</span>
            {text}
          </p>
        ))}
      </div>
    </button>
  );
}
