import { useCallback, useEffect, useRef, useState } from 'react';
import * as repository from '../storage/recordRepository.js';
import { onDataChange } from '../storage/changes.js';

/**
 * 기록 목록을 React 상태로 들고 있으면서 이 기기의 저장소와 맞추는 훅
 * (Google Drive 동기화가 다른 기기의 기록을 받아 오면 자동으로 다시 읽는다)
 */
export function useRecords() {
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
    loadLocal();
    // 동기화가 받아 온 기록, 다른 탭에서 바뀐 기록을 다시 불러오기
    const offSync = onDataChange((source) => {
      if (source === 'sync') loadLocal();
    });
    const onStorage = () => loadLocal();
    window.addEventListener('storage', onStorage);
    return () => {
      offSync();
      window.removeEventListener('storage', onStorage);
    };
  }, [loadLocal]);

  const reload = loadLocal;

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
