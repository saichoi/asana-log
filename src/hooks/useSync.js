import { useSyncExternalStore } from 'react';
import { connectDrive, disconnectDrive, getSyncSnapshot, subscribeSync, syncNow } from '../sync/syncEngine.js';

/** 연결된 상태 (기록이 Drive 와 맞춰지고 있거나, 다시 연결하면 이어지는 상태) */
export const isSyncOn = (status) => status !== 'unconfigured' && status !== 'off';

/**
 * Google Drive 동기화 상태와 조작
 * status: 'unconfigured' | 'off' | 'syncing' | 'error' | 'needsAuth' | 'offline' | 'synced'
 */
export function useSync() {
  const snapshot = useSyncExternalStore(subscribeSync, getSyncSnapshot);
  return { ...snapshot, connect: connectDrive, disconnect: disconnectDrive, syncNow };
}
