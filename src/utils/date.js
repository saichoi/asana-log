const pad = (n) => String(n).padStart(2, '0');

/** 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD). toISOString()은 UTC라 새벽에 날짜가 어긋나서 쓰지 않는다. */
export function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 'YYYY-MM-DD'가 실제로 존재하는 날짜인지 확인 */
export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '2026-09-29' → { full: '2026년 9월 29일 화요일', month: '9월', day: '29', weekday: '화' } */
export function formatDate(value) {
  if (!isValidDateString(value)) return { full: value, month: '', day: '', weekday: '' };
  const [y, m, d] = value.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return {
    full: `${y}년 ${m}월 ${d}일 ${weekday}요일`,
    year: `${y}`,
    month: `${m}월`,
    day: `${d}`,
    weekday,
  };
}

/** 이번 달 'YYYY-MM' */
export function currentMonth() {
  return todayString().slice(0, 7);
}

/** 'YYYY-MM' 에서 diff 개월 이동 */
export function shiftMonth(month, diff) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + diff, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** '2026-09' → '2026년 9월' */
export function formatMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return `${y}년 ${m}월`;
}
