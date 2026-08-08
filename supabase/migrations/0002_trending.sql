-- Media Taco Community : trending
-- Run after 0001_init.sql. Adds a read-only trending function used by
-- the Explore page. Public and published Tacos only, by construction.

create or replace function public.get_trending_tacos(p_days int default 7, p_limit int default 12)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  cover_url text,
  published_at timestamptz,
  creator_username text,
  creator_display_name text,
  creator_founding boolean,
  ingredient_count bigint,
  response_count bigint,
  reaction_count bigint,
  score numeric
)
language sql stable security definer set search_path = public as $$
  select
    t.id,
    t.slug,
    t.title,
    t.description,
    t.cover_url,
    t.published_at,
    u.username,
    u.display_name,
    u.founding_status,
    (select count(*) from public.ingredients i where i.taco_id = t.id) as ingredient_count,
    (select count(*) from public.responses r where r.taco_id = t.id and r.status = 'published') as response_count,
    (select count(*) from public.reactions x where x.taco_id = t.id) as reaction_count,
    (
      (select count(*) from public.reactions x
        where x.taco_id = t.id and x.created_at > now() - make_interval(days => p_days)) * 1.0
      + (select count(*) from public.responses r
        where r.taco_id = t.id and r.status = 'published'
          and r.created_at > now() - make_interval(days => p_days)) * 2.0
      + (select count(*) from public.saves s
        where s.taco_id = t.id and s.created_at > now() - make_interval(days => p_days)) * 1.5
    ) as score
  from public.tacos t
  join public.users u on u.id = t.creator_id
  where t.status = 'published' and t.visibility = 'public'
  order by score desc, t.published_at desc nulls last
  limit least(greatest(p_limit, 1), 48);
$$;

-- Live counter for the Explore header
create or replace function public.get_public_taco_count()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.tacos
  where status = 'published' and visibility = 'public';
$$;
