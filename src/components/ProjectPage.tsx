import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, bySlug, sectionSlug } from "@/lib/data";
import { Poster } from "./Poster";
import { hrefFor } from "./FeedCard";
import { button } from "./button";
import { CopySlug } from "./CopySlug";

export function ProjectPage({ slug }: { slug: string }) {
  const entry = bySlug(slug);
  if (!entry) notFound();
  const similar = ENTRIES.filter((e) => e.slug !== entry.slug && (e.category === entry.category || e.kind === entry.kind)).slice(0, 6);
  const wide = entry.ratio >= 1;
  const site = entry.site && entry.site !== "example.com" ? `https://${entry.site}` : null;

  return (
    <div className="-mx-4 -mt-4 -mb-4 flex min-h-[calc(100vh-56px)] flex-1 flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gutter p-6 sm:p-10">
        <div className="relative w-full overflow-hidden rounded-[5px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-line-strong" style={{ maxWidth: wide ? 900 : 420, aspectRatio: entry.ratio }}>
          {entry.video ? (
            <video className="absolute inset-0 h-full w-full object-cover" src={entry.video.src} poster={entry.video.poster} autoPlay muted loop playsInline />
          ) : (
            <Poster entry={entry} />
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 border-t border-line bg-canvas px-5 pt-6 pb-10 lg:w-[280px] lg:border-t-0 lg:border-l">
        <div className="flex min-h-full flex-col gap-5">
          <header className="flex flex-col gap-2">
            <span className="text-[12px] text-subtle">@{entry.author}</span>
            <h1 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-balance text-foreground">{entry.title}</h1>
            <p className="text-[14px] leading-[1.55] text-pretty text-subtle">{entry.description}</p>
          </header>

          {site && (
            <a href={site} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
              Visit site
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
          )}

          <dl className="flex flex-col divide-y divide-dashed divide-line-strong [&>*]:flex [&>*]:items-start [&>*]:justify-between [&>*]:gap-3 [&>*]:py-2.5 text-[12px]">
            <div><dt className="font-medium text-foreground">Category</dt><dd><Link href={`/sections/${sectionSlug(entry.category)}`} className="text-subtle underline-offset-2 hover:text-foreground hover:underline">{entry.category}</Link></dd></div>
            <div><dt className="font-medium text-foreground">Type</dt><dd className="text-right text-subtle">{entry.types.join(", ")}</dd></div>
            <div><dt className="font-medium text-foreground">Media</dt><dd className="text-subtle">{entry.video ? `clip · ${entry.duration}s` : "still"}</dd></div>
          </dl>

          <div className="rounded-xl bg-card p-3 ring-1 ring-line">
            <p className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">In the registry</p>
            <p className="mt-1 text-[12px] text-subtle">Your agent can fetch this entry over MCP.</p>
            <CopySlug slug={entry.slug} />
          </div>

          <section>
            <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">More like this</h2>
            <ul className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line lg:grid-cols-2">
              {similar.map((s) => (
                <li key={s.slug} className="min-w-0 bg-canvas">
                  <Link href={hrefFor(s)} className="block"><span className="relative block aspect-[4/3] overflow-hidden"><Poster entry={s} compact /></span></Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
