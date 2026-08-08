export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-5">
      <div className="keyline-grad mb-2" aria-hidden="true" />
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h2 className="font-display text-xl sm:text-2xl tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-ink-soft mt-1 max-w-2xl">{sub}</p>}
    </div>
  );
}
