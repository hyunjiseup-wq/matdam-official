// =============================================================
// 푸시 알림 등록 (네이티브 전용)
// - 권한 요청 → Expo 푸시 토큰 발급 → push_tokens 테이블에 저장
// - 웹에서는 아무것도 하지 않는다(no-op)
// =============================================================
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const PROJECT_ID = '7813a6e3-5eb1-46da-82df-76a82b71dc9a';

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

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    ).data;
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
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
    if (token) await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // 무시
  }
}
