# Playful Character Picker Sheet (Harshit) — rebuild notes

Source: https://x.com/oiharshit/status/2110350649506590846

## Timeline

Measured from the keyframes, the 7.8–11.4 s contact sheet, `--col 1010` at 2.2 s / 5.1 s and zooms at 2.2 s and 3.98 s.
All roll geometry lives in one group: collapsed = `translate(758,316) scale(1)`, expanded = `translate(835,118) scale(.64)`
(504 → 323 px wide, 126 → 80 px avatars, 238 → 152 px row pitch).

- 0.15–2.2 s: paper prints down and rings out (round 2, `--col 1010`): torn bottom at y 860 (0.5 s) → 763 (1.0 s, undershoot) → 786 (1.5 s) → 781 (2.2 s); Daniel label top 425 (1.0 s) → 431 (1.5 s on). Sheet height 548 → 451 → 474 → 469, all ease-in-out. Rows ride with it (Daniel avatar 440 → 380).
- 2.2–3.3 s: the roll still creeps 1–2 px (bottom 781 → 782 → 780; label 431 → 429).
- 1.0–3.4 s: cursor (arrow) comes in from bottom-left: (600,900) → (680,810) at 2.2 s → Alex label (1000,680) at 2.7 s, turns into a hand at 2.6 s. Clicks Alex ≈ 3.4 s.
- 3.5–4.45 s: roll shrinks to the narrow receipt (top 316 → 118). The list jumps fast (done by ≈ 3.95 s, Mia on top) while the scale lags (≈ 0.71 at 3.98 s); paper overshoots past the frame bottom, then settles with its torn edge at y ≈ 985 by ≈ 4.6 s. Emma hover band on from ≈ 3.9 s.
- 5.35–6.3 s: list scrolls down inside the fixed receipt to Ethan/Oliver/James on top (paper lengthens off-frame).
- 6.5–7.1 s: scrolls back up so Lucas and Noah show under Alex (rest at 7.6 s).
- ≈ 8.0 s: click on Emma: check moves Alex → Emma, the receipt tears just under Emma's row (y ≈ 530).
- 8.1–9.1 s: lower piece (Daniel, Alex, Lucas, Noah) falls, ease-in; torn top at ≈ 1030 at 8.82 s, out by 9.1 s.
- 8.1–8.6 s: upper paper retracts (height 644 → 469 inner); 8.72–9.6 s: roll grows back to the wide collapsed roll (fast out-ease).
- 9.7–10.65 s: rest, Leo + Emma (check). Between 10.2 and 10.7 s the paper creeps down 5 px (bottom 783 → 788, label 431 → 435) before the expand.
- 3.98 s / 11.18 s (round 2 zooms): the rows are still ~40 inner px lower than their final place mid-expand; the list settles at the end of the move (ease-out, 4.45 s / 11.65 s), not at 3.95 s.
- 7.6 → 8.0 s: cursor moves from fingertip (1017,472) up onto Emma's name and clicks; the tear sits at y ≈ 505–520.
- 10.7–11.65 s: expands again; final list Oliver, James, Mia, Marcus, Leo, Emma (check), torn edge after Emma.

## Differences

- Round 4 (judge fixes c08, c22; checker 79 over 15 moments, stills 84):
  - Right tab: `--row 490` / `--col 1279` at 2.2 s show a solid blue tab (1272–1288 x 448–527) with a 3–4 px white slit (1276–1279 x 459–521), not an outline. Redrawn as a filled blue shape with a slanted top-right corner and a #fcfcfc slit. A 4x zoom matches.
  - Cursor hand: was 32 px, crisp and 20–25 px low. It is now 135 % size (~43 px tall), rotated −8°, with a 0.7 px blur and a soft 2 px shadow. Fingertip positions were re-read from zooms of the clip: 2.7 s (992,688), 5.1 s (1072,596), 7.6 s (1017,472), 10.2 s (975,651); 9.7–10.7 s was 64 px too far left. At 5.1 s and 10.2 s the fingertip is now within 3 px of the clip.
  - c18 / c21 were unsure because the judge's tile did not contain the edge or cursor. The motion is unchanged: torn edge 860 at 0.5 s → ~785 by 1.0 s, cursor (680,810) at 2.2 s → hand on Alex at 2.7 s.

- Round 3 (judge fixes, checker 79, no span flagged still now):
  - Side walls redrawn as cylinder crescents: outer edge bows out ~8 px past the roll at y ≈ 485, 9 px thick at the ends, ~14 px at the bulge, joining the 6 px paper wall at y ≈ 640. The top edge is an 8 px stroke with ~15 px rounded corners.
  - Names: Inter 700 → 600 at 41 px; "Daniel" is now ~120 px wide, matching the clip at a 3x zoom.
  - Check circle: ring and tick 4.5 → 6.5 px. Dashes: 2 → 3 px thick, 14 px dash on a 24 px period.
  - Torn edge stroke: 7 → 11 inner px, about 7 px on the expanded receipt and 11 px on the collapsed roll. The clip's collapsed edge is ~7 px, so that one is now too heavy.
  - Right tab is a closed 16 × 76 rectangle with a short stub to the wall.
  - At 0.5 s the list sits 15 px lower (−1567). Emma's avatar bottom now shows at y ≈ 345 under the top edge, with coral corners and a pale-yellow shirt (#fde58a, was white). Cost: Daniel's avatar top is at ≈ 457 at 0.5 s, against the clip's 440.
  - The torn piece starts falling at 8.06 s instead of 8.1 s. The clip's lower rows have already sunk ~5 px by 8.1 s.
- Still differs: the collapsed top divider is at y ≈ 329 (clip 349) and Alex is ~5 px low (620 vs 612). The clip compresses rows near the top of the cylinder and one uniform pitch can't do that. The tear is a regular zig-zag, where the clip's is a wobblier hand-drawn line with uneven thickness.

- Round 2 final checker: score 79 (stills 83, mid-motion 77; was 72). Still weakest: 5.5 s (69) and 11.18 s / 3.98 s (≈ 70), mid-expand and mid-scroll row positions off by 15–30 px.
- One span is still flagged still: 7.6 → 8.1 s the clip changes 2.3 % of the frame, mine 0.3 % (cursor move, check swap, band off, tear). The clip's lower rows already start to sink before 8.1 s; mine start at 8.1 s.
- Round 2 fixes: bracket redrawn from a 4x zoom (front face 672–737 x 425–555, top/side faces, 7–8 px strokes, paper-white fill #fcfcfc instead of canvas grey); side walls are filled tapering bands (~20 px at the bulge, thinning to the 6 px paper wall by y ≈ 660); right tab flush with the wall at 1272–1288 x 446–528; paper #fcfcfc; sheet widened to 4–500 inner px so avatars sit at x 801 and names at 955; torn edge restroked as an open polyline (the closed path drew a straight line along the top) with 30–60 px teeth, ~13 px tall, 7 px stroke.
- Dashed divider colour: `--hex` averages 8 px across a 2 px line, so the measured #eae8f4 is diluted; un-mixed it gives ≈ #b4acdc, which the 4x zoom matches. The checker still reports deltaE 17 on that 4 px box; by eye the dashes match (12 px dash, ~9 px gap).
- Dividers now sit 12 inner px above each row's bottom, so in the expanded list they are ~54 inner px above each avatar (clip 52–57). The collapsed top divider therefore lands at ≈ 331, not 349: the clip compresses rows near the top of the roll, which one uniform pitch cannot do.
- The clip shows a coral sliver of Emma's avatar under the roll's top edge at rest; mine does not (same reason: no compression near the top).
- The 11 avatars are original flat SVG characters (front-facing, one shared template with hair/cap/glasses/tie variants), standing in for the designer's illustrations: same backgrounds and dominant colours, but simpler and not in profile (Daniel and Alex face sideways in the clip). Nothing was sampled with `--patch` or `--placeholder`.
- Cursor is a drawn arrow/hand; the clip's arrow is a motion-blurred grey one at 2.2 s.
- Live mode (no `?demo`): click the roll to unroll, wheel to scroll, click a name to select it and roll back up with that name last. Rows below the pick are removed, but the falling torn piece only plays in demo mode.

## Pattern

**Two states that are one drawing at two scales.** When a component switches between a "compact" and an "expanded" layout whose widths, avatar sizes and row pitch all shrink by the same ratio (here 0.64), build it once in inner units and animate a single transform on the group. Animate the content scroll and the paper length as separate inner-unit properties on the same clock. Then check a mid-transition frame: designers often let the content settle much earlier than the scale (here the list was done at 45 % of the move while the scale was at 75 %), and that difference is what makes the move read as "unrolling" rather than zooming.
