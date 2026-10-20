"use client";

import { useState } from "react";
import { badge, button } from "@/components/button";

const PLANS = [
  { name: "Free", blurb: "Bring your own agent. The clone pipeline runs on your machine.", monthly: 0, yearly: 0, runs: "Unlimited local clones", cta: "Install the skill", primary: false,
    features: ["Open-source clone pipeline", "20 gallery entries a day", "Clone any video or URL you already have"] },
  { name: "Pro", blurb: "The full gallery, a saved library, and clones we run for you.", monthly: 12, yearly: 10, runs: "30 hosted clones a month", cta: "Go Pro", primary: true, popular: true,
    features: ["Full gallery, search and tags", "Unlimited saves and moodboards", "Hosted clone runs, no agent needed", "Private sharing links"] },
  { name: "Team", blurb: "A shared library for studios cloning for many clients.", monthly: 39, yearly: 32, runs: "100 hosted clones a month per seat", cta: "Start a team", primary: false,
    features: ["Everything in Pro", "Shared library and moodboards", "Design tokens exported to your repo", "Priority queue"] },
];

const FAQ = [
  ["What runs locally and what runs hosted?", "The clone pipeline is an open skill. Frame extraction, pixel measurement and the render check all run on your machine inside your own agent. Hosted runs do the same work on our servers for people without an agent."],
  ["Why is the gallery limited on Free?", "Curation is the part that costs us time. Twenty entries a day is enough to taste it. The pipeline itself is never limited."],
  ["What is a clone?", "A working component rebuilt from a demo video or a live page, with sizes, colours and motion timing measured from the source instead of guessed."],
  ["Can I change plans or stop?", "Upgrade or downgrade whenever you like and we only charge the difference for the days left. Stopping keeps everything working until your current period runs out, then the account drops to Free."],
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <div className="mx-auto flex w-full max-w-[940px] flex-col gap-8 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] font-medium tracking-[-0.02em] text-foreground">Pricing</h1>
        <p className="max-w-[52ch] text-sm text-pretty text-subtle">The clone pipeline is free and open. You pay for the gallery, a saved library, and clones we run for you.</p>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-card p-1 ring-1 ring-line">
          {(["Monthly", "Yearly"] as const).map((l) => {
            const on = (l === "Yearly") === yearly;
            return (
              <button key={l} type="button" onClick={() => setYearly(l === "Yearly")} className={on ? button("silver", "h-9 gap-2 rounded-lg px-4 text-sm") : "relative flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-subtle outline-none transition-colors hover:text-foreground"}>
                {l}
                {l === "Yearly" && <span className={badge(on ? "dark" : "dark", "h-5 px-2 text-[11px] font-semibold")}>Save 20%</span>}
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
              <span className="mt-1 block text-sm text-subtle">{p.runs}<span className="block">{p.monthly ? (yearly ? `Billed $${p.yearly * 12} yearly` : "Billed monthly") : "No card needed"}</span></span>
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
              <button type="button" className={button(p.primary ? "silver" : "outline", "mt-auto h-9 w-full rounded-lg text-sm")}>{p.cta}</button>
            </div>
          </div>
        ))}
      </div>

      <section className="mx-auto w-full max-w-[520px] pt-6">
        <h2 className="text-sm font-medium text-foreground">Questions</h2>
        <dl className="mt-4 divide-y divide-line">
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
