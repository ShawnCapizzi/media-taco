export const metadata = { title: "Event sheet" };

// A printable one-pager for live events. Print from the browser
// (Cmd+P, save as PDF or print directly). Sized for US Letter.
// Pass ?stand=your-stand-slug to point the QR at the night's Stand.
export default async function EventSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ stand?: string }>;
}) {
  const { stand } = await searchParams;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediataco.community";
  const targetUrl = stand ? `${site}/s/${stand}` : `${site}/join?code=FIRST-BITE`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(
    targetUrl
  )}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0 print:max-w-none">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-ink-soft">
          Print this page (Cmd+P) for the event table. Add ?stand=your-stand-slug
          to the address to point the QR at tonight&apos;s Stand.
        </p>
      </div>

      <div className="card p-8 sm:p-10 print:border-0 print:p-2">
        <div className="keyline-grad mb-4" aria-hidden="true" />
        <p className="eyebrow mb-2">Media Taco · Live</p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight leading-tight">
          Bring your Taco to the <span className="text-grad-blue">Stand</span>
        </h1>
        <p className="text-ink-soft mt-2 max-w-md">
          One shared shelf, everyone&apos;s own collection of tonight. Takes
          about two minutes.
        </p>

        <div className="mt-8 grid sm:grid-cols-[1fr_auto] gap-8 items-start">
          <ol className="space-y-5">
            <li className="flex gap-3">
              <span className="font-display text-grad-blue" aria-hidden="true">01</span>
              <div>
                <p className="font-semibold">Scan the code, join in 30 seconds</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Invite code <span className="font-meta font-semibold text-ink">FIRST-BITE</span>.
                  You need an email and a birth year (13 and up).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display text-grad-blue" aria-hidden="true">02</span>
              <div>
                <p className="font-semibold">Build your quick Taco of the night</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Tap Create. One line that stuck, the band playing when
                  something shifted, a photo, the poem, the person. Say why it
                  moved you. That part is the whole point.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display text-grad-blue" aria-hidden="true">03</span>
              <div>
                <p className="font-semibold">Add it to tonight&apos;s Stand</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Open the Stand, tap your Taco under Add your Taco, and watch
                  the room&apos;s memory build on the wall.
                </p>
              </div>
            </li>
          </ol>

          <div className="mx-auto text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR code that opens ${targetUrl}`}
              width={180}
              height={180}
              className="rounded-card border border-line bg-raised"
            />
            <p className="font-meta text-[11px] text-ink-soft mt-2 break-all max-w-[180px]">
              {targetUrl}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-soft max-w-sm">
            No ads, no algorithm. Your content is yours; linked media stays on
            its original platform. Live video plays inside a Taco and stays as
            the archive.
          </p>
          <p className="font-display text-sm">
            media<span className="text-chile">taco</span>
          </p>
        </div>
      </div>
    </div>
  );
}
