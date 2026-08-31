import Link from "next/link";
import { FilterPanel } from "@/components/FilterPanel";
import { JobCard } from "@/components/JobCard";
import {
  applicantCounts,
  fitScoresFor,
  savedJobIdsFor,
  searchJobs,
} from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
  type EmploymentType,
  type RemotePreference,
} from "@/lib/types";

const WORK_MODES: RemotePreference[] = ["onsite", "hybrid", "remote"];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  "permanent",
  "contract",
  "internship",
];

/** The buckets every job board offers, because they map to how people think. */
const FRESHNESS = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last week" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last month" },
];

/**
 * Job search — the front door.
 *
 * A plain GET form on purpose: the URL holds the whole search, so a result set
 * is shareable, the back button works, and it renders without JavaScript. That
 * matters more here than a live-filtering sidebar would; a lot of this market
 * is on a mid-range Android phone on a patchy connection.
 */
export default async function JobsPage({
  searchParams,
}: PageProps<"/jobs">) {
  const params = await searchParams;

  const one = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : undefined;
  const many = (k: string): string[] => {
    const v = params[k];
    if (Array.isArray(v)) return v;
    return typeof v === "string" ? [v] : [];
  };

  const q = one("q");
  const location = one("location");
  const experience = one("experience");
  const minCtc = one("minCtc");
  const posted = one("posted");
  const modes = many("mode").filter((m): m is RemotePreference =>
    (WORK_MODES as string[]).includes(m),
  );
  const types = many("type").filter((t): t is EmploymentType =>
    (EMPLOYMENT_TYPES as string[]).includes(t),
  );

  const filtered = Boolean(
    q || location || experience || minCtc || posted || modes.length || types.length,
  );

  // Everything except the keyword box, which stays visible above the results.
  const activeCount =
    [location, experience, minCtc, posted].filter(Boolean).length +
    modes.length +
    types.length;

  const [results, savedIds, fits] = await Promise.all([
    searchJobs({
      q,
      location,
      experience: experience ? Number(experience) : undefined,
      // Entered in lakhs, stored in rupees.
      minCtc: minCtc ? Number(minCtc) * 100_000 : undefined,
      workModes: modes.length ? modes : undefined,
      employmentTypes: types.length ? types : undefined,
      postedWithinDays: posted ? Number(posted) : undefined,
    }),
    savedJobIdsFor(DEMO_CANDIDATE_ID),
    fitScoresFor(DEMO_CANDIDATE_ID),
  ]);

  // Counted in a second pass because the set of jobs is not known until the
  // search has run. One query for the whole page, not one per card.
  const applicants = await applicantCounts(results.map((r) => r.job.id));

  /**
   * Roles scored 80+ against this profile, shown first and only when the
   * candidate has not narrowed things themselves. A recommendation strip on
   * top of an explicit search is a product overruling the person using it.
   */
  const recommended = filtered
    ? []
    : results
        .filter((r) => (fits.get(r.job.id)?.percent ?? 0) >= 80)
        .sort(
          (a, b) =>
            (fits.get(b.job.id)?.percent ?? 0) - (fits.get(a.job.id)?.percent ?? 0),
        )
        .slice(0, 2);

  const recommendedIds = new Set(recommended.map((r) => r.job.id));
  const rest = results.filter((r) => !recommendedIds.has(r.job.id));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <header className="border-b border-line py-5">
        <p className="label text-seek">Jobs</p>
        <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
          Search every open role
        </h1>
        <p className="mt-1 max-w-[60ch] text-[13.5px] text-muted">
          Every listing shows the salary band. A role that will not say what it
          pays does not get posted here.
        </p>
      </header>

      <div className="grid gap-6 pt-6 lg:grid-cols-[260px_1fr]">
        {/* One form wrapping both columns, so the keyword box at the top of the
            results submits the sidebar filters along with it. */}
        <form className="contents">
          <aside className="lg:sticky lg:top-[57px] lg:self-start">
            <FilterPanel
              activeCount={activeCount}
              onClear={
                filtered ? (
                  <Link
                    href="/jobs"
                    className="font-mono text-[11.5px] text-seek hover:underline"
                  >
                    Clear all
                  </Link>
                ) : null
              }
            >
              <Field label="Location">
                <input
                  type="text"
                  name="location"
                  defaultValue={location ?? ""}
                  placeholder="Bangalore"
                  className={INPUT}
                />
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  Remote roles always show, wherever you search.
                </p>
              </Field>

              <Field label="Your experience" hint="Years">
                <input
                  type="number"
                  name="experience"
                  min="0"
                  step="0.5"
                  defaultValue={experience ?? ""}
                  placeholder="4"
                  className={INPUT}
                />
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  Keeps roles whose band includes you.
                </p>
              </Field>

              <Field label="Minimum salary" hint="LPA">
                <input
                  type="number"
                  name="minCtc"
                  min="0"
                  step="0.5"
                  defaultValue={minCtc ?? ""}
                  placeholder="25"
                  className={INPUT}
                />
              </Field>

              <FieldGroup label="Work mode">
                {WORK_MODES.map((mode) => (
                  <Check
                    key={mode}
                    name="mode"
                    value={mode}
                    label={WORK_MODE_LABEL[mode]}
                    defaultChecked={modes.includes(mode)}
                  />
                ))}
              </FieldGroup>

              <FieldGroup label="Employment type">
                {EMPLOYMENT_TYPES.map((type) => (
                  <Check
                    key={type}
                    name="type"
                    value={type}
                    label={EMPLOYMENT_TYPE_LABEL[type]}
                    defaultChecked={types.includes(type)}
                  />
                ))}
              </FieldGroup>

              <FieldGroup label="Posted">
                <Check
                  type="radio"
                  name="posted"
                  value=""
                  label="Any time"
                  defaultChecked={!posted}
                />
                {FRESHNESS.map((f) => (
                  <Check
                    key={f.value}
                    type="radio"
                    name="posted"
                    value={f.value}
                    label={f.label}
                    defaultChecked={posted === f.value}
                  />
                ))}
              </FieldGroup>
            </FilterPanel>
          </aside>

          <section className="min-w-0">
            <div className="flex gap-2">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Title, skill or company — e.g. Go payments"
                aria-label="Search jobs"
                className="min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 py-2.5 text-[14px] outline-none focus-visible:border-seek"
              />
              <button
                type="submit"
                className="shrink-0 rounded-sm border border-seek bg-seek px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seek"
              >
                Search
              </button>
            </div>

            <p className="mt-4 text-[13.5px] text-muted">
              {results.length === 0
                ? "No roles match. Loosen a filter — every term in the keyword box has to match."
                : `${results.length} open ${results.length === 1 ? "role" : "roles"}${
                    filtered ? " matching your filters" : ""
                  }. Newest first.`}
            </p>

            {recommended.length > 0 && (
              <section className="mt-4">
                <h2 className="label text-seek">Matched to your profile</h2>
                <ul className="mt-2 flex flex-col gap-3">
                  {recommended.map(({ job, company }) => (
                    <li key={job.id}>
                      <JobCard
                        job={job}
                        company={company}
                        candidateId={DEMO_CANDIDATE_ID}
                        saved={savedIds.has(job.id)}
                        fit={fits.get(job.id)}
                        applicants={applicants.get(job.id) ?? 0}
                      />
                    </li>
                  ))}
                </ul>
                <h2 className="label mt-6 text-muted">Everything else</h2>
              </section>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {rest.map(({ job, company }) => (
                <li key={job.id}>
                  <JobCard
                    job={job}
                    company={company}
                    candidateId={DEMO_CANDIDATE_ID}
                    saved={savedIds.has(job.id)}
                    fit={fits.get(job.id)}
                    applicants={applicants.get(job.id) ?? 0}
                  />
                </li>
              ))}
            </ul>

            {results.length > 0 && (
              <p className="mt-6 rounded-sm border border-line-soft bg-surface-2 px-4 py-3 text-[13px] leading-[1.5] text-ink-2">
                Searching is the manual route.{" "}
                <Link href="/candidate/deck" className="font-medium text-seek hover:underline">
                  Your deck
                </Link>{" "}
                ranks the same roles against your profile and asks for one
                decision each.
              </p>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}

const INPUT =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-[14px] outline-none focus-visible:border-seek";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label text-muted">
        {label}
        {hint && <span className="ml-1.5 normal-case opacity-70">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line-soft pt-3.5">
      <legend className="label text-muted">{label}</legend>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </fieldset>
  );
}

function Check({
  type = "checkbox",
  name,
  value,
  label,
  defaultChecked,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-2">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-3.5 w-3.5 shrink-0 accent-[var(--c-seek)]"
      />
      {label}
    </label>
  );
}
