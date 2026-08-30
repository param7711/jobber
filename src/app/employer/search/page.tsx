import Link from "next/link";
import { CandidateCard } from "@/components/CandidateCard";
import { searchCandidates } from "@/db/queries";

/** Hard-coded demo company until auth lands. Meridian Systems. */
const DEMO_COMPANY_ID = "81591ebf-0000-4000-8000-81591ebf8159";

export default async function SearchPage({
  searchParams,
}: PageProps<"/employer/search">) {
  const params = await searchParams;

  const raw = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : undefined;

  const q = raw("q");
  const location = raw("location");
  const notice = raw("notice");
  const ctc = raw("ctc");

  const searched = Boolean(q || location || notice || ctc);

  const results = searched
    ? await searchCandidates(DEMO_COMPANY_ID, {
        q,
        locations: location ? [location] : undefined,
        maxNoticeDays: notice ? Number(notice) : undefined,
        // Entered in lakhs, stored in rupees.
        maxCtcExpected: ctc ? Number(ctc) * 100_000 : undefined,
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line py-5">
        <div>
          <p className="label text-hire">Search</p>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            Find candidates directly
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            For when you already know what you need. The deck is better when
            you want to be shown people.
          </p>
        </div>
        <Link
          href="/"
          className="label rounded-sm border border-line px-2.5 py-1.5 text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Exit
        </Link>
      </header>

      {/* A plain GET form: shareable URLs, back button works, no JS needed. */}
      <form className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Keywords" hint="All terms must match">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Go Kafka"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-[14px] outline-none focus-visible:border-hire"
          />
        </Field>
        <Field label="Location">
          <input
            type="text"
            name="location"
            defaultValue={location ?? ""}
            placeholder="Bangalore"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-[14px] outline-none focus-visible:border-hire"
          />
        </Field>
        <Field label="Max notice" hint="Days">
          <input
            type="number"
            name="notice"
            min="0"
            defaultValue={notice ?? ""}
            placeholder="60"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-[14px] tabular-nums outline-none focus-visible:border-hire"
          />
        </Field>
        <Field label="Max expected" hint="LPA">
          <input
            type="number"
            name="ctc"
            min="0"
            step="0.5"
            defaultValue={ctc ?? ""}
            placeholder="45"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-[14px] tabular-nums outline-none focus-visible:border-hire"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-sm border border-hire bg-hire px-4 py-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hire"
          >
            Search
          </button>
        </div>
      </form>

      {searched && (
        <p className="border-t border-line pt-5 text-[13.5px] text-muted">
          {results.length === 0
            ? "Nobody matches. Try fewer keywords — every term has to match."
            : `${results.length} ${results.length === 1 ? "candidate" : "candidates"}. Stale profiles and anyone who blocked you are already excluded.`}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((candidate) => (
            <li key={candidate.id} className="h-[520px]">
              <CandidateCard candidate={candidate} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
    <label className="flex flex-col gap-1.5">
      <span className="label text-muted">
        {label}
        {hint && <span className="ml-1.5 normal-case opacity-70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
