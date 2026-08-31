/**
 * Spreads job posting dates across the freshness window.
 *
 * The seed inserts every job in one transaction, so they all read "Posted
 * today" and the freshness filter on /jobs looks broken — every option returns
 * everything. Sibling of refresh-availability.mjs; run it for the same reason.
 *
 *   node --env-file=.env.local scripts/stagger-job-dates.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

// One job per bucket the /jobs freshness filter offers, so each option shows
// a different result set.
const DAYS_AGO = [0, 2, 6, 13, 24];

try {
  const jobs = await sql`select id, title from jobs order by created_at, title`;

  for (const [i, job] of jobs.entries()) {
    const days = DAYS_AGO[i % DAYS_AGO.length];
    await sql`
      update jobs
      set created_at = now() - (${days} || ' days')::interval
      where id = ${job.id}
    `;
  }

  const rows = await sql`
    select title,
           date_part('day', now() - created_at)::int as days,
           openings
    from jobs order by created_at desc
  `;
  for (const r of rows) {
    console.log(
      `${r.title.padEnd(30)} ${String(r.days).padStart(2)}d  ${r.openings} opening(s)`,
    );
  }
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
