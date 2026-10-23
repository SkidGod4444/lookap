"use client";
/*
  Vercel Agents Homepage Redesign — design by Christopher Kindl
  Source: https://x.com/kindlaar/status/2112285144774234287
  React 19 + Tailwind v4 + Motion port of factory/ti5i8b-vercel-agents-homepage-redesign/index.html.
  The cube, logo, cube mark, robot avatar and snowflake glyph are original SVG drawings.
  demo replays the clip's 7.13 s timeline from mount. Otherwise: hover a cube face (or the cube's left point)
  for its note; click the logo to switch theme.
*/
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { motion, motionValue, useAnimate, useReducedMotion, type MotionValue } from "motion/react";

export const fonts: string[] = ["https://fonts.googleapis.com/css2?family=Geist:wght@300..600&display=swap"];

const u = (n: number) => `calc(${n} * var(--u))`;
const D = 7.133; // the clip, seconds
const E = [0.42, 0, 0.58, 1]; // ease-in-out
const EASE = [0.25, 0.1, 0.25, 1]; // CSS ease
const EOUT = [0, 0, 0.58, 1]; // ease-out

/* light colour first, dark colour second; --d flips 0 -> 1 */
const mix = (dark: string, light: string) => `color-mix(in srgb, ${dark} calc(var(--d) * 100%), ${light})`;
const VARS = {
  "--bg": mix("#000", "#f7f7f7"),
  "--ink": mix("#fff", "#111"),
  "--mut": mix("#8f8f8f", "#444"),
  "--note": mix("#8f8f8f", "#5a5a5a"),
  "--nav": mix("#a1a1a1", "#555"),
  "--card": mix("#0a0a0a", "#fff"),
  "--line": mix("#2e2e2e", "#e4e4e4"),
  "--hair": mix("#333", "#d9d9d9"),
  "--fill": mix("#ededed", "#111"),
  "--onfill": mix("#000", "#fff"),
} as CSSProperties;
const stop = (dark: string, light: string): CSSProperties => ({ stopColor: `color-mix(in srgb,${dark} calc(var(--d)*100%),${light})` });

/* the HTML's tl(): keyframes at seconds over the clip, padded to 0 and 1, ease-in-out between each */
type Keys = [number, number][];
const track = (keys: Keys) => {
  const k = keys.map(([t, v]) => [Math.min(1, t / D), v]);
  if (k[0][0] > 0) k.unshift([0, k[0][1]]);
  if (k[k.length - 1][0] < 1) k.push([1, k[k.length - 1][1]]);
  return { values: k.map(([, v]) => v), opts: { duration: D, times: k.map(([t]) => t), ease: E } };
};
const fade = (spans: [number, number][]): Keys => [[0, 0], ...spans.flatMap(([a, b]): Keys => [[a, 0], [a + 0.2, 1], [b - 0.1, 1], [b + 0.05, 0]])];
const CUR: [number, number, number][] = [[0, 812, 744], [0.3, 950, 588], [0.95, 952, 594], [1.1, 1065, 548],
  [1.75, 1066, 550], [1.9, 920, 472], [2.45, 918, 474], [2.6, 812, 518], [3.2, 814, 520],
  [3.4, 824, 690], [5.0, 826, 692], [5.25, 933, 585], [5.95, 936, 588], [6.15, 906, 700]];

/* six bars, 13 px thick, measured spread out at 2.05s (top y 347-360 x 924-1077, right x to 1154 ending at y 480 / 531,
   left tip x 803 from y 374 to 640); ends cut along the lattice: slanted bars flat, top/bottom bars at 60deg.
   Three groups slide in by --x (L -21,0; T+UR 11,-17; B+LR 11,17) to sit on the compact silhouette at rest */
type Pt = [number, number];
const slide = (dx: number, dy: number): CSSProperties => ({ transform: `translate(calc(var(--x) * ${dx}px), calc(var(--x) * ${dy}px))` });
const flip = (q: Pt[]) => q.map(([x, y]): Pt => [x, 1011 - y]);
const T: Pt[] = [[924, 347], [1077, 347], [1069.5, 360], [931.5, 360]], UR: Pt[] = [[1077, 347], [1154, 480.4], [1139, 480.4], [1069.5, 360]];
const UL: Pt[] = [[879.8, 374], [894.8, 374], [818, 507], [803, 507]];
const BARS: [Pt[][], number, number][] = [[[T, UR], 11, -17], [[flip(T), flip(UR)], 11, 17], [[UL, flip(UL).map(([x, y]): Pt => [x, y + 3])], -21, 0]];
/* three rounded faces, compact; polygon + stroke of the same paint rounds the corners; 1 px rim from the wider stroke under it */
const FACES = [["fT", "gT", "912,374 1058,374 983,498 838,498", -4, -7],
  ["fR", "gR", "1067,385 1136,507 1067,628 998,507", 8, 0],
  ["fLL", "gL", "839,514 981,514 1056,641 914,641", -4, 8]] as const;
type Face = (typeof FACES)[number][0];

const CHEV = <svg viewBox="0 0 8 8" className="w-[calc(8*var(--u))] h-[calc(8*var(--u))]"><path d="M1.5 3 4 5.5 6.5 3" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
const nb = "absolute top-[calc(14*var(--u))] h-[calc(27*var(--u))] box-border rounded-[calc(6*var(--u))] border border-solid border-(--line) bg-(--card) text-(--ink) text-[calc(12.5*var(--u))] font-medium flex items-center justify-center";
const bub = "absolute box-border bg-(--card) border border-solid border-(--line) rounded-[calc(12*var(--u))] text-[calc(12.5*var(--u))] leading-[calc(18*var(--u))] py-[calc(10*var(--u))] px-[calc(12*var(--u))] text-(--ink) whitespace-nowrap";
const noteB = "block text-(--ink) font-semibold mb-[calc(5*var(--u))]";
const LEAD = "linear-gradient(90deg, var(--hair), color-mix(in srgb, var(--ink) 55%, transparent))";
const LEAD_R = "linear-gradient(90deg, color-mix(in srgb, var(--ink) 55%, transparent), var(--hair))";

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [over, setOver] = useState<string | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const play = demo && !reduce;

  // the HTML's scalars: --d (theme), --x (spread), the cursor, and each note's and highlight's opacity
  const mv = useMemo(() => ({
    d: motionValue(0), x: motionValue(0), cx: motionValue(CUR[0][1]), cy: motionValue(CUR[0][2]),
    n: { C: motionValue(0), S: motionValue(0), E: motionValue(0), D: motionValue(0) } as Record<string, MotionValue<number>>,
    hl: { fT: motionValue(0), fR: motionValue(0), fLL: motionValue(0) } as Record<Face, MotionValue<number>>,
  }), []);

  // frame bars: each group drawn at rest, offset back by its slide
  const frame = useMemo(() => BARS.map(([bars, dx, dy]) => ({ dx, dy, pts: bars.map((q) => q.map(([x, y]) => [x - dx, y - dy].join(",")).join(" ")) })), []);

  // demo: the clip's own timeline, from mount
  useEffect(() => {
    if (!play) return;
    const run = (m: MotionValue<number>, keys: Keys) => {
      const { values, opts } = track(keys);
      return animate(m, values, opts as never);
    };
    const all = [
      run(mv.d, [[0, 0], [4.09, 0], [4.11, 1]]),
      run(mv.x, [[0, 0], [0.3, 0], [0.42, 1], [3.35, 1], [3.45, 0], [4.98, 0], [5.1, 1], [6.12, 1], [6.24, 0]]),
      run(mv.n.C, fade([[0.2, 1.1], [5.1, 6.0]])),
      run(mv.n.S, fade([[1.0, 1.75]])),
      run(mv.n.E, fade([[1.8, 2.45]])),
      run(mv.n.D, fade([[2.5, 3.25]])),
      run(mv.hl.fLL, fade([[0.2, 1], [5.1, 6.0]])),
      run(mv.hl.fR, fade([[1.0, 1.75]])),
      run(mv.hl.fT, fade([[1.8, 2.45]])),
      run(mv.cx, CUR.map(([t, x]) => [t, x])),
      run(mv.cy, CUR.map(([t, , y]) => [t, y])),
    ];
    return () => all.forEach((a) => a.stop());
  }, [play, animate, mv]);

  // hover: which piece of the cube the pointer is on; --x .18s ease-out, highlights and notes .2s ease
  const onOver = (e: PointerEvent<SVGSVGElement>) => setOver((e.target as Element).closest("[data-p]")?.getAttribute("data-p") ?? null);
  const hovered = useRef(false);
  useEffect(() => {
    if (!hovered.current && over === null) return; // nothing hovered yet: leave the demo's timeline alone
    hovered.current = true;
    const ease = (s: number, e: number[]) => ({ duration: reduce ? 0 : s, ease: e });
    animate(mv.x, over !== null ? 1 : 0, ease(0.18, EOUT) as never);
    (["fT", "fR", "fLL"] as Face[]).forEach((f) => animate(mv.hl[f], over === f ? 1 : 0, ease(0.2, EASE) as never));
    Object.entries({ C: "fLL", S: "fR", E: "fT", D: "hL" }).forEach(([n, p]) => animate(mv.n[n], over === p ? 1 : 0, ease(0.2, EASE) as never));
  }, [over, reduce, animate, mv]);

  const g = (k: string) => `${id}${k}`;
  const noteBox = "absolute whitespace-nowrap pointer-events-none text-[calc(12*var(--u))] leading-[calc(16*var(--u))] text-(--note)";

  return (
    <motion.div
      ref={scope}
      className={`relative w-[calc(1482*var(--u))] h-[calc(1080*var(--u))] overflow-hidden bg-(--bg) text-(--ink) font-['Geist',system-ui,sans-serif] antialiased leading-normal text-left ${className ?? ""}`}
      style={{ ...VARS, ...(unit ? { ["--u" as string]: unit } : undefined), ["--d" as string]: mv.d, ["--x" as string]: mv.x } as never}
    >
      {/* nav */}
      <svg className="absolute left-[calc(127*var(--u))] top-[calc(20*var(--u))] w-[calc(18*var(--u))] h-[calc(16*var(--u))] cursor-pointer" viewBox="0 0 18 16" onClick={() => { mv.d.stop(); mv.d.set(mv.d.get() >= 0.5 ? 0 : 1); }}>
        <path d="M9 0 18 16H0z" fill="var(--ink)" />
      </svg>
      <div className="absolute left-[calc(172*var(--u))] top-[calc(19*var(--u))] flex gap-[calc(18*var(--u))] text-[calc(13*var(--u))] text-(--nav) leading-[calc(18*var(--u))]">
        <span className="flex items-center gap-[calc(4*var(--u))]">Products {CHEV}</span>
        <span className="flex items-center gap-[calc(4*var(--u))]">Resources {CHEV}</span>
        <span className="flex items-center gap-[calc(4*var(--u))]">Enterprise</span>
        <span className="flex items-center gap-[calc(4*var(--u))]">Pricing</span>
      </div>
      <div className={`${nb} left-[calc(1105*var(--u))] w-[calc(91*var(--u))]`}>Get a Demo</div>
      <div className={`${nb} left-[calc(1204*var(--u))] w-[calc(57*var(--u))]`}>Log In</div>
      <div className={`${nb} left-[calc(1271*var(--u))] w-[calc(63*var(--u))] bg-(--fill)! text-(--onfill)! border-(--fill)!`}>Sign Up</div>

      {/* hero copy */}
      <h1 className="absolute m-0 left-[calc(125*var(--u))] top-[calc(291*var(--u))] text-[calc(52.5*var(--u))] leading-[calc(55*var(--u))] font-[450] tracking-[-0.045em] text-(--ink)">Build and run<br />agents on Vercel</h1>
      <div className="absolute left-[calc(127*var(--u))] top-[calc(425*var(--u))] text-[calc(15.3*var(--u))] leading-[calc(24*var(--u))] text-(--mut)">Build agents, run them on agentic infrastructure,<br />and put them to work across your business.</div>
      <div className="absolute top-[calc(500*var(--u))] h-[calc(34*var(--u))] box-border rounded-[999px] text-[calc(14*var(--u))] font-medium flex items-center justify-center left-[calc(127*var(--u))] w-[calc(133*var(--u))] bg-(--fill) text-(--onfill)">Create an agent</div>
      <div className="absolute top-[calc(500*var(--u))] h-[calc(34*var(--u))] box-border rounded-[999px] text-[calc(14*var(--u))] font-medium flex items-center justify-center left-[calc(274*var(--u))] w-[calc(138*var(--u))] bg-(--card) text-(--ink) border border-solid border-(--line)">Talk to an expert</div>

      {/* chat */}
      <div className="absolute w-px bg-(--hair) left-[calc(888*var(--u))] top-[calc(298*var(--u))] h-[calc(52*var(--u))]" />
      <div className="absolute w-px bg-(--hair) left-[calc(1085*var(--u))] top-[calc(221*var(--u))] h-[calc(129*var(--u))]" />
      <div className={`${bub} left-[calc(1016*var(--u))] top-[calc(159*var(--u))] w-[calc(199*var(--u))] h-[calc(62*var(--u))] pt-[calc(11*var(--u))] rounded-br-none`}><b className="font-semibold">@data-agent</b> How did revenue<br />trend last quarter by region?</div>
      <div className={`${bub} left-[calc(797*var(--u))] top-[calc(237*var(--u))] w-[calc(242*var(--u))] h-[calc(61*var(--u))] pl-[calc(14*var(--u))] pt-[calc(11*var(--u))]`}>EMEA up 18%, North America down 4%.<br />I posted the chart in channel #revenue.</div>
      <svg className="absolute left-[calc(1196*var(--u))] top-[calc(196*var(--u))] w-[calc(28*var(--u))] h-[calc(26*var(--u))] overflow-visible" viewBox="1196 196 28 26">
        <path d="M1214.5 198V213Q1215 219 1221.8 220.6Q1213 221.9 1207 218.4L1199 220.6V205Z" fill="var(--card)" />
        <path d="M1214.5 198V213Q1215 219 1221.8 220.6Q1213 221.9 1207 218.4Q1204 220.5 1197 220.5" fill="none" stroke="color-mix(in srgb, #2e2e2e calc(var(--d) * 100%), #dadada)" />
      </svg>
      <div
        className="absolute left-[calc(758*var(--u))] top-[calc(270*var(--u))] w-[calc(28*var(--u))] h-[calc(28*var(--u))] box-border rounded-full border border-solid bg-(--card) flex items-center justify-center"
        style={{ borderColor: "color-mix(in srgb, #3a3a3a calc(var(--d) * 100%), #d4d4d4)", boxShadow: "0 1px 3px rgba(0,0,0,calc(.08 - var(--d) * .08))" }}
      >
        <svg viewBox="0 0 16 16" className="w-[calc(17*var(--u))] h-[calc(17*var(--u))]"><path d="M8 3.2v2.8" stroke="var(--ink)" strokeWidth="1.3" /><circle cx="8" cy="2.4" r="1.3" fill="var(--ink)" /><rect x="3.3" y="6.3" width="9.4" height="6.9" rx="2.3" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.5" /><rect x="1.2" y="8.3" width="1.5" height="3" rx=".6" fill="var(--ink)" /><rect x="13.3" y="8.3" width="1.5" height="3" rx=".6" fill="var(--ink)" /><circle cx="6.2" cy="9.7" r="1.15" fill="var(--ink)" /><circle cx="9.8" cy="9.7" r="1.15" fill="var(--ink)" /></svg>
      </div>

      {/* cube: drawn compact (the rest state); --x 0 -> 1 spreads every piece outward (hover) */}
      <svg className="absolute left-[calc(770*var(--u))] top-[calc(320*var(--u))] w-[calc(420*var(--u))] h-[calc(400*var(--u))] overflow-visible" viewBox="770 320 420 400" onPointerOver={onOver} onPointerLeave={() => setOver(null)}>
        <defs>
          <linearGradient id={g("gT")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={stop("#000", "#2b2b2b")} /><stop offset=".55" style={stop("#000", "#1b1b1b")} /><stop offset="1" style={stop("#000", "#171717")} /></linearGradient>
          <linearGradient id={g("gL")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={stop("#000", "#1e1e1e")} /><stop offset=".22" style={stop("#000", "#121212")} /><stop offset=".45" style={stop("#000", "#000")} /><stop offset="1" style={{ stopColor: "#000" }} /></linearGradient>
          <linearGradient id={g("gR")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={stop("#000", "#181818")} /><stop offset=".5" style={stop("#000", "#0e0e0e")} /><stop offset="1" style={stop("#000", "#0a0a0a")} /></linearGradient>
          <linearGradient id={g("gH")} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" style={stop("#171717", "#3a3a3a")} /><stop offset="1" style={stop("#080808", "#1f1f1f")} /></linearGradient>
          <filter id={g("blur")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <polygon filter={`url(#${g("blur")})`} fill="rgba(0,0,0,.17)" style={{ opacity: "calc(1 - var(--d))" }} points="840,545 905,420 1065,420 1135,545 1070,685 905,685" />
        <polygon fill="none" strokeWidth="2" style={{ stroke: "color-mix(in srgb,#1e1e1e calc(var(--d)*100%),#ececec)" }} points="799,507 886,342 1074,342 1160,507 1074,672 886,672" />
        <g data-p="frame">
          {frame.map(({ dx, dy, pts }, i) => (
            <g key={i} style={slide(dx, dy)}>
              {pts.map((p, j) => <polygon key={j} points={p} strokeWidth={1.2} strokeLinejoin="round" style={{ fill: "#000", stroke: "color-mix(in srgb,#3c3c3c calc(var(--d)*100%),#000)" }} />)}
            </g>
          ))}
        </g>
        <polygon data-p="core" strokeWidth="8" strokeLinejoin="round" style={{ fill: "#000", stroke: "#000", transformBox: "fill-box", transformOrigin: "center", transform: "scale(calc(1 + var(--x) * .03))" }} points="827,507 907,368 1065,368 1146,507 1065,645 907,645" />
        <g>
          {FACES.map(([f, gr, pts, dx, dy]) => (
            <g key={f} data-p={f} style={slide(dx, dy)}>
              <polygon points={pts} strokeWidth={12} strokeLinejoin="round" style={{ fill: "#000", stroke: `color-mix(in srgb,#6e6e6e calc(var(--d)*100%),${f === "fT" ? "#4a4a4a" : "#303030"})` }} />
              <polygon points={pts} strokeWidth={10} strokeLinejoin="round" fill={`url(#${g(gr)})`} stroke={`url(#${g(gr)})`} />
              <motion.polygon data-hl={f} points={pts} strokeWidth={10} strokeLinejoin="round" fill={`url(#${g("gH")})`} stroke={`url(#${g("gH")})`} style={{ opacity: mv.hl[f] }} />
              {f === "fT" && <path d="M855 488 873.5 488 873 472.5z" fill="#fff" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" pointerEvents="none" />}
            </g>
          ))}
        </g>
        <polygon data-p="hL" fill="transparent" points="798,478 832,478 832,536 798,536" />
      </svg>

      {/* annotations */}
      <motion.div data-n="E" className={`${noteBox} left-[calc(719*var(--u))] top-[calc(337*var(--u))] w-[calc(124*var(--u))]`} style={{ opacity: mv.n.E }}>
        <i className="absolute h-px not-italic left-[calc(124*var(--u))] top-[calc(7*var(--u))] w-[calc(50*var(--u))]" style={{ background: LEAD }} /><b className={noteB}>eve</b>Defines data-agent<br />with a run_sql tool and<br />a revenue skill
      </motion.div>
      <motion.div data-n="C" className={`${noteBox} left-[calc(719*var(--u))] top-[calc(661*var(--u))] w-[calc(124*var(--u))]`} style={{ opacity: mv.n.C }}>
        <i className="absolute h-px not-italic left-[calc(124*var(--u))] top-[calc(7*var(--u))] w-[calc(50*var(--u))]" style={{ background: LEAD }} /><b className={noteB}>Connect</b>Queried
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" className="inline w-[calc(12*var(--u))] h-[calc(12*var(--u))] align-[calc(-2*var(--u))] mx-[calc(2*var(--u))]"><path d="M6 .8v10.4M1.5 3.4l9 5.2M1.5 8.6l9-5.2M4.6 1.6 6 2.8l1.4-1.2M4.6 10.4 6 9.2l1.4 1.2" /></svg>
        Snowflake<br />through a scoped,<br />read-only connection
      </motion.div>
      <motion.div data-n="S" className={`${noteBox} left-[calc(1202*var(--u))] top-[calc(500*var(--u))] w-[calc(130*var(--u))]`} style={{ opacity: mv.n.S }}>
        <i className="absolute h-px not-italic left-[calc(-34*var(--u))] top-[calc(7*var(--u))] w-[calc(28*var(--u))]" style={{ background: LEAD_R }} /><b className={noteB}>Sandbox</b>Ran the regional<br />breakdown in an<br />isolated microVM
      </motion.div>
      <motion.div data-n="D" className={`${noteBox} left-[calc(645*var(--u))] top-[calc(500*var(--u))] w-[calc(120*var(--u))]`} style={{ opacity: mv.n.D }}>
        <i className="absolute h-px not-italic left-[calc(117*var(--u))] top-[calc(7*var(--u))] w-[calc(43*var(--u))]" style={{ background: LEAD }} /><b className={noteB}>Drives</b>Saved the Q3 export<br />and chart for the next<br />question
      </motion.div>

      {/* stats */}
      {[[124, "4T+", <>tokens per day running<br />on Vercel</>], [432, "3×", <>faster shipping at Rillet with a software<br />factory built on eve</>],
        [739, "1M+", <>weekly npm downloads<br />of eve</>], [1046, "< 5 min", <>to deploy your first agent<br />from the dashboard</>]].map(([x, n, c]) => (
        <div key={x as number} className="absolute top-[calc(847*var(--u))]" style={{ left: u(x as number) }}>
          <div className="text-[calc(56*var(--u))] leading-[calc(70*var(--u))] font-[360] tracking-[-0.03em] text-(--ink)">{n}</div>
          <div className="mt-[calc(4*var(--u))] text-[calc(14*var(--u))] leading-[calc(20*var(--u))] text-(--mut)">{c}</div>
        </div>
      ))}

      {play && (
        <motion.svg
          className="absolute left-0 top-0 w-[calc(14*var(--u))] h-[calc(20*var(--u))] pointer-events-none"
          viewBox="0 0 14 20"
          style={{ ["--cx" as string]: mv.cx, ["--cy" as string]: mv.cy, transform: "translate(calc(var(--cx) * var(--u)), calc(var(--cy) * var(--u)))" } as never}
        >
          <path d="M1 1v15.5l4-3.8 2.6 6 2.4-1-2.6-5.9h5.6z" fill="var(--onfill)" stroke="var(--ink)" strokeWidth="1.1" strokeLinejoin="round" />
        </motion.svg>
      )}
    </motion.div>
  );
}
