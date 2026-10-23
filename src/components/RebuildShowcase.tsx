"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { badge } from "./button";

/* The proof on the home page: the designer's clip and lookap's rebuild of it, side by side, playing together. Each tab
   restarts both videos at once so the two run in step. The rebuild side is the recording of the rebuild replaying the
   clip's own timeline (public/live), the same one a visitor sees on the project page. */
export type Showcase = { slug: string; title: string; author: string; clip: string; poster?: string; rebuild: string; ratio: number; clipRatio: number; result: string };

/* a fresh order on every visit, then the next rebuild every few seconds until the visitor picks one */
const ADVANCE_MS = 9000;
export function RebuildShowcase({ items: given }: { items: Showcase[] }) {
  const [items, setItems] = useState(given);
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const a = useRef<HTMLVideoElement>(null), b = useRef<HTMLVideoElement>(null), box = useRef<HTMLDivElement>(null);
  /* the two videos decode only while the section is on screen and the tab is visible */
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const vis = () => { if (document.hidden) setSeen(false); };
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  /* shuffled after hydration, so the server and the first client paint agree */
  useEffect(() => {
    const t = setTimeout(() => {
      const s = [...given];
      for (let k = s.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [s[k], s[r]] = [s[r], s[k]]; }
      setItems(s);
      setI(0);
    }, 0);
    return () => clearTimeout(t);
  }, [given]);
  useEffect(() => {
    if (!seen || held || items.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((k) => (k + 1) % items.length), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [i, held, items.length, seen]);
  const it = items[i];
  /* restart both together on a new tab; pause both when out of view */
  useEffect(() => {
    for (const v of [a.current, b.current]) { if (!v) continue; v.currentTime = 0; }
  }, [i, items]);
  useEffect(() => {
    for (const v of [a.current, b.current]) { if (!v) continue; if (seen) void v.play().catch(() => {}); else v.pause(); }
  }, [seen, i, items]);
  if (!it) return null;
  const pane = "relative min-w-0 overflow-hidden rounded-xl bg-black ring-1 ring-line";
  return (
    <div ref={box} className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-48px),transparent)]" role="tablist" aria-label="Rebuilds">
        {items.map((x, k) => (
          <button key={x.slug} type="button" role="tab" aria-selected={k === i} onClick={() => { setI(k); setHeld(true); }} className={badge(k === i ? "active" : "chip", "h-8 shrink-0 px-3.5 text-[13px]")}>
            {x.title}
          </button>
        ))}
      </div>
      <div className={`grid gap-3 ${it.ratio < 1.25 ? "grid-cols-2" : "md:grid-cols-2"}`}>
        <figure className="flex min-w-0 flex-col gap-2">
          <div className={pane} style={{ aspectRatio: it.ratio, maxHeight: "min(560px, 62vh)", marginInline: "auto", maxWidth: `calc(min(560px, 62vh) * ${it.ratio})`, width: "100%" }}>
            <video key={`c-${it.slug}`} ref={a} src={it.clip} poster={it.poster} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" aria-label={`${it.title}, the designer's clip`} />
          </div>
          <figcaption className="text-[13px] leading-[1.4] text-subtle"><span className="text-foreground">The designer&apos;s clip</span><span className="hidden sm:inline"> · {it.author}</span></figcaption>
        </figure>
        <figure className="flex min-w-0 flex-col gap-2">
          <div className={pane} style={{ aspectRatio: it.ratio, maxHeight: "min(560px, 62vh)", marginInline: "auto", maxWidth: `calc(min(560px, 62vh) * ${it.ratio})`, width: "100%" }}>
            <video key={`r-${it.slug}`} ref={b} src={it.rebuild} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" aria-label={`${it.title}, lookap's rebuild`} />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] leading-[1.4] text-subtle">
            <span className="min-w-0"><span className="text-foreground">The rebuild</span><span className="hidden sm:inline"> · one HTML file, {it.result}</span></span>
            <Link href={`/feed/${it.slug}`} className="font-medium text-subtle transition-colors hover:text-foreground">Play with it →</Link>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
