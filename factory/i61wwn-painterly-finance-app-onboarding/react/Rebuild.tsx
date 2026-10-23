"use client";
/*
  Painterly Finance App Onboarding, rebuilt from the clip by Moiz Arshi
  Source: https://x.com/MoizArshi29/status/2109139298004172909

  Port of ../index.html. The painting is one sampled plate (the clip's per-pixel median), in ./plate.ts. Drawn: the
  phone, the glass rings and their lips, the spinner, the copy, the pill.
*/
import { motion, useReducedMotion } from "motion/react";
import { plate } from "./plate";

export const fonts: string[] = ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"];

/* glass rings: a ring is born at the spinner (156, 451) every 2 s, grows at 53 px/s, full for 5 s and gone by 6.4 s.
   Its lip is a dark line just inside the rim and a faint light line just outside; inside the rim the plate again,
   shrunk to three quarters about the spinner, seen through a soft-edged slice (a fisheye edge). */
const css = `
.i61wwn-ring { --R: calc(var(--r) * var(--u)); --m: .75; --cx: calc(156 * var(--u)); --cy: calc(451 * var(--u)); }
.i61wwn-ring > i, .i61wwn-ring::after { position: absolute; inset: 0; content: ""; }
.i61wwn-ring > i { background: var(--plate) no-repeat; background-size: calc(426 * var(--u) * var(--m)) calc(916 * var(--u) * var(--m)); background-position: calc(var(--cx) * (1 - var(--m)) - 56 * var(--u) * var(--m)) calc(var(--cy) * (1 - var(--m)) - 152 * var(--u) * var(--m));
  -webkit-mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(var(--R) - 16 * var(--u)), #000 calc(var(--R) - 10 * var(--u)), #000 calc(var(--R) - 0.5 * var(--u)), transparent calc(var(--R) + 0.5 * var(--u)));
  mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(var(--R) - 16 * var(--u)), #000 calc(var(--R) - 10 * var(--u)), #000 calc(var(--R) - 0.5 * var(--u)), transparent calc(var(--R) + 0.5 * var(--u))); }
.i61wwn-ring::after { background: radial-gradient(circle at var(--cx) var(--cy), transparent calc(var(--R) - 4.8 * var(--u)), rgba(50,30,10,.18) calc(var(--R) - 3.6 * var(--u)), rgba(50,30,10,.18) calc(var(--R) - 1.2 * var(--u)), transparent calc(var(--R) + 0.1 * var(--u)), rgba(255,255,255,.07) calc(var(--R) + 0.8 * var(--u)), rgba(255,255,255,.07) calc(var(--R) + 2.5 * var(--u)), transparent calc(var(--R) + 4 * var(--u))); }
`;

// one 8 s linear cycle: --r 0 to 424 source px; opacity 1 until 62.5 %, .2 at 75 %, 0 from 80 %
const TIMES = [0, 0.625, 0.75, 0.8, 1];
const R_KEYS = [0, 265, 318, 339.2, 424];
const O_KEYS = [1, 1, 0.2, 0, 0];
const DELAYS = [-7.08, -5.08, -3.08, -1.08];

// where each ring sits at 0 s, for reduced motion (the HTML pauses the animation there)
const at = (p: number) => {
  const i = Math.max(0, TIMES.findIndex((t, k) => p >= t && p <= TIMES[k + 1]));
  const f = (p - TIMES[i]) / (TIMES[i + 1] - TIMES[i]);
  return { r: R_KEYS[i] + (R_KEYS[i + 1] - R_KEYS[i]) * f, o: O_KEYS[i] + (O_KEYS[i + 1] - O_KEYS[i]) * f };
};

// CSS steps(9): nine 40 degree jumps a second
const steps9 = (p: number) => Math.floor(p * 9) / 9;

export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }) {
  // demo and live are the same: the rings and the spinner loop from mount, and the clip has no gesture
  void demo;
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative w-[calc(1628*var(--u))] h-[calc(1080*var(--u))] overflow-hidden bg-[#fdfdfd] ${className ?? ""}`}
      style={{ ...(unit ? { ["--u" as string]: unit } : {}), fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <style>{css}</style>
      {/* the phone is the plate: 314 x 684 at 656,199, corners of 27 */}
      <div
        className="absolute left-[calc(656*var(--u))] top-[calc(199*var(--u))] w-[calc(314*var(--u))] h-[calc(684*var(--u))] rounded-[calc(27*var(--u))] overflow-hidden isolate"
        style={{
          ["--plate" as string]: `url("${plate}")`,
          background: "var(--plate) calc(-56 * var(--u)) calc(-152 * var(--u)) / calc(426 * var(--u)) calc(916 * var(--u)) no-repeat",
        }}
      >
        {DELAYS.map((delay) => {
          const p0 = at(-delay / 8);
          return (
            <motion.div
              key={delay}
              className="i61wwn-ring absolute inset-0 pointer-events-none"
              style={{ ["--r" as string]: p0.r, opacity: p0.o }}
              animate={reduce ? undefined : { ["--r" as string]: R_KEYS, opacity: O_KEYS }}
              transition={{ duration: 8, ease: "linear", times: TIMES, repeat: Infinity, delay }}
            >
              <i />
            </motion.div>
          );
        })}

        {/* spinner: nine 4 px spokes from radius 6 to 21.5 about (156.5, 451.5), 40 deg apart, the first 8 deg past 12 o'clock */}
        <motion.div
          className="absolute left-[calc(156.5*var(--u))] top-[calc(451.5*var(--u))] w-0 h-0"
          animate={reduce ? undefined : { rotate: [0, 360] }}
          transition={{ duration: 1, ease: steps9, repeat: Infinity }}
        >
          {Array.from({ length: 9 }, (_, k) => (
            <i
              key={k}
              className="absolute left-[calc(-2*var(--u))] top-[calc(-21.5*var(--u))] w-[calc(4*var(--u))] h-[calc(15.5*var(--u))] rounded-[calc(0.8*var(--u))] bg-white"
              style={{ transformOrigin: "calc(2 * var(--u)) calc(21.5 * var(--u))", transform: `rotate(${-8 + k * 40}deg)` }}
            />
          ))}
        </motion.div>

        {/* copy: three centred lines, Inter 13 on 19, cap tops at 505, 524, 543, letters 0.15 px tighter */}
        <div className="absolute left-0 top-[calc(501*var(--u))] w-[calc(314*var(--u))] text-center text-white text-[calc(13*var(--u))] leading-[calc(19*var(--u))] font-normal tracking-[calc(-0.15*var(--u))] antialiased">
          Take control of your finances with
          <br />
          budgets that fit your needs and help
          <br />
          you reach your goals faster.
        </div>

        {/* pill: 277 x 44 at 18,626, label Inter 13 medium; hover #f1f1f1, press scale .98 and #e9e9e9 */}
        <motion.button
          type="button"
          className="absolute left-[calc(18*var(--u))] top-[calc(626*var(--u))] w-[calc(277*var(--u))] h-[calc(44*var(--u))] border-0 p-0 rounded-[calc(22*var(--u))] text-[#0a0a0a] text-[calc(13*var(--u))] leading-none font-medium tracking-[calc(-0.1*var(--u))] cursor-pointer"
          style={{ backgroundColor: "#fdfdfd", fontFamily: "Inter, system-ui, sans-serif" }}
          whileHover={{ backgroundColor: "#f1f1f1" }}
          whileTap={{ scale: 0.98, backgroundColor: "#e9e9e9" }}
          transition={reduce ? { duration: 0 } : { backgroundColor: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }, scale: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] } }}
        >
          Get Started
        </motion.button>
      </div>
    </div>
  );
}
