import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Clock, IndianRupee, MapPin, Users } from "lucide-react";
import { ApplyButton } from "@/components/ApplyButton";
import { SaveJobButton } from "@/components/SaveJobButton";
import { ApplicantCount, FitBadge } from "@/components/FitBadge";
import {
  applicantCounts,
  candidateDecisionOn,
  fitScoresFor,
  getJobWithCompany,
  savedJobIdsFor,
  similarJobs,
} from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import {
  EMPLOYMENT_TYPE_LABEL,
  SENIORITY_LABEL,
  WORK_MODE_LABEL,
  formatExperience,
  formatLpaRange,
  formatNotice,
  postedAgo,
} from "@/lib/types";
import { initials } from "@/lib/utils";

export default async function JobPage({ params }: PageProps<"/jobs/[jobId]">) {
  const { jobId } = await params;

  const found = await getJobWithCompany(jobId);
  if (!found) notFound();
  const { job, company } = found;

  const [savedIds, decision, similar, fits, applicants] = await Promise.all([
    savedJobIdsFor(DEMO_CANDIDATE_ID),
    candidateDecisionOn(DEMO_CANDIDATE_ID, job.id),
    similarJobs(job),
    fitScoresFor(DEMO_CANDIDATE_ID),
    applicantCounts([job.id]),
  ]);

  const fit = fits.get(job.id);
  const applicantCount = applicants.get(job.id) ?? 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <nav className="py-4 font-mono text-[12px] text-muted">
        <Link href="/jobs" className="hover:text-ink hover:underline">
          Jobs
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-2">{job.title}</span>
      </nav>

      <article className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 font-mono text-[13px] font-semibold text-ink-2"
          >
            {initials(company.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance">
              {job.title}
            </h1>
            <p className="mt-1 text-[14px] text-muted">
              <Link
                href={`/companies/${company.id}`}
                className="font-medium text-ink-2 hover:text-ink hover:underline"
              >
                {company.name}
              </Link>
              <span aria-hidden> · </span>
              {company.industry} · {company.headcount}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-x-5 gap-y-2.5 border-y border-line-soft py-4 font-mono text-[13px] sm:grid-cols-2">
          <Row
            icon={<Briefcase size={14} aria-hidden />}
            label="Experience"
            value={formatExperience(job.experienceMin, job.experienceMax)}
          />
          <Row
            icon={<IndianRupee size={14} aria-hidden />}
            label="Salary"
            value={formatLpaRange(job.ctcMin, job.ctcMax)}
          />
          <Row
            icon={<MapPin size={14} aria-hidden />}
            label="Location"
            value={
              job.remote === "remote"
                ? "Remote"
                : `${job.city} · ${WORK_MODE_LABEL[job.remote]}`
            }
          />
          <Row
            icon={<Clock size={14} aria-hidden />}
            label="Max notice"
            value={formatNotice(job.maxNoticeDays)}
          />
          <Row
            icon={<Users size={14} aria-hidden />}
            label="Openings"
            value={`${job.openings} · ${SENIORITY_LABEL[job.seniority]} · ${
              EMPLOYMENT_TYPE_LABEL[job.employmentType]
            }`}
          />
        </dl>

        {fit && (
          <div className="mt-4 rounded-sm border border-line-soft bg-surface-2 p-3">
            <FitBadge fit={fit} showWhy />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ApplyButton
            candidateId={DEMO_CANDIDATE_ID}
            jobId={job.id}
            alreadyApplied={decision === "right"}
            passed={decision === "left"}
          />
          <SaveJobButton
            candidateId={DEMO_CANDIDATE_ID}
            jobId={job.id}
            initialSaved={savedIds.has(job.id)}
            label
          />
          <span className="font-mono text-[12px] text-muted">
            {postedAgo(job.postedAt)}
          </span>
          <ApplicantCount n={applicantCount} />
        </div>
      </article>

      {job.jdText && (
        <Section title="Job description">
          <p className="whitespace-pre-line text-[14.5px] leading-[1.6] text-ink-2">
            {job.jdText}
          </p>
        </Section>
      )}

      {job.whatMatters.length > 0 && (
        <Section title="What actually matters here">
          <ul className="flex flex-col gap-2.5">
            {job.whatMatters.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 text-[14.5px] leading-[1.55] text-ink-2"
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
        </Section>
      )}

      <Section title="Skills">
        <div className="flex flex-col gap-3">
          <div>
            <p className="label text-muted">Must have</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {job.mustHave.map((s) => (
                <li
                  key={s}
                  className="rounded-sm border border-seek/30 bg-seek-soft px-2 py-1 font-mono text-[11.5px] text-seek"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {job.niceToHave.length > 0 && (
            <div>
              <p className="label text-muted">Nice to have</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {job.niceToHave.map((s) => (
                  <li
                    key={s}
                    className="rounded-sm border border-line-soft bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-muted"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {job.screeningQuestions.length > 0 && (
        <Section title="You will be asked">
          <ul className="flex flex-col gap-2.5">
            {job.screeningQuestions.map((q) => (
              <li key={q.id} className="flex gap-3">
                <span
                  aria-hidden
                  className={
                    q.knockout
                      ? "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-seek"
                      : "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-line"
                  }
                />
                <span className="text-[14px] leading-[1.5] text-ink-2">
                  {q.prompt}
                  {q.knockout && (
                    <span className="label ml-2 text-seek">required</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-snug text-muted">
            Answered once, before the employer sees your card — so a swipe is a
            decision, not a guess.
          </p>
        </Section>
      )}

      <Section title={`About ${company.name}`}>
        <p className="text-[14.5px] leading-[1.6] text-ink-2">{company.blurb}</p>
        <Link
          href={`/companies/${company.id}`}
          className="mt-3 inline-block font-mono text-[12.5px] text-seek hover:underline"
        >
          All roles at {company.name} →
        </Link>
      </Section>

      {similar.length > 0 && (
        <Section title="Similar roles">
          <ul className="flex flex-col gap-2">
            {similar.map(({ job: other, company: otherCompany, overlap }) => (
              <li key={other.id}>
                <Link
                  href={`/jobs/${other.id}`}
                  className="flex items-center justify-between gap-4 rounded-sm border border-line-soft bg-surface px-4 py-3 transition-colors hover:border-seek"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">
                      {other.title}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11.5px] text-muted">
                      {otherCompany.name} ·{" "}
                      {formatLpaRange(other.ctcMin, other.ctcMax)}
                      {overlap > 0 &&
                        ` · ${overlap} shared skill${overlap > 1 ? "s" : ""}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-muted">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="tabular-nums text-ink-2">{value}</dd>
    </div>
  );
}
