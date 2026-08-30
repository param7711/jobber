import Link from "next/link";
import { listOpenJobs } from "@/db/queries";
import { formatLpaRange } from "@/lib/types";

export default async function Home() {
  const openJobs = await listOpenJobs();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <p className="label text-muted">Shortlist · local development</p>
      <h1 className="mt-3 max-w-[16ch] text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-balance">
        Hiring, one card at a time
      </h1>
      <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-ink-2">
        Every candidate in a deck has confirmed their notice period, expected
        CTC and that they are actively looking — within the last fortnight. The
        swiping is just how you get through them.
      </p>

      <section className="mt-10">
        <h2 className="label text-seek">Candidate side</h2>
        <Link
          href="/candidate/deck"
          className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4 transition-colors hover:border-seek"
        >
          <div>
            <p className="text-[15px] font-semibold">Role deck</p>
            <p className="mt-0.5 text-[13.5px] text-muted">
              Swipe roles, not companies. Signed in as Ananya Rao.
            </p>
          </div>
          <Arrow />
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="label text-hire">Employer side</h2>
        <p className="mt-2 text-[13.5px] text-muted">
          Sourcing always happens inside a requisition. Pick one:
        </p>
        <Link
          href="/employer/search"
          className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4 transition-colors hover:border-hire"
        >
          <div>
            <p className="text-[15px] font-semibold">Search candidates</p>
            <p className="mt-0.5 text-[13.5px] text-muted">
              For when you already know what you need.
            </p>
          </div>
          <Arrow />
        </Link>
        <ul className="mt-3 flex flex-col gap-2">
          {openJobs.map(({ job, company }) => {
            return (
              <li key={job.id}>
                <Link
                  href={`/employer/sourcing/${job.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4 transition-colors hover:border-hire"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {job.title}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[12.5px] text-muted">
                      {company.name} · {formatLpaRange(job.ctcMin, job.ctcMax)}{" "}
                      · {job.city}
                    </p>
                  </div>
                  <Arrow />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-10 border-t border-line pt-5 font-mono text-[12px] leading-[1.7] text-muted">
        Reading live from Postgres. Candidate swipes persist to the swipe log;
        employer shortlists are still component state, pending accounts.
      </p>
    </main>
  );
}

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-muted"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
