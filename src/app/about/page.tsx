import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <p className="eyebrow mb-2">About Media Taco</p>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
        People do not just want to publish. They want to be understood.
      </h1>
      <div className="mt-6 space-y-4 text-[1.02rem] leading-relaxed">
        <p>
          The media that describes a person is scattered across camera rolls,
          playlists, group chats, bookmarks, and half-remembered stories. Media
          Taco turns those scattered items into intentional collections that
          communicate meaning.
        </p>
        <p>
          A collection here is called a Taco. The items inside it are
          Ingredients: photos, songs, places, quotes, stories, and creative
          work, each with the reason it belongs. The reason is the whole point.
          There is no infinite feed to perform for, and no engagement counts to
          chase.
        </p>
        <p>
          Right now Media Taco is a proof of concept built with a Founding
          Table of 8 to 12 contributors. Their collections, feedback, and
          behavior shape what gets built next.
        </p>
        <h2 className="font-display text-xl pt-4">Community standards</h2>
        <p>
          This community prohibits harassment, hate or dehumanization, sexual
          exploitation, nonconsensual personal content, doxxing, impersonation,
          stolen copyrighted content, spam, dangerous or illegal activity, and
          deliberately misleading attribution. Every Taco and response can be
          reported, and moderators review every report.
        </p>
        <h2 className="font-display text-xl pt-4">Age and safety</h2>
        <p>
          Media Taco is for people 13 and older. Members aged 13 to 17 start
          with community-only profiles by default, and research participation
          for anyone under 18 requires a parent or guardian&apos;s documented
          consent.
        </p>
      </div>
      <Link href="/join" className="btn btn-primary mt-8">
        Join the community
      </Link>
    </div>
  );
}
