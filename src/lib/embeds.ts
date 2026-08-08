// Embed detection for social and media URLs.
// The content plays and displays through Media Taco, but the file always
// lives on the original platform's servers. We never copy or store it.

export type EmbedProvider =
  | "youtube"
  | "vimeo"
  | "spotify"
  | "soundcloud"
  | "tiktok"
  | "reddit"
  | "instagram"
  | "facebook";

export interface EmbedInfo {
  provider: EmbedProvider;
  /** Iframe src when inline playback is supported, null for link-card providers */
  embedUrl: string | null;
  /** Aspect ratio as percentage padding-bottom (56.25 = 16:9) */
  aspectPercent: number;
  /** Human label for the provider */
  label: string;
}

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export function parseEmbed(raw: string | null | undefined): EmbedInfo | null {
  if (!raw) return null;
  const url = safeUrl(raw.trim());
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // ---- YouTube (watch, share, shorts, live, embed) ----
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|live|embed)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[2];
    }
    if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        aspectPercent: 56.25,
        label: "YouTube",
      };
    }
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (/^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        aspectPercent: 56.25,
        label: "YouTube",
      };
    }
  }

  // ---- Vimeo ----
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/\/(?:video\/)?(\d{6,})/);
    if (m) {
      return {
        provider: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${m[1]}`,
        aspectPercent: 56.25,
        label: "Vimeo",
      };
    }
  }

  // ---- Spotify (track, album, playlist, episode, show, artist) ----
  if (host === "open.spotify.com") {
    const m = url.pathname.match(
      /^\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{10,})/
    );
    if (m) {
      return {
        provider: "spotify",
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        aspectPercent: m[1] === "track" || m[1] === "episode" ? 25 : 47,
        label: "Spotify",
      };
    }
  }

  // ---- SoundCloud (widget accepts the page URL directly) ----
  if (host === "soundcloud.com" && url.pathname.length > 2) {
    return {
      provider: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url.href
      )}&color=%232e6b4f&inverse=false&auto_play=false&show_user=true`,
      aspectPercent: 20,
      label: "SoundCloud",
    };
  }

  // ---- TikTok ----
  if (host === "tiktok.com" || host === "m.tiktok.com") {
    const m = url.pathname.match(/\/video\/(\d{8,})/);
    if (m) {
      return {
        provider: "tiktok",
        embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`,
        aspectPercent: 178,
        label: "TikTok",
      };
    }
  }

  // ---- Reddit posts ----
  if (host === "reddit.com" || host === "old.reddit.com") {
    if (/^\/r\/[^/]+\/comments\//.test(url.pathname)) {
      return {
        provider: "reddit",
        embedUrl: `https://embed.reddit.com${url.pathname}?embed=true&theme=light`,
        aspectPercent: 75,
        label: "Reddit",
      };
    }
  }

  // ---- Instagram and Facebook: link cards only.
  // Meta requires an approved developer app for inline embeds, so until that
  // review is done these render as clean labeled cards that open the post. ----
  if (host === "instagram.com" || host === "instagr.am") {
    return { provider: "instagram", embedUrl: null, aspectPercent: 0, label: "Instagram" };
  }
  if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") {
    return { provider: "facebook", embedUrl: null, aspectPercent: 0, label: "Facebook" };
  }

  return null;
}
