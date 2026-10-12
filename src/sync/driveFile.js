/**
 * Google Drive REST API 호출 — 동기화 파일 하나를 찾고·읽고·쓰는 데 필요한 것만
 * 파일은 이름이 아니라 appProperties 표시로 찾으므로, Drive 에서 이름을 바꾸거나 폴더로 옮겨도 된다.
 */
import { SYNC_FILE_NAME } from './config.js';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FIELDS = 'id,md5Checksum,trashed';
const MARK = { key: 'asanaLog', value: 'sync' };

/** status: HTTP 상태 코드 (인터넷 연결 문제는 0) */
export class DriveError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function call(token, url, init = {}) {
  let response;
  try {
    response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  } catch {
    throw new DriveError(0, 'network');
  }
  if (!response.ok) {
    let reason = '';
    try {
      reason = (await response.json()).error?.message ?? '';
    } catch {
      /* 본문이 JSON 이 아니면 무시 */
    }
    throw new DriveError(response.status, reason);
  }
  return response;
}

/** 이 앱이 만든 동기화 파일 찾기. 여러 개면 가장 먼저 만든 것(모든 기기가 같은 파일을 고르도록) */
export async function findSyncFile(token) {
  const query = `appProperties has { key='${MARK.key}' and value='${MARK.value}' } and trashed = false`;
  const url = `${API}/files?q=${encodeURIComponent(query)}&orderBy=createdTime&pageSize=1&fields=files(${FIELDS})`;
  const { files } = await (await call(token, url)).json();
  return files?.[0] ?? null;
}

/** 파일이 지워졌거나 휴지통에 있으면 null */
export async function getFileMeta(token, id) {
  try {
    const meta = await (await call(token, `${API}/files/${id}?fields=${FIELDS}`)).json();
    return meta.trashed ? null : meta;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function downloadFile(token, id) {
  return (await call(token, `${API}/files/${id}?alt=media`)).text();
}

export async function createSyncFile(token, text) {
  const boundary = `asana-log-${Date.now().toString(36)}`;
  const metadata = { name: SYNC_FILE_NAME, mimeType: 'application/json', appProperties: { [MARK.key]: MARK.value } };
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    text,
    `--${boundary}--`,
  ].join('\r\n');
  const response = await call(token, `${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return response.json();
}

export async function updateFile(token, id, text) {
  const response = await call(token, `${UPLOAD}/files/${id}?uploadType=media&fields=${FIELDS}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: text,
  });
  return response.json();
}

/** 연결한 계정의 이메일 (화면 표시용) */
export async function getAccountEmail(token) {
  const { user } = await (await call(token, `${API}/about?fields=user(emailAddress)`)).json();
  return user?.emailAddress ?? '';
}
