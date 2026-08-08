export function FoundingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-chile/40 bg-chile/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-chile"
      title="Founding Table contributor"
    >
      <span aria-hidden="true">&#9670;</span>
      {compact ? "Founding" : "Founding Table"}
    </span>
  );
}
