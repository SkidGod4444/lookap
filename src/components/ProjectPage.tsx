import { badge, button, noScrollbar } from "@/components/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, bySlug, sectionSlug } from "@/lib/data";
import { Poster } from "./Poster";
import { hrefFor } from "./FeedCard";

export function ProjectPage({ slug }: { slug: string }) {
  const entry = bySlug(slug);
  if (!entry) notFound();
  const similar = ENTRIES.filter((e) => e.slug !== entry.slug && (e.category === entry.category || e.kind === entry.kind)).slice(0, 6);
  const wide = entry.ratio >= 1;

  return (
    <div className="-mx-4 -mt-4 -mb-4 flex min-h-[calc(100vh-44px)] flex-1">
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gutter p-10">
        <div className="relative w-full overflow-hidden rounded-[5px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-line-strong" style={{ maxWidth: wide ? 900 : 420, aspectRatio: entry.ratio }}>
          <Poster entry={entry} />
        </div>
      </div>

      <aside className={`${noScrollbar} w-[240px] shrink-0 overflow-y-auto border-l border-line bg-canvas px-5 pt-6 pb-10 2xl:w-[280px]`}>
        <div className="flex min-h-full flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={badge("dark", "size-5 text-[9px] font-semibold uppercase")}>{entry.author.slice(0, 2)}</span>
              <span className="flex gap-1.5">
                <button type="button" aria-label="Save" className={button("outline", "size-7 rounded-full")}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg></button>
                <button type="button" aria-label="Share" className={button("outline", "size-7 rounded-full")}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M4 14v6h16v-6" /></svg></button>
              </span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-balance text-foreground 2xl:text-lg">{entry.title}</h1>
            <p className="text-xs leading-relaxed text-pretty text-subtle 2xl:text-sm">{entry.description}</p>
          </header>

          <a href={entry.site ? `https://${entry.site}` : "https://x.com"} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
            {entry.site ? "Visit site" : "Open on X"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </a>

          <div className="flex flex-col divide-y divide-dashed divide-line-strong [&>*]:py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-foreground 2xl:text-sm">Category</p>
              <Link href={`/sections/${sectionSlug(entry.category)}`} className="text-xs text-subtle underline-offset-2 hover:text-foreground hover:underline 2xl:text-sm">{entry.category}</Link>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-foreground 2xl:text-sm">Type</p>
              <ul className="flex flex-col items-end gap-0.5 text-right text-xs text-subtle 2xl:text-sm">{entry.types.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" className={button("outline", "h-8 justify-between rounded-lg px-3 text-[13px]")}>Add to moodboard</button>
            <button type="button" className={button("outline", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
              Clone from video
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
            </button>
          </div>

          <section className="rounded-xl bg-card p-1 ring-1 ring-line">
            <h2 className="px-2 pt-1.5 pb-2 text-xs font-medium text-foreground 2xl:text-sm">Similar designs</h2>
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line">
              {similar.map((s) => (
                <li key={s.slug} className="min-w-0 bg-canvas">
                  <Link href={hrefFor(s)} className="group/similar block"><span className="relative block aspect-[4/3] overflow-hidden"><Poster entry={s} compact className="transition-transform duration-200 group-hover/similar:scale-[1.03]" /></span></Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-auto text-[11px] text-subtle/70">Questions? hello@lookap.app</p>
        </div>
      </aside>
    </div>
  );
}
