"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Persistent top bar.
 *
 * The app had no navigation at all — every screen was reachable only from the
 * home page, which is fine for a demo and fatal for a product. Job boards put
 * a fixed bar across the top for a reason: it is the only thing telling you
 * the other sections exist.
 *
 * The two sides are visually separated rather than tabbed. A recruiter and a
 * candidate are not the same person switching modes; the split is a reminder
 * that this is one product with two entirely different jobs to do.
 */

const CANDIDATE_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/candidate/deck", label: "Deck" },
  { href: "/candidate/applications", label: "Applications" },
  { href: "/candidate/profile", label: "Profile" },
];

const EMPLOYER_LINKS = [{ href: "/employer/search", label: "Search" }];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 py-3 text-[15px] font-bold tracking-[-0.02em]"
        >
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-ink font-mono text-[12px] font-semibold text-surface"
          >
            S
          </span>
          <span className="hidden sm:inline">Shortlist</span>
        </Link>

        {/* Horizontally scrollable on a phone rather than wrapping into two
            rows — a nav that changes height as you navigate feels broken. */}
        <nav
          aria-label="Main"
          className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1"
        >
          {CANDIDATE_LINKS.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              side="seek"
              active={isActive(pathname, link.href)}
            />
          ))}

          <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-line" />

          {EMPLOYER_LINKS.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              side="hire"
              active={isActive(pathname, link.href)}
            />
          ))}
        </nav>

        <Link
          href="/candidate/profile"
          className="label hidden shrink-0 rounded-sm border border-line px-2.5 py-1.5 text-muted transition-colors hover:border-ink hover:text-ink sm:block"
        >
          Ananya
        </Link>
      </div>
    </header>
  );
}

/** `/jobs` must not light up on `/jobseekers`, hence the boundary check. */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  side,
  active,
}: {
  href: string;
  label: string;
  side: "seek" | "hire";
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 whitespace-nowrap border-b-2 px-2.5 py-3.5 text-[13.5px] font-medium transition-colors",
        active
          ? side === "seek"
            ? "border-seek text-seek"
            : "border-hire text-hire"
          : "border-transparent text-muted hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
