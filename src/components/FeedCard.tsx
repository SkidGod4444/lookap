import Link from "next/link";
import type { Entry } from "@/lib/data";
import { Media } from "./Media";
import { badge } from "./button";
import { SaveButton } from "./SaveButton";

export const hrefFor = (e: Entry) => (e.kind === "website" ? `/website/${e.slug}` : `/feed/${e.slug}`);

export function FeedCard({ entry, eager = false }: { entry: Entry; eager?: boolean }) {
  return (
    <article className="group relative">
      <Link href={hrefFor(entry)} aria-label={`View ${entry.title}`} className="relative block overflow-hidden rounded-md bg-card ring-1 ring-line transition-[transform,box-shadow] duration-200 hover:ring-line-strong active:scale-[0.98]">
        <div className="relative w-full" style={{ aspectRatio: entry.ratio }}>
          <Media entry={entry} eager={eager} />
        </div>
        {entry.sponsored && <span className={badge("dark", "absolute right-2 bottom-2 px-2 py-0.5 text-[11px]")}>Sponsored</span>}
      </Link>
      {/* the bookmark sits beside the link, not inside it: it is its own control. Hidden until hover on fine pointers, always there on touch and once saved. */}
      <SaveButton slug={entry.slug} className="absolute top-2 right-2 z-[2] opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 has-[[aria-pressed=true]]:opacity-100 [@media(pointer:coarse)]:opacity-100" />
      <span className={badge("dark", "pointer-events-none absolute bottom-2 left-2 size-5 text-[9px] font-semibold uppercase")}>
        {entry.author.slice(0, 2)}
      </span>
    </article>
  );
}
