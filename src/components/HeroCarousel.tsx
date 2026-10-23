"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* The hero's right side: the measured card reader first (live, hover it), then every shipped rebuild in turn, each a
   recording of the rebuild replaying its clip. Slides move sideways every few seconds, wait while hovered or off
   screen, and only the slide in view plays its video. A new rebuild joins the moment it ships. */
export type HeroSlide = { slug: string; title: string; video: string; ratio: number; result: string };

const MS = 6500;

export function HeroCarousel({ first, slides, firstLabel }: { first: ReactNode; slides: HeroSlide[]; firstLabel: string }) {
  const n = slides.length + 1;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !seen || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((k) => (k + 1) % n), MS);
    return () => clearTimeout(t);
  }, [i, paused, seen, n]);
  /* only the slide in view decodes */
  useEffect(() => {
    vids.current.forEach((v, k) => { if (!v) return; if (seen && k + 1 === i) { v.currentTime = 0; void v.play().catch(() => {}); } else v.pause(); });
  }, [i, seen]);

  const label = i === 0 ? { title: firstLabel, result: "a measured recipe · hover it", slug: null as string | null } : { title: slides[i - 1].title, result: slides[i - 1].result, slug: slides[i - 1].slug };
  return (
    <div ref={box} className="relative min-w-0 overflow-hidden rounded-2xl bg-black ring-1 ring-line" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(.3,.7,.2,1)] motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        <div className="w-full shrink-0" aria-hidden={i !== 0}>{first}</div>
        {slides.map((s, k) => (
          <div key={s.slug} className="relative w-full shrink-0 self-stretch bg-[#0b0b0b]" aria-hidden={i !== k + 1}>
            <div className="absolute inset-0 flex items-center justify-center p-5 pb-14 sm:p-8 sm:pb-16">
              <video ref={(el) => { vids.current[k] = el; }} src={s.video} muted loop playsInline preload="none" className="max-h-full max-w-full rounded-lg object-contain shadow-[0_18px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10" style={{ aspectRatio: s.ratio }} aria-label={`${s.title}, rebuilt by lookap`} />
            </div>
          </div>
        ))}
      </div>
      {/* what is on screen, and where the slides are */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-black/0 px-4 pt-10 pb-3">
        <p className="min-w-0 text-[12px] leading-[1.35]">
          <span className="block truncate text-foreground">{label.title}</span>
          <span className="block truncate text-subtle">{label.result}</span>
        </p>
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
          {label.slug && <Link href={`/feed/${label.slug}`} className="mr-2 text-[12px] font-medium text-subtle transition-colors hover:text-foreground">Open →</Link>}
          {Array.from({ length: n }, (_, k) => (
            <button key={k} type="button" aria-label={`Show slide ${k + 1} of ${n}`} aria-current={k === i} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-silver-bright" : "w-1.5 bg-white/30 hover:bg-white/60"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
