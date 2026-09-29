import { useMemo, useState } from 'react';
import { CATEGORIES } from '../data/asanas.js';
import { useAsanas } from '../context/AsanaContext.jsx';
import { searchAsanas } from '../utils/search.js';
import AsanaItem from './AsanaItem.jsx';
import EmptyState from './EmptyState.jsx';
import SearchInput from './SearchInput.jsx';
import { LeafIcon, PlusIcon } from './Icons.jsx';

export default function AsanaDictionary({ onOpen, onAdd }) {
  const { asanas, error } = useAsanas();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchAsanas(asanas, query), [asanas, query]);

  // 검색어가 없을 때는 카테고리별로 묶어서 보여 준다.
  const groups = useMemo(() => {
    const order = [...CATEGORIES, ...new Set(results.map((a) => a.category).filter((c) => !CATEGORIES.includes(c)))];
    return order
      .map((category) => ({ category, items: results.filter((a) => a.category === category) }))
      .filter((group) => group.items.length > 0);
  }, [results]);

  const customCount = asanas.filter((a) => a.isCustom).length;

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <p className="page__eyebrow">Asana Dictionary</p>
          <h1 className="page__title">아사나 사전</h1>
          <p className="page__subtitle">
            {asanas.length}개의 자세{customCount > 0 && ` · 내가 추가한 자세 ${customCount}개`}
          </p>
        </div>
        <button type="button" className="button button--primary button--small" onClick={onAdd}>
          <PlusIcon width={16} height={16} /> 새 자세
        </button>
      </header>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <div className="sticky-search">
        <SearchInput value={query} onChange={setQuery} />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<LeafIcon />}
          title="찾는 자세가 없어요"
          description="한국어, 영어, 산스크리트어 중 다른 이름으로 검색하거나 새 자세로 추가해 보세요."
          action={
            <button type="button" className="button button--primary" onClick={onAdd}>
              <PlusIcon width={18} height={18} /> 새 자세 추가
            </button>
          }
        />
      ) : query ? (
        <>
          <p className="result-count">{results.length}개의 자세를 찾았어요</p>
          <ul className="asana-list">
            {results.map((asana) => (
              <li key={asana.id}><AsanaItem asana={asana} showCategory onOpen={onOpen} /></li>
            ))}
          </ul>
        </>
      ) : (
        groups.map(({ category, items }) => (
          <div key={category} className="asana-group">
            <h2 className="asana-group__title">{category}</h2>
            <ul className="asana-list">
              {items.map((asana) => (
                <li key={asana.id}><AsanaItem asana={asana} onOpen={onOpen} /></li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
