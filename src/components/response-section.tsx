import Link from "next/link";
import { addResponse, deleteResponse } from "@/app/actions/community";
import { FoundingBadge } from "@/components/founding-badge";
import { formatDate, type ResponseRow } from "@/lib/core";

export function ResponseSection({
  tacoId,
  slug,
  responses,
  currentUserId,
}: {
  tacoId: string;
  slug: string;
  responses: ResponseRow[];
  currentUserId: string | null;
}) {
  return (
    <section aria-label="Responses">
      <h2 className="font-display text-2xl mb-4">
        Responses
        {responses.length > 0 && (
          <span className="font-meta text-sm text-ink-soft ml-2 align-middle">
            {responses.length}
          </span>
        )}
      </h2>

      <div className="space-y-4">
        {responses.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm flex items-center gap-1.5">
                {r.users ? (
                  <Link
                    href={`/profile/${r.users.username}`}
                    className="font-medium hover:text-verde"
                  >
                    {r.users.display_name}
                  </Link>
                ) : (
                  <span className="font-medium">A member</span>
                )}
                {r.users?.founding_status && <FoundingBadge compact />}
                <span className="text-ink-soft">{formatDate(r.created_at)}</span>
              </p>
              {currentUserId === r.user_id && (
                <form action={deleteResponse}>
                  <input type="hidden" name="response_id" value={r.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button
                    type="submit"
                    className="text-xs text-ink-soft hover:text-chile"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
            <p className="mt-2 text-[0.95rem] leading-relaxed whitespace-pre-line">
              {r.body}
            </p>
          </div>
        ))}
        {responses.length === 0 && (
          <p className="text-sm text-ink-soft">
            No responses yet. Say what this collection reminded you of.
          </p>
        )}
      </div>

      {currentUserId ? (
        <form action={addResponse} className="mt-6 card p-4">
          <input type="hidden" name="taco_id" value={tacoId} />
          <input type="hidden" name="slug" value={slug} />
          <label htmlFor="response-body" className="label">
            Add a response
          </label>
          <textarea
            id="response-body"
            name="body"
            rows={3}
            required
            maxLength={2000}
            placeholder="What does this remind you of? What should the creator know?"
            className="field"
          />
          <button type="submit" className="btn btn-primary mt-3">
            Add response
          </button>
        </form>
      ) : (
        <p className="help mt-6">
          <Link href={`/login?next=/t/${slug}`} className="text-verde underline underline-offset-2">
            Sign in
          </Link>{" "}
          to add a response.
        </p>
      )}
    </section>
  );
}
