"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { availabilityState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The freshness control.
 *
 * Other boards let a profile sit untouched for two years and still show it to
 * recruiters, which is why recruiters there assume every profile is a dead
 * lead. Availability here expires on purpose, and this is the one tap that
 * renews it — so the state has to be legible, not buried in a settings page.
 */
export function AvailabilityCard({
  candidateId,
  confirmedAt,
  openToWork,
}: {
  candidateId: string;
  confirmedAt: string;
  openToWork: boolean;
}) {
  const router = useRouter();
  const [at, setAt] = useState(confirmedAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const { state, days } = availabilityState(at);

  const copy = {
    fresh: {
      badge: "Visible",
      tone: "text-keep bg-keep-soft border-keep/30",
      line: `Confirmed ${days === 0 ? "today" : `${days}d ago`}. You are in every deck you qualify for.`,
    },
    stale: {
      badge: "Going stale",
      tone: "text-warn bg-warn-soft border-warn/30",
      line: `Confirmed ${days}d ago. You drop out of decks at 22 days.`,
    },
    expired: {
      badge: "Hidden",
      tone: "text-pass bg-pass-soft border-pass/30",
      line: `Confirmed ${days}d ago. No recruiter can see you until you confirm.`,
    },
  }[state];

  async function confirm() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: { confirmedAt: string | null } = await res.json();
      setAt(data.confirmedAt ?? new Date().toISOString());
      // The completeness score and the deck both read this date.
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-line bg-surface p-4 sm:p-5"
      aria-label="Availability"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label text-muted">Availability</h2>
        <span
          className={cn(
            "rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium",
            copy.tone,
          )}
        >
          {openToWork ? copy.badge : "Not looking"}
        </span>
      </div>

      <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">
        {openToWork
          ? copy.line
          : "You are hidden from every deck and search while this is off."}
      </p>

      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className={cn(
          "mt-3 w-full rounded-sm border px-4 py-2 text-[13.5px] font-semibold transition-colors disabled:opacity-60",
          state === "fresh"
            ? "border-line text-ink-2 hover:border-ink hover:text-ink"
            : "border-seek bg-seek text-white hover:opacity-90",
        )}
      >
        {pending
          ? "Confirming…"
          : state === "fresh"
            ? "Re-confirm anyway"
            : "Yes, I am still looking"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-pass">
          Could not confirm. Check your connection and try again.
        </p>
      )}
    </section>
  );
}
