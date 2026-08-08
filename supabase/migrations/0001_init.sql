-- Media Taco Community : POC schema, RLS, and durable rules
-- Run order: this migration first, then seed.sql.
-- No PHI is collected or stored anywhere in this schema.
-- Minimum user age is 13. Under-13 signups are rejected at the database level (COPPA).

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. TABLES
-- =====================================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  bio text check (char_length(bio) <= 400),
  interests text[] not null default '{}',
  role text not null default 'member' check (role in ('member','founder','moderator','researcher','admin')),
  founding_status boolean not null default false,
  birth_year int not null check (birth_year between 1900 and 2100),
  is_minor boolean not null default false,
  open_to_collaboration boolean not null default false,
  profile_visibility text not null default 'public' check (profile_visibility in ('public','community','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  starter_prompt text not null,
  suggested_ingredients text[] not null default '{}',
  active boolean not null default true,
  founder_only boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.tacos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  title text not null default '' check (char_length(title) <= 120),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 300),
  introduction text not null default '' check (char_length(introduction) <= 4000),
  cover_url text,
  community_prompt text check (char_length(community_prompt) <= 300),
  visibility text not null default 'private' check (visibility in ('private','link','community','public')),
  status text not null default 'draft' check (status in ('draft','published','hidden')),
  featured boolean not null default false,
  collaborative boolean not null default false,
  inspired_by_taco_id uuid references public.tacos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  taco_id uuid not null references public.tacos(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in (
    'image','text','link','video_link','video_upload','audio',
    'location','quote','creative_project','question'
  )),
  title text not null default '' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  why_it_matters text not null default '' check (char_length(why_it_matters) <= 1000),
  media_url text,
  external_url text,
  alt_text text check (char_length(alt_text) <= 300),
  attribution text check (char_length(attribution) <= 200),
  location_name text check (char_length(location_name) <= 160),
  happened_on date,
  metadata_json jsonb not null default '{}'::jsonb,
  position int not null default 0,
  visibility text not null default 'inherit' check (visibility in ('inherit','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taco_contributors (
  id uuid primary key default gen_random_uuid(),
  taco_id uuid not null references public.tacos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  permission_level text not null default 'contributor' check (permission_level in ('contributor','editor')),
  invited_by uuid references public.users(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','accepted','declined','removed')),
  created_at timestamptz not null default now(),
  unique (taco_id, user_id)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  taco_id uuid not null references public.tacos(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('appreciate','relate','tell_me_more')),
  created_at timestamptz not null default now(),
  unique (user_id, taco_id, reaction_type)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  taco_id uuid not null references public.tacos(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  parent_response_id uuid references public.responses(id) on delete cascade,
  response_type text not null default 'text' check (response_type in ('text','image','link','video')),
  body text not null default '' check (char_length(body) <= 2000),
  media_url text,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  taco_id uuid not null references public.tacos(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, taco_id, ingredient_id)
);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  followed_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followed_user_id),
  check (follower_id <> followed_user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{4,32}$'),
  inviter_id uuid references public.users(id) on delete set null,
  invitee_email text,
  role_granted text not null default 'member' check (role_granted in ('member','founder')),
  max_uses int not null default 1 check (max_uses between 1 and 50),
  uses int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('taco','ingredient','response','user')),
  target_id uuid not null,
  reason text not null check (reason in (
    'harassment','hate','sexual_exploitation','nonconsensual_content','doxxing',
    'impersonation','copyright','spam','dangerous_activity','misleading_attribution','other'
  )),
  description text check (char_length(description) <= 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  moderator_id uuid references public.users(id) on delete set null,
  moderator_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.founder_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null check (topic in ('idea','bug','template_suggestion','community','other')),
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

-- Research: consent states are independent booleans by design.
-- Research consent never implies publication or marketing consent.
create table public.research_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  participant_code text not null unique,
  persona_type text,
  recruitment_source text,
  is_minor boolean not null default false,
  guardian_consent boolean not null default false,
  consent_research boolean not null default false,
  consent_recording boolean not null default false,
  consent_public_content boolean not null default false,
  consent_marketing boolean not null default false,
  consent_testimonial boolean not null default false,
  withdrawal_requested boolean not null default false,
  session_status text not null default 'recruited' check (session_status in ('recruited','scheduled','completed','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A minor participant requires documented guardian consent before research consent is valid.
  check (not (is_minor and consent_research and not guardian_consent))
);

create table public.research_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.research_participants(id) on delete cascade,
  facilitator_id uuid references public.users(id) on delete set null,
  session_date timestamptz not null default now(),
  session_type text not null default 'remote' check (session_type in ('remote','in_person')),
  recording_url text,
  summary text,
  completion_status text not null default 'scheduled' check (completion_status in ('scheduled','completed','partial','cancelled')),
  created_at timestamptz not null default now()
);

create table public.research_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.research_sessions(id) on delete cascade,
  task_code text not null,
  observation_type text not null default 'note' check (observation_type in ('note','success','failure','confusion','quote','feature_request')),
  note text not null check (char_length(note) <= 2000),
  severity int check (severity between 1 and 5),
  timestamp_seconds int,
  created_at timestamptz not null default now()
);

-- Analytics: event names and ids only. Never store content bodies or private text here.
create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  object_type text,
  object_id uuid,
  properties_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_tacos_creator on public.tacos (creator_id);
create index idx_tacos_public on public.tacos (status, visibility, featured, published_at desc);
create index idx_ingredients_taco on public.ingredients (taco_id, position);
create index idx_reactions_taco on public.reactions (taco_id);
create index idx_responses_taco on public.responses (taco_id, created_at);
create index idx_events_name on public.product_events (event_name, created_at);

-- =====================================================================
-- 2. HELPER FUNCTIONS (security definer, used inside policies)
-- =====================================================================

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.is_moderation()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('moderator','admin'), false);
$$;

create or replace function public.is_research()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('researcher','admin'), false);
$$;

-- Can the current user view this taco? Link visibility counts as viewable
-- because reaching it requires the slug. Listings must still filter to public.
create or replace function public.can_view_taco(t_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tacos t
    where t.id = t_id
      and (
        (t.status = 'published' and t.visibility in ('public','link','community'))
        or t.creator_id = auth.uid()
        or public.is_moderation()
        or exists (
          select 1 from public.taco_contributors c
          where c.taco_id = t.id and c.user_id = auth.uid() and c.status = 'accepted'
        )
      )
  );
$$;

create or replace function public.can_edit_taco(t_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tacos t
    where t.id = t_id
      and (
        t.creator_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1 from public.taco_contributors c
          where c.taco_id = t.id and c.user_id = auth.uid()
            and c.status = 'accepted' and c.permission_level = 'editor'
        )
      )
  );
$$;

-- Shared-by-link access path. Never exposed through listings.
create or replace function public.get_taco_by_slug(p_slug text)
returns setof public.tacos language sql stable security definer set search_path = public as $$
  select * from public.tacos t
  where t.slug = p_slug
    and (
      (t.status = 'published' and t.visibility in ('public','link','community'))
      or t.creator_id = auth.uid()
      or public.is_moderation()
      or exists (
        select 1 from public.taco_contributors c
        where c.taco_id = t.id and c.user_id = auth.uid() and c.status = 'accepted'
      )
    )
  limit 1;
$$;

create or replace function public.get_taco_ingredients(p_taco_id uuid)
returns setof public.ingredients language sql stable security definer set search_path = public as $$
  select * from public.ingredients i
  where i.taco_id = p_taco_id
    and public.can_view_taco(p_taco_id)
    and (i.visibility = 'inherit' or i.creator_id = auth.uid() or public.is_moderation())
  order by i.position asc, i.created_at asc;
$$;

-- =====================================================================
-- 3. SIGNUP TRIGGER: profile creation, age gate, invitation redemption
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_birth_year int;
  v_age int;
  v_code text;
  v_role text := 'member';
  v_founding boolean := false;
  v_invite public.invitations%rowtype;
begin
  v_birth_year := coalesce((new.raw_user_meta_data->>'birth_year')::int, 0);
  v_age := extract(year from now())::int - v_birth_year;

  if v_birth_year = 0 then
    raise exception 'Birth year is required.';
  end if;
  if v_age < 13 then
    raise exception 'Media Taco requires members to be at least 13 years old.';
  end if;

  v_code := upper(coalesce(new.raw_user_meta_data->>'invite_code', ''));
  if v_code <> '' then
    select * into v_invite from public.invitations
      where code = v_code
        and uses < max_uses
        and (expires_at is null or expires_at > now())
      for update;
    if found then
      v_role := v_invite.role_granted;
      v_founding := (v_invite.role_granted = 'founder');
      update public.invitations set uses = uses + 1 where id = v_invite.id;
    end if;
  end if;

  insert into public.users (id, email, username, display_name, birth_year, is_minor, role, founding_status, profile_visibility)
  values (
    new.id,
    new.email,
    lower(coalesce(new.raw_user_meta_data->>'username', 'member_' || substr(new.id::text, 1, 8))),
    coalesce(new.raw_user_meta_data->>'display_name', 'New member'),
    v_birth_year,
    v_age < 18,
    v_role,
    v_founding,
    -- Teen-safety default: members aged 13 to 17 start with a community-only profile.
    case when v_age < 18 then 'community' else 'public' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 4. DURABLE LIMIT TRIGGERS (source-level rules, not per-screen patches)
-- =====================================================================

-- Pilot creation limits: member 1 taco, founder 5, moderator/researcher 5, admin unlimited.
create or replace function public.enforce_taco_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_count int;
  v_limit int;
begin
  select role into v_role from public.users where id = new.creator_id;
  if v_role = 'admin' then return new; end if;
  v_limit := case when v_role = 'member' then 1 else 5 end;
  select count(*) into v_count from public.tacos where creator_id = new.creator_id;
  if v_count >= v_limit then
    raise exception 'Pilot limit reached: your account can create % Taco(s) during the proof of concept.', v_limit;
  end if;
  return new;
end;
$$;

create trigger trg_taco_limit before insert on public.tacos
  for each row execute function public.enforce_taco_limit();

-- Founders can create at most 3 invitation codes; admins are unlimited.
create or replace function public.enforce_invite_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_count int;
begin
  if new.inviter_id is null then return new; end if;
  select role into v_role from public.users where id = new.inviter_id;
  if v_role = 'admin' then return new; end if;
  if v_role <> 'founder' then
    raise exception 'Only founding contributors and admins can create invitations.';
  end if;
  if new.role_granted <> 'member' then
    raise exception 'Founding contributors can invite members only.';
  end if;
  select count(*) into v_count from public.invitations where inviter_id = new.inviter_id;
  if v_count >= 3 then
    raise exception 'Founding contributors can create up to 3 invitations during the pilot.';
  end if;
  return new;
end;
$$;

create trigger trg_invite_limit before insert on public.invitations
  for each row execute function public.enforce_invite_limit();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_users_touch before update on public.users for each row execute function public.touch_updated_at();
create trigger trg_tacos_touch before update on public.tacos for each row execute function public.touch_updated_at();
create trigger trg_ingredients_touch before update on public.ingredients for each row execute function public.touch_updated_at();
create trigger trg_participants_touch before update on public.research_participants for each row execute function public.touch_updated_at();

-- =====================================================================
-- 5. ROW-LEVEL SECURITY
-- =====================================================================

alter table public.users enable row level security;
alter table public.templates enable row level security;
alter table public.tacos enable row level security;
alter table public.ingredients enable row level security;
alter table public.taco_contributors enable row level security;
alter table public.reactions enable row level security;
alter table public.responses enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.invitations enable row level security;
alter table public.reports enable row level security;
alter table public.founder_feedback enable row level security;
alter table public.research_participants enable row level security;
alter table public.research_sessions enable row level security;
alter table public.research_observations enable row level security;
alter table public.product_events enable row level security;

-- users
create policy users_select on public.users for select using (
  profile_visibility = 'public'
  or id = auth.uid()
  or (profile_visibility = 'community' and auth.uid() is not null)
  or public.is_moderation()
);
create policy users_update on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- templates
create policy templates_select on public.templates for select using (active or public.is_admin());
create policy templates_admin on public.templates for all
  using (public.is_admin()) with check (public.is_admin());

-- tacos: listings only ever surface public + published rows.
-- Link-shared tacos are reachable only through get_taco_by_slug.
create policy tacos_select on public.tacos for select using (
  (status = 'published' and visibility = 'public')
  or creator_id = auth.uid()
  or public.is_moderation()
  or exists (
    select 1 from public.taco_contributors c
    where c.taco_id = id and c.user_id = auth.uid() and c.status = 'accepted'
  )
);
create policy tacos_insert on public.tacos for insert
  with check (creator_id = auth.uid());
create policy tacos_update on public.tacos for update
  using (public.can_edit_taco(id)) with check (public.can_edit_taco(id));
create policy tacos_delete on public.tacos for delete
  using (creator_id = auth.uid() or public.is_admin());

-- ingredients
create policy ingredients_select on public.ingredients for select using (
  public.can_view_taco(taco_id)
  and (visibility = 'inherit' or creator_id = auth.uid() or public.is_moderation())
);
create policy ingredients_insert on public.ingredients for insert
  with check (creator_id = auth.uid() and public.can_edit_taco(taco_id));
create policy ingredients_update on public.ingredients for update
  using (public.can_edit_taco(taco_id)) with check (public.can_edit_taco(taco_id));
create policy ingredients_delete on public.ingredients for delete
  using (public.can_edit_taco(taco_id));

-- contributors
create policy contributors_select on public.taco_contributors for select using (
  user_id = auth.uid() or public.can_edit_taco(taco_id) or public.is_moderation()
);
create policy contributors_insert on public.taco_contributors for insert
  with check (public.can_edit_taco(taco_id));
create policy contributors_update on public.taco_contributors for update
  using (user_id = auth.uid() or public.can_edit_taco(taco_id))
  with check (user_id = auth.uid() or public.can_edit_taco(taco_id));

-- reactions
create policy reactions_select on public.reactions for select using (public.can_view_taco(taco_id));
create policy reactions_insert on public.reactions for insert
  with check (user_id = auth.uid() and public.can_view_taco(taco_id));
create policy reactions_delete on public.reactions for delete using (user_id = auth.uid());

-- responses
create policy responses_select on public.responses for select using (
  public.can_view_taco(taco_id) and (status = 'published' or user_id = auth.uid() or public.is_moderation())
);
create policy responses_insert on public.responses for insert
  with check (user_id = auth.uid() and public.can_view_taco(taco_id));
create policy responses_update on public.responses for update
  using (user_id = auth.uid() or public.is_moderation())
  with check (user_id = auth.uid() or public.is_moderation());
create policy responses_delete on public.responses for delete
  using (user_id = auth.uid() or public.is_moderation());

-- saves and follows: private to their owner
create policy saves_all on public.saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_view_taco(taco_id));
create policy follows_select on public.follows for select
  using (follower_id = auth.uid() or followed_user_id = auth.uid());
create policy follows_insert on public.follows for insert with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete using (follower_id = auth.uid());

-- invitations: creators see their own; admins see all. Redemption happens in the signup trigger.
create policy invitations_select on public.invitations for select
  using (inviter_id = auth.uid() or public.is_admin());
create policy invitations_insert on public.invitations for insert
  with check (inviter_id = auth.uid() or public.is_admin());
create policy invitations_delete on public.invitations for delete
  using (inviter_id = auth.uid() or public.is_admin());

-- reports
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select
  using (reporter_id = auth.uid() or public.is_moderation());
create policy reports_update on public.reports for update
  using (public.is_moderation()) with check (public.is_moderation());

-- founder feedback
create policy feedback_insert on public.founder_feedback for insert
  with check (user_id = auth.uid() and public.current_app_role() in ('founder','admin'));
create policy feedback_select on public.founder_feedback for select
  using (user_id = auth.uid() or public.is_admin());

-- research: researchers and admins only. Researchers get no content-administration rights elsewhere.
create policy participants_all on public.research_participants for all
  using (public.is_research()) with check (public.is_research());
create policy sessions_all on public.research_sessions for all
  using (public.is_research()) with check (public.is_research());
create policy observations_all on public.research_observations for all
  using (public.is_research()) with check (public.is_research());

-- product events: append-only for members, readable by admins only
create policy events_insert on public.product_events for insert
  with check (auth.uid() is not null and (user_id = auth.uid() or user_id is null));
create policy events_select on public.product_events for select using (public.is_admin());

-- =====================================================================
-- 6. STORAGE: public media bucket, per-user write folders
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 26214400,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4','audio/wav']
)
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_owner_write on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_owner_update on storage.objects for update
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_owner_delete on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
