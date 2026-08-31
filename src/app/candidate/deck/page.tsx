import { notFound } from "next/navigation";
import { CandidateDeckClient } from "./CandidateDeckClient";
import { CompletenessBar } from "@/components/CompletenessBar";
import { PassFeedbackPanel } from "@/components/PassFeedback";
import {
  deckForCandidate,
  getCandidate,
  passFeedbackForCandidate,
} from "@/db/queries";
import { profileCompleteness } from "@/lib/completeness";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";

/** The deck changes as roles open and swipes land; see app/page.tsx. */
export const dynamic = "force-dynamic";

export default async function CandidateDeckPage() {
  const candidate = await getCandidate(DEMO_CANDIDATE_ID);
  if (!candidate) notFound();

  const rows = await deckForCandidate(DEMO_CANDIDATE_ID);
  const completeness = profileCompleteness(candidate);
  const feedback = await passFeedbackForCandidate(DEMO_CANDIDATE_ID);

  return (
    <CandidateDeckClient
      candidateId={DEMO_CANDIDATE_ID}
      candidateFirstName={candidate.name.split(" ")[0]}
      rows={rows}
      completeness={<CompletenessBar completeness={completeness} />}
      passFeedback={<PassFeedbackPanel feedback={feedback} />}
    />
  );
}
