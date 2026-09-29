# Asana Log 🌿

매일의 요가 수련을 기록하는 개인용 수련 일지 웹앱입니다.
서버·로그인 없이 브라우저(localStorage)에 기록이 저장됩니다.

## 실행 방법

```bash
npm install      # 처음 한 번
npm run dev      # 개발 서버 실행 → 터미널에 표시되는 주소로 접속
```

- `npm run dev`는 같은 Wi-Fi의 휴대폰에서도 접속할 수 있도록 `Network:` 주소를 함께 보여 줍니다.
- 배포용 빌드: `npm run build` → `dist/` 폴더 생성, `npm run preview`로 확인

## 휴대폰 홈 화면에 추가

- **iPhone**: Safari로 접속 → 공유 버튼 → **홈 화면에 추가**
- **Android**: Chrome으로 접속 → ⋮ 메뉴 → **홈 화면에 추가** (또는 **앱 설치**)

홈 화면 아이콘으로 열면 주소창 없이 앱처럼 전체 화면으로 열립니다.

## 폴더 구조

| 경로 | 역할 |
| --- | --- |
| `src/data/asanas.js` | **기본 아사나 목록**. 코드로 자세를 추가·수정하는 곳 |
| `src/data/poseFigures.js` | 기본 아사나의 **선 일러스트** 좌표 |
| `src/context/AsanaContext.jsx` | 기본 아사나 + 앱에서 추가한 아사나 + 사진을 합쳐 앱 전체에 제공 |
| `src/storage/asanaRepository.js` | 앱에서 추가한 아사나와 사진 저장 |
| `src/models/asana.js` | 추가하는 아사나의 구조와 입력값 검증 |
| `src/models/record.js` | 기록 데이터 구조, 입력 항목 정의, 입력값 검증, 정렬 |
| `src/storage/recordRepository.js` | 기록 저장/조회/수정/삭제 인터페이스 (화면은 이 파일만 사용) |
| `src/storage/localStorageAdapter.js` | 실제 localStorage 읽기·쓰기 |
| `src/hooks/useRecords.js` | 저장소와 화면 상태를 연결하는 React 훅 |
| `src/utils/markdown.js` | 마크다운 파서(외부 라이브러리 없음), 목록 미리보기용 서식 제거 |
| `src/components/MarkdownEditor.jsx` | 서식 버튼·미리보기가 있는 마크다운 입력창 |
| `src/firebase/config.js` | Firebase 연결 설정 (비워 두면 동기화 없이 기기 저장만) |
| `src/context/AuthContext.jsx` | Google 로그인, 로그인 시 기기 기록을 계정으로 옮기기 |
| `src/storage/cloudStore.js` | Firestore 읽기·쓰기·실시간 구독 |
| `src/storage/session.js` | 지금 저장 위치(기기 / 계정) 스위치 |
| `firestore.rules` | Firestore 보안 규칙 (본인 데이터만 읽고 쓰기) |
| `src/utils/search.js` | 한국어·영어·산스크리트어 통합 검색 |
| `src/utils/date.js` | 오늘 날짜, 한국어 날짜 표시 |
| `src/App.jsx` | 탭 전환, 목록/상세/작성 화면 이동 |
| `src/components/` | 화면 구성 요소 (목록, 카드, 상세, 작성 폼, 아사나 선택 시트, 사전, 하단 탭 등) |
| `public/manifest.webmanifest` | 홈 화면 설치 정보 (앱 이름, 색상, 아이콘) |
| `public/icons/icon.svg` | 앱 아이콘 원본 (PNG 아이콘은 이 파일로 만듦) |
| `src/styles.css` | 전체 스타일. 상단 `:root` 변수로 색상 변경 |

## 아사나 추가하기

### 방법 1. 앱에서 추가 (코드 수정 없이)

**아사나 사전 → `+ 새 자세`** 버튼을 누르고 이름·분류·설명·사진을 입력하세요.
이렇게 추가한 자세는 이 브라우저에 저장되며, 상세 페이지에서 수정·삭제할 수 있어요.

### 방법 2. 코드에 추가 (모든 기기에 기본으로 포함)

`src/data/asanas.js`의 `ASANAS` 배열에 한 줄을 추가하면 됩니다.

```js
{ id: 'side-plank', ko: '사이드 플랭크', en: 'Side Plank', sa: 'Vasisthasana', category: '균형' },
```

- `id`: 영어 소문자와 하이픈으로 된 고유 이름 (한 번 기록에 쓴 뒤에는 바꾸지 마세요)
- `category`: 같은 파일의 `CATEGORIES` 중 하나
- `aliases`(선택): 검색에 쓸 다른 이름. 예) `aliases: ['측면 플랭크']`
- 선 일러스트를 넣으려면 `src/data/poseFigures.js`에 같은 `id`로 좌표를 추가하세요(파일 상단 설명 참고).
  일러스트가 없어도 아사나 상세 페이지에서 **내 사진 올리기**로 이미지를 넣을 수 있어요.

> 사진은 자동으로 작게 줄여 브라우저에 저장합니다. 브라우저 저장 공간(보통 약 5MB)에 한계가 있어서 사진은 대략 수십 장 정도까지 올릴 수 있어요.

## 마크다운으로 기록하기

수업 내용·오늘의 도전·오늘의 변화·메모를 마크다운으로 쓸 수 있어요.
`## 제목`, `**굵게**`, `*기울임*`, `~~취소선~~`, `- 목록`, `1. 번호`, `- [ ] 체크리스트`, `> 인용`, `---`, `[링크](https://...)`를 지원하고,
입력창의 서식 버튼과 `?` 도움말, 미리보기 탭을 쓸 수 있어요. 목록에서 Enter를 누르면 다음 항목 기호가 자동으로 붙어요.

## PC · 휴대폰 동기화 (Firebase)

기록 목록 오른쪽 위 ☁️ → **Google로 로그인**하면 기록이 Firebase(Firestore)에 저장되고
로그인한 모든 기기에 실시간으로 반영됩니다. 로그인하지 않으면 지금처럼 이 기기에만 저장됩니다.

- 처음 로그인할 때 그 기기에 있던 기록은 계정으로 합쳐서 옮겨집니다.
- 오프라인에서 쓴 기록은 인터넷이 연결되면 자동으로 올라갑니다.
- Firebase 프로젝트: `asana-log-saichoi` (서울 리전, 무료 Spark 플랜)
- 보안 규칙 변경 후 적용: `firebase deploy --only firestore:rules`
- 새 주소에서 로그인하려면 Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해야 합니다.

## 나중에 서버 DB로 옮기려면

`src/storage/recordRepository.js`의 함수(`listRecords`, `createRecord`, `updateRecord`, `deleteRecord`)
내부만 API 호출로 바꾸면 됩니다. 모든 함수가 이미 Promise를 반환하므로 화면 코드는 수정할 필요가 없습니다.
기록 형태는 `src/models/record.js` 상단 주석을 참고하세요.
