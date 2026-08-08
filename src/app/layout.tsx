import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

// Michroma, self-hosted under the SIL Open Font License (src/fonts/OFL.txt).
const michroma = localFont({
  src: "../fonts/Michroma-Regular.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-michroma",
});

// Fraunces, self-hosted under the SIL Open Font License. Warm editorial
// headline voice to pair with Michroma's technical brand voice.
const fraunces = localFont({
  src: "../fonts/Fraunces-Variable.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-head",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mediataco.com"
  ),
  title: {
    default: "Media Taco Community",
    template: "%s | Media Taco",
  },
  description:
    "Share more than a post. Media Taco helps you turn the songs, images, memories, places, stories, and creative work that shape you into collections people can understand and respond to.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${michroma.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line mt-16 bg-raised/60">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-ink-soft">
              Media Taco Community. A proof of concept built with its first 8 to
              12 contributors.
            </p>
            <nav aria-label="Footer" className="flex gap-5 text-sm">
              <Link href="/how-to" className="hover:text-verde">
                How to
              </Link>
              <Link href="/stands" className="hover:text-verde">
                Stands
              </Link>
              <Link href="/about" className="hover:text-verde">
                About
              </Link>
              <Link href="/explore" className="hover:text-verde">
                Explore
              </Link>
              <Link href="/join" className="hover:text-verde">
                Join
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
