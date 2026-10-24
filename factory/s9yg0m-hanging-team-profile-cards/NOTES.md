# Hanging Team Profile Cards — rebuild notes

Credit: Hayriye (@hayriyeakguller), https://x.com/hayriyeakguller/status/2109612639231856876

## Timeline (read from 10 fps contact sheets 0–7.2 s and 9.8–13.6 s, plus zooms)

All flips are a 180° perspective rotateY about the card's vertical centre line, eased cubic-bezier(.45,.05,.25,1). Wire, beads, strings, clips, header and footer never move.

- 0.02–0.34 s: Maya flips front → back. This was tracked with --row 600 every 0.05 s. The visible width goes 257 (0.05) → 88 (0.1) → edge-on (~0.13) → ~95 on the back (0.15) → ~160 (0.2) → open (~0.3). That fits rotateY at 20°, 76°, 94°, 108° and 132°, so it is keyed as explicit angles rather than an ease.
- Perspective on each card is 1100 px. The clip's sliver at 0.15 s has its near edge ~1.11× the card height, which fits ~1100–1400. The earlier 650 was too strong.
- 0.8–1.2 s: handoff. Maya back → front while Leo front → back, same span.
- 1.2–1.75 s: pointer over Leo's back; card tilts up to ~3° X / −6° Y.
- 1.68–2.2 s: handoff. Leo back → front and Noah front → back, with Noah about 0.05 s behind. Read from zooms at 1.88 and 1.98 s and keyed as explicit angles:
  - 1.88 s: Leo's front is a ~85 px sliver, ~106° into its turn. Noah's front is ~95 px, ~70° in.
  - 1.98 s: Leo is ~245 px wide, ~145° in. Noah's back is ~225 px wide, ~139° in.
  - Leo settles by 2.16 s and Noah by 2.2 s. (Round 2 had both done by 2.03 s, so 1.98 s showed nothing mid-turn.)
- 2.2–2.8 s: Noah back with a small hover tilt.
- 2.8–3.2 s: Noah back → front. 2.9–3.3 s: Amina front → back. 3.7–4.1 s: Amina back → front.
- 4.2–5.9 s: hover shimmer on fronts. Noah tilts about −4° X / +8° Y / +4° Z with the iridescent sheen. Amina tilts about 5° X / −8° Y / +3° Z with the sheen. Maya swings out of a flip (−7° Z).
- 5.5–5.9 s: Leo front → back. The back stays open through 10.0 s.
- 6.2–9.6 s: hover over Leo's back. The card is pressed down where the pointer is.
  - 6.6 s: about −2° X / −3° Y / +2° Z, with the foil shifted +15,+10 px.
  - 7.0 s: −7° X / +4° Y / +5° Z, so the top reads wider and the bottom swings left. The foil is shifted −38,−30 px, so cyan sits at left, the yellow band upper-middle and violet at right.
  - 8.25 s: −4° / +3° / +2.5°.
- 10.0–10.4 s: Leo → front. 10.6–11.0 s: Maya → back. 11.9–12.3 s: Maya → front. 12.9–13.3 s: Amina → back, tilted toward the pointer by 13.5 s.

Layout:
- Wire: a parabola from (247,303) to (1310,303) sagging to y 327.
- Beads: at x 282, 613, 944 and 1275, r ≈ 4.6.
- Cards: 300×415, radius 22, #f2f2f2. Tops at 362, 445, 402 and 440. Rest tilt −2°, +1°, −1° and +1.5°, pivoting at the clip.
- Avatar: 256×226, radius 14, inset 22 from the sides and 40 from the top.

## Differences

- Round 3 changes:
  - The card shadow is lighter: 0 10 34 at 5.5% plus 0 1 4 at 3.5%, where it was 16 36 at 10%. This matches the clip's near-flat shadow.
  - The back bio is now Inter 11 px / 15 px in #555, 258 px wide, so it wraps "…big picture / work." like the clip. It was 11.8 px in #333 and wrapped one word early.
- c19 asks for Noah's front at 2.35 s. In the clip, Noah is on his back at that moment, so the rebuild cannot show his front there either.
- Round 4 changes:
  - The back's "SCAN ME" caption is now 7.5 px, weight 600, #4a4a50. It was 6.5 px, weight 400, #777, which the judge read as much fainter than the clip (c31). In the 4× zoom at 2.6 s the two now look the same weight.
  - Project rows are now weight 400. The first row is #3a3a3a and the second #8a8a8a, matching the clip's dark "Product / Atlas" over a lighter "System / Mono". The checker's 2.35 s zoom showed both rows bold and dark before.
  - c19 is unchanged, and on purpose: the 2.35 s zoom shows Noah on his back in the clip as well.
  - Left alone: at 2.6 s the clip's Noah card has shifted left by about 14 px at its top and 33 px at its bottom, a pointer tilt of about 3°. Mine has not. Matching this needs a translate added to the tilt keyframes, which risks c14/c23, both of which pass.

- The clip shows a cursor that does many things the sheets resolve only at 10 fps. The flips between 3.6 and 6 s and between 9.8 and 13.6 s are simplified: I kept fewer flips and placed them by eye from the sheets, not from --track. A second Maya flip around 4.1–4.6 s is left out.
- At 4.75 s the clip's tilts are stronger and less regular than mine. The checker scores this moment 65.
- In the clip, Noah's back at 2.6 s sits about 4° more clockwise because the pointer is over it. Mine tilts about 2–3°.
- The headline is Inter 55 px with −0.055em tracking, fitted to the clip's line width of ~373 px. The clip's face may be a different grotesk.
- Photo-class regions: none were stood in. All four avatars are sampled from the clip with --patch:
  - maya: the whole frame 162,402,256,228 at 2.6 s
  - leo: 478,485,255,225 at 2.6 s
  - noah: 822,443,253,225 at 0.65 s
  - amina: 1137,481,256,228 at 2.6 s

  All four are JPEG q94 (round 2; round 1 used q72 on inner crops upscaled 1.1×, which the judge saw as soft). Each patch is counter-rotated by its card's rest tilt inside the avatar frame, at 1.02× scale. The round thumbnails on the backs reuse the same patches. The double resample (the clip's own rotation, then mine) still leaves the avatar slightly softer than the clip.
- c19 asks for Noah's front at 2.35 s. The clip's sheet at 1.6–2.8 s shows Noah already on his back from ~2.0 s, so the render follows the clip there.
- The back header is now "PROFILE / 0n" at 9.5 px, weight 500, #5f5f66, tracking .09em, about 64 px wide like the clip. The return button is a 26 px grey circle with a drawn hook glyph whose arrowhead points down at its left end.
- Drawn, not sampled: the holographic foil, wire, beads, clips and QR codes. The QR codes are a seeded pattern with three finder squares, not a real code.
- Final checker score (round 2): 78 over 17 moments, stills 80, and 0.15 s rose from ~79 to 84. 4.75 s and 11.6 s are still at 67. The half-size render matches.

## Pattern

**Flip and hover are two transforms on two elements.** A card that both flips and tilts toward the pointer needs the hover tilt on an outer preserve-3d wrapper and the 180° flip on an inner one. Each of them can then be driven, eased and seeked on its own. Put the rest tilt (rotateZ) on a third, outermost element that carries the perspective and pivots at the hanging point. That way the string and clip stay put while the card turns about its own centre line. Interactive transitions and demo-mode WAAPI animations then share the same elements without fighting over one transform string.
