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

/**
 * Signed-in candidate is hard-coded until auth lands. The uuid is the
 * deterministic id the seed script derives for "cand_ananya".
 */
const DEMO_CANDIDATE_ID = "d8932092-0000-4000-8000-d8932092d893";

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
