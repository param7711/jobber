import type { PassFeedback } from "@/db/queries";
import type { PassReason } from "@/lib/types";

/**
 * What candidates never get told anywhere else: why they are not hearing back.
 *
 * The copy is deliberately about the MISMATCH, not about the candidate. "Your
 * expected CTC sits above the band" is a fact they can act on; "you were too
 * expensive" is a judgement they can only feel bad about. Same data, and only
 * one of them is worth shipping.
 */
const ADVICE: Record<PassReason, { headline: string; action: string }> = {
  comp_mismatch: {
    headline: "Comp is where these roles are stalling",
    action:
      "Your expected CTC sits above the band on most roles you appeared in. Widening it, or targeting senior titles, would change this.",
  },
  notice_too_long: {
    headline: "Your notice period is the sticking point",
    action:
      "Most of these teams wanted someone sooner. If you can negotiate a buyout or a shorter notice, say so on your profile.",
  },
  underqualified: {
    headline: "These roles were pitched above your current depth",
    action:
      "Try one seniority band down, or add achievement bullets that show scope you have actually owned.",
  },
  overqualified: {
    headline: "You are levelling above these roles",
    action:
      "You are being read as over-levelled. Target senior or staff titles rather than these.",
  },
  wrong_stack: {
    headline: "The stack is not lining up",
    action:
      "Your skills do not overlap with what these teams asked for. Narrowing your industry choice would give you a better-fitting deck.",
  },
  location_mismatch: {
    headline: "Location is the blocker",
    action:
      "Adding every city you would genuinely work in — and remote, if you would — opens up more of the deck.",
  },
  other: {
    headline: "Mixed reasons so far",
    action: "No single pattern yet. Keep your profile fresh and keep swiping.",
  },
};

export function PassFeedbackPanel({ feedback }: { feedback: PassFeedback }) {
  // Below the threshold there is no pattern, only a rejection. Show nothing.
  if (!feedback.topReason) return null;

  const { reason, count } = feedback.topReason;
  const advice = ADVICE[reason];

  return (
    <section
      className="rounded-sm border border-line bg-surface px-4 py-3"
      aria-label="Why you are not hearing back"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="label text-muted">Why you are not hearing back</p>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          {count} of {feedback.totalPasses}
        </p>
      </div>

      <p className="mt-2 text-[14px] font-semibold leading-snug">
        {advice.headline}
      </p>
      <p className="mt-1 text-[13px] leading-[1.5] text-ink-2">{advice.action}</p>

      <p className="mt-2.5 text-[11.5px] leading-snug text-muted">
        Aggregated across every team that saw you. We never say which one.
      </p>
    </section>
  );
}
