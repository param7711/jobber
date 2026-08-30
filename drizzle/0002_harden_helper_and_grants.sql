-- PostgREST exposes every function in `public` as an RPC endpoint, so a
-- SECURITY DEFINER helper does not belong there. Move it to a private schema:
-- unreachable over REST, still callable from inside RLS policies.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.app_company_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM company_members WHERE user_id = auth.uid();
$$;

-- Policies evaluate as the querying role, so that role needs EXECUTE.
-- For anon this returns the empty set, since auth.uid() is null.
GRANT EXECUTE ON FUNCTION private.app_company_ids() TO anon, authenticated, service_role;

-- Repoint every policy that referenced the public helper.
DROP POLICY IF EXISTS profile_employer_read ON candidate_profiles;
CREATE POLICY profile_employer_read ON candidate_profiles
  FOR SELECT USING (
    open_to_work
    AND availability_confirmed_at > now() - interval '21 days'
    AND NOT EXISTS (
      SELECT 1
      FROM stealth_blocks sb
      JOIN companies c ON lower(c.domain) = lower(sb.blocked_domain)
      WHERE sb.profile_id = candidate_profiles.user_id
        AND c.id IN (SELECT private.app_company_ids())
    )
    AND EXISTS (SELECT 1 FROM private.app_company_ids())
  );

DROP POLICY IF EXISTS companies_member_write ON companies;
CREATE POLICY companies_member_write ON companies
  FOR UPDATE USING (id IN (SELECT private.app_company_ids()))
  WITH CHECK (id IN (SELECT private.app_company_ids()));

DROP POLICY IF EXISTS members_own_company ON company_members;
CREATE POLICY members_own_company ON company_members
  FOR SELECT USING (company_id IN (SELECT private.app_company_ids()));

DROP POLICY IF EXISTS jobs_open_read ON jobs;
CREATE POLICY jobs_open_read ON jobs
  FOR SELECT USING (status = 'open' OR company_id IN (SELECT private.app_company_ids()));

DROP POLICY IF EXISTS jobs_member_write ON jobs;
CREATE POLICY jobs_member_write ON jobs
  FOR ALL USING (company_id IN (SELECT private.app_company_ids()))
  WITH CHECK (company_id IN (SELECT private.app_company_ids()));

DROP POLICY IF EXISTS deck_items_owner ON deck_items;
CREATE POLICY deck_items_owner ON deck_items
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = deck_items.job_id AND j.company_id IN (SELECT private.app_company_ids())
    )
  );

DROP POLICY IF EXISTS matches_participants ON matches;
CREATE POLICY matches_participants ON matches
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = matches.job_id AND j.company_id IN (SELECT private.app_company_ids())
    )
  );

DROP POLICY IF EXISTS messages_participants ON messages;
CREATE POLICY messages_participants ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (
          m.candidate_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id = m.job_id AND j.company_id IN (SELECT private.app_company_ids())
          )
        )
    )
  );

DROP FUNCTION IF EXISTS public.app_company_ids();

-- audit_events and embeddings have RLS on and deliberately no policies, which
-- already yields zero rows. Revoking the grants states that intent outright
-- rather than leaving it to be inferred.
REVOKE ALL ON TABLE audit_events FROM anon, authenticated;
REVOKE ALL ON TABLE embeddings   FROM anon, authenticated;
