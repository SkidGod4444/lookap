"use client";

import { useEffect } from "react";

/* Weight on the wheel. Wheel input moves a target; the page follows it with a lag and settles with friction, so a flick
   coasts and a slow turn feels like dragging a slider over the ruler. Only the wheel is taken over: scrollbar drags,
   keys, touch and any scrollable panel inside the page stay native. Off under prefers-reduced-motion and on coarse pointers. */
const LAG = 0.085;      /* share of the remaining distance covered per 60 fps frame; lower is heavier */
const LINE = 16;        /* px per wheel "line" for mice that report lines, not pixels */
const MAX_STEP = 240;   /* cap on one wheel event, so a notched mouse cannot teleport the page */

function scrollableAncestor(from: Element | null, stop: HTMLElement) {
  for (let n = from; n && n !== stop; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight + 1) return n as HTMLElement;
  }
  return null;
}

export function Inertia() {
  useEffect(() => {
    const el = document.getElementById("scroll");
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;

    let target = el.scrollTop, current = el.scrollTop, raf = 0, last = 0, animating = false;

    const step = (now: number) => {
      const dt = last ? Math.min(32, now - last) : 16;
      last = now;
      const k = 1 - Math.pow(1 - LAG, dt / 16.67);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.4) { current = target; el.scrollTop = Math.round(current); animating = false; raf = 0; last = 0; return; }
      el.scrollTop = current;
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;                         /* pinch zoom and browser zoom stay native */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;        /* a sideways swipe belongs to whatever row is under it */
      if (getComputedStyle(el).overflowY === "hidden") return;    /* project pages lock the page; their panel scrolls itself */
      const inner = scrollableAncestor(e.target as Element, el);
      if (inner) {
        const down = e.deltaY > 0;
        const canScroll = down ? inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1 : inner.scrollTop > 0;
        if (canScroll) return;                                    /* an inner panel takes the wheel until it runs out */
      }
      e.preventDefault();
      const raw = e.deltaMode === 1 ? e.deltaY * LINE : e.deltaMode === 2 ? e.deltaY * el.clientHeight : e.deltaY;
      const d = Math.max(-MAX_STEP, Math.min(MAX_STEP, raw));
      if (!animating) { current = el.scrollTop; target = current; }
      target = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, target + d));
      if (!animating) { animating = true; raf = requestAnimationFrame(step); }
    };

    /* anything else that moves the page (scrollbar drag, keys, hash, ScrollReset) re-seats the target */
    const onScroll = () => { if (!animating) { current = el.scrollTop; target = current; } };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("wheel", onWheel); el.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}
