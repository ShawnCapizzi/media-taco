import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createStand } from "@/app/actions/stands";
import { VISIBILITY_OPTIONS } from "@/lib/core";

export const metadata = { title: "Open a Stand" };

export default async function NewStandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/stands/new");
  const { error } = await searchParams;

  return (
    <div className="stand-world">
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="keyline-grad mb-3" aria-hidden="true" />
      <p className="eyebrow mb-2">A shared shelf of Tacos</p>
      <h1 className="font-head font-semibold text-3xl sm:text-4xl tracking-tight">
        Open a <span className="text-grad-blue">Stand</span>
      </h1>
      <p className="text-sm text-ink-soft mt-2 max-w-md">
        A Stand collects everyone&apos;s Tacos around one thing: a trip, a
        birthday, a show, a night worth keeping. Each Taco stays its
        creator&apos;s own.
      </p>
      {error && (
        <p role="alert" className="alert p-3 text-sm mt-4">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={createStand} className="mt-8 space-y-4">
        <div>
          <label htmlFor="st-title" className="label">
            Name the Stand
          </label>
          <input
            id="st-title"
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="CT Live: Words and Sound"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="st-description" className="label">
            One line about it
          </label>
          <input
            id="st-description"
            name="description"
            type="text"
            maxLength={300}
            placeholder="One night, one room, everyone brings a Taco."
            className="field"
          />
        </div>
        <div>
          <label htmlFor="st-event-on" className="label">
            Event date (optional)
          </label>
          <input id="st-event-on" name="event_on" type="date" className="field max-w-[200px]" />
        </div>
        <div>
          <label htmlFor="st-visibility" className="label">
            Who can see it
          </label>
          <select id="st-visibility" name="visibility" defaultValue="public" className="field">
            {VISIBILITY_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}: {v.hint}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-start gap-2">
          <input
            id="st-open"
            name="open_contributions"
            type="checkbox"
            defaultChecked
            className="mt-1"
          />
          <label htmlFor="st-open" className="text-sm">
            Open Stand: any member who can see it can add their own Taco.
            Unchecked, only you can add.
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Open the Stand
        </button>
      </form>
    </div>
    </div>
  );
}
