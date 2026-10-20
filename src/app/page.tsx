import Link from "next/link";
import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
import { CardSleeve } from "@/components/demo/CardSleeve";
import { badge, button } from "@/components/button";

export default function Home() {
  const feed = [...ENTRIES].sort((a, b) => Number(Boolean(b.video)) - Number(Boolean(a.video)));
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* hero */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-14">
        <div className="flex max-w-[52ch] flex-col gap-6">
          <span className={badge("chip", "w-fit px-2.5 py-1 text-[11px] tracking-[.06em] uppercase")}>Measured, not guessed · MCP registry</span>
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-foreground sm:text-[52px]">
            Design knowledge your agent can use.
          </h1>
          <p className="text-[16px] leading-relaxed text-pretty text-subtle">
            A curated registry of interfaces, each measured from its clip or still, served to Claude Code, Codex and Cursor over MCP. Browse free. Connect your agent with a key and it builds from what we have measured, not from memory. The card on the right came out of a six-second clip this way.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mcp" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              Connect your agent
            </Link>
            <Link href="/feed" className={button("outline", "h-10 rounded-full px-5 text-[14px]")}>Browse the feed</Link>
          </div>
          <dl className="flex gap-8 pt-2 font-mono text-[12px] text-subtle">
            {/* figures from the card clone's DESIGN.md: 5.85 s clip, 13 palette entries sampled, 7 motion phases timed */}
            <div><dt className="text-silver-bright">6 s</dt><dd>source clip</dd></div>
            <div><dt className="text-silver-bright">13</dt><dd>colours sampled</dd></div>
            <div><dt className="text-silver-bright">7</dt><dd>motion phases timed</dd></div>
          </dl>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-line">
          <CardSleeve />
          <span className={badge("dark", "absolute top-3 left-3 px-2 py-0.5 text-[11px]")}>live clone · hover it</span>
          <span className={badge("dark", "absolute right-3 bottom-3 px-2 py-0.5 font-mono text-[11px]")}>1080 × 1080 · 60 fps source</span>
        </div>
      </section>

      {/* the feed: demo clips play in cards shaped by their own aspect ratio; stills keep theirs */}
      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] leading-tight font-medium tracking-[-0.02em] text-foreground">Interfaces worth rebuilding</h2>
            <p className="mt-1 text-[14px] text-subtle">Every entry is in the registry. Your agent can search it, read the recipe, and build.</p>
          </div>
          <Link href="/feed" className={button("outline", "h-8 shrink-0 rounded-full px-3.5 text-[13px]")}>Open the feed →</Link>
        </div>
        <FeedGrid entries={feed} hero={false} />
      </section>
    </div>
  );
}
