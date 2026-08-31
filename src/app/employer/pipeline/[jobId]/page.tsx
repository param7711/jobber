import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  applicantsForJob,
  getJobWithCompany,
  matchesForJob,
  type Applicant,
} from "@/db/queries";
import {
  SENIORITY_LABEL,
  formatLpa,
  formatLpaRange,
  formatNotice,
  matchExpiry,
} from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The requisition's pipeline.
 *
 * Sourcing is outbound — the recruiter swiping through a ranked deck. This is
 * the inbound half, and it did not exist: candidates could apply to a role and
 * that interest went into the swipe log and never appeared on any screen a
 * recruiter looks at. Inbound applicants are the warmest people in the system,
 * because they have already said yes.
 *
 * Waiting applicants come first, oldest first. Everything else is a summary.
 */
export default async function PipelinePage({
  params,
}: PageProps<"/employer/pipeline/[jobId]">) {
  const { jobId } = await params;

  const found = await getJobWithCompany(jobId);
  if (!found) notFound();
  const { job, company } = found;

  const [applicants, matches] = await Promise.all([
    applicantsForJob(jobId),
    matchesForJob(jobId),
  ]);

  const waiting = applicants.filter((a) => a.employerDecision === null);
  // Matched applicants have their own section above with the conversation in
  // it; repeating them here as a bare name is noise, not a second fact.
  const decided = applicants.filter(
    (a) => a.employerDecision !== null && !a.matched,
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line py-5">
        <div className="min-w-0">
          <p className="label text-hire">Pipeline</p>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            {job.title}
          </h1>
          <p className="mt-1 font-mono text-[12.5px] text-muted">
            {company.name} · {formatLpaRange(job.ctcMin, job.ctcMax)} ·{" "}
            {job.openings} opening{job.openings > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/employer/sourcing/${job.id}`}
          className="label shrink-0 rounded-sm border border-hire px-3 py-2 text-hire transition-colors hover:bg-hire-soft"
        >
          Source more
        </Link>
      </header>

      <dl className="grid grid-cols-3 gap-3 border-b border-line py-4">
        <Stat n={waiting.length} label="Waiting on you" accent={waiting.length > 0} />
        <Stat n={matches.length} label="Matched" />
        <Stat n={applicants.length} label="Applied in total" />
      </dl>

      <Section
        title="Waiting on you"
        blurb="They applied and you have not decided yet. Longest wait first."
      >
        {waiting.length === 0 ? (
          <Empty>
            Nobody is waiting. Inbound applicants land here the moment they
            swipe right on this role.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {waiting.map((a) => (
              <li key={a.candidate.id}>
                <ApplicantRow
                  candidate={a.candidate}
                  waited={a.waitedDays}
                  jobId={job.id}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Matched"
        blurb="You both swiped right. The clock is the anti-ghosting rule — it applies to you too."
      >
        {matches.length === 0 ? (
          <Empty>
            No matches yet. A match needs your right swipe as well as theirs.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {matches.map((m) => {
              const expiry = matchExpiry(m.expiresAt);
              const dead = expiry.expired || m.state !== "open";
              return (
                <li key={m.id}>
                  <Link
                    href={`/employer/matches/${m.id}`}
                    className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-hire"
                  >
                    <div
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-hire-soft font-mono text-[11px] font-semibold text-hire"
                    >
                      {initials(m.candidateName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-[14.5px] font-semibold">
                          {m.candidateName}
                        </p>
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            dead
                              ? "text-muted"
                              : expiry.daysLeft <= 3
                                ? "text-warn"
                                : "text-muted",
                          )}
                        >
                          {dead ? "Closed" : expiry.copy}
                        </span>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-2">
                        <MessageSquare
                          aria-hidden
                          size={13}
                          className="shrink-0 text-muted"
                        />
                        {m.lastMessageBody ? (
                          <span className="truncate">{m.lastMessageBody}</span>
                        ) : (
                          <span className="text-muted">
                            No messages yet — you go first.
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {decided.length > 0 && (
        <Section title="Already decided" blurb="Applicants you have swiped on.">
          <ul className="flex flex-col gap-1.5">
            {decided.map((a) => (
              <li
                key={a.candidate.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-line-soft bg-surface px-4 py-2.5"
              >
                <span className="truncate text-[13.5px]">
                  {a.candidate.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[11px]",
                    a.matched
                      ? "text-keep"
                      : a.employerDecision === "right"
                        ? "text-hire"
                        : "text-muted",
                  )}
                >
                  {a.matched
                    ? "Matched"
                    : a.employerDecision === "right"
                      ? "Shortlisted"
                      : "Passed"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}

function ApplicantRow({
  candidate,
  waited,
  jobId,
}: {
  candidate: Applicant["candidate"];
  waited: number;
  jobId: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-2 font-mono text-[11px] font-semibold text-ink-2"
        >
          {initials(candidate.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-[14.5px] font-semibold leading-tight">
              {candidate.name}
            </p>
            <span
              className={cn(
                "font-mono text-[11px]",
                waited >= 5 ? "text-warn" : "text-muted",
              )}
            >
              {waited === 0
                ? "applied today"
                : `waiting ${waited} day${waited > 1 ? "s" : ""}`}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {candidate.headline}
          </p>

          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-ink-2">
            <Pair label="Experience" value={`${candidate.yearsExperience} yrs`} />
            <Pair label="Level" value={SENIORITY_LABEL[candidate.seniority]} />
            <Pair label="Notice" value={formatNotice(candidate.noticeDays)} />
            <Pair label="Expects" value={formatLpa(candidate.ctcExpected)} />
          </dl>

          {candidate.skills.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 6).map((s) => (
                <li
                  key={s}
                  className="rounded-sm bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 border-t border-line-soft pt-2.5 text-[12px] text-muted">
            Decide on them in{" "}
            <Link
              href={`/employer/sourcing/${jobId}`}
              className="text-hire hover:underline"
            >
              the deck
            </Link>{" "}
            — a pass there carries a reason, which is what the candidate
            eventually learns from.
          </p>
        </div>
      </div>
    </article>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Stat({
  n,
  label,
  accent,
}: {
  n: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dd
        className={cn(
          "font-mono text-[22px] font-semibold leading-none tabular-nums",
          accent ? "text-warn" : "text-ink",
        )}
      >
        {n}
      </dd>
      <dt className="mt-1.5 text-[12.5px] text-muted">{label}</dt>
    </div>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mb-3 mt-0.5 text-[12.5px] text-muted">{blurb}</p>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-surface px-5 py-4 text-[13.5px] leading-[1.5] text-muted">
      {children}
    </p>
  );
}
