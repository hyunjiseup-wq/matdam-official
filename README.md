# 🍽️ 서울 맛집 리스트

React Native(Expo)로 만든 **개인별 서울 맛집 리스트 공유 앱**입니다.
인플루언서/친구들이 각자 자기만의 맛집 리스트를 만들고, 서로의 리스트를 구경하며 맘에 드는 곳을 내 리스트로 담아올 수 있어요.

데이터는 **Supabase**(PostgreSQL)에 저장되고, 웹은 **Vercel**로 배포됩니다.

🔗 **데모:** https://2nd-app-green.vercel.app

---

## ✨ 주요 기능

### 계정 / 로그인
| 기능 | 설명 |
|---|---|
| 🆔 아이디 로그인 | 개인 이메일 대신 **아이디 + 비밀번호**로 가입 (내부적으로 `아이디@도메인` 이메일로 변환) |
| 👤 닉네임 & 로그아웃 | 가입 시 닉네임 설정, 헤더 왼쪽에 닉네임 + 로그아웃 |

### 내 맛집 리스트
| 기능 | 설명 |
|---|---|
| 📂 개인 리스트 | 사용자마다 자기만의 맛집 리스트 (추가·수정·삭제는 본인 것만) |
| ❤️ 가고싶음 / ✅ 방문함 | 위시리스트와 방문 기록이 완전히 독립, 따로 체크 |
| 🖼️ 음식 사진 | URL로 사진 추가 → 리스트 썸네일 + 상세 대표 이미지 |
| 🗺️ 주소 → 지도 | 주소를 탭하면 네이버/구글 지도 선택해서 열기 |
| 🔎 검색 & 필터 | 이름·지역·메모 검색 / 지역·카테고리·상태 필터 |

### 소셜 (둘러보기)
| 기능 | 설명 |
|---|---|
| 👀 둘러보기 | 다른 사용자들의 맛집 리스트 구경 |
| 📥 내 리스트에 담기 | 남의 맛집을 내 리스트로 복사 (가고싶음으로 저장) |
| ⭐ 리뷰 | 별점 + 후기 작성, 상세 화면에서 모두의 리뷰 확인 |

### 소통 / 관리
| 기능 | 설명 |
|---|---|
| 💬 피드백 | 헤더 말풍선 → 유형별(일반·기능요청·버그·정보수정) 전송 |
| 👑 관리자 모드 | 관리자만: 받은 피드백 모아보기 + 부적절한 리뷰 삭제, 공식 배지 |

---

## 🗂️ 프로젝트 구조

```
서울 맛집 리스트/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃 (인증 가드 + Provider)
│   ├── login.tsx            # 로그인 / 회원가입
│   ├── index.tsx            # 내 맛집 리스트 (홈)
│   ├── explore.tsx          # 둘러보기 (사용자 목록)
│   ├── form.tsx             # 추가 / 수정 폼
│   ├── feedback.tsx         # 피드백 보내기
│   ├── detail/[id].tsx      # 맛집 상세보기 (담기 / 리뷰)
│   ├── user/[id].tsx        # 다른 사용자의 리스트
│   ├── review/[id].tsx      # 리뷰 작성
│   └── admin/feedback.tsx   # 관리자: 받은 피드백
├── components/
│   ├── RestaurantCard.tsx   # 맛집 카드 (own/browse 모드)
│   ├── SearchBar.tsx
│   ├── FilterBar.tsx
│   └── EmptyState.tsx
├── context/
│   ├── AuthContext.tsx      # 인증 상태 + 관리자 판별
│   └── RestaurantContext.tsx # 맛집 / 리뷰 / 피드백 로직
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트
│   └── admin.ts             # 관리자 식별 + 아이디→이메일 변환
├── types/
│   └── restaurant.ts        # 타입 정의
├── constants/
│   └── filters.ts           # 필터 옵션 / 색상 / 지역 추론
├── supabase/
│   ├── schema.sql           # 초기 스키마
│   └── migration.sql        # 개인 리스트 모델 마이그레이션
└── seoul_restaurant_app_starter/
    └── restaurants_from_json.json  # 초기 시드 데이터 (311곳)
```

---

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 18 이상
- Supabase 프로젝트 (무료 플랜 가능)
- [Expo Go](https://expo.dev/go) 앱 (모바일 실행 시)

### 1) 의존성 설치
```bash
npm install
```

### 2) 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

### 3) Supabase 스키마 준비
Supabase 대시보드 → **SQL Editor** 에서 `supabase/migration.sql` 전체를 실행합니다.
(테이블: `seoul_restaurants`, `profiles`, `restaurant_reviews`, `app_feedback`)

또한 **Authentication → Sign In / Providers → Confirm email** 을 **OFF** 로 설정하면
이메일 인증 없이 바로 가입/로그인할 수 있습니다.

### 4) 실행
```bash
npm start        # Expo 개발 서버 (QR 스캔)
npm run web      # 웹 브라우저
npm run android  # Android 에뮬레이터
npm run ios      # iOS 시뮬레이터 (macOS)
```

---

## 🗃️ 데이터 모델

```typescript
interface Restaurant {
  id: string;            // 고유 ID
  owner_id: string;      // 소유자(사용자) ID
  name: string;          // 식당 이름 (필수)
  area?: string;         // 지역 (예: 성수, 홍대)
  category?: string;     // 카테고리 (예: 한식, 카페)
  address?: string;      // 주소
  naver_map_url?: string;// 네이버 지도 URL
  image_url?: string;    // 음식 사진 URL
  tags?: string[];       // 태그 배열
  memo?: string;         // 메모
  visited: boolean;      // 방문 여부 (소유자 기준)
  wishlist: boolean;     // 가고싶음 여부 (소유자 기준)
  priority: number;      // 우선순위 1-5
  created_at: string;
  updated_at: string;
}
```

주요 테이블
- `seoul_restaurants` — 맛집 (소유자별)
- `profiles` — 사용자 목록 (둘러보기용, `is_admin` 포함)
- `restaurant_reviews` — 리뷰 (별점 1-5 + 후기)
- `app_feedback` — 앱 피드백

---

## 🌱 초기 데이터

기존에 네이버 지도에 저장해 둔 맛집 목록을 `seoul_restaurant_app_starter/restaurants_from_json.json`(311곳)으로 받아 시드합니다.
**관리자**가 처음 로그인할 때 테이블이 비어 있으면 자동으로 시드되고, 주인 없는 항목은 관리자 소유로 귀속됩니다.

---

## 🛠️ 기술 스택

| 항목 | 내용 |
|---|---|
| Framework | React Native (Expo SDK 51) |
| Navigation | Expo Router (파일 기반 라우팅) |
| 백엔드 / DB | Supabase (PostgreSQL + Auth) |
| 인증 | Supabase Auth (아이디 기반) |
| 상태 관리 | React Context API + useState/useMemo |
| 배포 | Vercel (`expo export --platform web`) |
| 언어 | TypeScript |

---

## ☁️ 배포 (Vercel)

`vercel.json` 설정으로 자동 빌드됩니다.
```json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
GitHub `main` 브랜치에 push하면 Vercel이 자동 배포합니다.
환경 변수(`EXPO_PUBLIC_*`)는 빌드 시점에 주입되므로 Vercel 프로젝트 설정에 등록해야 합니다.
