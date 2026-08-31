import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { candidateProfiles } from "@/db/schema";

/**
 * "Yes, I am still looking."
 *
 * The one tap the whole freshness model rests on. Availability decays to stale
 * at 14 days and drops the candidate out of every deck at 22 — see
 * availabilityState() and the NOT_EXPIRED clause in queries.ts, which have to
 * agree with each other. This endpoint is how someone climbs back in.
 *
 * Same auth caveat as the other routes: candidateId comes from the body.
 */
const Body = z.object({
  candidateId: z.uuid(),
  /** Sent when the candidate is also flipping their open-to-work switch. */
  openToWork: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { candidateId, openToWork } = parsed.data;

  const [updated] = await db
    .update(candidateProfiles)
    .set({
      availabilityConfirmedAt: new Date(),
      updatedAt: new Date(),
      ...(openToWork === undefined ? {} : { openToWork }),
    })
    .where(eq(candidateProfiles.userId, candidateId))
    .returning({ confirmedAt: candidateProfiles.availabilityConfirmedAt });

  if (!updated) {
    return Response.json({ error: "No such profile" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    confirmedAt: updated.confirmedAt?.toISOString() ?? null,
  });
}
