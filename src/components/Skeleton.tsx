/**
 * Loading placeholders.
 *
 * Every page in this app is server-rendered on demand and most of them make
 * several database round trips, so without these a navigation is a blank
 * screen for as long as Postgres takes. On a patchy mobile connection that
 * reads as a broken link, and people tap again.
 *
 * The shapes deliberately match the real layout rather than being generic
 * grey bars — the point is that nothing jumps when the content arrives.
 */
export function Line({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <div
      className="animate-pulse rounded-sm bg-surface-2"
      style={{ width: w, height: h }}
    />
  );
}

export function Block({ h = 120 }: { h?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg border border-line bg-surface"
      style={{ height: h }}
    />
  );
}

/** Mirrors JobCard: logo, two title lines, a meta strip, two skill rows. */
export function JobCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-sm bg-surface-2" />
        <div className="flex flex-1 flex-col gap-2">
          <Line w="55%" h={15} />
          <Line w="35%" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Line w="80px" />
        <Line w="90px" />
        <Line w="110px" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Line />
        <Line w="70%" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 border-b border-line py-6">
      <Line w="70px" h={10} />
      <Line w="45%" h={24} />
      <Line w="60%" />
    </div>
  );
}
