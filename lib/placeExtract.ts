import { Platform } from 'react-native';
import { MapSource, MenuItem } from '@/types/restaurant';

// 웹: 같은 오리진(/api). 앱(네이티브): 배포된 프로덕션 함수로 호출.
const API_BASE =
  Platform.OS === 'web'
    ? ''
    : process.env.EXPO_PUBLIC_API_BASE || 'https://matdam-official.vercel.app';

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
  const res = await fetch(`${API_BASE}/api/extract-place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || '자동 인식에 실패했어요. 직접 입력해주세요.');
  }
  return data as ExtractedPlace;
}
