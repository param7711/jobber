import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { matchesForCandidate } from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import { formatLpaRange, matchExpiry } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Matches — the only place a conversation can start.
 *
 * Both sides swiped right on the same role, so nobody here is being cold
 * messaged. That constraint is the product: recruiter outreach is worthless
 * everywhere else precisely because it costs the sender nothing.
 */
export default async function MatchesPage() {
  const matches = await matchesForCandidate(DEMO_CANDIDATE_ID);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <header className="border-b border-line py-5">
        <p className="label text-seek">Mutual interest</p>
        <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
          Matches
        </h1>
        <p className="mt-1 max-w-[60ch] text-[13.5px] text-muted">
          A match means the employer swiped right on you for a role you swiped
          right on. Each one expires, so neither side can leave the other
          hanging indefinitely.
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-8 text-center">
          <p className="text-[14px] text-ink-2">
            No matches yet. Applying is half of one — the employer has to swipe
            right on you too.
          </p>
          <Link
            href="/candidate/deck"
            className="mt-3 inline-block rounded-sm border border-seek px-4 py-2 text-[13.5px] font-semibold text-seek transition-colors hover:bg-seek-soft"
          >
            Open your deck
          </Link>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5">
          {matches.map((m) => {
            const expiry = matchExpiry(m.expiresAt);
            const dead = expiry.expired || m.state !== "open";

            return (
              <li key={m.id}>
                <Link
                  href={`/candidate/matches/${m.id}`}
                  className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-hire"
                >
                  <div
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-hire-soft font-mono text-[12px] font-semibold text-hire"
                  >
                    {initials(m.company.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h2 className="text-[15px] font-semibold leading-tight">
                        {m.job.title}
                      </h2>
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

                    <p className="mt-0.5 text-[13px] text-muted">
                      {m.company.name} ·{" "}
                      {formatLpaRange(m.job.ctcMin, m.job.ctcMax)}
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-2">
                      <MessageSquare
                        aria-hidden
                        size={13}
                        className="shrink-0 text-muted"
                      />
                      {m.lastMessageBody ? (
                        <span className="truncate">{m.lastMessageBody}</span>
                      ) : (
                        <span className="text-muted">
                          No messages yet — say something first.
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
    </main>
  );
}
