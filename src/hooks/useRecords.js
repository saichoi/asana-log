import { useCallback, useEffect, useState } from 'react';
import * as repository from '../storage/recordRepository.js';

/** 기록 목록을 React 상태로 들고 있으면서 저장소와 동기화하는 훅 */
export function useRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
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
    refresh();
    // 다른 탭에서 기록이 바뀌면 다시 불러오기
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  // 저장/수정/삭제는 실패 시 에러를 던져서 호출한 화면이 메시지를 보여 줄 수 있게 한다.
  const create = useCallback(async (draft) => {
    const record = await repository.createRecord(draft);
    await refresh();
    return record;
  }, [refresh]);

  const update = useCallback(async (id, draft) => {
    const record = await repository.updateRecord(id, draft);
    await refresh();
    return record;
  }, [refresh]);

  const remove = useCallback(async (id) => {
    await repository.deleteRecord(id);
    await refresh();
  }, [refresh]);

  return { records, loading, error, create, update, remove };
}
