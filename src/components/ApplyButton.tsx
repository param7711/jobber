"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Applying from the listing page.
 *
 * An application here is the same event as a right swipe in the deck — one
 * row in the swipe log, not a parallel "applications" table. Two ways to
 * express the same intent must not produce two kinds of record, or the match
 * logic has to learn about both and the tracker starts disagreeing with itself.
 */
export function ApplyButton({
  candidateId,
  jobId,
  alreadyApplied,
  passed,
}: {
  candidateId: string;
  jobId: string;
  alreadyApplied: boolean;
  /** They already swiped this role away. Applying anyway is allowed. */
  passed: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(alreadyApplied);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorType: "candidate",
          actorId: candidateId,
          subjectId: jobId,
          jobId,
          direction: "right",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Trust the server's account of what it did, not the fact that it
      // answered. "recorded" and "reversed" both mean the application stands.
      const data: { outcome?: string } = await res.json();
      if (data.outcome === "unchanged" && !alreadyApplied) {
        throw new Error("not stored");
      }
      setApplied(true);
      // The tracker reads the same log, so it must not stay stale behind this.
      router.refresh();
    } catch {
      setError("Could not send that. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <p className="flex items-center gap-2 rounded-sm border border-keep bg-keep-soft px-4 py-2.5 text-[14px] font-medium text-keep">
        <Check aria-hidden size={15} strokeWidth={2.5} />
        Applied — waiting on the employer
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={apply}
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-sm border border-seek bg-seek px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seek"
      >
        {pending && <Loader2 aria-hidden size={15} className="animate-spin" />}
        {passed ? "Apply anyway" : "Apply"}
      </button>
      {passed && (
        <p className="text-[11.5px] leading-snug text-muted">
          You passed on this in your deck.
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px] leading-snug text-pass">
          {error}
        </p>
      )}
    </div>
  );
}
