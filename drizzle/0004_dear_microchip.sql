CREATE TYPE "public"."employment_type" AS ENUM('permanent', 'contract', 'internship');--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "preferred_locations" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "employment_types" "employment_type"[] DEFAULT '{"permanent"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "employment_type" "employment_type" DEFAULT 'permanent' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "screening_questions" jsonb DEFAULT '[]'::jsonb NOT NULL;