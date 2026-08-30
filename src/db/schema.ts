import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

export const userRole = pgEnum("user_role", ["candidate", "employer", "admin"]);
export const seniority = pgEnum("seniority", [
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
]);
export const remotePref = pgEnum("remote_pref", ["onsite", "hybrid", "remote"]);
export const employmentType = pgEnum("employment_type", [
  "permanent",
  "contract",
  "internship",
]);
export const jobStatus = pgEnum("job_status", ["draft", "open", "closed"]);
export const swipeDirection = pgEnum("swipe_direction", ["left", "right"]);
export const actorType = pgEnum("actor_type", ["candidate", "employer"]);
export const passReason = pgEnum("pass_reason", [
  "underqualified",
  "overqualified",
  "comp_mismatch",
  "wrong_stack",
  "notice_too_long",
  "location_mismatch",
  "other",
]);
export const matchState = pgEnum("match_state", [
  "open",
  "expired",
  "closed",
  "hired",
]);
export const resumeKind = pgEnum("resume_kind", ["base", "tailored"]);
export const companyRole = pgEnum("company_role", [
  "admin",
  "recruiter",
  "hiring_manager",
]);

/* ------------------------------------------------------------------ users */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: userRole("role").notNull(),
    /** LinkedIn OIDC subject claim. Identity only — the scopes return name,
     *  photo and email, never work history. */
    linkedinSub: text("linkedin_sub"),
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_linkedin_sub_key").on(t.linkedinSub),
  ],
);

/* ------------------------------------------------------------- candidates */

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    headline: text("headline").notNull().default(""),
    /** Where they are now. Where they'd WORK is preferredLocations. */
    city: text("city").notNull().default(""),
    /**
     * Real candidates say "Bangalore, Pune, or remote" — a single city was a
     * schema bug that quietly narrowed everyone's matches to one place.
     */
    preferredLocations: text("preferred_locations").array().notNull().default([]),
    employmentTypes: employmentType("employment_types")
      .array()
      .notNull()
      .default(["permanent"]),
    photoUrl: text("photo_url"),
    yearsExperience: real("years_experience").notNull().default(0),
    seniority: seniority("seniority").notNull().default("mid"),
    /** Denormalised for deck filtering; the taxonomy lives in `skills`. */
    skills: text("skills").array().notNull().default([]),

    /* --- the intent block --- */
    noticeDays: integer("notice_days"),
    ctcCurrent: integer("ctc_current"),
    ctcExpected: integer("ctc_expected"),
    remotePref: remotePref("remote_pref").notNull().default("hybrid"),
    /** Drives the freshness decay. Fresh <=14d, stale <=21d, then the
     *  candidate leaves every deck until they re-confirm. */
    availabilityConfirmedAt: timestamp("availability_confirmed_at", {
      withTimezone: true,
    }),
    openToWork: boolean("open_to_work").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("candidate_availability_idx").on(t.availabilityConfirmedAt),
    index("candidate_seniority_idx").on(t.seniority),
  ],
);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    company: text("company").notNull(),
    title: text("title").notNull(),
    startYear: integer("start_year").notNull(),
    /** null means current. */
    endYear: integer("end_year"),
    highlights: text("highlights").array().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("experiences_profile_idx").on(t.profileId)],
);

export const educations = pgTable(
  "educations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    degree: text("degree").notNull(),
    endYear: integer("end_year"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("educations_profile_idx").on(t.profileId)],
);

export const proofLinks = pgTable(
  "proof_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("proof_profile_idx").on(t.profileId)],
);

/** Free-form blocks the candidate names themselves. */
export const customSections = pgTable(
  "custom_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("custom_sections_profile_idx").on(t.profileId)],
);

/**
 * Stealth mode. An employed candidate whose current employer sees them here is
 * a catastrophe you only get to cause once — so this is enforced by an RLS
 * policy on the deck query, never by an `if` in a route handler.
 */
export const stealthBlocks = pgTable(
  "stealth_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    blockedDomain: text("blocked_domain").notNull(),
  },
  (t) => [uniqueIndex("stealth_unique").on(t.profileId, t.blockedDomain)],
);

/* -------------------------------------------------------------- employers */

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Uniqueness here is what stops duplicate-org spam. */
    domain: text("domain").notNull(),
    city: text("city"),
    headcount: text("headcount"),
    industry: text("industry"),
    blurb: text("blurb"),
    /** Manual approval. Keep verifying by hand for as long as possible — one
     *  scam posting on a new hiring product is existential in India. */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("companies_domain_key").on(t.domain)],
);

export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: companyRole("role").notNull().default("recruiter"),
  },
  (t) => [uniqueIndex("company_member_unique").on(t.companyId, t.userId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    family: text("family"),
    seniority: seniority("seniority").notNull(),
    ctcMin: integer("ctc_min"),
    ctcMax: integer("ctc_max"),
    city: text("city"),
    remote: remotePref("remote").notNull().default("hybrid"),
    employmentType: employmentType("employment_type")
      .notNull()
      .default("permanent"),
    /**
     * Knockout questions the recruiter sets on the requisition. Answers ride
     * on the card, so a swipe is informed rather than a guess. Kept on the job
     * rather than a side table — they are part of the req's definition.
     */
    screeningQuestions: jsonb("screening_questions")
      .$type<{ id: string; prompt: string; knockout: boolean }[]>()
      .notNull()
      .default([]),
    jdText: text("jd_text"),
    /** Structured output of the JD parse, confirmed by the recruiter. */
    requirements: jsonb("requirements").$type<{
      mustHave: string[];
      niceToHave: string[];
      whatMatters: string[];
    }>(),
    maxNoticeDays: integer("max_notice_days"),
    status: jobStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("jobs_company_status_idx").on(t.companyId, t.status)],
);

/* --------------------------------------------------------------- matching */

/** Versioned so the model can be swapped without downtime or a backfill lock. */
export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerType: text("owner_type").notNull(),
    ownerId: uuid("owner_id").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    modelVersion: text("model_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("embedding_owner_key").on(t.ownerType, t.ownerId, t.modelVersion),
  ],
);

/**
 * Materialised nightly per open requisition. Scoring on request is slow,
 * expensive, and makes deck order jump between sessions, which reads as broken.
 */
export const deckItems = pgTable(
  "deck_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    score: real("score").notNull(),
    /** The explainability record. Log it or you cannot answer how ranking works. */
    features: jsonb("features").$type<{
      semantic: number;
      skillOverlap: number;
      seniorityFit: number;
      intentFreshness: number;
      responsiveness: number;
    }>(),
    rationale: text("rationale"),
    rank: integer("rank").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("deck_item_unique").on(t.jobId, t.candidateId),
    index("deck_item_rank_idx").on(t.jobId, t.rank),
  ],
);

/**
 * Append-only. `jobId` is what makes a swipe mean "this person, for this role"
 * rather than a vague expression of interest; `rankShown` and `latencyMs` are
 * how deck quality gets debugged later.
 */
export const swipes = pgTable(
  "swipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: actorType("actor_type").notNull(),
    actorId: uuid("actor_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    direction: swipeDirection("direction").notNull(),
    passReason: passReason("pass_reason"),
    modelVersion: text("model_version"),
    rankShown: integer("rank_shown"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("swipe_unique").on(t.actorId, t.subjectId, t.jobId),
    index("swipes_job_idx").on(t.jobId),
  ],
);

/** Scoped to the job, not the company. Expiry is what kills the ghosting. */
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    state: matchState("state").notNull().default("open"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("match_unique").on(t.jobId, t.candidateId)],
);

/* ---------------------------------------------------------------- resumes */

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: resumeKind("kind").notNull(),
    /** Set only on tailored resumes. */
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    fileUrl: text("file_url"),
    parsed: jsonb("parsed"),
    /** Null means never sent. The tailoring pipeline must respect this: a
     *  resume is the candidate's representation of themselves, so a human
     *  approves every one before it goes anywhere. */
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("resumes_user_idx").on(t.userId, t.kind)],
);

/* --------------------------------------------------------------- messages */

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_match_idx").on(t.matchId, t.createdAt)],
);

/* ------------------------------------------------------------- compliance */

/**
 * DPDP requires purpose-specific, withdrawable consent — so it is rows with a
 * policy version, never a boolean column that loses its own history.
 */
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(),
    policyVersion: text("policy_version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => [index("consents_user_idx").on(t.userId, t.purpose)],
);

/** Immutable. Cheap now, impossible to backfill later. */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    subjectType: text("subject_type"),
    subjectId: uuid("subject_id"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
