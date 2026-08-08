"use client";

import { useState } from "react";

// Copies (or shares) a warm invitation that tells people exactly what to do:
// add their own Taco to this Stand.
export function InviteToStand({
  url,
  standTitle,
}: {
  url: string;
  standTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Add your Taco to "${standTitle}" on Media Taco. Build a small collection of what this meant to you, then drop it on the Stand: ${url}`;

  async function invite() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Add your Taco to ${standTitle}`, text: message, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this invitation:", message);
    }
  }

  return (
    <button type="button" onClick={invite} className="btn btn-secondary text-sm">
      {copied ? "Invite copied" : "Invite people to add"}
    </button>
  );
}
