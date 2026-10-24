# Casting Strength Radio Group: rebuild notes

Design by George (@vanjek), https://x.com/vanjek/status/2107793811497992535. Nothing was sampled from the clip and nothing is a stand-in: the card, radios, pixel particles and both cursors are drawn in CSS and inline SVG.

## Timeline

Measured from the 10 fps contact sheets (0.9–4.5s, 4.6–8.2s, 8.0–11.15s), the four keyframes, and zooms at 1.0, 2.5, 3.75, 6.3, 7.4 and 7.9s. Card, label, radios and text never move.

- 0–0.3s: arrow cursor at ~(1112,640), outside the card on the right. Whisper is selected.
- 0.3–0.58s: cursor moves to the Chant row. It becomes a hand, and the Chant pill (#f2f2f2, 572x107, r18) fades in over 0.2s.
- Transfer starts (from→to, arc bulge, + = right). Each start is the sheet frame where the source disc first breaks, minus about 0.03s:
  - 0.92 W→C (+180, cut from the right). Round 3 zooms of the clip: at 1.0s the disc sheds pixels to its right; at 1.1s it is ~80% gone, with the cloud at x 487–593, y 437–510; at 1.25s the cloud spans x 470–650 and Chant fills from its lower left; at 1.4s Chant is whole except a few pixels at the top right.
  - 2.2 C→I (−200). Moved from 2.28: at 2.5s the clip's cloud already reaches the Invocation row.
  - 3.68 I→W (−120)
  - 4.87 W→C (+180, cut from the right)
  - 6.22 C→I (−200)
  - 7.24 I→W (+70, the up-right diagonal stream)
  - 8.33 W→I (−120)
  - 9.85 I→W (−110)
- Each transfer takes 0.54s:
  - 0–0.18s: the source disc is cut away by a line in 9 steps. The line faces the target row and leans toward the bulge: W→C breaks on the right, C→I at the bottom, I→W at the top.
  - Each 4px cell the line uncovers shows in place and leaves 0–0.05s later.
  - Cells fly a quadratic arc (ease-in-out, snapped to a 2px grid) at 0.85 opacity. 60% of cells keep the disc's gradient colour; the rest take a pale blue (#3d8fe8→#bcdaf6).
  - 0.26–0.50s: the target disc is rebuilt by a line sweeping in from the arriving side (for W→C, from the lower left). Each cell lands just before the line reaches its slot, then vanishes into the real disc.
  - 70 loose pale pixels (4 or 6px) scatter wider and trail in for up to 0.59s.
- Hover row changes, each fading over 0.2s rather than sliding: 0.55 Chant, 2.0 Invocation, 3.42 Whisper, 4.55 Chant, 5.6 Invocation, 7.0 Whisper, 7.8 Chant (both pills are half on at 7.9), 8.05 Invocation, 9.15 Chant, 9.42 Whisper, 10.42 none.
- Titles go to #0d0c0c when their row is hovered or selected (selection switches at transfer start + 0.25s), otherwise #464646.
- 10.32–10.6s: cursor leaves to the right and becomes the arrow again. Whisper stays selected.

Layout is unchanged from round 1:
- Card: 405,323, 617x433, r36.
- Radio centres: x 469; y 457.5, 568.5, 679.5 (111px pitch).
- Titles: x 513, Inter 26px. Descriptions: 22px, #666.
- Top edge (col 700 at 0.85s): #ededed above, #d9d9d9 border, #f2f2f2 inside, and the page above the card is #f6–#f7 for about 25px. In round 2 the line was right by the numbers but the judge could not see it. Round 3 uses a #d2d2d2 top border, an #e6e6e6 outer row and a faint 26px halo above, so the line reads in the crop.

## Differences

- Round 3 fixes:
  - c04: the top border is now a visible line.
  - c22: W→C now breaks on the disc's right side, not the bottom.
  - c23 and c25: at 1.35s, Chant is about 70% rebuilt from its left, with pixels still arriving from the right. Before, it was a finished disc.
  - C→I starts 0.08s earlier.
- At 1.35s the clip's trailing cloud is still denser and reaches farther up-right (to about x 600, y 515) than mine.
- At 2.5s the clip's cloud has two lobes (left of the card and over the titles); mine is one band between them.

- Round 2 fixes for c22/c30–c33: in round 1 the source disc stayed whole for 0.13s and was then swapped for a jagged tile of cells, and hops started 0.02–0.08s late. Now the disc is cut away from T, the starts are re-read from the sheets, and the reformed disc is the smooth CSS donut with no cells left on it.
- A bug from the first draft of this round: a cell's keyframe offsets went non-monotonic when its random lag fell under 1ms. `animate()` threw, the page had 46 animations instead of 797, and the demo stopped after the first transfer. Fixed with a 4ms minimum gap.
- Font: Inter stands in for what looks like SF Pro. The checker still flags glyph shape on the titles and descriptions, with offsets of 2–8px.
- Card fill is #fdfdfd throughout. The clip is #fff for the first 3px under the top edge.
- `--drive`: clicking Chant, then Invocation, runs the transfer and settles to a smooth donut. The first screenshot (80ms after the click) already showed a mostly rebuilt disc, so the driver's timing is coarse.
- Round 3 `--drive` (click Chant): the transfer runs and Chant settles selected, with the pill and dark title.
- Checker, round 3: 93 over 21 moments (stills 94). It still flags the "#fefefe varies" gaps; those are the white centres of the target discs as they rebuild.

## Pattern

**Dissolve under a stepped cut, with cells born where the cut passes.** Swapping a smooth shape for a tile of square cells leaves a jagged outline on the resting shape and a frozen look while it waits. Instead, keep the real shape and animate a half-plane clip-path across it in steps, from the side facing where the pieces go. Show each cell only from the moment the line uncovers it, then let it leave a few tens of milliseconds later, so the edge breaks into pixels while the rest stays crisp. Rebuild the target the same way in reverse, pairing cells by rank (first to leave, first to land) so every flight lasts about the same time. With seeded random lags, give each keyframe offset a minimum gap: `animate()` throws on a non-monotonic offset and silently takes the rest of the timeline with it.
