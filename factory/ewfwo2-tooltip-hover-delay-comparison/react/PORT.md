# Tooltip Hover Delay Comparison — React port

Design by Juliette (@shedsgns), https://x.com/shedsgns/status/2112265023464603894

`Rebuild.tsx` is a React 19 + Tailwind CSS v4 + Motion port of `../index.html`. It is one file that exports a default `Rebuild` component and a `fonts` list.

## Use it

1. Install Motion: `npm i motion`. React 19 is the only other dependency.
2. Set up Tailwind v4 (`@import "tailwindcss";`). Make sure Tailwind scans the component: put it under a scanned folder or add `@source "path/to/Rebuild.tsx";`.
3. Add the fonts. The component does not insert `<link>` tags. Load each URL in `fonts`:
   - Next.js (app router), in `layout.tsx`: `{fonts.map((f) => <link key={f} rel="stylesheet" href={f} />)}` inside `<head>`.
   - Vite: add the same `<link rel="stylesheet">` to `index.html`.
4. Size it. Every length is `calc(N * var(--u))`, and the stage is 1440 × 1080 units.
   - Pass `unit`, for example `<Rebuild unit="0.5px" />` for a 720 × 540 stage.
   - Or set `--u` on any ancestor, for example `:root { --u: 1px }`.
5. Pick the mode:
   - `<Rebuild demo />` replays the clip's 15.98 s sequence once from mount. It uses the same start times, durations and easings as `index.html?demo=1`, and holds the last frame.
   - `<Rebuild />` matches the HTML without `?demo`. It shows the final state (3.5s / 6.9s and 0.5s / 3.7s), and the toolbars answer the pointer:
     - top toolbar: every tooltip waits 500 ms, then fades in over 0.15 s
     - bottom toolbar: only the first tooltip waits; later ones show at once until the pointer leaves the toolbar
   - Under `prefers-reduced-motion`, `demo` shows the static final state, and pointer tooltips appear with no delay or fade (the HTML's reduced-motion rule).

It is a client component (`"use client"`), so in Next.js you can import it from a server page.

## How it maps

- The HTML's `play()` helper became `keys()`. It takes the same `[time, value, easing]` points on the 15.98 s timeline, pads them to 0 and 1, and gives each easing to the segment after its point. Motion `animate` from `useAnimate` plays them with `duration`, `times` and a per-segment `ease` array. `cubic-bezier(.4,0,.2,1)` → `[0.4,0,0.2,1]`, and `ease-in-out` → `[0.42,0,0.58,1]`.
- The `@property` integer counters (`--ms`, `--w`, `--e`) printed through CSS `counter()` became Motion values. Each is rendered as text via `useTransform`, rounded to an integer the way a registered `<integer>` interpolates. The ring's conic-gradient arc reads the same `ms` value, so the number and the arc stay in step.
- The cursor's `translate(...)`, the segment widths and the axis label's `translateX` are numbers in units. They are animated as Motion values and written as `calc(N * var(--u))`, so they scale with `--u`.
- `:hover` / `transition-delay` / the `warm` class became React state and `motion.div` `animate` with `transition { duration: .15, ease: [.25,.1,.25,1], delay: .5 | 0 }`. Warm turns on when a bottom tooltip finishes fading in (the HTML's `transitionend` at opacity 1) and turns off on pointer leave.

## Scores

`bun --conditions=react-server scripts/port-check.ts ewfwo2-tooltip-hover-delay-comparison`, two checks:

| check | score | stills | mid-motion | motion read | scale |
|---|---|---|---|---|---|
| 1 | 87 | 85 | 88 | still in 6 of 19 spans where the clip moves | scales (diff 1.4) |
| 2 | 88 | 86 | 88 | still in 7 of 19 spans where the clip moves | scales (diff 1.2) |

The HTML file scored 94 on its last full (seeked) check. **The port does not pass the gate: it is 6 below the HTML, and the motion read fails.** The evidence below points at the checker's real-time capture, not the port's timeline.

- `check-build.ts --realtime` photographs each moment when its time comes, but it runs `compareBuild` between photos. The first moment also does the element reading.
- File times from check 2: `0s.png` at 17:45:28, `0.5s.png` at 17:45:38 (10 s later), then about one photo per 0.5 s until `15.9s.png` at 17:45:47.
  - From 0.5 s to about 13 s, every photo is 3–10 s late. That is where the "stays still" spans come from.
  - Check 1 had the same lag. Its photo labelled 0.5 s shows the port at about 9.5 s (bottom B hovered, "266ms" on the pill). Its photo labelled 12.6 s shows the end state.
- The 0 s photo is the only one taken on time. In check 2 it matches `../0s.png` (the HTML file's render at 0 s): cards, Indie Flower titles, toolbar, dividers, "0.0s waiting" counters, empty timelines, the arrow cursor and the "500ms" pill.
- Check 1's 0 s photo found two things:
  - A real bug, fixed before check 2: the timeline segments started full instead of empty. A width Motion value that starts at 0 never wrote its first value.
  - Fallback faces for the titles and the italic "I". The page had been open only 400 ms, so the Google fonts had not loaded yet. The compiled CSS has the right families, and check 2 drew them correctly.
- Checks 3–5 were not run. The port cannot change when the checker takes its photos, so they would repeat the same late frames. Meeting the gate needs a checker that photographs without blocking, or one that takes each photo before it scores the last one.

## Differences from the HTML file

- Colour tween: the axis label's `#1a1a1a → #b0b0b0` fade at 15.72–15.98 s is interpolated by Motion. Its midpoint can differ slightly from the browser's sRGB interpolation.
- Near-identical times: where the HTML has two keyframes at the same offset (the top cursor's 0 → 0.35 opacity at 0 s), the port spaces them 1e-7 apart, because Motion needs increasing `times`. The result looks the same.
- Pointer mode: the hover square shows on React pointer enter/leave instead of CSS `:hover`. Each tooltip's fade-out is a Motion tween of 0.15 s with the CSS `ease` curve, the same as the HTML's transition.
- Everything else (sizes, colours, shadows, SVG paths, mask, drop shadow, timings) is copied from `index.html` unchanged.
