import type { Completeness } from "@/lib/completeness";

/**
 * Sits above the candidate's deck. Deliberately shows ONE gap rather than a
 * checklist — a nine-item to-do list gets ignored, a single "add your notice
 * period" gets done.
 */
export function CompletenessBar({ completeness }: { completeness: Completeness }) {
  const { percent, topGap } = completeness;
  const complete = percent === 100;

  return (
    <section
      className="rounded-sm border border-line bg-surface px-4 py-3"
      aria-label="Profile completeness"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="label text-muted">Profile</p>
        <p className="font-mono text-[13px] font-semibold tabular-nums">
          {percent}%
        </p>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profile ${percent} percent complete`}
      >
        <div
          className={complete ? "h-full bg-keep" : "h-full bg-seek"}
          style={{ width: `${percent}%` }}
        />
      </div>

      {topGap ? (
        <p className="mt-2 text-[13px] leading-snug text-ink-2">
          {topGap.nudge}
        </p>
      ) : (
        <p className="mt-2 text-[13px] leading-snug text-muted">
          Nothing missing. You will show up in every deck you qualify for.
        </p>
      )}
    </section>
  );
}
