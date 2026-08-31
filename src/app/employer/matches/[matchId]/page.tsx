import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/MessageThread";
import { getCandidate, getMatch, messagesForMatch } from "@/db/queries";
import { DEMO_RECRUITERS } from "@/lib/demo";
import {
  SENIORITY_LABEL,
  formatLpa,
  formatNotice,
  matchExpiry,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EmployerMatchPage({
  params,
}: PageProps<"/employer/matches/[matchId]">) {
  const { matchId } = await params;

  const match = await getMatch(matchId);
  if (!match) notFound();

  const recruiterId = DEMO_RECRUITERS[match.company.id];
  if (!recruiterId) notFound();

  const [thread, candidate] = await Promise.all([
    messagesForMatch(matchId),
    getCandidate(match.candidateId),
  ]);
  if (!candidate) notFound();

  const expiry = matchExpiry(match.expiresAt);
  const closed = expiry.expired || match.state !== "open";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
      <nav className="py-4 font-mono text-[12px] text-muted">
        <Link
          href={`/employer/pipeline/${match.job.id}`}
          className="hover:text-ink hover:underline"
        >
          Pipeline
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-2">{candidate.name}</span>
      </nav>

      <header className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">
              {candidate.name}
            </h1>
            <p className="mt-1 text-[13.5px] text-muted">
              {candidate.headline}
            </p>
          </div>
          <span
            className={
              closed
                ? "shrink-0 rounded-sm border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted"
                : expiry.daysLeft <= 3
                  ? "shrink-0 rounded-sm border border-warn/30 bg-warn-soft px-2 py-1 font-mono text-[11px] font-medium text-warn"
                  : "shrink-0 rounded-sm border border-keep/30 bg-keep-soft px-2 py-1 font-mono text-[11px] font-medium text-keep"
            }
          >
            {closed ? "Closed" : expiry.copy}
          </span>
        </div>

        {/* The intent block, repeated here so nobody has to go and look it up
            before writing the first message. It is the reason this match is
            worth more than an inbox full of applications. */}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line-soft pt-3 font-mono text-[12.5px] sm:grid-cols-4">
          <Pair label="For" value={match.job.title} />
          <Pair label="Notice" value={formatNotice(candidate.noticeDays)} />
          <Pair label="Expects" value={formatLpa(candidate.ctcExpected)} />
          <Pair
            label="Level"
            value={`${SENIORITY_LABEL[candidate.seniority]} · ${candidate.yearsExperience}y`}
          />
        </dl>
      </header>

      <div className="mt-4">
        <MessageThread
          matchId={match.id}
          senderId={recruiterId}
          senderName={match.company.name}
          otherName={candidate.name.split(" ")[0]}
          initialMessages={thread}
          closed={closed}
          closedReason={
            expiry.expired
              ? "This match expired. Two weeks is the limit — it applies to employers too."
              : undefined
          }
        />
      </div>
    </main>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium tabular-nums text-ink">
        {value}
      </dd>
    </div>
  );
}
