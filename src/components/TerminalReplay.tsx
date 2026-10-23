"use client";

import { useEffect, useRef, useState } from "react";
import { badge } from "./button";

/* A coding agent's terminal, replayed: the prompt is typed in, then each tool call and its result appear in turn, the
   way Claude Code prints them. The calls and results are a real run's; the prompt is the short form a person would
   type. Plays when it scrolls into view, loops after a pause, and shows everything at once for reduced motion. */
export type Step = { kind: "call" | "note"; title: string; detail?: string; out?: string };
export type Script = { label: string; prompt: string; steps: Step[]; caption: string; result?: { src: string; alt: string; w: number; h: number } };

const TYPE_MS = 28, STEP_MS = 650, HOLD_MS = 5200;

/* several runs, one tab each; a run that finishes moves on to the next until the visitor picks one */
export function TerminalReplay({ scripts, cwd = "~/my-app" }: { scripts: Script[]; cwd?: string }) {
  const [pick, setPick] = useState(0);
  const [held, setHeld] = useState(false);
  const { prompt, steps, caption, result } = scripts[pick];
  const box = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null), line = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);
  const [on, setOn] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      if (reduce) { setStill(true); return; }
      setOn(e.isIntersecting);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* the prompt types itself without re-rendering: one text node written per frame, state set once at the end */
  useEffect(() => {
    if (!on || still || typed >= prompt.length) return;
    const el = line.current;
    let raf = 0, start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const n = Math.min(prompt.length, Math.floor((ts - start) / TYPE_MS));
      if (el) el.textContent = prompt.slice(0, n);
      if (n >= prompt.length) setTyped(prompt.length); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, still, typed, prompt]);
  useEffect(() => {
    if (!on || still || typed < prompt.length) return;
    let t: ReturnType<typeof setTimeout>;
    if (shown < steps.length) t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : STEP_MS);
    else t = setTimeout(() => { setTyped(0); setShown(0); if (!held && scripts.length > 1) setPick((k) => (k + 1) % scripts.length); }, HOLD_MS);
    return () => clearTimeout(t);
  }, [on, still, typed, shown, prompt.length, steps.length, held, scripts.length]);
  const choose = (k: number) => { setPick(k); setHeld(true); setTyped(0); setShown(0); };

  /* like a terminal: the newest line stays in view */
  useEffect(() => { const el = body.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "auto" }); }, [shown]);

  const tSteps = still ? steps.length : shown;
  const typing = !still && typed < prompt.length;
  return (
    <div className="flex min-w-0 flex-col gap-3">
    {scripts.length > 1 && (
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Prompts">
        {scripts.map((x, k) => (
          <button key={x.label} type="button" role="tab" aria-selected={k === pick} onClick={() => choose(k)} className={badge(k === pick ? "active" : "chip", "h-8 px-3.5 text-[13px]")}>{x.label}</button>
        ))}
      </div>
    )}
    <div ref={box} className="min-w-0 overflow-hidden rounded-xl bg-[#0b0b0b] ring-1 ring-line">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#3a3a3a]" /><span className="size-2.5 rounded-full bg-[#3a3a3a]" /><span className="size-2.5 rounded-full bg-[#3a3a3a]" />
        <span className="ml-2 font-mono text-[12px] text-subtle">claude · {cwd}</span>
      </div>
      <div ref={body} className="h-[380px] overflow-y-auto px-4 py-4 font-mono text-[12px] leading-[1.6] [scrollbar-width:none] sm:h-[360px] sm:text-[12.5px]" aria-live="off">
        <p className="text-silver-bright">
          <span className="text-subtle">&gt; </span><span ref={line}>{still || typed >= prompt.length ? prompt : ""}</span>
          {(typing || (!still && tSteps === 0)) && <span className="ml-px inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-pulse bg-silver" aria-hidden="true" />}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {steps.slice(0, tSteps).map((s, k) => (
            <div key={k} className="min-w-0">
              <p className="min-w-0 break-words">
                <span className={s.kind === "call" ? "text-[#6ee7a0]" : "text-silver"}>⏺</span>{" "}
                <span className="text-foreground">{s.title}</span>
                {s.detail && <span className="text-subtle"> ({s.detail})</span>}
              </p>
              {s.out && <p className="min-w-0 break-words pl-4 text-subtle"><span aria-hidden="true">⎿ </span>{s.out}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
    {result && (still || shown >= steps.length) && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={result.src} alt={result.alt} width={result.w} height={result.h} loading="lazy" decoding="async" className="w-full rounded-xl ring-1 ring-line" />
    )}
    <p className="text-[13px] leading-[1.55] text-subtle">{caption}</p>
    </div>
  );
}
