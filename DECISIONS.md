# Build decisions log

Refinements made during the one-shot POC build, in the spirit of the PRD's
master instruction (preserve the Taco/Ingredient model, no generic feed,
privacy hard-enforced).

## 1. Age gate: 13+, not 12+
The request said ages 12 to 45. Twelve-year-olds are under COPPA, which
requires verifiable parental consent infrastructure that is out of POC scope
and a legal liability to fake. The floor is 13, enforced in the database
signup trigger (not just the form), matching standard social-platform
practice. Teen-safety defaults on top of that: members aged 13 to 17 are
flagged `is_minor` and start with community-only profile visibility. Research
participation for minors requires documented guardian consent, enforced with
a CHECK constraint so an invalid consent state cannot be recorded.

## 2. Link visibility is an access path, not a listing state
`visibility = 'link'` Tacos are excluded from every listing query AND from the
tacos RLS select policy. They are reachable only through the security-definer
function `get_taco_by_slug`, which requires knowing the slug. This makes
"private Tacos never publicly exposed" a database property instead of a
front-end promise.

## 3. Durable limits live in triggers
Member 1-Taco / founder 5-Taco pilot limits and the founder 3-invite limit are
Postgres triggers. Screens can change; the rule holds everywhere, including
the API.

## 4. Prompts simplified
The PRD's separate `prompts` table collapsed into `templates.starter_prompt`
(creation guidance) plus `tacos.community_prompt` (the question a creator asks
viewers). Same product behavior, one less join, and prompts stay attached to
the collection they belong to.

## 5. Communities tables deferred
The PRD marks group spaces as post-POC. The "Our Community Taco" template plus
collaborative flag covers the P0 story (a group builds one collection) without
the memberships/moderation surface of full communities.

## 6. Create My Version clones structure, never content
`inspired_by_taco_id` records attribution. The clone copies template, title
(prefixed), and prompt. It never copies the original creator's Ingredients,
which are personal by definition.

## 7. Analytics are names and ids only
`product_events` records event names, object ids, and coarse properties
(counts, booleans). No content bodies, no private text. The PRD's success
metrics (percent of Tacos with 3+ context Ingredients, response rates) are
computable from this without storing anything sensitive.

## 8. Video upload capped by storage policy
Founding contributors get direct video upload per the PRD. The storage bucket
caps files at 25MB with an allowed MIME list, which naturally enforces the
"90 seconds or less" spirit without a transcoding pipeline.

## Deferred to production (noted, not built)
- Real-time collaborative editing (contributor model and RLS are in place)
- Email notifications, OG share-card image generation
- Full communities/groups, algorithmic discovery (deliberately absent)
- COPPA parental-consent flow if under-13 access ever becomes a requirement

# Session 02 additions

## 9. Michroma, self-hosted under OFL
Display font switched to Michroma (SIL Open Font License, license file at
src/fonts/OFL.txt), self-hosted via next/font/local. No Google runtime
request, no licensing exposure. The requested Insignia LT Std is a commercial
Linotype face; the free webfont mirrors of it are unlicensed copies, which
the platform's own community standards prohibit. Michroma carries the same
wide 80s-tech geometry legally. The Why It Matters note deliberately stays in
a serif italic: the human voice against Michroma's machine voice.

## 10. Palette v2
White-forward surfaces on a sandy masa base with a faint SVG grain texture.
Verde and chile retained; mango, avocado, and a deep blue added as pops. The
blue always travels with its gradient (blue to violet), used at roughly 5
percent: section keylines, one hero phrase, numbered steps. Reactions now
carry the pops: Appreciate is verde, I Relate is mango, Tell Me More is blue.

## 11. Social content is embedded, never copied
video_link, audio, and link Ingredients now render inline players for
YouTube, Vimeo, Spotify, SoundCloud, TikTok, and Reddit, parsed by
src/lib/embeds.ts with an allowlisted set of embed hosts. The media file
always stays on the original platform's servers; Media Taco frames it and
says so under every player. Instagram and Facebook render as labeled link
cards because Meta requires an approved developer app for inline embeds;
that review can run in parallel if the pilot demands it. Live video for
events: stream to YouTube Live, paste the URL, it plays live in the Taco and
remains as the archive.

## 12. How-to and event sheet
/how-to is the in-app quick guide. /event-sheet is a printable US Letter
one-pager with a QR code to /join?code=FIRST-BITE for live events. The QR
image uses api.qrserver.com at render time; the URL is printed beside it as
the fallback if that service is ever unavailable.

# Session 03 additions

## 13. Native share sheet
Share now opens the OS share tray on phones and tablets (text, AirDrop,
post anywhere) via navigator.share, with clipboard copy as the desktop
fallback and a prompt as the last resort. Closing the sheet is respected
as a choice, not treated as an error.

## 14. Trending is earned, not engineered
get_trending_tacos (migration 0002) scores public published Tacos by recent
reactions (1x), responses (2x, conversation outranks a tap), and saves
(1.5x) over a selectable window, with recency as the tiebreaker so a young
community still surfaces content. It is a security-definer function that can
only see public published rows by construction. There is still no
algorithmic feed: trending is one sort on one page, chosen by the user.

## 15. Explore leads with proof, not promises
Bold uppercase header, a live public-collection counter
(get_public_taco_count), time-window sorts (Newest, This week, This month,
Featured), and a horizontally scrollable chip row. The counter and the "no
ads, no algorithm" line state the anti-feed positioning where discovery
actually happens.

## 16. Interaction layer, CSS-first
Card hover lift and image zoom, staggered hero fade-up, button press
depression, sticky nav with a gradient hairline and a hard Create CTA. All
CSS; prefers-reduced-motion neutralizes every animation. Verified in built
output, not just source.

# Session 04 additions

## 17. Paste-first ingredient flow
The type picker leads with Link, then Image. In the form, the link or upload
field comes first and the title second: people paste the thing, then name
it. Non-embeddable links fetch an Open Graph preview on blur (server action
with SSRF guards: private ranges blocked, 6s timeout, HTML-only, 400KB cap)
and render rich cards. Players beat previews; previews beat plain links.
Instagram and most Meta pages block scrapers, so their previews degrade
gracefully to labeled cards.

## 18. Required: a title. Everything else: one tap or optional.
The only hard requirement to save an Ingredient is a title. Vibe tags
(one-tap feeling chips like I can relate, Retro, Core memory) add
relate-ability without a text field. Why It Matters stays optional but
prominent. Vibes and previews live in metadata_json: no schema migration.

## 19. The dead publish button
Root cause: the title field used the template name as a placeholder, so it
looked filled while the real value was empty, and Publish requires a title.
Fixed three ways: choosing a template now seeds a real, editable title; the
placeholder no longer masquerades; and a disabled Publish button says
exactly why it is disabled.

## 20. Alerts are burnt orange, drafts included
New alert surface: burnt orange with ink text, used for the draft banner
and draft pills. State that matters should not whisper in beige.

## 21. Less tan, more color blocking
Base lightened. Every Ingredient type carries its own accent: a colored
left bar and matching eyebrow (links blue, images mango, stories verde,
video and quotes violet, audio chile, places avocado). Ingredient titles
moved from wide display type to bold sans with wrapping fixes: Michroma
stays at the page level where it belongs.

# Session 05 additions

## 22. Stands: nested Tacos with intact ownership
A Stand is a shared shelf of Tacos: a vacation, a birthday, an event.
Migration 0003 adds stands and stand_tacos with the same visibility grammar
as Tacos (link-visibility Stands reachable only through get_stand_by_slug).
The collective-documentation answer: instead of contributing to someone
else's Taco, everyone builds their own and parks it on the Stand, so every
memory keeps its author. Rules, all enforced in RLS, verified by execution
with per-session auth claims: you can only attach a Taco you created; open
Stands accept any viewer's Taco, closed Stands only the creator's; a
private or draft Taco on a Stand is visible only to its own creator
(proved: creator sees 3, stranger sees 2); removal by the taco owner, the
Stand owner, or moderation. Limits mirror Tacos: members 1 Stand, founders
5, admins unlimited.

## 23. Founding Table: 100 seats
FOUNDING-TABLE now carries 100 uses. 0001 capped invitation codes at 50
uses, which the verification gate caught before it broke the live database;
0003 raises the ceiling to 500 first, then sets 100. Founder mechanics are
unchanged: 5 Tacos, 5 Stands, 3 member invites, permanent badge.

## 24. Live in the room, without live infrastructure
Stand pages carry a Live indicator and refresh themselves every 15 seconds
while visible (a client-side router.refresh poll). Project the Stand page
behind the stage and the room watches its own memory build. No websockets,
no realtime service, no added cost. Stage video remains the YouTube Live
embed path.

## 25. The event sheet points at the Stand
/event-sheet now teaches the three-step Stand flow (join, build your quick
Taco, add it to the Stand) and accepts ?stand=slug so the QR code sends
people straight to the night's Stand.

# Session 06 additions

## 26. Stands discovery: nav, Your Stands, invite
Stands were shipped but hidden: only in the footer and a Home strip, with no
"my Stands" anywhere and no top-nav entry. Fixed three ways. (1) Stands is
now in the desktop top nav, and on mobile it lives in both a new slide-in
hamburger menu and a persistent bottom bar (Home, Explore, Stands, Create),
so it is always one tap away. The old nav had no mobile menu at all, so
secondary links were unreachable on phones; that is fixed. (2) A new
get_my_stands() function (migration 0006) returns the Stands you created or
added a Taco to, surfaced as a "Your Stands" section on both the Stands page
and Home, with an owner/participant chip and a count of how many of the
Tacos are yours. (3) The Stand page's "Add your Taco" box is now loud (a
2px verde border, keyline, larger heading) and the header carries an
"Invite people to add" button that shares or copies a warm, specific
message telling people exactly what to do.

## 27. get_my_stands ownership semantics
The function unions Stands you created with Stands you contributed a Taco
to, deduped, with is_owner true if you created it. Verified by execution
with per-session auth: the owner sees their Stand as owner with the full
taco count and their own count; a participant sees the same Stand as
non-owner with their own count; a stranger sees nothing.

# Session 07 additions

## 28. The shared Stand link is the onboarding funnel
A stranger tapping a Stand link from Facebook is the moment the product
either explains itself or loses them. The signed-out Stand view now carries
a full onboarding hero instead of one thin sign-in line: what a Stand is
("everyone who was part of it adds their own small collection"), three
numbered steps, and Join / Sign in buttons that carry the destination.
Share links can carry an invite code: /s/<slug>?code=FOUNDING-TABLE threads
the code into the Join button automatically.

## 29. The loop closes: join returns you, publish attaches you
Signup now honors a next parameter (path-only, validated), so joining from
a Stand puts you back on that Stand. From there, "Build a new Taco for
this Stand" opens the wizard with ?stand=<slug>; a banner says the Taco
will land on the Stand; on publish, a new attachTacoToStandBySlug action
attaches it (RLS still enforces every rule; duplicate attach is success)
and returns you to the Stand with a welcome banner. One tap from Facebook
to "your Taco is on the shelf" with no navigation knowledge required.

## 30. Stands unfurl properly when shared
Stand pages emit Open Graph tags (title, description with an "add your
own" nudge, site URL), so the Facebook and iMessage link cards read like
an invitation instead of a bare URL.

# Session 07 hotfix

## 31. Mobile menu showed only the header
The slide-in panel used anim-fade-up, whose keyframes start at opacity 0
with animation-fill-mode both. When the panel mounted and the animation did
not fire, the contents stayed at opacity 0, so only the statically painted
"Media" header showed. Fix: removed anim-fade-up from the panel, changed the
utility's fill-mode to forwards, and added a prefers-reduced-motion
fallback that forces full visibility. Verified all nav links present and the
panel no longer carries the animation class.

# Session 08 additions

## 32. Two-voice type system: Michroma and Fraunces
Fraunces (variable, self-hosted, SIL OFL) joins Michroma. Michroma stays
the brand and machine voice: the logo, page-level identity. Fraunces is the
warm editorial voice: section headings, Taco and Stand card titles, and
every headline in the Stand world. The pairing reads current to a younger
audience and is far more comfortable at size for older eyes than a wide
techno face.

## 33. Stands are the blue world
The rest of the site is warm cream and verde; Stand routes (/stands,
/stands/new, /s/[slug]) open on a cool blue-tinted field that fades into
the cream, with blue eyebrows and a blue-bordered onboarding hero. The
shared space looks like a different room because it is one. Stand cards
elsewhere already carried blue chips, so the association holds site-wide.

## 34. Readability pass for the room
Tuned for a 55-plus crowd on phones in a BBQ joint: the Stand hero moved
from small to base text with relaxed leading, the numbered steps grew, the
Join button gained size and padding, and a reassurance line ("Takes about
two minutes. Free, no ads, 13 and up.") sits under the buttons. Larger
targets, fewer doubts, same funnel.

# Session 09 additions

## 35. Reduction pass: one action per zone
The Stand header carried three floating controls in mixed styles. Now: the
LIVE indicator lives quietly inside the eyebrow line, and the header holds
exactly one action pair, Invite (primary, because at an event the owner's
job is filling the room) and Share (secondary). The contribute box leads
with a single primary CTA, Build a new Taco for this Stand, followed by an
"Or add one you already made" list where each Taco is a clean row with a
small Add pill, replacing user-titled chip buttons that broke composition.

## 36. Pill geometry and 44-point targets
Buttons moved to full pill radius with a 44px minimum height (Apple HIG tap
target), refined shadows, active-press scale, and a btn-sm variant for
in-row actions. Form fields grew to match with a visible focus ring.
Consistent geometry is most of what reads as "designed."

## 37. Empty covers are designed, not missing
The dead pale block with a lone letter became a monogram treatment: a
deterministic gradient field chosen from four curated palette pairs by
title hash, with a large Fraunces italic initial at low ink opacity. Stable
per Taco, never AI, never stock, always composed.
