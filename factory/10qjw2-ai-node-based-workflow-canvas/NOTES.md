# AI Node-Based Workflow Canvas — Omerico (@omer_assa)

Source: https://x.com/omer_assa/status/2106758938926391416
Nothing was sampled or stood in: no photo-class regions; every surface, cable, spark, glow, icon, the cursor and the dot grid are drawn in CSS / inline SVG.

## Timeline (measured from the 10 fps contact sheets, keyframes and the 1.23 / 6.55 / 8 s zooms)

Camera: wide = world as laid out; close-up = world × 1.714 + (−391, −80) (from Processing title 137→155 and ports 200→263, 258→363). It's a hard cut, not a zoom animation.

- 0.00–0.35 conditioning cable dragged white from Prompt (398,321); tip moves (402,322) → (500,267) at 0.2 → (548,214); source port gets a thin ring
- 0.40 cut to close-up
- 0.30–0.97 yellow zig-zag spark from the tip to the conditioning port, yellow ring (r≈12.5) on the port
- 0.97 snap: cable, both end dots and the check turn #f2dc4a; double ring at the port (r 15→23 and 21→31, fading over 0.8 s); edge glow fills Processing's left edge (0–0.15 s), then splits and runs along the top and bottom edges to the right corners (0.15–0.75 s) and fades by 0.95 s
- 1.57 cut back to wide; cursor travels to the noise port (1.85)
- 2.00–2.70 noise cable dragged white from (248,423); pink spark and ring 2.2–2.7; snap pink at 2.70 with glow sweep and a pink check
- 3.45–4.25 sampler cable dragged up from (469,556) (tip at (515,413) at 3.6); violet spark 3.7–4.25; snap purple at 4.25; status becomes a white dot plus "All inputs ready"
- 4.90 cut to close-up; 4.93 conditioning pulled off (white, status back to "Awaiting inputs"); orange spark 5.15–5.70; snap orange at 5.70
- 6.40 noise pulled off; tip hovers just left of the port (590,256); cyan spark 6.55–7.30; snap cyan at 7.30
- 7.90 noise pulled off again; yellow spark 8.0–8.85; snap yellow at 8.85
- 9.60 sampler pulled off; magenta spark from 9.7 to the end (9.97)

## Differences

- Type: Inter is used in place of the clip's sans. Sizes are tuned so line widths match within about 2% (prompt line 225 px, "Prompt" 53 px, "conditioning" 78 px). The clip's body text looks a little heavier.
- Round 2 fixes, each checked by zoom against the clip:
  - Dot grid: the pitch was measured at 24.85 px (dots at x 0/497/894, y 6/602/627/652), not the rubric's 37. Dots are now #1a1c1e, r 0.7.
  - Dragged cable: 4.8 px. It has a short lead out of the port, then follows the chord into the tip, with a sag that only shows on shallow drags. Source ring is r 11.5, 2 px, #8a8a8d.
  - Spark: 1.3 px, single blur, opacity .85. It has up to 7 uneven teeth and its amplitude jitters.
  - "All inputs ready" is #8e8f91, down from #c9cacc.
- Spark: the clip's spark sometimes has a faint side branch, which is still missing. The clip's spark glow is a little whiter and brighter than this one.
- Round 3 (c20): the held cable is now 5.4 px (connected cables stay 4.8 px) with a 6.2 px-radius tip dot. Its shape is blended by cable length. A short drag (0.2 s, about 115 px) leaves the port, hooks about 9 px below it within 30 px, then runs straight and steep into the tip. A long drag (2.65 s, about 336 px) leaves nearly flat and bends smoothly along the chord. Zooms at 0.2, 2.65 and 3.6 s match the clip's path to within a few px. The 0.2 s knee is a little sharper than the clip's rounded one. The 3.6 s sampler drag bows right where the clip's bows left, by about 6 px.
- Glow sweep: built as dashes moving along the card outline, clipped to the card. The clip's sweep fades in and out more irregularly. Peak brightness matches by eye at 1.23 s, not by hex.
- The "432512" value sits at x≈5. The clip may have a cut-off prefix to its left that is not reproduced.
- Last checker score was 81/100 (stills 87, mid-motion 78; round 3, run 14). The checker's "different drawing" notes on the Prompt title, icon and text, and on the chip icon, come from Inter standing in for the clip's font plus redrawn glyph icons. They were left alone because those criteria pass. A --drive drag from the Prompt port to the conditioning port shows the white cable, then the yellow snap, the check and the glow.
- The checker still reports three card edges drifting at mid-motion moments, by up to 12 px. This round did not investigate it.

## Pattern

**Camera cuts as one world transform**
When a clip jumps between a wide shot and a close-up of the same UI, the close-up is an affine map of the wide layout. Solve it from two points measured in both views: scale from the difference between them, then the offset. Put the whole scene in one world layer and switch its transform, with percentage translates so it survives any --u. Keep screen-space chrome, such as the cursor, outside that layer, and map its world position through the same transform. Then every element stays in place across a cut without being laid out twice.
