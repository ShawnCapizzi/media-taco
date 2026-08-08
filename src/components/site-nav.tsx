import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { FoundingBadge } from "@/components/founding-badge";
import { MobileMenu } from "@/components/mobile-menu";

export async function SiteNav() {
  const profile = await getCurrentProfile();
  const isStaff = profile?.role === "admin" || profile?.role === "moderator";
  const isResearch = profile?.role === "admin" || profile?.role === "researcher";

  return (
    <>
      <header className="sticky top-0 z-40 bg-raised/85 backdrop-blur border-b border-line">
        <div className="h-[3px] bg-grad-blue" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href={profile ? "/home" : "/"}
            className="font-display text-xl tracking-tight"
          >
            Media&nbsp;Taco
            <span className="text-chile" aria-hidden="true">
              .
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden sm:flex items-center gap-1 sm:gap-2">
            <Link href="/explore" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
              Explore
            </Link>
            <Link href="/stands" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
              Stands
            </Link>
            <Link href="/how-to" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
              How to
            </Link>
            {profile ? (
              <>
                <Link
                  href="/create"
                  className="btn btn-primary text-sm px-3.5 py-1.5 active:translate-y-px"
                >
                  Create
                </Link>
                {profile.founding_status && (
                  <Link href="/founding-table" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
                    Founding Table
                  </Link>
                )}
                {isStaff && (
                  <Link href="/admin" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
                    Admin
                  </Link>
                )}
                {isResearch && (
                  <Link href="/research" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
                    Research
                  </Link>
                )}
                <Link
                  href={`/profile/${profile.username}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft"
                >
                  <span className="font-medium">{profile.display_name}</span>
                  {profile.founding_status && <FoundingBadge compact />}
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-sm text-ink-soft rounded-md hover:bg-verde-soft"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="px-2.5 py-1.5 text-sm rounded-md hover:bg-verde-soft">
                  Sign in
                </Link>
                <Link href="/join" className="btn btn-primary text-sm">
                  Join
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: Create shortcut always in reach, plus the menu */}
          <div className="flex items-center gap-2 sm:hidden">
            {profile && (
              <Link
                href="/create"
                className="btn btn-primary text-sm px-3 py-1.5 active:translate-y-px"
              >
                Create
              </Link>
            )}
            <MobileMenu
              profile={
                profile
                  ? {
                      username: profile.username,
                      display_name: profile.display_name,
                      founding_status: profile.founding_status,
                      isStaff,
                      isResearch,
                    }
                  : null
              }
            />
          </div>
        </div>
      </header>

      {/* Mobile bottom bar: the four things people do most, always one tap away */}
      <nav
        aria-label="Quick actions"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-raised/95 backdrop-blur border-t border-line"
      >
        <div className="grid grid-cols-4 h-14">
          <Link href={profile ? "/home" : "/"} className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-ink-soft hover:text-verde">
            <span aria-hidden="true" className="text-base">&#9750;</span>
            Home
          </Link>
          <Link href="/explore" className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-ink-soft hover:text-verde">
            <span aria-hidden="true" className="text-base">&#9788;</span>
            Explore
          </Link>
          <Link href="/stands" className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-ink-soft hover:text-verde">
            <span aria-hidden="true" className="text-base">&#9776;</span>
            Stands
          </Link>
          <Link href={profile ? "/create" : "/join"} className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-verde font-semibold hover:text-verde-deep">
            <span aria-hidden="true" className="text-base">&#43;</span>
            {profile ? "Create" : "Join"}
          </Link>
        </div>
      </nav>
      {/* Spacer so the fixed bottom bar never covers page content on mobile */}
      <div className="h-14 sm:hidden" aria-hidden="true" />
    </>
  );
}
