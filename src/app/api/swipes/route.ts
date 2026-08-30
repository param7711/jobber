import { z } from "zod";
import { db } from "@/db";
import { swipes } from "@/db/schema";

/**
 * Records a swipe from either side of the marketplace.
 *
 * Once auth lands, actorId must come from the session rather than the request
 * body — right now a caller could log a swipe as anyone. That is acceptable
 * for a single-user dev build and unacceptable the moment this is public, so
 * it is deliberately loud rather than silent.
 */
const PASS_REASON = z.enum([
  "underqualified",
  "overqualified",
  "comp_mismatch",
  "wrong_stack",
  "notice_too_long",
  "location_mismatch",
  "other",
]);

const Body = z.object({
  actorType: z.enum(["candidate", "employer"]),
  /** Candidate: their own id. Employer: the recruiter's user id. */
  actorId: z.uuid(),
  /** Candidate swipes a job; an employer swipes a candidate. */
  subjectId: z.uuid(),
  jobId: z.uuid(),
  direction: z.enum(["left", "right"]),
  passReason: PASS_REASON.nullish(),
  rankShown: z.number().int().nonnegative().nullish(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid swipe payload" }, { status: 400 });
  }

  const { actorType, actorId, subjectId, jobId, direction, passReason, rankShown } =
    parsed.data;

  // A reason only means something on a pass. Storing one against a right swipe
  // would quietly poison the feedback candidates are shown.
  if (direction === "right" && passReason) {
    return Response.json(
      { error: "passReason is only valid on a left swipe" },
      { status: 400 },
    );
  }

  await db
    .insert(swipes)
    .values({
      actorType,
      actorId,
      subjectId,
      jobId,
      direction,
      passReason: direction === "left" ? (passReason ?? null) : null,
      rankShown: rankShown ?? null,
    })
    // Swiping the same subject twice is a no-op, not an error — the unique
    // index on (actor, subject, job) is what makes the log idempotent.
    .onConflictDoNothing();

  return Response.json({ ok: true });
}
