/**
 * Fills in the listing fields migration 0006 added, for a database that was
 * seeded before they existed.
 *
 *   node --env-file=.env.local scripts/backfill-0006.mjs
 *
 * Re-seeding would do the same job, but it deletes jobs — and swipes cascade
 * off jobs, so it would take the swipe log with it. That log is where pass
 * feedback and the application tracker come from, so it is worth a script.
 *
 * The migration already derived experience bands from seniority; this replaces
 * them with the per-role numbers, and adds the JD prose the search indexes.
 */
import postgres from "postgres";
import { jobs as mockJobs } from "../src/lib/mock-data.ts";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

/** Must match idFor() in src/db/seed.ts, or nothing lines up. */
function idFor(slug) {
  const hex = [...slug]
    .reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0");
  return `${hex}-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}

try {
  let updated = 0;

  for (const job of mockJobs) {
    const [row] = await sql`
      update jobs set
        jd_text         = ${job.jdText},
        experience_min  = ${job.experienceMin},
        experience_max  = ${job.experienceMax},
        openings        = ${job.openings},
        employment_type = ${job.employmentType},
        screening_questions = ${sql.json(job.screeningQuestions)}
      where id = ${idFor(job.id)}
      returning title
    `;
    if (row) {
      updated += 1;
      console.log(`updated  ${row.title}`);
    } else {
      console.warn(`MISSING  ${job.id} — not in the database`);
    }
  }

  console.log(`\n${updated}/${mockJobs.length} jobs updated.`);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
