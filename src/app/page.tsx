import Link from "next/link";
import { ENTRIES, bySlug } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
import { CardSleeve } from "@/components/demo/CardSleeve";
import { TOOLS } from "@/lib/registry";
import { RUBRICS } from "@/lib/rubrics";
import { FACTORY, REBUILD_SLUGS } from "@/lib/rebuilds";
import { button } from "@/components/button";
import { RebuildShowcase, type Showcase } from "@/components/RebuildShowcase";
import { HeroCarousel } from "@/components/HeroCarousel";

/* every factory rebuild that has a recording, straight from the packed rebuilds: a new one appears here when it ships */
function showcase(): Showcase[] {
  return Object.keys(FACTORY).flatMap((slug) => {
    const rb = FACTORY[slug], e = bySlug(slug);
    if (!rb?.preview || !e?.video) return [];
    const m = (rb.build.hand ?? "").match(/rubric (\d+) of (\d+)/);
    const result = m ? `${m[1]} of ${m[2]} checks pass` : "measured from the clip";
    return [{ slug, title: e.title, author: e.authorName, clip: e.video.src, poster: e.poster, rebuild: rb.preview, ratio: rb.frame.w / rb.frame.h, clipRatio: e.ratio, result }];
  });
}

export default function Home() {
  /* the home feed is a taste: two dozen cards, clips first; the full catalog is one click away at /feed */
  const feed = [...ENTRIES].sort((a, b) => Number(Boolean(b.video)) - Number(Boolean(a.video))).slice(0, 24);
  const items = showcase();
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* hero */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-14">
        <div className="flex min-w-0 max-w-[52ch] flex-col gap-6">
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-foreground sm:text-[52px]">
            Give your coding agent good taste in UI.
          </h1>
          <p className="text-[15px] leading-[1.55] text-pretty text-subtle">
            lookap is a registry of real interfaces your agent can rebuild. It measures each designer&apos;s clip, hands your agent a checklist of what makes it right, and lets the agent check its own work until it matches. Works over MCP in Claude Code, Codex, Cursor, VS Code and Gemini CLI. Keys from a dollar a month.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mcp" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              Connect your agent
            </Link>
            <a href="#rebuilt" className={button("outline", "h-10 rounded-full px-5 text-[14px]")}>See what it builds</a>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 pt-1 font-mono text-[12px] text-subtle sm:flex sm:flex-wrap sm:gap-y-2">
            <div><dt className="text-silver-bright">{ENTRIES.filter((e) => !e.sponsored).length}</dt><dd>interfaces</dd></div>
            <div><dt className="text-silver-bright">{Object.keys(RUBRICS).length}</dt><dd>checklists</dd></div>
            <div><dt className="text-silver-bright">{REBUILD_SLUGS().length}</dt><dd>finished rebuilds</dd></div>
            <div><dt className="text-silver-bright">{TOOLS.length}</dt><dd>MCP tools</dd></div>
          </dl>
        </div>
        <HeroCarousel first={<CardSleeve callouts />} firstLabel="ID card reader, rebuilt from its clip" slides={items.map((x) => ({ slug: x.slug, title: x.title, video: x.rebuild, ratio: x.ratio, result: x.result }))} />
      </section>

      {/* the proof: the designer's clip beside the rebuild */}
      {items.length > 0 && (
        <section id="rebuilt" className="flex scroll-mt-20 flex-col gap-5">
          <div className="max-w-[62ch]">
            <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">The clip, and what an agent built from it</h2>
            <p className="mt-1 text-[14px] leading-[1.55] text-subtle">Left is the designer&apos;s own video. Right is a rebuild made by an agent working from lookap: one HTML file, every size and every timing read from the clip, judged against its checklist.</p>
          </div>
          <RebuildShowcase items={items} />
        </section>
      )}

      {/* the feed: demo clips play in cards shaped by their own aspect ratio; stills keep theirs */}
      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">Interfaces worth rebuilding</h2>
            <p className="mt-1 text-[14px] text-subtle">Everything here is in the registry. The ones marked Rebuilt you can play with.</p>
          </div>
          <Link href="/feed" className="shrink-0 text-[13px] font-medium text-subtle transition-colors hover:text-foreground">Open the feed →</Link>
        </div>
        <FeedGrid entries={feed} hero={false} />
      </section>
    </div>
  );
}
