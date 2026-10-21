import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, bySlug, sectionSlug } from "@/lib/data";
import { Media, STAGE_SIZES, TILE_SIZES } from "./Media";
import { Avatar } from "./Avatar";
import { SaveButton } from "./SaveButton";
import { avatarUrl } from "@/lib/avatar";
import { preload } from "react-dom";
import { hrefFor } from "./FeedCard";
import { button } from "./button";
import { LockScroll } from "./LockScroll";
import { Stage } from "./Stage";

export function ProjectPage({ slug }: { slug: string }) {
  const entry = bySlug(slug);
  if (!entry) notFound();
  const similar = ENTRIES.filter((e) => e.slug !== entry.slug && (e.category === entry.category || e.kind === entry.kind)).slice(0, 6);
  const wide = entry.ratio >= 1;
  const site = entry.site && entry.site !== "example.com" ? `https://${entry.site}` : null;
  /* the credit's picture starts loading from the document head, before any script runs */
  if (entry.x) preload(avatarUrl(entry.x), { as: "image" });

  return (
    /* on large screens the page does not scroll: the stage is fixed and only the panel scrolls */
    <div className="-mx-4 -mt-4 -mb-4 flex flex-1 flex-col lg:h-[calc(100vh_-_57px)] lg:flex-none lg:flex-row lg:overflow-hidden">
      <LockScroll />
      <Stage>
        <div className="relative w-full cursor-default overflow-hidden rounded-[5px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-line-strong" style={{ maxWidth: wide ? 900 : 420, aspectRatio: entry.ratio }}>
          <Media entry={entry} sizes={STAGE_SIZES} eager />
        </div>
      </Stage>

      <aside className="w-full shrink-0 border-t border-line bg-canvas px-5 pt-6 pb-10 lg:h-full lg:w-[280px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex min-h-full flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-balance text-foreground">{entry.title}</h1>
              <SaveButton slug={entry.slug} label className="relative shrink-0" />
            </div>
            <p className="text-[14px] leading-[1.55] text-pretty text-subtle">{entry.description}</p>
          </header>

          {/* credit: links out only when we hold a verified handle or it is our own work; samples say so */}
          {entry.x || entry.sourceUrl ? (
            <a href={entry.x ? `https://x.com/${entry.x}` : entry.sourceUrl} className="group flex items-center gap-2.5">
              <Avatar name={entry.authorName} x={entry.x} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground group-hover:underline underline-offset-2">{entry.authorName}</span>
                <span className="block truncate text-[12px] text-subtle">{entry.x ? `@${entry.x}` : "source"}</span>
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar name={entry.authorName} x={entry.x} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{entry.authorName}</span>
                <span className="block truncate text-[12px] text-subtle">{entry.authorName === "lookap" ? "Built and measured by lookap." : "Sample entry. Real credits link to the designer."}</span>
              </span>
            </div>
          )}

          {(entry.x || site || entry.sourceUrl) && (
            <a href={entry.sourceUrl ?? (entry.x ? `https://x.com/${entry.x}` : site!)} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
              {entry.sourceUrl?.includes("x.com/") ? "Open post on X" : entry.x ? "Open on X" : site ? "Visit site" : "View source"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
          )}

          <dl className="flex flex-col divide-y divide-dashed divide-line-strong [&>*]:flex [&>*]:items-start [&>*]:justify-between [&>*]:gap-3 [&>*]:py-2.5 text-[12px]">
            <div><dt className="font-medium text-foreground">Category</dt><dd><Link href={`/sections/${sectionSlug(entry.category)}`} className="text-subtle underline-offset-2 hover:text-foreground hover:underline">{entry.category}</Link></dd></div>
            <div><dt className="font-medium text-foreground">Type</dt><dd className="text-right text-subtle">{entry.types.join(", ")}</dd></div>
            <div><dt className="font-medium text-foreground">Media</dt><dd className="text-subtle">{entry.video ? (entry.duration ? `clip · ${entry.duration}s` : "clip") : "still"}</dd></div>
          </dl>

          <section>
            <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">More like this</h2>
            <ul className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line lg:grid-cols-2">
              {similar.map((s) => (
                <li key={s.slug} className="min-w-0 bg-canvas">
                  <Link href={hrefFor(s)} className="block"><span className="relative block aspect-[4/3] overflow-hidden"><Media entry={s} sizes={TILE_SIZES} compact /></span></Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
