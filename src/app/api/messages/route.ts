import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { matches, messages } from "@/db/schema";

/**
 * Sends one message into a match thread.
 *
 * A match is the only place messaging exists — there is no way to write to
 * someone who has not also swiped right on you. That is the whole point:
 * unsolicited recruiter spam is what makes every other channel worthless, and
 * the mutual-consent gate is a schema constraint here, not a policy.
 *
 * Same auth caveat as the other write routes: senderId comes from the body.
 */
const Body = z.object({
  matchId: z.uuid(),
  senderId: z.uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "A message needs a match, a sender and some text." },
      { status: 400 },
    );
  }

  const { matchId, senderId, body } = parsed.data;

  const [match] = await db
    .select({ state: matches.state, expiresAt: matches.expiresAt })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return Response.json({ error: "No such match" }, { status: 404 });
  }

  // Expiry has to bite here, not just in the UI. A thread that still accepts
  // messages after it has visibly expired teaches people the deadline is
  // decorative, and the deadline is the anti-ghosting mechanism.
  const expired = match.state !== "open" || match.expiresAt < new Date();
  if (expired) {
    return Response.json(
      { error: "This match has closed. Nobody can post to it." },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(messages)
    .values({ matchId, senderId, body })
    .returning({ id: messages.id, createdAt: messages.createdAt });

  return Response.json({
    ok: true,
    id: created.id,
    createdAt: created.createdAt.toISOString(),
  });
}
