import Link from "next/link";
import type { Entry } from "@/lib/data";
import { Media } from "./Media";
import { badge } from "./button";

export const hrefFor = (e: Entry) => (e.kind === "website" ? `/website/${e.slug}` : `/feed/${e.slug}`);

export function FeedCard({ entry, eager = false }: { entry: Entry; eager?: boolean }) {
  return (
    <article className="group relative">
      <Link href={hrefFor(entry)} aria-label={`View ${entry.title}`} className="relative block overflow-hidden rounded-md bg-card ring-1 ring-line transition-[transform,box-shadow] duration-200 hover:ring-line-strong active:scale-[0.98]">
        <div className="relative w-full" style={{ aspectRatio: entry.ratio }}>
          <Media entry={entry} eager={eager} />
        </div>
        {entry.sponsored && <span className={badge("dark", "absolute right-2 bottom-2 px-2 py-0.5 text-[11px]")}>Sponsored</span>}
        <span className={badge("dark", "pointer-events-none absolute top-2 right-2 size-7 opacity-0 transition-opacity duration-150 group-hover:opacity-100")} title="Save">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>
        </span>
      </Link>
      <span className={badge("dark", "pointer-events-none absolute bottom-2 left-2 size-5 text-[9px] font-semibold uppercase")}>
        {entry.author.slice(0, 2)}
      </span>
    </article>
  );
}
