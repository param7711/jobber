"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * Collapsible filter panel.
 *
 * On a phone the sidebar sits above the results, so an expanded panel pushes
 * every job below the fold — you scroll past seven controls to reach the thing
 * you came for. On a laptop there is a column to put it in and collapsing it
 * would just be a wasted click.
 *
 * So: a plain <details>, open in the served HTML, closed on mount when the
 * viewport is narrow. Rendering it open on the server keeps hydration honest
 * and means the no-JavaScript case degrades to exactly the old behaviour —
 * filters visible and usable, just lower down.
 *
 * The summary stays visible at every width, deliberately. Hiding it above
 * `lg` looked tidier and produced a dead end: any width misreading at mount
 * (a pane that reports innerWidth 0, say) collapsed the panel with no control
 * left to reopen it, so the filters were simply gone. A toggle that is always
 * present cannot strand anyone.
 */
export function FilterPanel({
  activeCount,
  onClear,
  children,
}: {
  /** Shown on the summary so a collapsed panel cannot hide applied filters. */
  activeCount: number;
  /** Rendered beside the toggle when anything is applied. */
  onClear?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // matchMedia rather than innerWidth: same 1024px breakpoint as `lg:`.
    const wide = window.matchMedia("(min-width: 1024px)");

    // Collapse on a phone, and re-open if the viewport later becomes wide —
    // a rotation or a resized window otherwise leaves a desktop layout with
    // its filter column mysteriously empty.
    const sync = () => {
      if (ref.current) ref.current.open = wide.matches;
    };

    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

  return (
    <details ref={ref} open className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm border border-line bg-surface px-4 py-2.5 text-[13.5px] font-medium lg:border-transparent lg:bg-transparent lg:px-0 lg:py-0 lg:pb-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <SlidersHorizontal
            aria-hidden
            size={14}
            className="text-muted lg:hidden"
          />
          <span className="lg:label lg:text-muted">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-sm bg-seek px-1.5 font-mono text-[11px] tabular-nums text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="font-mono text-[11px] text-muted group-open:hidden"
        >
          SHOW
        </span>
        <span
          aria-hidden
          className="hidden font-mono text-[11px] text-muted group-open:inline"
        >
          HIDE
        </span>
      </summary>

      {onClear && <div className="mt-2 text-right lg:mt-0">{onClear}</div>}

      <div className="mt-3 flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 lg:mt-0">
        {children}
      </div>
    </details>
  );
}
