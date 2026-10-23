# Minimal Tooltip Thinking Mode — React port

Design by rico (@_heyrico), https://x.com/_heyrico/status/2112212712306749537.
`Rebuild.tsx` is a React 19 + Tailwind CSS v4 + Motion port of `../index.html`.

## Use it

1. `npm i motion` (React 19 is assumed; no other packages).
2. Set up Tailwind v4 (`@import "tailwindcss";`) and make sure it scans the file, e.g. `@source "./path/to/Rebuild.tsx";`.
3. Add the fonts: render a `<link rel="stylesheet">` for each URL in the exported `fonts` array (Inter 400/500, JetBrains Mono 400). In Next.js put them in `app/layout.tsx` `<head>`; in Vite, in `index.html`.
4. Size it: every length is `calc(N * var(--u))` on a 1080 × 1080 stage. Either set `--u` on an ancestor (`:root { --u: 1px }` gives 1080 px; `--u: 0.5px` gives 540 px) or pass `unit`, e.g. `<Rebuild unit="0.5px" />`.
5. Play it: the component is a client component (`"use client"`). The 30 s transcript plays once from mount, with or without `demo`, the same way the HTML file plays with or without `?demo`. `<Rebuild demo />` is the clip's timeline from mount.

```tsx
import Rebuild, { fonts } from "./Rebuild";
// fonts.map((href) => <link key={href} rel="stylesheet" href={href} />)
<Rebuild demo unit="0.6px" className="rounded-xl" />
```

## Scores (`scripts/port-check.ts`)

Final check (2026-10-23, file unchanged from the earlier port run):

| | port | HTML file |
|---|---|---|
| pixel score | **91** (4 stills 93, 12 mid-motion 91), photographed in real time | 91 |
| moves where the clip moves | yes | yes |
| scales at half size | yes (difference 0) | |
| strict type-check | clean | |
| gestures that answer as in the HTML | 18 of 24 (**not met**) | |

The 6 gestures that differ are press/release header timer, hover/press/release thinking stream text and hover timeline rail. Neither page has a hover, press or drag (the clip has none, see NOTES.md), so these are not lost interactions. The gesture check runs the page without `demo` and samples the 30 s transcript as it plays. It counts a response as a change in the target's box between two steps on the same page. In every mismatch, one timeline event lands one step earlier on the port than on the HTML file:

- the 6.36 s header roll and counter slide
- the 12.0 s card fade-out with Reading → Read
- the 12.3 s and 13.1 s rail changes

In `interact/19.png` both frames show the same transcript, with the HTML at "10s" and the port at "11s". Each page runs in a fresh Chrome. On both pages the inline script waits for the Google Fonts stylesheet, which loads over the network, so where each timeline starts depends on that fetch. The previous run showed the same one-step lead. I did not change the component's start time: a delay tuned to the checker's load order would also shift the real-time score, which starts on `__go`.

- Earlier port work: check 1 used one JS motion value per channel (about 550 animations), and the page stalled while the words streamed in. In check 2 every blur-fade element gets one `animate(element, { opacity, filter, transform }, { duration: 30, times, ease })` call from `useAnimate`, which Motion can hand to the browser. Motion values drive only the rail, the counter slide, the text scroll, the skeleton lines and the cursor.

## How it maps

- The HTML's `tl()` / `show()` are kept as data. Each element has one 30 s track with keyframes at absolute seconds, padded to 0 and 1, and a per-segment `ease` array that matches the WAAPI keyframe easings (unset segments are `"linear"`). Zero-length segments, such as the source counter at 14.1 s, are nudged by 1e-6 so the times stay strictly increasing.
- Loops: the ring spinners are `motion.i` with `rotate: 360`, 0.9 s linear, repeating forever. The shimmer is `backgroundPosition` 100% → 0% over 2 s, linear, repeating. The HTML's `-.35s` delay is written as phase-shifted keyframes (`82.5% → 0% | 100% → 82.5%`).
- The thinking words, the source counter and the seconds counter are generated in code from the same text and tables, in the same DOM order, so each word starts at `1.6 + i / 22.5` s.

## Differences from the HTML file

- **Reduced motion** always holds the final frame, even with `demo`. The HTML's `?demo` ignores `prefers-reduced-motion`; the port follows the brief ("useReducedMotion turns the timeline and entrances off"). The spinner and shimmer loops keep running, as the HTML's CSS loops do.
- **The header ring does not rotate**, as in the HTML. There, `show('hSpin')` animates `transform` on the same element as the CSS `spin` animation, and the script animation overrides it. The port keeps that ring still. The eight row and card spinners rotate.
- `"Start thinking..."`: the shimmer sits on an inner span inside the blur-fading label instead of on the same element. It looks the same.
- `<use href="#tick|#shop|#gem">` is inlined as SVG paths, so two mounts never share ids. `<hr>` is a div with a 1-unit top border, so Tailwind's preflight can't restyle it.
- The root sets `line-height: normal`, and the bordered boxes set `box-sizing: border-box` themselves, so the result doesn't depend on Tailwind's preflight.
