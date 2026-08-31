import { notFound } from "next/navigation";
import { SourcingDeck } from "@/components/SourcingDeck";
import { deckForJob, getJobWithCompany } from "@/db/queries";
import { DEMO_RECRUITERS } from "@/lib/demo";

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
