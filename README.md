# Asana Log 🌿

매일의 요가 수련을 기록하는 개인용 수련 일지 웹앱입니다.
기록은 항상 이 기기의 브라우저(localStorage)에 저장되고, 원하면 내 Google Drive의 파일 하나로 PC·휴대폰을 동기화할 수 있습니다.

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
| `src/storage/localData.js` | 이 기기 데이터 전체 읽기·쓰기, 삭제 표시(다른 기기에도 삭제가 전달되도록) |
| `src/storage/backupRepository.js` | 백업 파일 내보내기·가져오기(합치기) |
| `src/hooks/useRecords.js` | 저장소와 화면 상태를 연결하는 React 훅 |
| `src/utils/markdown.js` | 마크다운 파서(외부 라이브러리 없음), 목록 미리보기용 서식 제거 |
| `src/components/MarkdownEditor.jsx` | 서식 버튼·미리보기가 있는 마크다운 입력창 |
| `src/sync/config.js` | Google Drive 동기화 설정 (클라이언트 ID를 비우면 동기화 없이 기기 저장만) |
| `src/sync/syncEngine.js` | 동기화 엔진: 언제 내려받고·합치고·올릴지 |
| `src/sync/syncData.js` | 동기화 파일 형태와 합치기 규칙 |
| `src/sync/googleAuth.js` · `driveFile.js` | Google 계정 연결, Drive 파일 읽기·쓰기 |
| `src/hooks/useSync.js` | 화면에서 동기화 상태를 읽는 React 훅 |
| `src/firebase/` · `src/storage/legacyMigration.js` | 예전 방식(Firebase 계정)의 기록을 이 기기로 옮기기 전용 |
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
이렇게 추가한 자세는 이 브라우저에 저장되며(동기화를 켰다면 다른 기기에도 전달), 상세 페이지에서 수정·삭제할 수 있어요.

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

## 백업 (파일로 내보내기 / 가져오기)

기록 목록 오른쪽 위 ☁️ → **파일로 저장**을 누르면 기록·추가한 아사나·사진이 `asana-log-backup-날짜.json` 파일 하나로 저장됩니다.
**백업 파일 고르기**로 가져오면 지금 기록에 합쳐집니다(기존 기록은 지워지지 않고, 같은 기록은 더 최근에 수정된 쪽이 남음).

## PC · 휴대폰 동기화 (Google Drive)

기록은 항상 이 기기에 먼저 저장됩니다. ☁️ → **Google Drive 연결**을 누르면 내 드라이브에 `asana-log-sync.json` 파일이 만들어지고,
같은 Google 계정을 연결한 기기끼리 이 파일을 통해 기록이 맞춰집니다. 데이터는 내 기기와 내 드라이브에만 있습니다.

- 앱은 **자기가 만든 파일만** 읽고 쓸 수 있습니다(`drive.file` 권한). 드라이브의 다른 파일은 볼 수 없어요.
- 동기화하는 때: 앱을 열 때, 기록을 쓰거나 지운 직후, 앱으로 돌아올 때, 열어 둔 동안 1분마다.
- 합치기 규칙: 한쪽에만 있는 기록은 그대로, 같은 기록은 더 최근에 수정된 쪽, 지운 기록은 다른 기기에서도 지워짐.
- 동기화 파일은 백업 파일과 같은 형태라서 **백업 파일 고르기**로 그대로 가져올 수도 있어요. 이름을 바꾸거나 폴더로 옮겨도 됩니다.
- **연결은 약 1시간마다 만료됩니다.** 서버 없이 브라우저만으로 Google에 연결하는 방식의 제약이에요.
  만료되면 기록 목록에 안내가 뜨고, **다시 연결**을 누르면 Google에 잠깐 다녀온 뒤 밀린 내용이 동기화됩니다. 그동안 쓴 기록은 이 기기에 안전하게 있어요.
- 오프라인에서도 기록은 그대로 쓸 수 있고, 연결되면 이어서 동기화됩니다.

### Google Drive 동기화 설정 (처음 한 번)

[Google Cloud 콘솔](https://console.cloud.google.com/)에서 프로젝트 `asana-log-saichoi`를 고른 뒤:

1. **API 및 서비스 → 라이브러리 → Google Drive API → 사용**
2. **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID**(`src/sync/config.js`의 `GOOGLE_CLIENT_ID`와 같은 것)
   → **승인된 리디렉션 URI**에 앱을 여는 주소를 끝의 `/`까지 정확히 추가
   - `http://localhost:5173/` (개발 서버. 다른 포트로 열리면 그 포트도)
   - `https://saichoi.github.io/asana-log/` (배포 주소)
3. **OAuth 동의 화면(Google 인증 플랫폼)**
   - 데이터 액세스 → 범위에 `.../auth/drive.file` 추가
   - 대상 → 게시 상태가 "테스트"라면 테스트 사용자에 내 Google 계정 추가

> `npm run dev`가 보여 주는 `Network:` 주소(192.168.x.x)는 Google이 리디렉션 주소로 허용하지 않아서, 그 주소에서는 Drive 연결이 되지 않습니다. 휴대폰에서는 배포 주소로 접속해 연결하세요.

### 예전 방식(Firebase 계정)에서 옮기기

이전 버전은 Google 로그인 후 기록을 Firebase(Firestore)에 저장했습니다. 지금은 쓰지 않습니다.

- 예전 방식으로 로그인되어 있던 기기는 새 버전을 처음 열 때 계정의 기록을 **자동으로 이 기기에 내려받습니다.**
- 그 밖의 기기는 ☁️ → **예전 계정에서 가져오기**로 가져올 수 있어요.
- Firestore에 있던 기록은 지워지지 않고 그대로 남습니다(프로젝트 `asana-log-saichoi`). 필요 없어지면 Firebase 콘솔에서 지우세요.
- 모든 기기에서 옮긴 뒤에는 `src/firebase/`, `src/storage/legacyMigration.js`, `firebase` 패키지, `firebase.json`·`firestore.rules`·`.firebaserc`를 지워도 됩니다.

## 나중에 서버 DB로 옮기려면

`src/storage/recordRepository.js`의 함수(`listRecords`, `createRecord`, `updateRecord`, `deleteRecord`)
내부만 API 호출로 바꾸면 됩니다. 모든 함수가 이미 Promise를 반환하므로 화면 코드는 수정할 필요가 없습니다.
기록 형태는 `src/models/record.js` 상단 주석을 참고하세요.
