/**
 * Adds inbound applications from seeded candidates.
 *
 *   node --env-file=.env.local scripts/seed-applicants.mjs
 *
 * Sibling of seed-recruiters.mjs, which seeds the outbound direction. Without
 * this every employer pipeline is empty and the "waiting on you" queue — the
 * whole point of that screen — demonstrates nothing.
 *
 * Only writes where the employer has not already decided, so it can be re-run
 * without resurrecting people who were passed on, and never for a candidate
 * whose availability has expired.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

// Days ago each application was sent, so the "waiting N days" ageing on the
// pipeline has a spread instead of everyone applying at the same instant.
const PLAN = [
  { candidate: "Vikram Shetty", job: "Senior Backend Engineer", daysAgo: 6 },
  { candidate: "Joseph Mathew", job: "Senior Backend Engineer", daysAgo: 2 },
  { candidate: "Rahul Deshpande", job: "Backend Engineer, Payments", daysAgo: 4 },
  { candidate: "Joseph Mathew", job: "Frontend Engineer II", daysAgo: 1 },
  { candidate: "Fatima Qureshi", job: "Data Engineer", daysAgo: 8 },
];

try {
  for (const { candidate, job, daysAgo } of PLAN) {
    const [row] = await sql`
      insert into swipes (actor_type, actor_id, subject_id, job_id, direction, created_at)
      select 'candidate', c.user_id, j.id, j.id, 'right',
             now() - (${daysAgo} || ' days')::interval
      from candidate_profiles c, jobs j
      where c.name = ${candidate}
        and j.title = ${job}
        and c.availability_confirmed_at > now() - interval '22 days'
      on conflict (actor_id, subject_id, job_id) do nothing
      returning id
    `;
    console.log(
      `${row ? "applied " : "skipped "} ${candidate.padEnd(18)} -> ${job}`,
    );
  }

  const rows = await sql`
    select j.title,
           count(*) filter (where s.direction = 'right')::int as applicants,
           count(*) filter (
             where s.direction = 'right'
               and not exists (
                 select 1 from swipes e
                 where e.actor_type = 'employer'
                   and e.job_id = s.job_id
                   and e.subject_id = s.actor_id
               )
           )::int as waiting
    from swipes s
    join jobs j on j.id = s.job_id
    where s.actor_type = 'candidate'
    group by j.title
    order by waiting desc
  `;
  console.log("");
  for (const r of rows) {
    console.log(
      `${r.title.padEnd(30)} ${String(r.applicants).padStart(2)} applied, ${r.waiting} waiting`,
    );
  }
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
