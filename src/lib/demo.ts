/**
 * The stand-in for a session, until auth lands.
 *
 * These were duplicated across three route files, which is how you end up
 * "signed in" as two different people on two pages. One place to change, and
 * one place to delete when useSession() replaces it.
 *
 * Both ids are deterministic — the seed script derives them from the slugs
 * "cand_ananya" and the Meridian Systems company record.
 */
export const DEMO_CANDIDATE_ID = "d8932092-0000-4000-8000-d8932092d893";
export const DEMO_COMPANY_ID = "81591ebf-0000-4000-8000-81591ebf8159";

/**
 * Which recruiter is "signed in" for a given company.
 *
 * Only affects the actorId on a swipe and the sender on a message — decks and
 * pipelines are scoped by requisition, not by person.
 */
export const DEMO_RECRUITERS: Record<string, string> = {
  [DEMO_COMPANY_ID]: "aaaa0001-0000-4000-8000-aaaa00010000",
  "0059b9e4-0000-4000-8000-0059b9e40059": "aaaa0002-0000-4000-8000-aaaa00020000",
  "1555f773-0000-4000-8000-1555f7731555": "aaaa0003-0000-4000-8000-aaaa00030000",
};
