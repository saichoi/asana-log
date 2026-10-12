/**
 * Google Drive 동기화 설정
 * ------------------------------------------------------------
 * GOOGLE_CLIENT_ID: Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보 의
 * "OAuth 2.0 클라이언트 ID(웹 애플리케이션)" 값. 브라우저에 공개되는 값이라 저장소에 올려도 괜찮다.
 * 비워 두면 동기화 기능은 숨겨지고, 앱은 기기 저장만으로 동작한다.
 *
 * 그 클라이언트의 "승인된 리디렉션 URI" 에 앱 주소를 등록해야 한다. (README 참고)
 * ------------------------------------------------------------
 */
export const GOOGLE_CLIENT_ID = '183969228132-1jqa8hr1lll6csls1masiieem3hptmft.apps.googleusercontent.com';

/** 이 앱이 만든 파일만 읽고 쓸 수 있는 권한 (내 드라이브의 다른 파일은 볼 수 없다) */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** 내 드라이브에 만들어지는 동기화 파일 이름 */
export const SYNC_FILE_NAME = 'asana-log-sync.json';

export const isSyncConfigured = Boolean(GOOGLE_CLIENT_ID);
