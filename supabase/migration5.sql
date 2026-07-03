-- =============================================================
-- 맛담 - migration5: 맛집 가격대
-- (이미 MCP로 적용됨 — 기록용. 새 환경에서는 SQL Editor에서 실행)
-- 값: '만원 이하' | '1~2만원' | '2~4만원' | '4만원 이상' | null
-- =============================================================

ALTER TABLE public.seoul_restaurants ADD COLUMN IF NOT EXISTS price_range text;
