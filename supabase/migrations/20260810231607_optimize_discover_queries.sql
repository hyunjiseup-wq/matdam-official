-- 대규모 사용자/맛집 데이터에서 클라이언트가 관련 테이블 전체를 내려받지 않도록
-- 공개 피드와 사용자 디렉터리 집계를 읽기 전용 RPC로 이동한다.
-- 모든 함수는 호출자의 RLS를 그대로 적용하는 SECURITY INVOKER로 유지한다.

create or replace function public.discover_group_key(
  p_name text,
  p_address text,
  p_area text
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  with district_matches as (
    select match_values[1] as token, ordinality
    from regexp_matches(
      coalesce(p_address, ''),
      '([가-힣]+(구|시|군))',
      'g'
    ) with ordinality as matches(match_values, ordinality)
  ), district as (
    select coalesce(
      (
        select token
        from district_matches
        where regexp_replace(token, '(구|시|군)$', '') not in (
          '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
          '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
        )
        order by ordinality
        limit 1
      ),
      (select token from district_matches order by ordinality limit 1),
      p_area,
      ''
    ) as value
  )
  select regexp_replace(lower(btrim(coalesce(p_name, ''))), '[[:space:]]+', '', 'g')
    || '|' || district.value
  from district;
$$;

revoke all on function public.discover_group_key(text, text, text)
  from public, anon, authenticated;
grant execute on function public.discover_group_key(text, text, text)
  to authenticated;

create or replace function public.get_user_directory_page(
  p_limit integer default 100,
  p_after_like_count bigint default null,
  p_after_view_count integer default null,
  p_after_restaurant_count bigint default null,
  p_after_id uuid default null
)
returns table (
  id uuid,
  display_name text,
  is_admin boolean,
  created_at timestamptz,
  bio text,
  sns_url text,
  view_count integer,
  avatar_url text,
  preferred_region text,
  restaurant_count bigint,
  like_count bigint,
  liked boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with viewer as materialized (
    select auth.uid() as id
  ), restaurant_counts as (
    select restaurants.owner_id, count(*) as restaurant_count
    from public.seoul_restaurants as restaurants
    where restaurants.owner_id is not null
    group by restaurants.owner_id
  ), like_counts as (
    select likes.owner_id, count(*) as like_count
    from public.list_likes as likes
    group by likes.owner_id
  ), directory as (
    select
      profiles.id,
      profiles.display_name,
      profiles.is_admin,
      profiles.created_at,
      profiles.bio,
      profiles.sns_url,
      profiles.view_count,
      profiles.avatar_url,
      profiles.preferred_region,
      coalesce(restaurant_counts.restaurant_count, 0)::bigint as restaurant_count,
      coalesce(like_counts.like_count, 0)::bigint as like_count,
      exists (
        select 1
        from public.list_likes as my_like
        cross join viewer
        where my_like.liker_id = viewer.id
          and my_like.owner_id = profiles.id
      ) as liked
    from public.profiles as profiles
    left join restaurant_counts on restaurant_counts.owner_id = profiles.id
    left join like_counts on like_counts.owner_id = profiles.id
    where not exists (
      select 1
      from public.blocked_users as blocked
      cross join viewer
      where blocked.blocker_id = viewer.id
        and blocked.blocked_id = profiles.id
    )
  )
  select directory.*
  from directory
  where p_after_id is null
    or directory.like_count < coalesce(p_after_like_count, 0)
    or (
      directory.like_count = coalesce(p_after_like_count, 0)
      and directory.view_count < coalesce(p_after_view_count, 0)
    )
    or (
      directory.like_count = coalesce(p_after_like_count, 0)
      and directory.view_count = coalesce(p_after_view_count, 0)
      and directory.restaurant_count < coalesce(p_after_restaurant_count, 0)
    )
    or (
      directory.like_count = coalesce(p_after_like_count, 0)
      and directory.view_count = coalesce(p_after_view_count, 0)
      and directory.restaurant_count = coalesce(p_after_restaurant_count, 0)
      and directory.id > p_after_id
    )
  order by
    directory.like_count desc,
    directory.view_count desc,
    directory.restaurant_count desc,
    directory.id asc
  limit least(greatest(coalesce(p_limit, 100), 1), 100);
$$;

revoke all on function public.get_user_directory_page(integer, bigint, integer, bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.get_user_directory_page(integer, bigint, integer, bigint, uuid)
  to authenticated;

create or replace function public.get_profile_summary(p_id uuid)
returns table (
  id uuid,
  display_name text,
  is_admin boolean,
  created_at timestamptz,
  bio text,
  sns_url text,
  view_count integer,
  avatar_url text,
  preferred_region text,
  restaurant_count bigint,
  like_count bigint,
  liked boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with viewer as materialized (
    select auth.uid() as id
  )
  select
    profiles.id,
    profiles.display_name,
    profiles.is_admin,
    profiles.created_at,
    profiles.bio,
    profiles.sns_url,
    profiles.view_count,
    profiles.avatar_url,
    profiles.preferred_region,
    (
      select count(*)
      from public.seoul_restaurants as restaurants
      where restaurants.owner_id = profiles.id
    )::bigint as restaurant_count,
    (
      select count(*)
      from public.list_likes as likes
      where likes.owner_id = profiles.id
    )::bigint as like_count,
    exists (
      select 1
      from public.list_likes as my_like
      cross join viewer
      where my_like.liker_id = viewer.id
        and my_like.owner_id = profiles.id
    ) as liked
  from public.profiles as profiles
  where profiles.id = p_id
    and not exists (
      select 1
      from public.blocked_users as blocked
      cross join viewer
      where blocked.blocker_id = viewer.id
        and blocked.blocked_id = profiles.id
    );
$$;

revoke all on function public.get_profile_summary(uuid)
  from public, anon, authenticated;
grant execute on function public.get_profile_summary(uuid)
  to authenticated;

create or replace function public.get_discover_feed_page(
  p_limit integer default 500,
  p_after_added_count bigint default null,
  p_after_group_key text default null
)
returns table (
  group_key text,
  representative_id text,
  name text,
  area text,
  category text,
  address text,
  image_url text,
  map_source text,
  price_range text,
  lat double precision,
  lng double precision,
  added_count bigint,
  visited_count bigint,
  avg_rating double precision,
  review_count bigint,
  top_owners jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with viewer as materialized (
    select auth.uid() as id
  ), base as materialized (
    select
      restaurants.*,
      public.discover_group_key(
        restaurants.name,
        restaurants.address,
        restaurants.area
      ) as group_key
    from public.seoul_restaurants as restaurants
    where restaurants.owner_id is not null
      and not exists (
        select 1
        from public.blocked_users as blocked
        cross join viewer
        where blocked.blocker_id = viewer.id
          and blocked.blocked_id = restaurants.owner_id
      )
  ), owner_like_counts as (
    select likes.owner_id, count(*)::bigint as like_count
    from public.list_likes as likes
    group by likes.owner_id
  ), rating_totals as (
    select
      reviews.restaurant_id,
      sum(reviews.rating)::bigint as rating_sum,
      count(*)::bigint as review_count
    from public.restaurant_reviews as reviews
    group by reviews.restaurant_id
  ), grouped as (
    select
      base.group_key,
      (array_agg(
        base.id
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as representative_id,
      (array_agg(
        base.name
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as name,
      (array_agg(
        base.area
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as area,
      (array_agg(
        base.category
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as category,
      (array_agg(
        base.address
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as address,
      (array_agg(
        base.image_url
        order by base.priority desc, base.id asc
      ) filter (where base.image_url is not null))[1] as image_url,
      (array_agg(
        base.map_source
        order by (base.image_url is not null) desc, base.priority desc, base.id asc
      ))[1] as map_source,
      (array_agg(
        base.price_range
        order by base.priority desc, base.id asc
      ) filter (where base.price_range is not null))[1] as price_range,
      (array_agg(
        base.lat
        order by base.priority desc, base.id asc
      ) filter (where base.lat is not null))[1] as lat,
      (array_agg(
        base.lng
        order by base.priority desc, base.id asc
      ) filter (where base.lng is not null))[1] as lng,
      count(distinct base.owner_id)::bigint as added_count,
      (count(distinct base.owner_id) filter (where base.visited))::bigint as visited_count,
      coalesce(sum(rating_totals.rating_sum), 0)::double precision
        / nullif(coalesce(sum(rating_totals.review_count), 0), 0)::double precision as avg_rating,
      coalesce(sum(rating_totals.review_count), 0)::bigint as review_count
    from base
    left join rating_totals on rating_totals.restaurant_id = base.id
    group by base.group_key
  ), owner_rows as (
    select
      owners.group_key,
      owners.owner_id,
      profiles.display_name,
      profiles.is_admin,
      profiles.sns_url,
      profiles.avatar_url,
      coalesce(owner_like_counts.like_count, 0)::bigint as like_count,
      row_number() over (
        partition by owners.group_key
        order by
          coalesce(owner_like_counts.like_count, 0) desc,
          profiles.display_name asc,
          owners.owner_id asc
      ) as owner_rank
    from (
      select distinct base.group_key, base.owner_id
      from base
    ) as owners
    join public.profiles as profiles on profiles.id = owners.owner_id
    left join owner_like_counts on owner_like_counts.owner_id = owners.owner_id
  ), owner_json as (
    select
      owner_rows.group_key,
      jsonb_agg(
        jsonb_build_object(
          'id', owner_rows.owner_id,
          'display_name', owner_rows.display_name,
          'is_admin', owner_rows.is_admin,
          'like_count', owner_rows.like_count,
          'sns_url', owner_rows.sns_url,
          'avatar_url', owner_rows.avatar_url
        )
        order by owner_rows.owner_rank
      ) filter (where owner_rows.owner_rank <= 3) as top_owners
    from owner_rows
    group by owner_rows.group_key
  )
  select
    grouped.group_key,
    grouped.representative_id,
    grouped.name,
    grouped.area,
    grouped.category,
    grouped.address,
    grouped.image_url,
    grouped.map_source,
    grouped.price_range,
    grouped.lat,
    grouped.lng,
    grouped.added_count,
    grouped.visited_count,
    coalesce(grouped.avg_rating, 0)::double precision as avg_rating,
    grouped.review_count,
    coalesce(owner_json.top_owners, '[]'::jsonb) as top_owners
  from grouped
  left join owner_json on owner_json.group_key = grouped.group_key
  where p_after_group_key is null
    or grouped.added_count < coalesce(p_after_added_count, 0)
    or (
      grouped.added_count = coalesce(p_after_added_count, 0)
      and grouped.group_key > p_after_group_key
    )
  order by grouped.added_count desc, grouped.group_key asc
  limit least(greatest(coalesce(p_limit, 500), 1), 500);
$$;

revoke all on function public.get_discover_feed_page(integer, bigint, text)
  from public, anon, authenticated;
grant execute on function public.get_discover_feed_page(integer, bigint, text)
  to authenticated;
