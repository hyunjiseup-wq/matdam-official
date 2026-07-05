-- migration11: 계정 삭제 기능 (출시 체크리스트 B1)
-- 본인 계정과 관련 데이터 전체를 삭제하는 RPC.
-- SECURITY DEFINER(postgres 소유)로 실행되어 auth.users까지 정리한다.
-- 주의: storage.objects는 SQL 직접 삭제가 금지(Supabase 정책)라 클라이언트가
--       Storage API로 본인 폴더를 먼저 비운다 → 아래 own-folder SELECT/DELETE 정책 필요.

-- 본인 업로드 파일 조회·삭제 정책 (기존엔 INSERT own-folder만 있었음)
create policy "rp read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'restaurant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "rp delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'restaurant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- 관리자 계정은 앱 내 삭제 불가 (실수 방지 — 필요 시 대시보드에서만)
  if exists (select 1 from public.profiles where id = uid and is_admin) then
    raise exception 'admin account cannot be deleted from the app';
  end if;

  -- 1) 활동 데이터
  delete from public.restaurant_reviews where user_id = uid;
  delete from public.list_likes where liker_id = uid or owner_id = uid;
  delete from public.feedback_replies where user_id = uid;
  delete from public.feedback_replies
  where feedback_id in (select id from public.app_feedback where user_id = uid);
  delete from public.app_feedback where user_id = uid;

  -- 2) 내 콘텐츠 (컬렉션 항목이 내 맛집을 참조할 수 있으므로 먼저 정리)
  delete from public.collection_items
  where restaurant_id in (select id from public.seoul_restaurants where owner_id = uid)
     or collection_id in (select id from public.collections where owner_id = uid);
  delete from public.collections where owner_id = uid;
  delete from public.seoul_restaurants where owner_id = uid;

  -- 3) 프로필 + 인증 계정 (auth 하위 identities/sessions는 FK cascade)
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

-- 로그인한 본인만 호출 가능
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
