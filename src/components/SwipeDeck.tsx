"use client";

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SwipeDirection } from "@/lib/types";

/** Past this horizontal distance, releasing commits the swipe. */
const COMMIT_DISTANCE = 110;
/** A fast flick commits even if it never travelled the full distance. */
const COMMIT_VELOCITY = 620;

interface SwipeCardProps {
  children: ReactNode;
  onCommit: (direction: SwipeDirection) => void;
  leftLabel: string;
  rightLabel: string;
  /** Set when the parent triggers a swipe from a button or the keyboard. */
  programmatic: SwipeDirection | null;
}

function SwipeCard({
  children,
  onCommit,
  leftLabel,
  rightLabel,
  programmatic,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], [-13, 0, 13]);
  const passOpacity = useTransform(x, [-140, -45], [1, 0]);
  const keepOpacity = useTransform(x, [45, 140], [0, 1]);
  // The card behind peeks through as the top one clears.
  const dimming = useTransform(x, [-320, 0, 320], [0.55, 1, 0.55]);

  const committed = useRef(false);

  const fling = useCallback(
    (direction: SwipeDirection) => {
      if (committed.current) return;
      committed.current = true;
      const target = direction === "right" ? 720 : -720;
      animate(x, target, {
        type: "spring",
        stiffness: 260,
        damping: 30,
        velocity: direction === "right" ? 400 : -400,
      });
      // Hand control back before the spring settles so the stack advances
      // while the card is still visibly leaving.
      window.setTimeout(() => onCommit(direction), 180);
    },
    [onCommit, x],
  );

  useEffect(() => {
    if (programmatic) fling(programmatic);
  }, [programmatic, fling]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const travelled = Math.abs(info.offset.x) > COMMIT_DISTANCE;
    const flicked = Math.abs(info.velocity.x) > COMMIT_VELOCITY;
    if (travelled || flicked) {
      fling(info.offset.x > 0 ? "right" : "left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 34 });
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity: dimming }}
      drag="x"
      dragElastic={0.5}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.995 }}
    >
      <div className="relative h-full">
        {children}

        {/* Verdict stamps. Rotated slightly so they read as applied, not printed. */}
        <motion.div
          aria-hidden
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute left-5 top-5 -rotate-12 rounded-sm border-2 border-pass px-3 py-1.5"
        >
          <span className="label text-pass">{leftLabel}</span>
        </motion.div>
        <motion.div
          aria-hidden
          style={{ opacity: keepOpacity }}
          className="pointer-events-none absolute right-5 top-5 rotate-12 rounded-sm border-2 border-keep px-3 py-1.5"
        >
          <span className="label text-keep">{rightLabel}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export interface SwipeDeckProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onSwipe: (item: T, direction: SwipeDirection) => void;
  leftLabel: string;
  rightLabel: string;
  emptyState: ReactNode;
  className?: string;
}

export function SwipeDeck<T>({
  items,
  keyOf,
  renderCard,
  onSwipe,
  leftLabel,
  rightLabel,
  emptyState,
  className,
}: SwipeDeckProps<T>) {
  const [cursor, setCursor] = useState(0);
  const [programmatic, setProgrammatic] = useState<SwipeDirection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const remaining = items.slice(cursor);
  const top = remaining[0];

  const commit = useCallback(
    (direction: SwipeDirection) => {
      const item = items[cursor];
      if (!item) return;
      setProgrammatic(null);
      setCursor((c) => c + 1);
      onSwipe(item, direction);
    },
    [cursor, items, onSwipe],
  );

  // Arrow keys drive the deck too — swiping must not be the only way through.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setProgrammatic("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setProgrammatic("right");
      }
    }
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!top) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex h-full items-center justify-center">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        tabIndex={0}
        role="group"
        aria-roledescription="card deck"
        aria-label={`${remaining.length} remaining. Left arrow to pass, right arrow to keep.`}
        className="deck-surface relative h-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-ground rounded-lg"
      >
        {/* Two cards of depth behind the top one — enough to read as a stack. */}
        {remaining
          .slice(1, 3)
          .reverse()
          .map((item, reverseIndex) => {
            const depth = reverseIndex === 0 ? 2 : 1;
            return (
              <div
                key={keyOf(item)}
                aria-hidden
                className="absolute inset-0 origin-bottom transition-transform"
                style={{
                  transform: `scale(${1 - depth * 0.035}) translateY(${depth * 10}px)`,
                  zIndex: 10 - depth,
                }}
              >
                <div className="h-full opacity-60">{renderCard(item)}</div>
              </div>
            );
          })}

        <div className="absolute inset-0 z-20">
          <SwipeCard
            key={keyOf(top)}
            onCommit={commit}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            programmatic={programmatic}
          >
            {renderCard(top)}
          </SwipeCard>
        </div>
      </div>

      <DeckControls
        onPass={() => setProgrammatic("left")}
        onKeep={() => setProgrammatic("right")}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        remaining={remaining.length}
      />
    </div>
  );
}

function DeckControls({
  onPass,
  onKeep,
  leftLabel,
  rightLabel,
  remaining,
}: {
  onPass: () => void;
  onKeep: () => void;
  leftLabel: string;
  rightLabel: string;
  remaining: number;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onPass}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-pass transition-colors hover:bg-pass-soft hover:border-pass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pass"
        aria-label={leftLabel}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <span className="label w-20 text-center text-muted tabular-nums">
        {remaining} left
      </span>

      <button
        type="button"
        onClick={onKeep}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-keep transition-colors hover:bg-keep-soft hover:border-keep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-keep"
        aria-label={rightLabel}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
    </div>
  );
}
