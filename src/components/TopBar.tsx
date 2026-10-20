"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { UserMenu } from "./auth/UserMenu";
import { usePathname } from "next/navigation";
import { Mark } from "./Mark";
import { badge, button } from "./button";

/* Primary navigation. Feed covers the home page, section filters and single posts. */
const NAV = [
  { label: "Feed", href: "/feed", match: (p: string) => p.startsWith("/feed") || p.startsWith("/sections") || p.startsWith("/website") },
  { label: "MCP", href: "/mcp", match: (p: string) => p.startsWith("/mcp") },
  { label: "Pricing", href: "/pricing", match: (p: string) => p.startsWith("/pricing") },
];

export function TopBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-[80] w-full border-b border-line bg-gutter/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-5 px-4">
        <Link href="/" className="group/brand flex shrink-0 items-center gap-2.5 text-[16px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          <Mark size={36} />
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

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Show when="signed-out">
            <Link href="/sign-in" className="hidden text-[13px] font-medium text-subtle transition-colors hover:text-foreground sm:inline">Sign in</Link>
            <Link href="/sign-up" className={button("silver", "h-8 rounded-full px-3.5 text-[13px]")}>Sign up</Link>
          </Show>
          <Show when="signed-in">
            <UserMenu />
          </Show>
        </div>
      </div>
    </header>
  );
}
