"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Optimistic bookmark toggle.
 *
 * Optimistic because the alternative — a spinner on a bookmark — makes a
 * zero-stakes action feel like a transaction. On failure it snaps back and
 * says so, which is the honest version of optimism.
 */
export function SaveJobButton({
  candidateId,
  jobId,
  initialSaved,
  label = false,
}: {
  candidateId: string;
  jobId: string;
  initialSaved: boolean;
  /** Show the word next to the icon. Off in dense lists. */
  label?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next);
    setFailed(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId, jobId, saved: next }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        setSaved(!next);
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      title={failed ? "Could not save — try again" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
        saved
          ? "border-seek bg-seek-soft text-seek"
          : "border-line text-muted hover:border-ink hover:text-ink",
        failed && "border-pass text-pass",
      )}
    >
      <Bookmark
        aria-hidden
        size={14}
        strokeWidth={2}
        fill={saved ? "currentColor" : "none"}
      />
      {label && <span>{saved ? "Saved" : "Save"}</span>}
      <span className="sr-only">
        {saved ? "Remove from saved jobs" : "Save this job"}
      </span>
    </button>
  );
}
