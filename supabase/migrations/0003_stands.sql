-- Media Taco Community : Stands
-- Run after 0002_trending.sql.
-- A Stand is a shared shelf of Tacos: an event, a trip, a party. Every
-- attached Taco keeps its own creator. Attaching is opt-in and self-serve:
-- you can only add YOUR OWN Taco to a Stand. A private Taco attached to a
-- Stand stays invisible to everyone but its creator.

-- 1. Founding Table grows to 100 seats.
-- 0001 capped invitation codes at 50 uses; raise the ceiling first.
alter table public.invitations drop constraint if exists invitations_max_uses_check;
alter table public.invitations add constraint invitations_max_uses_check check (max_uses between 1 and 500);
update public.invitations set max_uses = 100 where code = 'FOUNDING-TABLE';

-- 2. Tables
create table public.stands (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 300),
  cover_url text,
  visibility text not null default 'community' check (visibility in ('private','link','community','public')),
  status text not null default 'published' check (status in ('published','hidden')),
  open_contributions boolean not null default true,
  event_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stand_tacos (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references public.stands(id) on delete cascade,
  taco_id uuid not null references public.tacos(id) on delete cascade,
  added_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (stand_id, taco_id)
);

create index idx_stand_tacos_stand on public.stand_tacos (stand_id, created_at desc);
create index idx_stands_public on public.stands (status, visibility, created_at desc);

create trigger trg_stands_touch before update on public.stands
  for each row execute function public.touch_updated_at();

-- 3. Pilot limit: members 1 Stand, founders and staff 5, admins unlimited
create or replace function public.enforce_stand_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_count int;
  v_limit int;
begin
  select role into v_role from public.users where id = new.creator_id;
  if v_role = 'admin' then return new; end if;
  v_limit := case when v_role = 'member' then 1 else 5 end;
  select count(*) into v_count from public.stands where creator_id = new.creator_id;
  if v_count >= v_limit then
    raise exception 'Pilot limit reached: your account can create % Stand(s) during the proof of concept.', v_limit;
  end if;
  return new;
end;
$$;

create trigger trg_stand_limit before insert on public.stands
  for each row execute function public.enforce_stand_limit();

-- 4. Helpers
create or replace function public.can_view_stand(s_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stands s
    where s.id = s_id
      and (
        (s.status = 'published' and (
          s.visibility = 'public'
          or s.visibility = 'link'
          or (s.visibility = 'community' and auth.uid() is not null)
        ))
        or s.creator_id = auth.uid()
        or public.is_moderation()
      )
  );
$$;

-- Shared-by-link access path, mirroring get_taco_by_slug
create or replace function public.get_stand_by_slug(p_slug text)
returns setof public.stands language sql stable security definer set search_path = public as $$
  select * from public.stands s
  where s.slug = p_slug and public.can_view_stand(s.id)
  limit 1;
$$;

-- The Tacos on a Stand, filtered to what THIS caller may see.
-- A private or draft Taco on a Stand is visible only to its own creator.
create or replace function public.get_stand_tacos(p_stand_id uuid)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  cover_url text,
  status text,
  published_at timestamptz,
  attached_at timestamptz,
  creator_username text,
  creator_display_name text,
  creator_founding boolean,
  ingredient_count bigint,
  reaction_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    t.id, t.slug, t.title, t.description, t.cover_url, t.status,
    t.published_at, st.created_at,
    u.username, u.display_name, u.founding_status,
    (select count(*) from public.ingredients i where i.taco_id = t.id),
    (select count(*) from public.reactions x where x.taco_id = t.id)
  from public.stand_tacos st
  join public.tacos t on t.id = st.taco_id
  join public.users u on u.id = t.creator_id
  where st.stand_id = p_stand_id
    and public.can_view_stand(p_stand_id)
    and (
      (t.status = 'published' and t.visibility in ('public','link','community'))
      or t.creator_id = auth.uid()
      or public.is_moderation()
    )
  order by st.created_at desc;
$$;

-- Public Stands directory
create or replace function public.get_public_stands(p_limit int default 24)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  cover_url text,
  event_on date,
  created_at timestamptz,
  creator_username text,
  creator_display_name text,
  taco_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    s.id, s.slug, s.title, s.description, s.cover_url, s.event_on, s.created_at,
    u.username, u.display_name,
    (select count(*) from public.stand_tacos st
       join public.tacos t on t.id = st.taco_id
       where st.stand_id = s.id and t.status = 'published' and t.visibility = 'public')
  from public.stands s
  join public.users u on u.id = s.creator_id
  where s.status = 'published' and s.visibility = 'public'
  order by s.created_at desc
  limit least(greatest(p_limit, 1), 48);
$$;

-- 5. Row-level security
alter table public.stands enable row level security;
alter table public.stand_tacos enable row level security;

-- Link-visibility Stands are reachable only through get_stand_by_slug,
-- mirroring the Taco rule.
create policy stands_select on public.stands for select using (
  (status = 'published' and visibility = 'public')
  or (status = 'published' and visibility = 'community' and auth.uid() is not null)
  or creator_id = auth.uid()
  or public.is_moderation()
);
create policy stands_insert on public.stands for insert
  with check (creator_id = auth.uid());
create policy stands_update on public.stands for update
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());
create policy stands_delete on public.stands for delete
  using (creator_id = auth.uid() or public.is_admin());

create policy stand_tacos_select on public.stand_tacos for select
  using (public.can_view_stand(stand_id));

-- You may only attach a Taco YOU created, to a Stand that is open to
-- contributions (or that you created), and that you can view.
create policy stand_tacos_insert on public.stand_tacos for insert
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.tacos t
      where t.id = taco_id and t.creator_id = auth.uid()
    )
    and exists (
      select 1 from public.stands s
      where s.id = stand_id
        and (s.creator_id = auth.uid() or (s.open_contributions and public.can_view_stand(s.id)))
    )
  );

create policy stand_tacos_delete on public.stand_tacos for delete
  using (
    added_by = auth.uid()
    or public.is_moderation()
    or exists (
      select 1 from public.stands s
      where s.id = stand_id and s.creator_id = auth.uid()
    )
  );
