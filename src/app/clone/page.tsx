"use client";

import { useRef, useState } from "react";
import { badge, button } from "@/components/button";
import type { Heuristic } from "@/lib/gate/heuristics";
import type { AgentVerdict } from "@/lib/gate/verdict";

type Gate = {
  meta: { kind: "video" | "image"; width: number; height: number; fps: number; duration: number; frames: number; ms: number };
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
  footage: { label: "Footage", line: "No interface here. lookap rebuilds interfaces.", ok: false },
};

const SIGNAL_LABEL: Record<keyof Heuristic["signals"], string> = {
  flatness: "flat fills", palette: "few colours", rectilinear: "boxes and lines", stillness: "static background", sharpness: "crisp pixels",
};

/* Motion presets offered for a still when no agent proposal exists. Each maps to a class on the preview card. */
const MOTION = {
  enter: [
    { id: "fade-up", label: "Fade up, 320 ms", cls: "animate-[enter-fade-up_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]" },
    { id: "scale-in", label: "Scale in, 260 ms", cls: "animate-[enter-scale_260ms_cubic-bezier(0.2,0.8,0.2,1)_both]" },
    { id: "none", label: "None", cls: "" },
  ],
  hover: [
    { id: "lift", label: "Lift 2 px + shadow", cls: "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]" },
    { id: "brighten", label: "Brighten", cls: "hover:brightness-110" },
    { id: "none", label: "None", cls: "" },
  ],
  press: [
    { id: "scale", label: "Scale 0.98", cls: "active:scale-[0.98]" },
    { id: "sink", label: "Sink 1 px", cls: "active:translate-y-px" },
    { id: "none", label: "None", cls: "" },
  ],
} as const;

export default function ClonePage() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);
  const [motion, setMotion] = useState({ enter: "fade-up", hover: "lift", press: "scale" });
  const [replay, setReplay] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if ((!url.trim() && !file) || busy) return;
    setBusy(true); setErr(null); setGate(null);
    try {
      const r = file
        ? await fetch("/api/gate", { method: "POST", body: (() => { const fd = new FormData(); fd.append("file", file); return fd; })() })
        : await fetch("/api/gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
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
  const isStill = gate?.meta.kind === "image";
  const previewCls = [MOTION.enter.find((m) => m.id === motion.enter)?.cls, MOTION.hover.find((m) => m.id === motion.hover)?.cls, MOTION.press.find((m) => m.id === motion.press)?.cls].join(" ");

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] text-foreground">Clone from a screenshot or a video</h1>
        <p className="max-w-[62ch] text-[14px] text-subtle">Paste a link or drop a file. lookap samples it, scores whether it holds an interface, and shows the verdict before any clone runs. A clip gives measured motion; a still gets motion you choose.</p>
      </header>

      <form onSubmit={check} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-card p-1.5 ring-1 ring-line focus-within:ring-ring">
          <input
            id="clone-url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (e.target.value) setFile(null); }}
            placeholder="https://… .mp4, .png, .jpg or .webp"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-subtle"
            autoComplete="off"
          />
          <button type="button" onClick={() => fileRef.current?.click()} className={button("outline", "h-9 rounded-lg px-3 text-[13px]")}>
            {file ? file.name.slice(0, 18) : "Upload"}
          </button>
          <input ref={fileRef} id="clone-file" type="file" accept="video/*,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f) setUrl(""); }} />
          <button type="submit" disabled={busy || (!url.trim() && !file)} className={button("silver", "h-9 rounded-lg px-4 text-[13px] disabled:opacity-50")}>
            {busy ? "Sampling…" : "Check it"}
          </button>
        </div>
      </form>

      {err && <p className="rounded-xl bg-card p-4 text-[13px] text-silver ring-1 ring-line">{err}</p>}

      {gate && k && (
        <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={badge(k.ok ? "active" : "dark", "px-2.5 py-1 text-[12px]")}>{k.label}</span>
                <span className={badge("dark", "px-2 py-0.5 text-[11px]")}>{isStill ? "still" : "clip"}</span>
                <span className="font-mono text-[12px] text-subtle">{gate.meta.width}×{gate.meta.height}{isStill ? "" : ` · ${gate.meta.fps} fps · ${gate.meta.duration}s`} · {gate.meta.ms} ms</span>
              </div>
              <p className="mt-2 text-[14px] text-foreground">{gate.agent?.summary ?? k.line}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[28px] leading-none text-silver-bright tabular-nums">{score}</div>
              <div className="text-[11px] text-subtle">cloneability</div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the gate, not a remote asset */}
          <img src={gate.sheet} alt={isStill ? "The still you sent" : "Eight frames sampled evenly across the clip"} className="w-full rounded-lg ring-1 ring-line" />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-[12px] font-medium tracking-[.06em] text-subtle uppercase">Pixel signals</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(Object.keys(gate.heuristic.signals) as (keyof Heuristic["signals"])[]).map((s) => {
                  const v = gate.heuristic.signals[s];
                  if (v < 0) return null;
                  return (
                    <li key={s} className="flex items-center gap-3 text-[12px]">
                      <span className="w-32 shrink-0 text-subtle">{SIGNAL_LABEL[s]}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60 ring-1 ring-line"><span className="block h-full rounded-full bg-silver" style={{ width: `${Math.round(v * 100)}%` }} /></span>
                      <span className="w-8 text-right font-mono text-silver tabular-nums">{Math.round(v * 100)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-subtle">Heuristic score {Math.round(gate.heuristic.score * 100)} · verdict {KIND[gate.heuristic.verdict].label}{isStill ? " · no timing on a still" : ""}</p>
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

          {isStill && k.ok && (
            <div className="border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[12px] font-medium tracking-[.06em] text-subtle uppercase">Motion, added</h2>
                <span className="text-[11px] text-subtle">A still has no motion to measure. This is proposed, not observed.</span>
              </div>
              {gate.agent && gate.agent.motion.length > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {gate.agent.motion.map((m) => (
                    <li key={m.component} className="rounded-lg bg-canvas p-3 text-[12px] ring-1 ring-line">
                      <p className="font-medium text-foreground">{m.component}</p>
                      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-subtle"><dt>enter</dt><dd className="text-silver">{m.enter}</dd><dt>hover</dt><dd className="text-silver">{m.hover}</dd><dt>press</dt><dd className="text-silver">{m.press}</dd></dl>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["enter", "hover", "press"] as const).map((slot) => (
                      <fieldset key={slot} className="flex flex-col gap-1.5">
                        <legend className="mb-1 text-[11px] font-medium text-foreground capitalize">{slot}</legend>
                        {MOTION[slot].map((opt) => (
                          <label key={opt.id} className="flex cursor-pointer items-center gap-2 text-[12px] text-subtle has-[:checked]:text-foreground">
                            <input type="radio" name={slot} id={`m-${slot}-${opt.id}`} value={opt.id} checked={motion[slot] === opt.id} onChange={() => { setMotion((m) => ({ ...m, [slot]: opt.id })); setReplay((n) => n + 1); }} className="accent-[#e8e8e8]" />
                            {opt.label}
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div key={replay} className={`flex h-24 w-full items-center justify-center rounded-lg bg-canvas text-[12px] text-silver ring-1 ring-line transition-[transform,box-shadow,filter] duration-150 ${previewCls}`}>preview</div>
                    <button type="button" onClick={() => setReplay((n) => n + 1)} className={button("outline", "h-7 rounded-md px-2.5 text-[11px]")}>Replay enter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {k.ok ? (
              <>
                <button type="button" className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Start the clone</button>
                <span className="text-[12px] text-subtle">{isStill ? "Layout and colours measured; motion as chosen above." : "Layout, colours and motion measured from the clip."} Runs in your agent on Free, on our servers on Pro.</span>
              </>
            ) : (
              <span className="text-[12px] text-subtle">Nothing to clone here. Try a screenshot, a UI clip or a screen recording.</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
