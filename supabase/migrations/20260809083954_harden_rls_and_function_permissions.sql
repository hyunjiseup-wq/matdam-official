-- Supabase Advisor에서 확인한 SECURITY DEFINER 실행 권한과 RLS 성능 경고를 보완한다.
-- 정책의 접근 범위는 유지하되 auth/helper 함수는 initPlan으로 요청당 한 번만 평가한다.

-- 트리거 함수는 테이블 트리거에서만 실행되어야 하며 Data API RPC로 직접 호출할 수 없어야 한다.
revoke all on function public.on_restaurant_adopted() from public, anon, authenticated, service_role;
revoke all on function public.on_feedback_replied() from public, anon, authenticated, service_role;

-- 기존 함수 본문이 public.profiles를 완전 수식하므로 빈 search_path로 고정해 객체 가로채기를 막는다.
alter function public.is_admin() set search_path = '';

-- source_owner_id FK의 JOIN 및 사용자 삭제/정리 경로를 지원한다.
create index if not exists seoul_restaurants_source_owner_id_idx
  on public.seoul_restaurants (source_owner_id);

alter policy "sr insert" on public.seoul_restaurants
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));

alter policy "sr update" on public.seoul_restaurants
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));

alter policy "sr delete" on public.seoul_restaurants
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

alter policy "pf insert" on public.profiles
  with check (id = (select auth.uid()));

alter policy "pf update" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "ll insert" on public.list_likes
  with check (liker_id = (select auth.uid()));

alter policy "ll delete" on public.list_likes
  using (liker_id = (select auth.uid()));

alter policy "rv insert" on public.restaurant_reviews
  with check (user_id = (select auth.uid()));

alter policy "rv update" on public.restaurant_reviews
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "rv delete" on public.restaurant_reviews
  using (user_id = (select auth.uid()) or (select public.is_admin()));

alter policy "fb select" on public.app_feedback
  using (user_id = (select auth.uid()) or (select public.is_admin()));

alter policy "fb insert" on public.app_feedback
  with check (user_id = (select auth.uid()));

alter policy "fb update" on public.app_feedback
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "fb delete" on public.app_feedback
  using ((select public.is_admin()));

alter policy "fr select" on public.feedback_replies
  using (
    (select public.is_admin()) or exists (
      select 1
      from public.app_feedback as feedback
      where feedback.id = feedback_replies.feedback_id
        and feedback.user_id = (select auth.uid())
    )
  );

alter policy "fr insert" on public.feedback_replies
  with check (
    user_id = (select auth.uid()) and (
      (select public.is_admin()) or exists (
        select 1
        from public.app_feedback as feedback
        where feedback.id = feedback_replies.feedback_id
          and feedback.user_id = (select auth.uid())
      )
    )
  );

alter policy "fr delete" on public.feedback_replies
  using ((select public.is_admin()));

alter policy "rp insert own" on public.reports
  with check (reporter_id = (select auth.uid()));

alter policy "rp select admin" on public.reports
  using ((select public.is_admin()));

-- UPDATE에는 기존 행과 새 행을 모두 검사해야 관리자 전용 상태 변경이 유지된다.
alter policy "rp update admin" on public.reports
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "rp delete admin" on public.reports
  using ((select public.is_admin()));

alter policy "bu select own" on public.blocked_users
  using (blocker_id = (select auth.uid()));

alter policy "bu insert own" on public.blocked_users
  with check (
    blocker_id = (select auth.uid())
    and blocked_id <> (select auth.uid())
  );

alter policy "bu delete own" on public.blocked_users
  using (blocker_id = (select auth.uid()));

alter policy "pt upsert own" on public.push_tokens
  with check (user_id = (select auth.uid()));

alter policy "pt update own" on public.push_tokens
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "pt select own" on public.push_tokens
  using (user_id = (select auth.uid()));

alter policy "pt delete own" on public.push_tokens
  using (user_id = (select auth.uid()));

-- FOR ALL 정책은 SELECT 정책과 중복 평가된다. 읽기는 기존 공개 정책에 맡기고 쓰기만 분리한다.
drop policy if exists "col write" on public.collections;
create policy "col insert admin" on public.collections
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "col update admin" on public.collections
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "col delete admin" on public.collections
  for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "ci write" on public.collection_items;
create policy "ci insert admin" on public.collection_items
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "ci update admin" on public.collection_items
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "ci delete admin" on public.collection_items
  for delete to authenticated
  using ((select public.is_admin()));

-- Storage own-folder 정책도 같은 요청당 1회 auth.uid() 평가 패턴으로 맞춘다.
alter policy "rp upload own folder" on storage.objects
  with check (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy "rp read own folder" on storage.objects
  using (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy "rp delete own folder" on storage.objects
  using (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
