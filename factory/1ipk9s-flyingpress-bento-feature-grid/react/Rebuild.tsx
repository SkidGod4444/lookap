"use client";
/*
  FlyingPress Bento Feature Grid — rebuild of a design by Ashik (@AshikArtistry)
  Source: https://x.com/AshikArtistry/status/2110310645874729396
  React 19 + Tailwind v4 + Motion port of factory/1ipk9s-flyingpress-bento-feature-grid/index.html.
  Everything is drawn in CSS / inline SVG; the logos and the FlyingPress "F" are original stand-in drawings.
*/
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useAnimate, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react";

export const fonts: string[] = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500&display=swap",
];

const u = (n: number) => `calc(${n} * var(--u))`;
const P = 6; // the clip's loop, seconds
type Ease = [number, number, number, number] | "linear";
const EIO: Ease = [0.42, 0, 0.58, 1]; // ease-in-out
const EI: Ease = [0.42, 0, 1, 1]; // ease-in
const EO: Ease = [0, 0, 0.58, 1]; // ease-out
const EASE: Ease = [0.25, 0.1, 0.25, 1]; // CSS ease
const E3: Ease = [0.3, 0, 0.25, 1];

type Frame = { easing?: Ease; [k: string]: string | number | Ease | undefined };
type Pt = [number, Frame];
type Loop = { animate: TargetAndTransition; transition: Transition };

/* the HTML's K(): keyframes at seconds, per-keyframe easing for the segment that follows, looped forever */
const K = (pts: Pt[], dur = P, ease: Ease = EIO): Loop => {
  const c = pts.filter((p, i) => !(i + 1 < pts.length && pts[i + 1][0] === p[0]));
  const keys = Object.keys(c[0][1]).filter((k) => k !== "easing");
  const tr = { duration: dur, times: c.map(([t]) => t / dur), ease: c.slice(0, -1).map(([, f]) => f.easing ?? ease), repeat: Infinity, repeatType: "loop" as const };
  return {
    animate: Object.fromEntries(keys.map((k) => [k, c.map(([, f]) => f[k] as string | number)])) as TargetAndTransition,
    transition: Object.fromEntries(keys.map((k) => [k, tr])) as Transition,
  };
};
const O = (pts: [number, number][]) => K(pts.map(([t, o]) => [t, { opacity: o }]));
const merge = (...ls: Loop[]): Loop => ({ animate: Object.assign({}, ...ls.map((l) => l.animate)), transition: Object.assign({}, ...ls.map((l) => l.transition)) });
/* start a loop `d` seconds in (a negative delay), so its phase matches a clock that began earlier */
const late = (l: Loop, d: number): Loop => d ? {
  animate: l.animate,
  transition: Object.fromEntries(Object.entries(l.transition as Record<string, object>).map(([k, v]) => [k, { ...v, delay: -d }])) as Transition,
} : l;

/* ---- card 3: metric pills built from a table ---- */
const C: Record<string, string> = { good: "#2fb565", poor: "#ec4a43", warn: "#f2a23a" };
const L: Record<string, string> = { good: "Good", poor: "Poor", warn: "Needs work" };
type Val = [number, string, string, string, number, string?];
const M: { n: string; d: string; slots: string[]; vals: Val[] }[] = [
  { n: "CLS", d: "Cumulative Layout Shift", slots: ["T", "B", "M"], vals: [[0, "0.02", "", "good", 0.17], [2.6, "0.31", "", "poor", 0.7], [4.75, "0.12", "", "poor", 0.45], [5.0, "0.05", "", "poor", 0.3], [5.75, "0.02", "", "good", 0.17]] },
  { n: "LCP", d: "Largest Contentful Paint", slots: ["M", "T", "B"], vals: [[0, "4.2", "s", "poor", 0.25], [0.6, "2.8", "s", "poor", 0.35], [0.9, "1.5", "s", "poor", 0.86, "good"], [1.6, "1.2", "s", "good", 0.8], [4.6, "4.2", "s", "poor", 0.25]] },
  { n: "INP", d: "Interaction to Next Paint", slots: ["B", "M", "T"], vals: [[0, "48", "ms", "good", 0.8], [0.6, "380", "ms", "warn", 0.93], [2.9, "375", "ms", "warn", 0.9], [3.1, "175", "ms", "warn", 0.55], [3.3, "71", "ms", "warn", 0.6], [3.75, "48", "ms", "good", 0.8]] },
];
const S: Record<string, number[]> = { T: [43, 39, 1, 1, 2], M: [14, 129, 1.07, 1, 3], B: [43, 219, 1, 0.5, 1], U: [43, -35, 0.96, 0, 1], D: [43, 280, 0.96, 0, 1] };
const sf = (k: string): Frame => { const [x, y, s, o, z] = S[k]; return { transform: `translate(${u(x)}, ${u(y)}) scale(${s})`, opacity: o, zIndex: z }; };
const cwv = () => M.map((m) => {
  // position: C state at t=0, transitions to A at 0.3, B at 2.3, C at 4.3 (0.3 s each)
  const seq = [m.slots[2], ...m.slots], pts: Pt[] = [[0, sf(seq[0])]];
  [0.3, 2.3, 4.3].forEach((tau, i) => {
    const a = seq[i], b = seq[i + 1];
    pts.push([tau, sf(a)]);
    if (a === "T") pts.push([tau + 0.3, sf("U")], [tau + 0.32, sf("D")], [tau + 0.62, sf("B")]);
    else pts.push([tau + 0.3, sf(b)]);
  });
  pts.push([P, sf(seq[0])]);
  // value swaps: each variant shows from its time to the next
  const swaps = m.vals.map(([t], i) => {
    const t1 = i + 1 < m.vals.length ? m.vals[i + 1][0] : P, f = 0.12;
    const q: [number, number][] = i === 0 ? [[0, 1], [t1, 1], [t1 + f, 0], [P, 0]] : [[0, 0], [t - f, 0], [t, 1], [Math.min(t1, P), 1], ...(t1 < P ? ([[t1 + f, 0], [P, 0]] as [number, number][]) : [])];
    return O(q);
  });
  return { m, move: K(pts, P, E3), swaps };
});

/* ---- card 4: faint app tiles that fade in and out ---- */
// solid grey glyphs with white cut-outs, as in the clip
const GF = "#d8d0cc", W = 'stroke="#fff" fill="none" stroke-width="1.5"';
const G = [`<rect x="1" y="1" width="14" height="14" rx="3.2" fill="${GF}"/><path d="M5.2 11.6L8 4.4l2.8 7.2M6.2 9.3h3.6" ${W}/>`,
  `<rect x="1.5" y="3" width="13" height="11.5" rx="2.6" fill="${GF}"/><path d="M5 1.5v3M11 1.5v3" stroke="${GF}" stroke-width="1.8"/><circle cx="8" cy="9" r="2.6" ${W}/><circle cx="8" cy="9" r=".9" fill="#fff"/>`,
  `<path d="M3.5 1h6l3.5 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2 13.5v-11A1.5 1.5 0 0 1 3.5 1z" fill="${GF}"/><path d="M8 5v5M5.5 7.5h5M5.5 12h5" ${W}/>`,
  `<rect x="1" y="2" width="14" height="12" rx="2.6" fill="${GF}" fill-opacity=".45" stroke="${GF}" stroke-width="1.3"/><path d="M5.6 6L3.8 8l1.8 2M10.4 6l1.8 2-1.8 2M8.9 5.4L7.1 10.6" stroke="${GF}" stroke-width="1.4" fill="none"/>`,
  `<path d="M7 9.5l-1.5 1.5a2.1 2.1 0 0 1-3-3L4 6.5M9 6.5l1.5-1.5a2.1 2.1 0 0 1 3 3L12 9.5M6.5 9.5l3-3" stroke="${GF}" stroke-width="2.4" fill="none"/>`,
  `<path d="M3.5 1.5h9v2.2c0 1.9-2.4 3.2-3.2 4.3.8 1.1 3.2 2.4 3.2 4.3v2.2h-9v-2.2c0-1.9 2.4-3.2 3.2-4.3-.8-1.1-3.2-2.4-3.2-4.3z" fill="${GF}"/>`,
  `<circle cx="8" cy="8" r="6.5" fill="${GF}"/><path d="M5.3 8.2l1.8 1.8 3.6-3.8" ${W}/>`];
const T4 = [[10, -22, 2, 0], [146, -22, 6, 1.2], [282, -22, 3, 3], [10, 32, 4, 4.2], [78, 32, 4, 0.6], [146, 32, 5, 4.9], [214, 32, 2, 3.6], [282, 32, 3, 5], [80, 100, 1, 1.4], [146, 100, 0, 2.6], [212, 100, 6, 0.2], [180, 150, 2, 4.6]];
const tiles4 = () => T4.map(([x, y, g, d]) => {
  const a = d, b = (d + 2.5) % P;
  const pts: [number, number][] = a < b ? [[0, 1], [a, 1], [a + 0.5, 0.08], [b, 0.08], [b + 0.5 > P ? P : b + 0.5, 1], [P, 1]] : [[0, 0.08], [b, 0.08], [b + 0.5, 1], [a, 1], [Math.min(a + 0.5, P), 0.08], [P, 0.08]];
  return { x, y, svg: G[g], fade: O(pts) };
});

/* ---- card 6: logo tiles; top row runs left, bottom row runs right, 48 px/s ---- */
const LF = "#e5dfdb";
const LG: Record<string, string> = {
  W: `<circle cx="8" cy="8" r="7" fill="${LF}" stroke="none"/><path d="M4.2 5.6l1.9 5 1.9-4 1.9 4 1.9-5" stroke="#fff" stroke-width="1.6"/>`,
  E: `<circle cx="8" cy="8" r="7" fill="${LF}" stroke="none"/><path d="M5.8 4.8v6.4M8.6 4.8h2.4M8.6 8h2.4M8.6 11.2h2.4" stroke="#fff" stroke-width="1.5" stroke-linecap="butt"/>`,
  P: `<path d="M8 3v10M3 8h10" stroke="${LF}" stroke-width="1"/>`,
  G: `<g fill="${LF}" stroke="none"><rect x="2" y="2" width="5.2" height="5.2" rx="1"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1" opacity=".6"/><rect x="2" y="8.8" width="5.2" height="5.2" rx="1" opacity=".6"/><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1"/></g>`,
  C: `<path d="M6 12.5h6.2a2.7 2.7 0 0 0 .2-5.4A3.8 3.8 0 0 0 5.2 6.6 3 3 0 0 0 6 12.5z" fill="${LF}" stroke="none"/><path d="M.8 8.2h3M.3 10.2h3.2M1 12.2h2.6" stroke="${LF}" stroke-width="1.1"/>`,
  S: `<path d="M2 6h9M4 9h10M2 12h8" stroke="${LF}"/>`, _: "",
};
const tx = (x: number): Frame => ({ transform: `translateX(${u(x)})` });
const rowT = () => K([[0, tx(-288.3)], [11, tx(-816.3)]], 11, "linear");
// bottom row: an 88 px step (one tile pitch) per 2 s beat from 1.4 s: 62 px by +0.5 s (judged in the clip), the last 26 px easing out by +1.0 s; 5 tiles = 440 px, so 10 s closes it
const rowB = () => {
  const x0 = -800, pts: Pt[] = [[0, { ...tx(x0 - 17), easing: EO }], [0.4, tx(x0)]];
  for (let k = 0; k < 5; k++) pts.push([1.4 + 2 * k, { ...tx(x0 + 88 * k), easing: EI }], [1.9 + 2 * k, { ...tx(x0 + 88 * k + 62), easing: EO }], ...(k < 4 ? ([[2.4 + 2 * k, tx(x0 + 88 * (k + 1))]] as Pt[]) : []));
  pts.push([10, tx(x0 + 423)]);
  return K(pts, 10, "linear");
};

/* ---- card 5: three bubbles orbit clockwise, 60°/s ---- */
// a 100° eased burst at the start of each beat (1.4, 3.4, 5.4 s), a slow 20° drift between
const OR = [[0, 65.3], [1.4, 84], [1.9, 184], [3.4, 204], [3.9, 304], [5.4, 324], [5.9, 424], [P, 425.3]];
const ok = (t: number, d: number): Frame => ({ rotate: d, easing: [1.4, 3.4, 5.4].includes(t) ? EIO : "linear" });
const ARMS = [294, 29, 159];

/* ---- cards 1 and 2: the clip's scripted timeline ---- */
const A1: [number, number][] = [[0, 1], [2.3, 1], [2.45, 0], [4.85, 0], [5.0, 1], [P, 1]];
const I1 = A1.map(([t, o]) => [t, 1 - o] as [number, number]);
const cp = (x: number, y: number, s = 1): Frame => ({ transform: `translate(${u(x)}, ${u(y)}) scale(${s})` });
const sw = (pts: [number, number][]) => ({
  track: K(pts.map(([s, on]) => [s, { backgroundColor: on ? "#f8792a" : "#e6e6ea" }])),
  knob: K(pts.map(([s, on]) => [s, { transform: `translateX(${u(on ? 15 : 0)})` }])),
});
const st = (dy: number, dx: number, s: number) => ({ transform: `translate(${u(dx)}, ${u(dy)}) scale(${s})` });
const fold = (dy: number, s: number, bg: string) => {
  const a = { ...st(0, 0, 1), backgroundColor: "#fff" }, b = { ...st(dy, -30, s), backgroundColor: bg };
  return K([[0, a], [2.3, a], [2.62, b], [4.45, b], [4.8, a], [P, a]], P, E3);
};
const kids: [number, number][] = [[0, 1], [2.3, 1], [2.45, 0], [4.6, 0], [4.75, 1], [P, 1]];
const script = () => ({
  sA: O(A1), sI: O(I1),
  lI: O([[0, 0], [2.3, 0], [2.45, 1], [4.35, 1], [4.45, 0], [P, 0]]),
  lO: O([[0, 0], [4.35, 0], [4.45, 1], [4.85, 1], [5.0, 0], [P, 0]]),
  ct: O([[0, 1], [2.3, 1], [2.45, 0.5], [4.85, 0.5], [5.0, 1], [P, 1]]),
  btn: K([[0, { transform: "scale(1)", filter: "brightness(1)" }], [4.3, { transform: "scale(1)", filter: "brightness(1)" }], [4.42, { transform: "scale(.97)", filter: "brightness(.93)" }], [4.62, { transform: "scale(1)", filter: "brightness(1)" }], [P, { transform: "scale(1)", filter: "brightness(1)" }]]),
  cursor: K([[0, cp(347, 417)], [3.45, cp(347, 417)], [3.95, cp(297, 378)], [4.35, cp(297, 378)], [4.42, cp(297, 378, 0.88)], [4.55, cp(297, 378)], [5.6, cp(297, 378)], [6.0, cp(347, 417)], [P, cp(347, 417)]]),
  tg: [sw([[0, 1], [1.5, 1], [1.68, 0], [4.1, 0], [4.3, 1], [P, 1]]), sw([[0, 1], [0.9, 1], [1.08, 0], [3.7, 0], [3.88, 1], [P, 1]]), sw([[0, 1], [0.42, 1], [0.6, 0], [4.1, 0], [4.3, 1], [P, 1]])],
  // collapse into one pill 2.3–2.6, fan out 4.3–4.6
  p1: fold(80.6, 0.94, "#f4f4f5"), p3: fold(-52, 0.88, "#ebebed"), kids: O(kids),
  l2a: O([[0, 1], [2.4, 1], [2.55, 0], [4.5, 0], [4.65, 1], [P, 1]]), l2b: O([[0, 0], [2.4, 0], [2.55, 1], [4.5, 1], [4.65, 0], [P, 0]]),
});

/* ---- shared drawings ---- */
const FMark = () => (
  <svg viewBox="0 0 75 75" className="block h-full w-full">
    {[["#b94700", ".4", "translate(.6 1.8)"], ["#fff", undefined, undefined]].map(([fill, opacity, transform], i) => (
      <g key={i} fill={fill} opacity={opacity} transform={transform}>
        <path d="M60 23.5H34c-6 0-9 2.6-12 8L14.5 48h5.4l5.6-11.6c1.7-3.3 3.6-4.6 7.2-4.6h21.8c2.6 0 4.2-1.2 5.5-3.6z" />
        <path d="M53 36.5H37.5c-4.6 0-7 2.2-9.2 6.2L21.5 56h5.4l5.3-10.4c1-2 2.4-2.9 4.6-2.9h11.5c2.2 0 3.6-1 4.7-3.2z" />
      </g>
    ))}
  </svg>
);
const ficonBg = "radial-gradient(48% 30% at 50% 4%,#ffe54a 0%,rgba(255,214,40,.85) 40%,rgba(255,180,20,0) 100%),radial-gradient(80% 55% at 50% 0%,rgba(255,196,24,.75) 0%,rgba(255,160,20,0) 100%),linear-gradient(#fb9a10,#f8800b 45%,#ee6905 100%)";
const Ficon = ({ x, y, s, shadow }: { x: number; y: number; s: number; shadow?: string }) => (
  <div className="absolute rounded-[22%]" style={{ left: u(x), top: u(y), width: u(s), height: u(s), background: ficonBg, boxShadow: shadow ?? `inset 0 ${u(1.5)} 0 rgba(255,226,90,.9),inset 0 ${u(-3)} ${u(5)} rgba(190,60,0,.35)` }}>
    <FMark />
  </div>
);
const bigShadow = (a: string) => `inset 0 ${u(2)} ${u(2)} rgba(255,255,255,.55),inset 0 ${u(-5)} ${u(9)} rgba(190,60,0,.35),0 ${u(12)} ${u(24)} rgba(245,110,20,${a})`;
const dots = (mask: string): CSSProperties => ({
  backgroundImage: `radial-gradient(circle,rgba(205,100,35,.42) ${u(0.55)},transparent ${u(0.85)}),radial-gradient(circle,rgba(205,100,35,.22) ${u(0.45)},transparent ${u(0.75)})`,
  backgroundSize: `${u(6)} ${u(6)},${u(9)} ${u(9)}`, backgroundPosition: `0 0,${u(3)} ${u(5)}`, WebkitMaskImage: mask, maskImage: mask,
});
const Card = ({ x, y, bg, mask, children }: { x: number; y: number; bg: string; mask?: string; children: ReactNode }) => (
  <div className="absolute h-[calc(382*var(--u))] w-[calc(360*var(--u))] overflow-hidden rounded-[calc(20*var(--u))] bg-white" style={{ left: u(x), top: u(y), background: bg }}>
    {children}
    {mask && <div className="pointer-events-none absolute inset-0" style={dots(mask)} />}
  </div>
);
const Copy = ({ title, lines }: { title: string; lines: [string, string] }) => (
  <>
    <h3 className="absolute left-[calc(22*var(--u))] top-[calc(289*var(--u))] z-[5] m-0 text-[length:calc(20*var(--u))] leading-[calc(24*var(--u))] font-medium tracking-[-.02em] text-[#141416]">{title}</h3>
    <p className="absolute left-[calc(22*var(--u))] top-[calc(325*var(--u))] z-[5] m-0 whitespace-nowrap text-[length:calc(13.5*var(--u))] leading-[calc(17*var(--u))] tracking-[-.008em] text-[#58585f]">{lines[0]}<br />{lines[1]}</p>
  </>
);
const badge = "absolute flex h-[calc(18*var(--u))] items-center gap-[calc(4*var(--u))] whitespace-nowrap rounded-[calc(9*var(--u))] px-[calc(8*var(--u))] text-[length:calc(10.5*var(--u))] font-medium";
const dot = <i className="h-[calc(5*var(--u))] w-[calc(5*var(--u))] rounded-full bg-current" />;
const tpShadow = `0 ${u(8)} ${u(20)} rgba(150,80,30,.13),0 0 0 ${u(1)} rgba(0,0,0,.025)`;
const glyph = (inner: string) => `<svg viewBox="0 0 16 16" fill="none" stroke="#c4c4ca" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const Lt = ({ k }: { k: string }) => k === "K" ? (
  <div className="relative h-[calc(75*var(--u))] w-[calc(163*var(--u))] flex-none rounded-[calc(16*var(--u))] bg-[rgba(255,255,255,.28)] shadow-[inset_0_0_0_calc(1*var(--u))_rgba(245,226,212,.5)]">
    <span className="absolute inset-0 flex items-center justify-center text-[length:calc(22*var(--u))] font-bold tracking-[-.01em] text-[#e2dcd8]">Kinsta</span>
  </div>
) : (
  <div className="relative h-[calc(75*var(--u))] w-[calc(75*var(--u))] flex-none rounded-[calc(16*var(--u))] bg-[rgba(255,255,255,.28)] shadow-[inset_0_0_0_calc(1*var(--u))_rgba(245,226,212,.5)] [&>svg]:absolute [&>svg]:inset-[22%] [&>svg]:h-[56%] [&>svg]:w-[56%]"
    dangerouslySetInnerHTML={{ __html: LG[k] ? glyph(LG[k]) : "" }} />
);
const rowCls = "absolute left-0 flex h-[calc(75*var(--u))] gap-[calc(13*var(--u))]";

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  const reduced = useReducedMotion();
  const still = !!reduced; // reduced motion: no ambient loops and no timeline
  const timeline = demo && !still;
  const [lag] = useState(() => (demo || typeof performance === "undefined" ? 0 : performance.now() / 1000));
  const data = useMemo(() => ({ cwv: cwv(), tiles: tiles4(), rowT: rowT(), rowB: rowB(), script: script() }), []);
  const orbit = useMemo(() => ({ orb: K(OR.map(([t, d]) => [t, ok(t, d)])), bubs: ARMS.map((r) => K(OR.map(([t, d]) => [t, ok(t, -r - d)]))) }), []);
  const sc = data.script;

  /* pointer-driven state (the HTML without ?demo) */
  const [c1, setC1] = useState({ off: false, busy: false });
  const [on, setOn] = useState([true, false, false]);
  const [btnScope, animateBtn] = useAnimate<HTMLDivElement>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const click = () => {
    if (timeline || c1.busy) return;
    if (!c1.off) { setC1({ off: true, busy: false }); return; }
    setC1({ off: true, busy: true });
    if (!still) animateBtn(btnScope.current, { transform: ["scale(1)", "scale(.97)", "scale(1)"] }, { duration: 0.26, ease: "linear" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setC1({ off: false, busy: false }), 600);
  };
  const fade = still ? { duration: 0 } : { duration: 0.2, ease: EASE };
  const op = (l: Loop, v: number): Loop => (timeline ? l : { animate: { opacity: v }, transition: { opacity: fade } });
  // the HTML's ambient WAAPI loops run on the page's clock from load; without demo, the port's loops share that phase
  const amb = (l: Loop) => (still ? {} : late(l, lag));
  const sA = op(sc.sA, c1.off ? 0 : 1), sI = op(sc.sI, c1.off ? 1 : 0);
  const lI = op(sc.lI, c1.off && !c1.busy ? 1 : 0), lO = op(sc.lO, c1.busy ? 1 : 0), ct = op(sc.ct, c1.off ? 0.5 : 1);
  const tgFade = still ? { duration: 0 } : { duration: 0.25, ease: EASE };
  const tgl = (i: number): { track: Loop; knob: Loop } => timeline
    ? { track: i === 1 ? sc.tg[i].track : merge(sc.tg[i].track, sc.kids), knob: sc.tg[i].knob }
    : { track: { animate: { backgroundColor: on[i] ? "#f8792a" : "#e6e6ea" }, transition: { backgroundColor: tgFade } }, knob: { animate: { transform: `translateX(${u(on[i] ? 15 : 0)})` }, transition: { transform: tgFade } } };
  const kid = timeline ? sc.kids : {};

  const chip = (left: number, width: number, label: string) => (
    <div key={label} className="absolute top-[calc(191*var(--u))] z-[1] flex h-[calc(24*var(--u))] items-center rounded-[calc(12*var(--u))] bg-white pl-[calc(24*var(--u))] text-[length:calc(11*var(--u))] text-[#4a4a50] shadow-[0_calc(2*var(--u))_calc(6*var(--u))_rgba(160,90,40,.08)]" style={{ left: u(left), width: u(width) }}>
      <svg viewBox="0 0 12 12" className="absolute left-[calc(7*var(--u))] top-[calc(6*var(--u))] h-[calc(12*var(--u))] w-[calc(12*var(--u))]">
        <motion.circle cx="6" cy="6" r="6" fill="#2fb565" {...sA} />
        <motion.path d="M3.4 6.2l1.8 1.8 3.4-3.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...sA} />
        <motion.circle cx="6" cy="6" r="5.3" fill="none" stroke="#c9c9cf" strokeWidth="1.2" {...sI} />
      </svg>
      <motion.span {...ct}>{label}</motion.span>
    </div>
  );
  const tp = (i: number, x: number, y: number, icon: ReactNode, label: ReactNode, extra?: { z: number; l: Loop; still: CSSProperties }) => {
    const t = tgl(i);
    return (
      <motion.div className="absolute h-[calc(52*var(--u))] w-[calc(300*var(--u))] rounded-[calc(26*var(--u))] bg-white text-[length:calc(12.5*var(--u))] font-medium text-[#45454b]"
        style={{ left: u(x), top: u(y), zIndex: extra && timeline ? extra.z : i === 1 ? 3 : 2, boxShadow: tpShadow }} {...(extra && timeline ? extra.l : {})}>
        {icon}
        {label}
        <motion.div className="absolute right-[calc(18*var(--u))] top-[calc(16*var(--u))] h-[calc(20*var(--u))] w-[calc(35*var(--u))] cursor-pointer rounded-[calc(10*var(--u))] bg-[#e6e6ea]"
          onClick={() => !timeline && setOn((o) => o.map((v, j) => (j === i ? !v : v)))} {...t.track}>
          <motion.b className="absolute left-[calc(2*var(--u))] top-[calc(2*var(--u))] h-[calc(16*var(--u))] w-[calc(16*var(--u))] rounded-full bg-white shadow-[0_calc(1*var(--u))_calc(2*var(--u))_rgba(0,0,0,.18)]" {...t.knob} />
        </motion.div>
      </motion.div>
    );
  };
  const ic = "absolute left-[calc(19*var(--u))] top-[calc(17*var(--u))] h-[calc(18*var(--u))] w-[calc(18*var(--u))]";
  const lb = "absolute left-[calc(46*var(--u))] top-0 whitespace-nowrap leading-[calc(52*var(--u))]";

  return (
    <div className={`relative h-[calc(1080*var(--u))] w-[calc(1200*var(--u))] overflow-hidden bg-[#f1f1f3] font-[Inter,system-ui,sans-serif] leading-[normal] text-[#141416] antialiased ${className ?? ""}`}
      style={unit ? ({ ["--u" as string]: unit } as CSSProperties) : undefined}>
      {/* header */}
      <div className="absolute left-1/2 top-[calc(67*var(--u))] flex h-[calc(30*var(--u))] -translate-x-1/2 items-center gap-[calc(6*var(--u))] rounded-[calc(15*var(--u))] bg-white px-[calc(12*var(--u))] text-[length:calc(12*var(--u))] font-medium text-[#2a2a2e] shadow-[0_calc(1*var(--u))_calc(2*var(--u))_rgba(0,0,0,.04)]">
        <svg viewBox="0 0 12 12" fill="none" stroke="#55555c" strokeWidth="1.2" strokeLinecap="round" className="h-[calc(12*var(--u))] w-[calc(12*var(--u))]"><circle cx="6" cy="6" r="2.2" /><path d="M6 .8v1.4M6 9.8v1.4M.8 6h1.4M9.8 6h1.4M2.3 2.3l1 1M8.7 8.7l1 1M2.3 9.7l1-1M8.7 3.3l1-1" /></svg>Why FlyingPress
      </div>
      <h1 className="absolute left-0 right-0 top-[calc(110*var(--u))] m-0 text-center font-['Inter_Tight',Inter,sans-serif] text-[length:calc(48*var(--u))] leading-[calc(52*var(--u))] font-medium tracking-[-.055em] text-[#111113]">Real-time WordPress optimization</h1>
      <div className="absolute left-0 right-0 top-[calc(174*var(--u))] text-center text-[length:calc(15.5*var(--u))] leading-[calc(20*var(--u))] tracking-[-.01em] text-[#4b4b52]">FlyingPress optimizes your site with real-visitor Core Web Vitals, the same data Google uses to rank it.</div>

      {/* card 1: Easy to Use */}
      <Card x={45} y={234} mask="radial-gradient(30% 22% at 0% 0%,#000 30%,transparent)" bg="radial-gradient(60% 44% at 0% 0%,#f9cfaa 0%,#fbe0c9 45%,rgba(254,242,234,0) 100%),linear-gradient(#fef3eb,#fef6f0 18%,#fff 60%)">
        <div className="absolute left-[calc(33*var(--u))] top-[calc(49*var(--u))] z-[1] h-[calc(117*var(--u))] w-[calc(292*var(--u))] rounded-[calc(14*var(--u))] bg-white" style={{ boxShadow: `0 ${u(10)} ${u(26)} rgba(170,90,30,.13),0 0 0 ${u(1)} rgba(0,0,0,.03)` }}>
          <Ficon x={14} y={14} s={34} />
          <div className="absolute left-[calc(58*var(--u))] top-[calc(15*var(--u))] text-[length:calc(13.5*var(--u))] font-semibold tracking-[-.01em]">FlyingPress</div>
          <div className="absolute left-[calc(58*var(--u))] top-[calc(33*var(--u))] text-[length:calc(10.5*var(--u))] text-[#8d8d95]">Speed optimization</div>
          <motion.div className={`${badge} right-[calc(12*var(--u))] top-[calc(20*var(--u))] bg-[#e7f8ec] text-[#26a95a]`} {...sA}>{dot}Active</motion.div>
          <motion.div className={`${badge} right-[calc(12*var(--u))] top-[calc(20*var(--u))] bg-[#f2f2f4] text-[#8d8d95]`} {...sI}>{dot}Inactive</motion.div>
          <motion.div ref={btnScope} onClick={click} className="absolute left-[calc(15*var(--u))] top-[calc(62*var(--u))] h-[calc(40*var(--u))] w-[calc(265*var(--u))] cursor-pointer rounded-[calc(10*var(--u))] bg-[linear-gradient(#fb8a3b,#f6741f)]"
            style={{ boxShadow: `inset 0 ${u(1)} 0 rgba(255,255,255,.35),0 ${u(4)} ${u(10)} rgba(240,110,20,.25)` }} {...(timeline ? sc.btn : {})}>
            {[
              [sA, <><svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[calc(12*var(--u))] w-[calc(12*var(--u))]"><path d="M2 6.3l2.6 2.5L10 3.2" /></svg>Optimized</>, undefined],
              [lI, "Optimize my site", undefined],
              [lO, "Optimizing...", `blur(${u(2.6)})`],
            ].map(([m, label, filter], i) => (
              <motion.span key={i} className="absolute inset-0 flex items-center justify-center gap-[calc(6*var(--u))] text-[length:calc(13*var(--u))] font-semibold text-white" style={{ filter: filter as string | undefined }} {...(m as Loop)}>{label as ReactNode}</motion.span>
            ))}
          </motion.div>
        </div>
        {chip(55, 73, "Caching")}{chip(143, 70, "Images")}{chip(235, 76, "CSS & JS")}
        <Copy title="Easy to Use" lines={["Click once and FlyingPress applies caching, image", "and code optimizations for you."]} />
      </Card>

      {/* card 2: Fewer Settings */}
      <Card x={420} y={234} mask="radial-gradient(46% 42% at 43.5% 14%,#000 30%,transparent)" bg="radial-gradient(42% 38% at 43.5% 0%,#f6a464 0%,#f8b986 35%,#fbd5b8 65%,rgba(253,232,216,0) 100%),radial-gradient(70% 60% at 43.5% 0%,rgba(252,220,196,.8),rgba(255,255,255,0)),linear-gradient(90deg,#fbdcc4,rgba(255,255,255,0) 25%,rgba(255,255,255,0) 75%,#fdeee2),#fff">
        {tp(0, 45, 49,
          <motion.svg className={ic} viewBox="0 0 14 14" {...kid}><path d="M3.5 1h4.8L12 4.7V11.5A1.5 1.5 0 0 1 10.5 13h-7A1.5 1.5 0 0 1 2 11.5v-9A1.5 1.5 0 0 1 3.5 1z" fill="#d2d2d7" /><path d="M4.6 7h4.8M4.6 9.6h3.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" /></motion.svg>,
          <motion.span className={lb} {...kid}>Page Caching</motion.span>,
          { z: 2, l: sc.p1, still: {} })}
        {tp(1, 16, 120,
          <svg className={ic} viewBox="0 0 14 14"><rect x="1" y="2" width="12" height="10" rx="1.6" fill="#d2d2d7" /><circle cx="4.6" cy="5.4" r="1.3" fill="#fff" /><path d="M1 11.2l3.6-3.4 2.4 2.2 2.2-2.4 3.8 3.8V12H1z" fill="#fff" /></svg>,
          <>
            <motion.span className={lb} {...(timeline ? sc.l2a : {})}>Image Optimization</motion.span>
            <motion.span className={`${lb} font-bold text-[#18181b]`} style={{ opacity: 0 }} {...(timeline ? sc.l2b : {})}>All optimizations</motion.span>
          </>)}
        {tp(2, 45, 191,
          <motion.svg className={ic} viewBox="0 0 14 14" {...kid}><path d="M1.5 4.5h3.2l1-1.8h2.6l1 1.8h3.2v7A1.5 1.5 0 0 1 11 13H3a1.5 1.5 0 0 1-1.5-1.5z" fill="#d2d2d7" /><path d="M7 1v4M5.4 3.4L7 5l1.6-1.6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" /></motion.svg>,
          <motion.span className={lb} {...kid}>Critical CSS</motion.span>,
          { z: 1, l: sc.p3, still: {} })}
        <Copy title="Fewer Settings to Configure" lines={["Speeding up sites should be easy. FlyingPress", "comes with a few settings to configure."]} />
      </Card>

      {/* card 3: Core Web Vitals */}
      <Card x={795} y={234} mask="radial-gradient(32% 48% at 0% 50%,#000 40%,transparent)" bg="radial-gradient(26% 42% at 0% 50%,#e6975a 0%,#e99c60 45%,#f0b083 65%,rgba(250,215,190,.5) 82%,rgba(252,226,206,0) 100%),radial-gradient(60% 40% at 0% 0%,#fde6d4,rgba(255,255,255,0)),#fff">
        <Copy title="Optimize for Core Web Vitals" lines={["Every setting targets LCP, INP and CLS, the three", "metrics Google uses to judge page experience."]} />
        {data.cwv.map(({ m, move, swaps }) => (
          <motion.div key={m.n} className="absolute left-0 top-0 h-[calc(64*var(--u))] w-[calc(295*var(--u))] rounded-[calc(32*var(--u))] bg-white"
            style={{ boxShadow: `0 ${u(8)} ${u(22)} rgba(150,80,30,.11),0 0 0 ${u(1)} rgba(0,0,0,.025)`, ...(still ? (sf(m.slots[0]) as CSSProperties) : {}) }} {...amb(move)}>
            <div className="absolute left-[calc(7*var(--u))] top-[calc(6*var(--u))] h-[calc(52*var(--u))] w-[calc(52*var(--u))]">
              {m.vals.map(([, v, un, s, p, rc], i) => (
                <motion.div key={i} className="absolute inset-0" style={still ? { opacity: i ? 0 : 1 } : undefined} {...amb(swaps[i])}>
                  <svg viewBox="0 0 52 52" className="absolute inset-0 h-full w-full"><circle cx="26" cy="26" r="23" fill="none" stroke="#eeeef0" strokeWidth="4.4" /><circle cx="26" cy="26" r="23" fill="none" stroke={C[rc || s]} strokeWidth="4.4" strokeLinecap="round" strokeDasharray={`${(144.5 * p).toFixed(1)} 200`} transform="rotate(-90 26 26)" /></svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[length:calc(12*var(--u))] font-semibold text-[#2a2a2e]">{v}<small className="ml-[calc(1*var(--u))] mt-[calc(3*var(--u))] text-[length:calc(7.5*var(--u))] font-medium">{un}</small></div>
                </motion.div>
              ))}
            </div>
            <div className="absolute left-[calc(72*var(--u))] top-[calc(13*var(--u))] text-[length:calc(13*var(--u))] font-semibold">{m.n}</div>
            <div className="absolute left-[calc(72*var(--u))] top-[calc(32*var(--u))] whitespace-nowrap text-[length:calc(10.5*var(--u))] text-[#8a8a92]">{m.d}</div>
            {m.vals.map(([, , , s], i) => (
              <motion.div key={i} className={`${badge} right-[calc(16*var(--u))] top-[calc(23*var(--u))] ${s === "good" ? "bg-[#e7f8ec] text-[#26a95a]" : s === "poor" ? "bg-[#fdeceb] text-[#ec4a43]" : "bg-[#fff4e2] text-[#eaa43a]"}`}
                style={still ? { opacity: i ? 0 : 1 } : undefined} {...amb(swaps[i])}>{L[s]}</motion.div>
            ))}
          </motion.div>
        ))}
      </Card>

      {/* card 4: All in One */}
      <Card x={45} y={631} bg="radial-gradient(35% 40% at 47% 60%,#f8a866 0%,rgba(250,190,140,0) 100%),linear-gradient(#fffaf6,#fde6d3 40%,#fbc699 70%)">
        <div>
          {data.tiles.map((t, i) => (
            <motion.div key={i} className="absolute h-[calc(50*var(--u))] w-[calc(50*var(--u))] rounded-[calc(12*var(--u))] bg-[rgba(255,255,255,.42)] shadow-[0_calc(2*var(--u))_calc(6*var(--u))_rgba(220,140,80,.08)]" style={{ left: u(t.x), top: u(t.y) }} {...amb(t.fade)}>
              <svg viewBox="0 0 16 16" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-[22%] h-[56%] w-[56%]" dangerouslySetInnerHTML={{ __html: t.svg }} />
            </motion.div>
          ))}
        </div>
        <div className="absolute left-[calc(-554*var(--u))] top-[calc(19*var(--u))] h-[calc(722*var(--u))] w-[calc(722*var(--u))] rounded-full bg-white" />
        <div className="absolute left-[calc(172*var(--u))] top-[calc(19*var(--u))] h-[calc(722*var(--u))] w-[calc(722*var(--u))] rounded-full bg-white" />
        <div className="absolute left-0 top-[calc(252*var(--u))] h-[calc(140*var(--u))] w-full bg-white" />
        <div className="absolute left-[calc(110*var(--u))] top-[calc(170*var(--u))] h-[calc(110*var(--u))] w-[calc(140*var(--u))] rounded-full bg-[radial-gradient(closest-side,rgba(250,120,30,.45),rgba(250,120,30,0))]" />
        <Ficon x={133} y={174} s={75} shadow={bigShadow(".45")} />
        <Copy title="All in One Solution" lines={["No need to install multiple plugins. FlyingPress will", "take care of everything."]} />
      </Card>

      {/* card 5: Great Support */}
      <Card x={420} y={631} bg="#fdf3eb">
        {[[304, "#feede3", "#fcebdf"], [224, "#fde9d9", "#fae5d5"], [144, "radial-gradient(closest-side,#fbd3b8 50%,#fadcc3 75%,#fae2ca 100%)", "#f6dcc8"]].map(([d, bg, ring]) => (
          <div key={d} className="absolute left-[calc(180*var(--u))] top-[calc(147*var(--u))] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: u(d as number), height: u(d as number), background: bg as string, boxShadow: `0 0 0 ${u(1)} ${ring}` }} />
        ))}
        <div className="absolute left-[calc(143*var(--u))] top-[calc(110*var(--u))] h-[calc(74*var(--u))] w-[calc(74*var(--u))] rounded-full"
          style={{ background: "radial-gradient(70% 40% at 50% 0%,#ffd21c 0%,rgba(255,180,20,.5) 50%,rgba(255,160,20,0) 100%),linear-gradient(#fb940f,#f77c0a 50%,#ec6604)", boxShadow: `inset 0 ${u(1.5)} 0 rgba(255,226,90,.95),inset 0 ${u(-4)} ${u(8)} rgba(190,60,0,.3),0 ${u(10)} ${u(22)} rgba(249,115,22,.45)` }}>
          <svg viewBox="0 0 28 37" fill="#fff" className="absolute left-[31%] top-[24%] h-[50%] w-[38%]" style={{ filter: `drop-shadow(0 ${u(2)} ${u(1.5)} rgba(170,60,0,.45))` }}><circle cx="14" cy="8" r="7.2" /><path d="M6 18h16a6 6 0 0 1 6 6v8a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-8a6 6 0 0 1 6-6z" /></svg>
        </div>
        <motion.div className="absolute left-[calc(180*var(--u))] top-[calc(147*var(--u))] h-0 w-0" {...amb(orbit.orb)}>
          {ARMS.map((r, i) => (
            <div key={r} className="absolute left-0 top-0 h-0 w-0" style={{ transform: `rotate(${r}deg)` }}>
              <motion.div className="absolute left-[calc(-19*var(--u))] top-[calc(-137*var(--u))] h-[calc(38*var(--u))] w-[calc(38*var(--u))] rounded-full bg-white shadow-[0_calc(3*var(--u))_calc(8*var(--u))_rgba(200,100,30,.18)] [&>svg]:absolute [&>svg]:inset-[22%] [&>svg]:h-[56%] [&>svg]:w-[56%]"
                style={still ? { transform: `rotate(${-r}deg)` } : undefined} {...amb(orbit.bubs[i])}>
                {i === 0 && <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.5" fill="#f97316" /><path d="M5.8 6.2a2.2 2.2 0 1 1 3.2 2c-.7.4-1 .8-1 1.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><circle cx="8" cy="12" r=".9" fill="#fff" /></svg>}
                {i === 1 && <svg viewBox="0 0 16 16"><path d="M3 2l9.5 5-4.2 1.1L6.4 12z" fill="#f97316" stroke="#f97316" strokeWidth="1" strokeLinejoin="round" /><path d="M9 9l3 3" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                {i === 2 && <svg viewBox="0 0 16 16" fill="none" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 9V8a5.5 5.5 0 0 1 11 0v1" /><rect x="1.8" y="8.5" width="3" height="4.5" rx="1.2" fill="#f97316" /><rect x="11.2" y="8.5" width="3" height="4.5" rx="1.2" fill="#f97316" /><path d="M13 13c0 1.3-1.5 2-3.5 2" /></svg>}
              </motion.div>
            </div>
          ))}
        </motion.div>
        <Copy title="Great Support" lines={["Support you can count on, whether it's technical or", "need help in setting up."]} />
      </Card>

      {/* card 6: Compatibility */}
      <Card x={795} y={631} bg="radial-gradient(90% 55% at 60% 0%,#fde2cd 0%,#fff1e7 50%,#fff 100%)">
        <motion.div className={`${rowCls} top-[calc(15*var(--u))]`} style={still ? { transform: `translateX(${u(-355)})` } : undefined} {...amb(data.rowT)}>
          {Array.from({ length: 3 }, (_, r) => ["W", "_", "K", "G", "_"].map((k, i) => <Lt key={`${r}${i}`} k={k} />))}
        </motion.div>
        <div className={`${rowCls} top-[calc(109*var(--u))]`} style={{ left: u(-33.5) }}>
          {["_", "C", "_", "P", "_"].map((k, i) => <Lt key={i} k={k} />)}
        </div>
        <motion.div className={`${rowCls} top-[calc(199*var(--u))]`} style={still ? { transform: `translateX(${u(-800)})` } : undefined} {...amb(data.rowB)}>
          {Array.from({ length: 4 }, (_, r) => ["E", "_", "P", "S", "_"].map((k, i) => <Lt key={`${r}${i}`} k={k} />))}
        </motion.div>
        <div className="absolute left-[calc(115*var(--u))] top-[calc(110*var(--u))] h-[calc(110*var(--u))] w-[calc(130*var(--u))] rounded-full bg-[radial-gradient(closest-side,rgba(250,120,30,.45),rgba(250,120,30,0))]" />
        <Ficon x={143} y={109} s={75} shadow={bigShadow(".4")} />
        <Copy title="Compatibility" lines={["Compatible with all major WordPress hosting", "providers, themes & plugins."]} />
      </Card>

      {/* the clip's pointer, only on the scripted timeline */}
      {timeline && (
        <motion.div className="pointer-events-none absolute left-0 top-0 z-20 h-[calc(24*var(--u))] w-[calc(18*var(--u))]" {...sc.cursor}>
          <svg viewBox="0 0 18 24" className="block h-full w-full"><path d="M1.5 1.5v18l4.6-4.3 3 6.6 3-1.4-3-6.4h6.2z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </motion.div>
      )}
    </div>
  );
}
