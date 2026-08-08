"use client";

import { useState } from "react";

export function ShareButton({ url, title }: { url: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  // The title carried in the message body so it reads well in SMS, where the
  // rich link preview is not guaranteed to render.
  const label = title ? `${title} on Media Taco` : "A Taco on Media Taco";
  const text = `${label}\n${url}`;

  async function share() {
    // Native share sheet on devices that have one (most phones and tablets)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: label, text: label, url });
        return;
      } catch (err) {
        // User closed the sheet: do nothing. Anything else: fall through to copy.
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", text);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-secondary text-sm">
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
