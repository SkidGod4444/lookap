"use client";

import { useState } from "react";
import { badge, button } from "@/components/button";
import type { Heuristic } from "@/lib/gate/heuristics";
import type { AgentVerdict } from "@/lib/gate/verdict";

type Gate = {
  meta: { width: number; height: number; fps: number; duration: number; frames: number; ms: number };
  sheet: string;
  heuristic: Heuristic;
  agent: AgentVerdict | null;
  agentAvailable: boolean;
  agentError: string | null;
};

const KIND: Record<Heuristic["verdict"], { label: string; line: string; ok: boolean }> = {
  interface: { label: "Interface", line: "A software UI. Full pipeline.", ok: true },
  rendered: { label: "Rendered UI", line: "A 3D or motion render of a control. Clonable as an approximation.", ok: true },
  mixed: { label: "Mixed", line: "Footage with a screen in it. Crop to the screen, then clone.", ok: true },
  footage: { label: "Footage", line: "No interface in this clip. lookap rebuilds interfaces.", ok: false },
};

const SIGNAL_LABEL: Record<keyof Heuristic["signals"], string> = {
  flatness: "flat fills", palette: "few colours", rectilinear: "boxes and lines", stillness: "static background", sharpness: "crisp pixels",
};

export default function ClonePage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true); setErr(null); setGate(null);
    try {
      const r = await fetch("/api/gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Gate failed");
      setGate(j as Gate);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gate failed");
    } finally {
      setBusy(false);
    }
  }

  const kind = gate ? (gate.agent?.kind ?? gate.heuristic.verdict) : null;
  const k = kind ? KIND[kind] : null;
  const score = gate ? (gate.agent ? gate.agent.cloneability : Math.round(gate.heuristic.score * 100)) : 0;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] text-foreground">Clone a video</h1>
        <p className="max-w-[60ch] text-[14px] text-subtle">Paste an mp4 link. lookap samples the clip, scores whether it holds an interface, and shows you the verdict before any clone runs.</p>
      </header>

      <form onSubmit={check} className="flex items-center gap-2 rounded-xl bg-card p-1.5 ring-1 ring-line focus-within:ring-ring">
        <input
          id="clone-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… .mp4"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-subtle"
          autoComplete="off"
        />
        <button type="submit" disabled={busy || !url.trim()} className={button("silver", "h-9 rounded-lg px-4 text-[13px] disabled:opacity-50")}>
          {busy ? "Sampling…" : "Check the clip"}
        </button>
      </form>

      {err && <p className="rounded-xl bg-card p-4 text-[13px] text-silver ring-1 ring-line">{err}</p>}

      {gate && k && (
        <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={badge(k.ok ? "active" : "dark", "px-2.5 py-1 text-[12px]")}>{k.label}</span>
                <span className="font-mono text-[12px] text-subtle">{gate.meta.width}×{gate.meta.height} · {gate.meta.fps} fps · {gate.meta.duration}s · {gate.meta.ms} ms</span>
              </div>
              <p className="mt-2 text-[14px] text-foreground">{gate.agent?.summary ?? k.line}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[28px] leading-none text-silver-bright tabular-nums">{score}</div>
              <div className="text-[11px] text-subtle">cloneability</div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the gate, not a remote asset */}
          <img src={gate.sheet} alt="Eight frames sampled evenly across the clip" className="w-full rounded-lg ring-1 ring-line" />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-[12px] font-medium tracking-[.06em] text-subtle uppercase">Pixel signals</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(Object.keys(gate.heuristic.signals) as (keyof Heuristic["signals"])[]).map((s) => {
                  const v = gate.heuristic.signals[s];
                  return (
                    <li key={s} className="flex items-center gap-3 text-[12px]">
                      <span className="w-32 shrink-0 text-subtle">{SIGNAL_LABEL[s]}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60 ring-1 ring-line"><span className="block h-full rounded-full bg-silver" style={{ width: `${Math.round(v * 100)}%` }} /></span>
                      <span className="w-8 text-right font-mono text-silver tabular-nums">{Math.round(v * 100)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-subtle">Heuristic score {Math.round(gate.heuristic.score * 100)} · verdict {KIND[gate.heuristic.verdict].label}</p>
            </div>
            <div>
              <h2 className="text-[12px] font-medium tracking-[.06em] text-subtle uppercase">Agent read</h2>
              {gate.agent ? (
                <ul className="mt-2 flex flex-col gap-1.5 text-[12px]">
                  {gate.agent.components.map((c) => (
                    <li key={c.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-foreground">{c.name}</span>{c.states.map((s) => <span key={s} className={badge("dark", "px-1.5 py-0.5 text-[10px]")}>{s}</span>)}</li>
                  ))}
                  {gate.agent.concerns.length > 0 && <li className="mt-1 text-subtle">Approximate: {gate.agent.concerns.join(", ")}</li>}
                </ul>
              ) : (
                <p className="mt-2 text-[12px] text-subtle">{gate.agentAvailable ? `Agent verdict failed: ${gate.agentError}` : "No model credentials on this server, so this is the pixel verdict alone. Set ANTHROPIC_API_KEY to add the agent read."}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {k.ok ? (
              <>
                <button type="button" className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Start the clone</button>
                <span className="text-[12px] text-subtle">Runs in your agent on Free, on our servers on Pro.</span>
              </>
            ) : (
              <span className="text-[12px] text-subtle">Nothing to clone here. Try a screen recording or a UI clip.</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
