// 사용 분석 (PostHog, 체크리스트 G1) — 웹 구현 (네이티브는 analytics.native.ts)
// EXPO_PUBLIC_POSTHOG_KEY가 설정된 경우에만 켜진다. 미설정이면 조용히 no-op —
// 계정·키를 만들기 전에도 앱 동작에는 영향이 없다.
import posthog from 'posthog-js';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let ready = false;

export function initAnalytics() {
  if (!KEY || ready) return;
  try {
    posthog.init(KEY, {
      api_host: HOST,
      defaults: '2025-05-24', // SPA 라우팅 페이지뷰 자동 수집 포함
    });
    ready = true;
  } catch (e) {
    console.warn('[Analytics] init 실패:', e);
  }
}

// 핵심 이벤트 기록 (가입·등록·담기·공유 등)
export function track(event: string, props?: Record<string, string | number | boolean>) {
  if (!ready) return;
  try {
    posthog.capture(event, props);
  } catch {
    // 분석 실패는 무시
  }
}

// 로그인 사용자 연결 — 개인정보는 넣지 않고 uid만 쓴다
export function identifyUser(userId: string) {
  if (!ready) return;
  try {
    posthog.identify(userId);
  } catch {
    // 무시
  }
}

// 로그아웃 시 익명 상태로 초기화
export function resetAnalytics() {
  if (!ready) return;
  try {
    posthog.reset();
  } catch {
    // 무시
  }
}
