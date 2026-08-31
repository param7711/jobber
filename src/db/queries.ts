import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "./index";
import {
  candidateProfiles,
  companies,
  customSections,
  deckItems,
  educations,
  experiences,
  jobs,
  matches,
  proofLinks,
  savedJobs,
  stealthBlocks,
  swipes,
} from "./schema";
import type {
  Candidate,
  Company,
  DeckItem,
  EmploymentType,
  Job,
  PassReason,
  RemotePreference,
} from "@/lib/types";

/**
 * The app connects as the `postgres` role, which BYPASSES row-level security.
 * So the stealth-block and availability rules are enforced here as well as in
 * the RLS policies — the policies cover Supabase-authenticated access, these
 * cover server-side rendering. Removing either one opens the hole.
 */

/**
 * Availability past 21 days drops a candidate out of every deck.
 *
 * The interval is 22 days, not 21, and that is deliberate: availabilityState()
 * floors to whole days and calls day 21 "stale but visible". Comparing against
 * '21 days' here would hide someone whose own card still read "Stale · 21d".
 * The two boundaries have to agree or the UI lies about who can see you.
 */
const NOT_EXPIRED = sql`${candidateProfiles.availabilityConfirmedAt} > now() - interval '22 days'`;

type ProfileRow = typeof candidateProfiles.$inferSelect;

/** Fetches the child rows for a set of profiles in three queries, not 3N. */
async function hydrateCandidates(rows: ProfileRow[]): Promise<Candidate[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.userId);

  const [exp, edu, proof, sections, blocks] = await Promise.all([
    db
      .select()
      .from(experiences)
      .where(inArray(experiences.profileId, ids))
      .orderBy(experiences.sortOrder),
    db
      .select()
      .from(educations)
      .where(inArray(educations.profileId, ids))
      .orderBy(educations.sortOrder),
    db
      .select()
      .from(proofLinks)
      .where(inArray(proofLinks.profileId, ids))
      .orderBy(proofLinks.sortOrder),
    db
      .select()
      .from(customSections)
      .where(inArray(customSections.profileId, ids))
      .orderBy(customSections.sortOrder),
    db.select().from(stealthBlocks).where(inArray(stealthBlocks.profileId, ids)),
  ]);

  const by = <T extends { profileId: string }>(list: T[], id: string) =>
    list.filter((r) => r.profileId === id);

  return rows.map((r) => ({
    id: r.userId,
    name: r.name,
    headline: r.headline,
    city: r.city,
    preferredLocations: r.preferredLocations,
    employmentTypes: r.employmentTypes,
    photoUrl: r.photoUrl,
    yearsExperience: r.yearsExperience,
    seniority: r.seniority,
    skills: r.skills,
    experiences: by(exp, r.userId).map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      startYear: e.startYear,
      endYear: e.endYear,
      highlights: e.highlights,
    })),
    education: by(edu, r.userId).map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      endYear: e.endYear ?? 0,
    })),
    proof: by(proof, r.userId).map((p) => ({
      kind: p.kind as Candidate["proof"][number]["kind"],
      label: p.label,
      url: p.url,
    })),
    customSections: by(sections, r.userId).map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
    })),
    noticeDays: r.noticeDays ?? 0,
    ctcCurrent: r.ctcCurrent ?? 0,
    ctcExpected: r.ctcExpected ?? 0,
    remotePref: r.remotePref,
    availabilityConfirmedAt: (
      r.availabilityConfirmedAt ?? new Date(0)
    ).toISOString(),
    stealthBlocks: by(blocks, r.userId).map((b) => b.blockedDomain),
  }));
}

function toJob(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    companyId: row.companyId,
    title: row.title,
    seniority: row.seniority,
    ctcMin: row.ctcMin ?? 0,
    ctcMax: row.ctcMax ?? 0,
    city: row.city ?? "",
    remote: row.remote,
    employmentType: row.employmentType,
    screeningQuestions: row.screeningQuestions ?? [],
    mustHave: row.requirements?.mustHave ?? [],
    niceToHave: row.requirements?.niceToHave ?? [],
    whatMatters: row.requirements?.whatMatters ?? [],
    maxNoticeDays: row.maxNoticeDays ?? 90,
    status: row.status,
    experienceMin: row.experienceMin,
    experienceMax: row.experienceMax,
    openings: row.openings,
    postedAt: row.createdAt.toISOString(),
    jdText: row.jdText ?? "",
  };
}

function toCompany(row: typeof companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    city: row.city ?? "",
    headcount: row.headcount ?? "",
    industry: row.industry ?? "",
    blurb: row.blurb ?? "",
  };
}

function toDeckItem(row: typeof deckItems.$inferSelect): DeckItem {
  return {
    candidateId: row.candidateId,
    jobId: row.jobId,
    score: row.score,
    features: row.features ?? {
      semantic: 0,
      skillOverlap: 0,
      seniorityFit: 0,
      intentFreshness: 0,
      responsiveness: 0,
    },
    rationale: row.rationale ?? "",
  };
}

/** The employer's deck for one requisition. */
export async function deckForJob(jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) return [];
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, job.companyId))
    .limit(1);
  if (!company) return [];

  const rows = await db
    .select({ item: deckItems, profile: candidateProfiles })
    .from(deckItems)
    .innerJoin(
      candidateProfiles,
      eq(candidateProfiles.userId, deckItems.candidateId),
    )
    .where(
      and(
        eq(deckItems.jobId, jobId),
        eq(candidateProfiles.openToWork, true),
        NOT_EXPIRED,
        // The stealth guarantee, enforced in SQL rather than in a filter the
        // next refactor could quietly drop.
        sql`NOT EXISTS (
          SELECT 1 FROM ${stealthBlocks} sb
          WHERE sb.profile_id = ${candidateProfiles.userId}
            AND lower(sb.blocked_domain) = lower(${company.domain})
        )`,
      ),
    )
    .orderBy(desc(deckItems.score));

  const hydrated = await hydrateCandidates(rows.map((r) => r.profile));
  return rows.map((r, i) => ({
    item: toDeckItem(r.item),
    candidate: hydrated[i],
  }));
}

/** The candidate's deck: open roles, best fit first. Roles, never companies. */
export async function deckForCandidate(candidateId: string) {
  const rows = await db
    .select({ item: deckItems, job: jobs, company: companies })
    .from(deckItems)
    .innerJoin(jobs, eq(jobs.id, deckItems.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(
      and(
        eq(deckItems.candidateId, candidateId),
        eq(jobs.status, "open"),
        // Never show a candidate a role at a company they have blocked.
        sql`NOT EXISTS (
          SELECT 1 FROM ${stealthBlocks} sb
          WHERE sb.profile_id = ${deckItems.candidateId}
            AND lower(sb.blocked_domain) = lower(${companies.domain})
        )`,
      ),
    )
    .orderBy(desc(deckItems.score));

  return rows.map((r) => ({
    item: toDeckItem(r.item),
    job: toJob(r.job),
    company: toCompany(r.company),
  }));
}

export async function listOpenJobs() {
  const rows = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.status, "open"))
    .orderBy(jobs.title);
  return rows.map((r) => ({ job: toJob(r.job), company: toCompany(r.company) }));
}

export async function getJobWithCompany(jobId: string) {
  const [row] = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!row) return null;
  return { job: toJob(row.job), company: toCompany(row.company) };
}

/** Full profile for the signed-in candidate — feeds the completeness score. */
export async function getCandidate(candidateId: string): Promise<Candidate | null> {
  const rows = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, candidateId))
    .limit(1);
  if (rows.length === 0) return null;
  const [candidate] = await hydrateCandidates(rows);
  return candidate ?? null;
}

export async function getCandidateName(candidateId: string) {
  const [row] = await db
    .select({ name: candidateProfiles.name })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, candidateId))
    .limit(1);
  return row?.name ?? null;
}

/**
 * Aggregated pass feedback for one candidate.
 *
 * Three rules make this safe to show a person:
 *   1. AGGREGATE ONLY. Never which company, never which recruiter, never when.
 *      A candidate learning "Meridian rejected you" is a different and much
 *      worse product than learning "comp is your blocker".
 *   2. THRESHOLD. Below MIN_PASSES_TO_SHOW there is no pattern, only a
 *      rejection — and telling someone about a single pass is just cruelty
 *      with a progress bar.
 *   3. ACTIONABLE ONLY. Reasons map to something the candidate can change.
 *
 * Nobody else in the Indian market tells candidates this, and the data is
 * already in the swipe log as a by-product of the reason codes.
 */
export const MIN_PASSES_TO_SHOW = 3;

export interface PassFeedback {
  totalPasses: number;
  /** Null when below the threshold — the UI shows nothing at all. */
  topReason: { reason: PassReason; count: number } | null;
  breakdown: { reason: PassReason; count: number }[];
}

export async function passFeedbackForCandidate(
  candidateId: string,
): Promise<PassFeedback> {
  const rows = await db
    .select({
      reason: swipes.passReason,
      count: sql<number>`count(*)::int`,
    })
    .from(swipes)
    .where(
      and(
        eq(swipes.actorType, "employer"),
        eq(swipes.subjectId, candidateId),
        eq(swipes.direction, "left"),
      ),
    )
    .groupBy(swipes.passReason);

  const breakdown = rows
    .filter((r): r is { reason: PassReason; count: number } => r.reason !== null)
    .sort((a, b) => b.count - a.count);

  const totalPasses = rows.reduce((sum, r) => sum + r.count, 0);

  return {
    totalPasses,
    topReason:
      totalPasses >= MIN_PASSES_TO_SHOW && breakdown.length > 0
        ? breakdown[0]
        : null,
    breakdown,
  };
}

export interface SearchFilters {
  /** Free text across headline, skills and company names. */
  q?: string;
  /** Candidate must be willing to work in at least one of these. */
  locations?: string[];
  maxNoticeDays?: number;
  maxCtcExpected?: number;
}

/**
 * Recruiter keyword search — the escape hatch from the deck.
 *
 * A deck is right when a recruiter wants to be shown people; search is right
 * when they already know they need "Go and Kafka". Not having both is a reason
 * recruiters churn, so this complements the deck rather than replacing it.
 *
 * Availability decay and stealth blocks apply here exactly as they do in the
 * deck. A search result that leaked a blocked candidate would be the same
 * catastrophe by a different route.
 */
export async function searchCandidates(
  companyId: string,
  filters: SearchFilters,
): Promise<Candidate[]> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return [];

  const conditions = [
    eq(candidateProfiles.openToWork, true),
    NOT_EXPIRED,
    sql`NOT EXISTS (
      SELECT 1 FROM ${stealthBlocks} sb
      WHERE sb.profile_id = ${candidateProfiles.userId}
        AND lower(sb.blocked_domain) = lower(${company.domain})
    )`,
  ];

  const q = filters.q?.trim();
  if (q) {
    // Every term must appear somewhere — AND, not OR. A recruiter typing
    // "Go Kafka" wants both, and an OR search buries the good matches.
    for (const term of q.split(/\s+/).filter(Boolean)) {
      const like = `%${term}%`;
      conditions.push(sql`(
        ${candidateProfiles.headline} ILIKE ${like}
        OR EXISTS (
          SELECT 1 FROM unnest(${candidateProfiles.skills}) AS s
          WHERE s ILIKE ${like}
        )
        OR EXISTS (
          SELECT 1 FROM ${experiences} e
          WHERE e.profile_id = ${candidateProfiles.userId}
            AND (e.company ILIKE ${like} OR e.title ILIKE ${like})
        )
      )`);
    }
  }

  if (filters.locations?.length) {
    // One EXISTS per requested location, OR'd together. Passing an array to
    // ANY() looks tidier but drizzle sends it untyped and Postgres reads it
    // as an array literal — this avoids the problem rather than casting past it.
    const locationMatches = filters.locations.map(
      (l) => sql`EXISTS (
        SELECT 1 FROM unnest(${candidateProfiles.preferredLocations}) AS loc
        WHERE loc ILIKE ${`%${l}%`}
      )`,
    );
    const combined = or(...locationMatches);
    if (combined) conditions.push(combined);
  }

  if (filters.maxNoticeDays !== undefined) {
    conditions.push(
      sql`${candidateProfiles.noticeDays} <= ${filters.maxNoticeDays}`,
    );
  }

  if (filters.maxCtcExpected !== undefined) {
    conditions.push(
      sql`${candidateProfiles.ctcExpected} <= ${filters.maxCtcExpected}`,
    );
  }

  const rows = await db
    .select()
    .from(candidateProfiles)
    .where(and(...conditions))
    .orderBy(desc(candidateProfiles.availabilityConfirmedAt))
    .limit(50);

  return hydrateCandidates(rows);
}

/* -------------------------------------------------- candidate-side search */

export interface JobFilters {
  /** Free text over title, company and the requirement lists. */
  q?: string;
  /** Matched against the job's city, and never excludes remote roles. */
  location?: string;
  /** The candidate's own years. Keeps jobs whose band contains it. */
  experience?: number;
  /** Rupees per annum. Keeps jobs whose ceiling clears it. */
  minCtc?: number;
  workModes?: RemotePreference[];
  employmentTypes?: EmploymentType[];
  postedWithinDays?: number;
}

/**
 * Job search for candidates — the front door every Indian job board has and
 * this app did not.
 *
 * The deck is the opinionated path: five roles, ranked, one decision each. But
 * a candidate who already knows they want "Backend, Bangalore, 30 LPA+" finds
 * a deck patronising, and leaves. Search is the escape hatch, mirroring
 * searchCandidates() on the employer side.
 */
export async function searchJobs(filters: JobFilters) {
  const conditions = [eq(jobs.status, "open")];

  const q = filters.q?.trim();
  if (q) {
    // Every term must appear somewhere. Same rule as the recruiter search:
    // "react native" should not return every React job in the country.
    for (const term of q.split(/\s+/).filter(Boolean)) {
      const like = `%${term}%`;
      conditions.push(sql`(
        ${jobs.title} ILIKE ${like}
        OR ${companies.name} ILIKE ${like}
        OR ${jobs.jdText} ILIKE ${like}
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(
            coalesce(${jobs.requirements} -> 'mustHave', '[]'::jsonb)
            || coalesce(${jobs.requirements} -> 'niceToHave', '[]'::jsonb)
          ) AS skill
          WHERE skill ILIKE ${like}
        )
      )`);
    }
  }

  if (filters.location?.trim()) {
    const like = `%${filters.location.trim()}%`;
    // A remote role is available from anywhere, so filtering it out by city
    // would be wrong — the location filter narrows, it does not exclude.
    conditions.push(
      sql`(${jobs.city} ILIKE ${like} OR ${jobs.remote} = 'remote')`,
    );
  }

  if (filters.experience !== undefined) {
    conditions.push(
      sql`${jobs.experienceMin} <= ${filters.experience}
          AND (${jobs.experienceMax} IS NULL OR ${jobs.experienceMax} >= ${filters.experience})`,
    );
  }

  if (filters.minCtc !== undefined) {
    conditions.push(sql`${jobs.ctcMax} >= ${filters.minCtc}`);
  }

  if (filters.workModes?.length) {
    const modes = or(...filters.workModes.map((m) => eq(jobs.remote, m)));
    if (modes) conditions.push(modes);
  }

  if (filters.employmentTypes?.length) {
    const types = or(
      ...filters.employmentTypes.map((t) => eq(jobs.employmentType, t)),
    );
    if (types) conditions.push(types);
  }

  if (filters.postedWithinDays !== undefined) {
    conditions.push(
      sql`${jobs.createdAt} > now() - (${filters.postedWithinDays} || ' days')::interval`,
    );
  }

  const rows = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(and(...conditions))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  return rows.map((r) => ({ job: toJob(r.job), company: toCompany(r.company) }));
}

/** Other open roles sharing must-have skills. Ranked by overlap, then recency. */
export async function similarJobs(job: Job, limit = 3) {
  const rows = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(and(eq(jobs.status, "open"), ne(jobs.id, job.id)))
    .orderBy(desc(jobs.createdAt));

  const wanted = new Set(job.mustHave.map((s) => s.toLowerCase()));

  return rows
    .map((r) => {
      const other = toJob(r.job);
      const overlap = other.mustHave.filter((s) =>
        wanted.has(s.toLowerCase()),
      ).length;
      return { job: other, company: toCompany(r.company), overlap };
    })
    .filter((r) => r.overlap > 0 || r.job.seniority === job.seniority)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit);
}

export async function getCompanyWithJobs(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return null;

  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.status, "open")))
    .orderBy(desc(jobs.createdAt));

  return {
    company: toCompany(company),
    verified: company.verifiedAt !== null,
    openJobs: rows.map(toJob),
  };
}

/* ---------------------------------------------------------- saved + applied */

export async function savedJobIdsFor(candidateId: string): Promise<Set<string>> {
  const rows = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(eq(savedJobs.candidateId, candidateId));
  return new Set(rows.map((r) => r.jobId));
}

export async function listSavedJobs(candidateId: string) {
  const rows = await db
    .select({ job: jobs, company: companies, savedAt: savedJobs.createdAt })
    .from(savedJobs)
    .innerJoin(jobs, eq(jobs.id, savedJobs.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(savedJobs.candidateId, candidateId))
    .orderBy(desc(savedJobs.createdAt));

  return rows.map((r) => ({
    job: toJob(r.job),
    company: toCompany(r.company),
    savedAt: r.savedAt.toISOString(),
  }));
}

/** Has this candidate already decided on this role? Null means not yet. */
export async function candidateDecisionOn(candidateId: string, jobId: string) {
  const [row] = await db
    .select({ direction: swipes.direction })
    .from(swipes)
    .where(
      and(
        eq(swipes.actorType, "candidate"),
        eq(swipes.actorId, candidateId),
        eq(swipes.jobId, jobId),
      ),
    )
    .limit(1);
  return row?.direction ?? null;
}

export type ApplicationStatus = "matched" | "awaiting";

/**
 * The application tracker — "where did my applications go", which is the
 * single loudest complaint about every job board here.
 *
 * An application IS a candidate right-swipe; there is no separate table,
 * because a second source of truth would drift from the swipe log.
 *
 * Deliberately absent: any "they rejected you" state. A per-company rejection
 * shown to a candidate is the product passFeedbackForCandidate() exists to
 * avoid being — aggregate patterns help, individual verdicts only hurt.
 */
export async function applicationsForCandidate(candidateId: string) {
  const rows = await db
    .select({
      job: jobs,
      company: companies,
      appliedAt: swipes.createdAt,
      matchState: matches.state,
    })
    .from(swipes)
    .innerJoin(jobs, eq(jobs.id, swipes.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .leftJoin(
      matches,
      and(eq(matches.jobId, swipes.jobId), eq(matches.candidateId, candidateId)),
    )
    .where(
      and(
        eq(swipes.actorType, "candidate"),
        eq(swipes.actorId, candidateId),
        eq(swipes.direction, "right"),
      ),
    )
    .orderBy(desc(swipes.createdAt));

  return rows.map((r) => ({
    job: toJob(r.job),
    company: toCompany(r.company),
    appliedAt: r.appliedAt.toISOString(),
    status: (r.matchState === "open" || r.matchState === "hired"
      ? "matched"
      : "awaiting") as ApplicationStatus,
  }));
}

/* ------------------------------------------------------ recruiter activity */

export interface RecruiterActivity {
  /** Open requisitions this candidate is currently ranked into. */
  inDecks: number;
  /** Employer right-swipes. The number that actually means something. */
  shortlisted: number;
  /** Distinct companies whose recruiter has seen and acted on the card. */
  companiesReached: number;
  lastActivityAt: string | null;
}

/**
 * "Recruiter actions on your profile", the one candidate-side number every
 * Indian job board sells a subscription for — except each figure here is
 * defined, and the definition is shown next to it. A vague "23 recruiters
 * viewed you" is unfalsifiable and mostly bot traffic.
 */
export async function recruiterActivityForCandidate(
  candidateId: string,
): Promise<RecruiterActivity> {
  const [decks, acts] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(deckItems)
      .innerJoin(jobs, eq(jobs.id, deckItems.jobId))
      .where(and(eq(deckItems.candidateId, candidateId), eq(jobs.status, "open"))),
    db
      .select({
        shortlisted: sql<number>`count(*) FILTER (WHERE ${swipes.direction} = 'right')::int`,
        companies: sql<number>`count(DISTINCT ${jobs.companyId})::int`,
        last: sql<Date | null>`max(${swipes.createdAt})`,
      })
      .from(swipes)
      .innerJoin(jobs, eq(jobs.id, swipes.jobId))
      .where(
        and(eq(swipes.actorType, "employer"), eq(swipes.subjectId, candidateId)),
      ),
  ]);

  return {
    inDecks: decks[0]?.n ?? 0,
    shortlisted: acts[0]?.shortlisted ?? 0,
    companiesReached: acts[0]?.companies ?? 0,
    lastActivityAt: acts[0]?.last ? new Date(acts[0].last).toISOString() : null,
  };
}

/** Candidates whose availability has gone stale and need a nudge. */
export async function staleAvailability() {
  return db
    .select({ id: candidateProfiles.userId, name: candidateProfiles.name })
    .from(candidateProfiles)
    .where(
      and(
        eq(candidateProfiles.openToWork, true),
        or(
          isNull(candidateProfiles.availabilityConfirmedAt),
          sql`${candidateProfiles.availabilityConfirmedAt} <= now() - interval '14 days'`,
        ),
      ),
    );
}
