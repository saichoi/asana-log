import { CloseIcon, SearchIcon } from './Icons.jsx';

export default function SearchInput({ value, onChange, autoFocus = false }) {
  return (
    <label className="search">
      <SearchIcon width={18} height={18} className="search__icon" />
      <input
        type="search"
        className="search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="한국어 · English · Sanskrit 으로 검색"
        aria-label="아사나 검색"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
      {value && (
        <button type="button" className="search__clear" aria-label="검색어 지우기" onClick={() => onChange('')}>
          <CloseIcon width={16} height={16} />
        </button>
      )}
    </label>
  );
}
