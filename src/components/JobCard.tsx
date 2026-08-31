import Link from "next/link";
import { Briefcase, IndianRupee, MapPin, Users } from "lucide-react";
import { ApplicantCount, FitBadge } from "@/components/FitBadge";
import { SaveJobButton } from "@/components/SaveJobButton";
import type { JobFit } from "@/db/queries";
import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
  formatExperience,
  formatLpaRange,
  postedAgo,
  type Company,
  type Job,
} from "@/lib/types";
import { initials } from "@/lib/utils";

/**
 * A row in the job list.
 *
 * The meta strip — experience, comp, location — is the whole point. Indian job
 * boards learned long ago that a candidate scans that line and nothing else,
 * and a listing that hides comp behind "as per industry standards" gets
 * skipped. So comp is a required field here, and it renders first.
 */
export function JobCard({
  job,
  company,
  candidateId,
  saved,
  fit,
  applicants,
}: {
  job: Job;
  company: Company;
  candidateId: string;
  saved: boolean;
  /** Undefined when this role has not been scored for this candidate yet. */
  fit?: JobFit;
  /** Undefined when counts were not fetched; 0 is a real, different answer. */
  applicants?: number;
}) {
  const location =
    job.remote === "remote" ? "Remote" : `${job.city} · ${WORK_MODE_LABEL[job.remote]}`;

  return (
    <article className="rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink-2/40 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-2 font-mono text-[12px] font-semibold text-ink-2"
        >
          {initials(company.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.01em]">
            <Link
              href={`/jobs/${job.id}`}
              className="hover:text-seek focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seek"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 truncate text-[13.5px] text-muted">
            <Link
              href={`/companies/${company.id}`}
              className="hover:text-ink hover:underline"
            >
              {company.name}
            </Link>
            <span aria-hidden> · </span>
            {company.industry}
          </p>
        </div>

        <SaveJobButton
          candidateId={candidateId}
          jobId={job.id}
          initialSaved={saved}
        />
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[12.5px] text-ink-2">
        <Meta icon={<Briefcase size={13} aria-hidden />} label="Experience">
          {formatExperience(job.experienceMin, job.experienceMax)}
        </Meta>
        <Meta icon={<IndianRupee size={13} aria-hidden />} label="Salary">
          {formatLpaRange(job.ctcMin, job.ctcMax)}
        </Meta>
        <Meta icon={<MapPin size={13} aria-hidden />} label="Location">
          {location}
        </Meta>
        {job.openings > 1 && (
          <Meta icon={<Users size={13} aria-hidden />} label="Openings">
            {job.openings} openings
          </Meta>
        )}
      </dl>

      {job.jdText && (
        <p className="mt-3 line-clamp-2 text-[13.5px] leading-[1.5] text-ink-2">
          {job.jdText}
        </p>
      )}

      {job.mustHave.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.mustHave.slice(0, 6).map((skill) => (
            <li
              key={skill}
              className="rounded-sm bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}

      {fit && (
        <div className="mt-3">
          <FitBadge fit={fit} />
        </div>
      )}

      <footer className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft pt-3 font-mono text-[11.5px] text-muted">
        <span>{postedAgo(job.postedAt)}</span>
        <span aria-hidden>·</span>
        <span>{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</span>
        {applicants !== undefined && (
          <>
            <span aria-hidden>·</span>
            <ApplicantCount n={applicants} />
          </>
        )}
      </footer>
    </article>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}
