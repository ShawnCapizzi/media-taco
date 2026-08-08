import {
  INGREDIENT_ACCENTS,
  VIBES,
  ingredientLabel,
  type Ingredient,
} from "@/lib/core";
import { EmbedFrame } from "@/components/embed-frame";
import { parseEmbed } from "@/lib/embeds";

function isVideoFile(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function isAudioFile(url: string) {
  return /\.(mp3|m4a|wav)(\?|$)/i.test(url);
}

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const label = ingredientLabel(ingredient.type);
  const accent = INGREDIENT_ACCENTS[ingredient.type];
  const embed = ingredient.external_url ? parseEmbed(ingredient.external_url) : null;
  const preview = ingredient.metadata_json?.preview;
  const vibe = ingredient.metadata_json?.vibe;
  const vibeIndex = vibe ? VIBES.indexOf(vibe) : -1;
  const vibeChip = ["chip-mango", "chip-blue", "chip-avocado"][
    (vibeIndex >= 0 ? vibeIndex : 0) % 3
  ];
  // Players beat previews; previews beat plain links.
  const showPlayer = !!embed?.embedUrl;
  const showPreview = !showPlayer && !!preview && (preview.title || preview.image);

  return (
    <article className="card relative overflow-hidden p-5 pl-6">
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${accent.bar}`}
        aria-hidden="true"
      />
      <div className="flex items-center gap-2 mb-2">
        <p className={`eyebrow ${accent.eyebrow}`}>{label}</p>
        {vibe && <span className={`chip ${vibeChip}`}>{vibe}</span>}
      </div>
      <h3 className="font-semibold text-lg leading-snug break-words text-balance">
        {ingredient.title}
      </h3>

      {ingredient.media_url && ingredient.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ingredient.media_url}
          alt={ingredient.alt_text ?? ingredient.title}
          className="mt-3 w-full rounded-lg border border-line object-cover max-h-[420px]"
        />
      )}

      {ingredient.media_url && isVideoFile(ingredient.media_url) && (
        <video
          controls
          preload="metadata"
          className="mt-3 w-full rounded-lg border border-line max-h-[420px]"
          aria-label={ingredient.alt_text ?? ingredient.title}
        >
          <source src={ingredient.media_url} />
          Your browser cannot play this video.{" "}
          <a href={ingredient.media_url}>Open the file instead.</a>
        </video>
      )}

      {ingredient.media_url && isAudioFile(ingredient.media_url) && (
        <audio
          controls
          preload="metadata"
          className="mt-3 w-full"
          aria-label={ingredient.alt_text ?? ingredient.title}
        >
          <source src={ingredient.media_url} />
        </audio>
      )}

      {showPlayer && ingredient.external_url && (
        <div className="mt-3">
          <EmbedFrame url={ingredient.external_url} title={ingredient.title} />
        </div>
      )}

      {showPreview && ingredient.external_url && (
        <a
          href={ingredient.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="card group mt-3 block overflow-hidden transition-all hover:border-verde hover:shadow-lift"
        >
          {preview!.image && (
            <div className="aspect-[2/1] overflow-hidden bg-verde-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview!.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className="p-3">
            <p className="text-sm font-semibold leading-snug line-clamp-2">
              {preview!.title ?? ingredient.title}
            </p>
            {preview!.description && (
              <p className="text-xs text-ink-soft mt-1 line-clamp-2">
                {preview!.description}
              </p>
            )}
            <p className="font-meta text-[10px] text-ink-soft mt-1.5 uppercase tracking-wider">
              {preview!.site ?? new URL(ingredient.external_url).hostname.replace(/^www\./, "")}
            </p>
          </div>
        </a>
      )}

      {!showPlayer && embed && !showPreview && ingredient.external_url && (
        <div className="mt-3">
          <EmbedFrame url={ingredient.external_url} title={ingredient.title} />
        </div>
      )}

      {ingredient.description && (
        <p className="mt-3 text-[0.95rem] leading-relaxed">
          {ingredient.description}
        </p>
      )}

      {ingredient.why_it_matters && (
        <div className="why-note mt-4">
          <span className="not-italic font-meta text-[10px] tracking-widest uppercase text-verde block mb-1">
            Why it matters
          </span>
          {ingredient.why_it_matters}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        {ingredient.external_url && !embed && !showPreview && (
          <a
            href={ingredient.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-verde underline underline-offset-2 break-all"
          >
            {ingredient.type === "video_link"
              ? "Watch the video"
              : ingredient.type === "audio"
                ? "Listen"
                : "Open the link"}
          </a>
        )}
        {ingredient.location_name && <span>{ingredient.location_name}</span>}
        {ingredient.happened_on && (
          <span>
            {new Date(ingredient.happened_on + "T00:00:00").toLocaleDateString(
              "en-US",
              { month: "long", year: "numeric" }
            )}
          </span>
        )}
        {ingredient.attribution && <span>Credit: {ingredient.attribution}</span>}
      </div>
    </article>
  );
}
