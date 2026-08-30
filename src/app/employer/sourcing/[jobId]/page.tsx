import { notFound } from "next/navigation";
import { SourcingDeck } from "@/components/SourcingDeck";
import { deckForJob, getJobWithCompany } from "@/db/queries";

/**
 * Hard-coded demo recruiter until auth lands. Which recruiter is swiping only
 * affects the swipe log's actorId — the deck itself is scoped by requisition.
 */
const DEMO_RECRUITERS: Record<string, string> = {
  "81591ebf-0000-4000-8000-81591ebf8159": "aaaa0001-0000-4000-8000-aaaa00010000",
  "0059b9e4-0000-4000-8000-0059b9e40059": "aaaa0002-0000-4000-8000-aaaa00020000",
  "1555f773-0000-4000-8000-1555f7731555": "aaaa0003-0000-4000-8000-aaaa00030000",
};

export default async function SourcingPage({
  params,
}: PageProps<"/employer/sourcing/[jobId]">) {
  const { jobId } = await params;
  const result = await getJobWithCompany(jobId);
  if (!result) notFound();

  const rows = await deckForJob(jobId);

  const recruiterId = DEMO_RECRUITERS[result.company.id];
  if (!recruiterId) notFound();

  return (
    <SourcingDeck
      job={result.job}
      company={result.company}
      rows={rows}
      recruiterId={recruiterId}
    />
  );
}
