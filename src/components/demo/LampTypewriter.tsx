"use client";

import { useEffect, useRef } from "react";

/* The lamp carriage typewriter clone from the second lookap run: a 498x700 phone screen at --u px per source px, every
   value measured from the clip. Type to drive the carriage along the rod; the sun switches the night scene and the lamp
   strikes on, lighting a cone on the paper that follows the caret. Styles are scoped under .tw and use native CSS nesting.
   The CSS was ported as-is from the measured HTML build, so the numbers stay the numbers in the recipe. */
const CSS = `
@property --cx { syntax: '<number>'; inherits: true; initial-value: 101; }
@keyframes ignite { 0% { opacity: 0 } 18% { opacity: .55 } 30% { opacity: .15 } 44% { opacity: .9 } 58% { opacity: .5 } 72% { opacity: 1 } 84% { opacity: .85 } 100% { opacity: 1 } }
@keyframes flicker { 0%, 100% { opacity: 1 } 23% { opacity: .965 } 41% { opacity: .99 } 57% { opacity: .95 } 78% { opacity: .985 } }
@keyframes strike { 0% { opacity: 1 } 35% { opacity: .55 } 50% { opacity: 1 } 70% { opacity: .7 } 85% { opacity: .3 } 100% { opacity: 0 } }
@keyframes swing { 0% { transform: rotate(0) } 25% { transform: rotate(9deg) } 55% { transform: rotate(-5deg) } 80% { transform: rotate(2deg) } 100% { transform: rotate(0) } }
.tw-wrap{container-type:inline-size;width:100%;display:flex;justify-content:center}
.tw {

  --u: min(1px, calc(100cqw / 498));
  --bg: #171717;
  --fg: #adafa5;
  --paper: #ede6db;
  --paper-night: #343533;
  --paper-night-side: #3e3d3a;
  --lamp-warm: 226, 209, 174;
  --ink: #35332e;
  --hint: #5e574f;
  --rod-top: #343b3d; --rod-mid: #585f61; --rod-bot: #1e2023; --rod-cap: #303636;
  --rod-top-n: #37372a; --rod-mid-n: #0a0a08; --rod-bot-n: #2e3022; --rod-cap-n: #10110f;
  --olive: #6f8164; --olive-hi: #8c9a80; --olive-lo: #4e5a46;
  --metal: #585f61; --metal-hi: #8a9093;
  --kb: #2d2c2a; --key: #4a4948; --key-dark: #413f3e; --key-text: #ffffff;
  --kb-n: #1f201e; --key-n: #3d3e3c; --key-dark-n: #343434;
  --ctrl: #302f29; --ctrl-n: #ada69b;
  --track-n: #6c6d6b; --thumb-n: #e8e4d8;
  --font-type: var(--font-special-elite), "Courier New", monospace;
  --font-mono: var(--font-courier-prime), "Courier New", monospace;
  --font-ui: -apple-system, "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif;
  color-scheme: dark;

.screen {
  position: relative; width: calc(498 * var(--u)); height: calc(700 * var(--u)); max-width: 100%;
  background: var(--bg); overflow: hidden; user-select: none; -webkit-user-select: none;
  outline: none;
}
.screen:focus-visible { box-shadow: 0 0 0 2px #6c6d6b; }
.key { position: absolute; left: 0; top: 0; width: 1px; height: 1px; opacity: 0; border: 0; padding: 0; margin: 0; font-size: 16px; }
.screen:has(.key:focus) { box-shadow: 0 0 0 2px #6c6d6b; }
/* ---------- top bar ---------- */
.top { position: absolute; left: 0; right: 0; top: 0; height: calc(140 * var(--u)); }
.top .back { position: absolute; left: calc(46 * var(--u)); top: calc(91 * var(--u)); width: calc(16 * var(--u)); height: calc(16 * var(--u)); }
.top .count {
  position: absolute; right: calc(82 * var(--u)); top: calc(86 * var(--u));
  font-family: var(--font-mono); font-size: calc(13 * var(--u)); letter-spacing: .08em; color: var(--fg);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.top .share { position: absolute; left: calc(443 * var(--u)); top: calc(87 * var(--u)); width: calc(19 * var(--u)); height: calc(20 * var(--u)); }
.top svg { stroke: var(--fg); fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; width: 100%; height: 100%; }
/* ---------- paper: top at 210, elliptical corners 55 x 180 (measured), bottom at 688 ---------- */
.paper {
  position: absolute; left: 0; top: calc(210 * var(--u)); width: calc(498 * var(--u)); height: calc(478 * var(--u));
  border-radius: calc(55 * var(--u)) calc(55 * var(--u)) 0 0 / calc(180 * var(--u)) calc(180 * var(--u)) 0 0;
  background: var(--paper); overflow: hidden;
  transition: background-color 300ms ease;
}
.specks { position: absolute; inset: 0; pointer-events: none; }
.specks i { position: absolute; border-radius: 50%; background: #2a2622; }
.night .specks i { background: #0d0d0b; }
.paper::before { /* paper grain */
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .85; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .18 0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>");
}
.paper::after { /* a few ink specks like the clip */
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .35;
  background:
    radial-gradient(circle, #222 0 1px, transparent 1.6px) calc(140 * var(--u)) calc(30 * var(--u)) / 100% 100% no-repeat,
    radial-gradient(circle, #222 0 1px, transparent 1.6px) calc(380 * var(--u)) calc(70 * var(--u)) / 100% 100% no-repeat,
    radial-gradient(circle, #222 0 .8px, transparent 1.4px) calc(300 * var(--u)) calc(250 * var(--u)) / 100% 100% no-repeat,
    radial-gradient(circle, #222 0 .8px, transparent 1.4px) calc(90 * var(--u)) calc(330 * var(--u)) / 100% 100% no-repeat;
}
.night .paper { background: var(--paper-night); }
/* lamp cone: apex at the lamp head, opens upward. --spread in degrees, --reach in source px, --glow 0..1 */
.cone {
  position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0;
  transition: opacity 300ms ease, --cx 180ms cubic-bezier(.3,.7,.3,1); /* light travels with the lamp */
  --cx: 101; --cy: 246; /* apex in paper coords (lamp head at screen y 456 -> 456-210) */
  --spread: 144; --reach: 250; --glow: .95;
  background: radial-gradient(circle at calc(var(--cx) * var(--u)) calc(var(--cy) * var(--u)),
    rgba(var(--lamp-warm), var(--glow)) 0,
    rgba(var(--lamp-warm), calc(var(--glow) * .72)) calc(var(--reach) * .35 * var(--u)),
    rgba(var(--lamp-warm), calc(var(--glow) * .28)) calc(var(--reach) * .7 * var(--u)),
    rgba(var(--lamp-warm), 0) calc(var(--reach) * var(--u)));
  /* soft-edged cone: a conic mask opening upward, feathered 14deg on each side */
  --half: 72deg;
  -webkit-mask-image: conic-gradient(from calc(-1 * var(--half)) at calc(var(--cx) * var(--u)) calc(var(--cy) * var(--u)),
    rgba(0,0,0,0) 0deg, #000 14deg, #000 calc(2 * var(--half) - 14deg), rgba(0,0,0,0) calc(2 * var(--half)), rgba(0,0,0,0) 360deg);
          mask-image: conic-gradient(from calc(-1 * var(--half)) at calc(var(--cx) * var(--u)) calc(var(--cy) * var(--u)),
    rgba(0,0,0,0) 0deg, #000 14deg, #000 calc(2 * var(--half) - 14deg), rgba(0,0,0,0) calc(2 * var(--half)), rgba(0,0,0,0) 360deg);
}
/* lamp ignition: paper dims first, then the lamp strikes on with a short flicker, then a faint idle flicker */
.night.lamp .cone { opacity: 1; animation: ignite 520ms steps(1, end) 1, flicker 3.6s ease-in-out 600ms infinite; }
/* lamp glow halo on the paper right at the head */
.cone i { position: absolute; left: calc((var(--cx) - 36) * var(--u)); top: calc((var(--cy) - 16) * var(--u)); width: calc(72 * var(--u)); height: calc(32 * var(--u)); border-radius: 50%; background: radial-gradient(ellipse, rgba(255,245,215,.9), rgba(255,245,215,0) 70%); }
/* typed text: bottom-anchored just above the rod (last line bottom at screen y 432), 26px type, 34px leading */
.text {
  position: absolute; left: calc(100 * var(--u)); right: calc(58 * var(--u)); bottom: calc(256 * var(--u));
  font-family: var(--font-type); font-size: calc(26 * var(--u)); line-height: calc(34 * var(--u));
  color: var(--ink); white-space: pre-wrap; word-break: break-word; min-height: calc(34 * var(--u));
  text-shadow: 0 0 calc(0.6 * var(--u)) rgba(0,0,0,.25);
}
.night .text { color: #2a2924; }
.text .ph { opacity: .9; }
.hint {
  position: absolute; left: 0; right: 0; top: calc(104 * var(--u)); text-align: center;
  font-family: var(--font-type); font-size: calc(12 * var(--u)); letter-spacing: .02em; color: var(--hint);
  transition: opacity 200ms;
}
.hint.off, .night .hint { opacity: 0; }
/* measuring span for the caret position */
.measure { position: absolute; visibility: hidden; white-space: pre; font-family: var(--font-type); font-size: calc(26 * var(--u)); left: 0; top: 0; }
/* ---------- rod: 467-493, end caps 0-20 and 478-498 ---------- */
.rod {
  position: absolute; left: 0; top: calc(467 * var(--u)); width: 100%; height: calc(26 * var(--u));
  background: linear-gradient(180deg, var(--rod-top) 0%, var(--rod-mid) 22%, var(--rod-mid) 50%, var(--rod-bot) 100%);
  box-shadow: 0 calc(3 * var(--u)) calc(6 * var(--u)) rgba(0,0,0,.35);
  transition: background 300ms;
}
.night .rod { background: linear-gradient(180deg, var(--rod-top-n) 0%, #1b1b14 20%, var(--rod-mid-n) 55%, var(--rod-bot-n) 100%); }
.rod::before, .rod::after {
  content: ""; position: absolute; top: calc(-2 * var(--u)); width: calc(20 * var(--u)); height: calc(30 * var(--u)); border-radius: calc(3 * var(--u));
  background: linear-gradient(180deg, #1d2223, var(--rod-cap) 40%, #141718);
}
.rod::before { left: 0; }
.rod::after { right: 0; }
.night .rod::before, .night .rod::after { background: linear-gradient(180deg, #1a1a16, var(--rod-cap-n) 40%, #050505); }
/* ---------- carriage: capsule 92 x 46 at y 458, centre follows the caret ---------- */
.carriage {
  position: absolute; left: 0; top: calc(428 * var(--u)); width: calc(92 * var(--u)); height: calc(76 * var(--u));
  transform: translateX(calc((var(--x) - 46) * var(--u)));
  transition: transform 180ms cubic-bezier(.3,.7,.3,1);
  --x: 101;
}
.capsule {
  position: absolute; left: 0; top: calc(30 * var(--u)); width: calc(92 * var(--u)); height: calc(46 * var(--u));
  border-radius: calc(23 * var(--u));
  background:
    radial-gradient(60% 90% at 30% 20%, rgba(255,255,255,.16), transparent 70%),
    linear-gradient(180deg, var(--olive-hi) 0%, var(--olive) 30%, var(--olive) 55%, var(--olive-lo) 100%);
  box-shadow: inset 0 calc(1 * var(--u)) 0 rgba(255,255,255,.22), inset 0 calc(-2 * var(--u)) calc(3 * var(--u)) rgba(0,0,0,.35), 0 calc(4 * var(--u)) calc(8 * var(--u)) rgba(0,0,0,.45);
}
.night .capsule {
  background:
    radial-gradient(50% 120% at 78% 30%, rgba(255,225,170,.28), transparent 70%),
    linear-gradient(180deg, #4e4836 0%, #343022 30%, #2a2719 55%, #1a1812 100%);
  box-shadow: inset 0 calc(1 * var(--u)) 0 rgba(255,235,190,.18), inset 0 calc(-2 * var(--u)) calc(3 * var(--u)) rgba(0,0,0,.5), 0 calc(4 * var(--u)) calc(8 * var(--u)) rgba(0,0,0,.6);
}
/* clamp band under the lamp post, with a rivet above and below */
.capsule .ring {
  position: absolute; left: calc(56 * var(--u)); top: calc(-3 * var(--u)); width: calc(16 * var(--u)); height: calc(52 * var(--u)); border-radius: calc(3 * var(--u));
  background: linear-gradient(90deg, #4d5350, #7d8483 35%, #656b6a 65%, #3f4443);
  box-shadow: inset 0 0 0 calc(1 * var(--u)) rgba(0,0,0,.4), 0 calc(2 * var(--u)) calc(4 * var(--u)) rgba(0,0,0,.4);
}
.capsule .ring::before, .capsule .ring::after {
  content: ""; position: absolute; left: calc(3 * var(--u)); width: calc(10 * var(--u)); height: calc(7 * var(--u)); border-radius: calc(2 * var(--u));
  background: linear-gradient(180deg, #9aa09e, #5a605e); box-shadow: 0 calc(1 * var(--u)) calc(2 * var(--u)) rgba(0,0,0,.5);
}
.capsule .ring::before { top: calc(-6 * var(--u)); }
.capsule .ring::after { bottom: calc(-6 * var(--u)); }
.night .capsule .ring { background: linear-gradient(90deg, #2f2d24, #5a5444 35%, #4a4537 65%, #262419); }
.night .capsule .ring::before, .night .capsule .ring::after { background: linear-gradient(180deg, #6e6755, #3a362b); }
.capsule .led { position: absolute; top: calc(18 * var(--u)); width: calc(6 * var(--u)); height: calc(6 * var(--u)); border-radius: 50%; }
.led.g { left: calc(10 * var(--u)); background: #39d44a; box-shadow: 0 0 calc(4 * var(--u)) #39d44a; }
.led.o { left: calc(23 * var(--u)); background: #2a2a24; }
.led.k { left: calc(36 * var(--u)); background: #141412; }
.night .led.o { background: #ff8a2a; box-shadow: 0 0 calc(4 * var(--u)) #ff8a2a; }
/* lamp: post 51px from the capsule's left, 30 tall, T-bar on top, glowing head bar on the capsule */
.post { position: absolute; left: calc(62 * var(--u)); top: 0; width: calc(4 * var(--u)); height: calc(30 * var(--u)); background: linear-gradient(90deg, #2a2d2b, #0e100f); }
.post::before { content: ""; position: absolute; left: calc(-9 * var(--u)); top: 0; width: calc(22 * var(--u)); height: calc(4 * var(--u)); border-radius: calc(2 * var(--u)); background: #101211; }
.head { position: absolute; left: calc(52 * var(--u)); top: calc(27 * var(--u)); width: calc(24 * var(--u)); height: calc(4 * var(--u)); border-radius: calc(1.5 * var(--u)); background: #b9b2a3; }
.night.lamp .head { background: #fff2c8; box-shadow: 0 0 calc(6 * var(--u)) rgba(255,240,200,.9), 0 0 calc(18 * var(--u)) rgba(255,230,180,.6); animation: ignite 520ms steps(1, end) 1; }
/* hammer strike on each keystroke: a bright vertical bar with a cool halo at the caret */
/* measured: arc spans the capsule height (y 455-507) just right of the clamp band, with a cool halo */
.strike { position: absolute; top: calc(29 * var(--u)); left: calc(78 * var(--u)); width: calc(12 * var(--u)); height: calc(48 * var(--u)); pointer-events: none;
  animation: strike 260ms steps(1, end) forwards; }
.strike svg { width: 100%; height: 100%; overflow: visible; fill: none; stroke: #fff; stroke-width: 1.1; stroke-linejoin: round; stroke-linecap: round;
  filter: drop-shadow(0 0 calc(1.5 * var(--u)) #fff) drop-shadow(0 0 calc(5 * var(--u)) rgba(170,240,210,.85)) drop-shadow(0 0 calc(12 * var(--u)) rgba(110,200,160,.45)); }
.strike::before { content: ""; position: absolute; inset: calc(-4 * var(--u)) calc(-8 * var(--u)); border-radius: 50%; background: radial-gradient(ellipse, rgba(150,230,190,.3), rgba(150,230,190,0) 70%); }
.led.blink { background: #ff8a2a !important; box-shadow: 0 0 calc(4 * var(--u)) #ff8a2a !important; }
/* a thread hangs from the carriage and swings when it moves */
.thread { position: absolute; left: calc(74 * var(--u)); top: calc(74 * var(--u)); width: calc(1 * var(--u)); height: calc(70 * var(--u)); transform-origin: top center; opacity: 0; transition: opacity 400ms;
  background: linear-gradient(180deg, rgba(235,235,225,.35), rgba(235,235,225,.12) 70%, rgba(235,235,225,0)); }
.night .thread { opacity: 1; }
.thread.swing { animation: swing 800ms ease-out; }
/* bright vertical beam just above the head, like the clip */
.beam { position: absolute; left: calc(58 * var(--u)); top: calc(-34 * var(--u)); width: calc(12 * var(--u)); height: calc(64 * var(--u)); opacity: 0; transition: opacity 300ms;
  background: radial-gradient(ellipse 50% 50% at 50% 70%, rgba(255,250,230,.95), rgba(255,245,215,.35) 45%, rgba(255,240,200,0) 75%); filter: blur(calc(1.2 * var(--u))); }
.night.lamp .beam { opacity: 1; animation: ignite 520ms steps(1, end) 1; }
/* typewriter imperfection: each glyph sits a hair off the baseline with its own ink weight */
.text .typed span { position: relative; }
/* cobwebs (night only, like the clip's halloween skin) */
.webs { position: absolute; left: 0; top: calc(440 * var(--u)); width: calc(498 * var(--u)); height: calc(120 * var(--u)); pointer-events: none; opacity: 0; transition: opacity 400ms; }
.night .webs { opacity: 1; }
.webs svg { width: 100%; height: 100%; }
.webs path { fill: none; stroke: rgba(235,235,225,.34); stroke-width: .8; }
.webs path.t { stroke: rgba(235,235,225,.22); stroke-width: .55; }
/* ---------- controls: toggle always, sliders in night ---------- */
.toggle { position: absolute; left: calc(430 * var(--u)); top: calc(640 * var(--u)); width: calc(36 * var(--u)); height: calc(36 * var(--u)); cursor: pointer; background: none; border: 0; padding: 0; }
.toggle svg { width: 100%; height: 100%; stroke: var(--ctrl); fill: none; stroke-width: 1.5; stroke-linecap: round; }
.toggle .disc { fill: var(--ctrl); stroke: none; }
.night .toggle svg { stroke: var(--ctrl-n); }
.night .toggle .disc { fill: var(--ctrl-n); }
.toggle:focus-visible { outline: 1px solid var(--fg); border-radius: 50%; }
.sliders { position: absolute; left: 0; top: calc(628 * var(--u)); width: calc(420 * var(--u)); height: calc(50 * var(--u)); opacity: 0; pointer-events: none; transition: opacity 250ms; }
.night .sliders { opacity: 1; pointer-events: auto; }
.sl { position: absolute; top: 0; height: 100%; }
.sl .lab { position: absolute; top: calc(-2 * var(--u)); left: calc(7 * var(--u)); right: 0; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: calc(12 * var(--u)); letter-spacing: .12em; color: var(--ctrl-n); white-space: nowrap; }
.sl .lab b { font-weight: 400; letter-spacing: .08em; }
.sl input { position: absolute; left: 0; bottom: 0; margin: 0; width: 100%; height: calc(22 * var(--u)); -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer;
  background-image:
    linear-gradient(var(--track-n), var(--track-n)),
    repeating-linear-gradient(90deg, var(--track-n) 0 calc(1 * var(--u)), transparent calc(1 * var(--u)) calc(12.2 * var(--u)));
  background-size: 100% calc(1.5 * var(--u)), 100% calc(9 * var(--u)); background-position: 0 50%, 0 50%; background-repeat: no-repeat; }
.sl input::-webkit-slider-thumb { -webkit-appearance: none; width: calc(9 * var(--u)); height: calc(16 * var(--u)); border-radius: calc(2 * var(--u)); background: var(--thumb-n); box-shadow: inset 0 0 0 calc(1 * var(--u)) #9c9a90, inset calc(3 * var(--u)) 0 0 #9c9a90, inset calc(-3 * var(--u)) 0 0 #9c9a90; border: 0; }
.sl input::-moz-range-thumb { width: calc(9 * var(--u)); height: calc(16 * var(--u)); border-radius: calc(2 * var(--u)); background: var(--thumb-n); border: 0; }
.sl input:focus-visible { outline: 1px solid var(--fg); }
.sl.light { left: calc(21 * var(--u)); width: calc(110 * var(--u)); }
.sl.spread { left: calc(155 * var(--u)); width: calc(110 * var(--u)); }
.sl.reach { left: calc(290 * var(--u)); width: calc(104 * var(--u)); }
.caption { position: absolute; left: 0; right: 0; bottom: 0; height: calc(12 * var(--u)); }
@media (prefers-reduced-motion: reduce) { .carriage, .paper, .cone, .rod { transition: none; } }
}
`;

/* seeded so the paper never changes between renders, and the server and the client draw the same specks */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
const SPECKS = (() => {
  const rnd = seeded(11), out: { x: string; y: string; s: string; o: string }[] = [];
  for (let i = 0; i < 70; i++) { const s = (0.6 + rnd() * 1.6).toFixed(2), x = (rnd() * 498).toFixed(1), y = (rnd() * 478).toFixed(1), o = (0.25 + rnd() * 0.5).toFixed(2); out.push({ x, y, s, o }); }
  return out;
})();
const WEBS = (() => {
  const rnd = seeded(7), out: { d: string; thin: boolean }[] = [];
  for (const [cx, w] of [[70, 110], [230, 90], [420, 110]]) {
    for (let i = 0; i < 16; i++) {
      const x0 = cx - w / 2 + rnd() * w * 0.4, x1 = cx + w / 2 - rnd() * w * 0.4;
      const y0 = 22 + rnd() * 28, y1 = 22 + rnd() * 28, ya = 10 + rnd() * 44, yb = 10 + rnd() * 44;
      out.push({ d: `M${x0.toFixed(1)} ${y0.toFixed(1)} C ${(x0 + (x1 - x0) * 0.3).toFixed(1)} ${ya.toFixed(1)}, ${(x0 + (x1 - x0) * 0.7).toFixed(1)} ${yb.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`, thin: false });
    }
    for (let j = 0; j < 3; j++) {
      const hx = cx - w / 2 + rnd() * w, hy = 44 + rnd() * 10, hl = 30 + rnd() * 50;
      out.push({ d: `M${hx.toFixed(1)} ${hy.toFixed(1)} q ${(rnd() * 6 - 3).toFixed(1)} ${(hl / 2).toFixed(1)} ${(rnd() * 4 - 2).toFixed(1)} ${hl.toFixed(1)}`, thin: true });
    }
  }
  return out;
})();
const BOLTS = ["M7 0 L4 9 L10 16 L3 25 L9 33 L5 41 L7 48", "M7 0 L9 7 L3 15 L10 23 L4 31 L9 39 L6 48", "M7 0 L5 10 L11 17 L5 24 L9 32 L3 40 L8 48"];
const MAX = 3000, TEXT_LEFT = 100, TEXT_RIGHT = 440; /* source px, measured: "Testing halloween" runs 105..350 and wraps before "capsule" */

export function LampTypewriter() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
    const screen = q(".screen"), input = q<HTMLInputElement>(".key"), textEl = q(".text"), ph = q(".ph"), hint = q(".hint"), measure = q(".measure");
    const carriage = q(".carriage"), cone = q(".cone"), count = q(".count"), thread = q(".thread"), toggle = q(".toggle");
    const leds = el.querySelectorAll<HTMLElement>(".led.g, .led.o");
    const rl = q<HTMLInputElement>(".r-light"), rs = q<HTMLInputElement>(".r-spread"), rr = q<HTMLInputElement>(".r-reach");
    let buf = "", night = false, bolt = 0, lampTimer = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const u = () => parseFloat(getComputedStyle(screen).getPropertyValue("--u")) || 0.5;

    const strike = () => {
      if (!night) return;
      const s = document.createElement("div"); s.className = "strike";
      s.innerHTML = `<svg viewBox="0 0 14 48" preserveAspectRatio="none"><path d="${BOLTS[bolt++ % BOLTS.length]}"/></svg>`;
      carriage.appendChild(s);
      later(() => s.remove(), 280);
      leds.forEach((l) => l.classList.add("blink"));
      later(() => leds.forEach((l) => l.classList.remove("blink")), 160);
    };
    /* glyph jitter, seeded by character index so it never changes under the reader */
    const jitter = (i: number) => { let s = (i * 9301 + 49297) % 233280; const r1 = s / 233280; s = (s * 9301 + 49297) % 233280; const r2 = s / 233280; return { y: ((r1 - 0.5) * 1.6).toFixed(2), o: (0.78 + r2 * 0.22).toFixed(2) }; };
    const lastLine = () => buf.split("\n").pop() ?? "";
    const render = () => {
      const empty = buf.length === 0;
      ph.hidden = !empty; hint.classList.toggle("off", !empty);
      let t = textEl.querySelector<HTMLElement>(".typed");
      if (!t) { t = document.createElement("span"); t.className = "typed"; textEl.appendChild(t); }
      let html = "";
      for (let i = 0; i < buf.length; i++) {
        const c = buf[i];
        if (c === "\n" || c === " ") { html += c; continue; }
        const j = jitter(i);
        html += `<span style="top:calc(${j.y} * var(--u));opacity:${j.o}">${c === "<" ? "&lt;" : c === "&" ? "&amp;" : c}</span>`;
      }
      t.innerHTML = html;
      count.textContent = `${buf.length} / 3 000`;
      /* caret x: width of the last visual line; soft wraps are found by walking the last paragraph word by word */
      measure.textContent = lastLine();
      let w = measure.getBoundingClientRect().width / u();
      const maxW = TEXT_RIGHT - TEXT_LEFT;
      if (w > maxW) {
        const words = lastLine().split(" "); let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          measure.textContent = test;
          if (measure.getBoundingClientRect().width / u() > maxW && line) line = word; else line = test;
        }
        measure.textContent = line; w = measure.getBoundingClientRect().width / u();
      }
      const x = Math.max(96, Math.min(TEXT_LEFT + w + 2, 446));
      carriage.style.setProperty("--x", String(x));
      cone.style.setProperty("--cx", String(x + 5));
    };
    const act = (a: "bs" | "enter" | "char", ch = "") => {
      if (a === "bs") buf = buf.slice(0, -1);
      else if (a === "enter") { if (buf.length < MAX) buf += "\n"; }
      else if (buf.length < MAX) { buf += ch; strike(); }
      render();
      thread.classList.remove("swing"); void thread.offsetWidth; thread.classList.add("swing");
    };
    /* keys arrive through a hidden input so phones raise their keyboard; Backspace and Enter from keydown, letters from input */
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") { e.preventDefault(); act("bs"); }
      else if (e.key === "Enter") { e.preventDefault(); act("enter"); }
    };
    const onInput = () => {
      for (const ch of input.value) if (ch !== "\n") act("char", ch);
      input.value = "";
    };
    const focus = () => { try { input.focus({ preventScroll: true }); } catch {} };
    const onToggle = (e: Event) => {
      e.stopPropagation();
      night = !night; screen.classList.toggle("night", night);
      clearTimeout(lampTimer);
      if (night) lampTimer = window.setTimeout(() => screen.classList.add("lamp"), 380); /* paper dims first, lamp strikes on after */
      else screen.classList.remove("lamp");
      focus();
    };
    const lamp = () => {
      const lv = +rl.value, sp = +rs.value, re = +rr.value;
      q(".v-light").textContent = ["Low", "Mid", "High"][lv];
      q(".v-spread").textContent = `${sp}°`;
      q(".v-reach").textContent = `${re}%`;
      cone.style.setProperty("--glow", String([0.9, 1, 1][lv]));
      cone.style.setProperty("--spread", String(sp));
      cone.style.setProperty("--half", `${sp / 2}deg`);
      cone.style.setProperty("--reach", String(Math.round((re * 230) / 210 * (lv === 0 ? 1 : lv === 1 ? 1.25 : 1.5))));
    };
    input.addEventListener("keydown", onKey);
    input.addEventListener("input", onInput);
    screen.addEventListener("click", focus);
    toggle.addEventListener("click", onToggle);
    [rl, rs, rr].forEach((r) => r.addEventListener("input", lamp));
    const ro = new ResizeObserver(render);
    ro.observe(screen);
    lamp(); render();
    return () => {
      timers.forEach(clearTimeout); clearTimeout(lampTimer); ro.disconnect();
      input.removeEventListener("keydown", onKey); input.removeEventListener("input", onInput); screen.removeEventListener("click", focus); toggle.removeEventListener("click", onToggle);
      [rl, rs, rr].forEach((r) => r.removeEventListener("input", lamp));
    };
  }, []);

  return (
    <div ref={root} className="tw-wrap">
      <style>{CSS}</style>
      <div className="tw">
        <div className="screen" aria-label="Typewriter. Click it and type. Tap the sun to switch the lamp on.">
          <input className="key" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Type here" />
          <div className="top">
            <svg className="back" viewBox="0 0 16 16"><path d="M9 2L3 8l6 6M3 8h12" /></svg>
            <div className="count">0 / 3 000</div>
            <svg className="share" viewBox="0 0 19 20"><path d="M9.5 1v12M5.5 5l4-4 4 4M3 9v9h13V9" /></svg>
          </div>
          <div className="paper">
            <div className="specks">{SPECKS.map((p, i) => <i key={i} style={{ left: `calc(${p.x} * var(--u))`, top: `calc(${p.y} * var(--u))`, width: `calc(${p.s} * var(--u))`, height: `calc(${p.s} * var(--u))`, opacity: Number(p.o) }} />)}</div>
            <div className="cone"><i /></div>
            <div className="hint">Need a first line?</div>
            <div className="text"><span className="ph">Begin here.</span></div>
            <span className="measure" />
          </div>
          <div className="rod" />
          <div className="webs"><svg viewBox="0 0 498 120" preserveAspectRatio="none">{WEBS.map((w, i) => <path key={i} className={w.thin ? "t" : undefined} d={w.d} />)}</svg></div>
          <div className="carriage">
            <div className="post" />
            <div className="head" />
            <div className="beam" />
            <div className="thread" />
            <div className="capsule"><span className="led g" /><span className="led o" /><span className="led k" /><span className="ring" /></div>
          </div>
          <div className="sliders">
            <div className="sl light"><div className="lab"><span>LIGHT</span><b className="v-light">Low</b></div><input className="r-light" type="range" min="0" max="2" step="1" defaultValue="0" aria-label="Light" /></div>
            <div className="sl spread"><div className="lab"><span>SPREAD</span><b className="v-spread">144°</b></div><input className="r-spread" type="range" min="40" max="180" step="1" defaultValue="144" aria-label="Spread" /></div>
            <div className="sl reach"><div className="lab"><span>REACH</span><b className="v-reach">210%</b></div><input className="r-reach" type="range" min="50" max="250" step="1" defaultValue="210" aria-label="Reach" /></div>
          </div>
          <button type="button" className="toggle" aria-label="Switch the lamp">
            <svg viewBox="0 0 36 36"><circle className="disc" cx="18" cy="18" r="8.5" /><path d="M13.5 22.5l9-9" stroke="#171717" strokeWidth="2.4" /><path d="M18 3.5v4M18 28.5v4M3.5 18h4M28.5 18h4M7.5 7.5l3 3M25.5 25.5l3 3M7.5 28.5l3-3M25.5 10.5l3-3" strokeWidth="2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
