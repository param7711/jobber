import type { RecruiterActivity } from "@/db/queries";

/**
 * "Recruiter actions on your profile."
 *
 * Every Indian job board sells this behind a subscription, as one unfalsifiable
 * number: "23 recruiters viewed you". It cannot be checked, it counts bots, and
 * it is designed to make you anxious enough to pay.
 *
 * Each figure here has a definition printed under it. That makes the number
 * smaller and the product more trustworthy, which is the right trade for a new
 * marketplace nobody has a reason to believe yet.
 */
export function RecruiterActivityPanel({
  activity,
}: {
  activity: RecruiterActivity;
}) {
  const { inDecks, shortlisted, companiesReached, lastActivityAt } = activity;
  const nothingYet = inDecks === 0 && companiesReached === 0;

  return (
    <section
      className="rounded-lg border border-line bg-surface p-4 sm:p-5"
      aria-label="Recruiter activity"
    >
      <h2 className="label text-muted">Recruiter activity</h2>

      {nothingYet ? (
        <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">
          No recruiter has reached your profile yet. Decks rebuild nightly —
          keeping your availability fresh is what puts you in them.
        </p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <Stat
              value={inDecks}
              label="In decks"
              hint="Open roles you are currently ranked into"
            />
            <Stat
              value={companiesReached}
              label="Reviewed by"
              hint="Companies whose recruiter saw and acted on your card"
            />
            <Stat
              value={shortlisted}
              label="Shortlisted"
              hint="Recruiters who swiped right on you"
              accent
            />
          </dl>

          {lastActivityAt && (
            <p className="mt-3 border-t border-line-soft pt-3 font-mono text-[11.5px] text-muted">
              Last activity {relative(lastActivityAt)}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Stat({
  value,
  label,
  hint,
  accent,
}: {
  value: number;
  label: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dd
        className={`font-mono text-[22px] font-semibold leading-none tabular-nums ${
          accent && value > 0 ? "text-keep" : "text-ink"
        }`}
      >
        {value}
      </dd>
      <dt className="mt-1.5 text-[12.5px] font-medium leading-tight">{label}</dt>
      <p className="mt-0.5 text-[11px] leading-[1.35] text-muted">{hint}</p>
    </div>
  );
}

function relative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} month(s) ago`;
}
