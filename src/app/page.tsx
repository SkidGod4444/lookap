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
import { TerminalReplay, type Script, type Step } from "@/components/TerminalReplay";

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

/* what the agent sees: calls and results copied from a real run on the production MCP (a fresh Opus session, no other
   source about the design, the tooltip thinking-mode entry, 23 Oct 2026); the prompt is the short form a person types,
   the run's own prompt was longer. The fix note lists what its round-1 judges failed. */
const PROMPT = "rebuild the lookap entry minimal-tooltip-thinking-mode as one html file";
const STEPS_RUN: Step[] = [
  { kind: "call", title: "lookap · get_brief", detail: "minimal-tooltip-thinking-mode", out: "46 checks to pass · 15 moments to render" },
  { kind: "call", title: "lookap · look_at", detail: "what: sheet", out: "the whole clip as one sheet, 48 frames" },
  { kind: "call", title: "lookap · look_at", detail: "what: zoom, at: 20.5", out: "the crop [90, 260, 520, 260] of the clip, full size" },
  { kind: "call", title: "lookap · look_at", detail: "what: colors, at: 20.5", out: "one hex per pixel along y=472, x 100 to 400" },
  { kind: "call", title: "Write", detail: "index.html", out: "every size in var(--u), the timeline as element.animate" },
  { kind: "call", title: "Bash", detail: "chrome --headless --screenshot", out: "15 moments rendered" },
  { kind: "call", title: "lookap · check_rebuild", detail: "upload token", out: "score 88 · your render changes where the clip changes" },
  { kind: "call", title: "lookap · judge_rebuild", detail: "round 1, 3 judges", out: "30 of 46 pass" },
  { kind: "note", title: "fixing what the judges failed first", out: "report file card, thinking stream text, header label, header timer, header status icon" },
  { kind: "call", title: "lookap · judge_rebuild", detail: "round 2, 3 judges", out: "37 of 46 pass · fix first: header status icon, header label" },
  { kind: "call", title: "lookap · judge_rebuild", detail: "round 3, 3 judges", out: "40 of 46 pass" },
];
/* a second real run: a fresh agent with only the lookap MCP, asked for something new (23 Oct 2026) */
const DESIGN_STEPS: Step[] = [
  { kind: "call", title: "lookap · list_notes", out: "the registry's design notes" },
  { kind: "call", title: "lookap · search_designs", detail: "query: pricing", out: "1 result: X Subscription Modal Design, three light cards" },
  { kind: "call", title: "lookap · search_designs", detail: "query: developer", out: "3 results: AI Model Router Dashboard and two more" },
  { kind: "call", title: "lookap · search_designs", detail: "query: Slider", out: "8 results" },
  { kind: "call", title: "lookap · see_design", detail: "ledger-fintech-dashboard-cards", out: "the frame, with its record" },
  { kind: "call", title: "lookap · see_design", detail: "minimal-dark-render-sliders", out: "the frame, with its record" },
  { kind: "call", title: "lookap · see_design", detail: "ai-model-router-dashboard", out: "the frame, with its record" },
  { kind: "call", title: "Write", detail: "index.html", out: "one self-contained file, no external fonts" },
  { kind: "call", title: "Bash", detail: "chrome --headless --screenshot", out: "5 screenshots, one per pricing state, fixed after each look" },
  { kind: "note", title: "borrowed, not copied", out: "the layer drawing and the single amber highlight from Ledger, the slider build from Render Sliders, a big price over one line of stats from Model Router" },
];

const SCRIPTS: Script[] = [
  { label: "Rebuild a design", prompt: PROMPT, steps: STEPS_RUN, caption: "A real run on the live MCP: a fresh agent with nothing else about the design, on the tooltip thinking-mode entry. The calls and results are the run's; the prompt is shortened. An independent judge scored the final file 41 of 46." },
  { label: "Design something new", prompt: "design a pricing section for a developer tool that doesn't look like three plain cards, use lookap for references", steps: DESIGN_STEPS, caption: "A real run on the live MCP: a fresh agent with only lookap for references. The calls and results are the run's; the prompt is shortened. Below is what it made: three sliders set one live price, and the plan picks itself on a drawing of stacked layers.", result: { src: "/home/design-pricing.webp", alt: "A dark pricing section: three sliders set a live price of $48 a month, beside a line drawing of four stacked tiers with Pro lit in amber", w: 1200, h: 833 } },
];

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

      {/* what the agent sees: the terminal of a real run, replayed */}
      <section className="grid gap-6 [contain-intrinsic-size:auto_520px] [content-visibility:auto] lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:items-start">
        <div className="flex max-w-[48ch] flex-col gap-3">
          <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">What your agent sees</h2>
          <p className="text-[14px] leading-[1.55] text-subtle">One prompt, then the agent does the rest. Asked to rebuild, it reads the checklist, measures the clip, checks its own render and fixes what fails, round after round. Asked for something new, it studies real references and borrows their principles, not their pixels. No screenshots pass through its context; they go up and down by link.</p>
        </div>
        <TerminalReplay scripts={SCRIPTS} />
      </section>

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
