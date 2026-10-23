"use client";
/*
  Playful Feedback Toggle Buttons — design by Nitish Khagwal
  Source: https://x.com/nitishkmrk/status/2112156660265546145
  React 19 + Tailwind v4 + Motion port of factory/16febh-playful-feedback-toggle-buttons/index.html.
  Nothing sampled: glyphs, cursor, glows and shadows are drawn (SVG + CSS).
  demo replays the clip's 4.83 s sequence; otherwise the buttons answer the pointer.
*/
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAnimate, useReducedMotion } from "motion/react";

export const fonts: string[] = [];

type Bez = [number, number, number, number];
type Ease = Bez | "linear";
const EASE_IN: Bez = [0.42, 0, 1, 1];
const EASE_OUT: Bez = [0, 0, 0.58, 1];
const EASE_IN_OUT: Bez = [0.42, 0, 0.58, 1];
const GREEN = "#0dbc39", RED = "#e5173f";

/* keyframes as [offset, values, easing of the segment after it]; a frame without easing takes the call's default */
type V = number | string;
type Frame = [number, Record<string, V>, Ease?];

/* cursor tip positions read from the clip at 10 fps (seconds, x, y) */
const PATH: [number, number, number][] = [
  [0, 543, 497], [0.1, 438, 532], [0.17, 378, 516], [0.22, 352, 470], [0.3, 313, 378], [0.55, 313, 378],
  [0.6, 340, 416], [0.7, 438, 487], [0.8, 467, 478], [1.3, 465, 478], [1.4, 443, 492], [1.5, 389, 483],
  [1.6, 331, 411], [1.7, 313, 385], [1.95, 313, 385], [2.0, 358, 470], [2.1, 501, 523], [2.2, 537, 501],
  [2.4, 532, 492], [2.5, 510, 505], [2.6, 452, 487], [2.7, 411, 420], [2.8, 402, 392], [3.05, 402, 392],
  [3.1, 438, 452], [3.2, 546, 488], [3.3, 581, 454], [3.6, 581, 454], [3.7, 546, 487], [3.8, 492, 496],
  [3.9, 443, 456], [4.0, 416, 385], [4.25, 407, 382], [4.3, 416, 411], [4.4, 492, 474], [4.5, 559, 474],
  [4.6, 563, 452], [4.83, 563, 452],
];
const DEMO_LEN = 4.83;

const U = (n: number) => `calc(${n} * var(--u))`;

const btnStyle: CSSProperties = {
  background: `linear-gradient(#fcfcfc 0, #f5f5f5 ${U(3)}, #f0f0f0 ${U(12)}, #f4f4f4 ${U(26)}, #f6f6f6 ${U(40)})`,
  boxShadow: `inset 0 0 0 ${U(1.5)} rgba(255,255,255,.9), inset 0 ${U(-2)} 0 #fbfbfb, 0 ${U(14)} ${U(28)} rgba(0,0,0,.075), 0 ${U(5)} ${U(8)} rgba(0,0,0,.06), 0 ${U(1)} ${U(2)} rgba(0,0,0,.05)`,
  WebkitTapHighlightColor: "transparent",
};
const glowLike: CSSProperties = {
  background: `radial-gradient(ellipse ${U(92)} ${U(62)} at ${U(96)} ${U(68)}, #c0ffc6 0%, #c3ffc7 42%, #cafdce 58%, #d6fbd9 73%, #e2f8e4 87%, #eaf5ea 100%)`,
  boxShadow: `inset 0 0 ${U(8)} ${U(2)} rgba(255,255,255,.55), inset 0 0 0 ${U(1.5)} rgba(255,255,255,.75)`,
};
const glowDislike: CSSProperties = {
  background: `radial-gradient(ellipse ${U(110)} ${U(82)} at ${U(86)} ${U(56)}, #fbc9cf 0%, #fccdd2 28%, #fcd7db 52%, #fce1e5 76%, #fae7ea 100%)`,
  boxShadow: `inset 0 0 0 ${U(1.5)} rgba(255,255,255,.75)`,
};

const BTN =
  "absolute top-[calc(294*var(--u))] w-[calc(180*var(--u))] h-[calc(132*var(--u))] box-border p-0 m-0 " +
  "border-solid border-[length:calc(1*var(--u))] border-[#c6c6c6] border-t-[#dadada] border-b-[#cfcfcf] " +
  "outline-none focus-visible:outline-solid focus-visible:outline-[length:calc(2*var(--u))] focus-visible:outline-[#9ab] focus-visible:outline-offset-[calc(3*var(--u))]";
const GLOW = "absolute inset-0 rounded-[inherit] opacity-0 pointer-events-none";
const GLYPH = "absolute w-[calc(58*var(--u))] h-[calc(62*var(--u))] text-black pointer-events-none will-change-transform";

const THUMB_CUFF = "M12 24C5 26.5 0 34 0 42.5C0 51.5 5.5 58.5 14.5 58.8C11.2 55.4 9.6 50.4 9.6 44.2C9.6 36.8 10.6 30 12.4 24Z";
const THUMB_HAND = "M22 59C16 59 12 53 12 45C12 37 15 31 20 26L30 14C32 11 34 7 35 4C36 1 37 0 39 0C42 0 44 2 44 6C44 11 42 15 40 19L52 19C55.5 19 58 21 58 24.5C58 27 57 28.5 55.5 29.2C57.4 30.4 58 32 58 34C58 36.4 57 38 55.4 39C57 40 57.6 41.6 57.6 43.6C57.6 46 56.4 47.6 54.6 48.4C55.6 49.4 56 50.6 56 52C56 56 53.6 59 50 59Z";
function Thumb({ down }: { down?: boolean }) {
  const p = { fill: "currentColor", stroke: "#fff", strokeOpacity: 0.85, strokeWidth: 1.2, style: { paintOrder: "stroke" } as CSSProperties };
  return (
    <svg viewBox="0 0 58 62" aria-hidden="true" className="block w-full h-full overflow-visible">
      <g transform={down ? "rotate(180 29 31)" : undefined}>
        <path {...p} d={THUMB_CUFF} />
        <path {...p} d={THUMB_HAND} />
      </g>
    </svg>
  );
}

type Choice = "like" | "dislike" | null;

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();
  const like = useRef<HTMLButtonElement>(null), dislike = useRef<HTMLButtonElement>(null);
  const up = useRef<HTMLSpanElement>(null), down = useRef<HTMLSpanElement>(null);
  const glowL = useRef<HTMLSpanElement>(null), glowD = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<Choice>(null);
  const state = useRef<Choice>(null);

  /* The HTML's actions. emit() either lays a step on the demo sequence at base + t0 or, live, starts it t0 after the click. */
  const actions = (emit: (el: Element, frames: Frame[], t0: number, dur: number, def: Ease) => void, u: number) => {
    const px = (n: number) => n * u;
    const press = (btn: Element, t0: number, deep = 0.86, dur = 0.5) =>
      emit(btn, [[0, { scale: 1 }], [0.36, { scale: deep }, [0.3, 0, 0.2, 1]], [0.42, { scale: deep }], [0.78, { scale: 1.025 }], [1, { scale: 1 }]], t0, dur, "linear");
    const colour = (el: Element, stops: [number, string][], t0: number, dur: number) =>
      emit(el, stops.map(([o, c]) => [o, { color: c }] as Frame), t0, dur, "linear");
    const fade = (el: Element, from: number, to: number, t0: number, dur: number) =>
      emit(el, [[0, { opacity: from }], [1, { opacity: to }]], t0, dur, EASE_OUT);
    const T = (x: number, y: number, scale: number, rotate: number) => ({ x: px(x), y: px(y), scale, rotate });

    // like on: press 0.42, leap 0.65-1.30 (peak 0.88-1.03 at 2.4x, 130 px up), glow 0.68-0.95
    const likeOn = (t: number) => {
      press(like.current!, t);
      const f = (s: number) => (s - 0.65) / 0.65;
      emit(up.current!, [
        [0, T(0, 0, 1, 0), EASE_IN],
        [f(0.7), T(-8, -30, 1.4, -3), "linear"],
        [f(0.75), T(-14, -73, 1.95, -6)],
        [f(0.84), T(-28, -124, 2.38, -6)],
        [f(0.9), T(-30, -130, 2.46, -5)],
        [f(1.03), T(-30, -128, 2.42, -5), [0.5, 0, 0.9, 0.6]],
        [f(1.1), T(-14, -58, 1.7, -3), "linear"],
        [f(1.16), T(-2, -4, 1.02, 0)],
        [f(1.21), T(0, 5, 0.86, 0)],
        [1, T(0, 0, 1, 0)],
      ], t + 0.23, 0.65, EASE_OUT);
      colour(up.current!, [[0, "#000"], [0.2, "#0d5c1f"], [0.6, "#0c8a2a"], [1, GREEN]], t + 0.24, 0.25);
      fade(glowL.current!, 0, 1, t + 0.26, 0.27);
    };
    // like off: press 1.85, glyph green -> dark green -> black 1.95-2.30, glow out 2.00-2.30
    const likeOff = (t: number) => {
      press(like.current!, t, 0.88);
      emit(up.current!, [[0, { x: 0, y: 0, scale: 1, rotate: 0 }], [0.5, { x: 0, y: 0, scale: 0.94, rotate: 0 }], [1, { x: 0, y: 0, scale: 1, rotate: 0 }]], t, 0.35, EASE_IN_OUT);
      colour(up.current!, [[0, GREEN], [0.3, "#0b7a2a"], [0.45, "#0d4f1c"], [0.72, "#0a2a10"], [1, "#000"]], t + 0.1, 0.35);
      fade(glowL.current!, 1, 0, t + 0.15, 0.3);
    };
    // dislike on: press 2.92 (deepest at ~3.0 s), glyph wobbles left 3.05-3.40, black -> crimson -> red 3.05-3.30
    const dislikeOn = (t: number) => {
      press(dislike.current!, Math.max(t - 0.06, 0), 0.86, 0.4);
      const f = (s: number) => (s - 3.05) / 0.35;
      emit(down.current!, [
        [0, { x: 0, y: 0, rotate: 0 }],
        [f(3.19), { x: px(-19), y: px(4), rotate: -3 }],
        [f(3.31), { x: px(4), y: px(-1), rotate: 2 }],
        [1, { x: 0, y: 0, rotate: 0 }],
      ], t + 0.13, 0.35, EASE_IN_OUT);
      colour(down.current!, [[0, "#000"], [0.2, "#3a0a12"], [0.6, "#8a1028"], [1, RED]], t + 0.13, 0.25);
      fade(glowD.current!, 0, 1, t + 0.13, 0.25);
    };
    // dislike off: press 4.15, red -> dark red -> black 4.30-4.60, glow out 4.30-4.60
    const dislikeOff = (t: number) => {
      press(dislike.current!, t, 0.88);
      colour(down.current!, [[0, RED], [0.33, "#7a1020"], [0.66, "#2a0508"], [1, "#000"]], t + 0.15, 0.3);
      fade(glowD.current!, 1, 0, t + 0.15, 0.3);
    };
    return { likeOn, likeOff, dislikeOn, dislikeOff };
  };

  /* frames -> Motion keyframes: one array per value, times = offsets, ease[i] drives segment i */
  const toMotion = (frames: Frame[], def: Ease) => {
    const values: Record<string, V[]> = {};
    for (const k of Object.keys(frames[0][1])) values[k] = frames.map((f) => f[1][k]);
    return { values, times: frames.map((f) => f[0]), ease: frames.slice(0, -1).map((f) => f[2] ?? def) };
  };
  const unitPx = () => (scope.current ? scope.current.offsetWidth / 720 : 1);
  const k = reduce ? 0.001 : 1;

  useEffect(() => {
    if (!demo) return;
    /* every step lands on one 4.83 s track per element and value, keyframes at the clip's absolute seconds;
       between steps the value holds (the HTML's fill: forwards) */
    type Key = { t: number; v: V; e: Ease };
    const tracks = new Map<Element, Map<string, Key[][]>>();
    const emit = (el: Element, frames: Frame[], t0: number, dur: number, def: Ease) => {
      const byKey = tracks.get(el) ?? new Map<string, Key[][]>();
      tracks.set(el, byKey);
      for (const key of Object.keys(frames[0][1])) {
        const seg = frames.map(([o, vals, e], i) => ({ t: t0 + o * dur, v: vals[key], e: i < frames.length - 1 ? e ?? def : ("linear" as Ease) }));
        byKey.set(key, [...(byKey.get(key) ?? []), seg]);
      }
    };
    const u = unitPx();
    emit(cursor.current!, PATH.map(([t, x, y]) => [t / DEMO_LEN, { x: (x - 4) * u, y: (y - 4) * u }] as Frame), 0, DEMO_LEN, "linear");
    const a = actions(emit, u);
    a.likeOn(0.42); a.likeOff(1.85); a.dislikeOn(2.92); a.dislikeOff(4.15);
    const all: { stop: () => void }[] = [];
    for (const [el, byKey] of tracks) {
      for (const [key, segs] of byKey) {
        const keys = segs.sort((p, q) => p[0].t - q[0].t).flat();
        if (keys[0].t > 0) keys.unshift({ ...keys[0], t: 0, e: "linear" });
        if (keys[keys.length - 1].t < DEMO_LEN) keys.push({ ...keys[keys.length - 1], t: DEMO_LEN });
        const times = keys.map((x) => Math.min(1, x.t / DEMO_LEN));
        for (let i = 1; i < times.length; i++) if (times[i] <= times[i - 1]) times[i] = times[i - 1] + 1e-6;
        all.push(animate(el, { [key]: keys.map((x) => x.v) }, {
          duration: Math.max(DEMO_LEN * k, 0.001), times, ease: keys.slice(0, -1).map((x) => x.e),
        }));
      }
    }
    return () => all.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, reduce]);

  /* live: the pair is a single choice; clicking the active one clears it */
  const set = (next: Choice) => {
    const emit = (el: Element, frames: Frame[], t0: number, dur: number, def: Ease) => {
      const { values, times, ease } = toMotion(frames, def);
      animate(el, values, { delay: t0 * k, duration: Math.max(dur * k, 0.001), times, ease });
    };
    const a = actions(emit, unitPx());
    if (state.current === "like") a.likeOff(0);
    if (state.current === "dislike") a.dislikeOff(0);
    if (next === "like") a.likeOn(0);
    if (next === "dislike") a.dislikeOn(0);
    state.current = next;
    setChoice(next);
  };

  const pressed = (b: Choice) => (demo ? false : choice === b);
  return (
    <div
      ref={scope}
      className={`relative w-[calc(720*var(--u))] h-[calc(720*var(--u))] bg-[#f1f1f1] overflow-hidden ${className ?? ""}`}
      style={unit ? { ["--u" as string]: unit } : undefined}
    >
      <button
        ref={like}
        type="button"
        aria-label="Like"
        aria-pressed={pressed("like")}
        onClick={demo ? undefined : () => set(state.current === "like" ? null : "like")}
        className={`${BTN} left-[calc(174*var(--u))] rounded-[calc(66*var(--u))_calc(8*var(--u))_calc(8*var(--u))_calc(66*var(--u))] ${demo ? "cursor-default" : "cursor-pointer"}`}
        style={btnStyle}
      >
        <span ref={glowL} className={GLOW} style={glowLike} />
        <span ref={up} className={`${GLYPH} left-[calc(67*var(--u))] top-[calc(28*var(--u))]`}>
          <Thumb />
        </span>
      </button>
      <button
        ref={dislike}
        type="button"
        aria-label="Dislike"
        aria-pressed={pressed("dislike")}
        onClick={demo ? undefined : () => set(state.current === "dislike" ? null : "dislike")}
        className={`${BTN} left-[calc(366*var(--u))] rounded-[calc(8*var(--u))_calc(66*var(--u))_calc(66*var(--u))_calc(8*var(--u))] ${demo ? "cursor-default" : "cursor-pointer"}`}
        style={btnStyle}
      >
        <span ref={glowD} className={GLOW} style={glowDislike} />
        <span ref={down} className={`${GLYPH} left-[calc(53*var(--u))] top-[calc(40*var(--u))]`}>
          <Thumb down />
        </span>
      </button>
      {demo && (
        <div
          ref={cursor}
          className="absolute left-0 top-0 w-[calc(48*var(--u))] h-[calc(70*var(--u))] pointer-events-none"
          style={{
            filter: `drop-shadow(${U(1)} ${U(3)} ${U(3)} rgba(0,0,0,.32))`,
            transform: `translate(${U(PATH[0][1] - 4)}, ${U(PATH[0][2] - 4)})`,
          }}
        >
          <svg viewBox="0 0 48 70" aria-hidden="true" className="block w-full h-full">
            <path d="M4 4L4 57L17 45L26 66L35.5 62L27 41.7L44 41.7Z" fill="#000" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
