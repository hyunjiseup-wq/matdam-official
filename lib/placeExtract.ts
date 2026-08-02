import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { MapSource, MenuItem } from '@/types/restaurant';

// 웹: 같은 오리진(/api). 앱(네이티브): 배포된 프로덕션 함수로 호출.
function getApiBase(): string {
  if (Platform.OS === 'web') return '';

  const apiBase = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (!apiBase) {
    throw new Error('EXPO_PUBLIC_API_BASE가 설정되지 않았어요. 앱 빌드 환경을 확인해주세요.');
  }
  return apiBase.replace(/\/$/, '');
}

export interface ExtractedPlace {
  name: string;
  address: string;
  category: string;
  image_url: string;
  naver_map_url: string;
  map_source?: MapSource;
  price_range?: string; // 메뉴 가격 중앙값으로 추정
  menus?: MenuItem[]; // 메뉴 목록 (구글 링크도 네이버에서 찾아 보강)
  lat?: number | null; // 좌표 (지도 뷰용)
  lng?: number | null;
  ai: boolean; // AI로 구조화됐는지 (false면 og태그만으로 채운 것)
}

/**
 * 네이버/구글 지도 링크에서 식당 정보를 자동 추출한다.
 * 서버리스 함수(/api/extract-place)가 링크를 읽어 구조화해 돌려준다.
 */
export async function extractPlace(url: string): Promise<ExtractedPlace> {
  // getSession은 토큰 운반에만 사용한다. 서버가 Supabase Auth에 다시 조회해
  // 토큰과 사용자를 검증하므로 클라이언트 세션 객체를 권한 판단에 신뢰하지 않는다.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('로그인 세션을 확인할 수 없어요. 다시 로그인해주세요.');
  }

  const res = await fetch(`${getApiBase()}/api/extract-place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || '자동 인식에 실패했어요. 직접 입력해주세요.');
  }
  return data as ExtractedPlace;
}
