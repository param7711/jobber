import Link from "next/link";
import { ArrowRight, Bookmark, MessageSquare, Send } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { RecruiterActivityPanel } from "@/components/RecruiterActivity";
import {
  applicantCounts,
  applicationsForCandidate,
  fitScoresFor,
  getCandidate,
  listOpenJobs,
  listSavedJobs,
  matchesForCandidate,
  recruiterActivityForCandidate,
  savedJobIdsFor,
  searchJobs,
} from "@/db/queries";
import { profileCompleteness } from "@/lib/completeness";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import { availabilityState, formatLpaRange, matchExpiry } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/**
 * Read fresh on every request.
 *
 * Without this Next prerenders the page at build time — it has no fetch() to
 * infer freshness from, only a database call it cannot see into — and the
 * deployed site then serves whatever jobs existed when the build ran. A job
 * board frozen at build time is indistinguishable from a broken one.
 */
export const dynamic = "force-dynamic";

/**
 * The signed-in home.
 *
 * It used to be a list of links to the rest of the app, which is a site map
 * rather than a product. Every job board here opens on a dashboard for a good
 * reason: the person arriving has one question — "has anything happened?" — and
 * a link list makes them go and find out for themselves.
 *
 * Ordered by what is most likely to be true when nothing has happened. The
 * profile nudge and the recommended roles are always actionable; matches and
 * applications only appear once they exist, rather than sitting there as empty
 * boxes reminding you that nobody has replied.
 */
export default async function Home() {
  const candidate = await getCandidate(DEMO_CANDIDATE_ID);

  // No seeded profile — fall back to the plain index rather than crashing.
  if (!candidate) return <EmployerOnlyHome />;

  const [matches, applications, saved, activity, fits, openJobs, savedIds] =
    await Promise.all([
      matchesForCandidate(DEMO_CANDIDATE_ID),
      applicationsForCandidate(DEMO_CANDIDATE_ID),
      listSavedJobs(DEMO_CANDIDATE_ID),
      recruiterActivityForCandidate(DEMO_CANDIDATE_ID),
      fitScoresFor(DEMO_CANDIDATE_ID),
      // No filters: every open role, which both panels below draw from.
      searchJobs({}),
      savedJobIdsFor(DEMO_CANDIDATE_ID),
    ]);

  const completeness = profileCompleteness(candidate);
  const freshness = availabilityState(candidate.availabilityConfirmedAt);

  // The two best-scoring open roles they have not decided on yet. Showing a
  // role someone already swiped away is how a recommendation loses its
  // credibility on the first screen.
  const decided = new Set(applications.map((a) => a.job.id));
  const recommended = openJobs
    .filter((r) => !decided.has(r.job.id))
    .sort(
      (a, b) =>
        (fits.get(b.job.id)?.percent ?? 0) - (fits.get(a.job.id)?.percent ?? 0),
    )
    .slice(0, 2);

  const applicantsFor = await applicantCounts(recommended.map((r) => r.job.id));

  const liveMatches = matches.filter(
    (m) => m.state === "open" && !matchExpiry(m.expiresAt).expired,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      {/* ------------------------------------------------------- greeting */}
      <header className="flex flex-wrap items-center gap-3 py-6">
        <div
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-seek font-mono text-[14px] font-semibold text-white"
        >
          {initials(candidate.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.02em]">
            {candidate.name.split(" ")[0]}
          </h1>
          <p className="truncate text-[13.5px] text-muted">
            {candidate.headline}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[11px] font-medium",
            freshness.state === "fresh"
              ? "border-keep/30 bg-keep-soft text-keep"
              : freshness.state === "stale"
                ? "border-warn/30 bg-warn-soft text-warn"
                : "border-pass/30 bg-pass-soft text-pass",
          )}
        >
          {freshness.state === "fresh"
            ? "Visible to recruiters"
            : freshness.state === "stale"
              ? "Going stale"
              : "Hidden — confirm availability"}
        </span>
      </header>

      {/* ---------------------------------------------------------- tiles */}
      <ul className="grid grid-cols-3 gap-2.5">
        <Tile
          href="/candidate/matches"
          icon={<MessageSquare aria-hidden size={14} />}
          n={liveMatches.length}
          label="Open matches"
          accent={liveMatches.length > 0}
        />
        <Tile
          href="/candidate/applications"
          icon={<Send aria-hidden size={14} />}
          n={applications.length}
          label="Applications"
        />
        <Tile
          href="/candidate/applications?tab=saved"
          icon={<Bookmark aria-hidden size={14} />}
          n={saved.length}
          label="Saved"
        />
      </ul>

      {/*
        min-w-0 on both columns is load-bearing, not defensive.
        A grid item defaults to min-width:auto, so any single long string
        inside — a job title, a message preview — widens the track past the
        viewport and the whole page scrolls sideways on a phone. Every
        `truncate` below is inert without it.
      */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* --------------------------------------------- live matches */}
          {liveMatches.length > 0 && (
            <Panel
              title="Waiting on a reply"
              action={{ href: "/candidate/matches", label: "All matches" }}
            >
              <ul className="flex flex-col gap-2">
                {liveMatches.slice(0, 3).map((m) => {
                  const expiry = matchExpiry(m.expiresAt);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/candidate/matches/${m.id}`}
                        className="flex items-center gap-3 rounded-sm border border-line-soft bg-surface px-3.5 py-3 transition-colors hover:border-hire"
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-hire-soft font-mono text-[11px] font-semibold text-hire"
                        >
                          {initials(m.company.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">
                            {m.job.title}
                          </span>
                          <span className="block truncate text-[12.5px] text-muted">
                            {m.lastMessageBody ?? "No messages yet"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[11px]",
                            expiry.daysLeft <= 3 ? "text-warn" : "text-muted",
                          )}
                        >
                          {expiry.copy}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}

          {/* ----------------------------------------- recommended roles */}
          <Panel
            title="Matched to your profile"
            action={{ href: "/jobs", label: "Search all" }}
          >
            {recommended.length === 0 ? (
              <p className="text-[13.5px] text-muted">
                You have decided on every open role. New ones are scored
                overnight.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recommended.map(({ job, company }) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      company={company}
                      candidateId={DEMO_CANDIDATE_ID}
                      saved={savedIds.has(job.id)}
                      fit={fits.get(job.id)}
                      applicants={applicantsFor.get(job.id) ?? 0}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ------------------------------------------------ side column */}
        <aside className="flex min-w-0 flex-col gap-4">
          {/* One nudge, not a checklist — the full list lives on the profile. */}
          <section className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="label text-muted">Profile strength</h2>
              <p className="font-mono text-[14px] font-semibold tabular-nums">
                {completeness.percent}%
              </p>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profile ${completeness.percent} percent complete`}
            >
              <div
                className={
                  completeness.percent === 100
                    ? "h-full bg-keep"
                    : "h-full bg-seek"
                }
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            <p className="mt-2.5 text-[13px] leading-snug text-ink-2">
              {completeness.topGap?.nudge ??
                "Nothing missing. You show up in every deck you qualify for."}
            </p>
            <Link
              href="/candidate/profile"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-sm border border-line px-3 py-2 text-[13px] font-medium transition-colors hover:border-ink"
            >
              Open profile
              <ArrowRight aria-hidden size={13} />
            </Link>
          </section>

          <RecruiterActivityPanel activity={activity} />

          {/* ------------------------------------------- employer switch */}
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="label text-hire">Hiring instead?</h2>
            <p className="mt-2 text-[13px] leading-[1.45] text-muted">
              Each requisition has two directions: applicants who already said
              yes, and a ranked deck to source from.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {openJobs.map(({ job, company }) => (
                <li key={job.id} className="border-t border-line-soft pt-2">
                  <p className="truncate text-[13px] font-medium">
                    {job.title}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    {company.name} ·{" "}
                    {formatLpaRange(job.ctcMin, job.ctcMax)}
                  </p>
                  <div className="mt-1.5 flex gap-2">
                    <Link
                      href={`/employer/pipeline/${job.id}`}
                      className="label rounded-sm border border-hire px-2 py-1 text-hire transition-colors hover:bg-hire-soft"
                    >
                      Pipeline
                    </Link>
                    <Link
                      href={`/employer/sourcing/${job.id}`}
                      className="label rounded-sm border border-line px-2 py-1 text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      Source
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/employer/search"
              className="mt-3 block border-t border-line-soft pt-2.5 font-mono text-[11.5px] text-hire hover:underline"
            >
              Search candidates directly →
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Tile({
  href,
  icon,
  n,
  label,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  n: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-full flex-col justify-between rounded-lg border bg-surface p-3.5 transition-colors sm:p-4",
          accent ? "border-hire" : "border-line hover:border-ink-2/40",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11.5px]",
            accent ? "text-hire" : "text-muted",
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "mt-2 font-mono text-[24px] font-semibold leading-none tabular-nums",
            accent ? "text-hire" : "text-ink",
          )}
        >
          {n}
        </span>
        <span className="mt-1 text-[12px] leading-tight text-muted">
          {label}
        </span>
      </Link>
    </li>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="font-mono text-[11.5px] text-seek hover:underline"
          >
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Shown only if the candidate seed is missing — the app still has to work. */
async function EmployerOnlyHome() {
  const openJobs = await listOpenJobs();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
        Hiring, one card at a time
      </h1>
      <p className="mt-3 text-[14px] text-muted">
        No candidate profile is seeded, so there is no dashboard to show. Run{" "}
        <code className="font-mono text-[13px]">npm run db:seed</code>.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {openJobs.map(({ job, company }) => (
          <li key={job.id}>
            <Link
              href={`/employer/pipeline/${job.id}`}
              className="block rounded-lg border border-line bg-surface px-5 py-4 hover:border-hire"
            >
              <p className="text-[15px] font-semibold">{job.title}</p>
              <p className="font-mono text-[12.5px] text-muted">
                {company.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
