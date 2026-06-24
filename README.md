# 🍽️ 서울 맛집 리스트

React Native(Expo)로 만든 서울 맛집 관리 앱입니다.  
AsyncStorage로 데이터를 로컬에 저장하고, Context API로 상태를 관리합니다.

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| 리스트 표시 | 우선순위 내림차순으로 맛집 목록 표시 |
| 검색 | 이름 / 지역 / 메모 키워드 검색 |
| 지역 필터 | 성수, 홍대, 을지로 등 |
| 카테고리 필터 | 한식, 일식, 카페, 술집 등 |
| 방문 필터 | 전체 / 방문함 / 가고싶음 |
| 추가 / 수정 / 삭제 | FAB(+) 버튼으로 추가, 상세 화면에서 수정·삭제 |
| 방문 토글 | 카드 버튼 또는 상세 화면에서 토글 |
| 상세보기 | 모든 정보를 보기 좋게 표시 |
| 네이버 지도 | 저장된 URL을 기본 브라우저로 오픈 |

---

## 프로젝트 구조

```
서울 맛집 리스트/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃 (Stack + Provider)
│   ├── index.tsx            # 메인 리스트 화면
│   ├── form.tsx             # 추가/수정 폼 화면
│   └── detail/
│       └── [id].tsx         # 상세보기 화면
├── components/
│   ├── RestaurantCard.tsx   # 맛집 카드 컴포넌트
│   ├── SearchBar.tsx        # 검색바
│   ├── FilterBar.tsx        # 지역/카테고리/방문 필터
│   └── EmptyState.tsx       # 빈 상태 표시
├── context/
│   └── RestaurantContext.tsx  # 전역 상태 관리
├── types/
│   └── restaurant.ts        # TypeScript 타입 정의
├── data/
│   └── restaurants_from_json.json  # 초기 시드 데이터
├── utils/
│   └── storage.ts           # AsyncStorage 헬퍼
├── constants/
│   └── filters.ts           # 필터 옵션 및 색상 상수
├── app.json
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 설치 및 실행

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- [Expo Go](https://expo.dev/go) 앱 (iOS / Android)
- 또는 Android Studio / Xcode (에뮬레이터 사용 시)

### 설치

```bash
# 프로젝트 디렉토리로 이동
cd "서울 맛집 리스트"

# 의존성 설치
npm install
```

### 실행

```bash
# Expo 개발 서버 시작
npm start
# 또는
npx expo start
```

터미널에 QR 코드가 표시되면:
- **iOS**: 카메라 앱으로 QR 스캔 → Expo Go에서 열기
- **Android**: Expo Go 앱 → "Scan QR code"

```bash
# Android 에뮬레이터
npm run android

# iOS 시뮬레이터 (macOS만 가능)
npm run ios

# 웹 브라우저
npm run web
```

---

## 데이터 모델

```typescript
interface Restaurant {
  id: string;           // 고유 ID
  name: string;         // 식당 이름 (필수)
  area?: string;        // 지역 (예: 성수, 홍대)
  category?: string;    // 카테고리 (예: 한식, 카페)
  address?: string;     // 주소
  naver_map_url?: string; // 네이버 지도 URL
  tags?: string[];      // 태그 배열
  memo?: string;        // 메모
  visited: boolean;     // 방문 여부
  priority: number;     // 우선순위 1-5
  created_at: string;   // 생성 시각 (ISO 8601)
  updated_at: string;   // 수정 시각 (ISO 8601)
}
```

---

## 초기 데이터

기존에 개인적으로 네이버 지도에 저장하였던 목록들을 `data/restaurants_from_json.json` 파일로 받아서 진행하였습니다.
`data/restaurants_from_json.json` 파일은 15개의 서울 맛집 샘플 데이터가 포함되어 있습니다.  
앱을 **처음 실행**할 때 자동으로 로드됩니다. 이후에는 AsyncStorage에 저장된 데이터를 사용합니다.

초기화하려면 앱 데이터를 삭제하거나 코드에서 `@seoul_restaurants_initialized` 키를 제거하세요.

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| Framework | React Native (Expo SDK 51) |
| Navigation | Expo Router (파일 기반 라우팅) |
| 상태 관리 | React Context API + useState/useMemo |
| 로컬 저장소 | AsyncStorage |
| UI | React Native 기본 컴포넌트 + @expo/vector-icons |
| 언어 | TypeScript |
