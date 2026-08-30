"use client";

import {
  availabilityState,
  formatLpa,
  formatNotice,
  type Candidate,
  type DeckItem,
} from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/**
 * The employer-side card. It deliberately leads with evidence of work, not a
 * face: photos are off by default here because a face-first deck means people
 * are triaging on age, gender and skin tone before reading a single line.
 */
export function CandidateCard({
  candidate,
  item,
  showPhoto = false,
}: {
  candidate: Candidate;
  item?: DeckItem;
  showPhoto?: boolean;
}) {
  const current = candidate.experiences[0];
  const freshness = availabilityState(candidate.availabilityConfirmedAt);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(21,24,33,0.05),0_12px_32px_-16px_rgba(21,24,33,0.25)]">
      <header className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
        {showPhoto && (
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hire-soft font-mono text-sm font-semibold text-hire"
          >
            {initials(candidate.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold leading-tight tracking-[-0.01em]">
            {candidate.name}
          </h2>
          <p className="mt-0.5 truncate text-[13.5px] leading-snug text-muted">
            {candidate.headline}
          </p>
        </div>
        <FreshnessPill state={freshness.state} days={freshness.days} />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {current && (
          <section>
            <p className="label text-muted">Now</p>
            <p className="mt-1.5 text-[15px] font-semibold leading-snug">
              {current.title}
              <span className="font-normal text-muted"> · {current.company}</span>
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {current.highlights.slice(0, 3).map((line, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-2"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <p className="label text-muted">Skills</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {candidate.skills.slice(0, 7).map((skill) => (
              <li
                key={skill}
                className="rounded-sm border border-line-soft bg-surface-2 px-2 py-1 font-mono text-[11px] tracking-tight text-ink-2"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>

        {candidate.proof.length > 0 && (
          <section className="mt-5">
            <p className="label text-muted">Proof</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {candidate.proof.map((p) => (
                <li key={p.label} className="flex items-center gap-2">
                  <ProofIcon kind={p.kind} />
                  <span className="truncate text-[13.5px] text-hire">
                    {p.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {item && (
          <section className="mt-5 rounded-sm border border-line-soft bg-surface-2 px-3.5 py-3">
            <p className="label text-muted">Why this surfaced</p>
            <p className="mt-1.5 text-[13.5px] leading-[1.5] text-ink-2">
              {item.rationale}
            </p>
          </section>
        )}
      </div>

      {/* The intent block — the whole reason this product beats a job board. */}
      <footer className="grid grid-cols-3 border-t border-line-soft bg-surface-2">
        <IntentCell label="Notice" value={formatNotice(candidate.noticeDays)} />
        <IntentCell
          label="Expects"
          value={formatLpa(candidate.ctcExpected)}
          divider
        />
        <IntentCell
          label="Work"
          value={
            candidate.remotePref === "onsite"
              ? "On-site"
              : candidate.remotePref === "hybrid"
                ? "Hybrid"
                : "Remote"
          }
          divider
        />
      </footer>
    </article>
  );
}

function IntentCell({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div className={cn("px-4 py-3", divider && "border-l border-line-soft")}>
      <p className="label text-muted">{label}</p>
      <p className="mt-1 font-mono text-[13px] font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}

function FreshnessPill({
  state,
  days,
}: {
  state: "fresh" | "stale" | "expired";
  days: number;
}) {
  const copy =
    state === "fresh"
      ? days <= 1
        ? "Confirmed today"
        : `Confirmed ${days}d ago`
      : state === "stale"
        ? `Stale · ${days}d`
        : "Needs re-confirming";

  return (
    <span
      className={cn(
        "label shrink-0 rounded-sm border px-2 py-1",
        state === "fresh" && "border-keep/40 bg-keep-soft text-keep",
        state === "stale" && "border-warn/40 bg-warn-soft text-warn",
        state === "expired" && "border-pass/40 bg-pass-soft text-pass",
      )}
    >
      {copy}
    </span>
  );
}

function ProofIcon({ kind }: { kind: string }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0 text-muted",
  };

  if (kind === "github") {
    return (
      <svg {...common}>
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 20 5.1a4.9 4.9 0 0 0-.1-3.6s-1.1-.3-3.6 1.4a12.3 12.3 0 0 0-6.6 0C7.2 1.2 6.1 1.5 6.1 1.5A4.9 4.9 0 0 0 6 5.1 5.2 5.2 0 0 0 4.6 8.8c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
      </svg>
    );
  }
  if (kind === "writing" || kind === "case_study") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}
