/**
 * 예전 Firebase 계정의 기록을 이 기기로 옮기기 (합치기 방식, 계정의 기록은 지우지 않는다)
 */
import { isFirebaseConfigured } from '../firebase/config.js';
import { isLegacyChecked, setLegacyChecked } from './localStorageAdapter.js';
import { readLocalData } from './localData.js';
import { applyPlan, normalizeData, planImport } from './backupRepository.js';

export const canImportLegacy = isFirebaseConfigured;

/**
 * interactive: true 면 로그인 창을 띄우고, false 면 이 기기에 남아 있는 예전 로그인만 쓴다.
 * 결과: 옮긴 개수 { records, asanas, images }, 예전 로그인이 없으면 null
 */
export async function importLegacyAccount({ interactive }) {
  const legacy = await import('../firebase/legacyImport.js');
  let user = await legacy.currentLegacyUser();
  if (!user && interactive) user = await legacy.signInLegacy();
  if (!user) return null;

  const incoming = normalizeData(await legacy.fetchLegacyData(user.uid));
  const result = await applyPlan(planImport(readLocalData(), incoming));
  await legacy.signOutLegacy().catch(() => {});
  return result;
}

/**
 * 앱을 새 버전으로 처음 열었을 때 한 번: 예전 방식으로 로그인되어 있던 기기라면
 * 계정에 있던 기록을 자동으로 이 기기에 내려받는다. 실패하면 다음에 열 때 다시 시도한다.
 */
export async function migrateLegacyOnce() {
  if (!canImportLegacy || isLegacyChecked()) return null;
  const result = await importLegacyAccount({ interactive: false });
  setLegacyChecked();
  return result;
}
