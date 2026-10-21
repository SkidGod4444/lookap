"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Show } from "@clerk/nextjs";
import { UserMenu } from "./auth/UserMenu";
import { AuthDialog } from "./auth/AuthDialog";
import { usePathname, useSearchParams } from "next/navigation";
import { Mark } from "./Mark";
import { badge, button } from "./button";
import { X_URL } from "@/lib/site";

/* Primary navigation. Feed covers the home page, section filters and single posts. */
const NAV = [
  { label: "Feed", href: "/feed", match: (p: string) => p.startsWith("/feed") || p.startsWith("/sections") || p.startsWith("/website") },
  { label: "MCP", href: "/mcp", match: (p: string) => p.startsWith("/mcp") },
  { label: "Pricing", href: "/pricing", match: (p: string) => p.startsWith("/pricing") },
];

export function TopBar() {
  const path = usePathname();
  const params = useSearchParams();
  const wantsSignIn = params.get("signin") === "1";
  const next = params.get("next");
  const [auth, setAuth] = useState(false);
  /* The dialog is a portal, so a URL-driven open must wait for the client: on the server it renders nothing. */
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const open = auth || (mounted && wantsSignIn);
  return (
    <header className="sticky top-0 z-[80] w-full border-b border-line bg-gutter/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-3 px-4 sm:gap-5">
        {/* on phones the wordmark steps aside so the three destinations fit beside the mark */}
        <Link href="/" className="group/brand flex shrink-0 items-center gap-2.5 text-[16px] leading-none font-semibold tracking-[-0.02em] text-foreground" aria-label="lookap home">
          <Mark size={36} />
          <span className="hidden sm:inline">lookap</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((n) => {
            const on = n.match(path);
            return on ? (
              <Link key={n.href} href={n.href} aria-current="page" className={badge("active", "px-2.5 py-1.5 text-[12px] sm:px-3 sm:text-[13px]")}>{n.label}</Link>
            ) : (
              <Link key={n.href} href={n.href} className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-subtle transition-colors hover:bg-chip hover:text-foreground sm:px-3 sm:text-[13px]">{n.label}</Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <a href={X_URL} aria-label="Follow on X" className={button("outline", "h-8 rounded-full px-3 text-[13px] sm:px-3.5")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2h7l4.8 6.4L18.2 2Zm-1.2 18h1.9L7.1 3.9H5.1L17 20Z" /></svg>
            <span className="hidden sm:inline">Follow on X</span>
          </a>
          <Show when="signed-out">
            <button type="button" onClick={() => setAuth(true)} className={button("silver", "h-8 rounded-full px-3.5 text-[13px]")}>Sign in</button>
          </Show>
          <Show when="signed-in">
            <UserMenu />
          </Show>
        </div>
      </div>
      <AuthDialog open={open} next={next && next.startsWith("/") ? next : undefined} onClose={() => { setAuth(false); if (wantsSignIn) window.history.replaceState(null, "", path); }} />
    </header>
  );
}
