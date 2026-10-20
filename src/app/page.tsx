import Link from "next/link";
import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
import { CardSleeve } from "@/components/demo/CardSleeve";
import { button } from "@/components/button";

export default function Home() {
  const feed = [...ENTRIES].sort((a, b) => Number(Boolean(b.video)) - Number(Boolean(a.video)));
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* hero */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-14">
        <div className="flex max-w-[52ch] flex-col gap-6">
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-foreground sm:text-[52px]">
            Design knowledge your agent can use.
          </h1>
          <p className="text-[16px] leading-relaxed text-pretty text-subtle">
            A curated registry of interfaces, measured from their clips and stills, served to your coding agent over MCP. Hover the card.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mcp" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              Connect your agent
            </Link>
            <Link href="/feed" className={button("outline", "h-10 rounded-full px-5 text-[14px]")}>Browse the feed</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-line">
          <CardSleeve />
        </div>
      </section>

      {/* the feed: demo clips play in cards shaped by their own aspect ratio; stills keep theirs */}
      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] leading-tight font-medium tracking-[-0.02em] text-foreground">Interfaces worth rebuilding</h2>
            <p className="mt-1 text-[14px] text-subtle">Everything here is in the registry.</p>
          </div>
          <Link href="/feed" className={button("outline", "h-8 shrink-0 rounded-full px-3.5 text-[13px]")}>Open the feed →</Link>
        </div>
        <FeedGrid entries={feed} hero={false} />
      </section>
    </div>
  );
}
