-- Media Taco Community : seed data
-- Run after 0001_init.sql.
--
-- The demo account insert into auth.users works on local Supabase and most hosted
-- projects. If your hosted project rejects it, create demo@mediataco.community in
-- the dashboard (Authentication -> Users -> Add user, with user metadata
-- {"username":"mediataco","display_name":"Media Taco Team","birth_year":1985}),
-- copy the new UUID over 11111111-1111-4111-8111-111111111111 below,
-- delete the auth.users insert block, and re-run this file.

-- =====================================================================
-- 1. TEMPLATES (six launch templates from the PRD)
-- =====================================================================

insert into public.templates (name, slug, description, starter_prompt, suggested_ingredients, position) values
('The Taco That Explains Me', 'explains-me',
 'A broad personal introduction built from the things that shaped you.',
 'What would someone understand about you after experiencing this collection?',
 array['One song','One film or show','One food','One place','One object','One memory','One piece of advice','One creative influence'], 1),
('A Memory I Want to Keep', 'memory-to-keep',
 'A personal, family, travel, school, neighborhood, or event story worth preserving.',
 'What details would be lost if you did not record them?',
 array['Photos','People','Place','Music','Food','Object','Story','What happened afterward'], 2),
('My Taste Right Now', 'taste-right-now',
 'Lightweight cultural and interest sharing: what you are into at this moment.',
 'What are you returning to, recommending, or thinking about right now?',
 array['Music','Movies','Shows','Books','Food','Products','Places','Creators'], 3),
('My Creative DNA', 'creative-dna',
 'A creative profile: the work, influences, and process that define how you make things.',
 'What shaped the way you make and solve things?',
 array['Work sample','Influence','Process artifact','Tool','Collaboration story','Challenge','Result','What you want to do next'], 4),
('Our Community Taco', 'community-taco',
 'A collaborative collection built by a group about the group.',
 'What should someone understand about this group?',
 array['Shared photos','Quotes','Recommendations','Events','Memories','People','Places','Community history'], 5),
('A Place Worth Knowing', 'place-worth-knowing',
 'A local, travel, cultural, restaurant, event, or neighborhood discovery.',
 'Why is this place more meaningful than a standard recommendation?',
 array['Location','Images','Personal story','Recommendation','Best time to go','What to notice','Nearby places','Community context'], 6);

-- =====================================================================
-- 2. INVITATION CODES
-- =====================================================================

insert into public.invitations (code, role_granted, max_uses, invitee_email) values
('FOUNDING-TABLE', 'founder', 12, null),
('FIRST-BITE', 'member', 25, null),
('DRY-RUN', 'founder', 2, null);

-- =====================================================================
-- 3. DEMO ACCOUNT
-- =====================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated',
  'demo@mediataco.community',
  crypt('media-taco-demo-2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"mediataco","display_name":"Media Taco Team","birth_year":1985,"invite_code":""}',
  now(), now()
)
on conflict (id) do nothing;

-- The signup trigger created the profile row. Promote it and add detail.
update public.users set
  role = 'admin',
  founding_status = true,
  bio = 'The first table setter. We build the examples, keep the lights on, and hand the room to the Founding Table.',
  interests = array['music','food','neighborhoods','photography','storytelling'],
  display_name = 'Media Taco Team'
where id = '11111111-1111-4111-8111-111111111111';

-- =====================================================================
-- 4. DEMO TACO 1: identity and taste
-- =====================================================================

insert into public.tacos (id, creator_id, template_id, title, slug, description, introduction, community_prompt, visibility, status, featured, published_at)
select
  '22222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111111',
  t.id,
  'The Movies, Music, and Food That Explain Me',
  'movies-music-food-that-explain-me',
  'Eight things that say more about me than a bio ever could.',
  'If you looked at my resume you would learn what I do. This collection is about why I am the way I am. Every item here has a story attached, and the stories matter more than the items.',
  'What one song, one movie, and one food would explain you?',
  'public', 'published', true, now()
from public.templates t where t.slug = 'explains-me';

insert into public.ingredients (taco_id, creator_id, type, title, description, why_it_matters, external_url, position) values
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'audio',
 'The song from the kitchen radio',
 'An oldies station played every Sunday while sauce cooked on the stove. One song always came on around noon.',
 'I cannot separate this song from the smell of garlic and the sound of my family talking over each other. It is the closest thing I have to a time machine.',
 null, 1),
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'text',
 'The movie I have seen forty times',
 'A crime epic I watched with my father, who paused it constantly to explain who everyone was.',
 'The pausing was the point. The movie taught me that the story around a story is where the meaning lives, which is basically what this whole platform believes.',
 null, 2),
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'quote',
 'Advice from my first boss',
 'She said: nobody remembers what you shipped, they remember how it felt to work on it with you.',
 'I have tested this against fifteen years of projects and she has never once been wrong.',
 null, 3),
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'location',
 'The corner slice shop',
 'A pizza counter with four stools, no menu, and a guy who knew every order on the block.',
 'It was the first place I understood that a business can be a community institution. Everything I believe about neighborhoods starts at that counter.',
 null, 4),
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'creative_project',
 'The first thing I ever made that strangers used',
 'A hand-coded fan page for a local band, built in a summer, visited by people I had never met.',
 'Watching strangers use something I made rewired my sense of what was possible. I have been chasing that feeling professionally ever since.',
 null, 5);

-- =====================================================================
-- 5. DEMO TACO 2: memory and storytelling
-- =====================================================================

insert into public.tacos (id, creator_id, template_id, title, slug, description, introduction, community_prompt, visibility, status, featured, published_at)
select
  '22222222-2222-4222-8222-222222222202',
  '11111111-1111-4111-8111-111111111111',
  t.id,
  'A Summer Memory Worth Keeping',
  'a-summer-memory-worth-keeping',
  'One July week at the shore, preserved before the details fade.',
  'My grandmother rented the same small house near the boardwalk every July for nineteen years. This is my attempt to keep the week that mattered most, told through the things we would have thrown away.',
  'What summer would you preserve if you could only keep one?',
  'public', 'published', true, now()
from public.templates t where t.slug = 'memory-to-keep';

insert into public.ingredients (taco_id, creator_id, type, title, description, why_it_matters, location_name, position) values
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'location',
 'The house on the corner of 12th',
 'Green shutters, a porch swing that squeaked in a specific rhythm, and an outdoor shower that never got warm.',
 'Every family has a place that functions as the capital city of its memories. This was ours. The house is gone now, which is exactly why this entry exists.',
 'Jersey Shore, NJ', 1),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'text',
 'The boardwalk sausage sandwich rule',
 'My grandfather held that a sausage and pepper sandwich could only be eaten standing up, facing the ocean. No exceptions, not even in rain.',
 'It was a joke that hardened into a family law. Rules like this are how a family writes its own constitution, one ridiculous clause at a time.',
 null, 2),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'audio',
 'The arcade change machine',
 'The mechanical clunk-and-cascade of quarters, which meant the evening was officially starting.',
 'Sounds hold memories that photos cannot. I would trade a hundred pictures of that arcade for one clean recording of that machine.',
 null, 3),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'text',
 'What happened afterward',
 'The last summer, we did not know it was the last summer. The house sold in the spring, and the family scattered to different traditions.',
 'This is the entry that makes the collection honest. Memory collections need endings, even unresolved ones, or they are just nostalgia.',
 null, 4);

-- =====================================================================
-- 6. DEMO TACO 3: creative identity
-- =====================================================================

insert into public.tacos (id, creator_id, template_id, title, slug, description, introduction, community_prompt, visibility, status, featured, published_at)
select
  '22222222-2222-4222-8222-222222222203',
  '11111111-1111-4111-8111-111111111111',
  t.id,
  'My Creative DNA',
  'my-creative-dna',
  'The influences, tools, and turning points behind how I make things.',
  'A portfolio shows finished work. This shows the machinery: what I stole from, what I failed at, and what I reach for when a project is stuck. If you want to know whether we would work well together, this is more useful than my best case study.',
  'What is the one influence your work could not exist without?',
  'public', 'published', true, now()
from public.templates t where t.slug = 'creative-dna';

insert into public.ingredients (taco_id, creator_id, type, title, description, why_it_matters, position) values
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'creative_project',
 'The project that almost failed',
 'A launch that was rescued in the final two weeks by throwing out the clever version and shipping the clear version.',
 'It taught me my most durable professional rule: clarity beats cleverness every single time the two are in conflict.',
 1),
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'image',
 'A page from my sketchbook',
 'Thumbnail sketches, most of them bad on purpose, exploring twelve directions in twenty minutes.',
 'People think creative work starts with a good idea. It starts with volume. This page is what volume looks like before anyone sees the polished result.',
 2),
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'text',
 'The influence I do not talk about enough',
 'A high school art teacher who graded process, not product. She wanted to see the three versions you rejected.',
 'She is the reason I document my work. Half my professional habits are her classroom rules wearing a trench coat.',
 3),
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'question',
 'What I want to make next',
 'Something collaborative. I have spent years making things for people and I want to spend the next stretch making things with them.',
 'Stating an ambition in public is a commitment device. This entry exists so people can hold me to it.',
 4);
