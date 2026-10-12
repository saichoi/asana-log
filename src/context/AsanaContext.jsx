import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ASANAS } from '../data/asanas.js';
import * as repository from '../storage/asanaRepository.js';
import { onDataChange } from '../storage/changes.js';

const AsanaContext = createContext(null);

/**
 * 기본 아사나(코드) + 내가 추가한 아사나 + 올린 사진을 합쳐서
 * 앱 어디서나 useAsanas() 로 꺼내 쓸 수 있게 한다.
 * (Google Drive 동기화가 다른 기기의 내용을 받아 오면 자동으로 다시 읽는다)
 */
export function AsanaProvider({ children }) {
  const [customAsanas, setCustomAsanas] = useState([]);
  const [images, setImages] = useState({});
  const [error, setError] = useState('');

  const loadLocal = useCallback(async () => {
    try {
      setCustomAsanas(await repository.listCustomAsanas());
      setImages(await repository.listAsanaImages());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadLocal();
    return onDataChange((source) => {
      if (source === 'sync') loadLocal();
    });
  }, [loadLocal]);

  const reload = loadLocal;

  const asanas = useMemo(() => [...ASANAS, ...customAsanas], [customAsanas]);
  const byId = useMemo(() => new Map(asanas.map((asana) => [asana.id, asana])), [asanas]);
  const getAsana = useCallback((id) => byId.get(id), [byId]);

  const addAsana = useCallback(async (draft) => {
    const asana = await repository.createCustomAsana(draft);
    await reload();
    return asana;
  }, [reload]);

  const updateAsana = useCallback(async (id, draft) => {
    const asana = await repository.updateCustomAsana(byId.get(id), draft);
    await reload();
    return asana;
  }, [byId, reload]);

  const removeAsana = useCallback(async (id) => {
    await repository.deleteCustomAsana(id);
    await reload();
  }, [reload]);

  const setImage = useCallback(async (id, dataUrl) => {
    await repository.setAsanaImage(id, dataUrl);
    await reload();
  }, [reload]);

  const value = useMemo(
    () => ({ asanas, customAsanas, getAsana, images, error, addAsana, updateAsana, removeAsana, setImage, reload }),
    [asanas, customAsanas, getAsana, images, error, addAsana, updateAsana, removeAsana, setImage, reload],
  );

  return <AsanaContext.Provider value={value}>{children}</AsanaContext.Provider>;
}

export function useAsanas() {
  const context = useContext(AsanaContext);
  if (!context) throw new Error('useAsanas 는 AsanaProvider 안에서만 쓸 수 있어요.');
  return context;
}
