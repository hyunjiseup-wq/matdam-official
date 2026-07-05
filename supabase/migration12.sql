-- migration12: 콘텐츠 신고 + 사용자 차단 (출시 체크리스트 B2, B3)

-- 신고: 누구나 접수, 열람·처리는 관리자만
create table if not exists public.reports (
  id text primary key,
  reporter_id uuid not null,
  target_type text not null check (target_type in ('restaurant', 'review', 'profile')),
  target_id text not null,
  target_owner_id uuid,
  reason text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.reports enable row level security;

create policy "rp insert own" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "rp select admin" on public.reports
  for select to authenticated using (public.is_admin());

create policy "rp update admin" on public.reports
  for update to authenticated using (public.is_admin());

create policy "rp delete admin" on public.reports
  for delete to authenticated using (public.is_admin());

-- 차단: 본인 것만 조회·추가·해제
create table if not exists public.blocked_users (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "bu select own" on public.blocked_users
  for select to authenticated using (blocker_id = auth.uid());

create policy "bu insert own" on public.blocked_users
  for insert to authenticated
  with check (blocker_id = auth.uid() and blocked_id <> auth.uid());

create policy "bu delete own" on public.blocked_users
  for delete to authenticated using (blocker_id = auth.uid());

-- 계정 삭제 시 신고·차단 기록도 정리 (delete_my_account 갱신)
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

  if exists (select 1 from public.profiles where id = uid and is_admin) then
    raise exception 'admin account cannot be deleted from the app';
  end if;

  delete from public.restaurant_reviews where user_id = uid;
  delete from public.list_likes where liker_id = uid or owner_id = uid;
  delete from public.feedback_replies where user_id = uid;
  delete from public.feedback_replies
  where feedback_id in (select id from public.app_feedback where user_id = uid);
  delete from public.app_feedback where user_id = uid;
  delete from public.reports where reporter_id = uid;
  delete from public.blocked_users where blocker_id = uid or blocked_id = uid;

  delete from public.collection_items
  where restaurant_id in (select id from public.seoul_restaurants where owner_id = uid)
     or collection_id in (select id from public.collections where owner_id = uid);
  delete from public.collections where owner_id = uid;
  delete from public.seoul_restaurants where owner_id = uid;

  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;
