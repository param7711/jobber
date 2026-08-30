-- Align the RLS policy with availabilityState() and src/db/queries.ts.
--
-- Day 21 is "stale but visible" everywhere else. Comparing against '21 days'
-- here hid someone whose own card still read "Stale · 21d" — the two layers
-- have to agree or the UI lies about who can see you.

DROP POLICY IF EXISTS profile_employer_read ON candidate_profiles;
CREATE POLICY profile_employer_read ON candidate_profiles
  FOR SELECT USING (
    open_to_work
    AND availability_confirmed_at > now() - interval '22 days'
    AND NOT EXISTS (
      SELECT 1
      FROM stealth_blocks sb
      JOIN companies c ON lower(c.domain) = lower(sb.blocked_domain)
      WHERE sb.profile_id = candidate_profiles.user_id
        AND c.id IN (SELECT private.app_company_ids())
    )
    AND EXISTS (SELECT 1 FROM private.app_company_ids())
  );
