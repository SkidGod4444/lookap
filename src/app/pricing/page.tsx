"use client";

import { Suspense, useState } from "react";
import { badge } from "@/components/button";
import { BuyButton } from "@/components/BuyButton";

const PLANS = [
  { id: "starter", name: "Starter key", blurb: "Your agent builds from sight: it sees the designer's frames and knows exactly what done looks like.", monthly: 1, yearly: 0.83, yearlyTotal: 10, runs: "50 tool calls a day", cta: "Start 7 days free", trial: "7 days free", trialNote: "Charged when the trial ends. Cancel before and pay nothing.", primary: false,
    features: ["Search the registry and find similar work", "Every record and rebuild brief", "The checklist each rebuild is judged against", "The designer's frames, 60 a month", "All design notes", "One key, any MCP client"] },
  { id: "pro", name: "Pro key", blurb: "Your agent measures the clip and proves its rebuild against it, round after round, until it matches.", monthly: 12, yearly: 10, yearlyTotal: 120, runs: "300 tool calls a day", cta: "Get a Pro key", primary: true, popular: true,
    features: ["Everything in Starter", "What moves, how far and how fast, read from the clip", "Exact colours and zoomed crops beside your render", "A pixel and motion score at every moment", "The checklist judged on crop pairs by your own model", "React, Tailwind and Motion guide: measured moves as Motion transitions", "Measured recipes as data", "Frames 500 a month, 50 results per search"] },
  { id: "team", name: "Max key", blurb: "Where a finished rebuild exists, your agent starts from it, already judged against the clip; where it does not, your request moves it up the queue.", monthly: 39, yearly: 32, yearlyTotal: 384, runs: "1,000 tool calls a day", cta: "Get a Max key", primary: false,
    features: ["Everything in Pro", "Every finished rebuild as HTML or as a React, Tailwind and Motion component, up to 100 a month", "Requests that move an entry ahead in the rebuild queue, 20 a month", "The highest allowance: 2,000 frames and reads", "100 results per search", "Invoiced billing"] },
];

const FAQ = [
  ["What is the registry?", "A curated set of interfaces, each with attribution, category and types, and for the ones we rebuilt, a recipe: palette, geometry, type and motion read from the source clip's pixels. Plus design notes distilled from that work."],
  ["What runs where?", "Your agent does the building on your machine. Our servers serve the registry, read the clip and compose the evidence; the judging runs on your agent's own model, so a check never waits on ours."],
  ["Is there a free trial?", "Starter opens with 7 days free. Your card is taken at checkout and charged only when the trial ends; cancel before then and you pay nothing. One trial per account."],
  ["What does each plan change in the result?", "Starter builds from the frames and a checklist, and checks by eye. Pro measures the clip and scores every moment, so the rebuild converges on the original instead of stopping at a guess. Max begins from a finished rebuild that already passed the checklist."],
  ["Why is there no free key?", "Curation and measurement are the work, and a dollar keeps the registry honest: every call comes from someone who chose to pay for it. Browsing the site stays free."],
  ["Can I change plans or stop?", "Upgrade or downgrade whenever you like and we only charge the difference for the days left. Stopping keeps the key working until your period ends."],
];

function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Pricing</h1>
        <p className="max-w-[52ch] text-sm text-pretty text-subtle">Browsing the site is free. A key, from a dollar a month, opens the registry to your agent over MCP.</p>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex gap-1 rounded-full bg-card p-1 ring-1 ring-line">
          {(["Monthly", "Yearly"] as const).map((l) => {
            const on = (l === "Yearly") === yearly;
            return (
              <button key={l} type="button" onClick={() => setYearly(l === "Yearly")} className={badge(on ? "active" : "chip", "h-8 gap-2 px-3.5 text-[13px]")}>
                {l}
                {l === "Yearly" && <span className={on ? "text-[11px] font-semibold text-black/60" : "text-[11px] font-semibold text-subtle"}>Save up to 20%</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className="flex min-w-0 flex-col overflow-hidden rounded-xl bg-card p-1 ring-1 ring-line">
            <div className="flex flex-col gap-1 px-4 pt-3 pb-4">
              <div className="flex items-start justify-between">
                <p className="text-base font-medium text-foreground sm:text-lg">{p.name}</p>
                {p.popular && <span className={badge("silver", "px-2 py-0.5 text-[11px]")}>Popular</span>}
              </div>
              <p className="line-clamp-2 min-h-[2lh] text-sm text-pretty text-subtle">{p.blurb}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-canvas p-4 ring-1 ring-line">
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-medium text-foreground tabular-nums md:text-4xl">${yearly ? p.yearly : p.monthly}</div>
                <span className="text-sm text-subtle">/ month</span>
              </div>
              <span className="mt-1 block text-sm text-subtle">{p.runs}<span className="block">{yearly ? `Billed $${p.yearlyTotal} yearly` : "Billed monthly"}</span></span>
              {"trial" in p && p.trial && (
                <div className="mt-3 flex min-w-0 flex-col gap-1.5">
                  <span className={badge("silver", "self-start px-2.5 py-0.5 text-[12px]")}>{p.trial}</span>
                  {"trialNote" in p && <span className="text-[12px] leading-[1.45] text-pretty text-subtle">{p.trialNote}</span>}
                </div>
              )}
              <div className="mt-5 mb-4 border-t border-line pt-2">
                {p.features.map((f) => (
                  <div key={f} className="my-4 flex items-start gap-2">
                    <span className={badge("silver", "mt-0.5 size-4 shrink-0")}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l5 5L20 7" /></svg>
                    </span>
                    <span className="text-sm font-medium text-pretty text-silver">{f}</span>
                  </div>
                ))}
              </div>
              <BuyButton plan={p.id} interval={yearly ? "year" : "month"} label={p.cta} primary={p.primary} className="mt-auto h-9 w-full rounded-lg text-[13px]" />
            </div>
          </div>
        ))}
      </div>

      <section className="grid w-full gap-6 border-t border-line pt-8 md:grid-cols-[200px_1fr]">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Questions</h2>
        <dl className="-mt-4 divide-y divide-line">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="text-sm font-medium text-foreground">{q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-subtle">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Pricing /></Suspense>;
}
