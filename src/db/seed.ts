/**
 * Loads the seed data into a real database.
 *
 * Run with:  npm run db:seed
 *
 * Idempotent: it clears the tables it owns first, so re-running gives you a
 * clean known state rather than duplicates.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  candidates as mockCandidates,
  companies as mockCompanies,
  deckItems as mockDeckItems,
  jobs as mockJobs,
} from "../lib/mock-data.ts";
import {
  candidateProfiles,
  companies,
  customSections,
  deckItems,
  educations,
  experiences,
  jobs,
  proofLinks,
  stealthBlocks,
  users,
} from "./schema.ts";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error(
    "No DIRECT_URL or DATABASE_URL. Copy .env.local.example to .env.local first.",
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

/** Stable UUIDs derived from the seed slugs, so re-seeding keeps the same ids. */
function idFor(slug: string): string {
  const hex = [...slug]
    .reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0");
  return `${hex}-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}

async function main() {
  console.log("Clearing seeded tables...");
  await db.delete(deckItems);
  await db.delete(stealthBlocks);
  await db.delete(customSections);
  await db.delete(proofLinks);
  await db.delete(educations);
  await db.delete(experiences);
  await db.delete(jobs);
  await db.delete(companies);
  await db.delete(candidateProfiles);
  await db.delete(users);

  console.log(`Inserting ${mockCompanies.length} companies...`);
  await db.insert(companies).values(
    mockCompanies.map((c) => ({
      id: idFor(c.id),
      name: c.name,
      domain: c.domain,
      city: c.city,
      headcount: c.headcount,
      industry: c.industry,
      blurb: c.blurb,
      verifiedAt: new Date(),
    })),
  );

  console.log(`Inserting ${mockJobs.length} jobs...`);
  await db.insert(jobs).values(
    mockJobs.map((j) => ({
      id: idFor(j.id),
      companyId: idFor(j.companyId),
      title: j.title,
      seniority: j.seniority,
      ctcMin: j.ctcMin,
      ctcMax: j.ctcMax,
      city: j.city,
      remote: j.remote,
      requirements: {
        mustHave: j.mustHave,
        niceToHave: j.niceToHave,
        whatMatters: j.whatMatters,
      },
      maxNoticeDays: j.maxNoticeDays,
      status: j.status,
      employmentType: j.employmentType,
      screeningQuestions: j.screeningQuestions,
      experienceMin: j.experienceMin,
      experienceMax: j.experienceMax,
      openings: j.openings,
      // Absolute dates, so a seed run months from now produces a list where
      // everything reads "posted 4 months ago" and the freshness filter looks
      // broken. scripts/stagger-job-dates.mjs re-stamps them, exactly as
      // refresh-availability.mjs does for candidates.
      createdAt: new Date(j.postedAt),
    })),
  );

  console.log(`Inserting ${mockCandidates.length} candidates...`);
  await db.insert(users).values(
    mockCandidates.map((c) => ({
      id: idFor(c.id),
      role: "candidate" as const,
      email: `${c.id.replace("cand_", "")}@example.com`,
      emailVerifiedAt: new Date(),
    })),
  );

  await db.insert(candidateProfiles).values(
    mockCandidates.map((c) => ({
      userId: idFor(c.id),
      name: c.name,
      headline: c.headline,
      city: c.city,
      photoUrl: c.photoUrl,
      yearsExperience: c.yearsExperience,
      seniority: c.seniority,
      skills: c.skills,
      noticeDays: c.noticeDays,
      ctcCurrent: c.ctcCurrent,
      ctcExpected: c.ctcExpected,
      remotePref: c.remotePref,
      availabilityConfirmedAt: new Date(c.availabilityConfirmedAt),
      openToWork: true,
    })),
  );

  const exp = mockCandidates.flatMap((c) =>
    c.experiences.map((e, i) => ({
      profileId: idFor(c.id),
      company: e.company,
      title: e.title,
      startYear: e.startYear,
      endYear: e.endYear,
      highlights: e.highlights,
      sortOrder: i,
    })),
  );
  if (exp.length) await db.insert(experiences).values(exp);

  const edu = mockCandidates.flatMap((c) =>
    c.education.map((e, i) => ({
      profileId: idFor(c.id),
      institution: e.institution,
      degree: e.degree,
      endYear: e.endYear,
      sortOrder: i,
    })),
  );
  if (edu.length) await db.insert(educations).values(edu);

  const proof = mockCandidates.flatMap((c) =>
    c.proof.map((p, i) => ({
      profileId: idFor(c.id),
      kind: p.kind,
      label: p.label,
      url: p.url,
      sortOrder: i,
    })),
  );
  if (proof.length) await db.insert(proofLinks).values(proof);

  const sections = mockCandidates.flatMap((c) =>
    c.customSections.map((s, i) => ({
      profileId: idFor(c.id),
      title: s.title,
      body: s.body,
      sortOrder: i,
    })),
  );
  if (sections.length) await db.insert(customSections).values(sections);

  const blocks = mockCandidates.flatMap((c) =>
    c.stealthBlocks.map((d) => ({
      profileId: idFor(c.id),
      blockedDomain: d,
    })),
  );
  if (blocks.length) await db.insert(stealthBlocks).values(blocks);

  console.log(`Inserting ${mockDeckItems.length} deck rows...`);
  const byJob = new Map<string, number>();
  await db.insert(deckItems).values(
    [...mockDeckItems]
      .sort((a, b) => b.score - a.score)
      .map((d) => {
        const rank = (byJob.get(d.jobId) ?? 0) + 1;
        byJob.set(d.jobId, rank);
        return {
          jobId: idFor(d.jobId),
          candidateId: idFor(d.candidateId),
          score: d.score,
          features: d.features,
          rationale: d.rationale,
          rank,
        };
      }),
  );

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
