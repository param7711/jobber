CREATE TABLE "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_min" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_max" real;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "openings" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_job_unique" ON "saved_jobs" USING btree ("candidate_id","job_id");--> statement-breakpoint
-- Saved jobs are private to the candidate. No employer-read policy exists on
-- purpose: a recruiter learning who bookmarked their role without applying
-- turns a low-stakes bookmark into a signal people would rather not send.
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY saved_jobs_self_all ON saved_jobs
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());--> statement-breakpoint

-- Backfill the experience band from seniority so the new filter is not empty
-- on day one. Recruiters can narrow these by hand afterwards; the bands are
-- deliberately wide, because a too-tight band silently hides good people.
UPDATE jobs SET experience_min = CASE seniority
    WHEN 'junior' THEN 0
    WHEN 'mid'    THEN 3
    WHEN 'senior' THEN 5
    WHEN 'staff'  THEN 8
    WHEN 'lead'   THEN 8
  END,
  experience_max = CASE seniority
    WHEN 'junior' THEN 3
    WHEN 'mid'    THEN 6
    WHEN 'senior' THEN 9
    WHEN 'staff'  THEN 14
    WHEN 'lead'   THEN NULL
  END;
