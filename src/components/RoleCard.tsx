"use client";

import {
  formatLpaRange,
  formatNotice,
  type Company,
  type Job,
} from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/**
 * The candidate-side card. Candidates swipe on ROLES, never on companies —
 * everyone right-swipes a famous logo, so a company-level swipe carries no
 * information and the deck degenerates into a brand popularity contest.
 */
export function RoleCard({ job, company }: { job: Job; company: Company }) {
  const remoteCopy =
    job.remote === "onsite"
      ? `On-site · ${job.city}`
      : job.remote === "hybrid"
        ? `Hybrid · ${job.city}`
        : "Remote";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(21,24,33,0.05),0_12px_32px_-16px_rgba(21,24,33,0.25)]">
      <header className="border-b border-line-soft bg-seek-soft px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-seek font-mono text-[11px] font-semibold text-white"
          >
            {initials(company.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold leading-tight">
              {company.name}
            </p>
            <p className="truncate font-mono text-[11px] text-seek">
              {company.industry} · {company.headcount}
            </p>
          </div>
        </div>
        <h2 className="mt-3 text-[21px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance">
          {job.title}
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-[13px] font-medium tabular-nums">
            {formatLpaRange(job.ctcMin, job.ctcMax)}
          </span>
          <span aria-hidden className="text-line">·</span>
          <span className="font-mono text-[12px] text-ink-2">{remoteCopy}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <section>
          <p className="label text-muted">What actually matters here</p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {job.whatMatters.map((line, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-2"
              >
                <span
                  aria-hidden
                  className="mt-[3px] shrink-0 font-mono text-[11px] text-seek"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <p className="label text-muted">Must have</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {job.mustHave.map((skill) => (
              <li
                key={skill}
                className="rounded-sm border border-seek/30 bg-seek-soft px-2 py-1 font-mono text-[11px] tracking-tight text-seek"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>

        {job.niceToHave.length > 0 && (
          <section className="mt-3.5">
            <p className="label text-muted">Nice to have</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {job.niceToHave.map((skill) => (
                <li
                  key={skill}
                  className="rounded-sm border border-line-soft bg-surface-2 px-2 py-1 font-mono text-[11px] tracking-tight text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <p className="label text-muted">About</p>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-ink-2">
            {company.blurb}
          </p>
        </section>
      </div>

      <footer className="grid grid-cols-2 border-t border-line-soft bg-surface-2">
        <IntentCell
          label="Max notice"
          value={formatNotice(job.maxNoticeDays)}
        />
        <IntentCell label="Level" value={levelCopy(job.seniority)} divider />
      </footer>
    </article>
  );
}

function levelCopy(seniority: Job["seniority"]): string {
  return {
    junior: "Junior",
    mid: "Mid",
    senior: "Senior",
    staff: "Staff",
    lead: "Lead",
  }[seniority];
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
