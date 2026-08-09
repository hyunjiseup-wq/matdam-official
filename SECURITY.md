# 보안 점검 기록

## 의존성 감사 정책

CI는 `npm run audit:ci`로 high·critical 취약점을 차단합니다. 검사기는 `npm audit --json`의
전이 원인을 끝까지 추적하며, 아래에 정확한 advisory URL과 패키지명이 함께 등록된 경우만
임시 통과시킵니다. Moderate 이하도 정기적으로 검토하지만, 호환성을 깨뜨리는 자동 강제 수정은
적용하지 않습니다.

## 현재 알려진 예외

2026-08-01 기준 `npm audit`은 `uuid < 11.1.1`의 버퍼 경계 검사 문제를 moderate로 보고합니다.
현재 경로는 다음과 같습니다.

`expo-splash-screen → @expo/config-plugins → xcode@3.0.1 → uuid@7.0.3`

- 앱의 웹·네이티브 런타임 기능이 아니라 iOS 프로젝트 구성 도구 경로입니다.
- 현재 `xcode` 사용 코드는 취약점 대상인 v3/v5/v6 버퍼 입력이 아닌 `uuid.v4()`를 호출합니다.
- `npm audit fix --force`는 현재 Expo SDK 56 의존성 그래프를 구버전 Expo 메이저로 내리므로 적용하지 않습니다.
- `uuid@11` 강제 override도 `xcode`가 선언한 `^7.0.3` 범위를 벗어나므로 적용하지 않습니다.

Expo가 호환되는 `xcode`/`uuid` 조합을 배포하면 정상 업데이트로 제거해야 합니다.

2026-08-09 기준 다음 high 권고는 Metro의 빌드 도구 `image-size@1.2.1`에만 존재합니다.

- `GHSA-w3rx-r6r6-pgpr`: ICNS 파서 무한 루프
- `GHSA-5p2g-fcmc-qvqq`: JXL/HEIF 파서 무한 루프

현재 `metro@0.84.4`는 `image-size ^1.0.2`를 요구하지만 이 범위와 npm에 공개된 최신 버전에는
수정본이 없습니다. 이 코드는 앱 런타임이나 사용자 업로드 처리 경로가 아니라 저장소 자산을 읽는
빌드 경로이며, CI 예외는 위 두 URL과 `image-size` 패키지명이 모두 일치할 때만 허용합니다.
다른 high·critical 원인이 하나라도 추가되거나 원인을 추적할 수 없으면 CI는 실패합니다.

Expo/Metro가 호환되는 수정 버전을 제공하면 `scripts/dependency-audit.js`의 두 예외를 제거하고
일반 감사 차단으로 되돌려야 합니다. 같은 점검에서 호환 범위 내 패치가 있었던
`brace-expansion@5.0.9`, `nanoid@3.3.18`, `dompurify@3.4.13`은 즉시 반영했습니다.

## 장소 추출 API 보호

`/api/extract-place`는 다음 경계를 적용합니다.

- 클라이언트가 보낸 Supabase access token을 `/auth/v1/user`에서 원격 검증
- 검증된 사용자 ID 기준 인스턴스당 분당 10회 제한
- 허용된 지도 HTTPS 호스트만 접근하고 모든 리디렉션에서 DNS·사설망 주소 재검사
- JSON 본문 10KB, 외부 HTML 2MB, 리디렉션 5회, 외부 요청 타임아웃 제한
- 인증 응답과 추출 결과에 `Cache-Control: no-store` 적용

현재 속도 제한 저장소는 서버리스 인스턴스 메모리이므로 여러 인스턴스를 합친 전역 제한은 아닙니다.
트래픽이나 AI 비용이 증가하면 Vercel Firewall 또는 외부 원자적 저장소 기반 제한을 추가해야 합니다.
