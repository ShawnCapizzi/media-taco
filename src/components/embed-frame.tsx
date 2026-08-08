import { parseEmbed } from "@/lib/embeds";

// Renders social and media URLs as inline players where the platform allows
// it. The media file stays on the original platform's servers; Media Taco
// only frames it.
export function EmbedFrame({ url, title }: { url: string; title: string }) {
  const info = parseEmbed(url);
  if (!info) return null;

  if (!info.embedUrl) {
    // Link-card providers (Instagram, Facebook)
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-center justify-between gap-3 p-4 hover:border-verde transition-colors"
      >
        <span className="min-w-0">
          <span className="chip chip-blue mb-1">{info.label}</span>
          <span className="block text-sm font-medium truncate">{title}</span>
          <span className="block text-xs text-ink-soft truncate">{url}</span>
        </span>
        <span aria-hidden="true" className="text-verde shrink-0">
          &rarr;
        </span>
      </a>
    );
  }

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-card border border-line bg-ink/5"
        style={{ paddingBottom: `${info.aspectPercent}%` }}
      >
        <iframe
          src={info.embedUrl}
          title={title || `${info.label} embed`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="help mt-1">
        Playing from {info.label}. The original stays on their servers.
      </p>
    </div>
  );
}
