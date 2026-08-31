import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { savedJobs } from "@/db/schema";

/**
 * Bookmark / un-bookmark a job.
 *
 * Same caveat as /api/swipes: candidateId comes from the request body, so
 * until auth lands a caller could edit anyone's saved list. Acceptable for a
 * dev build with invented data, not once a real person signs up.
 */
const Body = z.object({
  candidateId: z.uuid(),
  jobId: z.uuid(),
  saved: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { candidateId, jobId, saved } = parsed.data;

  if (saved) {
    await db
      .insert(savedJobs)
      .values({ candidateId, jobId })
      // Saving twice is the same as saving once — the button is optimistic and
      // a double tap must not 500.
      .onConflictDoNothing();
  } else {
    await db
      .delete(savedJobs)
      .where(
        and(eq(savedJobs.candidateId, candidateId), eq(savedJobs.jobId, jobId)),
      );
  }

  return Response.json({ ok: true, saved });
}
