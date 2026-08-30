import { availabilityState, type Candidate } from "./types";

/**
 * Profile completeness.
 *
 * Weighted by what actually gates a match, not by how many fields are blank.
 * The intent block and proof of work are worth far more than a filled-in
 * education row, because those are what a recruiter decides on — and thin
 * profiles are the supply-quality problem this product lives or dies by.
 *
 * Each item carries the nudge copy, so the UI can say "add your notice period"
 * instead of an unhelpful bare percentage.
 */
export interface CompletenessItem {
  id: string;
  label: string;
  /** What the candidate should do about it. */
  nudge: string;
  weight: number;
  done: boolean;
}

export interface Completeness {
  percent: number;
  items: CompletenessItem[];
  /** Highest-weight unfinished item — the one worth surfacing. */
  topGap: CompletenessItem | null;
}

export function profileCompleteness(candidate: Candidate): Completeness {
  const freshness = candidate.availabilityConfirmedAt
    ? availabilityState(candidate.availabilityConfirmedAt).state
    : "expired";

  const items: CompletenessItem[] = [
    {
      id: "availability",
      label: "Availability confirmed",
      nudge: "Confirm you are still looking — one tap keeps you in decks",
      weight: 18,
      done: freshness === "fresh",
    },
    {
      id: "experience",
      label: "Work history",
      nudge: "Add your current role",
      weight: 14,
      done: candidate.experiences.length > 0,
    },
    {
      id: "highlights",
      label: "Achievements",
      nudge: "Add two or three things you actually shipped",
      weight: 13,
      done: candidate.experiences.some((e) => e.highlights.length >= 2),
    },
    {
      id: "notice",
      label: "Notice period",
      nudge: "Add your notice period — recruiters filter on it first",
      weight: 12,
      done: candidate.noticeDays !== null && candidate.noticeDays !== undefined,
    },
    {
      id: "ctc",
      label: "Expected CTC",
      nudge: "Add your expected CTC to avoid wasted conversations",
      weight: 12,
      done: candidate.ctcExpected > 0,
    },
    {
      id: "locations",
      label: "Preferred locations",
      nudge: "Add every city you would work in, not just where you live",
      weight: 10,
      done: candidate.preferredLocations.length > 0,
    },
    {
      id: "proof",
      label: "Proof of work",
      nudge: "Link a repo, portfolio or something you wrote",
      weight: 10,
      done: candidate.proof.length > 0,
    },
    {
      id: "skills",
      label: "Skills",
      nudge: "Add at least three skills",
      weight: 6,
      done: candidate.skills.length >= 3,
    },
    {
      id: "headline",
      label: "Headline",
      nudge: "Write a one-line headline",
      weight: 5,
      done: candidate.headline.trim().length > 0,
    },
  ];

  const earned = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  const total = items.reduce((sum, i) => sum + i.weight, 0);

  const gaps = items.filter((i) => !i.done).sort((a, b) => b.weight - a.weight);

  return {
    percent: Math.round((earned / total) * 100),
    items,
    topGap: gaps[0] ?? null,
  };
}
