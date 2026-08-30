/**
 * Emits the seed data as plain SQL on stdout.
 *
 * Exists so the database can be seeded without a connection string — the SQL
 * gets applied through whatever channel is available. Uses the same id
 * derivation as src/db/seed.ts, so both paths produce identical rows.
 *
 *   node scripts/gen-seed-sql.ts > seed.sql
 */
import {
  candidates,
  companies,
  deckItems,
  jobs,
} from "../src/lib/mock-data.ts";

function idFor(slug: string): string {
  const hex = [...slug]
    .reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0");
  return `${hex}-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}

const q = (v: string | null) =>
  v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`;
const arr = (xs: string[]) =>
  `ARRAY[${xs.map((x) => q(x)).join(",")}]::text[]`;
const n = (v: number | null) => (v === null ? "NULL" : String(v));

const out: string[] = [];

out.push(
  "DELETE FROM deck_items; DELETE FROM stealth_blocks; DELETE FROM custom_sections;",
  "DELETE FROM proof_links; DELETE FROM educations; DELETE FROM experiences;",
  "DELETE FROM jobs; DELETE FROM companies; DELETE FROM candidate_profiles; DELETE FROM users;",
);

out.push(
  "INSERT INTO companies (id,name,domain,city,headcount,industry,blurb,verified_at) VALUES\n" +
    companies
      .map(
        (c) =>
          `(${q(idFor(c.id))},${q(c.name)},${q(c.domain)},${q(c.city)},${q(c.headcount)},${q(c.industry)},${q(c.blurb)},now())`,
      )
      .join(",\n") +
    ";",
);

out.push(
  "INSERT INTO jobs (id,company_id,title,seniority,ctc_min,ctc_max,city,remote,requirements,max_notice_days,status) VALUES\n" +
    jobs
      .map(
        (j) =>
          `(${q(idFor(j.id))},${q(idFor(j.companyId))},${q(j.title)},${q(j.seniority)}::seniority,${n(j.ctcMin)},${n(j.ctcMax)},${q(j.city)},${q(j.remote)}::remote_pref,${q(
            JSON.stringify({
              mustHave: j.mustHave,
              niceToHave: j.niceToHave,
              whatMatters: j.whatMatters,
            }),
          )}::jsonb,${n(j.maxNoticeDays)},${q(j.status)}::job_status)`,
      )
      .join(",\n") +
    ";",
);

out.push(
  "INSERT INTO users (id,role,email,email_verified_at) VALUES\n" +
    candidates
      .map(
        (c) =>
          `(${q(idFor(c.id))},'candidate'::user_role,${q(`${c.id.replace("cand_", "")}@example.com`)},now())`,
      )
      .join(",\n") +
    ";",
);

out.push(
  "INSERT INTO candidate_profiles (user_id,name,headline,city,photo_url,years_experience,seniority,skills,notice_days,ctc_current,ctc_expected,remote_pref,availability_confirmed_at,open_to_work) VALUES\n" +
    candidates
      .map(
        (c) =>
          `(${q(idFor(c.id))},${q(c.name)},${q(c.headline)},${q(c.city)},${q(c.photoUrl)},${c.yearsExperience},${q(c.seniority)}::seniority,${arr(c.skills)},${n(c.noticeDays)},${n(c.ctcCurrent)},${n(c.ctcExpected)},${q(c.remotePref)}::remote_pref,${q(c.availabilityConfirmedAt)}::timestamptz,true)`,
      )
      .join(",\n") +
    ";",
);

const exp = candidates.flatMap((c) =>
  c.experiences.map(
    (e, i) =>
      `(${q(idFor(c.id))},${q(e.company)},${q(e.title)},${e.startYear},${n(e.endYear)},${arr(e.highlights)},${i})`,
  ),
);
if (exp.length)
  out.push(
    "INSERT INTO experiences (profile_id,company,title,start_year,end_year,highlights,sort_order) VALUES\n" +
      exp.join(",\n") +
      ";",
  );

const edu = candidates.flatMap((c) =>
  c.education.map(
    (e, i) =>
      `(${q(idFor(c.id))},${q(e.institution)},${q(e.degree)},${e.endYear},${i})`,
  ),
);
if (edu.length)
  out.push(
    "INSERT INTO educations (profile_id,institution,degree,end_year,sort_order) VALUES\n" +
      edu.join(",\n") +
      ";",
  );

const proof = candidates.flatMap((c) =>
  c.proof.map(
    (p, i) => `(${q(idFor(c.id))},${q(p.kind)},${q(p.label)},${q(p.url)},${i})`,
  ),
);
if (proof.length)
  out.push(
    "INSERT INTO proof_links (profile_id,kind,label,url,sort_order) VALUES\n" +
      proof.join(",\n") +
      ";",
  );

const sec = candidates.flatMap((c) =>
  c.customSections.map(
    (s, i) => `(${q(idFor(c.id))},${q(s.title)},${q(s.body)},${i})`,
  ),
);
if (sec.length)
  out.push(
    "INSERT INTO custom_sections (profile_id,title,body,sort_order) VALUES\n" +
      sec.join(",\n") +
      ";",
  );

const blocks = candidates.flatMap((c) =>
  c.stealthBlocks.map((d) => `(${q(idFor(c.id))},${q(d)})`),
);
if (blocks.length)
  out.push(
    "INSERT INTO stealth_blocks (profile_id,blocked_domain) VALUES\n" +
      blocks.join(",\n") +
      ";",
  );

const byJob = new Map<string, number>();
out.push(
  "INSERT INTO deck_items (job_id,candidate_id,score,features,rationale,rank) VALUES\n" +
    [...deckItems]
      .sort((a, b) => b.score - a.score)
      .map((d) => {
        const rank = (byJob.get(d.jobId) ?? 0) + 1;
        byJob.set(d.jobId, rank);
        return `(${q(idFor(d.jobId))},${q(idFor(d.candidateId))},${d.score},${q(JSON.stringify(d.features))}::jsonb,${q(d.rationale)},${rank})`;
      })
      .join(",\n") +
    ";",
);

console.log(out.join("\n\n"));
