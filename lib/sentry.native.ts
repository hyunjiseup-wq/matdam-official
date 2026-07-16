// 에러 로깅 (Sentry, 체크리스트 F1) — 네이티브(iOS/Android) 구현
// JS 에러와 네이티브 크래시를 모두 수집한다. DSN 없으면 조용히 no-op.
// 소스맵 업로드용 expo 플러그인(@sentry/react-native/expo)은 계정·조직이
// 정해진 뒤 스토어 제출용 최종 빌드 때 추가한다.
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initErrorLogging() {
  if (!DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      environment: __DEV__ ? 'development' : 'production',
      // 무료 플랜 보호: 에러 수집만, 성능 트레이싱은 끔
      tracesSampleRate: 0,
    });
  } catch (e) {
    console.warn('[Sentry] init 실패:', e);
  }
}
