/**
 * Firebase 연결 설정
 * ------------------------------------------------------------
 * Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) → "SDK 설정 및 구성" 의 값을 넣는다.
 * 웹 앱 설정값은 원래 브라우저에 공개되는 값이라 저장소에 올려도 괜찮다.
 * 데이터는 firestore.rules 로 "로그인한 본인만 읽고 쓰기" 가 되도록 보호한다.
 *
 * 값이 비어 있으면 동기화 기능은 숨겨지고, 앱은 기기 저장만으로 동작한다.
 * ------------------------------------------------------------
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBllb75x4m1kkJNVOSmauk4ZldhL41XwIc',
  authDomain: 'asana-log-saichoi.firebaseapp.com',
  projectId: 'asana-log-saichoi',
  storageBucket: 'asana-log-saichoi.firebasestorage.app',
  messagingSenderId: '183969228132',
  appId: '1:183969228132:web:54d9fb762a2e95dcd20671',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
