"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { button } from "./button";

/* What a reader hands to their coding agent from an entry page. "Clone with your agent" copies one prompt that runs the
   whole rebuild loop on lookap's tools, written for the reader's plan (Starter builds from the frames and the
   checklist, Pro measures and judges, Max starts from the finished file) and their stack (HTML, or React + Tailwind +
   Motion). "More with your agent" opens shorter prompts: what makes it work, similar designs, something new in its
   spirit. The agent does the work; the prompts name the tools and the slug. */
type Plan = "starter" | "pro" | "team";
type Stack = "html" | "react";

function clonePrompt(slug: string, title: string, plan: Plan, stack: Stack, rebuilt: boolean, react: boolean) {
  const target = stack === "react" ? "a React component in this project, styled with Tailwind and animated with Motion (motion/react)" : "this project, with its own stack";
  const brief = `get_brief for ${slug}${stack === "react" ? " with stack react" : ""}`;
  if (plan === "team" && rebuilt) {
    return `Using lookap, clone "${title}" (${slug}) into ${target}. Call get_rebuild for ${slug}${stack === "react" && react ? " with stack react, which returns the finished component" : ""}: it is already judged against the designer's clip, so port it keeping every number, the --u unit and the timings. Then render it at the brief's moments (${brief} lists them), run check_rebuild with an upload token, and fix anything that drifted. Keep the designer's credit in the file.`;
  }
  if (plan === "starter") {
    return `Using lookap, clone "${title}" (${slug}) into ${target}. Call ${brief}: it carries the checklist the rebuild is judged against and the moments to look at. Call see_design at each of those moments and build from what you see: every size in one unit, --u, equal to a source pixel; the brief's imagery and material rules for pictures and glass. Then compare your render with each frame, check every item of the checklist by eye, and fix what fails. Keep the designer's credit in the file.`;
  }
  return `Using lookap, clone "${title}" (${slug}) into ${target}. 1) Call ${brief}: read its checklist, its materials notes and its moments${stack === "react" ? ", and use its port guide for the unit, the Tailwind theme and the Motion transitions" : ""}. 2) Measure the clip with look_at: what=sheet for the whole clip, what=diff on moments half a second apart to see what moves, what=track on moving edges for speed and timing, what=zoom on every small part before drawing it, what=colors for exact fills, what=patch or what=plate for pictures. 3) Build it with every size in --u (one source pixel), the timeline replayable with a demo flag. 4) Render it at the brief's moments, upload the screenshots with check_rebuild's token, then call judge_rebuild and run its judge as it says, three runs, passing the votes back. 5) Fix what it lists first, render, check and judge again, up to three rounds, until every item passes. Keep the designer's credit in the file.`;
}

function morePrompts(slug: string, title: string) {
  return [
    { label: "What makes it work", text: `Using lookap, open "${title}" (${slug}): call get_brief and see_design at two of its moments, then tell me in a short list what makes it work, with the real values: layout and spacing, type, palette, the materials, and how it moves (what, when, how far, which easing).` },
    { label: "Find similar", text: `Using lookap, find the three designs most like "${title}" (${slug}) with similar_designs, look at each with see_design, and tell me what they share and where they differ.` },
    { label: "Something new in its spirit", text: `Using lookap, design something new for this project in the spirit of "${title}" (${slug}): use the remix prompt with it and one or two similar entries, borrow their principles, proportions and timing, never their pixels or copy, then render it and check how it looks.` },
  ];
}

function CopyRow({ label, text, primary = false }: { label: string; text: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <li>
      <button type="button" onClick={() => void copy()} className="sfx-badge group flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left outline-none hover:bg-white/[.03] focus-visible:bg-white/[.04]" aria-live="polite">
        <span className="flex items-center justify-between gap-3 text-[12px]">
          <span className={primary ? "font-medium text-silver-bright" : "font-medium text-foreground"}>{label}</span>
          <span className="text-subtle group-hover:text-foreground">{state === "done" ? "Copied" : state === "fail" ? "Select and copy" : "Copy"}</span>
        </span>
        <span className="text-[12px] leading-[1.5] text-subtle">{text}</span>
      </button>
    </li>
  );
}

/* One tap copies the whole prompt for that stack; the button says so, and the prompt itself never fills the panel. */
function CloneButton({ stack, text }: { stack: Stack; text: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <button type="button" onClick={() => void copy()} aria-live="polite" title={text} className={button(state === "done" ? "silver" : "outline", "h-auto flex-col gap-0.5 rounded-lg px-2 py-2 text-[12px]")}>
      <span className="font-medium">{stack === "react" ? "React" : "HTML"}</span>
      <span className="text-[11px] opacity-70">{state === "done" ? "Prompt copied" : state === "fail" ? "Copy blocked" : stack === "react" ? "Tailwind + Motion" : "and CSS"}</span>
    </button>
  );
}

const PLAN_LINE: Record<Plan, string> = {
  starter: "Written for Starter: your agent builds from the frames and the checklist. Pro adds measuring and the judge.",
  pro: "Written for Pro: your agent measures the clip and judges its rebuild until the checklist passes.",
  team: "Written for Max: your agent starts from the finished rebuild.",
};

/* Signed out: the click goes to sign-in and comes back here. Signed in without a plan: the panel asks for one. Paid:
   the prompts. The plan is fetched on the first click, not on every page view. */
export function AgentPrompts({ slug, title, rebuilt = false, react = false }: { slug: string; title: string; measured?: boolean; rebuilt?: boolean; react?: boolean }) {
  const [open, setOpen] = useState<null | "clone" | "more">(null);
  const [plan, setPlan] = useState<"loading" | "none" | Plan>("loading");
  const { isSignedIn } = useUser();
  const router = useRouter();
  const toggle = async (which: "clone" | "more") => {
    if (!isSignedIn) { const path = window.location.pathname; router.push(`${path}?signin=1&next=${encodeURIComponent(path)}`); return; }
    if (open === which) { setOpen(null); return; }
    setOpen(which);
    if (plan === "loading") {
      try { const d = (await (await fetch("/api/me")).json()) as { plan?: string }; setPlan(d.plan === "starter" || d.plan === "pro" || d.plan === "team" ? d.plan : "none"); } catch { setPlan("none"); }
    }
  };
  const chevron = (on: boolean) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-150 ${on ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>;
  const paid = plan !== "loading" && plan !== "none";
  return (
    <section className="flex flex-col gap-2">
      <button type="button" onClick={() => void toggle("clone")} aria-expanded={open === "clone"} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
        Clone with your agent
        {chevron(open === "clone")}
      </button>
      <button type="button" onClick={() => void toggle("more")} aria-expanded={open === "more"} className={button("outline", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
        More with your agent
        {chevron(open === "more")}
      </button>
      {open && plan === "loading" && <p className="text-[12px] text-subtle">Checking your plan…</p>}
      {open && plan === "none" && (
        <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-line">
          <p className="text-[12px] leading-[1.5] text-foreground">Your agent needs a lookap key to run these.</p>
          <p className="text-[12px] leading-[1.5] text-subtle">Starter is $1 a month: the frames and the checklist. Pro measures the clip and judges the rebuild. Max hands over the finished file.</p>
          <Link href="/pricing" className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>See plans</Link>
        </div>
      )}
      {open === "clone" && paid && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1.5">
            {(["react", "html"] as const).map((s) => <CloneButton key={s} stack={s} text={clonePrompt(slug, title, plan as Plan, s, rebuilt, react)} />)}
          </div>
          <p className="text-[12px] leading-[1.5] text-subtle">{PLAN_LINE[plan as Plan]} Paste it into Claude Code, Cursor, Codex or any agent with lookap connected. <Link href="/mcp" className="text-foreground underline underline-offset-2">Not connected yet?</Link></p>
        </div>
      )}
      {open === "more" && paid && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg bg-card ring-1 ring-line">
          {morePrompts(slug, title).map((p) => <CopyRow key={p.label} {...p} />)}
        </ul>
      )}
    </section>
  );
}
