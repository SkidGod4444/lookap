"use client";
/*
  Minimal Tooltip Thinking Mode — design by rico (@_heyrico)
  Source: https://x.com/_heyrico/status/2112212712306749537
  React 19 + Tailwind v4 + Motion port of factory/1fut80-minimal-tooltip-thinking-mode/index.html.
  Every icon (Shopify bag, favicons, gem, doc glyph, cursor) is an original inline SVG; the file preview is drawn in CSS.
  The whole 30 s transcript plays from mount (as the HTML does with or without ?demo); reduced motion shows the final state.
*/
import { Fragment, useEffect, useMemo, type CSSProperties, type ElementType, type ReactNode } from "react";
import { motion, motionValue, useAnimate, useMotionTemplate, useReducedMotion, type MotionValue } from "motion/react";

export const fonts: string[] = ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"];

const u = (n: number) => `calc(${n} * var(--u))`;
const D = 30; // one 30 s track per element, keyframes at absolute seconds

type Bez = [number, number, number, number];
type Ease = Bez | "linear";
const E_IN: Bez = [0.2, 0.7, 0.2, 1];
const EASE_IN: Bez = [0.42, 0, 1, 1];
const EASE_OUT: Bez = [0, 0, 0.58, 1];
const EASE_IN_OUT: Bez = [0.42, 0, 0.58, 1];

/* the HTML's tl(): pad to offset 0 and 1, an easing drives the segment after its keyframe, linear otherwise */
type Frame = [number, Record<string, number>, Ease?];
type Track = { times: number[]; values: Record<string, number[]>; ease: Ease[] };
type Ent = { tr: Track; mv: Record<string, MotionValue<number>>; el?: HTMLElement | null };
function tl(frames: Frame[]): Track {
  const f = frames.map(([t, p, e]) => ({ t: Math.min(1, Math.max(0, t / D)), p, e }));
  if (f[0].t > 0) f.unshift({ ...f[0], t: 0 });
  if (f[f.length - 1].t < 1) f.push({ ...f[f.length - 1], t: 1, e: undefined });
  for (let i = 1; i < f.length; i++) if (f[i].t <= f[i - 1].t) f[i].t = f[i - 1].t + 1e-6;
  const values: Record<string, number[]> = {};
  for (const k of Object.keys(f[0].p)) values[k] = f.map((x) => x.p[k]);
  return { times: f.map((x) => x.t), values, ease: f.slice(0, -1).map((x) => x.e ?? "linear") };
}
const ent = (frames: Frame[]): Ent => {
  const tr = tl(frames);
  const mv: Record<string, MotionValue<number>> = {};
  for (const k of Object.keys(tr.values)) mv[k] = motionValue(tr.values[k][0]);
  return { tr, mv };
};

/* blur-fade in at tin, out at tout */
const OFF = (y = 0, b = 8) => ({ o: 0, b, y });
const ON = { o: 1, b: 0, y: 0 };
type ShowOpts = { d?: number; y?: number; b?: number; e?: Ease; dOut?: number; yOut?: number; bOut?: number };
const show = (tin: number, tout: number | null, o: ShowOpts = {}) => {
  const d = o.d || 0.3;
  const f: Frame[] = [[tin, OFF(o.y || 0, o.b || 8), o.e || E_IN], [tin + d, ON]];
  if (tout != null) f.push([tout, ON, EASE_IN], [tout + (o.dOut || d), OFF(o.yOut || 0, o.bOut || o.b || 8)]);
  return ent(f);
};

/* seconds counter and source counter */
const TICKS: [number, number][] = [[1, 1.6], [2, 3.0], [3, 4.3], [4, 5.5]];
for (let n = 5; n <= 27; n++) TICKS.push([n, n === 5 ? 6.2 : n + 1.1]);
const COUNTS: [number, number][] = [[3, 13.7], [6, 13.9], [8, 14.0], [9, 14.1], [16, 14.3], [24, 14.6], [29, 14.85], [31, 15.0], [34, 15.15], [37, 15.3], [38, 15.4], [40, 15.5], [46, 15.6]];
const RAIL: [number, number][] = [[6.85, 0], [7.15, 48], [7.9, 48], [8.15, 111], [8.4, 111], [8.7, 312], [12.0, 312], [12.3, 111], [13.1, 111], [13.35, 174], [13.7, 174], [13.9, 259], [14.0, 259], [14.2, 323], [17.7, 323], [17.95, 369], [18.3, 369], [18.6, 572], [21.6, 572], [21.9, 369], [22.7, 369], [22.95, 432], [23.15, 432], [23.45, 740], [27.3, 740], [27.6, 432], [28.3, 432], [28.55, 496]];
const CUR: [number, number, number][] = [[23.2, 85, 70], [23.9, 232, 62], [24.2, 236, 78], [24.6, 92, 92], [25.1, 210, 100], [25.5, 90, 124], [26.0, 165, 128], [26.4, 76, 160], [27.3, 82, 160]];
const SK: [number, number, number][] = [[23.3, 25, 201], [24.5, 64, 174], [25.3, 103, 124], [26.0, 141, 51]];

/* the thinking stream, in DOM order: each word (and each list number) gets the next index */
const P1 = ["The goal is to get the store live in Sweden. Start with what", "Shopify already knows: who orders from Sweden today, what", "they buy, and how often they come back."];
const P2 = ["Then look outward. Check how local brands price and position", "themselves, what Swedish shoppers expect on delivery and", "returns, and how Sweden compares with Norway."];
const LI = ["Read Swedish order history", "Search local market sources", "Brief the Brand Researcher", "Compare Sweden against Norway", "Write the launch report"];
const P3 = ["Orders first. They set the baseline for everything else."];
let nWords = 0;
const lines = (ls: string[]) => ls.map((l) => l.split(" ").map((w) => ({ w, i: nWords++ })));
const T_P1 = lines(P1), T_P2 = lines(P2);
const T_LI = LI.map((l, k) => ({ n: { w: `${k + 1}.`, i: nWords++ }, ws: lines([l])[0] }));
const T_P3 = lines(P3);
const N_WORDS = nWords;

function build() {
  const R = {
    pill: show(0.3, null, { d: 0.4, y: 3, b: 10 }),
    hSpin: show(1.4, 6.4, { dOut: 0.3 }),
    hThink: show(1.4, 6.36, { yOut: -22, dOut: 0.24, bOut: 10 }),
    hChev: show(6.55, null, { d: 0.25 }),
    hWork: show(6.4, null, { y: 22, d: 0.5, b: 10, e: [0.3, 0.4, 0.3, 1] }),
    ticks: TICKS.map(([, t], i) => show(t, TICKS[i + 1] ? TICKS[i + 1][1] : null, { d: 0.18, y: 14, b: 4, yOut: -14, dOut: 0.18 })),
    ctr: ent([[6.36, { left: 367 }, [0.4, 0, 0.2, 1]], [6.8, { left: 274 }]]),
    words: Array.from({ length: N_WORDS }, (_, i) => show(1.6 + i / 22.5, null, { d: 0.45, b: 6 })),
    think: show(1.4, 6.1, { d: 0.1, dOut: 0.75, bOut: 14 }),
    tIn: ent([[4.05, { y: 0 }], [4.9, { y: -124 }], [5.65, { y: -250 }, EASE_OUT]]),
    rail: ent(RAIL.map(([t, h]): Frame => [t, { h }, [0.3, 0, 0.2, 1]])),
    done: show(7.0, null),
    readA: show(7.9, 12.0), readB: show(12.05, null),
    card1: show(8.4, 12.0, { b: 4, bOut: 14, dOut: 0.3 }),
    c1aA: show(8.6, 10.0, { d: 0.25, dOut: 0.12 }), c1aB: show(10.05, null, { d: 0.2 }),
    c1bA: show(8.7, 11.0, { d: 0.25, dOut: 0.12 }), c1bB: show(11.05, null, { d: 0.2 }),
    srchA: show(13.1, 16.3), srchB: show(16.35, null),
    counts: COUNTS.map(([, t], i) => show(t, COUNTS[i + 1] ? COUNTS[i + 1][1] : null, { d: 0.1, b: 3, y: 8, yOut: -8, dOut: 0.1 })),
    chips: [13.7, 13.8, 14.0, 14.2, 14.45].map((t) => show(t, null, { d: 0.28, b: 6 })),
    delA: show(17.7, 21.6), delB: show(21.65, null),
    card2: show(18.3, 21.6, { b: 4, bOut: 14, dOut: 0.3 }),
    c2aA: show(18.45, 19.65, { d: 0.25, dOut: 0.12 }), c2aB: show(19.7, null, { d: 0.2 }),
    c2bA: show(18.55, 20.65, { d: 0.25, dOut: 0.12 }), c2bB: show(20.7, null, { d: 0.2 }),
    prepA: show(22.7, 27.35), prepB: show(27.4, null),
    file: show(23.15, 27.3, { b: 4, bOut: 14 }),
    sk: SK.map(([t]) => ent([[t, { o: 0, sx: 0 }, EASE_OUT], [t + 0.9, { o: 1, sx: 1 }]])),
    cur: ent(CUR.map(([t, x, y]): Frame => [t, { x, y }, EASE_IN_OUT])),
    // the disc sharpens before the label (clip at 28.5 s: check legible, label still soft)
    finI: show(28.05, null, { d: 0.6, b: 6, e: "linear" }),
    finT: show(28.05, null, { d: 1, b: 7, e: "linear" }),
  };
  const all = Object.values(R).flatMap((v) => (Array.isArray(v) ? v : [v]));
  return { R, all };
}

/* an element on the timeline: opacity, blur and a vertical offset, all in units; the effect animates the element itself */
const fxFrames = (v: Ent) => ({
  opacity: v.tr.values.o,
  filter: v.tr.values.b.map((b) => `blur(${u(b)})`),
  transform: v.tr.values.y.map((y) => `translateY(${u(y)})`),
});
function Fx({ v, as = "div", style, ...rest }: { v: Ent; as?: string; style?: CSSProperties; className?: string; children?: ReactNode; [k: string]: unknown }) {
  const M = as as ElementType;
  const f = fxFrames(v);
  return <M {...rest} ref={(n: HTMLElement | null) => { v.el = n; }} style={{ ...style, opacity: f.opacity[0], filter: f.filter[0], transform: f.transform[0] }} />;
}

/* loops */
const SPIN_STYLE: CSSProperties = {
  background: "conic-gradient(#dcdcdc 0 20deg,#8a8a8a 50deg,#383838 80deg,#383838 360deg)",
  WebkitMask: "radial-gradient(farthest-side,transparent calc(100% - 3.3*var(--u)),#000 calc(100% - 3.3*var(--u) + .6px))",
  mask: "radial-gradient(farthest-side,transparent calc(100% - 3.3*var(--u)),#000 calc(100% - 3.3*var(--u) + .6px))",
};
const SPIN = "w-[calc(22*var(--u))] h-[calc(22*var(--u))] rounded-full";
const Spin = () => <motion.i className={SPIN} style={SPIN_STYLE} animate={{ rotate: 360 }} transition={{ duration: 0.9, ease: "linear", repeat: Infinity }} />;
const SHIM: CSSProperties = {
  backgroundImage: "linear-gradient(90deg,#666 0 44%,#161616 50%,#666 56% 100%)",
  backgroundSize: "300% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  backgroundPosition: "82.5% 0%",
};
// 100% -> 0 over 2 s, linear, started 0.35 s in (the HTML's -.35s delay)
const SHIM_LOOP = {
  animate: { backgroundPosition: ["82.5% 0%", "0% 0%", "100% 0%", "82.5% 0%"] },
  transition: { duration: 2, times: [0, 0.825, 0.825001, 1], ease: "linear" as const, repeat: Infinity },
};
const Shim = ({ children }: { children: ReactNode }) => <motion.span style={SHIM} {...SHIM_LOOP}>{children}</motion.span>;

/* rows and icons */
const ROW = "absolute left-[calc(104*var(--u))] h-[calc(63*var(--u))] flex items-center whitespace-nowrap";
const rowTop = (y: number): CSSProperties => ({ top: u(y - 33) });
const IC = "relative w-[calc(22*var(--u))] h-[calc(22*var(--u))] mr-[calc(23*var(--u))] flex-none before:content-[''] before:absolute before:inset-[calc(-4*var(--u))] before:rounded-full before:bg-[#fdfdfd] *:absolute *:inset-0 *:m-auto";
const DOT = "w-[calc(13*var(--u))] h-[calc(13*var(--u))] rounded-full bg-[#d9d9d9] shadow-[0_0_0_calc(5*var(--u))_#fdfdfd]";
const CHK = "w-[calc(22*var(--u))] h-[calc(22*var(--u))] rounded-full bg-[#141414] grid place-items-center";
const CHK_BLUE = "w-[calc(22*var(--u))] h-[calc(22*var(--u))] rounded-full bg-[#2f7cf6] grid place-items-center shadow-[0_0_0_calc(5*var(--u))_#fdfdfd]";
const OBJ = "text-[#525252] font-medium";
const GAP = "ml-[calc(20*var(--u))]";
const ICO = "w-[calc(22*var(--u))] h-[calc(24*var(--u))] ml-[calc(20*var(--u))] mr-[calc(11*var(--u))] flex-none";
const SHOP = "w-[calc(25*var(--u))] h-[calc(28*var(--u))] ml-[calc(20*var(--u))] mr-[calc(9*var(--u))] flex-none";
const LBL = "absolute left-0 top-0 leading-[calc(63*var(--u))]";

const Tick = () => (
  <svg viewBox="0 0 12 12" className="w-[calc(12*var(--u))] h-[calc(12*var(--u))]">
    <path d="M2.6 6.3l2.3 2.3 4.6-4.9" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Dot = () => <span className={IC}><i className={DOT} /></span>;
const Check = () => <span className={IC}><i className={CHK}><Tick /></i></span>;
const Spinner = () => <span className={IC}><Spin /></span>;
const ShopBag = () => (
  <svg className={SHOP} viewBox="0 0 22 24">
    <path d="M7 6.5C7 3 8.5 1.5 10 1.5s2.6 1.2 3 3.5" fill="none" stroke="#5e8e3e" strokeWidth="1.4" />
    <path d="M3 6.3l11-1.3 1.6 17.5L1.6 21z" fill="#95bf47" />
    <path d="M14 5l3.6.8 2 16.6-4 .1z" fill="#5e8e3e" />
    <path transform="translate(-5.3 -7.5) scale(1.55)" d="M10.6 10.6c-.5-.3-1-.4-1.6-.4-1.3 0-2 .8-2 1.6 0 1.6 2.9 1.6 2.9 3 0 .5-.4.9-1.1.9-.7 0-1.4-.4-1.8-.7l-.4 1.3c.4.4 1.2.7 2.1.7 1.5 0 2.5-.9 2.5-2.2 0-1.9-2.8-1.9-2.8-2.9 0-.3.3-.6 1-.6.5 0 .9.1 1.2.3z" fill="#fff" />
  </svg>
);
const Gem = () => (
  <svg className={ICO} viewBox="0 0 24 24" style={{ height: u(26), width: u(26) }}>
    <path d="M12 1.2l8.6 4.4 2.2 8.2-5 7.6H6.2l-5-7.6 2.2-8.2z" fill="#3fb45c" />
    <path d="M12 1.2l8.6 4.4-3.4 5.2H6.8L3.4 5.6z" fill="#8fe09b" />
    <path d="M6.8 10.8h10.4L12 21.4z" fill="#56c56f" />
    <path d="M3.4 5.6l3.4 5.2-5.6 3z" fill="#6fd283" />
    <path d="M20.6 5.6l2.2 8.2-5.6-3z" fill="#2f9a4c" />
    <path d="M1.2 13.8l5.6-3 5.2 10.6H6.2z" fill="#38a956" />
    <path d="M22.8 13.8l-5.6-3L12 21.4h5.8z" fill="#1f8040" />
  </svg>
);

/* cards */
const CARD = "absolute box-border left-[calc(138*var(--u))] w-[calc(852*var(--u))] bg-white border-[length:calc(1*var(--u))] border-solid border-[#ececec] rounded-[calc(22*var(--u))]";
const SUB = "absolute left-[calc(33*var(--u))] h-[calc(81*var(--u))] flex items-center whitespace-nowrap";
const HR = <div className="absolute left-0 right-0 top-[calc(80*var(--u))]" style={{ borderTop: `${u(1)} solid #efefef` }} />;
const CHIP = "absolute h-[calc(48*var(--u))] rounded-[calc(10*var(--u))] bg-[#ececec] text-[#262626] text-[calc(25*var(--u))] flex items-center pl-[calc(14*var(--u))] whitespace-nowrap [&>svg]:w-[calc(27*var(--u))] [&>svg]:h-[calc(27*var(--u))] [&>svg]:mr-[calc(11*var(--u))] [&>svg]:flex-none";

/* thinking text */
const WORD = "inline-block not-italic whitespace-pre";
const NUM = "inline-block font-medium text-[calc(20*var(--u))] leading-[normal] font-[JetBrains_Mono,monospace] text-[#888] w-[calc(34*var(--u))] ml-[calc(6*var(--u))]";

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const { R, all } = useMemo(build, []);
  // the timeline plays from mount with or without demo, as the HTML does; reduced motion holds the final frame
  const play = !reduce;
  void demo;

  useEffect(() => {
    const ctl: { stop: () => void }[] = [];
    for (const e of all) {
      const { tr, mv, el } = e;
      if (el) {
        const kf = fxFrames(e);
        if (!play) { el.style.opacity = String(kf.opacity.at(-1)); el.style.filter = kf.filter.at(-1)!; el.style.transform = kf.transform.at(-1)!; continue; }
        ctl.push(animate(el, kf, { duration: D, times: tr.times, ease: tr.ease }));
        continue;
      }
      for (const k of Object.keys(mv)) {
        const vals = tr.values[k];
        if (!play) { mv[k].set(vals[vals.length - 1]); continue; }
        mv[k].set(vals[0]);
        if (vals.every((x) => x === vals[0])) continue;
        ctl.push(animate(mv[k], vals, { duration: D, times: tr.times, ease: tr.ease }));
      }
    }
    return () => ctl.forEach((c) => c.stop());
  }, [all, play, animate]);

  const ctrLeft = useMotionTemplate`calc(${R.ctr.mv.left} * var(--u))`;
  const tInY = useMotionTemplate`translateY(calc(${R.tIn.mv.y} * var(--u)))`;
  const railH = useMotionTemplate`calc(${R.rail.mv.h} * var(--u))`;
  const curT = useMotionTemplate`translate(calc(${R.cur.mv.x} * var(--u)), calc(${R.cur.mv.y} * var(--u)))`;
  const skT = [
    useMotionTemplate`scaleX(${R.sk[0].mv.sx})`, useMotionTemplate`scaleX(${R.sk[1].mv.sx})`,
    useMotionTemplate`scaleX(${R.sk[2].mv.sx})`, useMotionTemplate`scaleX(${R.sk[3].mv.sx})`,
  ];

  const word = ({ w, i }: { w: string; i: number }, k: number) => (
    <Fragment key={i}>{k > 0 && " "}<Fx as="i" v={R.words[i]} className={WORD}>{w}</Fx></Fragment>
  );
  const para = (ls: { w: string; i: number }[][]) => ls.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{l.map(word)}</Fragment>);

  return (
    <div
      ref={scope}
      className={`relative w-[calc(1080*var(--u))] h-[calc(1080*var(--u))] overflow-hidden bg-[#fdfdfd] text-[calc(26*var(--u))] leading-[normal] text-[#7a7a7a] antialiased *:box-border ${className ?? ""}`}
      style={{ fontFamily: "Inter,system-ui,sans-serif", ...(unit ? { ["--u" as string]: unit } : {}) }}
    >
      <Fx v={R.pill} className="absolute box-border left-[calc(607*var(--u))] top-[calc(108*var(--u))] w-[calc(383*var(--u))] h-[calc(85*var(--u))] rounded-[calc(42.5*var(--u))] bg-[#101010] text-white text-[calc(31*var(--u))] flex items-center justify-center tracking-[calc(.1*var(--u))]">
        Get us live in Sweden.
      </Fx>
      <motion.div className="absolute left-[calc(114.25*var(--u))] top-[calc(298*var(--u))] w-[calc(1.5*var(--u))] bg-[#e3e3e3]" style={{ height: railH }} />

      {/* header: a still ring (the HTML's timeline transform overrides its spin) + shimmering "Start thinking..." rolls to chevron + "Working" */}
      <div className={ROW} style={rowTop(283)}>
        <span className={IC}>
          <Fx as="i" v={R.hSpin} className={SPIN} style={SPIN_STYLE} />
          <Fx as="svg" v={R.hChev} viewBox="0 0 22 22" width="22" height="22" style={{ width: u(22), height: u(22) }}>
            <path d="M2.5 7.5l8.5 8.5 8.5-8.5" fill="none" stroke="#666" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </Fx>
        </span>
        <span className="relative h-[calc(63*var(--u))] w-[calc(240*var(--u))]">
          <Fx as="span" v={R.hThink} className={LBL}><Shim>Start thinking...</Shim></Fx>
          <Fx as="span" v={R.hWork} className={LBL} style={{ color: "#6f6f6f" }}>Working</Fx>
        </span>
      </div>
      <motion.div className="absolute top-[calc(250*var(--u))] h-[calc(63*var(--u))] w-[calc(60*var(--u))] text-[#858585]" style={{ left: ctrLeft }}>
        {TICKS.map(([n], i) => <Fx key={n} as="span" v={R.ticks[i]} className={LBL}>{n}s</Fx>)}
      </motion.div>

      <Fx
        v={R.think}
        className="absolute left-[calc(149*var(--u))] top-[calc(319*var(--u))] w-[calc(860*var(--u))] h-[calc(381*var(--u))] overflow-hidden"
        style={{ WebkitMaskImage: "linear-gradient(rgba(0,0,0,.4),#000 calc(70*var(--u)))", maskImage: "linear-gradient(rgba(0,0,0,.4),#000 calc(70*var(--u)))" }}
      >
        <motion.div className="leading-[calc(44*var(--u))] text-[#6c6c6c] whitespace-nowrap" style={{ transform: tInY }}>
          <p className="m-0">{para(T_P1)}</p>
          <p className="m-0 mt-[calc(42*var(--u))]">{para(T_P2)}</p>
          <ol className="list-none my-[calc(10*var(--u))] mx-0 p-0 leading-[calc(45*var(--u))]">
            {T_LI.map(({ n, ws }) => (
              <li key={n.i}>
                <Fx as="b" v={R.words[n.i]} className={NUM}>{n.w}</Fx>
                {ws.map(word)}
              </li>
            ))}
          </ol>
          <p className="m-0">{para(T_P3)}</p>
        </motion.div>
      </Fx>

      {/* steps */}
      <Fx v={R.done} className={ROW} style={rowTop(346)}><Dot />Done thinking</Fx>

      <Fx v={R.readA} className={ROW} style={rowTop(409)}><Spinner /><Shim>Reading</Shim><ShopBag /><span className={OBJ}>Shopify Swedish orders</span></Fx>
      <Fx v={R.readB} className={ROW} style={rowTop(409)}><Dot />Read<ShopBag /><span className={OBJ}>Shopify Swedish orders</span></Fx>
      <Fx v={R.card1} className={CARD} style={{ top: u(447), height: u(163) }}>
        <Fx v={R.c1aA} className={SUB} style={{ top: 0 }}><Spinner /><Shim>Pulling Swedish order history</Shim></Fx>
        <Fx v={R.c1aB} className={`${SUB} text-[#262626]`} style={{ top: 0 }}><Check />Pulled Swedish order history</Fx>
        {HR}
        <Fx v={R.c1bA} className={SUB} style={{ top: u(81) }}><Spinner /><Shim>Spotting top sellers in Sweden</Shim></Fx>
        <Fx v={R.c1bB} className={`${SUB} text-[#262626]`} style={{ top: u(81) }}><Check />Spotted top sellers in Sweden</Fx>
      </Fx>

      <Fx v={R.srchA} className={ROW} style={rowTop(472)}>
        <Spinner /><Shim>Start searching</Shim>
        <span className={`${GAP} relative h-[calc(63*var(--u))] w-[calc(200*var(--u))]`}>
          {COUNTS.map(([n], i) => <Fx key={n} as="span" v={R.counts[i]} className={LBL} style={{ color: "#9a9a9a" }}>{n} sources</Fx>)}
        </span>
      </Fx>
      <Fx v={R.srchB} className={ROW} style={rowTop(472)}><Dot />Searched<span className={GAP}>46 sources</span></Fx>
      <div className="absolute left-[calc(149*var(--u))] top-[calc(509*var(--u))] w-[calc(800*var(--u))]">
        <Fx v={R.chips[0]} className={CHIP} style={{ left: 0, top: 0, width: u(234) }}>
          <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#c9f227" /><circle cx="12" cy="12" r="6.5" fill="none" stroke="#111" strokeWidth="1.6" /><path d="M12 5.5a6.5 6.5 0 0 0 0 13z" fill="#111" /></svg>acedesign.io
        </Fx>
        <Fx v={R.chips[1]} className={CHIP} style={{ left: u(249), top: 0, width: u(406) }}>
          <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#0a66c2" /><rect x="5.6" y="9.6" width="2.8" height="8.6" fill="#fff" /><circle cx="7" cy="6.6" r="1.7" fill="#fff" /><path d="M10.6 9.6h2.7v1.3c.5-.9 1.6-1.5 2.9-1.5 2.3 0 3 1.4 3 3.6v5.2h-2.8v-4.6c0-1.1-.3-1.9-1.4-1.9s-1.6.8-1.6 1.9v4.6h-2.8z" fill="#fff" /></svg>LinkedIn - Ace Design Io...
        </Fx>
        <Fx v={R.chips[2]} className={CHIP} style={{ left: 0, top: u(64), width: u(374) }}>
          <svg viewBox="0 0 24 24"><path d="M3.5 3.5h5.2l4.4 6 5-6h2.3l-6.3 7.4 6.9 9.6h-5.2l-4.7-6.4-5.5 6.4H3.3l6.8-7.9z" fill="#111" /><path d="M6.6 4.9h1.5l9.6 14.2h-1.5z" fill="#ececec" /></svg>X - Ace Design Io News
        </Fx>
        <Fx v={R.chips[3]} className={CHIP} style={{ left: u(386), top: u(64), width: u(195) }}>
          <svg viewBox="0 0 24 24"><path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.7-1.6 2.7-4 2.7-7z" fill="#4285f4" /><path d="M12 21.5c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H3.5v2.5A9.5 9.5 0 0 0 12 21.5z" fill="#34a853" /><path d="M6.7 13.8a5.7 5.7 0 0 1 0-3.6V7.7H3.5a9.5 9.5 0 0 0 0 8.6z" fill="#fbbc05" /><path d="M12 6.3c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.5 9.5 0 0 0 3.5 7.7l3.2 2.5C7.4 8 9.5 6.3 12 6.3z" fill="#ea4335" /></svg>AI Search
        </Fx>
        <Fx v={R.chips[4]} className="absolute left-[calc(615*var(--u))] top-[calc(64*var(--u))] leading-[calc(48*var(--u))] text-[#3a3a3a] text-[calc(25*var(--u))]">20+ more</Fx>
      </div>

      <Fx v={R.delA} className={ROW} style={rowTop(667)}><Spinner /><Shim>Delegating to</Shim><Gem /><span className={OBJ}>Brand Researcher</span></Fx>
      <Fx v={R.delB} className={ROW} style={rowTop(667)}><Dot />Delegating to<Gem /><span className={OBJ}>Brand Researcher</span></Fx>
      <Fx v={R.card2} className={CARD} style={{ top: u(706), height: u(164) }}>
        <Fx v={R.c2aA} className={SUB} style={{ top: 0 }}><Spinner /><Shim>Scanning Swedish competitor brands</Shim></Fx>
        <Fx v={R.c2aB} className={`${SUB} text-[#262626]`} style={{ top: 0 }}><Check />Scanned Swedish competitor brands</Fx>
        {HR}
        <Fx v={R.c2bA} className={SUB} style={{ top: u(81) }}><Spinner /><Shim>Mapping local pricing trends</Shim></Fx>
        <Fx v={R.c2bB} className={`${SUB} text-[#262626]`} style={{ top: u(81) }}><Check />Mapped local pricing trends</Fx>
      </Fx>

      <Fx v={R.prepA} className={ROW} style={rowTop(730)}><Spinner /><Shim>Preparing the report</Shim></Fx>
      <Fx v={R.prepB} className={ROW} style={rowTop(730)}>
        <Dot />Report is ready
        <svg className={ICO} viewBox="0 0 22 24" style={{ marginLeft: u(18) }}>
          <path d="M4 1.5h9.5L19 7v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 21V3a1.5 1.5 0 0 1 1-1.5z" fill="#2f7cf6" />
          <path d="M13.5 1.5V7H19z" fill="#9cc1fb" />
          <path d="M7 12h8M7 15.5h8M7 19h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className={OBJ}>Sweden Insight</span>
      </Fx>
      <Fx v={R.file} className="absolute box-border left-[calc(138*var(--u))] top-[calc(767*var(--u))] w-[calc(364*var(--u))] h-[calc(271*var(--u))] rounded-[calc(22*var(--u))] bg-[#f6f6f6] border-[length:calc(1*var(--u))] border-solid border-[#efefef]">
        <div
          className="absolute box-border left-[calc(57*var(--u))] top-[calc(27*var(--u))] w-[calc(250*var(--u))] h-[calc(180*var(--u))] bg-white border-[length:calc(1*var(--u))] border-solid border-[#ececec] rounded-t-[calc(12*var(--u))] overflow-hidden"
          style={{ WebkitMask: "linear-gradient(#000 82%,transparent)", mask: "linear-gradient(#000 82%,transparent)" }}
        >
          {SK.map(([, top, w], i) => (
            <motion.i key={i} className="absolute left-[calc(23*var(--u))] h-[calc(8*var(--u))] rounded-[calc(4*var(--u))] bg-[#ebebeb] origin-left" style={{ top: u(top), width: u(w), opacity: R.sk[i].mv.o, transform: skT[i] }} />
          ))}
        </div>
        <motion.svg className="absolute left-0 top-0 w-[calc(24*var(--u))] h-[calc(24*var(--u))]" viewBox="0 0 20 20" style={{ transform: curT }}>
          <path d="M1.5 1.5l17 6.4-7.3 2.6-2.8 8z" fill="#1e8ff0" stroke="#1e8ff0" strokeWidth="1" strokeLinejoin="round" />
        </motion.svg>
        <span className="absolute left-[calc(23*var(--u))] top-[calc(216*var(--u))] text-[#6a6a6a] text-[calc(25*var(--u))]">sweden-insight</span>
        <span className="absolute box-border right-[calc(23*var(--u))] top-[calc(217*var(--u))] h-[calc(33*var(--u))] px-[calc(9*var(--u))] border-[length:calc(1.2*var(--u))] border-solid border-[#dedede] rounded-[calc(16.5*var(--u))] text-[calc(21*var(--u))] leading-[calc(30*var(--u))] text-[#a8a8a8] bg-white">PDF</span>
      </Fx>

      <div className={ROW} style={rowTop(794)}>
        <Fx as="span" v={R.finI} className={IC}><i className={CHK_BLUE}><Tick /></i></Fx>
        <Fx as="span" v={R.finT}>Finished working</Fx>
      </div>
    </div>
  );
}
