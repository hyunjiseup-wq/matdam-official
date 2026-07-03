# 🍽️ 맛담

> 맛집을 담고, 친구와 나누는 공간 — 맛집을 '담다'

React Native(Expo)로 만든 **개인별 맛집 리스트 공유 앱**입니다.
인플루언서/친구들이 각자 자기만의 맛집 리스트를 만들고, 서로의 리스트를 구경하며 맘에 드는 곳을 내 리스트로 담아올 수 있어요.

데이터는 **Supabase**(PostgreSQL)에 저장되고, 웹은 **Vercel**로 배포됩니다.

🔗 **데모:** https://matdam-official.vercel.app

---

## 🎨 브랜드

- **이름:** 맛담 (맛집을 *담다* — 핵심 기능 '담기'와 연결)
- **슬로건:** 맛집을 담고, 친구와 나누는 공간
- **컬러:** 메인 `#FF7A45` (탠저린 오렌지) · 포인트 `#6C5CE7` (퍼플) · 보조 `#00B894` (그린)

---

## ✨ 주요 기능

### 화면 / 내비게이션
| 기능 | 설명 |
|---|---|
| 📱 하단 탭바 | **홈 · 전체 맛집 · ➕추가 · 둘러보기 · 마이** 한 손에 (가운데 ➕로 맛집 추가) |
| 📖 앱 사용법 가이드 | 마이 화면에서 진입하는 **기능별 사용 설명** 화면 |
| 🆕 첫 로그인 가이드 | 처음 로그인 시 가이드를 **1회 자동 노출** (사용자별 기록, 빈 홈에서도 "사용법 보기" 진입) |

### 계정 / 로그인
| 기능 | 설명 |
|---|---|
| 🆔 아이디 로그인 | 개인 이메일 대신 **아이디 + 비밀번호**로 가입 (내부적으로 `아이디@도메인` 이메일로 변환) |
| 👤 닉네임 & 로그아웃 | 가입 시 닉네임 설정, 헤더 왼쪽에 닉네임 + 로그아웃 |
| 📷 프로필 사진 | 마이에서 **아바타 사진 직접 업로드** → 둘러보기·리스트·피드 전역에 노출 |

### 내 맛집 리스트
| 기능 | 설명 |
|---|---|
| 📂 개인 리스트 | 사용자마다 자기만의 맛집 리스트 (추가·수정·삭제는 본인 것만) |
| ❤️ 가고싶음 / ✅ 방문함 | 위시리스트와 방문 기록이 완전히 독립, 따로 체크 |
| ✨ 지도 링크 자동 채우기 | **네이버·구글 지도 공유 링크**만 붙여넣으면 이름·주소·카테고리·사진을 자동 인식해 폼에 채움 → 사용자가 확인·수정 후 저장. 구글 링크도 **같은 가게를 네이버에서 찾아** 카테고리·사진·가격대·메뉴까지 보강 |
| 🍽️ 메뉴 자동 저장 | 링크 자동 채우기 시 **메뉴명·가격·메뉴 사진**(최대 20개)을 함께 저장 → 상세 화면에 메뉴 리스트 표시 (6개 초과 시 더 보기) |
| 📍 관심 지역 추천 | 프로필에 **관심 지역**(여행지·동네, 쉼표로 여러 곳) 설정 → 홈 상단에 그 지역 **추천 맛집 가로 피드** (전체 사용자 맛집 중 인기순, 내 리스트 제외) |
| 📷 음식 사진 | **사진 직접 업로드**(Supabase Storage) 또는 URL → 썸네일 + 대표 이미지 |
| 🖼️ 대표 사진 자동 연동 | 기존 등록 맛집 **300곳+에 구글 Places 실제 가게 사진** 자동 연동 (백필 스크립트) |
| 💰 가격대 | **1인 기준 4단계**(만원 이하/1~2만원/2~4만원/4만원 이상) — 폼에서 선택 or **네이버 메뉴 가격으로 자동 추정**, 카드·상세·전체 맛집에 배지 표시 |
| 🗺️ 지도 출처 | **네이버/구글 선택** → 카드·상세에 N/G 배지, 출처에 맞는 지도로 열기 |
| 📍 지역 계층 필터 | **전체 → 시/도 → 구** 단계 선택 (전국 확장 대비, 주소 자동 파싱) |
| 🔎 검색 & 필터 | 이름·지역·메모·주소 검색 / 카테고리·상태 필터 |

### 소셜 (둘러보기)
| 기능 | 설명 |
|---|---|
| 🍽️ 전체 맛집 둘러보기 | 모든 사용자의 맛집을 **한 피드**로 통합, **큰 사진 카드** + **인기순·별점순·방문순** 정렬 |
| 📍 전체 맛집 지역·카테고리 필터 | 전체 맛집 피드에 **시/도 → 구** 지역 탭 + **카테고리 칩** (데이터에 있는 것만 자동 등장) |
| 🗂️ 사용자 리스트 필터 | 다른 사람 리스트에서도 **지역(시/도→구)·카테고리**로 골라보기 |
| 👥 중복 TOP 3 | 같은 맛집(이름+지역)을 담은 사용자 수 표시 + **인기순 상위 3명** → 클릭 시 그 사람 리스트로 |
| 🔖 담기(북마크) | 전체 맛집 카드에서 바로 내 리스트에 담기 |
| 🔍 통합 검색 | 맛집명·지역과 **사용자**를 한 번에 검색 |
| 📊 인플루언서 지표 | 프로필에 **"내 맛집을 N명이 담아감"** + 가장 많이 담긴 내 맛집 TOP 5 |
| 👀 사용자 둘러보기 | 다른 사용자들의 리스트 구경 (**인기순 정렬**, 카드에 SNS 노출) |
| 👍 좋아요 + 인기순 | 리스트에 좋아요 → **좋아요·조회수 많은 리스트가 상위로** |
| 📥 내 리스트에 담기 | 남의 맛집을 내 리스트로 복사 (가고싶음으로 저장) |
| ⭐ 리뷰 | 별점 + 후기 작성, 상세 화면에서 모두의 리뷰 확인 |
| 👤 프로필 | 닉네임·**소개·SNS 링크** 편집 → 둘러보기/리스트 화면에 노출, 클릭 시 이동 |
| 🔗 리스트 공유 | 공유 버튼 (웹: 링크 복사 / 모바일: 공유 시트) |

### 소통 / 관리
| 기능 | 설명 |
|---|---|
| 💬 피드백 | 유형별(일반·기능요청·버그·정보수정) 전송, **전송 완료 화면**으로 중복 방지 |
| 🧵 피드백 답글 | 관리자 ↔ 작성자 **1:1 비공개 대화** (다른 사용자는 못 봄) |
| 👑 관리자 모드 | 받은 피드백 모아보기 + 답글 + **처리완료/보관/삭제** + 리뷰 삭제, 공식 배지 |

---

## 🗂️ 프로젝트 구조

```
맛담/
├── app/
│   ├── _layout.tsx              # 루트 레이아웃 (인증 가드 + Provider)
│   ├── login.tsx                # 로그인 / 회원가입 (아이디 기반)
│   ├── index.tsx                # 내 맛집 리스트 (홈)
│   ├── discover.tsx             # 전체 맛집 통합 피드 (인기·별점·방문순, 중복 TOP3, 통합검색)
│   ├── explore.tsx              # 둘러보기 (사용자 목록, 인기순)
│   ├── profile.tsx              # 내 프로필 편집 (사진·소개·SNS, 내 영향력, 가이드 진입)
│   ├── guide.tsx                # 앱 사용법 가이드
│   ├── form.tsx                 # 추가 / 수정 폼 (지도출처·사진업로드)
│   ├── feedback.tsx             # 피드백 보내기
│   ├── my-feedback.tsx          # 내가 보낸 피드백 / 답변
│   ├── detail/[id].tsx          # 맛집 상세보기 (담기 / 리뷰)
│   ├── user/[id].tsx            # 다른 사용자의 리스트 (좋아요·공유)
│   ├── review/[id].tsx          # 리뷰 작성
│   ├── feedback-thread/[id].tsx # 피드백 1:1 대화
│   └── admin/feedback.tsx       # 관리자: 받은 피드백 관리
├── components/                  # RestaurantCard / BottomTabBar / Avatar / SearchBar / FilterBar
├── context/
│   ├── AuthContext.tsx          # 인증 상태 + 관리자 판별
│   └── RestaurantContext.tsx    # 맛집 / 리뷰 / 피드백 / 좋아요 / 프로필 로직
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── admin.ts                 # 관리자 식별 + 아이디→이메일 변환
│   └── confirm.ts               # 웹 호환 확인/알림 헬퍼
├── types/restaurant.ts          # 타입 정의
├── constants/filters.ts         # 카테고리 / 색상 / 지역(시도·구) 추론
├── supabase/
│   ├── schema.sql               # 초기 스키마
│   ├── migration.sql            # 개인 리스트 모델 마이그레이션
│   ├── migration2.sql           # 지도출처·좋아요·프로필·피드백답글·Storage
│   └── migration3.sql           # 프로필 사진(avatar_url)
├── scripts/
│   └── backfill-photos.mjs      # 대표 사진 백필 (구글 Places → Storage)
└── seoul_restaurant_app_starter/restaurants_from_json.json  # 시드 데이터 (311곳)
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

**지도 링크 자동 채우기(선택)** — 서버리스 함수 `api/extract-place.js` 가 사용합니다.
Vercel 대시보드 → **Settings → Environment Variables** 에 추가:
```
ANTHROPIC_API_KEY=<your-anthropic-key>
```
- 키가 **있으면**: Claude(Haiku)가 이름·주소·카테고리·사진을 정확히 구조화
- 키가 **없으면**: og태그만으로 이름·사진 위주로 채우는 fallback 동작 (여전히 작동)
- 네이티브 앱에서 호출할 함수 주소를 바꾸려면 `EXPO_PUBLIC_API_BASE` 로 지정 (기본값: 프로덕션 URL)

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

### 📸 대표 사진 백필

사진이 없는 맛집(`image_url IS NULL`)에 **구글 Places(신규) API**로 실제 가게 사진을 한 번에 채웁니다.
검색된 사진은 Supabase Storage(`restaurant-photos/google/<id>`)에 저장되고 `image_url`이 공개 URL로 업데이트됩니다.

```bash
# PowerShell — 값은 작은따옴표로 감싸기
$env:SUPABASE_URL='https://<project>.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='<service_role 키>'   # 1회용, 절대 커밋 금지
$env:GOOGLE_API_KEY='<구글 Places API 키>'
node scripts/backfill-photos.mjs        # 사진 없는 곳만 처리 (재실행 안전)
node scripts/backfill-photos.mjs 10     # 앞 10곳만 테스트
```

> 312곳 중 **303곳**에 실제 사진 적용 완료. 구글에 등록되지 않은 9곳만 미적용.
> `image_url`이 비어 있는 항목만 대상이라 재실행해도 기존 사진을 덮어쓰지 않습니다.
> ⚠️ `service_role` 키는 RLS를 우회하므로 **1회용 로컬 실행 전용**이며, 사용 후 재발급을 권장합니다.

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
