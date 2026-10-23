# Playful Feedback Toggle Buttons — React port

Design by Nitish Khagwal (https://x.com/nitishkmrk/status/2112156660265546145).
`Rebuild.tsx` is a React 19 + Tailwind CSS v4 + Motion port of `../index.html`.

## Use it

1. `npm i motion` (React 19 is assumed).
2. Set up Tailwind v4 (`@import "tailwindcss";`) and make sure it scans this file, e.g. `@source "./path/to/Rebuild.tsx";`.
3. Fonts: none. `fonts` is exported as `[]` because the HTML file loads no Google Fonts.
4. Size: the stage is 720 × 720 units. Either set `--u` on an ancestor (`:root { --u: 1px; }`) or pass `unit`:
   ```tsx
   import Rebuild from "./Rebuild";
   <Rebuild unit="0.5px" />          // 360 × 360, live buttons
   <Rebuild demo unit="1px" />       // replays the clip's 4.83 s timeline from mount, with the cursor
   ```
   In Next.js, the file starts with `"use client"`, so you can import it from a server component.
5. `className` is appended to the root (the stage).

`demo` lays the HTML's `?demo=1` actions on the same clock: like on at 0.42 s, like off at 1.85 s, dislike on at 2.92 s and dislike off at 4.15 s. The cursor follows the same 10 fps path. Without `demo`, the two buttons are a single choice, and clicking the active one clears it, as in the HTML. With reduced motion, every duration and delay is multiplied by 0.001, the same as the HTML, so each state lands at once.

## Scores (`scripts/port-check.ts`)

| | score | stills | mid-motion | moves where the clip moves | half size |
|---|---|---|---|---|---|
| HTML file (last full check) | 93 | 95 | 92 | yes | — |
| port, check 1 | 88 | 91 | 87 | still in 12 of 17 spans | scales (1.8) |
| port, check 2 | 88 | 91 | 88 | still in 12 of 17 spans | scales (4.7) |

**The port does not pass the gate yet.** Its score is 5 below the HTML's, and the motion read fails. The side-by-side suggests the checker is the cause, not the port. In `side.png`, the port's rows 2–5 show the dislike press, red and glow (about 2.9–4.5 s on the port's timeline), while the clip rows are at about 0.2–1.0 s. From row 6 on, the port is at its end state. The port's timeline runs in the right order with the right durations. The photos are taken late.

`check-build.ts --realtime` (lines 120–135) does not seek. It sleeps until each moment's time and then takes the photo. But it also runs `compareBuild` and the image work inline between moments. The first moment does the element reading as well, so the clock is about 2.6 s ahead before the second photo is taken. The lag then keeps growing. Every moment after the first is photographed later than its timestamp, so the like leap (0.65–1.30 s) is never captured. A WAAPI-backed timeline would not help, because the real-time branch never seeks `document.getAnimations()`.

Check 1 drove the demo with a Motion `useAnimate` sequence. Check 2 used one explicit 4.83 s keyframe track per element and value. Both gave the same frames, which is consistent with the lag above. I did not run checks 3–5. The checker would need to capture in real time without blocking, or take each photo before scoring the last one.

## Differences from the HTML file

- **Transforms are Motion's `x`, `y`, `scale` and `rotate`.** The HTML uses one `transform` string. Motion composes them in the same order (translate, scale, rotate), so the result is the same.
- **Translations scale with `--u`.** The HTML's script hard-codes `u = 1`, so its leap and wobble translations stay in fixed px at any size. The port multiplies them by the stage's measured unit (`offsetWidth / 720`). At half size the leap is half as far, as it should be.
- **Glyph colour is on the glyph `<span>`.** The HTML animates the `<svg>` element. The paths use `currentColor`, so the colour is the same.
- **The cursor is a `<div>` wrapping the cursor SVG.** Motion moves the `<div>`, and the drop-shadow is on it.
- **Turning like off in live mode resets the leap.** The HTML cancels every animation on the glyph when like is turned off. The port gets the same effect by animating `x`, `y` and `rotate` to 0 alongside the 0.94 squash.
- **The demo is one track per element and value.** It holds between actions, which matches the HTML's `fill: forwards`. Each keyframe carries its own easing, as in the HTML: `ease-in` = [.42,0,1,1], `ease-out` = [0,0,.58,1], `ease-in-out` = [.42,0,.58,1], plus the HTML's two cubic-beziers.
