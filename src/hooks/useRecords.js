import { useCallback, useEffect, useRef, useState } from 'react';
import * as repository from '../storage/recordRepository.js';
import { COLLECTIONS, subscribe } from '../storage/cloudStore.js';
import { sortRecords } from '../models/record.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * 기록 목록을 React 상태로 들고 있으면서 저장소와 동기화하는 훅
 * - 로그인 상태: Firestore 를 실시간 구독 (다른 기기에서 쓴 기록도 바로 보임)
 * - 비로그인: 이 기기(localStorage)에서 읽기
 */
export function useRecords() {
  const { status, uid } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const loadLocal = useCallback(async () => {
    try {
      setRecords(await repository.listRecords());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return undefined; // 로그인 확인 중에는 기다린다

    if (uid) {
      setLoading(true);
      return subscribe(
        uid,
        COLLECTIONS.records,
        (docs) => {
          setRecords(sortRecords(docs));
          setError('');
          setLoading(false);
        },
        () => setLoading(false),
      );
    }

    loadLocal();
    // 다른 탭에서 기록이 바뀌면 다시 불러오기
    const onStorage = () => loadLocal();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [status, uid, loadLocal]);

  // 로그인 상태에서는 구독이 화면을 자동으로 갱신하므로 다시 읽을 필요가 없다.
  const reload = useCallback(async () => {
    if (!uid) await loadLocal();
  }, [uid, loadLocal]);

  // 저장/수정/삭제는 실패 시 에러를 던져서 호출한 화면이 메시지를 보여 줄 수 있게 한다.
  const create = useCallback(async (draft) => {
    const record = await repository.createRecord(draft);
    await reload();
    return record;
  }, [reload]);

  const update = useCallback(async (id, draft) => {
    const record = await repository.updateRecord(recordsRef.current.find((r) => r.id === id), draft);
    await reload();
    return record;
  }, [reload]);

  const remove = useCallback(async (id) => {
    await repository.deleteRecord(id);
    await reload();
  }, [reload]);

  return { records, loading, error, create, update, remove, reload };
}
