# Vercel Agents Homepage Redesign — React port

`Rebuild.tsx` is a React 19 component, styled with Tailwind CSS v4 and animated with Motion. It ports `../index.html`. Design by Christopher Kindl (https://x.com/kindlaar/status/2112285144774234287).

## Use it

1. `npm i motion` (react 19 is assumed). Tailwind v4 must already be set up, and it must scan this file. In Vite, use `@tailwindcss/vite`. In Next.js, use `@tailwindcss/postcss`. If the file lives outside the scanned paths, add `@source "path/to/Rebuild.tsx";` to your CSS.
2. Add the fonts. `fonts` exports one stylesheet URL (Geist 300..600). In Next.js, render `fonts.map((href) => <link key={href} rel="stylesheet" href={href} />)` in the root layout's `<head>`. In Vite, add the same `<link>` to `index.html`.
3. Size it. Every length is `calc(N * var(--u))`, and the stage is 1482 × 1080 units. Either set `--u` on an ancestor (for example `:root { --u: 1px; }`, or `--u: calc(100vw / 1482)` for full width), or pass `unit="0.5px"`.
4. Render it:
   ```tsx
   import Rebuild from "./Rebuild";
   <Rebuild />            // live: hover a cube face or the cube's left point for its note; click the logo to switch theme
   <Rebuild demo />       // replays the clip's 7.13 s timeline once from mount, like index.html?demo=1
   ```
   The file starts with `"use client"`, so it can be imported from a Next.js server component.

## Scores (`bun --conditions=react-server scripts/port-check.ts`, 4 checks)

| | Port | HTML file |
|---|---|---|
| Pixel score | 30 over 11 moments (stills 41, mid-motion 28) | 84 |
| Moves where the clip moves | still in 4 of 10 spans | in step |
| Scales at half size | yes (difference 4.5) | — |

**The port does not meet the "within 4" bar on this checker, and the 30 does not measure the port.** In `--realtime` mode, `scripts/check-build.ts` compares each moment before it takes the next screenshot. For check 3, a temporary on-screen clock (since removed) showed when each screenshot was really taken: 0.07 s, then 6.51, 8.51, 10.89, 12.99, 15.27, 17.32, 19.89, 22.26, 24.49 and 26.61 s. That is about 2.2 s per moment. The timeline is 7.13 s long and the moments are 0.5 s apart. So the first moment is the only one taken on time. The other ten all show the timeline's end state: dark theme, compact cube, no notes, cursor at (906, 700). The clock also showed `--d` = 1 and `--x` = 0 in every late shot, which are the right end values.

- The 0 s moment was taken on time, and it matches the clip by eye in `side.png`: light theme, compact cube, cursor below the cube.
- The 1pekjm port ran into the same lag (about 4.5 s per moment) and records it in its PORT.md. To score a one-shot timeline like this one, the checker would need to take every screenshot first and compare afterwards, or seek Motion's clock. Both changes are outside this folder.
- The first two checks used a different demo implementation (`animate(selector, …)`, then motion values). Both got the same 30, which fits the timing explanation.

## How it maps to the HTML

- **The scalars.** The HTML drives everything from two registered CSS properties: `--d` (theme, 0 → 1) and `--x` (cube spread, 0 → 1). In the port they are Motion values bound as `--d` and `--x` on the root, so every `color-mix(... calc(var(--d) * 100%) ...)` and `translate(calc(var(--x) * Npx) ...)` is copied unchanged. Motion writes the number inline every frame, so the `@property` registrations are not needed and are left out.
- **Demo.** `useAnimate` runs one track per value from mount: `--d`, `--x`, the four note opacities, the three face highlights, and cursor x and y. Each track has the HTML's keyframes at `t / 7.133`, padded to 0 and 1 the same way `tl()` pads them, with ease-in-out (`[0.42, 0, 0.58, 1]`) on every segment, over 7.133 s, and holds its last value at the end.
- **Hover.** One `pointerover` handler on the cube SVG finds which piece is under the pointer (frame, core, a face, or the left-point hit area). `--x` animates to 1 over 0.18 s with ease-out, the same as the HTML's `transition: --x .18s ease-out` under `:has()`. The face highlight and its note fade over 0.2 s with `ease`. The logo click flips `--d` instantly, like the HTML's class toggle.
- **Generated geometry.** The six frame bars (`T`, `UR`, `UL`, `flip`, and the slide offsets) and the three faces are built with the same numbers in a `useMemo` and constant tables.
- **Reduced motion.** `useReducedMotion()` turns off the demo timeline and the cursor, and makes the hover changes instant. This matches the HTML's `transition: none` under `prefers-reduced-motion`.

## Differences from the HTML file

- **Cursor units:** the HTML moves the demo cursor in raw px. The port moves it with `calc(N * var(--u))`, so it stays in place at any size. At `--u: 1px` the two are identical.
- **The cursor is not rendered without `demo`, or under reduced motion.** The HTML hides it with `display: none` in the same cases.
- **Hover during the demo:** in the HTML, WAAPI with `fill: both` overrides hover for the whole demo. In the port, the first real hover takes over the scalars it touches (`--x`, the highlights and the notes), and the timeline keeps running for the rest.
- **SVG ids** for the gradients and the blur filter get a `useId()` prefix, so two instances on one page do not collide.
- **Preflight:** Tailwind's preflight makes SVGs `display: block`, so the snowflake inside the Connect note gets `inline` back. The root sets `leading-normal` and `text-left` so the page's own type settings do not leak in.
