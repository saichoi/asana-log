/**
 * Google Drive 동기화 엔진
 * ------------------------------------------------------------
 * 기록은 언제나 이 기기에 먼저 저장된다. 연결되어 있으면 이 엔진이 뒤에서
 * Drive 의 동기화 파일을 내려받아 이 기기 데이터와 합치고(syncData.js), 바뀐 쪽을 다시 저장한다.
 *
 * 동기화하는 때: 앱을 열 때, 기록을 쓰거나 지운 직후, 앱으로 돌아올 때, 열어 둔 동안 1분마다.
 * (1분마다 하는 확인은 파일이 바뀌었는지만 묻는 가벼운 요청이다)
 *
 * Google 연결은 약 1시간마다 만료된다. 만료된 채로 앱을 열면 화면을 그리기 전에
 * Google 에 조용히 다녀와 연결을 되살리고(renewSilently), 그게 안 될 때만 "다시 연결" 안내를 보여 준다.
 *
 * 화면은 hooks/useSync.js 로 상태를 읽는다.
 * status: 'unconfigured' | 'off' | 'syncing' | 'error' | 'needsAuth' | 'offline' | 'synced'
 * ------------------------------------------------------------
 */
import { isSyncConfigured } from './config.js';
import { buildAuthRequest, readAuthRedirect, revokeToken } from './googleAuth.js';
import { createSyncFile, downloadFile, findSyncFile, getAccountEmail, getFileMeta, updateFile } from './driveFile.js';
import { mergeData, parseSyncFile, serializeSyncFile } from './syncData.js';
import { loadSyncState, saveSyncState } from '../storage/localStorageAdapter.js';
import { readLocalData, writeLocalData } from '../storage/localData.js';
import { emitDataChange, onDataChange } from '../storage/changes.js';

const WRITE_DELAY = 2000;
const POLL_INTERVAL = 60_000;
const SILENT_RETRY_GAP = 5 * 60_000; // 조용한 재연결을 연달아 시도하지 않는 간격 (무한 왕복 방지)
const ONLINE_PROBE = 'https://accounts.google.com/favicon.ico';

/**
 * 이 기기에 저장해 두는 연결 상태
 * { connected, email, token, fileId, remoteMd5, dirty, lastSyncedAt, authPending, silentAt, silentBlocked }
 * silentBlocked: 조용한 재연결이 거절됨 → 사용자가 직접 "다시 연결"할 때까지 자동으로 시도하지 않는다
 */
let state = {};
let running = false;
let again = false; // 동기화 중에 또 요청이 들어오면 끝난 뒤 한 번 더
let error = '';
let changeSeq = 0; // 이 기기에서 데이터가 바뀔 때마다 증가
let writeTimer = null;
let authReturnTo = null;
let canLeave = () => true; // 지금 페이지를 떠나도 되는지 (작성 중인 글이 없는지) — App 이 알려 준다

const listeners = new Set();
let snapshot = null;

function patch(changes) {
  state = { ...state, ...changes };
  try {
    saveSyncState(state);
  } catch {
    /* 저장 공간이 없어도 이번 실행 동안은 메모리의 상태로 동작 */
  }
}

const validToken = () => (state.token && state.token.expiresAt > Date.now() ? state.token.accessToken : null);

function currentStatus() {
  if (!isSyncConfigured) return 'unconfigured';
  if (!state.connected) return 'off';
  if (running) return 'syncing';
  if (!validToken()) return 'needsAuth';
  if (error) return 'error';
  if (!navigator.onLine) return 'offline';
  return 'synced';
}

function emit() {
  snapshot = { status: currentStatus(), email: state.email ?? '', lastSyncedAt: state.lastSyncedAt ?? '', error };
  listeners.forEach((listener) => listener());
}

export function subscribeSync(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncSnapshot() {
  if (!snapshot) emit();
  return snapshot;
}

/** Google 에서 돌아온 직후라면 떠나기 전에 보고 있던 화면 ('backup' 등) */
export const getAuthReturnTo = () => authReturnTo;

function driveMessage(e) {
  if (e.status === 0) return '인터넷 연결이 불안정해서 동기화하지 못했어요. 잠시 뒤 다시 시도할게요.';
  if (e.status === 403 && /has not been used|is disabled/i.test(e.message)) {
    return 'Google Cloud 프로젝트에서 Google Drive API가 꺼져 있어요. 콘솔에서 Drive API를 사용 설정해 주세요.';
  }
  if (e.status === 403 && /quota|rate limit/i.test(e.message)) return 'Google Drive 요청이 잠시 제한됐어요. 조금 뒤 다시 시도할게요.';
  if (e.status === 403 || e.status === 507) return `Google Drive에 저장하지 못했어요. 드라이브 용량과 권한을 확인해 주세요. (${e.message || e.status})`;
  if (e.status) return `Google Drive와 동기화하지 못했어요. (${e.status}${e.message ? ` ${e.message}` : ''})`;
  return e.message; // 저장 공간 부족, 파일 손상 등 직접 만든 메시지
}

function authMessage(code) {
  if (code === 'access_denied') return 'Google Drive 연결을 취소했어요.';
  if (code === 'scope_denied') return 'Google Drive 파일 접근을 허용해야 동기화할 수 있어요. 다시 연결하면서 체크해 주세요.';
  return `Google Drive에 연결하지 못했어요. (${code})`;
}

/** 한 번의 동기화: Drive 파일 확인 → (바뀌었으면) 내려받아 합치기 → (필요하면) 올리기 */
async function syncOnce(token) {
  let meta = state.fileId ? await getFileMeta(token, state.fileId) : null;
  if (!meta) meta = await findSyncFile(token);

  if (!meta) {
    const seq = changeSeq;
    const created = await createSyncFile(token, serializeSyncFile(readLocalData()));
    patch({ fileId: created.id, remoteMd5: created.md5Checksum, dirty: changeSeq !== seq });
    return;
  }

  const remoteUnchanged = meta.id === state.fileId && meta.md5Checksum === state.remoteMd5;
  if (remoteUnchanged && !state.dirty) return;

  // Drive 파일이 지난번 그대로면 이 기기 내용이 곧 최신이므로 내려받지 않고 올리기만 한다.
  const remoteText = remoteUnchanged ? null : await downloadFile(token, meta.id);

  // 여기부터 저장까지는 기다리는 곳이 없어야 한다. (그 사이에 쓴 기록을 덮어쓰지 않도록)
  const seq = changeSeq;
  let data = readLocalData();
  let upload = true;
  if (remoteText !== null) {
    const merged = mergeData(data, parseSyncFile(remoteText));
    if (merged.localChanged) {
      writeLocalData(merged.data);
      emitDataChange('sync');
    }
    data = merged.data;
    upload = merged.remoteChanged;
  }

  let md5 = meta.md5Checksum;
  if (upload) md5 = (await updateFile(token, meta.id, serializeSyncFile(data))).md5Checksum;
  patch({ fileId: meta.id, remoteMd5: md5, dirty: changeSeq !== seq });
}

async function sync() {
  if (!state.connected) return;
  if (running) {
    again = true;
    return;
  }
  const token = validToken();
  if (!token || !navigator.onLine) {
    emit();
    return;
  }

  running = true;
  error = '';
  emit();
  try {
    await syncOnce(token);
    patch({ lastSyncedAt: new Date().toISOString() });
  } catch (e) {
    console.error('[sync]', e);
    if (e.status === 401) patch({ token: null }); // 토큰 만료·취소 → 다시 연결 필요
    else error = driveMessage(e);
  } finally {
    running = false;
    emit();
    if (again) {
      again = false;
      sync();
    }
  }
}

function scheduleSync() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(sync, WRITE_DELAY);
}

/** 새 계정으로 연결됐으면 예전 계정의 파일 정보를 버린다 */
async function refreshAccount(token) {
  try {
    const email = await getAccountEmail(token);
    if (email && email !== state.email) patch({ email, fileId: null, remoteMd5: null });
  } catch {
    /* 이메일은 표시용이라 실패해도 동기화는 계속 */
  }
}

/** 작성 중인 내용이 있을 때는 자동으로 페이지를 떠나지 않도록, 떠나도 되는지 묻는 함수를 등록한다 */
export function setLeaveGuard(guard) {
  canLeave = guard;
}

const shouldRenew = () =>
  state.connected && !validToken() && !state.silentBlocked && navigator.onLine
  && Date.now() - (state.silentAt ?? 0) > SILENT_RETRY_GAP;

/**
 * 만료된 연결을 화면 없이 되살리러 Google 에 다녀온다. 이동을 시작했으면 true.
 * 인터넷이 실제로 되는지 먼저 확인한다. (안 되는데 이동하면 브라우저 오류 화면에 갇힌다)
 */
async function renewSilently() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    await fetch(ONLINE_PROBE, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
  const { url, pending } = buildAuthRequest({ email: state.email, silent: true });
  patch({ authPending: pending, silentAt: Date.now() });
  window.location.replace(url);
  return true;
}

/**
 * 앱이 열릴 때 한 번 호출 (main.jsx).
 * 조용한 재연결을 위해 곧 페이지를 떠난다면 true 로 끝나는 Promise 를 돌려준다. (그때는 화면을 그릴 필요가 없다)
 */
export function initSync() {
  if (!isSyncConfigured) return false;
  state = loadSyncState();

  const auth = readAuthRedirect(state.authPending);
  if (state.authPending) patch({ authPending: null });
  if (auth) authReturnTo = auth.returnTo;

  onDataChange((source) => {
    if (source !== 'local') return;
    changeSeq += 1;
    if (!state.connected) return;
    if (!state.dirty) patch({ dirty: true });
    scheduleSync();
  });
  window.addEventListener('online', sync);
  window.addEventListener('offline', emit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    // 오랜만에 앱으로 돌아왔는데 연결이 만료됐으면 조용히 되살린다. (작성 중이면 건드리지 않는다)
    if (shouldRenew() && canLeave()) renewSilently().then((leaving) => leaving || sync());
    else sync();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') sync();
  }, POLL_INTERVAL);

  if (auth?.ok) {
    patch({ connected: true, token: auth.token, silentBlocked: false });
    refreshAccount(auth.token.accessToken).then(sync);
    return false;
  }
  if (auth?.silent) patch({ silentBlocked: true }); // 조용히는 안 됨 → "다시 연결" 안내로
  else if (auth) error = authMessage(auth.error);

  if (!auth && shouldRenew()) return renewSilently();
  sync();
  return false;
}

/** Google 로그인 화면으로 이동한다. returnTo: 돌아와서 다시 보여 줄 화면 */
export function connectDrive(returnTo) {
  const { url, pending } = buildAuthRequest({ email: state.email, returnTo });
  patch({ authPending: pending });
  window.location.assign(url);
}

/** 연결 끊기: 이 기기의 기록과 Drive 의 파일은 그대로 두고 동기화만 멈춘다 */
export function disconnectDrive() {
  if (state.token) revokeToken(state.token.accessToken);
  clearTimeout(writeTimer);
  error = '';
  state = {};
  patch({});
  emit();
}

export const syncNow = () => sync();
