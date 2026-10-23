"use client";
/*
  Tooltip Hover Delay Comparison — design by Juliette (@shedsgns)
  Source: https://x.com/shedsgns/status/2112265023464603894
  React 19 + Tailwind v4 + Motion port of factory/ewfwo2-tooltip-hover-delay-comparison/index.html.
  Every surface, icon, cursor, spinner and shadow is drawn in CSS / inline SVG.
  demo replays the clip's 15.98 s sequence from mount; without it the toolbars answer the pointer.
*/
import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion, motionValue, useAnimate, useReducedMotion, useTransform, type MotionValue } from "motion/react";

export const fonts: string[] = [
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Indie+Flower&display=swap",
];

const D = 15.98;
const px = (n: number) => `calc(${n} * var(--u))`;

type Bez = [number, number, number, number];
type Ease = Bez | "linear";
const EASE: Bez = [0.25, 0.1, 0.25, 1];
const EASE_IN_OUT: Bez = [0.42, 0, 0.58, 1];
const STD: Bez = [0.4, 0, 0.2, 1];

const ICONS: Record<string, ReactNode> = {
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />,
  code: <path d="M8.5 6.5 3 12l5.5 5.5M15.5 6.5 21 12l-5.5 5.5" />,
  quote: <path d="M4 6.5h16M9.5 12h10.5M9.5 17.5h10.5M4.5 10.5v7" />,
};
const LABELS: Record<string, ReactNode> = {
  B: <b className="relative font-bold">B</b>,
  I: <i className="relative font-medium italic">I</i>,
  U: <u className="relative font-semibold underline-offset-[calc(4*var(--u))] decoration-[length:calc(2*var(--u))]">U</u>,
  S: <s className="relative font-semibold decoration-[length:calc(2*var(--u))]">S</s>,
};
// [label, x in toolbar, tooltip, keys]
const BTNS: [string, number, string, string][] = [
  ["B", 156, "Bold", "⌘B"], ["I", 226, "Italic", "⌘I"], ["U", 294, "Underline", "⌘U"],
  ["S", 362, "Strikethrough", "⌘⇧X"], ["link", 438, "Link", "⌘K"], ["code", 506, "Code", "⌘E"], ["quote", 574, "Quote", "⌘⇧9"],
];
const SEGS = [40, 216, 375, 535, 696, 855, 1014];
const CARDS = [
  { top: 48, title: "Delay on every hover", col: "#d02f9e", w: 35, e: 69, segs: 7 },
  { top: 552, title: "Delay once, then instant", col: "#4fd6a6", w: 5, e: 37, segs: 1 },
];
const BTN_X = BTNS.map((b) => 326 + b[1]); // card-relative x of each button
const HOVER_Y = 234; // fingertip y over the toolbar

type Pt = [number, number | string, Ease?];
type Opts = {
  starts: number[]; delay: (k: number) => number; snapOff: (k: number) => boolean; lastLeave: number;
  in: number; rest: [number, number]; rest2: [number, number]; drift: [number, number]; go: number;
  exit: [number, number, number]; exitAt: [number, number]; axis: [number, number];
};
type Refs = {
  content: HTMLDivElement | null; lab: HTMLDivElement | null; cur: HTMLDivElement | null;
  hand: SVGSVGElement | null; arrow: SVGSVGElement | null;
  sqs: (HTMLDivElement | null)[]; tips: (HTMLDivElement | null)[]; segs: (HTMLDivElement | null)[];
};
type Vals = { ms: MotionValue<number>; w: MotionValue<number>; e: MotionValue<number> };

/* the HTML's play(): [time, value, easing] points on the clip timeline, padded to 0 and D; an easing drives the
   segment after its point */
function keys(pts: Pt[], easing: Ease) {
  const kf = pts.map(([t, v, ez]) => ({ t: Math.min(1, Math.max(0, t / D)), v, e: ez || easing }));
  kf.sort((a, b) => a.t - b.t);
  if (kf[0].t > 0) kf.unshift({ ...kf[0], t: 0 });
  if (kf[kf.length - 1].t < 1) kf.push({ ...kf[kf.length - 1], t: 1 });
  for (let i = 1; i < kf.length; i++) if (kf[i].t <= kf[i - 1].t) kf[i].t = kf[i - 1].t + 1e-7;
  return { values: kf.map((k) => k.v), times: kf.map((k) => k.t), ease: kf.slice(0, -1).map((k) => k.e) };
}

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  const reduce = useReducedMotion();
  const timeline = demo && !reduce;
  const [scope, animate] = useAnimate();
  const [refs] = useState<Refs[]>(() => CARDS.map(() => ({ content: null, lab: null, cur: null, hand: null, arrow: null, sqs: [], tips: [], segs: [] })));
  const [vals] = useState<Vals[]>(() => CARDS.map((c) => ({ ms: motionValue(500), w: motionValue(c.w), e: motionValue(c.e) })));

  useLayoutEffect(() => {
    if (!timeline) return;
    const opt = (k: ReturnType<typeof keys>) => ({ duration: D, times: k.times, ease: k.ease });
    // a style property on an element
    const play = (el: HTMLElement | SVGElement | null, prop: "opacity" | "color", pts: Pt[], easing: Ease = "linear") => {
      if (!el) return;
      const k = keys(pts, easing);
      el.style[prop] = String(k.values[0]);
      animate(el, { [prop]: k.values }, opt(k));
    };
    // a number written through a setter (an integer counter, a width, a translate)
    const num = (mv: MotionValue<number>, pts: Pt[], easing: Ease = "linear") => {
      const k = keys(pts, easing);
      mv.set(k.values[0] as number);
      animate(mv, k.values as number[], opt(k));
    };
    const bind = (apply: (v: number) => void) => {
      const mv = motionValue(NaN); // so the first set() always writes, even a 0
      mv.on("change", apply);
      return mv;
    };

    const run = (ci: number, o: Opts) => {
      const c = refs[ci], v = vals[ci];
      const S = o.starts, n = S.length;
      const L = S.map((s, k) => (k < n - 1 ? S[k + 1] - 0.06 : o.lastLeave));
      const E = S.map((s, k) => s + o.delay(k));
      // cursor path
      const cp: [number, [number, number], Ease?][] = [[o.in, o.rest], [o.drift[0], o.rest, EASE_IN_OUT], [o.drift[1], o.rest2], [o.go, o.rest2, STD]];
      S.forEach((s, k) => { cp.push([s, [BTN_X[k], HOVER_Y]]); cp.push([L[k], [BTN_X[k], HOVER_Y], STD]); });
      cp.push([o.exit[0], o.exitAt]);
      const cur = c.cur!;
      const cx = motionValue(0), cy = motionValue(0);
      const place = () => { cur.style.transform = `translate(${px(cx.get())}, ${px(cy.get())})`; };
      cx.on("change", place); cy.on("change", place);
      num(cx, cp.map(([t, p, ez]) => [t, p[0], ez]));
      num(cy, cp.map(([t, p, ez]) => [t, p[1], ez]));
      place();
      play(cur, "opacity", [[o.in - 0.01, 0], [o.in, 0.35], [o.in + 0.15, 1], [o.exit[1], 1], [o.exit[2], 0]]);
      play(c.hand, "opacity", [[S[0] - 0.01, 0], [S[0], 1], [L[n - 1], 1], [L[n - 1] + 0.01, 0]]);
      play(c.arrow, "opacity", [[S[0] - 0.01, 1], [S[0], 0], [L[n - 1], 0], [L[n - 1] + 0.01, 1]]);
      const ms: Pt[] = [[0, 500]];
      S.forEach((s, k) => { ms.push([s - 0.001, 500], [s, o.delay(k) ? 500 : 0], [E[k], 0], [L[k], 0], [L[k] + 0.001, 500]); });
      num(v.ms, ms);
      // hover squares and tooltips
      S.forEach((s, k) => {
        play(c.sqs[k], "opacity", [[s - 0.001, 0], [s + 0.05, 1], [L[k], 1], [L[k] + 0.05, 0]]);
        const tp: Pt[] = o.delay(k) ? [[E[k], 0], [E[k] + 0.15, 1]] : [[s - 0.001, 0], [s, 1]];
        const off: Pt[] = k < n - 1 && o.snapOff(k) ? [[S[k + 1] - 0.001, 1], [S[k + 1], 0]] : [[L[k], 1], [L[k] + 0.22, 0]];
        play(c.tips[k], "opacity", [...tp, ...off]);
      });
      // waiting counter (tenths) and the timeline
      let w = 0;
      const wp: Pt[] = [[0, 0]];
      S.forEach((s, k) => { const d = o.delay(k); if (d) { wp.push([s, w], [E[k], w + d * 10]); w += d * 10; } });
      num(v.w, wp);
      S.forEach((s, k) => {
        const el = c.segs[k];
        if (!el) return;
        num(bind((x) => { el.style.width = px(x); }), o.delay(k) ? [[s, 0], [E[k], 84]] : [[0, 0]]);
      });
      const dur = o.axis[1] - o.axis[0];
      num(v.e, [[o.axis[0], 0], [o.axis[1], Math.round(dur * 10)]]);
      const lab = c.lab!;
      num(bind((x) => { lab.style.transform = `translateX(${px(x)})`; }), [[o.axis[0], 49], [o.axis[1], 49 + 168 * dur]]);
      play(lab, "opacity", [[o.axis[0] - 0.01, 0], [o.axis[0], 1]]);
    };

    // top: every hover waits 500 ms (onsets read from the timeline segments at 15.5 s)
    run(0, { starts: [0.8, 1.86, 2.81, 3.77, 4.73, 5.69, 6.65], delay: () => 0.5, snapOff: () => false, lastLeave: 7.65,
      in: 0, rest: [912, 330], rest2: [856, 332], drift: [0.05, 0.5], go: 0.55,
      exit: [7.85, 7.9, 8.2], exitAt: [952, 290], axis: [0.8, 7.7] });
    // bottom: only the first hover waits; later tooltips swap instantly
    run(1, { starts: [9.3, 10.35, 10.8, 11.2, 11.65, 12.1, 12.5], delay: (k) => (k ? 0 : 0.5), snapOff: () => true, lastLeave: 13.22,
      in: 8.3, rest: [912, 330], rest2: [856, 332], drift: [8.35, 8.9], go: 9.02,
      exit: [13.42, 13.6, 14.0], exitAt: [942, 300], axis: [9.3, 13.0] });
    // both cards dim again as the clip loops (15.72–15.92 s, read from the segment colour)
    play(refs[0].content, "opacity", [[8.0, 1], [8.3, 0.3], [13.4, 0.3], [13.95, 1]], EASE_IN_OUT);
    // at the loop point the top timeline alone fades while the bottom card dims
    refs[0].segs.forEach((e) => play(e, "opacity", [[15.72, 1], [15.98, 0.25]], EASE_IN_OUT));
    play(refs[0].lab, "color", [[15.72, "#1a1a1a"], [15.98, "#b0b0b0"]], EASE_IN_OUT);
    play(refs[1].content, "opacity", [[8.0, 0.3], [8.3, 1], [15.72, 1], [15.92, 0.3]], EASE_IN_OUT);
  }, [timeline, animate, refs, vals]);

  return (
    <div className={className} style={unit ? { ["--u" as string]: unit } : undefined}>
      <div
        ref={scope}
        className="relative h-[calc(1080*var(--u))] w-[calc(1440*var(--u))] overflow-hidden bg-[#fdfdfd] font-[family-name:Inter,system-ui,sans-serif] text-[#1a1a1a]"
      >
        <div className="absolute inset-0 bg-[#f2f2f2]" />
        {CARDS.map((c, ci) => (
          <Card key={ci} ci={ci} r={refs[ci]} v={vals[ci]} pointer={!timeline} reduce={!!reduce} />
        ))}
      </div>
    </div>
  );
}

const tenths = (x: number) => { const r = Math.round(x); return `${Math.floor(r / 10)}.${r % 10}`; };
const SHADOW = `0 ${px(10)} ${px(30)} rgba(0,0,0,.13),0 ${px(2)} ${px(6)} rgba(0,0,0,.06)`;
const RING_MASK = "radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2.4px))";
const CURSOR_SHADOW = `drop-shadow(0 ${px(1)} ${px(3)} rgba(0,0,0,.35))`;

function Card({ ci, r, v, pointer, reduce }: { ci: number; r: Refs; v: Vals; pointer: boolean; reduce: boolean }) {
  const c = CARDS[ci];
  const [hover, setHover] = useState(-1);
  const [warm, setWarm] = useState(false); // bottom toolbar: waits once, then instant until the pointer leaves it
  const ctr = useTransform(v.w, (x) => `${tenths(x)}s waiting`);
  const lab = useTransform(v.e, (x) => `${tenths(x)}s`);
  const ms = useTransform(v.ms, (x) => `${Math.round(x)}ms`);
  const ring = useTransform(v.ms, (x) => `conic-gradient(#45bdf0 ${(500 - Math.round(x)) * 0.72}deg,#d3edf8 0)`);

  return (
    <div className="absolute left-[calc(48*var(--u))] h-[calc(480*var(--u))] w-[calc(1344*var(--u))] rounded-[calc(40*var(--u))] bg-white" style={{ top: px(c.top) }}>
      <div ref={(el) => { r.content = el; }} className="absolute inset-0">
        <div
          className="absolute left-[calc(40*var(--u))] top-[calc(35*var(--u))] font-[family-name:'Indie_Flower',cursive] text-[length:calc(30*var(--u))] font-normal leading-none tracking-[calc(1.5*var(--u))]"
          style={{ color: c.col, wordSpacing: px(2), WebkitTextStroke: `${px(0.7)} currentColor` }}
        >
          {c.title}
        </div>
        <motion.div className="absolute right-[calc(40*var(--u))] top-[calc(37*var(--u))] font-[family-name:Inter] text-[length:calc(21*var(--u))] font-normal leading-none text-[#646366]">
          {ctr}
        </motion.div>
        <div
          className="absolute left-[calc(326*var(--u))] top-[calc(181*var(--u))] h-[calc(78*var(--u))] w-[calc(691*var(--u))] rounded-[calc(18*var(--u))] bg-white"
          style={{ boxShadow: SHADOW }}
          onPointerLeave={pointer && ci === 1 ? () => setWarm(false) : undefined}
        >
          <div className="absolute left-[calc(21*var(--u))] top-0 flex h-full items-center gap-[calc(5*var(--u))] font-[family-name:Inter] text-[length:calc(23*var(--u))] font-normal leading-none text-[#2a2a2a]">
            Body
            <svg viewBox="0 0 12 12" className="h-[calc(18*var(--u))] w-[calc(18*var(--u))]">
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {[118, 396, 612].map((x) => (
            <div key={x} className="absolute top-[calc(24*var(--u))] h-[calc(30*var(--u))] w-[calc(1.5*var(--u))] bg-[#e6e6e8]" style={{ left: px(x) }} />
          ))}
          {BTNS.map(([l, x, t, k], i) => {
            const on = pointer && hover === i;
            return (
              <div
                key={l}
                className="absolute top-[calc(7*var(--u))] ml-[calc(-32*var(--u))] grid h-[calc(62*var(--u))] w-[calc(64*var(--u))] place-items-center font-[family-name:Inter] text-[length:calc(25*var(--u))] font-normal not-italic leading-none"
                style={{ left: px(x) }}
                onPointerEnter={pointer ? () => setHover(i) : undefined}
                onPointerLeave={pointer ? () => setHover((h) => (h === i ? -1 : h)) : undefined}
              >
                <div ref={(el) => { r.sqs[i] = el; }} className="absolute inset-0 rounded-[calc(12*var(--u))] bg-[#efeff2]" style={{ opacity: on ? 1 : 0 }} />
                {ICONS[l] ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-[calc(31*var(--u))] w-[calc(31*var(--u))]"
                    fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  >
                    {ICONS[l]}
                  </svg>
                ) : (
                  LABELS[l]
                )}
                <motion.div
                  ref={(el) => { r.tips[i] = el; }}
                  className="pointer-events-none absolute bottom-[calc(81*var(--u))] left-1/2 flex h-[calc(43*var(--u))] -translate-x-1/2 items-center gap-[calc(9*var(--u))] whitespace-nowrap rounded-[calc(10*var(--u))] bg-[#151515] px-[calc(17*var(--u))] font-[family-name:Inter] text-[length:calc(18*var(--u))] font-medium not-italic leading-none text-white"
                  style={{ opacity: 0 }}
                  initial={false}
                  animate={pointer ? { opacity: on ? 1 : 0 } : undefined}
                  transition={reduce ? { duration: 0 } : { duration: 0.15, ease: EASE, delay: on && !warm ? 0.5 : 0 }}
                  onAnimationComplete={() => { if (pointer && ci === 1 && on) setWarm(true); }}
                >
                  <span>{t}</span>
                  <span>{k}</span>
                </motion.div>
              </div>
            );
          })}
          <div className="absolute left-[calc(640*var(--u))] top-[calc(27*var(--u))] h-[calc(24*var(--u))] w-[calc(24*var(--u))] rounded-full" style={{ background: c.col }} />
        </div>
        <div className="absolute left-[calc(40*var(--u))] top-[calc(430*var(--u))] h-[calc(10*var(--u))] w-[calc(1264*var(--u))] rounded-[calc(5*var(--u))] bg-[#eeeeef]" />
        {SEGS.map((x, i) => (
          <div
            key={x}
            ref={(el) => { r.segs[i] = el; }}
            className="absolute top-[calc(430*var(--u))] h-[calc(10*var(--u))] bg-[#45bdf0]"
            style={{ left: px(x), width: px(i < c.segs ? 84 : 0) }}
          />
        ))}
        <motion.div
          ref={(el) => { r.lab = el; }}
          className="absolute left-0 top-[calc(425*var(--u))] font-[family-name:Inter] text-[length:calc(17*var(--u))] font-medium leading-[calc(20*var(--u))] text-[#1a1a1a]"
          style={{ transform: `translateX(${px(40 + 16.8 * c.e + 9)})` } as CSSProperties}
        >
          {lab}
        </motion.div>
      </div>
      <div ref={(el) => { r.cur = el; }} className="pointer-events-none absolute left-0 top-0 opacity-0">
        <svg
          ref={(el) => { r.arrow = el; }}
          viewBox="0 0 22 30"
          className="absolute left-[calc(-3.4*var(--u))] top-[calc(-3.4*var(--u))] h-[calc(44*var(--u))] w-[calc(32*var(--u))]"
          style={{ filter: CURSOR_SHADOW }}
        >
          <path d="M2 2v22l5.5-5 3.6 8.2 3.2-1.4-3.5-7.9h7.4z" fill="#000" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <svg
          ref={(el) => { r.hand = el; }}
          viewBox="0 0 26 32"
          className="absolute left-[calc(-13*var(--u))] top-[calc(-2*var(--u))] h-[calc(45*var(--u))] w-[calc(36*var(--u))]"
          style={{ filter: CURSOR_SHADOW, opacity: 0 }}
        >
          <path
            d="M8.2 3.2c0-2.4 4-2.4 4 0v8.6c.2-2 3.8-2 3.8.2v.8c.3-2 3.7-2 3.7.3v.9c.4-1.8 3.5-1.6 3.5.6v7.6c0 5.2-3.2 8.6-8.2 8.6h-2.2c-3.2 0-5-1.4-6.6-4L1.7 21c-1.2-2 1.2-3.9 3-2.2l3.5 3.2z"
            fill="#fff" stroke="#000" strokeWidth="1.7" strokeLinejoin="round"
          />
          <path d="M12.2 11.8v3M16 12.8v2.3M19.7 14v1.8" stroke="#000" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <div className="absolute left-[calc(24*var(--u))] top-[calc(54*var(--u))] flex items-center gap-[calc(12*var(--u))]">
          <motion.div className="h-[calc(22*var(--u))] w-[calc(22*var(--u))] rounded-full" style={{ background: ring, WebkitMask: RING_MASK, mask: RING_MASK }} />
          <motion.div className="h-[calc(28*var(--u))] rounded-[calc(8*var(--u))] bg-[#e3f4fc] px-[calc(10*var(--u))] font-[family-name:Inter] text-[length:calc(17*var(--u))] font-medium leading-[calc(28*var(--u))] text-[#2f87ab]">
            {ms}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
