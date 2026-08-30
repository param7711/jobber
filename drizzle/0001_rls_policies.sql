-- Row-level security, plus the vector index for the matching engine.
--
-- IMPORTANT: connecting as the `postgres` role (which DATABASE_URL does)
-- BYPASSES every policy below. These become load-bearing once auth runs
-- through Supabase and queries arrive as `authenticated`. Until then,
-- server-side queries must ALSO filter stealth blocks themselves — see
-- src/db/queries.ts, which does exactly that. Defence in depth, not instead of.
--
-- Superseded in part by 0002, which moves app_company_ids() to a private
-- schema. Kept as applied, for an accurate history.

CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx
  ON embeddings USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION app_company_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM company_members WHERE user_id = auth.uid();
$$;

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_links         ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings          ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY users_self_write ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profile_self_all ON candidate_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- THE STEALTH GUARANTEE. A recruiter may read a candidate profile only when
-- the candidate is open to work, availability has not expired, and they have
-- NOT blocked the recruiter's company domain. Enforced by the database, not by
-- application code that a later refactor could quietly drop.
CREATE POLICY profile_employer_read ON candidate_profiles
  FOR SELECT USING (
    open_to_work
    AND availability_confirmed_at > now() - interval '21 days'
    AND NOT EXISTS (
      SELECT 1
      FROM stealth_blocks sb
      JOIN companies c ON lower(c.domain) = lower(sb.blocked_domain)
      WHERE sb.profile_id = candidate_profiles.user_id
        AND c.id IN (SELECT app_company_ids())
    )
    AND EXISTS (SELECT 1 FROM app_company_ids())
  );

CREATE POLICY experiences_via_profile ON experiences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidate_profiles p WHERE p.user_id = experiences.profile_id)
  );
CREATE POLICY experiences_self_write ON experiences
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY educations_via_profile ON educations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidate_profiles p WHERE p.user_id = educations.profile_id)
  );
CREATE POLICY educations_self_write ON educations
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY proof_via_profile ON proof_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidate_profiles p WHERE p.user_id = proof_links.profile_id)
  );
CREATE POLICY proof_self_write ON proof_links
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY sections_via_profile ON custom_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidate_profiles p WHERE p.user_id = custom_sections.profile_id)
  );
CREATE POLICY sections_self_write ON custom_sections
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Nobody but the candidate reads their own blocklist: exposing it would leak
-- which employer they are hiding from.
CREATE POLICY stealth_self_only ON stealth_blocks
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY companies_public_read ON companies
  FOR SELECT USING (verified_at IS NOT NULL);
CREATE POLICY companies_member_write ON companies
  FOR UPDATE USING (id IN (SELECT app_company_ids()))
  WITH CHECK (id IN (SELECT app_company_ids()));

CREATE POLICY members_own_company ON company_members
  FOR SELECT USING (company_id IN (SELECT app_company_ids()));

CREATE POLICY jobs_open_read ON jobs
  FOR SELECT USING (status = 'open' OR company_id IN (SELECT app_company_ids()));
CREATE POLICY jobs_member_write ON jobs
  FOR ALL USING (company_id IN (SELECT app_company_ids()))
  WITH CHECK (company_id IN (SELECT app_company_ids()));

CREATE POLICY deck_items_owner ON deck_items
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = deck_items.job_id AND j.company_id IN (SELECT app_company_ids())
    )
  );

-- Append-only: insert your own, read your own, never update or delete.
CREATE POLICY swipes_insert_own ON swipes
  FOR INSERT WITH CHECK (actor_id = auth.uid());
CREATE POLICY swipes_read_own ON swipes
  FOR SELECT USING (actor_id = auth.uid());

CREATE POLICY matches_participants ON matches
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = matches.job_id AND j.company_id IN (SELECT app_company_ids())
    )
  );

CREATE POLICY messages_participants ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (
          m.candidate_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id = m.job_id AND j.company_id IN (SELECT app_company_ids())
          )
        )
    )
  );
CREATE POLICY messages_send_own ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY resumes_self_only ON resumes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY consents_self_only ON consents
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
