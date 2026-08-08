import Link from "next/link";

export function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card p-8 text-center">
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-ink-soft max-w-md mx-auto">{body}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn btn-primary mt-5">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
