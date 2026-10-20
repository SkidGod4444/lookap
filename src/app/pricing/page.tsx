"use client";

import Link from "next/link";
import { useState } from "react";
import { badge, button } from "@/components/button";

const PLANS = [
  { name: "Free", blurb: "Browse the feed. Connect without a key and see a sample of the registry.", monthly: 0, yearly: 0, runs: "5 results per search, first note", cta: "Browse the feed", primary: false,
    features: ["Full feed on the site", "MCP: search_designs, list_notes", "No key needed"] },
  { name: "Pro key", blurb: "The whole registry inside your agent: every entry, every recipe, media checks.", monthly: 12, yearly: 10, runs: "Unlimited registry reads", cta: "Get a Pro key", primary: true, popular: true,
    features: ["All search results and notes", "Measured recipes with motion tables", "check_media on any public clip or still", "One key, any MCP client"] },
  { name: "Team key", blurb: "For studios that want shared collections and private entries.", monthly: 39, yearly: 32, runs: "Per seat", cta: "Start a team", primary: false,
    features: ["Everything in Pro", "Shared collections and private entries", "Priority on new recipes", "Invoiced billing"] },
];

const FAQ = [
  ["What is the registry?", "A curated set of interfaces, each with attribution, category and types, and for the ones we rebuilt, a recipe: palette, geometry, type and motion read from the source clip's pixels. Plus design notes distilled from that work."],
  ["What runs where?", "Nothing runs on our servers except the lookup. Your agent calls the registry over MCP and does the building on your machine."],
  ["Why charge for a key?", "Curation and measurement are the work. The free tier shows the shape of the data; the key opens all of it."],
  ["Can I change plans or stop?", "Upgrade or downgrade whenever you like and we only charge the difference for the days left. Stopping keeps the key working until your period ends, then it drops to Free."],
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Pricing</h1>
        <p className="max-w-[52ch] text-sm text-pretty text-subtle">Browsing is free. A key opens the whole registry to your agent over MCP.</p>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex gap-1 rounded-full bg-card p-1 ring-1 ring-line">
          {(["Monthly", "Yearly"] as const).map((l) => {
            const on = (l === "Yearly") === yearly;
            return (
              <button key={l} type="button" onClick={() => setYearly(l === "Yearly")} className={badge(on ? "active" : "chip", "h-8 gap-2 px-3.5 text-[13px]")}>
                {l}
                {l === "Yearly" && <span className={on ? "text-[11px] font-semibold text-black/60" : "text-[11px] font-semibold text-subtle"}>Save 20%</span>}
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
              <span className="mt-1 block text-sm text-subtle">{p.runs}<span className="block">{p.monthly ? (yearly ? `Billed $${p.yearly * 12} yearly` : "Billed monthly") : "No key needed"}</span></span>
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
              {p.monthly === 0 ? <Link href="/feed" className="mt-auto inline-flex h-9 items-center justify-center text-[13px] font-medium text-subtle transition-colors hover:text-foreground">{p.cta} →</Link> : <button type="button" className={button(p.primary ? "silver" : "outline", "mt-auto h-9 w-full rounded-lg text-[13px]")}>{p.cta}</button>}
            </div>
          </div>
        ))}
      </div>

      <section className="w-full max-w-[640px]">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Questions</h2>
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
