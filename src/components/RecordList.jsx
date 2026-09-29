import { useMemo, useState } from 'react';
import { currentMonth, formatMonth, shiftMonth } from '../utils/date.js';
import RecordCard from './RecordCard.jsx';
import EmptyState from './EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BackIcon, ChevronIcon, CloudIcon, LeafIcon, PlusIcon } from './Icons.jsx';

/**
 * 기록 목록 — 한 달씩 넘겨 보는 다이어리 방식
 * month('YYYY-MM') 는 App 이 들고 있어서, 상세 화면에 다녀와도 보던 달이 유지된다.
 */
export default function RecordList({ records, loading, error, month, onMonthChange, onOpen, onWrite, onBackup }) {
  const { status: authStatus } = useAuth();
  const synced = authStatus === 'signedIn';
  const [pickerOpen, setPickerOpen] = useState(false);
  const thisMonth = currentMonth();

  // 기록이 있는 달과 개수 (최신 달부터). records 는 이미 최신순 정렬됨
  const months = useMemo(() => {
    const counts = new Map();
    for (const record of records) {
      const key = record.date.slice(0, 7);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [records]);

  const monthRecords = useMemo(() => records.filter((r) => r.date.startsWith(`${month}-`)), [records, month]);

  const goMonth = (next) => {
    setPickerOpen(false);
    onMonthChange(next);
  };

  // 빈 달에서 이동할 곳: 이전 달 중 가장 가까운 기록 → 없으면 가장 최근 기록
  const nearestMonth = months.find(([m]) => m < month)?.[0] ?? months[0]?.[0];

  const canGoNext = month < thisMonth;

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <p className="page__eyebrow">Asana Log</p>
          <h1 className="page__title">나의 수련 일지</h1>
          {records.length > 0 && <p className="page__subtitle">지금까지 {records.length}번의 수련을 기록했어요</p>}
        </div>
        <button
          type="button"
          className={`icon-button page__header-action${synced ? ' is-synced' : ''}`}
          aria-label={synced ? '동기화 · 백업 (동기화 켜짐)' : '동기화 · 백업'}
          title={synced ? '동기화 켜짐' : '동기화 · 백업'}
          onClick={onBackup}
        >
          <CloudIcon />
          {synced && <span className="sync-dot" aria-hidden="true" />}
        </button>
      </header>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted loading-text">기록을 불러오고 있어요…</p>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<LeafIcon />}
          title="아직 기록이 없어요"
          description={'오늘의 수련을 첫 번째 페이지에\n적어 보는 건 어떨까요?'}
          action={
            <div className="empty-state__actions">
              <button type="button" className="button button--primary" onClick={onWrite}>
                <PlusIcon width={18} height={18} /> 첫 기록 쓰기
              </button>
              <button type="button" className="button button--ghost" onClick={onBackup}>
                {authStatus === 'signedOut' ? '다른 기기의 기록이 있다면? 로그인 · 백업 가져오기' : '다른 곳의 기록이 있다면? 백업 파일 가져오기'}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <nav className="month-nav" aria-label="월 이동">
            <button type="button" className="icon-button" aria-label="이전 달" onClick={() => goMonth(shiftMonth(month, -1))}>
              <BackIcon />
            </button>
            <button
              type="button"
              className="month-nav__title"
              aria-expanded={pickerOpen}
              aria-label={`${formatMonth(month)}, 눌러서 다른 달 고르기`}
              onClick={() => setPickerOpen((o) => !o)}
            >
              <span>{formatMonth(month)}</span>
              <span className="month-nav__count">{monthRecords.length > 0 ? `${monthRecords.length}번 수련` : '기록 없음'}</span>
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="다음 달"
              disabled={!canGoNext}
              onClick={() => goMonth(shiftMonth(month, 1))}
            >
              <ChevronIcon />
            </button>
          </nav>

          {pickerOpen && (
            <div className="month-picker">
              <p className="month-picker__label">기록이 있는 달</p>
              <div className="chip-group">
                {month !== thisMonth && !months.some(([m]) => m === thisMonth) && (
                  <button type="button" className="chip chip--small" onClick={() => goMonth(thisMonth)}>
                    이번 달
                  </button>
                )}
                {months.map(([m, count]) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip chip--small${m === month ? ' is-active' : ''}`}
                    aria-pressed={m === month}
                    onClick={() => goMonth(m)}
                  >
                    {formatMonth(m)} <span className="chip__count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {monthRecords.length === 0 ? (
            <EmptyState
              title={month === thisMonth ? '이번 달에는 아직 기록이 없어요' : `${formatMonth(month)}에는 기록이 없어요`}
              action={
                <div className="empty-state__actions">
                  {month === thisMonth && (
                    <button type="button" className="button button--primary" onClick={onWrite}>
                      <PlusIcon width={18} height={18} /> 오늘의 수련 기록하기
                    </button>
                  )}
                  {nearestMonth && nearestMonth !== month && (
                    <button type="button" className="button" onClick={() => goMonth(nearestMonth)}>
                      {formatMonth(nearestMonth)} 기록 보기
                    </button>
                  )}
                </div>
              }
            />
          ) : (
            <ul className="record-list">
              {monthRecords.map((record) => (
                <li key={record.id}><RecordCard record={record} onOpen={onOpen} /></li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
