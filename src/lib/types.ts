/**
 * Domain types for Shortlist.
 *
 * These mirror the Postgres schema one-for-one so that swapping the mock
 * repository for real queries is a change of data source, not of shape.
 * Money is in rupees per annum (not lakhs) so arithmetic stays integer.
 */

export type Seniority = "junior" | "mid" | "senior" | "staff" | "lead";

export type RemotePreference = "onsite" | "hybrid" | "remote";

export type EmploymentType = "permanent" | "contract" | "internship";

/** A knockout question a recruiter sets on a requisition. */
export interface ScreeningQuestion {
  id: string;
  prompt: string;
  /** A "no" here removes the candidate from the deck rather than ranking down. */
  knockout: boolean;
}

export type SwipeDirection = "left" | "right";

/** Why a recruiter passed. Captured on every left swipe — one tap, and it is
 *  both ranking training data and the only useful feedback a candidate gets. */
export type PassReason =
  | "underqualified"
  | "overqualified"
  | "comp_mismatch"
  | "wrong_stack"
  | "notice_too_long"
  | "location_mismatch"
  | "other";

export const PASS_REASONS: { value: PassReason; label: string }[] = [
  { value: "underqualified", label: "Not enough depth" },
  { value: "overqualified", label: "Over-levelled" },
  { value: "comp_mismatch", label: "Comp mismatch" },
  { value: "wrong_stack", label: "Wrong stack" },
  { value: "notice_too_long", label: "Notice too long" },
  { value: "location_mismatch", label: "Location mismatch" },
  { value: "other", label: "Something else" },
];

export interface Experience {
  id: string;
  company: string;
  title: string;
  startYear: number;
  /** null means current. */
  endYear: number | null;
  /** Achievement bullets. These are what the employer card leads with. */
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  endYear: number;
}

export interface ProofLink {
  kind: "github" | "portfolio" | "writing" | "case_study" | "other";
  label: string;
  url: string;
}

/** A user-named free-form block. The candidate titles it themselves. */
export interface CustomSection {
  id: string;
  title: string;
  body: string;
}

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  /** Where they live now. */
  city: string;
  /** Where they would actually work. Drives location matching, not `city`. */
  preferredLocations: string[];
  employmentTypes: EmploymentType[];
  photoUrl: string | null;
  yearsExperience: number;
  seniority: Seniority;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  proof: ProofLink[];
  customSections: CustomSection[];

  /* --- the intent block: this is the product's actual differentiator --- */
  noticeDays: number;
  ctcCurrent: number;
  ctcExpected: number;
  remotePref: RemotePreference;
  /** ISO date. Drives the freshness decay — see availabilityState(). */
  availabilityConfirmedAt: string;

  /** Company domains this candidate is hidden from. Enforced in the query. */
  stealthBlocks: string[];
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  city: string;
  headcount: string;
  industry: string;
  blurb: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  seniority: Seniority;
  ctcMin: number;
  ctcMax: number;
  city: string;
  remote: RemotePreference;
  employmentType: EmploymentType;
  screeningQuestions: ScreeningQuestion[];
  mustHave: string[];
  niceToHave: string[];
  /** The three things the hiring manager actually cares about. */
  whatMatters: string[];
  maxNoticeDays: number;
  status: "draft" | "open" | "closed";
}

/** A scored, materialised deck row. Built nightly per open requisition. */
export interface DeckItem {
  candidateId: string;
  jobId: string;
  score: number;
  /** Kept for explainability — every ranking decision must be reconstructable. */
  features: {
    semantic: number;
    skillOverlap: number;
    seniorityFit: number;
    intentFreshness: number;
    responsiveness: number;
  };
  /** One sentence on why this surfaced. Generated, cached, never blocking. */
  rationale: string;
}

export interface Swipe {
  id: string;
  actorType: "candidate" | "employer";
  actorId: string;
  subjectId: string;
  jobId: string;
  direction: SwipeDirection;
  passReason: PassReason | null;
  rankShown: number;
  createdAt: string;
}

export type AvailabilityState = "fresh" | "stale" | "expired";

/** Availability decays on purpose. Fresh under 14 days, stale to 21, then the
 *  candidate leaves every deck until they re-confirm with one tap. */
export function availabilityState(
  confirmedAt: string,
  now: Date = new Date(),
): { state: AvailabilityState; days: number } {
  const days = Math.floor(
    (now.getTime() - new Date(confirmedAt).getTime()) / 86_400_000,
  );
  if (days <= 14) return { state: "fresh", days };
  if (days <= 21) return { state: "stale", days };
  return { state: "expired", days };
}

/** ₹1,850,000 -> "18.5 LPA". Lakhs are how comp is actually discussed here. */
export function formatLpa(rupees: number): string {
  const lakhs = rupees / 100_000;
  const rounded = Math.round(lakhs * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} LPA`;
}

export function formatLpaRange(min: number, max: number): string {
  const lo = Math.round((min / 100_000) * 10) / 10;
  const hi = Math.round((max / 100_000) * 10) / 10;
  return `${lo}–${hi} LPA`;
}

export function formatNotice(days: number): string {
  if (days === 0) return "Immediate";
  if (days % 30 === 0) return `${days / 30} month${days > 30 ? "s" : ""}`;
  return `${days} days`;
}
