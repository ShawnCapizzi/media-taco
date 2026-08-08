"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FoundingBadge } from "@/components/founding-badge";

interface MenuProfile {
  username: string;
  display_name: string;
  founding_status: boolean;
  isStaff: boolean;
  isResearch: boolean;
}

export function MobileMenu({ profile }: { profile: MenuProfile | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link =
    "block px-3 py-3 rounded-lg text-base hover:bg-verde-soft border border-transparent";

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="p-2 -mr-1 rounded-md hover:bg-verde-soft"
      >
        <span aria-hidden="true" className="block text-xl leading-none">&#9776;</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-xs bg-raised shadow-lift p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-lg">
                Media<span className="text-chile">.</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-verde-soft text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {profile && (
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg bg-verde-soft mb-2"
              >
                <span className="font-medium">{profile.display_name}</span>
                {profile.founding_status && <FoundingBadge compact />}
              </Link>
            )}

            <nav className="space-y-0.5" onClick={() => setOpen(false)}>
              <Link href="/explore" className={link}>Explore</Link>
              <Link href="/stands" className={link}>Stands</Link>
              <Link href="/how-to" className={link}>How to</Link>
              {profile && <Link href="/create" className={link}>Create a Taco</Link>}
              {profile && <Link href="/stands/new" className={link}>Open a Stand</Link>}
              {profile?.founding_status && (
                <Link href="/founding-table" className={link}>Founding Table</Link>
              )}
              {profile?.isStaff && <Link href="/admin" className={link}>Admin</Link>}
              {profile?.isResearch && <Link href="/research" className={link}>Research</Link>}
            </nav>

            <div className="mt-4 pt-4 border-t border-line">
              {profile ? (
                <form action="/auth/signout" method="post">
                  <button type="submit" className="block w-full text-left px-3 py-3 rounded-lg text-base text-ink-soft hover:bg-verde-soft">
                    Sign out
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <Link href="/join" onClick={() => setOpen(false)} className="btn btn-primary w-full justify-center">
                    Join
                  </Link>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary w-full justify-center">
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
