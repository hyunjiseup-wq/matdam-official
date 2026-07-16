// 에러 로깅 (Sentry, 체크리스트 F1) — 웹 구현 (네이티브는 sentry.native.ts)
// EXPO_PUBLIC_SENTRY_DSN이 설정된 경우에만 켜진다. 미설정이면 조용히 no-op —
// 계정·DSN을 만들기 전에도 앱 동작에는 영향이 없다.
import * as Sentry from '@sentry/browser';

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
