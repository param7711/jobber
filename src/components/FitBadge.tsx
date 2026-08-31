import { Sparkles } from "lucide-react";
import type { JobFit } from "@/db/queries";
import { cn } from "@/lib/utils";

/**
 * A role with fewer than this many applicants is worth calling out.
 *
 * Five is a judgement call, but the shape of it is not: the badge only ever
 * appears beside the real count, so nobody has to take the label on trust.
 */
export const EARLY_APPLICANT_MAX = 5;

/**
 * How well this role fits the candidate.
 *
 * The number comes from the same materialised deck score that decides ranking
 * — never recomputed for display, or the badge and the deck order would
 * disagree and both would look broken.
 *
 * Bands rather than a bare percentage, because a score of 71 versus 68 is not
 * a distinction the model can actually support, and printing it implies a
 * precision that is not there.
 */
export function FitBadge({ fit, showWhy }: { fit: JobFit; showWhy?: boolean }) {
  const band =
    fit.percent >= 80
      ? { label: "Strong match", tone: "border-keep/30 bg-keep-soft text-keep" }
      : fit.percent >= 60
        ? { label: "Good match", tone: "border-seek/30 bg-seek-soft text-seek" }
        : { label: "Partial match", tone: "border-line bg-surface-2 text-muted" };

  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium",
          band.tone,
        )}
      >
        <Sparkles aria-hidden size={11} />
        {band.label}
        <span className="tabular-nums opacity-70">{fit.percent}%</span>
      </span>
      {showWhy && fit.rationale && (
        <span className="text-[12.5px] leading-[1.45] text-ink-2">
          {fit.rationale}
        </span>
      )}
    </span>
  );
}

/**
 * Applicant count.
 *
 * Every job board hides this, and hiding it is why people fire off fifty
 * applications into roles that already have three hundred. Showing it costs
 * the employer a little and saves the candidate an afternoon.
 */
export function ApplicantCount({ n }: { n: number }) {
  if (n === 0) {
    return (
      <span className="font-mono text-[11.5px] text-keep">
        No applicants yet
      </span>
    );
  }

  return (
    <span className="font-mono text-[11.5px] text-muted">
      {n} applicant{n > 1 ? "s" : ""}
      {n < EARLY_APPLICANT_MAX && (
        <span className="ml-1.5 text-keep">· early</span>
      )}
    </span>
  );
}
