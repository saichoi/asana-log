/**
 * Google 계정 연결 (Drive 접근 권한 받기)
 * ------------------------------------------------------------
 * 서버 없이 브라우저만으로 동작하도록, Google 로그인 화면으로 이동했다가
 * 주소의 # 뒤에 접근 토큰을 받아 돌아오는 방식을 쓴다. (외부 스크립트·팝업 없음)
 * 이 방식의 토큰은 약 1시간 뒤 만료되고 자동으로 갱신할 수 없어서,
 * 만료되면 "다시 연결"을 눌러 한 번 더 다녀와야 한다.
 * ------------------------------------------------------------
 */
import { DRIVE_SCOPE, GOOGLE_CLIENT_ID } from './config.js';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/** Google Cloud 콘솔의 "승인된 리디렉션 URI" 에 등록해야 하는 주소 */
export const redirectUri = () => window.location.origin + import.meta.env.BASE_URL;

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Google 로그인 화면 주소와, 돌아왔을 때 확인할 정보(pending)를 만든다 */
export function buildAuthRequest({ email, returnTo }) {
  const pending = { state: randomState(), returnTo: returnTo ?? null };
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'token',
    scope: DRIVE_SCOPE,
    state: pending.state,
  });
  if (email) params.set('login_hint', email);
  return { url: `${AUTH_URL}?${params}`, pending };
}

/**
 * 앱이 열릴 때 호출: Google 에서 돌아온 주소면 토큰을 꺼내고 주소를 원래대로 정리한다.
 * pending: 떠나기 전에 저장해 둔 정보. 우리가 시작한 요청이 아니면 null 을 돌려준다.
 * 결과: { ok: true, token: { accessToken, expiresAt }, returnTo } | { ok: false, error, returnTo }
 */
export function readAuthRedirect(pending) {
  const hash = window.location.hash.slice(1);
  if (!/(^|&)(access_token|error)=/.test(hash)) return null;
  const params = new URLSearchParams(hash);
  if (!params.has('state')) return null;

  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  if (!pending || params.get('state') !== pending.state) return null;

  const { returnTo } = pending;
  const accessToken = params.get('access_token');
  if (!accessToken) return { ok: false, error: params.get('error') ?? 'unknown', returnTo };
  // 권한 화면에서 Drive 접근 체크를 빼고 진행한 경우
  if (!(params.get('scope') ?? '').split(' ').includes(DRIVE_SCOPE)) return { ok: false, error: 'scope_denied', returnTo };

  const seconds = Number(params.get('expires_in')) || 3600;
  // 만료 직전에 요청이 실패하지 않도록 1분 일찍 만료된 것으로 본다.
  return { ok: true, token: { accessToken, expiresAt: Date.now() + (seconds - 60) * 1000 }, returnTo };
}

/** 연결을 끊을 때 토큰을 바로 못 쓰게 만든다 (실패해도 1시간 안에 저절로 만료) */
export function revokeToken(accessToken) {
  fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).catch(() => {});
}
