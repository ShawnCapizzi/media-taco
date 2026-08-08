import Link from "next/link";

export const metadata = { title: "How to use Media Taco" };

const STEPS = [
  {
    n: "01",
    title: "Pick a template",
    body: "Go to Create and choose a starting point: The Taco That Explains Me, A Memory I Want to Keep, My Taste Right Now, My Creative DNA, Our Community Taco, or A Place Worth Knowing. Or start from scratch.",
  },
  {
    n: "02",
    title: "Add Ingredients",
    body: "An Ingredient is one meaningful thing: a photo, a song, a place, a quote, a story, a link, a short video. Add each one, then fill in the Why It Matters note. That note is the whole point; it is what makes the item yours.",
  },
  {
    n: "03",
    title: "Publish and share",
    body: "Choose who sees it: private, shared by link, community only, or public. Publish, copy the link, and send it to the people it was made for. They can react, respond, or build their own version.",
  },
];

const FAQS = [
  {
    q: "What is a Taco?",
    a: "A collection with a purpose. Not a feed, not a profile: a set of things you chose on purpose, in an order you chose, with the reasons attached.",
  },
  {
    q: "What can I put in one?",
    a: "Photos and short videos you upload, plus links from around the web. Paste a YouTube, Vimeo, TikTok, Spotify, SoundCloud, or Reddit link and it plays right inside your Taco. Instagram and Facebook links appear as clean cards that open the post. Everything linked stays on its original platform; Media Taco never copies it.",
  },
  {
    q: "What does Why It Matters mean?",
    a: "Every Ingredient has a note field for the story or reason behind it. A photo of a diner means nothing; a photo of the diner where your grandfather ate every Friday for 30 years means everything. Write the second one.",
  },
  {
    q: "Who can see my Taco?",
    a: "You decide, per Taco. Private is only you. Shared by link means only people you send the link to; it never appears in Explore. Community means signed-in members with the link. Public means anyone can find it.",
  },
  {
    q: "What are the reactions?",
    a: "Appreciate, I Relate, and Tell Me More. No likes, no counts to chase. Tell Me More is an invitation: the creator sees that someone wants the longer version of the story.",
  },
  {
    q: "What is Create My Version?",
    a: "See a Taco you love? One tap starts your own with the same template and prompt, credited to the original. Your version starts empty; their memories stay theirs.",
  },
  {
    q: "What is a Stand?",
    a: "A shared shelf of Tacos around one thing: a vacation, a birthday, a show, a work event. Everyone builds their own Taco and adds it to the Stand, so every memory keeps its author. Open one from the Stands page.",
  },
  {
    q: "How many Tacos can I make?",
    a: "During the pilot, members get 1 and founding contributors get 5. Small on purpose: one great collection beats ten thin ones.",
  },
];

export default function HowToPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="keyline-grad mb-3" aria-hidden="true" />
      <p className="eyebrow mb-2">Quick sheet</p>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
        How to build a <span className="text-grad-blue">Taco</span>
      </h1>
      <p className="text-ink-soft mt-3 max-w-xl">
        Three steps, five minutes, one collection that says more about you than
        a hundred posts.
      </p>

      <ol className="mt-10 space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="card p-5 flex gap-4">
            <span className="font-display text-lg text-grad-blue shrink-0" aria-hidden="true">
              {s.n}
            </span>
            <div>
              <h2 className="font-display text-base">{s.title}</h2>
              <p className="text-sm text-ink-soft mt-1 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/create" className="btn btn-primary">
          Start your first Taco
        </Link>
        <Link href="/explore" className="btn btn-secondary">
          See examples first
        </Link>
      </div>

      <section className="mt-14">
        <div className="keyline-grad mb-3" aria-hidden="true" />
        <h2 className="font-display text-xl sm:text-2xl tracking-tight">
          Good to know
        </h2>
        <dl className="mt-5 space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="card p-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="text-sm text-ink-soft mt-1.5 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 card p-6 border-verde/40 bg-verde-soft/50">
        <p className="eyebrow mb-2">At a live event?</p>
        <p className="text-sm leading-relaxed">
          Join with the invite code on the event sheet, then open the
          event&apos;s Stand. Build your own quick Taco of the night: the line
          that stuck, the band playing when something shifted, a photo, the
          poem, and add it to the Stand. Everyone&apos;s Tacos side by side is
          the room&apos;s collective memory. Live streams play right inside a
          Taco and stay as the archive afterward.
        </p>
      </section>
    </div>
  );
}
