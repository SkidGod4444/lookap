"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { button } from "./button";

/* "Analyze with your agent": the post handed to the reader's coding agent through MCP. One button opens three prompts
   for this entry, each a line the agent can run with lookap's tools; a tap on a line copies it. The agent does the
   analysis, not the site, so the prompts name the tools and the slug and nothing else. */
function prompts(slug: string, title: string, measured: boolean) {
  return [
    { label: "Analyze", text: `Use lookap: call get_design and get_brief for "${slug}" (${title}) and tell me what makes it work: layout, hierarchy, palette, motion. A short list, with the values you were given.` },
    { label: "Rebuild here", text: measured
      ? `Rebuild lookap entry "${slug}" in this project. Call get_design, then get_recipe and treat every value in it as measured fact. Build it with this stack, then compare with the frame and fix the three largest differences.`
      : `Rebuild lookap entry "${slug}" in this project. Call get_design and get_brief, treat the brief's motion as proposed and say so in a comment. Build it with this stack, then compare with the frame and fix the three largest differences.` },
    { label: "Find similar", text: `Call lookap similar_designs for "${slug}" and show me the three closest entries with what they share and where they differ.` },
  ];
}

function Line({ label, text }: { label: string; text: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    window.setTimeout(() => setState("idle"), 1600);
  };
  return (
    <li>
      <button type="button" onClick={() => void copy()} className="sfx-badge group flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left outline-none hover:bg-white/[.03] focus-visible:bg-white/[.04]" aria-live="polite">
        <span className="flex items-center justify-between gap-3 text-[12px]">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-subtle group-hover:text-foreground">{state === "done" ? "Copied" : state === "fail" ? "Select and copy" : "Copy"}</span>
        </span>
        <span className="text-[12px] leading-[1.5] text-subtle">{text}</span>
      </button>
    </li>
  );
}

/* Signed out: the click goes to sign-in and comes back here. Signed in without a plan: the panel asks for one, since the
   prompts only work with a key. Paid: the prompts. The plan is fetched on the first click, not on every page view. */
export function AgentPrompts({ slug, title, measured }: { slug: string; title: string; measured: boolean }) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"loading" | "none" | "paid">("loading");
  const { isSignedIn } = useUser();
  const router = useRouter();
  const toggle = async () => {
    if (!isSignedIn) { const path = window.location.pathname; router.push(`${path}?signin=1&next=${encodeURIComponent(path)}`); return; }
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (plan === "loading") {
      try { const d = await (await fetch("/api/me")).json(); setPlan(d.plan && d.plan !== "none" ? "paid" : "none"); } catch { setPlan("none"); }
    }
  };
  return (
    <section className="flex flex-col gap-2">
      <button type="button" onClick={() => void toggle()} aria-expanded={open} className={button("outline", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
        Analyze with your agent
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && plan === "loading" && <p className="text-[12px] text-subtle">Checking your plan…</p>}
      {open && plan === "none" && (
        <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-line">
          <p className="text-[12px] leading-[1.5] text-foreground">Your agent needs a lookap key to run these.</p>
          <p className="text-[12px] leading-[1.5] text-subtle">Starter is $1 a month and opens search, briefs and notes. Pro adds the measured recipes, keyframes and the rebuild check.</p>
          <Link href="/pricing" className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>See plans</Link>
        </div>
      )}
      {open && plan === "paid" && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-[1.5] text-subtle">Paste one of these into Claude Code, Cursor, Codex or any agent with lookap connected.</p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg bg-card ring-1 ring-line">
            {prompts(slug, title, measured).map((p) => <Line key={p.label} {...p} />)}
          </ul>
          <p className="text-[12px] text-subtle">Not connected yet? <Link href="/mcp" className="text-foreground underline underline-offset-2">One command sets it up.</Link></p>
        </div>
      )}
    </section>
  );
}
