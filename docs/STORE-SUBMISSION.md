# 스토어 제출 자료 (D1·D2)

> 2026-07-19 작성. Google Play Console·Apple Developer 계정 개설 완료 후, 콘솔에 그대로 입력할 답안 모음.
> 데모 계정 자격증명은 `docs/DEMO-ACCOUNT.local.md`(로컬 전용, 레포 미포함) 참고.

## 1. 공통 앱 정보

| 항목 | 값 |
|---|---|
| 앱 이름 | 맛담 |
| 패키지/번들 ID | `com.matdam.app` |
| 버전 | 1.0.0 |
| 카테고리 | 음식 및 음료 (Food & Drink) |
| 지원 이메일 | matdamkr@naver.com |
| 웹사이트 | https://matdam-official.vercel.app |
| 개인정보처리방침 URL | https://matdam-official.vercel.app/policy/privacy |
| 이용약관 URL | https://matdam-official.vercel.app/policy/terms |
| 가격 | 무료 (인앱 결제 없음, 광고 없음 — 1.0 기준) |
| 로그인 | 필수 (아이디+비밀번호) → **심사용 데모 계정 제공** |

## 2. 스토어 등록 문구

### Google Play

- **앱 이름 (30자)**: `맛담 — 맛집을 담다`
- **짧은 설명 (80자)**: `링크 붙여넣기 3초 등록. 나만의 맛집 리스트를 만들고, 발견하고, 친구와 나누세요.`
- **자세한 설명 (4000자)**:

```
🍚 맛담 — 맛집을 담고, 친구와 나누는 공간

맛담은 나만의 맛집 리스트를 만들고, 다른 사람의 리스트를 구경하고,
마음에 드는 맛집을 한 번에 담아오는 맛집 아카이브 앱입니다.

✨ 등록이 3초면 끝나요
맛집 앱이 귀찮은 이유는 하나 — 입력이 번거로워서.
맛담은 네이버·구글 지도 공유 링크만 붙여넣으면 끝입니다.
• 이름·주소·카테고리·대표사진 자동 입력
• 메뉴판(사진·가격)과 1인 가격대까지 함께 저장
• 지도에 바로 표시되는 좌표까지 자동으로

📥 담기 한 번으로 내 리스트가 됩니다
전체 맛집 피드, 친구의 리스트, 테마 컬렉션 — 어디서든 마음에 드는 맛집을
발견하면 "담기" 버튼 하나로 내 리스트에 들어옵니다. 메뉴·가격대 정보까지 그대로.

🌍 발견하는 재미
• 전체 맛집 피드 — 모두의 맛집을 인기순·별점순·가까운순으로
• 맛집 지도 — 전국 맛집을 지도에서 한눈에
• 관심 지역 추천 — 여행지를 등록하면 홈에 그 지역 맛집이 떠요
• 테마 컬렉션 — "골목 노포", "지방 소도시 보석집" 같은 큐레이션

✅ 기록하는 재미
• 가고싶음 ❤️ / 방문함 ✅ 을 따로 체크
• 별점 우선순위, 태그, 메모
• 리뷰를 남기면 모두에게 평균 별점으로 보여요
• 내 영향력 — 내 맛집을 몇 명이 담아갔는지 확인

🏘️ 프랜차이즈와 핫플만 모아둔 앱이 아닙니다
골목 노포, 지방 소도시의 숨은 맛집까지 — 진짜 맛있는 곳의 다양성을 추구합니다.

문의: matdamkr@naver.com
```

### App Store (Apple)

- **이름 (30자)**: `맛담 — 맛집을 담다`
- **부제 (30자)**: `링크 붙여넣기 3초, 맛집 리스트 완성`
- **키워드 (100자)**: `맛집,맛집리스트,맛집지도,맛집기록,맛집공유,맛집추천,노포,로컬맛집,미식,푸드맵,먹킷리스트,레스토랑`
- **프로모션 텍스트 (170자)**: `네이버·구글 지도 링크만 붙여넣으면 이름·주소·사진·메뉴까지 자동 저장. 친구의 리스트에서 마음에 드는 맛집을 담기 한 번으로 가져오세요.`
- **설명**: Google Play 자세한 설명과 동일 (이모지 포함 그대로 사용 가능)

## 3. Google Play — Data safety form 답안

앱(Android 네이티브) 기준. 기기 밖(서버)으로 전송되는 데이터만 "수집"으로 신고한다.

### 수집하는 데이터

| 카테고리 > 항목 | 수집 | 필수/선택 | 목적 | 비고 |
|---|---|---|---|---|
| 개인 정보 > 이름 | ✅ | 필수 | 계정 관리, 앱 기능 | 닉네임 (실명 아님) |
| 개인 정보 > 이메일 주소 | ✅ | 선택 | 계정 관리 | 비밀번호 재설정용 실이메일 등록 시에만 |
| 앱 활동 > 기타 사용자 제작 콘텐츠 | ✅ | 선택 | 앱 기능 | 리뷰·메모·태그·프로필 소개 |
| 앱 활동 > 앱 상호작용 | ✅ | 필수 | 분석 | PostHog (가입·등록·담기·공유 이벤트) |
| 앱 정보 및 성능 > 비정상 종료 로그 | ✅ | 필수 | 분석 | Sentry |
| 앱 정보 및 성능 > 진단 | ✅ | 필수 | 분석 | Sentry |
| 기기 또는 기타 ID | ✅ | 필수 | 앱 기능, 분석 | Expo 푸시 토큰, 분석용 익명 ID |

### 수집하지 않는 데이터 (자주 헷갈리는 항목)

- **위치 (대략적·정확한 위치)**: ❌ 수집 안 함 — 위치 권한은 사용하지만 **기기 내 정렬·지도 표시에만 쓰고 서버로 전송하지 않음** (A4 검토와 동일 논리)
- **사진·동영상**: ❌ 수집 안 함 — 기기 사진 업로드는 웹 전용, 네이티브 앱은 URL 입력만. ⚠️ **추후 expo-image-picker 도입 시 이 신고를 "수집"으로 갱신할 것**
- 연락처, 메시지, 오디오, 건강, 재무 정보, 인앱 검색 기록(검색은 전부 클라이언트 필터링), 설치된 앱: ❌

### 공유·보안 문항

- 제3자와 데이터 **공유: 없음** — Supabase·Vercel·Sentry·PostHog는 개발자를 대신해 처리하는 서비스 제공업체(위탁)라 Google 기준 "공유" 아님
- 전송 중 암호화: **예** (전 구간 HTTPS)
- 삭제 요청 방법 제공: **예** — 인앱 계정 삭제(마이 탭) + 이메일 문의
- 데이터 수집이 앱 기능에 필수인가: 계정·콘텐츠는 필수, 이메일은 선택

### 기타 Play Console 신고

- 위치 권한: 포그라운드만 사용 (백그라운드 위치 ❌ → 별도 신고 대상 아님)
- 광고 ID: 사용 안 함 (광고 SDK 없음)
- 뉴스 앱 ❌ / 코로나19 앱 ❌ / 금융 앱 ❌
- 대상 연령: 만 13세 이상 권장 (아동 대상 아님)

## 4. App Store — App Privacy 답안

"Data Not Collected"가 아니라 아래 항목 신고. 위치·사진은 Google과 같은 이유로 미신고.

| Apple 카테고리 > 항목 | Linked to You | Tracking | 목적 |
|---|---|---|---|
| Contact Info > Name | ✅ | ❌ | App Functionality (닉네임) |
| Contact Info > Email Address | ✅ | ❌ | App Functionality (선택 등록) |
| User Content > Other User Content | ✅ | ❌ | App Functionality (리뷰·메모·프로필) |
| Identifiers > User ID | ✅ | ❌ | App Functionality, Analytics |
| Identifiers > Device ID | ✅ | ❌ | App Functionality (푸시 토큰) |
| Usage Data > Product Interaction | ✅ | ❌ | Analytics (PostHog, uid 연결) |
| Diagnostics > Crash Data | ❌ (Not Linked) | ❌ | App Functionality (Sentry) |

- **Tracking(ATT)**: 전 항목 ❌ — 타사 광고·데이터 브로커 없음 → ATT 팝업 불필요

## 5. 연령 등급 설문 가이드

### Google (IARC 설문)

- 폭력·성적 콘텐츠·욕설·약물·도박·공포: 전부 "아니오"
- **사용자 상호작용 기능: "예"** (UGC 공유·타 사용자 콘텐츠 열람)
  - 신고 기능 있음 ✅ (B2) / 차단 기능 있음 ✅ (B3) / 사전·사후 모더레이션 ✅ (B4·B5)
- 사용자 위치 공유: "아니오" (위치는 기기 내 처리만)
- 디지털 구매: "아니오"
- 예상 결과: 전체이용가 (3+/Everyone)

### Apple (연령 등급)

- 전 항목 "없음" → **4+** 예상
- "Unrestricted Web Access": 아니오 (외부 링크는 지도 앱 열기 수준)

## 6. 심사 노트 (Review Notes) 공통 문구

데모 계정 아이디·비밀번호는 `docs/DEMO-ACCOUNT.local.md`의 영문 문구를 복사해 입력.
추가로 아래 설명을 함께 넣으면 심사가 빨라진다:

```
This is a restaurant archiving app (UGC). Key flows to test:
1. Log in with the demo account (ID-based login, not email).
2. Home tab: the demo account has 6 saved restaurants, 2 marked as visited with reviews.
3. Paste a Naver/Google Maps share link in the "+" screen to auto-register a restaurant.
4. UGC safety: every restaurant/review has a report button; users can be blocked
   from their profile; account deletion is available in the My tab.
5. Location permission is optional and used only on-device for sorting/map display;
   device location is never sent to our servers.
```

## 7. 남은 콘솔 작업 순서

### Google Play Console (D1)

1. 앱 만들기 (한국어, 앱, 무료) → 대시보드 설정 과제 진행
2. 위 3번 Data safety + 5번 연령 등급 설문 입력
3. 스토어 등록정보(2번 문구) + 그래픽(아이콘 512px, 피처 그래픽 1024×500, 스크린샷 — **D3**)
4. 프로덕션 전 **비공개 테스트 트랙**에 EAS 빌드(AAB) 업로드 → 테스터 12명×14일 (**D5**, 개인 계정 신규 요건)
5. ⚠️ AAB 빌드 전: Android FCM 설정 + Google Maps API 키 주입 (C7·C4 잔여)

### App Store Connect (D2)

1. Certificates/Identifiers: `com.matdam.app` App ID 등록 (EAS가 자동 처리 가능)
2. 앱 등록 (이름 "맛담", 기본 언어 한국어)
3. 위 2번 문구 + 4번 App Privacy + 5번 연령 등급 입력
4. EAS 빌드(ipa) 업로드 → TestFlight (**D6**) → 심사 제출 (심사 노트에 6번 + 데모 계정)
