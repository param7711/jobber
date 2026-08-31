import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, EyeOff, Link2 } from "lucide-react";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { PassFeedbackPanel } from "@/components/PassFeedback";
import { RecruiterActivityPanel } from "@/components/RecruiterActivity";
import {
  getCandidate,
  passFeedbackForCandidate,
  recruiterActivityForCandidate,
} from "@/db/queries";
import { DEMO_CANDIDATE_ID } from "@/lib/demo";
import { profileCompleteness } from "@/lib/completeness";
import {
  EMPLOYMENT_TYPE_LABEL,
  SENIORITY_LABEL,
  WORK_MODE_LABEL,
  formatLpa,
  formatNotice,
} from "@/lib/types";
import { initials } from "@/lib/utils";

/**
 * The candidate's own profile.
 *
 * Two ideas from two places, deliberately. The completeness checklist and the
 * recruiter-activity counters are what job boards here get right — they give a
 * candidate something to do on a day when nobody has called. The timeline
 * below is the professional-profile idea: work history as a narrative, with
 * achievements, rather than a form full of dropdowns.
 *
 * What is missing on purpose: a photo. It leads every profile product in this
 * space and it is a discrimination vector in a market with this much caste,
 * gender and age bias in hiring. Employer cards show work, not faces.
 */
/** Availability, recruiter counters and completeness all move; see app/page.tsx. */
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const candidate = await getCandidate(DEMO_CANDIDATE_ID);
  if (!candidate) notFound();

  const [feedback, activity] = await Promise.all([
    passFeedbackForCandidate(DEMO_CANDIDATE_ID),
    recruiterActivityForCandidate(DEMO_CANDIDATE_ID),
  ]);

  const completeness = profileCompleteness(candidate);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <header className="mt-5 rounded-lg border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-seek font-mono text-[17px] font-semibold text-white"
          >
            {initials(candidate.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
              {candidate.name}
            </h1>
            <p className="mt-1 text-[15px] leading-snug text-ink-2">
              {candidate.headline}
            </p>
            <p className="mt-1.5 font-mono text-[12.5px] text-muted">
              {candidate.city} · {candidate.yearsExperience} yrs ·{" "}
              {SENIORITY_LABEL[candidate.seniority]}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ------------------------------------------------ main column */}
        <div className="flex flex-col gap-4">
          <Card title="What you are looking for">
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
              <Fact label="Notice period" value={formatNotice(candidate.noticeDays)} />
              <Fact label="Current CTC" value={formatLpa(candidate.ctcCurrent)} />
              <Fact label="Expected CTC" value={formatLpa(candidate.ctcExpected)} />
              <Fact
                label="Work mode"
                value={WORK_MODE_LABEL[candidate.remotePref]}
              />
              <Fact
                label="Open to"
                value={candidate.employmentTypes
                  .map((t) => EMPLOYMENT_TYPE_LABEL[t])
                  .join(", ")}
              />
              <Fact
                label="Would work in"
                value={candidate.preferredLocations.join(", ") || "—"}
                wide
              />
            </dl>
            <p className="mt-4 border-t border-line-soft pt-3 text-[12.5px] leading-[1.45] text-muted">
              Every recruiter sees this block before they swipe. It is the whole
              reason a match here is worth more than an application elsewhere —
              nobody wastes a round finding out the comp was never going to work.
            </p>
          </Card>

          <Card title="Skills">
            <ul className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-sm border border-line-soft bg-surface-2 px-2.5 py-1 font-mono text-[12px] text-ink-2"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Experience">
            <ol className="flex flex-col">
              {candidate.experiences.map((exp, i) => (
                <li
                  key={exp.id}
                  className={
                    i > 0 ? "border-t border-line-soft pt-4 mt-4" : undefined
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="text-[15px] font-semibold leading-tight">
                      {exp.title}
                    </h3>
                    <span className="font-mono text-[11.5px] tabular-nums text-muted">
                      {exp.startYear} – {exp.endYear ?? "Present"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13.5px] text-ink-2">{exp.company}</p>
                  {exp.highlights.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {exp.highlights.map((h, j) => (
                        <li
                          key={j}
                          className="flex gap-2.5 text-[13.5px] leading-[1.5] text-ink-2"
                        >
                          <span
                            aria-hidden
                            className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-seek"
                          />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          {candidate.education.length > 0 && (
            <Card title="Education">
              <ul className="flex flex-col gap-3">
                {candidate.education.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3"
                  >
                    <span>
                      <span className="block text-[14px] font-medium">
                        {e.degree}
                      </span>
                      <span className="text-[13px] text-muted">
                        {e.institution}
                      </span>
                    </span>
                    <span className="font-mono text-[11.5px] tabular-nums text-muted">
                      {e.endYear || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {candidate.proof.length > 0 && (
            <Card title="Proof of work">
              {/* Keyed by index: proof links carry no id once mapped, and two
                  entries can legitimately share a label or a placeholder URL.
                  Safe here because the list is server-rendered and never
                  reordered on the client. */}
              <ul className="flex flex-col gap-2">
                {candidate.proof.map((p, i) => {
                  // A link that goes nowhere is worse than no link — it reads
                  // as a broken page rather than an unfinished profile.
                  const real = p.url.startsWith("http");
                  return (
                    <li key={i}>
                      {real ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-2 text-[13.5px] text-ink-2 hover:text-seek"
                        >
                          <Link2
                            aria-hidden
                            size={14}
                            className="shrink-0 text-muted"
                          />
                          <span className="font-medium">{p.label}</span>
                          <span className="truncate font-mono text-[11.5px] text-muted">
                            {p.url}
                          </span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 text-[13.5px] text-ink-2">
                          <Link2
                            aria-hidden
                            size={14}
                            className="shrink-0 text-muted"
                          />
                          <span className="font-medium">{p.label}</span>
                          <span className="font-mono text-[11px] text-muted">
                            no link yet
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {candidate.customSections.map((s) => (
            <Card key={s.id} title={s.title}>
              <p className="whitespace-pre-line text-[13.5px] leading-[1.55] text-ink-2">
                {s.body}
              </p>
            </Card>
          ))}
        </div>

        {/* ------------------------------------------------- side column */}
        <aside className="flex flex-col gap-4">
          <AvailabilityCard
            candidateId={DEMO_CANDIDATE_ID}
            confirmedAt={candidate.availabilityConfirmedAt}
            openToWork
          />

          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="label text-muted">Profile strength</h2>
              <p className="font-mono text-[15px] font-semibold tabular-nums">
                {completeness.percent}%
              </p>
            </div>

            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profile ${completeness.percent} percent complete`}
            >
              <div
                className={
                  completeness.percent === 100 ? "h-full bg-keep" : "h-full bg-seek"
                }
                style={{ width: `${completeness.percent}%` }}
              />
            </div>

            {/* The deck shows one nudge; here the full list is fair game —
                someone who opened their profile came to work on it. */}
            <ul className="mt-3 flex flex-col gap-1.5">
              {completeness.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-[13px] leading-snug"
                >
                  {item.done ? (
                    <Check
                      aria-hidden
                      size={13}
                      strokeWidth={2.5}
                      className="mt-[3px] shrink-0 text-keep"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full border border-seek"
                    />
                  )}
                  <span className={item.done ? "text-muted" : "text-ink-2"}>
                    {item.done ? item.label : item.nudge}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <RecruiterActivityPanel activity={activity} />

          <PassFeedbackPanel feedback={feedback} />

          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <h2 className="label flex items-center gap-1.5 text-muted">
              <EyeOff aria-hidden size={12} />
              Hidden from
            </h2>
            {candidate.stealthBlocks.length === 0 ? (
              <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
                Nobody. Add your current employer&rsquo;s domain and they will
                never see you here — enforced in the database, not by a filter
                somebody could forget.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {candidate.stealthBlocks.map((domain) => (
                  <li
                    key={domain}
                    className="rounded-sm border border-line-soft bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-ink-2"
                  >
                    {domain}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="rounded-sm border border-line-soft bg-surface-2 px-4 py-3 text-[12.5px] leading-[1.5] text-muted">
            Editing lands with accounts — every field here has to belong to a
            signed-in person before it can be changed from a browser.{" "}
            <Link href="/jobs" className="text-seek hover:underline">
              Browse jobs
            </Link>{" "}
            meanwhile.
          </p>
        </aside>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-[13.5px] font-medium tabular-nums text-ink">
        {value}
      </dd>
    </div>
  );
}
