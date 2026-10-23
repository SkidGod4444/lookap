# Painterly Finance App Onboarding, React port

`Rebuild.tsx` is a React 19 component styled with Tailwind CSS v4 and animated with Motion. It ports `../index.html`. The painting plate is a JPEG data URI in `plate.ts`, copied byte for byte from the HTML's `--plate`. Keep both files together.

Design by Moiz Arshi: https://x.com/MoizArshi29/status/2109139298004172909

## Use it (Next.js or Vite)

1. `npm i motion` (React 19 is assumed).
2. Set up Tailwind v4 (`@import "tailwindcss";`) so it scans `Rebuild.tsx`. All the sizes are arbitrary values such as `w-[calc(314*var(--u))]`.
3. Load the font. `export const fonts` holds the stylesheet URL (Inter 400 and 500). Add it as a `<link rel="stylesheet">` in your layout or `index.html`. The component does not insert it.
4. Size it. Pass `unit="1px"` (or `unit="0.5px"`, `unit="0.05vw"` and so on), or set `--u` on a parent. The stage is 1628 × 1080 units, with overflow hidden and background `#fdfdfd`.
5. `demo` is accepted, but it changes nothing. The HTML runs the same with and without `?demo=1`, because the clip has no gesture.

```tsx
import Rebuild, { fonts } from "./react/Rebuild";
<Rebuild unit="0.6px" />
```

The file starts with `"use client"`, so in the Next.js App Router you can import it from a server component.

## Scores (bun --conditions=react-server scripts/port-check.ts, check 1 of 1)

- Pixel score: **94 over 8 moments** (2 stills 94, 6 mid-motion 94). The HTML file also scored **94**.
- Motion: the render changes where the clip changes.
- Scale: the half-size render matches the full one (difference 2.5).

## How it maps

- **Rings:** four `motion.div` elements, each running one 8 s linear loop with `times [0, .625, .75, .8, 1]`. `--r` goes 0 → 424 and opacity goes 1, 1, .2, 0, 0. The delays are -7.08, -5.08, -3.08 and -1.08 s, the same as the CSS `animation-delay`s. The rim lip, the fisheye mask and the shrunk plate are copied verbatim into one `<style>` scoped under `.i61wwn-ring`.
- **Spinner:** a `motion.div` that rotates 0 → 360° once a second with a `steps(9)` easing function (`floor(p*9)/9`).
- **Pill:** `whileHover` sets `#f1f1f1` and `whileTap` sets scale .98 and `#e9e9e9`. Background takes 150 ms and scale 120 ms, both with CSS `ease` (`[0.25, 0.1, 0.25, 1]`).
- **Reduced motion:** the HTML pauses its animations, so the port leaves the rings where they stand at 0 s (r 57, 163, 269 and 375; the outermost at opacity 0) and holds the spinner still. Hover and press become instant.

## Differences from the HTML file

- The plate lives in a sibling module (`plate.ts`), not in a CSS custom property declared in `:root`. It is set as `--plate` on the phone element instead. The value is identical.
- The HTML declares `@property --r` so that CSS can interpolate the radius. Motion interpolates `--r` in JS and writes it inline every frame, so the port does not need `@property`.
- None found in the check beyond those two.
