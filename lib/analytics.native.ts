// 사용 분석 (PostHog, 체크리스트 G1) — 네이티브(iOS/Android) 구현
// EXPO_PUBLIC_POSTHOG_KEY가 설정된 경우에만 켜진다. 미설정이면 조용히 no-op.
import PostHog from 'posthog-react-native';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let client: PostHog | null = null;

export function initAnalytics() {
  if (!KEY || client) return;
  try {
    client = new PostHog(KEY, { host: HOST });
  } catch (e) {
    console.warn('[Analytics] init 실패:', e);
  }
}

// 핵심 이벤트 기록 (가입·등록·담기·공유 등)
export function track(event: string, props?: Record<string, string | number | boolean>) {
  try {
    client?.capture(event, props);
  } catch {
    // 분석 실패는 무시
  }
}

// 로그인 사용자 연결 — 개인정보는 넣지 않고 uid만 쓴다
export function identifyUser(userId: string) {
  try {
    client?.identify(userId);
  } catch {
    // 무시
  }
}

// 로그아웃 시 익명 상태로 초기화
export function resetAnalytics() {
  try {
    client?.reset();
  } catch {
    // 무시
  }
}
