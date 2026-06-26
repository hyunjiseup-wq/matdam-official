export type MapSource = 'naver' | 'google';

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
