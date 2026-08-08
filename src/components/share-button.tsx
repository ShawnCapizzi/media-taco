"use client";

import { useState } from "react";

export function ShareButton({ url, title }: { url: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // Native share sheet on devices that have one (most phones and tablets)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title ?? "A Taco on Media Taco", url });
        return;
      } catch (err) {
        // User closed the sheet: do nothing. Anything else: fall through to copy.
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-secondary text-sm">
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
