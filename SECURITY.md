# 보안 점검 기록

## 의존성 감사 정책

CI는 `npm audit --audit-level=high`로 high·critical 취약점을 차단합니다. Moderate 이하도
정기적으로 검토하지만, 호환성을 깨뜨리는 자동 강제 수정은 적용하지 않습니다.

## 현재 알려진 예외

2026-08-01 기준 `npm audit`은 `uuid < 11.1.1`의 버퍼 경계 검사 문제를 moderate로 보고합니다.
현재 경로는 다음과 같습니다.

`expo-splash-screen → @expo/config-plugins → xcode@3.0.1 → uuid@7.0.3`

- 앱의 웹·네이티브 런타임 기능이 아니라 iOS 프로젝트 구성 도구 경로입니다.
- 현재 `xcode` 사용 코드는 취약점 대상인 v3/v5/v6 버퍼 입력이 아닌 `uuid.v4()`를 호출합니다.
- `npm audit fix --force`는 현재 Expo SDK 56 의존성 그래프를 구버전 Expo 메이저로 내리므로 적용하지 않습니다.
- `uuid@11` 강제 override도 `xcode`가 선언한 `^7.0.3` 범위를 벗어나므로 적용하지 않습니다.

Expo가 호환되는 `xcode`/`uuid` 조합을 배포하면 정상 업데이트로 제거해야 합니다.

## 장소 추출 API 보호

`/api/extract-place`는 다음 경계를 적용합니다.

- 클라이언트가 보낸 Supabase access token을 `/auth/v1/user`에서 원격 검증
- 검증된 사용자 ID 기준 인스턴스당 분당 10회 제한
- 허용된 지도 HTTPS 호스트만 접근하고 모든 리디렉션에서 DNS·사설망 주소 재검사
- JSON 본문 10KB, 외부 HTML 2MB, 리디렉션 5회, 외부 요청 타임아웃 제한
- 인증 응답과 추출 결과에 `Cache-Control: no-store` 적용

현재 속도 제한 저장소는 서버리스 인스턴스 메모리이므로 여러 인스턴스를 합친 전역 제한은 아닙니다.
트래픽이나 AI 비용이 증가하면 Vercel Firewall 또는 외부 원자적 저장소 기반 제한을 추가해야 합니다.
