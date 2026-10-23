# Chatbase's Pricing Page — rebuild notes

Design: Chatbase, https://www.chatbase.co/pricing

## Timeline

- 0 s – 3 s: nothing moves. `--diff 0.5,2.5` is black everywhere; the checker reports no motion between 0.5 s, 1.5 s and 2.5 s.
- No cursor in the clip. Pointer-only extras: the Monthly/Yearly toggle slides its thumb (0.25 s, ease-out) and shows prices 20% lower; buttons darken on hover; the black button presses 2 px. `?demo=1` has nothing to replay, so there are no animations on the page.

## Differences

- Round 2 checker pixel score 78 (runs 8 and 9; it was 76–77 before the round 2 fixes).
- Round 2 type fixes, measured from 4x zooms:
  - All card copy was 10–15% too wide. List and lead text went from 12.4–12.6 to 11.2 px (weights 440 and 520). "Limited access to models" is 92 px in both now.
  - Button labels went from 13 to 11.3 px. "Get started" is 59 px against the clip's 59.
  - Toggle labels went from 13 to 11.3 px. Monthly is now weight 600; Yearly is #646464.
  - Prices went from 27.5 px with −1 tracking to 30 px with −0.3 tracking. They start at x≈150.5, matching the clip.
- Footnote: #6e6e6e with −0.3 tracking. The break after "14" is forced, as is the clip's break in "Limited access to / models", so the note lands at y≈743–769 with its full stop.
- Logo (round 3, c04): the mark is now 18×20 with a 4 px radius, measured from `--hex` (ink from x 129 to 146 and y 14 to 33). It holds a white C: 3.6 px bars, a 4.3 px black tongue and a chamfered top-right end. The wordmark used to render at 700 even though the CSS asked for 800, because the Google Fonts link capped Inter at `wght@300..700`. The link now loads 300..900, and the wordmark is set at 860 with −0.45 tracking. Its ink runs from x 152 to 242 (90 px), the same as the clip's. At 4x the clip's strokes are still about 0.3 px heavier. Checker run 13: logo difference 21, page score 78.
- Logo (round 4, c04): the round 3 change was missing from the best file, which still had `wght@300..700` and an 800 wordmark (it rendered at 700). Re-applied: the link loads 300..900 and the wordmark is 850 with −0.6 tracking. At 4x its stroke weight now matches the clip. The mark is 18×20 with a 2.6 radius (the 4 px radius read too square and soft) and a thicker white C: 4.6 px arms, a 3.2 px black tongue and a 4.8 px left bar. Checker run 16: page score 78, logo deltaE 0.6, difference 23. The pixel difference is up 2 on run 13, but the silhouette is closer at 4x.
- Icons: the Standard star is a fuller six-point star with wide spike bases. The Enterprise ring is now r 6.2 with a 3.5 stroke (outer diameter about 15 px, matching the clip at 4x). Confirmed by checker run 10 (score 78) and a zoom.
- Nav hairline is #e6e6e6 at y=48, slightly darker than the clip's #efefef on #f9f9f9, so it shows in a small crop.
- Remaining: headline glyph shapes still differ (checker difference 43; Inter stands in for the clip's face). Feature rows drift about 2 px over 11 rows; I set the pitch to 28.8 (the final checker run, run 9, still scores 78).
- Nothing was sampled. There are no photo-class regions and no patches or placeholders. The logo, plan icons, discount badge, gradient lip and hero hairlines are all drawn in CSS or SVG.

## Pattern

**Small UI copy runs a size smaller than it looks.** On dense pricing cards, the clip's list, button and toggle labels were about 11.2 px, but by eye they read as 12.5–13 px. The judge measures a full line's pixel width, and a 10–15% overshoot fails even when the words and weight are right. Measure one long line per text role at 4x, scale font-size by clip width / render width, and re-check wraps afterwards. A smaller size can unwrap a line the clip breaks, which shifts everything below it. Where the clip breaks a line, force the break so the vertical rhythm stays fixed.

**A font weight only renders if the font link loads it.** A Google Fonts `wght@300..700` range quietly clamps `font-weight: 800` down to 700, so the CSS reads as bold while the render stays semibold. When a wordmark or display line looks too light, check the requested axis range before changing size or tracking.
