"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { badge, button } from "./button";

/* "Remix with your agent": one button on an entry page that hands this design to the reader's coding agent. It opens a
   small menu: pick the stack once (React + Tailwind + Motion, or HTML and CSS, remembered), then tap what the agent
   should do and that prompt is on the clipboard. No prompt text on screen; each action is a title and one line.
   Every prompt is written for the reader's plan, so it only calls tools their key can run: Starter builds from the
   frames and the checklist, Pro measures the clip and runs the judge, Max starts from the finished rebuild. */
type Plan = "starter" | "pro" | "team";
type Stack = "html" | "react";
type Action = { id: string; title: string; line: string; text: string };

const TARGET: Record<Stack, string> = {
  react: "a React component in this project, styled with Tailwind and animated with Motion (motion/react)",
  html: "this project, in HTML and CSS with plain JavaScript where it moves",
};

function actions(slug: string, title: string, plan: Plan, stack: Stack, rebuilt: boolean, react: boolean): Action[] {
  const brief = `get_brief for ${slug}${stack === "react" ? " with stack react" : ""}`;
  const port = stack === "react" ? ", and its port guide for the unit, the Tailwind theme and the Motion transitions" : "";
  const credit = "Keep the designer's credit in a comment.";
  const measure = "Measure the clip with look_at: what=sheet for the whole clip, what=diff on moments half a second apart for what moves, what=track on moving edges for speed and timing, what=zoom on small parts before drawing them, what=colors for exact fills.";
  const prove = "Render it at the brief's moments, upload the screenshots with check_rebuild's token, then call judge_rebuild and run its judge as it says, passing the votes back. Fix what it lists first and judge again, up to three rounds.";
  const look = "Call see_design at each of the brief's moments and build from what you see.";

  const rebuild =
    plan === "team" && rebuilt
      ? `Using lookap, rebuild "${title}" (${slug}) as ${TARGET[stack]}. Call get_rebuild for ${slug}${stack === "react" && react ? " with stack react, which returns the finished component" : ""}: it is already judged against the designer's clip, so port it keeping every number, the --u unit and the timings. Then render it, run check_rebuild with an upload token, and fix anything that drifted. ${credit}`
      : plan === "starter"
        ? `Using lookap, rebuild "${title}" (${slug}) as ${TARGET[stack]}. Call ${brief}: it has the checklist the rebuild is judged against and the moments to look at${port}. ${look} Every size in one unit, --u, equal to a source pixel. Then compare your render with each frame, check every checklist item by eye, and fix what fails. ${credit}`
        : `Using lookap, rebuild "${title}" (${slug}) as ${TARGET[stack]}. 1) Call ${brief}: read its checklist, materials notes and moments${port}. 2) ${measure} 3) Build it with every size in --u (one source pixel) and a replayable timeline. 4) ${prove} Done when every checklist item passes. ${credit}`;

  const adapt = `Using lookap, remix "${title}" (${slug}) into ${TARGET[stack]} for this product. Call ${brief}${port}, then ${plan === "starter" ? "see_design at its moments" : "look_at with what=sheet and what=track to get the timing"}. Keep what makes it feel right: the layout and proportions, the spacing rhythm, the motion's order, durations and easing. Replace the rest with this project's own: its copy, its colours and fonts from the existing theme or tokens, its icons and data. Read the project's components first and reuse them. Render it and check it still moves like the original. ${credit}`;

  const spirit = `Using lookap, design something new for this project in the spirit of "${title}" (${slug}), as ${TARGET[stack]}. Use the remix prompt with it and one or two entries from similar_designs: borrow their principles, proportions and timing, never their pixels or copy. Tell me in two lines what you borrowed from each, then build it and render it.`;

  const explain = `Using lookap, open "${title}" (${slug}): call get_brief and see_design at two of its moments, then tell me in a short list what makes it work, with real values: layout and spacing, type, palette, materials, and how it moves (what, when, how far, which easing).`;

  return [
    { id: "rebuild", title: "Rebuild it", line: plan === "team" && rebuilt ? "From the finished rebuild" : plan === "starter" ? "Exact copy, by eye" : "Measured and judged", text: rebuild },
    { id: "adapt", title: "Make it yours", line: "Your content, same feel", text: adapt },
    { id: "spirit", title: "Something new", line: "Borrows its principles", text: spirit },
    { id: "explain", title: "Explain it", line: "What makes it work", text: explain },
  ];
}

const PLAN_LINE: Record<Plan, string> = {
  starter: "Starter: built from the frames. Pro measures and judges.",
  pro: "Pro: measured from the clip and judged.",
  team: "Max: starts from the finished rebuild.",
};

const Icon = ({ id }: { id: string }) => {
  const p = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (id === "rebuild") return <svg {...p}><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;
  if (id === "adapt") return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
  if (id === "spirit") return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></svg>;
  if (id === "done") return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>;
};

function Row({ a }: { a: Action }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(a.text); setState("done"); }
    catch {
      /* the async clipboard can be blocked (an iframe, an old browser): fall back to a hidden selection */
      const t = document.createElement("textarea");
      t.value = a.text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(t); t.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { /* none left */ }
      t.remove();
      setState(ok ? "done" : "fail");
    }
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <li>
      <button type="button" onClick={() => void copy()} title={a.text} className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-white/[.04] focus-visible:bg-white/[.05]">
        <span className={`grid size-7 shrink-0 place-items-center rounded-md ring-1 transition-colors duration-150 ${state === "done" ? "bg-silver-bright text-[#0a0a0a] ring-transparent" : "bg-white/[.03] text-silver ring-line group-hover:text-foreground"}`}>
          <Icon id={state === "done" ? "done" : a.id} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-medium text-foreground">{a.title}</span>
          <span className="truncate text-[11.5px] text-subtle" aria-live="polite">{state === "done" ? "Copied. Paste into your agent" : state === "fail" ? "Copy failed. Try again" : a.line}</span>
        </span>
      </button>
    </li>
  );
}

/* Signed out: the click goes to sign-in and comes back here. Signed in without a plan: the panel asks for one. Paid: the
   menu. The plan is fetched on the first click, not on every page view. */
export function AgentPrompts({ slug, title, rebuilt = false, react = false }: { slug: string; title: string; measured?: boolean; rebuilt?: boolean; react?: boolean }) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"loading" | "none" | Plan>("loading");
  const [stack, setStack] = useState<Stack>("react");
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);
  const pick = (s: Stack) => { setStack(s); try { localStorage.setItem("lookap:stack", s); } catch { /* private mode */ } };

  const toggle = async () => {
    if (!isSignedIn) { const path = window.location.pathname; router.push(`${path}?signin=1&next=${encodeURIComponent(path)}`); return; }
    setOpen((o) => !o);
    if (plan === "loading") {
      /* the stack picked last time, read once on the first open */
      try { const s = localStorage.getItem("lookap:stack"); if (s === "html" || s === "react") setStack(s); } catch { /* private mode */ }
      try { const d = (await (await fetch("/api/me")).json()) as { plan?: string }; setPlan(d.plan === "starter" || d.plan === "pro" || d.plan === "team" ? d.plan : "none"); } catch { setPlan("none"); }
    }
  };
  const paid = plan !== "loading" && plan !== "none";

  return (
    <section className="flex flex-col gap-2">
      <button type="button" onClick={() => void toggle()} aria-expanded={open} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
        <span className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 14 4 4-4 4" /><path d="m18 2 4 4-4 4" /><path d="M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6a4 4 0 0 1 3.3-1.7H22" /><path d="M2 6h1.97a4 4 0 0 1 3.3 1.7l.53.83" /><path d="m13.67 16.47.53.83a4 4 0 0 0 3.3 1.7H22" /></svg>
          Remix with your agent
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-line motion-safe:animate-[fadeIn_160ms_ease-out]">
          {plan === "loading" && <p className="px-3 py-3 text-[12px] text-subtle">Checking your plan…</p>}
          {plan === "none" && (
            <div className="flex flex-col gap-2 p-3">
              <p className="text-[12px] leading-[1.5] text-foreground">Your agent needs a lookap key to run these.</p>
              <p className="text-[12px] leading-[1.5] text-subtle">Starter is $1 a month: the frames and the checklist. Pro measures the clip and judges the rebuild. Max hands over the finished file.</p>
              <Link href="/pricing" className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>See plans</Link>
            </div>
          )}
          {paid && (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <span className="text-[11.5px] text-subtle">Build in</span>
                <div className="flex gap-1" role="radiogroup" aria-label="Stack">
                  {(["react", "html"] as const).map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={stack === s} onClick={() => pick(s)} className={badge(stack === s ? "active" : "chip", "h-6 px-2.5 text-[11.5px]")}>
                      {s === "react" ? "React" : "HTML"}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="divide-y divide-line">
                {actions(slug, title, plan as Plan, stack, rebuilt, react).map((a) => <Row key={a.id} a={a} />)}
              </ul>
              <p className="border-t border-line px-3 py-2 text-[11.5px] leading-[1.5] text-subtle">
                {stack === "react" ? "Tailwind + Motion. " : ""}{PLAN_LINE[plan as Plan]} <Link href="/mcp" className="text-foreground underline underline-offset-2">Connect lookap</Link>
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
