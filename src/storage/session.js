/**
 * 지금 기록을 어디에 저장하는지 결정하는 스위치
 * - null:  이 기기(localStorage)에 저장 — 로그인하지 않은 상태
 * - uid:   Firestore 의 users/{uid}/ 에 저장 — Google 로그인 상태 (여러 기기 동기화)
 * AuthContext 가 로그인 상태가 바뀔 때 설정한다.
 */
let currentUid = null;

export const setCloudUid = (uid) => {
  currentUid = uid;
};

export const cloudUid = () => currentUid;
