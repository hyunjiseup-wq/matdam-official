-- 맛집 좌표 (지도 뷰 + 거리순 정렬용)
ALTER TABLE public.seoul_restaurants
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;
