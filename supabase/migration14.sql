-- =============================================================
-- migration14: 조회 성능 인덱스 (출시 체크리스트 F4)
-- 실제 쿼리 경로 기준. 텍스트(name/address)·좌표(lat/lng) 인덱스는
-- 현재 검색·지도 필터가 전부 클라이언트에서 돌므로 서버측 검색
-- 도입 시점에 추가한다.
-- 원격 적용명: performance_indexes
-- =============================================================

-- 상세 화면 리뷰 목록: eq(restaurant_id) + order(created_at desc)
create index if not exists idx_reviews_restaurant_created
  on public.restaurant_reviews (restaurant_id, created_at desc);

-- 내 피드백 목록: eq(user_id) + order(created_at desc)
create index if not exists idx_feedback_user_created
  on public.app_feedback (user_id, created_at desc);

-- 피드백 대화: eq(feedback_id) + order(created_at)
create index if not exists idx_replies_feedback_created
  on public.feedback_replies (feedback_id, created_at);

-- 계정 삭제 시 자기 답글 정리: eq(user_id)
create index if not exists idx_replies_user
  on public.feedback_replies (user_id);

-- 내 영향력(담긴 수)·리스트 좋아요 수: eq(owner_id)
create index if not exists idx_list_likes_owner
  on public.list_likes (owner_id);

-- 관리자 신고 목록: 상태 필터 + 최신순
create index if not exists idx_reports_status_created
  on public.reports (status, created_at desc);

-- 계정 삭제 시 나를 차단한 기록 정리: eq(blocked_id)
create index if not exists idx_blocked_users_blocked
  on public.blocked_users (blocked_id);

-- 컬렉션 정리(맛집 삭제·계정 삭제): eq(restaurant_id)
create index if not exists idx_collection_items_restaurant
  on public.collection_items (restaurant_id);
