-- =============================================================
-- migration15: 푸시 알림 (출시 체크리스트 C7)
-- 원격 적용명: push_notifications_setup
-- =============================================================

-- 1) 기기별 Expo 푸시 토큰
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "pt upsert own" on public.push_tokens
  for insert to authenticated with check (user_id = auth.uid());
create policy "pt update own" on public.push_tokens
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pt select own" on public.push_tokens
  for select to authenticated using (user_id = auth.uid());
create policy "pt delete own" on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

-- 2) 담김 알림용: 복사된 맛집의 원본 주인
alter table public.seoul_restaurants
  add column if not exists source_owner_id uuid references auth.users(id) on delete set null;

-- 3) 발송 트리거는 migration16(send_push_triggers)에서 Edge Function 배포 후 추가
