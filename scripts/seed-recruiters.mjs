/**
 * Seeds one recruiter per company, plus a short history of reason-coded passes
 * so the candidate-facing "why you are not hearing back" panel has something
 * real to aggregate.
 *
 * Idempotent — safe to re-run.
 *
 *   node --env-file=.env.local scripts/seed-recruiters.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const COMPANIES = {
  meridian: "81591ebf-0000-4000-8000-81591ebf8159",
  kavach: "0059b9e4-0000-4000-8000-0059b9e40059",
  tarang: "1555f773-0000-4000-8000-1555f7731555",
};

const RECRUITERS = [
  {
    id: "aaaa0001-0000-4000-8000-aaaa00010000",
    email: "recruiter@meridian.dev",
    company: COMPANIES.meridian,
  },
  {
    id: "aaaa0002-0000-4000-8000-aaaa00020000",
    email: "recruiter@kavachpay.in",
    company: COMPANIES.kavach,
  },
  {
    id: "aaaa0003-0000-4000-8000-aaaa00030000",
    email: "recruiter@taranglabs.com",
    company: COMPANIES.tarang,
  },
];

const ANANYA = "d8932092-0000-4000-8000-d8932092d893";
const JOBS = {
  meridianBe: "a7189e0e-0000-4000-8000-a7189e0ea718",
  kavachFe: "ab0f6d57-0000-4000-8000-ab0f6d57ab0f",
  tarangData: "d75b1395-0000-4000-8000-d75b1395d75b",
  kavachBe: "ab0f6cd3-0000-4000-8000-ab0f6cd3ab0f",
  tarangPlatform: "a64b1080-0000-4000-8000-a64b1080a64b",
};

/**
 * Ananya asks 44 LPA. Most of these bands top out below that, so comp is
 * genuinely her blocker — the panel should say so rather than invent a story.
 */
const HISTORY = [
  [RECRUITERS[0].id, JOBS.meridianBe, "comp_mismatch"],
  [RECRUITERS[1].id, JOBS.kavachBe, "comp_mismatch"],
  [RECRUITERS[2].id, JOBS.tarangPlatform, "comp_mismatch"],
  [RECRUITERS[1].id, JOBS.kavachFe, "wrong_stack"],
  [RECRUITERS[2].id, JOBS.tarangData, "notice_too_long"],
];

try {
  for (const r of RECRUITERS) {
    await sql`
      insert into users (id, role, email, email_verified_at)
      values (${r.id}, 'employer', ${r.email}, now())
      on conflict (id) do nothing
    `;
    await sql`
      insert into company_members (company_id, user_id, role)
      values (${r.company}, ${r.id}, 'recruiter')
      on conflict do nothing
    `;
  }

  for (const [actorId, jobId, reason] of HISTORY) {
    await sql`
      insert into swipes (actor_type, actor_id, subject_id, job_id, direction, pass_reason)
      values ('employer', ${actorId}, ${ANANYA}, ${jobId}, 'left', ${reason}::pass_reason)
      on conflict do nothing
    `;
  }

  const [u] = await sql`select count(*)::int n from users where role = 'employer'`;
  const [m] = await sql`select count(*)::int n from company_members`;
  const rows = await sql`
    select pass_reason, count(*)::int n
    from swipes
    where actor_type = 'employer' and subject_id = ${ANANYA} and direction = 'left'
    group by pass_reason order by n desc
  `;
  console.log("recruiters:", u.n, "| memberships:", m.n);
  console.log("pass reasons against Ananya:");
  for (const r of rows) console.log("  ", r.pass_reason, r.n);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
