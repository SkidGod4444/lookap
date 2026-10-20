"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SECTIONS, sectionSlug } from "@/lib/data";
import { badge, noScrollbar } from "@/components/button";

/* Filter row for feed pages: section chips on the left, sort on the right. Hidden on posts, pricing and tools. */
const FEED_PATHS = ["/", "/feed", "/websites", "/launch-videos", "/og-images", "/favourites"];

export function ChipNav() {
  const path = usePathname();
  const params = useSearchParams();
  const isFeed = FEED_PATHS.includes(path) || path.startsWith("/sections/");
  if (!isFeed) return null;
  const sort = params.get("sort") === "popular" ? "popular" : "latest";
  const chip = (active: boolean) => badge(active ? "active" : "chip", "shrink-0 px-3 py-1.5 text-[13px]");
  const sortChip = (active: boolean) => badge(active ? "active" : "chip", "px-3 py-1.5 text-[12px]");
  return (
    <nav aria-label="Filters" className="sticky top-14 z-[70] -mx-4 -mt-4 mb-4 flex min-w-0 items-center gap-4 bg-canvas px-4 py-3">
      <div className={`${noScrollbar} flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pr-16 [mask-image:linear-gradient(to_right,black_calc(100%-6rem),transparent_calc(100%-1rem))]`}>
        <Link href="/" className={chip(path === "/")}>All</Link>
        {SECTIONS.map((s) => {
          const href = `/sections/${sectionSlug(s)}`;
          return <Link key={s} href={href} className={chip(path === href)}>{s}</Link>;
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link href={`${path}?sort=latest`} className={sortChip(sort === "latest")}>Latest</Link>
        <Link href={`${path}?sort=popular`} className={sortChip(sort === "popular")}>Popular</Link>
      </div>
    </nav>
  );
}
