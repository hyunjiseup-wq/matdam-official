-- 테마 컬렉션 (골목 노포, 지방 소도시 등 큐레이션)
CREATE TABLE IF NOT EXISTS public.collections (
  id text PRIMARY KEY,
  owner_id uuid,
  title text NOT NULL,
  description text,
  emoji text,
  cover_image_url text,
  is_official boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id text PRIMARY KEY,
  collection_id text NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL REFERENCES public.seoul_restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (collection_id, restaurant_id)
);
