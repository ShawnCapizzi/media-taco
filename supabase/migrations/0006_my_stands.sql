-- Media Taco : "Your Stands" discovery
-- Run after 0003_stands.sql. Read-only function returning the Stands a
-- signed-in user created OR has added a Taco to. Security definer so it can
-- see the caller's own private Stands and their membership regardless of the
-- public directory rules.

create or replace function public.get_my_stands()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  event_on date,
  visibility text,
  is_owner boolean,
  taco_count bigint,
  my_taco_count bigint,
  updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with mine as (
    -- Stands I created
    select s.id, true as is_owner
    from public.stands s
    where s.creator_id = auth.uid()
    union
    -- Stands I added at least one Taco to
    select st.stand_id as id, false as is_owner
    from public.stand_tacos st
    where st.added_by = auth.uid()
  ),
  dedup as (
    select id, bool_or(is_owner) as is_owner
    from mine
    group by id
  )
  select
    s.id, s.slug, s.title, s.description, s.event_on, s.visibility,
    d.is_owner,
    (select count(*) from public.stand_tacos a where a.stand_id = s.id) as taco_count,
    (select count(*) from public.stand_tacos a
       where a.stand_id = s.id and a.added_by = auth.uid()) as my_taco_count,
    s.updated_at
  from dedup d
  join public.stands s on s.id = d.id
  where s.status <> 'hidden' or s.creator_id = auth.uid()
  order by s.updated_at desc;
$$;
