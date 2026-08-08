"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps a Stand page fresh in the room: polls by refreshing the server
// component on an interval while the tab is visible. No sockets, no cost.
export function LiveRefresher({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <span className="inline-flex items-center gap-1.5 font-meta text-[11px] uppercase tracking-widest text-verde">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-verde" />
      </span>
      Live
    </span>
  );
}
