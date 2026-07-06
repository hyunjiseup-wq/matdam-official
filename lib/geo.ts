// =============================================================
// 현재 위치 (웹: 브라우저 geolocation / 네이티브: expo-location)
// 가까운순 정렬 등에서 플랫폼 구분 없이 쓴다.
// =============================================================
import { Platform } from 'react-native';

export type GeoResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'denied' | 'unavailable' };

export async function getCurrentPosition(): Promise<GeoResult> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { ok: false, reason: 'unavailable' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ ok: false, reason: 'denied' }),
        { timeout: 8000 },
      );
    });
  }

  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
