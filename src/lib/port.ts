import type { Draft } from "./drafts";
import type { EntryRubric } from "./rubrics";

/* How to build an entry in React 19 + Tailwind v4 + Motion (motion/react) from what lookap measured: the unit, a
   Tailwind theme from the measured palette, every measured move as a Motion transition, and a skeleton. Everything
   numeric comes from the draft measurement and is marked measured; easing is not measured and says so. Served by
   get_brief with stack "react" on Pro and Max. */
const hex = (h: string) => /^#[0-9a-f]{6}$/i.test(h);

export function portGuide(slug: string, d: Draft, rb?: EntryRubric) {
  const W = d.frame.w, H = d.frame.h;
  const palette = d.palette.filter((p) => hex(p.hex)).slice(0, 8);
  const theme = `@theme {\n${palette.map((p, i) => `  --color-${slug.split("-")[0]}-${i + 1}: ${p.hex}; /* ${p.share}% of the frame */`).join("\n")}\n}`;
  const moves = d.motion.flatMap((m, i) => m.moves.filter((mv) => mv.dTop || mv.dLeft).map((mv) => ({
    element: `${m.element} at [${m.box.join(", ")}]`,
    motion: `animate={{ x: [0, calc(${mv.dLeft})], y: [0, calc(${mv.dTop})] }} transition={{ delay: ${mv.from}, duration: ${(mv.ms / 1000).toFixed(2)}, ease: [0.2, 0.8, 0.2, 1] }}`.replace(/calc\((-?\d+)\)/g, (_, n) => `"calc(${n} * var(--u))"`),
    measured: `starts at ${mv.from}s, lasts ${mv.ms} ms, moves ${mv.dLeft} px across and ${mv.dTop} px down; the easing is a starting point, track the edge with look_at what=track to fit it`,
    part: i,
  })));
  const phases = d.phases.filter(([a, b]) => b - a >= 0.1).map(([a, b]) => ({ from: a, to: b, motion: `transition={{ delay: ${a}, duration: ${(b - a).toFixed(2)} }}` }));
  const said = rb ? rb.moves.map((m) => ({ element: m.element, what: m.what, from: m.from, to: m.to, px: m.px })) : [];
  return {
    stack: "React 19 + Tailwind CSS v4 + Motion (npm i motion; import { motion, useAnimate, useReducedMotion } from \"motion/react\")",
    unit: `One unit, --u, equals one source pixel; the frame is ${W} x ${H}. Write every size as a Tailwind arbitrary value in it, w-[calc(${W}*var(--u))] h-[calc(${H}*var(--u))], and set --u on the root: style={{ ["--u" as string]: "1px" }}, or min(calc(100vw / ${W}), calc(100vh / ${H})) to fit the viewport. Motion values take the same strings: x: "calc(24 * var(--u))".`,
    theme: { css: theme, use: "put it in the CSS file that imports tailwindcss; then bg-*, text-*, border-* classes use these names" },
    timeline: {
      duration: d.duration,
      phases,
      moves,
      fromRubric: said,
      demo: "replay the clip's timeline from mount when a demo prop is true (useAnimate with one sequence, steps at the measured starts); without it, answer only the pointer. useReducedMotion turns the timeline off.",
    },
    interactions: "hover and press: whileHover and whileTap with the clip's values; drag: drag with dragConstraints and dragElastic, the release spring fitted to the clip with look_at what=track",
    skeleton: `"use client";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";

export default function Rebuild({ demo = false, unit }: { demo?: boolean; unit?: string }) {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!demo || reduce) return;
    const run = animate([
      /* one step per measured move: [".selector", { y: "calc(N * var(--u))" }, { at: START_S, duration: S, ease: [x1, y1, x2, y2] }] */
    ]);
    return () => run.stop();
  }, [demo, reduce, animate]);
  return (
    <div ref={scope} style={unit ? { ["--u" as string]: unit } : undefined}
      className="relative overflow-hidden w-[calc(${W}*var(--u))] h-[calc(${H}*var(--u))] bg-[${d.background}]">
      {/* elements placed from the brief's boxes, every size in var(--u) */}
    </div>
  );
}`,
    check: "render it at the frame size, screenshot the brief's moments, and use check_rebuild and judge_rebuild exactly as for HTML: the checks read pixels, not markup",
  };
}
