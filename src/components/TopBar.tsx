"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./Mark";
import { badge, button } from "./button";

/* Primary navigation. Feed covers the home page, section filters and single posts. */
const NAV = [
  { label: "Feed", href: "/feed", match: (p: string) => p.startsWith("/feed") || p.startsWith("/sections") },
  { label: "Websites", href: "/websites", match: (p: string) => p.startsWith("/website") },
  { label: "Launch films", href: "/launch-videos", match: (p: string) => p.startsWith("/launch-videos") },
  { label: "Share cards", href: "/og-images", match: (p: string) => p.startsWith("/og-images") },
  { label: "Tools", href: "/tools", match: (p: string) => p.startsWith("/tools") },
  { label: "Pricing", href: "/pricing", match: (p: string) => p.startsWith("/pricing") },
];

export function TopBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-[80] w-full border-b border-line bg-gutter/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-5 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          <Mark size={28} />
          lookap
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const on = n.match(path);
            return on ? (
              <Link key={n.href} href={n.href} aria-current="page" className={badge("active", "px-3 py-1.5 text-[13px]")}>{n.label}</Link>
            ) : (
              <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-subtle transition-colors hover:bg-chip hover:text-foreground">{n.label}</Link>
            );
          })}
        </nav>

        <form action="/search" role="search" className="ml-auto hidden w-full max-w-[260px] items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[13px] ring-1 ring-line-strong transition-shadow focus-within:ring-ring sm:flex">
          <svg className="shrink-0 text-subtle" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input name="q" placeholder="Search" aria-label="Search" className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle" />
          <kbd className={badge("chip", "h-5 px-1.5 font-mono text-[10px]")}>/</kbd>
        </form>

        <div className="flex shrink-0 items-center gap-3 max-sm:ml-auto">
          <Link href="/signin" className="hidden text-[13px] font-medium text-subtle transition-colors hover:text-foreground sm:inline">Sign in</Link>
          <Link href="/clone" className={button("silver", "h-8 rounded-full px-3.5 text-[13px]")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
            Clone a video
          </Link>
        </div>
      </div>
    </header>
  );
}
