/**
 * Re-stamps seeded availability dates relative to today.
 *
 * The seed writes absolute timestamps, so the demo drifts: after a fortnight
 * everyone is stale and the freshness states stop illustrating anything. Run
 * this whenever the demo data needs to mean something again.
 *
 *   node --env-file=.env.local scripts/refresh-availability.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

// One of each state, so every branch of the UI is visible in the demo.
const DAYS_AGO = {
  "d8932092-0000-4000-8000-d8932092d893": 2, // Ananya  — fresh
  "093a8504-0000-4000-8000-093a8504093a": 1, // Vikram  — fresh
  "edad5e23-0000-4000-8000-edad5e23edad": 6, // Joseph  — fresh
  "64d3fc56-0000-4000-8000-64d3fc5664d3": 4, // Rahul   — fresh
  "e35c018c-0000-4000-8000-e35c018ce35c": 17, // Fatima — stale, still visible
  "64b9227f-0000-4000-8000-64b9227f64b9": 29, // Priya  — expired, out of decks
};

try {
  for (const [id, days] of Object.entries(DAYS_AGO)) {
    await sql`
      update candidate_profiles
      set availability_confirmed_at = now() - (${days} || ' days')::interval
      where user_id = ${id}
    `;
  }

  const rows = await sql`
    select name,
           date_part('day', now() - availability_confirmed_at)::int as days
    from candidate_profiles
    order by days
  `;
  for (const r of rows) {
    const state = r.days <= 14 ? "fresh" : r.days <= 21 ? "stale" : "expired";
    console.log(`${r.name.padEnd(18)} ${String(r.days).padStart(2)}d  ${state}`);
  }
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
