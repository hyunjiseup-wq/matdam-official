-- 메뉴 목록 (네이버 플레이스에서 자동 추출: [{name, price, image}])
ALTER TABLE public.seoul_restaurants ADD COLUMN IF NOT EXISTS menus jsonb;
