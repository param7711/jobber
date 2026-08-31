"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import type { ThreadMessage } from "@/db/queries";
import { cn } from "@/lib/utils";

/**
 * The conversation inside a match.
 *
 * Deliberately plain: no typing indicators, no read receipts, no emoji tray.
 * The thing people want from a recruiter conversation is an answer, and every
 * ornament added here is a thing that can break on a slow connection.
 *
 * Optimistic send, because a message that appears instantly and quietly
 * reconciles is how every messaging product people already use behaves. A
 * failure puts the text back in the box rather than losing it.
 */
/**
 * Message timestamps, pinned to IST.
 *
 * Locale-and-timezone-free formatting broke hydration: the server rendered in
 * its own timezone, the browser re-rendered in the viewer's, and React threw.
 * Pinning both sides to the same explicit locale fixes that — and IST is the
 * right choice rather than a convenient one, because "Wednesday after 4pm" in
 * a hiring conversation here means 4pm in India to everyone reading it.
 */
const IST = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function stamp(iso: string) {
  return `${IST.format(new Date(iso))} IST`;
}

export function MessageThread({
  matchId,
  senderId,
  senderName,
  otherName,
  initialMessages,
  closed,
  closedReason,
}: {
  matchId: string;
  senderId: string;
  senderName: string;
  otherName: string;
  initialMessages: ThreadMessage[];
  closed: boolean;
  closedReason?: string;
}) {
  const [thread, setThread] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;

    // Temporary id, replaced when the server answers. Prefixed so a failed
    // send can be pulled back out without touching a real row.
    const tempId = `pending-${thread.length}`;
    setThread((prev) => [
      ...prev,
      { id: tempId, senderId, body, createdAt: new Date().toISOString() },
    ]);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, senderId, body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not send");

      setThread((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: data.id, createdAt: data.createdAt }
            : m,
        ),
      );
    } catch (e) {
      setThread((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex max-h-[52vh] min-h-[220px] flex-col gap-2.5 overflow-y-auto p-4">
        {thread.length === 0 ? (
          <p className="m-auto max-w-[38ch] text-center text-[13.5px] leading-[1.5] text-muted">
            You matched. Nobody has said anything yet — and the first message
            being specific about next steps is what stops this going cold.
          </p>
        ) : (
          thread.map((m) => {
            const mine = m.senderId === senderId;
            return (
              <div
                key={m.id}
                className={cn("flex flex-col", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3.5 py-2.5 text-[13.5px] leading-[1.5]",
                    mine
                      ? "bg-hire text-white"
                      : "border border-line-soft bg-surface-2 text-ink",
                  )}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                </div>
                <p className="mt-1 px-1 font-mono text-[10.5px] text-muted">
                  {mine ? senderName : otherName} · {stamp(m.createdAt)}
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {closed ? (
        <p className="border-t border-line-soft bg-surface-2 px-4 py-3 text-[13px] leading-[1.45] text-muted">
          {closedReason ??
            "This match has closed. Neither side can post to it any more."}
        </p>
      ) : (
        <div className="border-t border-line-soft p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter breaks the line.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder={`Message ${otherName}…`}
              aria-label={`Message ${otherName}`}
              className="min-h-[44px] flex-1 resize-none rounded-sm border border-line bg-surface px-3 py-2 text-[13.5px] leading-[1.45] outline-none focus-visible:border-hire"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || draft.trim().length === 0}
              className="flex h-[44px] shrink-0 items-center gap-1.5 rounded-sm border border-hire bg-hire px-4 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <SendHorizontal aria-hidden size={15} />
              Send
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[12px] text-pass">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
