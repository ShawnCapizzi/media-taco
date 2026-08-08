"use server";

// Fetches Open Graph metadata for a pasted link so the wizard can show a
// live preview and the Ingredient can render a rich card. The page itself
// stays on its original server; we read its public meta tags once.

export interface LinkPreview {
  ok: boolean;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  error?: string;
}

// Pure parser, exported for verification by execution.
export async function parseOgTags(html: string, baseUrl: string): Promise<LinkPreview> {
  const pick = (prop: string): string | undefined => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
      "i"
    );
    const m = html.match(re);
    const raw = m?.[1] ?? m?.[2];
    if (!raw) return undefined;
    return raw
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  };

  let title = pick("og:title") ?? pick("twitter:title");
  if (!title) {
    const t = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    title = t?.[1]?.trim();
  }
  const description = pick("og:description") ?? pick("twitter:description") ?? pick("description");
  let image = pick("og:image") ?? pick("twitter:image");
  const site = pick("og:site_name");

  if (image) {
    try {
      const abs = new URL(image, baseUrl);
      image = abs.protocol === "https:" || abs.protocol === "http:" ? abs.href : undefined;
    } catch {
      image = undefined;
    }
  }

  if (!title && !image && !description) {
    return { ok: false, error: "No preview available for this link." };
  }
  return {
    ok: true,
    title: title?.slice(0, 300),
    description: description?.slice(0, 300),
    image,
    site: site?.slice(0, 100),
  };
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "That does not look like a full link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only web links are supported." };
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false, error: "That address cannot be previewed." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MediaTacoBot/1.0; +https://mediataco.community)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("html")) {
      return { ok: false, error: "That page did not offer a preview." };
    }
    const html = (await res.text()).slice(0, 400_000);
    return await parseOgTags(html, url.href);
  } catch {
    return {
      ok: false,
      error: "Could not reach that page. Some sites, like Instagram, block previews.",
    };
  } finally {
    clearTimeout(timer);
  }
}
