-- =============================================================
-- 맛담 - migration4: 프로필 관심 지역 (홈 추천용)
-- (이미 MCP로 적용됨 — 기록용. 새 환경에서는 SQL Editor에서 실행)
-- =============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_region text;
