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
