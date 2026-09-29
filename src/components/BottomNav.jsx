import { BookIcon, LeafIcon, PenIcon } from './Icons.jsx';

const TABS = [
  { key: 'list', label: '기록', Icon: BookIcon },
  { key: 'write', label: '작성', Icon: PenIcon },
  { key: 'dictionary', label: '아사나 사전', Icon: LeafIcon },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`bottom-nav__item${tab === key ? ' is-active' : ''}${key === 'write' ? ' bottom-nav__item--write' : ''}`}
          aria-current={tab === key ? 'page' : undefined}
          onClick={() => onChange(key)}
        >
          <span className="bottom-nav__icon"><Icon /></span>
          <span className="bottom-nav__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
