-- =============================================
-- 서울 맛집 리스트 - 2차 업데이트 마이그레이션
-- (지도 출처 / 좋아요 / 프로필 / 피드백 답글·관리 / 사진 업로드)
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하세요
-- =============================================

-- 1. 지도 출처 (naver | google | null)
ALTER TABLE public.seoul_restaurants ADD COLUMN IF NOT EXISTS map_source TEXT;

-- 2. 프로필 확장 (SNS 링크 / 소개 / 조회수)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sns_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 3. 리스트 좋아요 (누가 어떤 사용자의 리스트를 좋아하는지)
CREATE TABLE IF NOT EXISTS public.list_likes (
  liker_id   UUID        NOT NULL,
  owner_id   UUID        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (liker_id, owner_id)
);
ALTER TABLE public.list_likes DISABLE ROW LEVEL SECURITY;

-- 4. 피드백 상태 (open | resolved | archived)
ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';

-- 5. 피드백 답글 (관리자 ↔ 작성자 1:1 대화)
CREATE TABLE IF NOT EXISTS public.feedback_replies (
  id           TEXT        PRIMARY KEY,
  feedback_id  TEXT        NOT NULL REFERENCES public.app_feedback(id) ON DELETE CASCADE,
  user_id      UUID,
  is_admin     BOOLEAN     NOT NULL DEFAULT FALSE,
  display_name TEXT,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.feedback_replies DISABLE ROW LEVEL SECURITY;

-- 6. view_count 안전 증가용 RPC (동시성 안전)
CREATE OR REPLACE FUNCTION public.increment_profile_view(p_id UUID)
RETURNS void AS $$
  UPDATE public.profiles SET view_count = view_count + 1 WHERE id = p_id;
$$ LANGUAGE sql;

-- 7. 사진 업로드용 Storage 버킷 (공개 읽기)
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-photos', 'restaurant-photos', true)
ON CONFLICT (id) DO NOTHING;
