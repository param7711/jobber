import type { Candidate, Company, DeckItem, Job } from "./types";

/**
 * Seed data for the beachhead segment: software engineers, 2–8 years,
 * Bangalore. All people and companies here are invented.
 *
 * Dates are relative to now so the availability-decay states always demo
 * correctly instead of rotting into "expired" a month from now.
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const companies: Company[] = [
  {
    id: "co_meridian",
    name: "Meridian Systems",
    domain: "meridian.dev",
    city: "Bangalore",
    headcount: "80–200",
    industry: "Developer infrastructure",
    blurb:
      "Build and deploy tooling for mid-market engineering teams. Series B, profitable since last year.",
  },
  {
    id: "co_kavach",
    name: "Kavach Pay",
    domain: "kavachpay.in",
    city: "Bangalore",
    headcount: "200–500",
    industry: "Payments",
    blurb:
      "UPI-first merchant payments. Processing across 40,000 small merchants in South India.",
  },
  {
    id: "co_tarang",
    name: "Tarang Labs",
    domain: "taranglabs.com",
    city: "Bangalore",
    headcount: "20–80",
    industry: "Climate data",
    blurb:
      "Satellite and sensor data for agricultural risk modelling. Seed stage, twelve engineers.",
  },
];

export const jobs: Job[] = [
  {
    id: "job_meridian_be",
    companyId: "co_meridian",
    title: "Senior Backend Engineer",
    seniority: "senior",
    ctcMin: 3_500_000,
    ctcMax: 5_200_000,
    city: "Bangalore",
    remote: "hybrid",
    employmentType: "permanent",
    screeningQuestions: [
      { id: "q1", prompt: "Have you owned a production service including its on-call rotation?", knockout: true },
      { id: "q2", prompt: "Have you made a schema change on a table with more than 10 million rows?", knockout: false },
    ],
    mustHave: ["Go", "Postgres", "Kubernetes"],
    niceToHave: ["gRPC", "Terraform", "OpenTelemetry"],
    whatMatters: [
      "You have owned a service in production, including its on-call",
      "Comfortable making schema changes on a large live table",
      "Writes design docs before code, not after",
    ],
    maxNoticeDays: 60,
    status: "open",
    experienceMin: 5,
    experienceMax: 9,
    openings: 1,
    postedAt: "2026-08-06T09:00:00.000Z",
    jdText:
      "You would own our order and inventory services end to end — the two systems every other team at Meridian depends on. Roughly half the work this year is splitting a Postgres instance that has outgrown one box, and the other half is the boring, load-bearing kind: better instrumentation, fewer 2am pages, a deploy pipeline people trust. Small team, no separate ops group; you carry a pager one week in five.",
  },
  {
    id: "job_kavach_fe",
    companyId: "co_kavach",
    title: "Frontend Engineer II",
    seniority: "mid",
    ctcMin: 2_200_000,
    ctcMax: 3_400_000,
    city: "Bangalore",
    remote: "onsite",
    employmentType: "permanent",
    screeningQuestions: [
      { id: "q1", prompt: "Have you shipped a payments or checkout flow to real users?", knockout: true },
    ],
    mustHave: ["React", "TypeScript"],
    niceToHave: ["React Native", "Accessibility", "Design systems"],
    whatMatters: [
      "Has shipped a payments or checkout flow to real users",
      "Cares about the 3G-on-a-cheap-Android case",
      "Can work directly with designers, not through tickets",
    ],
    maxNoticeDays: 90,
    status: "open",
    experienceMin: 3,
    experienceMax: 6,
    openings: 4,
    postedAt: "2026-08-24T09:00:00.000Z",
    jdText:
      "Kavach Pay's checkout is used by small merchants on cheap Android phones over patchy networks, and that constraint decides most of our frontend arguments. You would work on the checkout flow itself: retries that do not double-charge, states that survive a dropped connection, a bundle we keep arguing down in size. You will sit with designers directly — we do not hand specs across a wall.",
  },
  {
    id: "job_tarang_data",
    companyId: "co_tarang",
    title: "Data Engineer",
    seniority: "mid",
    ctcMin: 2_000_000,
    ctcMax: 3_000_000,
    city: "Bangalore",
    remote: "remote",
    employmentType: "permanent",
    screeningQuestions: [
      { id: "q1", prompt: "Have you built a pipeline that had to survive malformed upstream data?", knockout: true },
    ],
    mustHave: ["Python", "Airflow", "Postgres"],
    niceToHave: ["Geospatial", "dbt", "Parquet"],
    whatMatters: [
      "Has built a pipeline that survived bad upstream data",
      "Happy to be the only data person for a while",
      "Interested in the problem domain, not just the stack",
    ],
    maxNoticeDays: 60,
    status: "open",
    experienceMin: 3,
    experienceMax: 6,
    openings: 3,
    postedAt: "2026-08-28T09:00:00.000Z",
    jdText:
      "We turn satellite imagery and ground sensor feeds into agricultural risk models, which means most of the engineering is defending against upstream data that lies. You would own the ingestion pipelines: schema drift, late-arriving partitions, a sensor that reports -999 for a fortnight. Fully remote, and you would be the only data engineer for at least the next two quarters.",
  },
  {
    id: "job_kavach_be",
    companyId: "co_kavach",
    title: "Backend Engineer, Payments",
    seniority: "senior",
    ctcMin: 3_000_000,
    ctcMax: 4_500_000,
    city: "Bangalore",
    remote: "hybrid",
    employmentType: "permanent",
    screeningQuestions: [
      { id: "q1", prompt: "Have you worked on a system where a duplicate transaction was unacceptable?", knockout: true },
    ],
    mustHave: ["Go", "Postgres"],
    niceToHave: ["Kafka", "Redis", "UPI"],
    whatMatters: [
      "Has worked on something where money moving twice is unacceptable",
      "Can reason about idempotency and reconciliation without being taught",
      "Comfortable being paged",
    ],
    maxNoticeDays: 90,
    status: "open",
    experienceMin: 5,
    experienceMax: 9,
    openings: 1,
    postedAt: "2026-08-30T09:00:00.000Z",
    jdText:
      "Payments backend: settlement, reconciliation and the UPI integration. The whole job is that money must not move twice, so you would spend real time on idempotency keys, ledger design and the reconciliation job that catches what the happy path missed. Expect to be paged. Expect to read a lot of NPCI documentation.",
  },
  {
    id: "job_tarang_platform",
    companyId: "co_tarang",
    title: "Platform Engineer",
    seniority: "senior",
    ctcMin: 2_800_000,
    ctcMax: 4_000_000,
    city: "Bangalore",
    remote: "remote",
    employmentType: "permanent",
    screeningQuestions: [
      { id: "q1", prompt: "Are you comfortable being the only platform engineer for the first year?", knockout: true },
    ],
    mustHave: ["Kubernetes", "Terraform"],
    niceToHave: ["Go", "OpenTelemetry", "Cost optimisation"],
    whatMatters: [
      "You will be the first platform hire and own the whole thing",
      "Happy to cut cloud spend as a first project, not build a service mesh",
      "Writes runbooks other people can actually follow",
    ],
    maxNoticeDays: 60,
    status: "open",
    experienceMin: 5,
    experienceMax: 9,
    openings: 2,
    postedAt: "2026-08-17T09:00:00.000Z",
    jdText:
      "First platform hire. Twelve engineers deploy to a Kubernetes cluster nobody currently owns, and the cloud bill is roughly twice what it should be — that is your first quarter. After that it is yours to shape: CI that does not take twenty minutes, runbooks somebody else can follow, and enough observability that we stop guessing. Remote, with two on-site weeks a year.",
  },
];

export const candidates: Candidate[] = [
  {
    id: "cand_ananya",
    name: "Ananya Rao",
    headline: "Backend engineer — payments infrastructure",
    city: "Bangalore",
    preferredLocations: ["Bangalore", "Hyderabad", "Remote"],
    employmentTypes: ["permanent"],
    photoUrl: null,
    yearsExperience: 6,
    seniority: "senior",
    skills: ["Go", "Postgres", "Kubernetes", "gRPC", "Redis", "Terraform"],
    experiences: [
      {
        id: "e1",
        company: "Razorwire",
        title: "Senior Software Engineer",
        startYear: 2022,
        endYear: null,
        highlights: [
          "Rebuilt the settlement ledger to double-entry, cutting reconciliation breaks from ~400/day to under 10",
          "Owns three Go services end to end, including on-call",
          "Cut p99 on the auth path from 840ms to 120ms by killing an N+1 across service boundaries",
        ],
      },
      {
        id: "e2",
        company: "Infosys",
        title: "Software Engineer",
        startYear: 2020,
        endYear: 2022,
        highlights: ["Payments integration work for a European retail bank"],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "RV College of Engineering",
        degree: "B.E. Computer Science",
        endYear: 2020,
      },
    ],
    proof: [
      { kind: "github", label: "github.com/ananyarao", url: "#" },
      {
        kind: "writing",
        label: "Why our ledger was wrong for two years",
        url: "#",
      },
    ],
    customSections: [
      {
        id: "cs1",
        title: "What I want next",
        body: "A team where correctness matters more than shipping speed. I have spent three years cleaning up money bugs and I would rather prevent them.",
      },
    ],
    noticeDays: 60,
    ctcCurrent: 3_200_000,
    ctcExpected: 4_400_000,
    remotePref: "hybrid",
    availabilityConfirmedAt: daysAgo(2),
    stealthBlocks: ["razorwire.com"],
  },
  {
    id: "cand_vikram",
    name: "Vikram Shetty",
    headline: "Full-stack engineer — React and Go",
    city: "Bangalore",
    preferredLocations: ["Bangalore"],
    employmentTypes: ["permanent"],
    photoUrl: null,
    yearsExperience: 4,
    seniority: "mid",
    skills: ["React", "TypeScript", "Go", "Postgres", "AWS"],
    experiences: [
      {
        id: "e1",
        company: "Kettle",
        title: "Software Engineer",
        startYear: 2023,
        endYear: null,
        highlights: [
          "Built the merchant onboarding flow end to end — 22% drop-off, down from 51%",
          "Introduced the design-system package now used by four product teams",
        ],
      },
      {
        id: "e2",
        company: "Zoho",
        title: "Associate Engineer",
        startYear: 2022,
        endYear: 2023,
        highlights: ["Internal tooling for the CRM reporting team"],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "NIT Surathkal",
        degree: "B.Tech Information Technology",
        endYear: 2022,
      },
    ],
    proof: [{ kind: "portfolio", label: "vikramshetty.in", url: "#" }],
    customSections: [],
    noticeDays: 30,
    ctcCurrent: 2_100_000,
    ctcExpected: 3_000_000,
    remotePref: "onsite",
    availabilityConfirmedAt: daysAgo(1),
    stealthBlocks: ["kettle.co"],
  },
  {
    id: "cand_fatima",
    name: "Fatima Qureshi",
    headline: "Data engineer — pipelines that do not wake you up",
    city: "Bangalore",
    preferredLocations: ["Remote", "Bangalore"],
    employmentTypes: ["permanent", "contract"],
    photoUrl: null,
    yearsExperience: 5,
    seniority: "mid",
    skills: ["Python", "Airflow", "dbt", "Postgres", "Spark", "Parquet"],
    experiences: [
      {
        id: "e1",
        company: "Cropwise Analytics",
        title: "Data Engineer",
        startYear: 2021,
        endYear: null,
        highlights: [
          "Owns 60+ Airflow DAGs ingesting satellite imagery and weather station feeds",
          "Built the schema-drift detector that cut silent pipeline failures to near zero",
          "Migrated the warehouse off Redshift, halving monthly spend",
        ],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "IIIT Hyderabad",
        degree: "B.Tech Computer Science",
        endYear: 2021,
      },
    ],
    proof: [
      { kind: "github", label: "github.com/fqureshi", url: "#" },
      { kind: "writing", label: "Schema drift is a data quality bug", url: "#" },
    ],
    customSections: [
      {
        id: "cs1",
        title: "Domains I care about",
        body: "Agriculture and climate. I grew up around farming and would like the work to point somewhere.",
      },
    ],
    noticeDays: 60,
    ctcCurrent: 2_400_000,
    ctcExpected: 2_900_000,
    remotePref: "remote",
    availabilityConfirmedAt: daysAgo(17),
    stealthBlocks: [],
  },
  {
    id: "cand_joseph",
    name: "Joseph Mathew",
    headline: "Frontend engineer — accessibility and design systems",
    city: "Bangalore",
    preferredLocations: ["Bangalore", "Chennai"],
    employmentTypes: ["permanent"],
    photoUrl: null,
    yearsExperience: 7,
    seniority: "senior",
    skills: [
      "React",
      "TypeScript",
      "Accessibility",
      "Design systems",
      "React Native",
    ],
    experiences: [
      {
        id: "e1",
        company: "Nurture Health",
        title: "Staff Frontend Engineer",
        startYear: 2021,
        endYear: null,
        highlights: [
          "Took the patient portal from WCAG failures to AA across 40 screens",
          "Owns the component library — 90 components, used by six teams",
          "Cut first-contentful-paint on 3G from 6.2s to 1.9s",
        ],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "Anna University",
        degree: "B.E. Computer Science",
        endYear: 2019,
      },
    ],
    proof: [
      { kind: "github", label: "github.com/josephmathew", url: "#" },
      { kind: "case_study", label: "Rebuilding the portal for AA", url: "#" },
    ],
    customSections: [],
    noticeDays: 90,
    ctcCurrent: 3_800_000,
    ctcExpected: 4_800_000,
    remotePref: "hybrid",
    availabilityConfirmedAt: daysAgo(6),
    stealthBlocks: ["nurturehealth.in"],
  },
  {
    id: "cand_priya",
    name: "Priya Nambiar",
    headline: "Platform engineer — Kubernetes and developer tooling",
    city: "Bangalore",
    preferredLocations: ["Remote", "Bangalore", "Pune"],
    employmentTypes: ["permanent", "contract"],
    photoUrl: null,
    yearsExperience: 8,
    seniority: "staff",
    skills: ["Kubernetes", "Go", "Terraform", "OpenTelemetry", "Postgres"],
    experiences: [
      {
        id: "e1",
        company: "Fleetwise",
        title: "Staff Engineer, Platform",
        startYear: 2020,
        endYear: null,
        highlights: [
          "Cut median deploy time from 34 minutes to 4 across 120 services",
          "Designed the multi-tenant cluster model now running the whole product",
          "Wrote the incident review process the company still uses",
        ],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "BITS Pilani",
        degree: "B.E. Electronics",
        endYear: 2018,
      },
    ],
    proof: [{ kind: "writing", label: "Deploys should be boring", url: "#" }],
    customSections: [],
    noticeDays: 90,
    ctcCurrent: 5_600_000,
    ctcExpected: 7_000_000,
    remotePref: "remote",
    availabilityConfirmedAt: daysAgo(29),
    stealthBlocks: ["fleetwise.io"],
  },
  {
    id: "cand_rahul",
    name: "Rahul Deshpande",
    headline: "Backend engineer — Go, distributed systems",
    city: "Pune",
    preferredLocations: ["Pune", "Bangalore"],
    employmentTypes: ["permanent"],
    photoUrl: null,
    yearsExperience: 3,
    seniority: "mid",
    skills: ["Go", "Postgres", "Kafka", "Docker"],
    experiences: [
      {
        id: "e1",
        company: "Shiprocket",
        title: "Software Engineer",
        startYear: 2023,
        endYear: null,
        highlights: [
          "Built the courier-allocation service handling 200k shipments a day",
          "Moved the tracking pipeline to Kafka, dropping webhook loss to under 0.1%",
        ],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "COEP Pune",
        degree: "B.Tech Computer Engineering",
        endYear: 2022,
      },
    ],
    proof: [{ kind: "github", label: "github.com/rahuld", url: "#" }],
    customSections: [],
    noticeDays: 30,
    ctcCurrent: 1_800_000,
    ctcExpected: 2_800_000,
    remotePref: "hybrid",
    availabilityConfirmedAt: daysAgo(4),
    stealthBlocks: [],
  },
];

/**
 * Pre-scored deck rows. In production these are built by a nightly job per
 * open requisition and written to `deck_items`; here they are literal so the
 * UI has something honest to render.
 */
export const deckItems: DeckItem[] = [
  {
    candidateId: "cand_ananya",
    jobId: "job_meridian_be",
    score: 0.91,
    features: {
      semantic: 0.94,
      skillOverlap: 0.88,
      seniorityFit: 1.0,
      intentFreshness: 1.0,
      responsiveness: 0.72,
    },
    rationale:
      "Six years on Go payment services, owns production on-call, and the ledger rebuild maps directly onto your schema-change requirement.",
  },
  {
    candidateId: "cand_priya",
    jobId: "job_meridian_be",
    score: 0.84,
    features: {
      semantic: 0.87,
      skillOverlap: 0.95,
      seniorityFit: 0.62,
      intentFreshness: 0.0,
      responsiveness: 0.8,
    },
    rationale:
      "Strongest platform depth in the deck, but levelled above the band and availability has gone stale.",
  },
  {
    candidateId: "cand_rahul",
    jobId: "job_meridian_be",
    score: 0.71,
    features: {
      semantic: 0.76,
      skillOverlap: 0.64,
      seniorityFit: 0.55,
      intentFreshness: 0.97,
      responsiveness: 0.68,
    },
    rationale:
      "Three years of Go and Kafka at real volume. Under the seniority band, but moving quickly and on a 30-day notice.",
  },
  {
    candidateId: "cand_joseph",
    jobId: "job_kavach_fe",
    score: 0.88,
    features: {
      semantic: 0.9,
      skillOverlap: 0.92,
      seniorityFit: 0.7,
      intentFreshness: 0.94,
      responsiveness: 0.85,
    },
    rationale:
      "Took a health portal to WCAG AA and cut 3G load to under two seconds — both of your stated concerns, evidenced.",
  },
  {
    candidateId: "cand_vikram",
    jobId: "job_kavach_fe",
    score: 0.82,
    features: {
      semantic: 0.85,
      skillOverlap: 0.8,
      seniorityFit: 1.0,
      intentFreshness: 0.99,
      responsiveness: 0.75,
    },
    rationale:
      "Built a merchant onboarding flow and halved drop-off — closest thing in the deck to your checkout requirement.",
  },
  {
    candidateId: "cand_fatima",
    jobId: "job_tarang_data",
    score: 0.93,
    features: {
      semantic: 0.96,
      skillOverlap: 0.9,
      seniorityFit: 1.0,
      intentFreshness: 0.45,
      responsiveness: 0.88,
    },
    rationale:
      "Already runs satellite and weather ingestion at 60+ DAGs, and names agriculture as the domain she wants. Availability needs re-confirming.",
  },
  {
    candidateId: "cand_ananya",
    jobId: "job_kavach_be",
    score: 0.89,
    features: {
      semantic: 0.93,
      skillOverlap: 0.85,
      seniorityFit: 1.0,
      intentFreshness: 1.0,
      responsiveness: 0.72,
    },
    rationale:
      "The settlement-ledger rebuild is almost exactly the problem this team is hiring against, and the comp band clears her expectation.",
  },
  {
    candidateId: "cand_ananya",
    jobId: "job_tarang_platform",
    score: 0.64,
    features: {
      semantic: 0.68,
      skillOverlap: 0.55,
      seniorityFit: 0.9,
      intentFreshness: 1.0,
      responsiveness: 0.72,
    },
    rationale:
      "Kubernetes and Terraform are on her profile but not what she has been doing daily. A stretch, and the band sits under what she asked for.",
  },
];

export function companyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function candidateById(id: string): Candidate | undefined {
  return candidates.find((c) => c.id === id);
}

export function jobById(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

/** Deck for one requisition, honouring stealth blocks and ordered by score. */
export function deckForJob(jobId: string) {
  const job = jobById(jobId);
  if (!job) return [];
  const company = companyById(job.companyId);
  return deckItems
    .filter((d) => d.jobId === jobId)
    .map((d) => ({ item: d, candidate: candidateById(d.candidateId)! }))
    .filter(({ candidate }) => {
      if (!candidate) return false;
      if (!company) return true;
      return !candidate.stealthBlocks.includes(company.domain);
    })
    .sort((a, b) => b.item.score - a.item.score);
}

/** Roles shown to a candidate, best fit first. */
export function deckForCandidate(candidateId: string) {
  return deckItems
    .filter((d) => d.candidateId === candidateId)
    .map((d) => ({
      item: d,
      job: jobById(d.jobId)!,
      company: companyById(jobById(d.jobId)!.companyId)!,
    }))
    .sort((a, b) => b.item.score - a.item.score);
}
