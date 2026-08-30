"use client";

import Link from "next/link";
import { useState } from "react";
import { CandidateCard } from "@/components/CandidateCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import {
  PASS_REASONS,
  formatLpaRange,
  type Candidate,
  type Company,
  type DeckItem,
  type Job,
  type PassReason,
  type SwipeDirection,
} from "@/lib/types";

/**
 * Employers always swipe INSIDE a requisition. A right-swipe therefore means
 * "this person, for this role" — a signal worth learning from — rather than a
 * vague expression of interest in a human being.
 *
 * `rows` is fetched server-side (see page.tsx) so this component owns only
 * interaction state, not data fetching.
 */
export function SourcingDeck({
  job,
  company,
  rows,
  recruiterId,
}: {
  job: Job;
  company: Company;
  rows: { item: DeckItem; candidate: Candidate }[];
  /** Hard-coded demo recruiter until auth lands. */
  recruiterId: string;
}) {
  const [shortlisted, setShortlisted] = useState<Candidate[]>([]);
  const [passed, setPassed] = useState<
    { candidate: Candidate; reason: PassReason }[]
  >([]);
  /** Set between the left swipe and the recruiter picking a reason. */
  const [awaitingReason, setAwaitingReason] = useState<Candidate | null>(null);

  /** A daily cap is what stops this becoming a spam channel. */
  const RIGHT_SWIPE_BUDGET = 12;
  const budgetLeft = RIGHT_SWIPE_BUDGET - shortlisted.length;

  function logSwipe(
    subjectId: string,
    direction: SwipeDirection,
    passReason: PassReason | null,
  ) {
    // Fire-and-forget: the swipe log is append-only training data, not
    // something the UI should block on or roll back for.
    fetch("/api/swipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorType: "employer",
        actorId: recruiterId,
        subjectId,
        jobId: job.id,
        direction,
        passReason,
      }),
    }).catch(() => {
      // Best-effort. A dropped write costs a data point, not correctness.
    });
  }

  function handleSwipe(row: (typeof rows)[number], direction: SwipeDirection) {
    if (direction === "right") {
      setShortlisted((prev) => [...prev, row.candidate]);
      logSwipe(row.candidate.id, "right", null);
    } else {
      // The pass is not written until a reason is picked — a reasonless pass
      // is exactly the row that makes candidate feedback useless.
      setAwaitingReason(row.candidate);
    }
  }

  function recordReason(reason: PassReason) {
    if (!awaitingReason) return;
    setPassed((prev) => [...prev, { candidate: awaitingReason, reason }]);
    logSwipe(awaitingReason.id, "left", reason);
    setAwaitingReason(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line py-5">
        <div>
          <p className="label text-hire">Sourcing for</p>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            {job.title}
          </h1>
          <p className="mt-1 font-mono text-[12.5px] text-muted">
            {company.name} · {formatLpaRange(job.ctcMin, job.ctcMax)} ·{" "}
            {job.city}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="label text-muted">Right-swipes left today</p>
            <p className="mt-1 font-mono text-[19px] font-semibold tabular-nums">
              {budgetLeft}
              <span className="text-muted">/{RIGHT_SWIPE_BUDGET}</span>
            </p>
          </div>
          <Link
            href="/"
            className="label rounded-sm border border-line px-2.5 py-1.5 text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Exit
          </Link>
        </div>
      </header>

      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div>
          <SwipeDeck
            className="h-[560px]"
            items={rows}
            keyOf={(row) => row.candidate.id}
            renderCard={(row) => (
              <CandidateCard candidate={row.candidate} item={row.item} />
            )}
            onSwipe={handleSwipe}
            leftLabel="Pass"
            rightLabel="Shortlist"
            emptyState={
              <div className="px-6 text-center">
                <p className="text-[15px] font-semibold">Deck cleared</p>
                <p className="mt-1.5 text-[13.5px] leading-snug text-muted">
                  Tomorrow&rsquo;s deck rebuilds overnight from candidates who
                  re-confirmed availability.
                </p>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-6">
          <Panel
            title="Shortlist"
            count={shortlisted.length}
            accent="hire"
            empty="Right-swipe to add someone here."
          >
            {shortlisted.map((c) => (
              <li
                key={c.id}
                className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{c.name}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {c.headline}
                  </p>
                </div>
                <span className="label shrink-0 text-keep">Matched?</span>
              </li>
            ))}
          </Panel>

          <Panel
            title="Passed"
            count={passed.length}
            accent="muted"
            empty="Reasons you give here train tomorrow's deck."
          >
            {passed.map(({ candidate, reason }) => (
              <li
                key={candidate.id}
                className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2.5 last:border-b-0"
              >
                <p className="min-w-0 truncate text-[14px]">{candidate.name}</p>
                <span className="label shrink-0 text-muted">
                  {PASS_REASONS.find((r) => r.value === reason)?.label}
                </span>
              </li>
            ))}
          </Panel>
        </div>
      </div>

      {awaitingReason && (
        <ReasonSheet
          candidate={awaitingReason}
          onPick={recordReason}
          onSkip={() => recordReason("other")}
        />
      )}
    </div>
  );
}

function Panel({
  title,
  count,
  accent,
  empty,
  children,
}: {
  title: string;
  count: number;
  accent: "hire" | "muted";
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <p className={accent === "hire" ? "label text-hire" : "label text-muted"}>
          {title}
        </p>
        <span className="font-mono text-[13px] font-medium tabular-nums text-muted">
          {count}
        </span>
      </header>
      <div className="px-4 py-1.5">
        {count === 0 ? (
          <p className="py-4 text-[13px] leading-snug text-muted">{empty}</p>
        ) : (
          <ul>{children}</ul>
        )}
      </div>
    </section>
  );
}

/**
 * One tap, and it buys two things: labelled training data for ranking, and the
 * only genuinely useful feedback a candidate can be given ("passed eleven
 * times, nine for comp mismatch"). Nobody else in the market tells them that.
 */
function ReasonSheet({
  candidate,
  onPick,
  onSkip,
}: {
  candidate: Candidate;
  onPick: (reason: PassReason) => void;
  onSkip: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-[0_20px_60px_-20px_rgba(21,24,33,0.5)]">
        <p className="label text-muted">Passed on</p>
        <h2 id="reason-title" className="mt-1 text-[17px] font-semibold">
          {candidate.name}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-snug text-muted">
          Why? One tap. It sharpens tomorrow&rsquo;s deck and is the only
          feedback they will get anywhere.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {PASS_REASONS.filter((r) => r.value !== "other").map((reason) => (
            <li key={reason.value}>
              <button
                type="button"
                onClick={() => onPick(reason.value)}
                className="rounded-sm border border-line bg-surface px-3 py-2 text-[13.5px] transition-colors hover:border-hire hover:bg-hire-soft hover:text-hire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hire"
              >
                {reason.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSkip}
          className="label mt-4 text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
