"use client";

import { useEffect } from "react";

/* Click sounds synthesized in Web Audio, so nothing is downloaded.
   Buttons are machined metal: a short bright "clack" with inharmonic ring and a soft thump underneath.
   Badges are flat labels: a dry, quiet "tick". Volumes are low and both last under 120 ms. */

let ctx: AudioContext | null = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/* iOS keeps Web Audio silent until the page's audio session is opened from inside a touch, and the ring/silent switch
   mutes it until a media element has played. So on the first touch or key: make the context, resume it, push one empty
   buffer through it, and play a few milliseconds of silence through an <audio> element. After that every sound is
   immediate, including the scroll ticks, which never happen inside a gesture. Desktop browsers just resume. */
let unlocked = false;
const SILENCE = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const ac = audio();
  const src = ac.createBufferSource();
  src.buffer = ac.createBuffer(1, 1, ac.sampleRate);
  src.connect(ac.destination);
  src.start(0);
  const el = document.createElement("audio");
  el.setAttribute("playsinline", "");
  el.preload = "auto";
  el.src = SILENCE;
  el.volume = 0.01;
  void el.play().catch(() => { unlocked = false; });
}

function noise(ac: AudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

export function playButton(variant: "silver" | "outline" = "silver") {
  const ac = audio();
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.5;
  out.connect(ac.destination);

  /* metallic ring: three inharmonic partials, the lighter alloy rings higher */
  const base = variant === "silver" ? 2100 : 1500;
  [1, 1.47, 2.31].forEach((ratio, i) => {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = base * ratio;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 / (i + 1), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07 + i * 0.015);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.12);
  });

  /* contact: a 6 ms burst of bright noise */
  const n = noise(ac, 0.03);
  const nf = ac.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = 3800;
  nf.Q.value = 0.9;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.18, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
  n.connect(nf).connect(ng).connect(out);
  n.start(t);

  /* body: a low thump as the pill seats */
  const th = ac.createOscillator();
  th.type = "sine";
  th.frequency.setValueAtTime(180, t);
  th.frequency.exponentialRampToValueAtTime(70, t + 0.05);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(0.12, t);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  th.connect(tg).connect(out);
  th.start(t);
  th.stop(t + 0.08);
}

export function playBadge() {
  const ac = audio();
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.35;
  out.connect(ac.destination);

  /* dry tick: a 4 ms filtered noise click, no ring */
  const n = noise(ac, 0.02);
  const nf = ac.createBiquadFilter();
  nf.type = "highpass";
  nf.frequency.value = 2500;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.2, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);
  n.connect(nf).connect(ng).connect(out);
  n.start(t);

  /* a short soft blip so it reads as a toggle, not a pop */
  const o = ac.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(660, t + 0.03);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.06);
}

/* Ruler tick: the scrollbar is a ruler, so the slider clicks over its ticks. A 3 ms filtered noise click, with a
   slightly lower, fuller one on the long tick every fifth notch. Far quieter than a badge. */
export function playTick(accent = false) {
  const ac = audio();
  if (ac.state !== "running") return; /* no gesture yet: the browser keeps the context silent, so skip rather than queue */
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = accent ? 0.16 : 0.09;
  out.connect(ac.destination);
  const n = noise(ac, 0.012);
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = accent ? 1800 : 3200;
  f.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.012 : 0.006));
  n.connect(f).connect(g).connect(out);
  n.start(t);
}

/* Mount once. Any element carrying .sfx-button or .sfx-badge (set by the button() and badge() recipes) plays on pointer down.
   Every scroller on the page ticks as its slider crosses the ruler marks (the page in #scroll, a project's panel, a chip
   rail): one notch per 4 px of slider travel, the long mark every fifth. Scroll events do not bubble, so they are caught
   in the capture phase at the document. Ticks are rate-limited so a flick reads as a ratchet, not a buzz. */
export function Sounds() {
  useEffect(() => {
    const notches = new WeakMap<Element, number>();
    let lastAt = 0;
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || document.hidden) return;
      const horizontal = el.scrollWidth > el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1;
      const track = horizontal ? el.clientWidth : el.clientHeight, content = horizontal ? el.scrollWidth : el.scrollHeight, pos = horizontal ? el.scrollLeft : el.scrollTop;
      if (content <= track + 1) return;
      const thumb = (pos / (content - track)) * (track - track * (track / content)); /* slider travel in px */
      const notch = Math.floor(thumb / 4);
      const prev = notches.get(el) ?? -1;
      if (notch === prev) return;
      notches.set(el, notch);
      const now = performance.now();
      if (now - lastAt < 28) return;
      lastAt = now;
      playTick(Math.floor(notch / 5) !== Math.floor(prev / 5));
    };
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    const onFirst = () => { unlock(); document.removeEventListener("touchend", onFirst); document.removeEventListener("pointerdown", onFirst); document.removeEventListener("keydown", onFirst); };
    document.addEventListener("touchend", onFirst, { passive: true });
    document.addEventListener("pointerdown", onFirst, { passive: true });
    document.addEventListener("keydown", onFirst, { passive: true });
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.target instanceof Element)) return;
      const el = e.target.closest(".sfx-button, .sfx-badge");
      if (!el) return;
      if (el.classList.contains("sfx-button")) playButton(el.classList.contains("sfx-silver") ? "silver" : "outline");
      else if (el.matches("a, button, [role=button]")) playBadge(); /* decorative badges (avatars, tags) stay silent */
    };
    /* the dome highlight follows the cursor across metal buttons */
    const onMove = (e: PointerEvent) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>(".sfx-button");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${Math.round(((e.clientX - r.left) / r.width) * 100)}%`);
    };
    const onLeave = (e: PointerEvent) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>(".sfx-button");
      if (el) el.style.removeProperty("--mx");
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    return () => { document.removeEventListener("scroll", onScroll, { capture: true }); document.removeEventListener("touchend", onFirst); document.removeEventListener("pointerdown", onFirst); document.removeEventListener("keydown", onFirst); document.removeEventListener("pointerdown", onDown); document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerout", onLeave); };
  }, []);
  return null;
}
