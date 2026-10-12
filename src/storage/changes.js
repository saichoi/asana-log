/**
 * 이 기기의 데이터가 바뀌었음을 알리는 작은 알림판
 * - 'local': 화면에서 쓰거나 지움 → 동기화가 Drive 로 올릴 차례임을 안다
 * - 'sync':  동기화가 다른 기기의 내용을 받아 옴 → 화면이 다시 읽는다
 */
const listeners = new Set();

export function onDataChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitDataChange(source) {
  listeners.forEach((listener) => listener(source));
}
