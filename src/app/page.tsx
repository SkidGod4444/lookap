import Link from "next/link";
import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
import { CardSleeve } from "@/components/demo/CardSleeve";
import { RecipePeek } from "@/components/RecipePeek";
import { RECIPES, NOTES } from "@/lib/registry";
import { button } from "@/components/button";

export default function Home() {
  const feed = [...ENTRIES].sort((a, b) => Number(Boolean(b.video)) - Number(Boolean(a.video)));
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* hero */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-14">
        <div className="flex min-w-0 max-w-[52ch] flex-col gap-6">
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-foreground sm:text-[52px]">
            Interfaces, measured. Served to your agent.
          </h1>
          <p className="text-[14px] leading-[1.55] text-pretty text-subtle">
            lookap reads sizes, colours and timing from real interfaces and hands them to Claude Code, Codex or Cursor over MCP. Numbers from the pixels, not guesses from memory. Hover the card.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mcp" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              Connect your agent
            </Link>
            <Link href="/feed" className={button("outline", "h-10 rounded-full px-5 text-[14px]")}>Browse the feed</Link>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1 font-mono text-[12px] text-subtle">
            <div><dt className="text-silver-bright">{ENTRIES.filter((e) => !e.sponsored).length}</dt><dd>entries</dd></div>
            <div><dt className="text-silver-bright">{RECIPES.length}</dt><dd>measured recipes</dd></div>
            <div><dt className="text-silver-bright">{NOTES.length}</dt><dd>design notes</dd></div>
            <div><dt className="text-silver-bright">6</dt><dd>MCP tools</dd></div>
          </dl>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-line">
            <CardSleeve callouts />
          </div>
          <RecipePeek slug="id-card-reader-hover" />
        </div>
      </section>

      {/* the feed: demo clips play in cards shaped by their own aspect ratio; stills keep theirs */}
      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">Interfaces worth rebuilding</h2>
            <p className="mt-1 text-[14px] text-subtle">Everything here is in the registry.</p>
          </div>
          <Link href="/feed" className="shrink-0 text-[13px] font-medium text-subtle transition-colors hover:text-foreground">Open the feed →</Link>
        </div>
        <FeedGrid entries={feed} hero={false} />
      </section>
    </div>
  );
}
