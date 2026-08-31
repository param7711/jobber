import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/MessageThread";
import { getCandidateName, getMatch, messagesForMatch } from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import {
  WORK_MODE_LABEL,
  formatLpaRange,
  formatNotice,
  matchExpiry,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MatchThreadPage({
  params,
}: PageProps<"/candidate/matches/[matchId]">) {
  const { matchId } = await params;

  const match = await getMatch(matchId);
  if (!match || match.candidateId !== DEMO_CANDIDATE_ID) notFound();

  const [thread, name] = await Promise.all([
    messagesForMatch(matchId),
    getCandidateName(DEMO_CANDIDATE_ID),
  ]);

  const expiry = matchExpiry(match.expiresAt);
  const closed = expiry.expired || match.state !== "open";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
      <nav className="py-4 font-mono text-[12px] text-muted">
        <Link
          href="/candidate/matches"
          className="hover:text-ink hover:underline"
        >
          Matches
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-2">{match.job.title}</span>
      </nav>

      <header className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">
              {match.job.title}
            </h1>
            <p className="mt-1 text-[13.5px] text-muted">
              <Link
                href={`/companies/${match.company.id}`}
                className="hover:text-ink hover:underline"
              >
                {match.company.name}
              </Link>
              <span aria-hidden> · </span>
              {formatLpaRange(match.job.ctcMin, match.job.ctcMax)}
              <span aria-hidden> · </span>
              {match.job.remote === "remote"
                ? "Remote"
                : `${match.job.city} · ${WORK_MODE_LABEL[match.job.remote]}`}
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

        <p className="mt-3 border-t border-line-soft pt-3 text-[12.5px] leading-[1.45] text-muted">
          They already have your notice period, expected CTC and availability —
          all of it was on the card they swiped. This role accepts a notice
          period up to {formatNotice(match.job.maxNoticeDays)}. Skip the
          screening and talk about the work.
        </p>
      </header>

      <div className="mt-4">
        <MessageThread
          matchId={match.id}
          senderId={DEMO_CANDIDATE_ID}
          senderName={name?.split(" ")[0] ?? "You"}
          otherName={match.company.name}
          initialMessages={thread}
          closed={closed}
          closedReason={
            expiry.expired
              ? "This match expired. Matches last two weeks so neither side can leave the other hanging."
              : undefined
          }
        />
      </div>
    </main>
  );
}
