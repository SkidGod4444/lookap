# Playful Feedback Toggle Buttons — rebuild notes

Design by Nitish Khagwal (https://x.com/nitishkmrk/status/2112156660265546145).
Nothing sampled: both glyphs, the cursor, the glows and the shadows are drawn (inline SVG + CSS).

## Timeline

Measured with `--track 255 --class dark`, `--row 360` at press times and the 10 fps sheets.

- 0.00–0.30: cursor (543,497) → (313,378), fast between 0.17 and 0.30.
- 0.42–0.60: like button scales 1 → 0.85 (left edge 174 → 188 at 0.6), then overshoots to ~1.03 at 0.80 and settles by 0.95.
- 0.65–0.90: thumbs-up leaps. Top at x=255: 344 (0.65) → 300 (0.70) → 231 (0.75) → 177 (0.80) → 154 (0.88). Peak is about 2.45× scale, centre moved (−30, −130). Colour goes black → #0d5c1f (0.70) → #0c8a2a (0.80) → #0dbc39 (0.90).
- 0.68–0.95: mint glow fades in. Centre #c0ffc4, edge #e7f5e6.
- 0.90–1.03: holds at the peak.
- 1.03–1.20: falls (top 162 → 347), lands with a small squash at 1.21 and settles by 1.30.
- 1.40–1.70: cursor returns to (313,385).
- 1.85–2.15: like pressed again (0.93 at 1.9, 0.89 at 2.0, back by 2.1). Glyph goes green → #0d4f1c → #0a2a10 → black over 1.95–2.30. Glow fades out over 2.00–2.30. No leap.
- 2.00–2.90: cursor goes out to (537,501), then to (402,392) on the dislike button.
- 2.86–3.26: dislike button press. Round 3 measured the bottom edge at x=500 with `--col --hex`: 421 (2.85), 417 (2.95), 413 (3.0), about 409 (3.05), 413 (3.1), 418 (3.15), 422 (3.25). Now drawn deepest (0.86) at 3.00 and already about 0.87 at 2.95. Before round 3 it was deepest at 3.05, so it was barely visible at 2.95.
- 3.05–3.40: thumbs-down wobbles (−19 px x, +4 px y at 3.19, slight overshoot at 3.31). Colour goes black → #3a0a12 → #8a1028 (3.2) → #e5173f (3.3). Pink glow fades in (centre #fccbd0, edge #fce4e8).
- 3.10–3.30: cursor leaves for (581,461) and holds until 3.6.
- 3.6–4.25: cursor comes back to (407,382).
- 4.15–4.40: dislike pressed again. Red → #7a1020 → #2a0508 → black, and the glow fades over 4.30–4.60.
- 4.40–4.60: cursor goes out to (563,452).

Layout: buttons 180×132 at x 174 and x 366, y 294, with a 12 px gap. Outer radius 66, inner radius 8.
- Border (round 2, from `--row 360` / `--col 270`): #c5c8c5 on the sides (#b1b6b2 at the right edge), #e0e0e0 on top, #d8d8d8 at the bottom. Drawn as #c6c6c6 sides, #dadada top, #cfcfcf bottom. A 1.5 px white inner rim sits inside it (#fdfdfd at y 294, #fbfbfb at 425).
- Fill: #f6f6f6, with a 2 px white top lip and a faint inner dip to #f0f0f0 about 12 px down.
- Shadow (round 3, `--col 270 --hex 418,480` at 0.17 s): #d8 edge line, then #e6 at 427–435, #eb at 437–442, #ed at 444–449, #ef from 451 to at least 480. That is a long tail, above the #f1 background. Above the button it is only #ef, and to the left it is #ee within 8 px. Drawn as three stacked shadows: 0/14/28 at .075, 0/5/8 at .06, 0/1/2 at .05. The old 0/5/12 at .075 died out by about 440 and the judge read it as too faint.
- Green glow at 1.52 s (round 2): centre (270,362). #c0ffc6 within about 40 px horizontally and 25 px vertically. Reaches #da–#e4 at 70–80 px horizontally and 45–50 px vertically, then #e9f4e9 at the rim. Drawn as an 92×62 ellipse plus a soft white inset rim. Round 1 used a wide, flat 100×78 ellipse centred 8 px too high, which read as a flat tint.
- Cursor rest at 3.3–3.6 s: tip at (581,454), not (581,461). Its shadow is a soft drop-shadow, offset 1/3 px with a 3 px blur.

## Differences

- Round 3, checker run 9: score 93 (stills 95, mid-motion 92). Same as round 2's best; the shadow and press changes did not move the pixel score. The c09 zoom at 0.17 s now shows a shadow as heavy as the clip's, maybe 1–2 levels darker right at the edge. The checker cannot render 2.95 s because it has no clip frame there, so the press depth at that moment is computed from the keyframes, not seen. The glyph drawings still differ at rest (deltaE about 5), as noted below.
- Round 2, checker run 2: score 95 (stills 95, mid-motion 95). Fixed c08 (darker outline + inner white rim), c20 (tighter, saturated glow centred on the glyph) and c34 (cursor 7 px higher + soft shadow); zoom crops now match.
- The clip's cursor arrow is a little shorter and fatter, with a slight tilt. Mine is the upright macOS shape.
- Round 1, checker run 4: scored 93 (stills 95, mid-motion 92). Worst moments were the leap (0.75–0.95, about 88).
- The glyph silhouettes are hand-drawn. The cuff crescent and knuckle lumps are close, but the clip's hand is slightly more bulbous. The checker reports glyph deltaE of about 5 at rest.
- The 0.75–0.95 leap is within about 5 px of the clip. The clip's glyph is a touch smaller and less tilted at the peak.
- The cursor path is read at 10 fps and linearly interpolated, so it can be off by 10–20 px between samples.
- During the leap the clip's button keeps a crisper light-gray border over the glow. Mine is softer.
- No photo-class regions in this entry, so nothing was stood in.
- Live mode leaps for real: a --drive shot 150 ms after the click shows the glyph airborne and enlarged above the button. The drive adds a few hundred ms of delay of its own. The like/dislike states and the toggles answer the pointer correctly.

## Pattern

**Per-keyframe easing, not per-effect easing.** In `element.animate`, the `easing` option on the effect warps the whole iteration's clock. A multi-keyframe motion with `easing: 'ease-out'` reaches every offset early, so a leap measured to peak at 0.90 s peaked at about 0.80 s. Set the effect easing to `linear` and put the easing on each keyframe instead. Then offsets computed from measured times land where the clip has them. This only matters with three or more keyframes, which is exactly when timing has been measured carefully.
