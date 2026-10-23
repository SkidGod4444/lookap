# Lemni's Pricing Page — notes

## Timeline
- 0–3 s: nothing moves. The provided diffs (0.2→1.2 s, 0.5→2.5 s, 1.5→2 s) show no change, and the draft has no phases or motion rows. The page is built static; `?demo=1` has nothing to replay, and the checker found 0 animations to seek.
- Interaction: the clip has no cursor, so none is reproduced beyond a 1% press scale on "Try For Free". A `--drive` hover/press on the button renders correctly.

## Layout as measured (1.5 s)
- Nav 0–49 with a 1 px #e3e3e6 hairline. Logo 82–114, "Lemni" from 129, Docs 280, Blog 419, Company 554, Community ↗ 724, Pricing 919–966, Continue 1071, 18 px arrow disc ending at 1162.
- Headline: Inter Tight 400, 76 px, line-height 70, tracking −2.7 px, top at 148 (ink from ≈152).
- Paragraph: Inter 18 / 26.5, tracking −0.5. Lines start at ≈339, 361 and 388. The last sentence is 500 weight, black.
- Card 413–831 × 548–963, radius 16. Fill #f4f4f6, sampled with `--hex`: the same as the page, not lighter. Inside the card: divider #e6e6e9 at y 654 (x 453–792); toggle rows at 692 / 736 / 780 (44 px pitch); button 453–792 × 817–857 with a soft drop shadow; footnote 12.5 px #6f6f74.

## Differences
- Icon halo (photo-class, licensed) is sampled, not drawn. It is four `--patch` strips from the clip at 1.5 s that go around the card, so none of them holds card text or controls:
  - `halo` [272,443,682,125]
  - `haloleft` [272,568,161,428]
  - `haloright` [811,568,143,428]
  - `halobottom` [433,943,378,53]
- The strips overlap the card box by 20 px, inside its 40 px padding. The drawn card's rounded corners therefore land on the clip's own card edge. A drive screenshot shows no seams at the joins.
- The patch tool encodes the strips at low JPEG quality (≈21 KB total), so icon edges are slightly softer than in the clip.
- `--patch-halotop` is an earlier sample of the top band. It is unused and holds no UI.
- The strips carry the clip's real card shadow, so the drawn shadow is cut down to a faint 4% one.
- The last edits were checked by a drive screenshot only, not by a fifth checker run: strips, shadow, headline tracking (−2.0, so the line spans ≈428–818) and `/Month` at weight 500.
- Fonts are Inter and Inter Tight standing in for Lemni's grotesk. Per-glyph shapes differ: the "y" and "a" in the headline and the digits of "$98". Line widths match within ≈2%.
- Checker run 4: score 87. The largest remaining element differences are "/Month" (deltaE 7.4) and the nav type (≈2 px).
- Round 2 (judge failed c05 and c22):
  - Logo (c05): redrawn as three overlapping rounded squares rotated 45°. They are a light #dcdcdc→#c9c9c9 diamond, a "\" band with a horizontal gradient #c9c9c9→#9e9e9e→#5a5a5a→#2e2e2e→#080808 (stops read with `--row 25 --hex 80,118`) and a #030303 diamond. There is no longer a gap between the diamonds, and the mark spans 82–114 like the clip's. The clip's light lobe still sits ≈1 px lower-left than ours.
  - Price row (c22): "$98" was 6 px low and 3 px wide (79 vs 76 px). It is now 48.2 px at top 29.5, and the zoom shows its digit baseline at ≈626, matching the clip.
  - "/Month" was 1.5 px above the digit baseline, while the clip's sits ≈1.5 px below it. It now has `vertical-align: -3.5u` and starts at x≈648, matching the zoom within 1 px.
  - The checker still reports "$98" as "moved -2,-4". The 4x zoom does not show that offset, and the remaining difference is the Inter Tight glyph shapes.
- Checker run 8 (round 2): score 88, no new regressions.
- Round 3 (judge failed c21 and c26):
  - "$98" (c21): the clip's digits are heavier than Inter Tight 400. The span is now weight 500, #000, with letter-spacing −2.8 px, so it spans x≈561–637 like the clip (it was 4 px wide).
  - The whole price row was ≈4 px high in a 3x zoom. Its top moved from 29.5 to 33.5, and `/Month` was re-aligned to `vertical-align: 0.5u` to keep its baseline.
  - The checker's "$98" difference fell from 31 to 18 and no longer reports a shift. Trying its suggested "moved -2,-4" made the offset worse (4 x 8), so its sign is not a direction to move.
  - Toggles (c26): `--hex` through the first toggle shows a 28×19 track (x 452–479, y 682–701) of #e4e4e6. The knob is a 16 px disc at x 453–468, #f2f2f4 at centre, darkening to #e3e3e4 at its lower rim. The knob is now a radial #f7f7f9→#ececee disc with a faint 0.6 px rim and a 1 px drop shadow, on a track with a faint top inset. In a 4x zoom it reads like the clip's: grey-white, not pure white.
- Checker run 14 (round 3): score 88.

## Pattern
**Card over a sampled halo.** When a UI card sits on a licensed photo-class cluster, sample the cluster as strips around the card, never as one block that includes the card's text and controls. Let each strip run into the card by less than the card's padding. The drawn card's rounded corners and shadow then land on the clip's own card edge, so no stage background shows at the corners. Because the strips carry the real shadow, the drawn shadow must be cut back or the edge doubles. Check the card fill with `--hex` before assuming it is lighter than the page. Here the "off-white" card was exactly the page colour, and only its shadow separated the two.
