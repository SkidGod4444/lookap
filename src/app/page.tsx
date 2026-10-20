import Link from "next/link";
import { ENTRIES } from "@/lib/data";
import { FeedCard } from "@/components/FeedCard";
import { CardSleeve } from "@/components/demo/CardSleeve";
import { badge, button } from "@/components/button";

const STEPS = [
  { n: "01", title: "Frames", body: "The clip is split at 2 fps, plus full-resolution stills of every resting state." },
  { n: "02", title: "Measure", body: "Sizes, radii, colours and light falloff are read from pixels, not described from memory." },
  { n: "03", title: "Time, or give motion", body: "From a clip, a brightness trace gives every transition its real duration. From a still, the agent proposes enter, hover and press motion for you to accept or change." },
  { n: "04", title: "Render, compare, fix", body: "The build is screenshotted beside the source frame and corrected until they match." },
];

const PLANS = [
  { name: "Free", price: "$0", line: "Bring your own agent. Unlimited local clones." },
  { name: "Pro", price: "$10", line: "Full gallery, saved library, 30 hosted clones a month.", hot: true },
  { name: "Team", price: "$32", line: "Shared library, tokens to your repo, 100 clones per seat." },
];

export default function Home() {
  const preview = ENTRIES.filter((e) => !e.sponsored).slice(0, 6);
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* hero */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-14">
        <div className="flex max-w-[52ch] flex-col gap-6">
          <span className={badge("chip", "w-fit px-2.5 py-1 text-[11px] tracking-[.06em] uppercase")}>Measured, not guessed</span>
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-foreground sm:text-[52px]">
            Rebuild any interface from a screenshot or a demo video.
          </h1>
          <p className="text-[16px] leading-relaxed text-pretty text-subtle">
            Paste a screenshot, a UI clip or a screen recording. lookap checks that there is an interface in it, measures sizes, colours and type from the pixels, takes motion from the clip or proposes it for a still, and hands you the component as code. The card on the right came out of a six-second clip.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/clone" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              Clone a video
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

      {/* how it works */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[24px] leading-tight font-medium tracking-[-0.02em] text-foreground">How a clone is made</h2>
          <span className="font-mono text-[12px] text-subtle">four steps, all local</span>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-line">
              <span className="font-mono text-[12px] text-subtle">{s.n}</span>
              <h3 className="text-[15px] font-medium text-foreground">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-subtle">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* feed preview */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] leading-tight font-medium tracking-[-0.02em] text-foreground">Interfaces worth rebuilding</h2>
            <p className="mt-1 text-[14px] text-subtle">A hand-picked feed. Every entry can be cloned from its clip.</p>
          </div>
          <Link href="/feed" className={button("outline", "h-8 shrink-0 rounded-full px-3.5 text-[13px]")}>Open the feed →</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {preview.map((e) => <FeedCard key={e.slug} entry={{ ...e, ratio: 1 }} />)}
        </div>
      </section>

      {/* pricing teaser */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[24px] leading-tight font-medium tracking-[-0.02em] text-foreground">The pipeline is free. The library is not.</h2>
          <Link href="/pricing" className="text-[13px] font-medium text-subtle hover:text-foreground">Full pricing →</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex items-center justify-between gap-4 rounded-xl p-5 ring-1 ${p.hot ? "bg-card ring-line-strong" : "bg-canvas ring-line"}`}>
              <div>
                <p className="text-[15px] font-medium text-foreground">{p.name}</p>
                <p className="mt-1 text-[13px] text-subtle">{p.line}</p>
              </div>
              <span className="text-right font-mono text-[20px] text-silver-bright tabular-nums">{p.price}<span className="block text-[10px] text-subtle">{p.price === "$0" ? "forever" : "/ mo, billed yearly"}</span></span>
            </div>
          ))}
        </div>
      </section>

      {/* closing */}
      <section className="flex flex-col items-center gap-5 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-line">
        <h2 className="text-[28px] leading-tight font-medium tracking-[-0.02em] text-balance text-foreground">Clone your first video today.</h2>
        <p className="max-w-[48ch] text-[14px] text-subtle">Install the open skill, paste a link, and get the measurements and the component back.</p>
        <Link href="/clone" className={button("silver", "h-10 rounded-full px-5 text-[14px]")}>Clone a video</Link>
      </section>
    </div>
  );
}
