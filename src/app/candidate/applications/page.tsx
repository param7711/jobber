import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import {
  applicationsForCandidate,
  listSavedJobs,
  savedJobIdsFor,
} from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import { formatLpaRange, postedAgo } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The application tracker.
 *
 * "I applied to forty jobs and heard nothing" is the defining experience of
 * job hunting here, and no board shows you where anything went. This page is
 * small on purpose: what you sent, and whether the employer has swiped back.
 *
 * There is no "rejected" state, and that is a product decision rather than an
 * omission — see applicationsForCandidate(). Aggregate feedback lives on the
 * profile, where a pattern across several passes can actually be acted on.
 */
export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/candidate/applications">) {
  const params = await searchParams;
  const tab = params.tab === "saved" ? "saved" : "applied";

  const [applications, saved, savedIds] = await Promise.all([
    applicationsForCandidate(DEMO_CANDIDATE_ID),
    listSavedJobs(DEMO_CANDIDATE_ID),
    savedJobIdsFor(DEMO_CANDIDATE_ID),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <header className="border-b border-line py-5">
        <p className="label text-seek">Your activity</p>
        <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
          Applications
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Every role you swiped right on, and everything you bookmarked for
          later.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-line" aria-label="Sections">
        <Tab href="/candidate/applications" active={tab === "applied"}>
          Applied
          <Count n={applications.length} />
        </Tab>
        <Tab href="/candidate/applications?tab=saved" active={tab === "saved"}>
          Saved
          <Count n={saved.length} />
        </Tab>
      </nav>

      {tab === "applied" ? (
        applications.length === 0 ? (
          <Empty
            line="You have not applied to anything yet."
            cta="Open your deck"
            href="/candidate/deck"
          />
        ) : (
          <ul className="mt-5 flex flex-col gap-2.5">
            {applications.map(({ job, company, appliedAt, status }) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink-2/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold leading-tight">
                        {job.title}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {company.name} ·{" "}
                        {formatLpaRange(job.ctcMin, job.ctcMax)}
                      </p>
                    </div>
                    <StatusPill status={status} />
                  </div>
                  <p className="mt-2.5 border-t border-line-soft pt-2.5 font-mono text-[11.5px] text-muted">
                    Applied {appliedAt.slice(0, 10)}
                    <span aria-hidden> · </span>
                    {postedAgo(job.postedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : saved.length === 0 ? (
        <Empty
          line="Nothing saved. The bookmark on any listing keeps it here."
          cta="Browse jobs"
          href="/jobs"
        />
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {saved.map(({ job, company }) => (
            <li key={job.id}>
              <JobCard
                job={job}
                company={company}
                candidateId={DEMO_CANDIDATE_ID}
                saved={savedIds.has(job.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatusPill({ status }: { status: "matched" | "awaiting" }) {
  const matched = status === "matched";
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border px-2 py-1 font-mono text-[11px] font-medium",
        matched
          ? "border-keep/30 bg-keep-soft text-keep"
          : "border-line bg-surface-2 text-muted",
      )}
    >
      {matched ? "Matched" : "Awaiting employer"}
    </span>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors",
        active
          ? "border-seek text-seek"
          : "border-transparent text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="rounded-sm bg-surface-2 px-1.5 font-mono text-[11px] tabular-nums text-muted">
      {n}
    </span>
  );
}

function Empty({
  line,
  cta,
  href,
}: {
  line: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-8 text-center">
      <p className="text-[14px] text-ink-2">{line}</p>
      <Link
        href={href}
        className="mt-3 inline-block rounded-sm border border-seek px-4 py-2 text-[13.5px] font-semibold text-seek transition-colors hover:bg-seek-soft"
      >
        {cta}
      </Link>
    </div>
  );
}
