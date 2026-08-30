/**
 * One-shot backfill for the columns added in migration 0004.
 *
 * The migration gave every row a safe default; this fills in the real seed
 * values so the demo data matches src/lib/mock-data.ts. Safe to re-run.
 *
 *   node --env-file=.env.local scripts/backfill-0004.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const candidatePrefs = {
  "d8932092-0000-4000-8000-d8932092d893": [
    ["Bangalore", "Hyderabad", "Remote"],
    ["permanent"],
  ],
  "093a8504-0000-4000-8000-093a8504093a": [["Bangalore"], ["permanent"]],
  "e35c018c-0000-4000-8000-e35c018ce35c": [
    ["Remote", "Bangalore"],
    ["permanent", "contract"],
  ],
  "edad5e23-0000-4000-8000-edad5e23edad": [
    ["Bangalore", "Chennai"],
    ["permanent"],
  ],
  "64b9227f-0000-4000-8000-64b9227f64b9": [
    ["Remote", "Bangalore", "Pune"],
    ["permanent", "contract"],
  ],
  "64d3fc56-0000-4000-8000-64d3fc5664d3": [["Pune", "Bangalore"], ["permanent"]],
};

const jobQuestions = {
  "a7189e0e-0000-4000-8000-a7189e0ea718": [
    {
      id: "q1",
      prompt: "Have you owned a production service including its on-call rotation?",
      knockout: true,
    },
    {
      id: "q2",
      prompt:
        "Have you made a schema change on a table with more than 10 million rows?",
      knockout: false,
    },
  ],
  "ab0f6d57-0000-4000-8000-ab0f6d57ab0f": [
    {
      id: "q1",
      prompt: "Have you shipped a payments or checkout flow to real users?",
      knockout: true,
    },
  ],
  "d75b1395-0000-4000-8000-d75b1395d75b": [
    {
      id: "q1",
      prompt:
        "Have you built a pipeline that had to survive malformed upstream data?",
      knockout: true,
    },
  ],
  "ab0f6cd3-0000-4000-8000-ab0f6cd3ab0f": [
    {
      id: "q1",
      prompt:
        "Have you worked on a system where a duplicate transaction was unacceptable?",
      knockout: true,
    },
  ],
  "a64b1080-0000-4000-8000-a64b1080a64b": [
    {
      id: "q1",
      prompt:
        "Are you comfortable being the only platform engineer for the first year?",
      knockout: true,
    },
  ],
};

try {
  for (const [id, [locations, types]] of Object.entries(candidatePrefs)) {
    await sql`
      update candidate_profiles
      set preferred_locations = ${locations},
          employment_types = ${types}::text[]::employment_type[]
      where user_id = ${id}
    `;
  }

  for (const [id, questions] of Object.entries(jobQuestions)) {
    await sql`
      update jobs set screening_questions = ${sql.json(questions)} where id = ${id}
    `;
  }

  const [c] =
    await sql`select count(*)::int n from candidate_profiles where array_length(preferred_locations, 1) > 0`;
  const [j] =
    await sql`select count(*)::int n from jobs where jsonb_array_length(screening_questions) > 0`;
  console.log("candidates with preferred locations:", c.n);
  console.log("jobs with screening questions:", j.n);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
