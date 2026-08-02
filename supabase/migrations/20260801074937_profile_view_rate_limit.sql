-- 인증 사용자별 프로필 조회를 하루 한 번만 집계한다.
-- 사용자-프로필 쌍마다 한 행만 유지해 이벤트 테이블이 날짜별로 무한 증가하지 않게 한다.
-- 직접 Data API로 접근할 필요가 없는 내부 테이블이므로 모든 클라이언트 권한을 회수한다.
create table if not exists public.profile_view_events (
  viewer_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewed_on date not null default ((now() at time zone 'Asia/Seoul')::date),
  last_viewed_at timestamptz not null default now(),
  primary key (viewer_id, profile_id),
  check (viewer_id <> profile_id)
);

-- 복합 기본키는 viewer_id로 시작하므로 profile 삭제 CASCADE를 위한 단독 인덱스가 필요하다.
create index if not exists profile_view_events_profile_id_idx
  on public.profile_view_events (profile_id);

alter table public.profile_view_events enable row level security;
revoke all on table public.profile_view_events from anon, authenticated;

create or replace function public.increment_profile_view(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  counted boolean;
begin
  if viewer is null or p_id is null or viewer = p_id then
    return;
  end if;

  insert into public.profile_view_events as events
    (viewer_id, profile_id, viewed_on, last_viewed_at)
  select viewer, p_id, (now() at time zone 'Asia/Seoul')::date, now()
  where exists (select 1 from public.profiles where id = p_id)
  on conflict (viewer_id, profile_id) do update
  set viewed_on = excluded.viewed_on,
      last_viewed_at = excluded.last_viewed_at
  where events.viewed_on < excluded.viewed_on
  returning true into counted;

  if counted then
    update public.profiles
    set view_count = view_count + 1
    where id = p_id;
  end if;
end;
$$;

revoke all on function public.increment_profile_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_profile_view(uuid) to authenticated;
