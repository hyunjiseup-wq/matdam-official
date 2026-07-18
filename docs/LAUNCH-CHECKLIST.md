# 맛담 출시 체크리스트 (전체)

> 2026-07-05 최종 재검토 기준. 계획서(맛담 앱 출시 계획서.pdf) 대비 코드 실사 결과 반영.
> 계획서 수정사항: Capacitor → **Expo EAS Build** (앱이 이미 Expo/RN), 아래 신규 발견 항목 추가.

## A. 법적/정책 (출시 여부와 무관하게 필수)
- [x] A1. 개인정보처리방침 (수집항목·목적·위탁(Supabase/Vercel)·보관/삭제·권리) — `/policy/privacy` 배포 완료
- [x] A2. 이용약관 (UGC 권리/책임, 금지행위, 제재 기준, 광고/협찬 표시) — `/policy/terms` 배포 완료
- [x] A3. 위치정보 이용 동의 문구 (가까운순·지도 — 기기 위치는 서버 저장 안 함) — 방침 3조 + 가입 동의 고지
- [x] A4. 위치기반서비스사업 신고 검토 완료 — **현재 구조는 신고 대상 아님** (기기 위치는 단말기 내 처리만, 서버 전송 없음 + POI 좌표는 개인위치정보 아님). 상세·재검토 트리거·소상공인 특례 절차: `docs/A4-위치기반서비스-신고-검토.md` (2026-07-17). ⚠️ 서버측 주변검색·위치공유·지오펜싱 푸시 추가 시 신고 필요
- [ ] A5. 고객지원 이메일 확정 (스토어·정책 문서 공용)

## B. 심사 필수 기능 (UGC 앱 요건)
- [x] B1. 계정 삭제 — `delete_my_account` RPC(migration11) + 마이 화면 버튼, 실계정 테스트 통과
- [x] B2. 콘텐츠 신고 — reports 테이블(migration12) + 맛집/리뷰/리스트 신고 모달, RLS 검증 통과
- [x] B3. 사용자 차단 — blocked_users + 피드·리뷰·둘러보기 필터링 + 마이 화면 차단 관리(해제)
- [x] B4. 관리자 신고 처리 화면 — /admin/reports (처리/기각/다시 열기, 신고 리뷰 즉시 삭제)
- [x] B5. 금칙어 필터 — lib/moderation.ts, 닉네임·리뷰·메모·소개·피드백 저장 경로에 적용

## C. 네이티브 앱 전환 (Expo EAS)
- [x] C1. Expo SDK 51 → 56 업그레이드 (RN 0.85·React 19·TS 6.0, Play API 35 충족) — tsc·export·브라우저 스모크 통과
- [x] C2. 번들 ID `com.matdam.app` + scheme `matdam` (app.json) — 스토어 제출 전까지는 변경 가능
- [x] C3. 앱 아이콘·스플래시·adaptiveIcon — "핀 속 밥그릇" 마크 확정, assets/ 4종(1024 아이콘·adaptive 전경·스플래시 로고·웹 파비콘) + expo-splash-screen 플러그인 설정
- [x] C4. 네이티브 지도 — components/RestaurantMap 플랫폼 분리 (웹 Leaflet 유지 + 네이티브 react-native-maps, 마커·콜아웃·내위치). ⚠️ **Android 빌드 전 Google Maps API 키 필요** (app.json android.config.googleMaps.apiKey)
- [x] C5. 위치 — lib/geo.ts (웹 geolocation / 네이티브 expo-location 공용), 가까운순 연결 + 한국어 권한 문구 플러그인
- [x] C6. 공유 — 이미 크로스플랫폼 (네이티브 RN Share 시트 / 웹 클립보드), 코드 확인 완료
- [x] C7. 푸시 알림 — 클라이언트 토큰 등록(lib/push.ts) + push_tokens 테이블(migration15) + DB 트리거→Expo 푸시 API 직접 발송(migration16: 담김·피드백 답변 알림). 서버 파이프라인 실검증 완료(Expo HTTP 200 응답). ⚠️ **잔여: Android FCM(Firebase) 설정 + 실기기 수신 확인 — 스토어 제출용 최종 빌드 때 함께 진행** (푸시 실패해도 앱은 정상 동작)
- [ ] C8. 딥링크 라우팅 검증 (matdam:// → 상세/리스트) — 스킴 설정 완료, 실기기 빌드에서 검증
- [x] C9. EAS 빌드 — 프로젝트 연결(@halle1027/seoul-restaurant-list), 키스토어 EAS 자동 관리, GOOGLE_MAPS_API_KEY 환경변수(sensitive) 주입, 첫 preview APK 빌드 성공 (SDK 56, 2026-07-06)

## D. 스토어 제출 준비물
- [ ] D1. Google Play Console 계정 + Data safety form
- [ ] D2. Apple Developer 계정 + App Store Connect 메타데이터
- [ ] D3. 스크린샷 세트 (iPhone/Android 주요 해상도)
- [ ] D4. 심사용 데모 계정
- [ ] D5. Play 비공개 테스트 (12명 × 14일) 운영
- [ ] D6. TestFlight 베타

## E. 보안·남용 방지
- [x] E1. /api/extract-place rate limit(IP당 분당 10회) + CORS 자사 도메인 제한 + 내부망 링크 차단(SSRF)
- [x] E2. 이미지 업로드 제한 — 버킷 5MB·이미지 MIME 만(migration13) + 클라이언트 리사이즈(긴 변 1600px·아바타 512px, JPEG 변환)
- [x] E3. Captcha 검토 완료 — **출시 초기 보류** 결정. 비번 정책+가입 rate limit 이 1차 방어. 봇 가입 징후 보이면 Cloudflare Turnstile 발급 → 대시보드 Attack Protection 켜기 → signUp/signIn 에 captchaToken 연동 (코드 반나절)
- [x] E4. 이메일 등록 + 비밀번호 재설정 — 마이 탭 로그인·보안 카드(이메일 등록·비번 변경), /forgot-password·/reset-password, 로그인 화면 이메일 겸용. **사용자: 대시보드 2건 필요 — Auth→Email "Secure email change" OFF, Auth→URL Configuration에 Site URL·/reset-password 등록**
- [x] E5. 비밀번호 정책 서버 강제 확인 — 8자 미만·숫자만·문자만 모두 거부됨 (실가입 테스트)

## F. 운영/안정성
- [x] F1. 에러 로깅(Sentry) — 가동 중: lib/sentry 플랫폼 분리(웹 @sentry/browser, 네이티브 @sentry/react-native). DSN 3곳 등록 완료(로컬 .env·Vercel prod/preview/dev·EAS preview/production/development, 2026-07-17). 웹 프로덕션에서 실제 이벤트 전송 검증. 네이티브는 다음 EAS 빌드부터 포함. 스토어 제출용 최종 빌드 전 소스맵 플러그인(@sentry/react-native/expo) 추가 예정
- [ ] F2. 업타임 모니터링 + Vercel/Supabase 사용량 알림
- [ ] F3. DB 백업 — 주간 암호화 덤프 워크플로 준비 완료(.github/workflows/db-backup.yml, docs/BACKUP.md). **사용자: 저장소 시크릿 2개(SUPABASE_DB_URL·BACKUP_PASSPHRASE) 등록하면 활성화**
- [x] F4. 조회 인덱스 8종 추가(migration14) — 리뷰·피드백·좋아요·신고·차단·컬렉션 경로. 텍스트/좌표 인덱스는 서버측 검색 도입 시(현재 전부 클라이언트 필터링)
- [ ] F5. OSM 타일 → 상용 타일(MapTiler 등) 전환 (1만 MAU 전)
- [x] F6. Nominatim 대응 — 역지오코딩 결과 24h 캐시(좌표 4자리 반올림) + 인스턴스당 1req/s 간격. 호출 자체가 구글 링크 붙여넣기 때만 발생해 저볼륨

## G. 측정 (KPI)
- [x] G1. 분석(PostHog) — **가동 중**: lib/analytics 플랫폼 분리(웹 posthog-js, 네이티브 posthog-react-native). 이벤트: 회원가입·맛집 등록(입력방식별)·맛집 담기·리스트 공유 + 웹 페이지뷰 자동 수집. 로그인 시 uid로 identify(개인정보 미전송)·로그아웃 시 reset. Project API Key 3곳 등록 완료(로컬 .env·Vercel prod/preview/dev·EAS preview/production/development, 2026-07-17), 웹 프로덕션 실전송 검증(이벤트 POST 200). 네이티브는 다음 EAS 빌드부터 포함. 참고: PostHog는 헤드리스 브라우저를 기본 차단 → 스모크 테스트 방문은 지표에 안 잡힘
- [x] G2. 공유 링크 클릭 측정 — 공유 URL에 ?src=share 표식 추가, PostHog 페이지뷰로 유입 구분 (별도 단축링크 도입은 백로그)

## H. 콘텐츠/마케팅
- [x] H1. 랜딩페이지 — /welcome (웹에서 로그아웃 상태로 루트 접속 시 표시): 3초 등록 자동 순환 데모 + 기능 소개 4종 + 앱 설치 안내(스토어 준비 중 배지) + 정책 링크 푸터. 프로덕션 스모크 9/9 확인. **스토어 출시 후 설치 배지에 실제 링크 연결**
- [x] H2. 공유 OG 미리보기 — 브랜드 OG 카드 1200×630(public/og-image.png) + og/twitter/description 메타 주입(scripts/inject-og.js, vercel.json buildCommand 후처리) + iOS 홈화면 아이콘. 카톡·인스타·페북·X 공유 카드 표시 (2026-07-18). 경로별 개별 OG는 SSR 필요 → 백로그
- [x] H3. "골목 노포" 컬렉션 채우기 — **17곳 등록 완료** (2026-07-17): 이문설렁탕(1904)·우래옥·하동관·용금옥·청진옥·부민옥·남포면옥·조선옥·열차집·문화옥·잼배옥·오장동흥남집·진주회관·을밀대·역전회관·태조감자국·마포옥. 전부 네이버 실재 검증(주소·좌표·지도링크), 한 줄 소개·태그·가격대 포함, 프로덕션 화면 표시 확인. ⚠️ 대표 사진은 구글 클라우드에서 Places API(New) 활성화 후 백필 가능. 지역 컬렉션 확대는 백로그
- [ ] H4. app-ads.txt 정적 배포 체계 (AdMob 시점)

## I. 수익화 준비 (지표 검증 후)
- [ ] I1. 광고주 제안서 1장
- [ ] I2. 스폰서 노출 "광고" 라벨 규격
- [ ] I3. 프리미엄/인앱 결제 (스토어 결제 규정 준수)

## J. 리스크 (작업 아님, 인지)
- J1. 네이버 페이지 파싱 약관 리스크 — 장기적으로 공식 API 전환 검토
- J2. 디지털 상품 판매 시 인앱 결제 의무 (Play/App Store)
