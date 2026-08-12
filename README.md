# 맛담

지도 링크로 맛집을 저장하고 다른 사용자의 리스트를 둘러보며 내 리스트에 담을 수 있는 Expo 앱입니다. 웹, Android, iOS를 하나의 React Native 코드베이스로 운영합니다.

- 웹 운영 주소: https://matdam-official.vercel.app
- 웹 호스팅/API: Vercel
- 데이터베이스·인증·사진 저장소: Supabase
- 모바일 빌드: Expo Application Services(EAS)

## 현재 기술 구성

| 영역 | 현재 구성 |
|---|---|
| 앱 | Expo SDK 56, React Native 0.85, React 19, TypeScript 6 |
| 라우팅 | Expo Router 56 |
| 백엔드 | Supabase PostgreSQL, Auth, Storage, RLS/RPC |
| 웹 | Expo Metro 정적 export + Vercel Function |
| 지도 | 웹 Leaflet/OpenStreetMap, 네이티브 react-native-maps |
| 관측 | Sentry·PostHog 선택 활성화 |
| CI | GitHub Actions: 타입·회귀·웹 빌드·런타임·의존성 감사 |
| 백업 | 매주 암호화된 Supabase `public` 논리 덤프(설정된 경우) |

지원 Node.js는 `>=22 <25`이며 EAS 빌드는 Node.js `22.14.0`으로 고정합니다.

## 주요 기능

- 아이디와 비밀번호 기반 Supabase Auth 로그인, 비밀번호 재설정, 계정 삭제
- 사용자별 맛집 추가·수정·삭제, 방문함·가고싶음 분리
- 네이버·구글 지도 링크의 장소 정보 자동 추출
- 사진, 가격대, 메뉴, 지도 출처, 위치 좌표 저장
- 전체 맛집 피드, 지역·카테고리 필터, 가까운순 정렬, 지도 보기
- 사용자 디렉터리 인기순 정렬 및 30명 단위 무한 스크롤(RPC 적용 시 키셋 방식)
- 리스트 좋아요, 프로필 조회수, 리뷰, 다른 사용자 맛집 담기
- 테마 컬렉션, 신고·차단, 관리자 신고/피드백 처리
- 관심 지역 추천, 리스트 공유, 푸시 알림

사용자 디렉터리·프로필 요약·전체 맛집 피드는 클라이언트 전체 집계 대신 PostgreSQL RPC를 우선 사용합니다. 마이그레이션 미적용 환경에서는 기존 쿼리로 폴백합니다.

## 프로젝트 구조

```text
.
├─ app/                       Expo Router 화면과 정책 페이지
│  ├─ admin/                  신고·피드백 관리자 화면
│  ├─ collection/             테마 컬렉션 상세
│  ├─ detail/                 맛집 상세
│  ├─ policy/                 이용약관·개인정보처리방침
│  ├─ review/                 리뷰 작성
│  └─ user/                   사용자별 맛집 목록
├─ api/extract-place.js       인증된 지도 링크 추출 Vercel Function
├─ components/                공용 카드·지도·필터·상태 컴포넌트
├─ constants/                 카테고리·지역 추론 상수
├─ context/                   Auth/Restaurant 상태와 Supabase 호출
├─ lib/                       Supabase, 분석, 오류 수집, 위치, 이미지 유틸리티
├─ scripts/                   회귀 검사·웹 스모크·의존성 감사·사진 백필
├─ supabase/
│  ├─ migrations/             신규 표준 타임스탬프 마이그레이션
│  ├─ migration*.sql          운영 이력 보존용 레거시 SQL
│  └─ config.toml             Supabase CLI 로컬 구성
├─ .github/workflows/
│  ├─ quality.yml             PR/main/주간 품질·보안 검사
│  └─ db-backup.yml           주간 암호화 논리 백업
├─ app.json / app.config.js   Expo 및 네이티브 지도 설정
├─ eas.json                   개발·Preview·Production 모바일 빌드 프로필
└─ vercel.json                웹 빌드, Function, 보안 헤더, SPA rewrite
```

## 로컬 실행

### 1. 요구사항

- Node.js 22~24
- npm과 Chrome 또는 Chromium
- 연결할 Supabase 프로젝트
- 모바일 실기기 실행 시 Expo Go 또는 개발 빌드

### 2. 설치

```bash
npm ci
```

설치 스크립트는 `package.json`의 `allowScripts` 정책으로 제한합니다. 새 의존성을 추가하거나 버전을 변경하면 lockfile과 설치 스크립트 허용 범위를 함께 검토해야 합니다.

### 3. 환경 변수

`.env.example`을 `.env.local`로 복사하고 실제 값을 입력합니다.

```powershell
Copy-Item .env.example .env.local
```

클라이언트에 포함되는 공개 설정:

| 이름 | 필수 | 용도 |
|---|---:|---|
| `EXPO_PUBLIC_SUPABASE_URL` | 예 | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 예 | Supabase publishable/legacy anon 키 |
| `EXPO_PUBLIC_API_BASE` | 네이티브 빌드 | Vercel API 기준 주소 |
| `EXPO_PUBLIC_SITE_URL` | 웹 | 비밀번호 재설정 복귀 주소 |
| `EXPO_PUBLIC_SENTRY_DSN` | 아니오 | Sentry 오류 수집 |
| `EXPO_PUBLIC_POSTHOG_KEY` | 아니오 | PostHog 이벤트 수집 |
| `EXPO_PUBLIC_POSTHOG_HOST` | 아니오 | PostHog 수집 호스트 |

서버·빌드 전용 비밀값:

| 이름 | 필수 | 용도 |
|---|---:|---|
| `GOOGLE_MAPS_API_KEY` | Android 지도 빌드 | `app.config.js`가 네이티브 설정에 주입 |
| `ANTHROPIC_API_KEY` | 아니오 | 장소 추출 fallback 구조화 |
| `SUPABASE_URL` | 서버 권장 | 장소 추출 API의 Auth 검증 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 서버 권장 | 장소 추출 API의 Auth 검증 키 |

`EXPO_PUBLIC_` 접두사가 붙은 값은 앱 번들에 포함됩니다. `service_role`, DB 비밀번호, 백업 패스프레이즈 같은 비밀값에는 절대 사용하지 마세요.

### 4. 개발 서버

```bash
npm start
npm run web
npm run android
npm run ios
```

`npm run ios`는 macOS와 iOS 개발 환경이 필요합니다.

## 검사와 CI

로컬 전체 검사:

```bash
npm run check
npm run audit:ci
```

`npm run check`는 다음을 순서대로 실행합니다.

1. TypeScript 검사
2. 장소 추출 API 보안 회귀 검사
3. Supabase 마이그레이션 보안 검사
4. 사용자 디렉터리 페이지네이션 검사
5. 의존성 감사 정책 및 구성 검사
6. Expo 웹 export와 라우트 번들 검사
7. Chrome/Chromium 웹 런타임 스모크 검사

GitHub Actions `quality.yml`은 pull request, `main` push, 매주 월요일 09:00 KST, 수동 실행에서 같은 검사와 high·critical 의존성 감사를 수행합니다. 임시 감사 예외와 만료일은 [SECURITY.md](SECURITY.md)에 기록합니다.

계정을 생성하는 통합 스모크 테스트는 명시적 변경 허용과 대상 URL이 있을 때만 실행합니다.

```powershell
$env:ALLOW_SMOKE_ACCOUNT_MUTATION='1'
$env:EXPO_PUBLIC_SUPABASE_URL='https://target.supabase.co'
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY='target-publishable-key'
node scripts/web-smoke.js http://localhost:8099
```

## Supabase 데이터베이스

현재 마이그레이션 체계는 두 부분으로 나뉩니다.

- `supabase/migration*.sql`, `schema.sql`: 기존 운영 DB에 수동 적용된 레거시 기록
- `supabase/migrations/`: 앞으로 적용할 표준 CLI 타임스탬프 마이그레이션

레거시 파일에는 최초 DB 전체 기준선이 없어 빈 프로젝트를 저장소만으로 완전히 재현할 수 없습니다. 운영 이력을 확인하지 않은 상태에서 레거시 SQL을 `supabase/migrations/`로 복사하거나 일부만 실행하면 안 됩니다.

현재 표준 마이그레이션:

| 파일 | 목적 | 운영 적용 상태 |
|---|---|---|
| `20260801074937_profile_view_rate_limit.sql` | 프로필 조회를 사용자·프로필당 하루 1회 원자적 집계 | 미적용 |
| `20260809083954_harden_rls_and_function_permissions.sql` | RLS initPlan·함수 권한·FK 인덱스·관리자 정책 보강 | 미적용 |
| `20260810231607_optimize_discover_queries.sql` | 사용자/프로필/맛집 피드 서버 집계와 키셋 커서 | 미적용 |

운영 적용 전에는 스테이징 또는 Supabase 개발 브랜치에서 SQL 파싱, RLS 역할별 결과, 쿼리 결과·성능을 확인해야 합니다. 상세 절차는 [Supabase 마이그레이션 가이드](docs/SUPABASE-MIGRATIONS.md)를 따릅니다.

핵심 공개 테이블은 `seoul_restaurants`, `profiles`, `list_likes`, `restaurant_reviews`, `collections`, `collection_items`, `reports`, `blocked_users`, `app_feedback`, `feedback_replies`입니다. 직접 접근 권한과 RLS 정책은 별개이므로 둘 다 검토해야 합니다.

## 장소 추출 API 보안

`POST /api/extract-place`는 Supabase access token이 있는 요청만 처리합니다.

- 허용된 네이버·구글 HTTPS 호스트만 접근
- 모든 redirect에서 DNS와 사설 IP를 다시 검사해 SSRF 차단
- 자사 Vercel 도메인과 localhost로 브라우저 CORS 제한
- JSON 10KB, HTML 2MB, redirect 5회, 외부 요청 timeout 제한
- 인증·추출 응답 `Cache-Control: no-store`
- 사용자별 인스턴스당 분당 10회 제한

현재 Rate Limit은 서버리스 인스턴스 메모리 기반이므로 전역 분산 제한이 아닙니다. 트래픽 또는 AI 비용이 증가하면 Vercel Firewall이나 원자적 외부 저장소 기반 제한으로 교체해야 합니다.

## 배포

### Vercel 웹

`vercel.json`은 `npm run build:web` 결과인 `dist/`를 배포하고, `/api/extract-place`를 Vercel Function으로 실행하며, SPA rewrite와 CSP/HSTS/클릭재킹 방지 헤더를 적용합니다.

- 기능 브랜치 push와 Draft PR: Preview 자동 배포
- `main` push: Vercel 프로젝트의 Production 배포 정책 적용
- Preview 검증 전 Production 승격 금지
- 로컬 또는 자동화에서 Production은 명시적 승인 없이 `--prod`, `promote`, merge 금지

Preview 수동 검증 예시:

```bash
npx vercel pull --yes --environment preview
npx vercel build
npm run test:web-runtime -- .vercel/output/static
npx vercel deploy --prebuilt
```

### EAS 모바일

`eas.json`에는 `development`, `preview`, `preview-ios-sim`, `production` 프로필이 있습니다. Production 빌드/제출은 버전·스토어 정보·환경 변수를 확인하고 별도 승인 후 수행합니다.

## 백업과 복구 범위

`.github/workflows/db-backup.yml`은 `SUPABASE_DB_URL`과 `BACKUP_PASSPHRASE` 저장소 시크릿이 모두 있을 때 매주 월요일 03:00 KST에 `public` 스키마와 데이터를 덤프하고 AES-256-CBC로 암호화해 90일 보관합니다. 시크릿이 없으면 백업 비활성 상태를 숨기지 않도록 워크플로가 실패합니다.

이 백업에는 `auth`, Storage 객체, 확장 관리 스키마와 Supabase 프로젝트 설정이 포함되지 않습니다. 전체 재해 복구 방법과 복원 순서는 [백업 가이드](docs/BACKUP.md)를 참고하세요.

## 현재 운영 경계와 남은 작업

- Production 배포와 운영 Supabase 마이그레이션은 검증·승인 후 별도로 수행
- 새 RPC는 개발 DB가 없어 현재 정적 검사와 클라이언트 폴백까지만 검증됨
- 전체 맛집 피드는 서버 집계를 사용하지만 앱 검색·필터는 현재 최대 500개 결과 안에서 수행
- 사용자 디렉터리는 페이지당 30명을 표시하며, 표준 RPC 적용 DB에서는 키셋 조회하고 미적용 DB에서는 레거시 전체 조회 후 페이지 폴백
- 운영 Supabase Advisor 경고는 미적용 보안 마이그레이션을 스테이징에서 검증한 뒤 해소 필요
- 장소 추출 API Rate Limit의 분산 저장소 전환 필요
- Supabase Auth 유출 비밀번호 차단 기능 활성화 검토
- 의존성 감사의 `image-size` 임시 예외는 2026-09-30 전에 재검토

## 관련 문서

- [출시 체크리스트](docs/LAUNCH-CHECKLIST.md)
- [스토어 제출 가이드](docs/STORE-SUBMISSION.md)
- [Supabase 마이그레이션 가이드](docs/SUPABASE-MIGRATIONS.md)
- [백업·복구 범위](docs/BACKUP.md)
- [보안 점검 기록](SECURITY.md)
- [서비스 소개](docs/ABOUT.md)
- [기능 목록](docs/FEATURES.md)
