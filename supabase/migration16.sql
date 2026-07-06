-- =============================================================
-- migration16: 푸시 발송 트리거 (출시 체크리스트 C7)
-- 원격 적용명: send_push_triggers
-- Edge Function 없이 DB 트리거가 Expo 푸시 API(exp.host)를 pg_net 으로 직접 호출.
-- Expo 무료 푸시는 발송 키가 필요 없어 별도 시크릿이 없다.
-- =============================================================

-- 대상 사용자의 모든 기기에 푸시 발송
create or replace function public.send_expo_push(p_user_id uuid, p_title text, p_body text, p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
begin
  for t in select token from public.push_tokens where user_id = p_user_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', t.token,
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'channelId', 'default',
        'priority', 'high',
        'data', jsonb_build_object('url', p_url)
      )
    );
  end loop;
end;
$$;

-- 담김 알림
create or replace function public.on_restaurant_adopted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  copier_name text;
begin
  if new.source_owner_id is not null and new.source_owner_id <> new.owner_id then
    select display_name into copier_name from public.profiles where id = new.owner_id;
    perform public.send_expo_push(
      new.source_owner_id,
      '맛담 🍽️',
      coalesce(copier_name, '누군가') || '님이 「' || new.name || '」을(를) 담았어요!',
      '/profile'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_restaurant_adopted on public.seoul_restaurants;
create trigger trg_restaurant_adopted
  after insert on public.seoul_restaurants
  for each row execute function public.on_restaurant_adopted();

-- 피드백 답변 알림
create or replace function public.on_feedback_replied()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fb_owner uuid;
begin
  if new.is_admin then
    select user_id into fb_owner from public.app_feedback where id = new.feedback_id;
    if fb_owner is not null and fb_owner <> new.user_id then
      perform public.send_expo_push(
        fb_owner,
        '맛담 💬',
        '보내신 피드백에 답변이 도착했어요!',
        '/feedback-thread/' || new.feedback_id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feedback_replied on public.feedback_replies;
create trigger trg_feedback_replied
  after insert on public.feedback_replies
  for each row execute function public.on_feedback_replied();

revoke all on function public.send_expo_push(uuid, text, text, text) from public, anon, authenticated;
