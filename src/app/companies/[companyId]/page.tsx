import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, MapPin, Users } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { getCompanyWithJobs, savedJobIdsFor } from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import { initials } from "@/lib/utils";

/**
 * The company page.
 *
 * Candidates swipe roles rather than companies — a company-level swipe is a
 * brand popularity contest — but they still need somewhere to answer "who are
 * these people, and are they real". Hence a page you read, with no swipe
 * gesture on it.
 *
 * The verification badge is the load-bearing element. Manual approval, shown
 * plainly, is the cheapest defence against the fake-recruiter problem that
 * makes Indian job seekers distrust every listing they see.
 */
export default async function CompanyPage({
  params,
}: PageProps<"/companies/[companyId]">) {
  const { companyId } = await params;

  const found = await getCompanyWithJobs(companyId);
  if (!found) notFound();
  const { company, verified, openJobs } = found;

  const savedIds = await savedJobIdsFor(DEMO_CANDIDATE_ID);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <nav className="py-4 font-mono text-[12px] text-muted">
        <Link href="/jobs" className="hover:text-ink hover:underline">
          Jobs
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-2">{company.name}</span>
      </nav>

      <header className="overflow-hidden rounded-lg border border-line bg-surface">
        {/* A flat band rather than a cover photo. Nobody chose this company for
            its banner, and an empty image slot looks worse than no slot. */}
        <div aria-hidden className="h-16 bg-surface-2" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div
            aria-hidden
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-md border-2 border-surface bg-ink font-mono text-[16px] font-semibold text-surface"
          >
            {initials(company.name)}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
              {company.name}
            </h1>
            {verified ? (
              <span className="flex items-center gap-1 rounded-sm bg-keep-soft px-2 py-1 font-mono text-[11px] font-medium text-keep">
                <BadgeCheck size={13} aria-hidden />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-sm bg-warn-soft px-2 py-1 font-mono text-[11px] font-medium text-warn">
                Not yet verified
              </span>
            )}
          </div>

          <dl className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[12.5px] text-ink-2">
            <Meta icon={<Building2 size={13} aria-hidden />} label="Industry">
              {company.industry}
            </Meta>
            <Meta icon={<Users size={13} aria-hidden />} label="Headcount">
              {company.headcount}
            </Meta>
            {company.city && (
              <Meta icon={<MapPin size={13} aria-hidden />} label="Location">
                {company.city}
              </Meta>
            )}
            <Meta label="Domain">
              <span className="text-muted">{company.domain}</span>
            </Meta>
          </dl>

          {company.blurb && (
            <p className="mt-4 max-w-[64ch] text-[14.5px] leading-[1.6] text-ink-2">
              {company.blurb}
            </p>
          )}

          <p className="mt-4 border-t border-line-soft pt-3.5 text-[12.5px] leading-[1.5] text-muted">
            {verified
              ? "A human checked this company's domain and hiring authority before any role went live."
              : "Roles from unverified companies do not reach candidate decks."}{" "}
            You can hide yourself from any employer — including this one — from
            your profile.
          </p>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
          Open roles
          <span className="ml-2 font-mono text-[12.5px] font-normal text-muted">
            {openJobs.length}
          </span>
        </h2>

        {openJobs.length === 0 ? (
          <p className="mt-3 rounded-lg border border-line bg-surface px-5 py-4 text-[13.5px] text-muted">
            Nothing open right now.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {openJobs.map((job) => (
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
      </section>
    </main>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-muted">{icon}</span>}
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
