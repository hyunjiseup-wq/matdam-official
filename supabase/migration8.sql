-- ============================================================
-- 보안 강화: RLS 전면 활성화 + 정책 + 함수/스토리지 잠금
-- ============================================================

-- 0) 레거시 빈 테이블 제거 (스타터 잔재, 0행)
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.restaurants;

-- 1) 관리자 판별 함수 (SECURITY DEFINER — 정책 안에서 profiles 조회)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false)
$$;

-- 2) 함수 보안 (search_path 고정, 조회수는 DEFINER로 RLS 우회)
ALTER FUNCTION public.set_updated_at() SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_profile_view(p_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$ UPDATE public.profiles SET view_count = view_count + 1 WHERE id = p_id; $$;

-- 3) RLS 활성화
ALTER TABLE public.seoul_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- 4) seoul_restaurants: 읽기는 로그인 사용자 전체, 쓰기는 본인 것만 (관리자는 전체)
CREATE POLICY "sr select" ON public.seoul_restaurants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr insert" ON public.seoul_restaurants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "sr update" ON public.seoul_restaurants
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "sr delete" ON public.seoul_restaurants
  FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

-- 5) profiles: 읽기 전체, 쓰기는 본인 행만 + is_admin/view_count 컬럼 잠금
CREATE POLICY "pf select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pf insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "pf update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

REVOKE INSERT, UPDATE ON public.profiles FROM authenticated, anon;
GRANT INSERT (id, display_name, bio, sns_url, avatar_url, preferred_region)
  ON public.profiles TO authenticated;
GRANT UPDATE (id, display_name, bio, sns_url, avatar_url, preferred_region)
  ON public.profiles TO authenticated;

-- 6) list_likes: 읽기 전체, 좋아요는 본인 명의만
CREATE POLICY "ll select" ON public.list_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ll insert" ON public.list_likes
  FOR INSERT TO authenticated WITH CHECK (liker_id = auth.uid());
CREATE POLICY "ll delete" ON public.list_likes
  FOR DELETE TO authenticated USING (liker_id = auth.uid());

-- 7) restaurant_reviews: 읽기 전체, 본인 리뷰만 작성/수정, 삭제는 본인+관리자
CREATE POLICY "rv select" ON public.restaurant_reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rv insert" ON public.restaurant_reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rv update" ON public.restaurant_reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "rv delete" ON public.restaurant_reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- 8) app_feedback: 본인 것 + 관리자만 조회, 작성은 본인 명의, 상태변경/삭제는 관리자
CREATE POLICY "fb select" ON public.app_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "fb insert" ON public.app_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fb update" ON public.app_feedback
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "fb delete" ON public.app_feedback
  FOR DELETE TO authenticated USING (public.is_admin());

-- 9) feedback_replies: 해당 피드백 작성자 + 관리자만 (1:1 비공개 대화 유지)
CREATE POLICY "fr select" ON public.feedback_replies
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.app_feedback f
      WHERE f.id = feedback_id AND f.user_id = auth.uid()
    )
  );
CREATE POLICY "fr insert" ON public.feedback_replies
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND (
      public.is_admin() OR EXISTS (
        SELECT 1 FROM public.app_feedback f
        WHERE f.id = feedback_id AND f.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "fr delete" ON public.feedback_replies
  FOR DELETE TO authenticated USING (public.is_admin());

-- 10) collections / collection_items: 읽기 전체, 쓰기는 관리자만
CREATE POLICY "col select" ON public.collections
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "col write" ON public.collections
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "ci select" ON public.collection_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ci write" ON public.collection_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 11) 스토리지: 익명 업로드 차단, 로그인 사용자는 자기 폴더에만 업로드
--     (public 버킷이라 사진 URL 접근에는 SELECT 정책이 필요 없음 → 목록 노출 정책 제거)
DROP POLICY IF EXISTS "rp read" ON storage.objects;
DROP POLICY IF EXISTS "rp upload" ON storage.objects;
CREATE POLICY "rp upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'restaurant-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
