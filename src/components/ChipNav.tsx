"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, sectionSlug, bySection } from "@/lib/data";
import { badge, noScrollbar } from "@/components/button";

/* Filter row for feed pages: section chips on the left, sort on the right. Hidden on posts, pricing and tools. */
const FEED_PATHS = ["/feed", "/websites", "/launch-videos", "/og-images"];

export function ChipNav() {
  const path = usePathname();
  const isFeed = FEED_PATHS.includes(path) || path.startsWith("/sections/");
  if (!isFeed) return null;
  const chip = (active: boolean) => badge(active ? "active" : "chip", "shrink-0 px-3 py-1.5 text-[13px]");
  return (
    <nav aria-label="Filters" className="sticky top-0 z-[70] -mx-4 -mt-4 mb-4 flex min-w-0 items-center gap-4 bg-canvas px-4 py-3">
      <div className={`${noScrollbar} flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]`}>
        <Link href="/feed" className={chip(path === "/feed")}>All</Link>
        {SECTIONS.filter((s) => bySection(sectionSlug(s)).length > 0).map((s) => {
          const href = `/sections/${sectionSlug(s)}`;
          return <Link key={s} href={href} className={chip(path === href)}>{s}</Link>;
        })}
      </div>
    </nav>
  );
}
