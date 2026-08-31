# Shortlist

A two-sided hiring marketplace with a card-deck interface. Employers swipe
candidates inside a requisition; candidates swipe roles.

The differentiator is not the swiping — it is that every candidate in a deck
has confirmed their notice period, expected CTC and that they are actively
looking, within the last fortnight.

## Running it

```bash
npm run dev
```

Then open http://localhost:3000. The home page is a development switcher into
both sides of the marketplace.

> Node lives at `C:\Program Files\nodejs`. If `npm` is not found in a new
> terminal, open a fresh shell so the PATH picks it up.

## What is built

| Area | State |
| --- | --- |
| Design system (tokens, light + dark) | Done |
| Swipe engine — drag, flick, keyboard, buttons | Done |
| Candidate role deck | Done |
| Employer sourcing deck, scoped to a requisition | Done |
| Left-swipe reason codes | Done |
| Right-swipe budget | Done |
| Availability freshness + decay | Done, enforced in queries |
| Profile completeness meter | Done — weighted, one nudge at a time |
| Preferred locations | Done — on cards, on the profile, filterable in search |
| Employment type | Done — on the profile and as a `/jobs` filter |
| Screening questions | Done — role card and the job listing page |
| Recruiter keyword search | Done — `/employer/search` |
| Candidate job search | Done — `/jobs`, seven filters, shareable URLs |
| Job listing pages | Done — `/jobs/[id]`, with similar roles |
| Company pages | Done — `/companies/[id]`, with the verification badge |
| Candidate profile | Done — `/candidate/profile` |
| Recruiter activity counters | Done — each figure defined next to it |
| Application tracker | Done — `/candidate/applications` |
| Saved jobs | Done — `saved_jobs`, owner-only RLS |
| Site navigation | Done — persistent header |
| Mutual match | Done — settled on the second right swipe, expires in 14 days |
| Messaging | Done — inside a match only, expiry enforced by the API |
| Employer pipeline | Done — `/employer/pipeline/[jobId]`, inbound applicants |
| Fit score on listings | Done — the deck's score, never recomputed for display |
| Applicant counts | Done — shown on every listing |
| Database | Live on Supabase; all pages read from Postgres |
| Candidate swipe persistence | Done — `POST /api/swipes`, idempotent |
| Employer swipe persistence | Done — reason-coded passes are written |
| Candidate pass feedback | Done — aggregated, thresholded, anonymised |
| Employer shortlist persistence | Not started — needs accounts |
| Auth | Not started |
| AI resume parsing / tailoring | Not started |
| Matching engine | Scores are hand-written in seed data |

`src/lib/mock-data.ts` is now only used by the seed scripts, not by the app.

Employer shortlists still live in component state and reset on reload. That is
deliberate: a shortlist belongs to a recruiter, and there are no recruiter
accounts yet, so there is nothing to attach one to.

## Candidate pass feedback

Recruiters tag every pass with a reason. Those reasons are aggregated back to
the candidate as the one thing no Indian job board tells them: why they are not
hearing back.

Three rules make it safe to show a person, and none of them are optional:

1. **Aggregate only.** Never which company, never which recruiter, never when.
   "Meridian rejected you" is a different and much worse product than "comp is
   your blocker".
2. **Threshold.** Below three passes there is no pattern, only a rejection.
   The panel renders nothing at all.
3. **Actionable framing.** The copy describes the mismatch, not the person.
   "Your expected CTC sits above the band" is something to act on; "you were
   too expensive" is something to feel bad about. Same row in the database.

## Three decisions worth not reversing

**Candidates swipe roles, never companies.** Everyone right-swipes a famous
logo, so a company-level swipe carries no information and the deck degenerates
into a brand popularity contest.

**Employers swipe inside a requisition.** A right-swipe means "this person, for
this role", which is a signal you can learn from. `swipes.job_id` is not
optional.

**The employer card leads with work, not a face.** Photos are off by default in
the employer deck. A face-first deck means people are triaging on age, gender
and skin tone before reading a line of experience.

## Layout

```
src/
  app/
    page.tsx                              dev switcher
    candidate/deck/page.tsx               role deck
    employer/sourcing/[jobId]/page.tsx    candidate deck
    employer/search/page.tsx              recruiter keyword search
    api/swipes/route.ts                   swipe log endpoint
    globals.css                           design tokens
  components/
    SwipeDeck.tsx                         gesture engine, deck-type agnostic
    CandidateCard.tsx                     employer-side card
    RoleCard.tsx                          candidate-side card
    SourcingDeck.tsx                      employer screen + reason capture
  db/
    schema.ts                             Drizzle tables, mirrors the SQL
    queries.ts                            deck queries; enforces stealth
    seed.ts                               loads seed data
  lib/
    types.ts                              domain types
    mock-data.ts                          seed data (seeding only)
    utils.ts
```

`src/lib/types.ts` matches the Postgres schema one-for-one, which is why the
switch from seed data to live queries changed the data source and nothing else.

## Database

Live on Supabase, project `sehgahcvxybdbegyyzja`. Four migrations are applied
and the seed data is loaded — 6 candidates, 3 companies, 5 open roles, 8 scored
deck rows.

| Migration | What it does |
| --- | --- |
| `0000_initial_schema` | 18 tables, enums, indexes, pgvector |
| `0001_rls_policies` | Row-level security, including the stealth guarantee |
| `0002_harden_helper_and_grants` | Moves the SECURITY DEFINER helper out of the REST-exposed schema; revokes grants on the locked tables |
| `0003_move_vector_to_extensions_schema` | Takes pgvector out of `public` |
| `0004_dear_microchip` | Preferred locations, employment type, screening questions |
| `0005_align_availability_boundary` | Fixes an off-by-one against the app's own boundary |

Supabase holds the applied ledger; Drizzle's `__drizzle_migrations` table has
been reconciled to match, so `npm run db:migrate` correctly sees all four as
applied and does nothing.

**Changing the schema:** edit `src/db/schema.ts`, run `npm run db:generate` to
author the SQL, review it, then apply it. Never hand-edit an applied migration.

### Connection strings

`.env.local` is filled in and working. Both `DATABASE_URL` and `DIRECT_URL`
currently point at the **session pooler**. That is fine at this stage; swap
`DATABASE_URL` to the Transaction pooler URI if concurrent load ever becomes a
problem.

The database password was pasted into a chat transcript during setup, so it
should be rotated: **Project Settings → Database → Reset database password**,
then update both lines in `.env.local`. Special characters in the password
must be percent-encoded (`@` becomes `%40`).

### One thing to know about RLS

The app connects as the `postgres` role, which **bypasses every RLS policy**.
That is normal for server-side rendering, and it is why the stealth-block and
availability filters are also written into the SQL in `src/db/queries.ts`.

The policies become load-bearing once auth runs through Supabase and queries
arrive as `authenticated`. Both layers are needed. Deleting either one opens
the hole.

### Verified behaviour

Two rules were tested against the live database rather than assumed:

- **Availability decay.** Priya Nambiar confirmed 29 days ago and is correctly
  absent from every deck. Past 21 days you disappear until you re-confirm.
- **Stealth blocking.** Simulating a candidate blocking `MERIDIAN.DEV` removes
  them from Meridian's deck, and the match is case-insensitive.
- **Completeness scoring.** Clearing a candidate's preferred locations drops
  the score from 100% to exactly 90% — the locations weight — and surfaces that
  specific nudge.
- **Swipe log.** Valid payload writes a row, malformed payload returns 400, and
  a duplicate swipe is a no-op rather than a second row.
- **Feedback threshold.** Cutting a candidate's pass history to two rows hides
  the feedback panel entirely; restoring it to five brings it back.
- **No company leakage.** The rendered feedback panel contains none of the
  company names, checked against the markup rather than assumed.

## Demo data drifts

Seeded dates are absolute, so the demo decays: after a couple of weeks every
candidate reads as stale, and every job reads as posted months ago, which makes
the freshness states and the `/jobs` freshness filter stop illustrating
anything. Re-stamp both:

```bash
node --env-file=.env.local scripts/refresh-availability.mjs
```

```bash
node --env-file=.env.local scripts/stagger-job-dates.mjs
```

A database seeded before migration 0006 has no job descriptions or experience
bands. Fill them in without dropping the swipe log — re-seeding deletes jobs,
and swipes cascade off jobs:

```bash
node --env-file=.env.local scripts/backfill-0006.mjs
```

Empty employer pipelines mean nobody has applied. Seed the inbound direction:

```bash
node --env-file=.env.local scripts/seed-applicants.mjs
```

## Next

1. **Auth.** LinkedIn OIDC for identity plus email OTP. Note that LinkedIn's
   OIDC scopes return name, photo and email only — no work history, no skills.
   Resume upload is the real ingest path, and the onboarding copy should say
   "import from your resume" rather than promise a LinkedIn sync.

   This also unblocks what is currently stubbed: employer shortlist
   persistence, profile editing, and the actor id on every write endpoint —
   `/api/swipes`, `/api/saved-jobs` and `/api/availability` all take it from
   the request body today, so a caller could act as anyone. Fine for a
   single-user dev build, not fine in public. `src/lib/demo.ts` holds the
   hard-coded identities and is the one file to delete when sessions land.

2. **Resume parsing.** Needs `ANTHROPIC_API_KEY` in `.env.local`. Structured
   outputs against a strict schema, and the parse is always shown to the user
   for correction before it is saved.

3. **Match + chat**, then the availability re-confirmation notification loop.
