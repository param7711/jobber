"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SwipeDeck } from "@/components/SwipeDeck";
import { RoleCard } from "@/components/RoleCard";
import type { Company, DeckItem, Job, SwipeDirection } from "@/lib/types";

type Row = { item: DeckItem; job: Job; company: Company };
type Applied = { jobId: string; title: string; company: string };

export function CandidateDeckClient({
  candidateId,
  candidateFirstName,
  rows,
  completeness,
  passFeedback,
}: {
  candidateId: string;
  candidateFirstName: string;
  rows: Row[];
  /** Rendered on the server — this component owns interaction, not data. */
  completeness: ReactNode;
  passFeedback: ReactNode;
}) {
  const [applied, setApplied] = useState<Applied[]>([]);

  function handleSwipe(row: Row, direction: SwipeDirection) {
    if (direction === "right") {
      setApplied((prev) => [
        ...prev,
        { jobId: row.job.id, title: row.job.title, company: row.company.name },
      ]);
    }

    // Fire-and-forget: the swipe log is append-only training data, not
    // something the UI should ever block on or roll back for.
    fetch("/api/swipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorType: "candidate",
        actorId: candidateId,
        subjectId: row.job.id,
        jobId: row.job.id,
        direction,
      }),
    }).catch(() => {
      // Best-effort. A dropped write here costs a data point, not correctness.
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-8">
      <header className="flex items-center justify-between py-4">
        <div>
          <p className="label text-seek">Your deck</p>
          <h1 className="mt-1 text-[19px] font-semibold tracking-[-0.015em]">
            Roles for you
          </h1>
        </div>
        <Link
          href="/"
          className="label rounded-sm border border-line px-2.5 py-1.5 text-muted transition-colors hover:text-ink hover:border-ink"
        >
          Exit
        </Link>
      </header>

      <div className="mb-4 flex flex-col gap-3">
        {completeness}
        {passFeedback}
      </div>

      <p className="mb-4 text-[13.5px] leading-snug text-muted">
        Swipe right to send {candidateFirstName}&rsquo;s resume, tailored for
        that role. Left to pass.
      </p>

      <div className="flex-1">
        <SwipeDeck
          className="h-[540px]"
          items={rows}
          keyOf={(row) => row.job.id}
          renderCard={(row) => (
            <RoleCard job={row.job} company={row.company} />
          )}
          onSwipe={handleSwipe}
          leftLabel="Pass"
          rightLabel="Apply"
          emptyState={
            <div className="px-6 text-center">
              <p className="text-[15px] font-semibold">That&rsquo;s the deck</p>
              <p className="mt-1.5 text-[13.5px] leading-snug text-muted">
                New roles land as employers open requisitions in your segment.
                We will notify you rather than have you check.
              </p>
            </div>
          }
        />
      </div>

      {applied.length > 0 && (
        <section className="mt-6 rounded-sm border border-line bg-surface px-4 py-3">
          <p className="label text-muted">Applied · {applied.length}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {applied.map((a) => (
              <li key={a.jobId} className="text-[13.5px] leading-snug">
                <span className="font-semibold">{a.title}</span>
                <span className="text-muted"> · {a.company}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[12.5px] leading-snug text-muted">
            Each one needs your review before it sends — nothing goes out that
            you have not read.
          </p>
        </section>
      )}
    </div>
  );
}
