import { and, eq } from "drizzle-orm";
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

  const pair = and(
    eq(swipes.actorId, actorId),
    eq(swipes.subjectId, subjectId),
    eq(swipes.jobId, jobId),
  );

  const [existing] = await db
    .select({ direction: swipes.direction })
    .from(swipes)
    .where(pair)
    .limit(1);

  /*
   * A person is allowed to change their mind.
   *
   * This used to be a bare onConflictDoNothing(), which was right when the
   * deck was the only way to swipe: you never see the same card twice, so a
   * repeat could only be a double-tap. It became wrong the moment a job could
   * also be applied to from its listing page — someone who passed in the deck,
   * then read the full description and wanted in, got {ok:true} and nothing
   * happened. A success response for a discarded write is the worst kind of
   * bug, because nobody reports it.
   *
   * The unique index still holds: one standing decision per (actor, subject,
   * job). What changed is that a reversal updates that decision rather than
   * being dropped on the floor, and the response says which happened so the
   * UI never claims something the database did not do.
   */
  if (!existing) {
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
      // Two taps racing each other. The loser is a no-op, not a 500.
      .onConflictDoNothing();

    return Response.json({ ok: true, outcome: "recorded", direction });
  }

  if (existing.direction === direction) {
    return Response.json({ ok: true, outcome: "unchanged", direction });
  }

  await db
    .update(swipes)
    .set({
      direction,
      passReason: direction === "left" ? (passReason ?? null) : null,
      createdAt: new Date(),
    })
    .where(pair);

  return Response.json({ ok: true, outcome: "reversed", direction });
}
