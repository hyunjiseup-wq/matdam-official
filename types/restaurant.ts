export type MapSource = 'naver' | 'google';

// 네이버 플레이스에서 자동 추출한 메뉴 한 줄
export interface MenuItem {
  name: string;
  price: string; // "58000" 또는 "변동" 같은 문자열
  image?: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  area?: string;
  category?: string;
  address?: string;
  naver_map_url?: string;
  map_source?: MapSource;
  image_url?: string;
  tags?: string[];
  memo?: string;
  price_range?: string; // 만원 이하 | 1~2만원 | 2~4만원 | 4만원 이상
  menus?: MenuItem[]; // 네이버에서 자동 추출한 메뉴 목록
  lat?: number; // 좌표 (지도 뷰 + 거리순)
  lng?: number;
  visited: boolean;
  wishlist: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export type VisitedFilter = 'all' | 'visited' | 'wishlist';

export interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;
  display_name: string;
  rating: number;
  content?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  bio?: string;
  sns_url?: string;
  avatar_url?: string;
  preferred_region?: string; // 관심 지역 (홈 추천, 예: "제주, 성수")
  view_count?: number;
  created_at: string;
  count?: number;      // 보유 맛집 수 (클라이언트 계산)
  like_count?: number; // 받은 좋아요 수 (클라이언트 계산)
  liked?: boolean;     // 내가 좋아요 눌렀는지 (클라이언트 계산)
}

export type FeedbackStatus = 'open' | 'resolved' | 'archived';

export interface Feedback {
  id: string;
  user_id?: string;
  display_name?: string;
  type: string;
  content: string;
  status: FeedbackStatus;
  created_at: string;
  replyCount?: number; // 클라이언트 계산
}

export interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id?: string;
  is_admin: boolean;
  display_name?: string;
  content: string;
  created_at: string;
}

export interface FilterState {
  searchQuery: string;
  areaFilter: string | null;
  categoryFilter: string | null;
  visitedFilter: VisitedFilter;
}

// ── 전체 맛집 둘러보기 (사용자 통합 피드) ─────────────────────────────────────

export interface OwnerRef {
  id: string;
  display_name: string;
  is_admin: boolean;
  like_count: number;
  sns_url?: string;
  avatar_url?: string;
}

export interface DiscoverItem {
  key: string;             // 그룹 키 (이름+지역)
  representativeId: string; // 상세로 이동할 대표 맛집 id
  name: string;
  area?: string;
  category?: string;
  address?: string;
  image_url?: string;
  map_source?: MapSource;
  price_range?: string;
  lat?: number;
  lng?: number;
  addedCount: number;      // 이 맛집을 담은 사용자 수 (인기)
  visitedCount: number;    // 방문 체크한 사용자 수
  avgRating: number;       // 리뷰 평균 별점 (없으면 0)
  reviewCount: number;     // 리뷰 수
  topOwners: OwnerRef[];   // 인기순 상위 3명
}

export type DiscoverSort = 'popular' | 'rating' | 'visited' | 'nearby';

// ── 테마 컬렉션 (큐레이션) ────────────────────────────────────────────────────

export interface Collection {
  id: string;
  owner_id?: string;
  title: string;
  description?: string;
  emoji?: string;
  cover_image_url?: string;
  is_official: boolean;
  sort_order: number;
  created_at: string;
  itemCount?: number;        // 클라이언트 계산
  previewImages?: string[];  // 담긴 맛집 사진 미리보기 (최대 3)
}

export interface MyInfluence {
  totalAdoptions: number;  // 내 맛집을 담아간 총 횟수
  adopterCount: number;    // 내 맛집을 담은 고유 사용자 수
  topRestaurants: { name: string; area?: string; othersCount: number }[]; // 가장 많이 담긴 내 맛집
}
