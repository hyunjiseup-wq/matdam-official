// =============================================================
// 푸시 알림 등록 (네이티브 전용)
// - 권한 요청 → Expo 푸시 토큰 발급 → push_tokens 테이블에 저장
// - 웹에서는 아무것도 하지 않는다(no-op)
// =============================================================
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

// 서버에서 보낸 임의 문자열이 외부 URL이나 관리자 화면으로 이어지지 않도록
// 푸시에서 이동 가능한 앱 내부 경로만 명시적으로 허용한다.
export function getPushRoute(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 200) return null;
  if (value === '/profile') return value;
  if (/^\/feedback-thread\/[A-Za-z0-9_-]{1,128}$/.test(value)) return value;
  if (/^\/detail\/[A-Za-z0-9_-]{1,128}$/.test(value)) return value;
  return null;
}

type PushResponse = {
  actionIdentifier: string;
  notification: { request: { content: { data?: Record<string, unknown> } } };
};

// 앱이 열린 상태에서도 알림을 표시하고, 알림 탭을 Expo Router 경로로 전달한다.
// 동적 import를 사용해 웹 번들에서는 네이티브 알림 모듈을 실행하지 않는다.
export async function observePushNavigation(
  onRoute: (route: string) => void,
): Promise<() => void> {
  if (Platform.OS === 'web') return () => {};

  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const redirect = (response: PushResponse | null) => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const route = getPushRoute(response.notification.request.content.data?.url);
    if (route) onRoute(route);
  };

  const initial = await Notifications.getLastNotificationResponseAsync();
  if (initial) {
    redirect(initial);
    await Notifications.clearLastNotificationResponseAsync();
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    redirect(response);
  });
  return () => subscription.remove();
}

// 로그인 직후 호출. 실패해도 앱 사용에는 지장이 없어야 하므로 조용히 무시한다.
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    if (!Device.isDevice) return; // 에뮬레이터/시뮬레이터는 실물 토큰 불가

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    // 안드로이드는 기본 채널이 있어야 헤드업 알림이 뜬다
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FF7A45',
      });
    }

    if (!PROJECT_ID) throw new Error('EAS projectId가 설정되지 않았어요.');
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
    if (!token) return;

    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS },
      { onConflict: 'token' },
    );
  } catch {
    // 권한 거부·환경 미지원 등은 조용히 무시
  }
}

// 로그아웃/계정삭제 시 이 기기 토큰 정리 (베스트에포트)
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    if (!Device.isDevice) return;
    if (!PROJECT_ID) return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
    if (token) await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // 무시
  }
}
