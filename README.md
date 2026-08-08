# Media Taco Community (proof of concept)

Collections-first social platform. Users build **Tacos** (themed collections)
out of **Ingredients** (media items plus the reason each one matters). No
chronological feed, no engagement metrics on display, community of 8 to 12
founding contributors first.

Stack: Next.js 15 (App Router) / TypeScript / Tailwind / Supabase (auth, Postgres
with RLS, storage) / Vercel.

## Setup order matters: Supabase first, then env vars, then deploy

### 1. Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (whole file, one run).
3. Then run `supabase/seed.sql` (templates, invite codes, demo account, three demo Tacos).
4. In Authentication -> Providers, confirm Email is enabled. For the pilot,
   turning OFF "Confirm email" makes signups instant; leave it on if you want
   verification emails.
5. In Authentication -> URL Configuration, set the Site URL to your deployed
   domain and add `http://localhost:3000` to redirect URLs for local work.

If the hosted SQL editor rejects the demo `auth.users` insert, the fallback is
written in a comment at the top of `seed.sql`: create the user in the dashboard
and re-run the file with the new UUID.

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Both Supabase values are in Project Settings -> API.

### 3. Run locally

```
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push this repo to GitHub (exact commands below).
2. Vercel -> Add New Project -> import the repo. Framework preset: Next.js.
3. Add the three environment variables, with `NEXT_PUBLIC_SITE_URL` set to the
   production URL.
4. Deploy. Vercel auto-deploys `main` from then on.

## Demo access

- Demo admin: `demo@mediataco.community` / `media-taco-demo-2026`
- Invite codes seeded: `FOUNDING-TABLE` (12 founder seats), `FIRST-BITE`
  (25 member seats), `DRY-RUN` (2 founder seats for testing).
- Three published demo Tacos show the format: an identity Taco, a memory Taco,
  and a creative DNA Taco.

## Product rules encoded in the database

- Age gate: 13+ enforced in the signup trigger. Members aged 13 to 17 get
  community-only profiles by default.
- Members can create 1 Taco during the pilot; founders, moderators, and
  researchers get 5; admins unlimited. Enforced by trigger, not UI.
- Founders can create 3 member invitations, enforced by trigger.
- Tacos shared by link never appear in listings; they are reachable only
  through the `get_taco_by_slug` function.
- Research consent states are independent; minors additionally require
  guardian consent (CHECK constraint).
- `product_events` stores event names and ids only, never content bodies.

## Structure

```
supabase/           migration + seed (run in Supabase SQL editor)
src/app/            routes: /, /explore, /t/[slug], /create, /home,
                    /profile/[username], /founding-table, /admin, /research,
                    /join, /login, /about
src/app/actions/    server actions (auth, tacos, ingredients, community, admin)
src/components/     UI components; ingredient-card.tsx carries the signature
                    "why it matters" treatment
src/lib/            supabase clients, types, analytics
```

See `DECISIONS.md` for the judgment calls made during the one-shot build.
