# FlyingPress Bento Feature Grid: React port

Design by Ashik (@AshikArtistry), https://x.com/AshikArtistry/status/2110310645874729396.
`Rebuild.tsx` ports `../index.html` to one React 19 component, styled with Tailwind CSS v4 and animated with Motion (`motion/react`).

## Use it

1. Install Motion: `npm i motion`. You also need React 19 and a working Tailwind v4 setup (`@import "tailwindcss";` in your CSS). Tailwind must scan `Rebuild.tsx`: keep it inside your source globs, or add `@source "path/to/Rebuild.tsx";`.
2. Add the fonts. `fonts` is exported as an array of Google Fonts stylesheet URLs.
   - Next.js (app router): in `layout.tsx`, `{fonts.map(f => <link key={f} rel="stylesheet" href={f} />)}` inside `<head>`.
   - Vite: add the same `<link rel="stylesheet">` tags to `index.html`.
3. Set the unit. Every size is `calc(N * var(--u))`, and the stage is 1200 × 1080 units. You can either:
   - set `--u` on a parent (`:root { --u: 1px; }` for full size, `0.5px` for half), or
   - pass `unit`: `<Rebuild unit="0.5px" />`.
4. Choose a mode with `demo`:
   - `<Rebuild demo />` replays the clip's 6 s timeline from mount, as `index.html?demo=1` does.
   - Without `demo`, the ambient loops run (vitals list, app tiles, orbit, logo rows). The plugin button and the three toggles respond to clicks, and the cursor is hidden.
5. `className` goes on the stage root. The file starts with `"use client"`, so it can be imported from a Next.js server component.

## Scores

Final check (`bun --conditions=react-server scripts/port-check.ts 1ipk9s-flyingpress-bento-feature-grid`, run 10):

| | Port | HTML file |
|---|---|---|
| Score (13 moments, real time) | **78** (4 stills 79, 9 mid-motion 77) | 78 |
| Motion | changes where the clip changes | |
| Scale | half size matches full (difference 7.1) | |
| Types | clean in strict mode | |
| Gestures | all 24 answer as in the HTML file (frames at rest differ by 2.7) | |

Run 9 failed the gesture check on the top metric pill. Neither page listens to the pointer there. The port's ambient vitals loop started its clock at React mount, but the HTML's WAAPI loops start at page load, so the pill moved one gesture step earlier in the port. Without `demo`, the ambient loops (vitals, app tiles, orbit, logo rows) now start with a negative delay of `performance.now()`. That puts them in phase with a clock that began at page load, as in the HTML. With `demo`, everything still starts from mount.

An earlier round also scored 78, but strict mode found 11 type errors. They came from the keyframe helpers: the `easing` field clashed with the frame's index signature, and the loop props were typed as plain records, which `motion.*` components reject. `Loop` now uses Motion's `TargetAndTransition` and `Transition` types, and `Ease` is a 4-number tuple. The runtime values did not change, and neither did the score.

## Differences from the HTML file

- **Ambient loop phase:** without `demo`, the loops are phased to page load through `performance.now()`. If the component mounts later, for example after client-side navigation, the loops start mid-cycle rather than at 0 s. That matches what the HTML's loops would show at the same moment.

- **Reduced motion:** `useReducedMotion()` turns off the ambient loops and the demo timeline, even with `demo` set, as this task asked. The HTML keeps playing `?demo=1` under reduced motion. Elements rest where the HTML's `still` branch puts them, and clicks still toggle state, with no transition.
- **JS-driven transforms:** keyframes that use `calc(N * var(--u))` (vitals pills, logo rows, cursor, folding pills, toggle knobs) run on Motion's JS animator rather than WAAPI. Motion does not hand values containing CSS variables to WAAPI, so these are not in `document.getAnimations()`. Opacity, filter and rotation loops can still run on WAAPI.
- **Toggle colours:** Motion interpolates the toggle track colour (`#e6e6ea` ↔ `#f8792a`) in its own colour space. During the 0.18 s change, the midpoint can differ slightly from the browser's interpolation.
- **Shared SVG defs:** the `<defs>` (`#F`, `#Fp`) became an inline `FMark` component, so several instances on one page do not clash on ids. The unused `#gl` and `#ck` defs were dropped.
- **Dot dither:** the `.dots::after` pseudo-element is a last-child overlay `div`, with the same gradients and mask.
- **Generated glyph markup:** the card 4 tile glyphs and card 6 logo glyphs are the HTML's SVG strings, injected with `dangerouslySetInnerHTML`.
- **Line height:** the root sets `line-height: normal`, so Tailwind's preflight (1.5) does not move un-sized text such as the plugin name and the metric names.
