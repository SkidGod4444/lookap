# ToDesktop's Pricing — rebuild notes

## Timeline
- 0–3 s: one still frame. The rubric's difference views (0–0.5, 0.5–1, 1–1.5, 1.5–2, 2–2.5, 2.5–2.95 s) show only compression specks, and the draft has no phases or motion rows. No cursor appears.
- So the page has no animations, with or without `?demo=1`. The checker reports "the clip does not move between the scored moments" and the render is the same at every moment.

## Layout (measured with --col/--row/--hex at 1.5 s)
- Background #fdfdfd (the draft palette rounds it to #fafafa). Panels and the toggle track are #f5f5f5. Light header cards are #fcfcfc, inset 3 px, ending at y 291. The dark panel is #121212 with a #252525 header inset 4 px.
- Columns are at x 197 / 485 / 773, 268 wide, y 173–789. Enterprise band: 197–1041 × 808–969. Its white card is 276 wide.
- Feature rows: 28.5 px pitch, first row centre y≈495. Text starts 29 px from the column's left edge. Buttons are at y 373–409, dotted divider at y 433, mono label at y≈464.

## Differences
- Round 4 (score 90, runs 13–18). I also tried a shorter flag that started at x 6.3 with the glyph 2 px higher. In the zoom the flag came out too short, and the difference rose to 22, so I settled on a bar starting at x 5.2 with the glyph lifted 1.2 px. Fix for the judge's c05 (logo: "thinner glyph, lighter blue"):
  - Square gradient deepened to the clip's --hex values: #4a7dff at the top, #1a40e0 at 55 %, #0222c8 at the bottom. The round 2 gradient (#6597fb → #1133d2) was too light.
  - Glyph: solid white with a 3.3 stroke, replacing 80 % white with a 2.7 stroke. It has a top-left bar (x 5.2–8.9, y 5.4) and a stem into a closed rounded-square bowl (x 9–18.8, y 8.6–18.4, radius 3.6). In the 4x zoom its silhouette now matches the clip. The checker still flags it as "different drawing" (difference 21, deltaE 2.7), which is the limit for an original drawing.
  - Sign up: the clip's pill has a vertical gradient, #1e5dff at the top to #0047ff at the bottom (--col 812). It is now drawn that way, and resized to the rubric box: 61×27 at nav x 421, y 9. deltaE went from 9.5 to 3.8.
  - Not touched: the Contact sales sheen, the prices, the Performance button and the Enterprise card. The checker flags them as "different drawing" with deltaE ≤ 2, and all of them pass the judge.
- Round 3 (score 90, runs 10–12). Fixes for the judge's c05 and c22:
  - Logo glyph redrawn boxy. It is a top-left bar (x 4.4–9.4, y 6), a stem down to y 19.6, and a rounded-rectangle bowl (x 9.4–19.2, y 10.6–19.6, radius 3.6). Stroke is 2.7 at 80 % white, because the clip's glyph reads bluish-white (#b9c5f0 in the 8 px mean). The checker no longer lists the logo.
  - `$300`: colour #e3e3e3 instead of #fff (the clip's --hex peaks at #e5e5e5). Weight stays at 500: I tried 400 and its strokes came out thinner than the clip's. The zero's slash now runs across the inside of the oval (left/right 14 %, rotated −62°, 3 px). The checker no longer lists the prices.
  - Still flagged: the Contact sales sheen (difference 22) and the Sign up blue (deltaE 9.5). Neither was changed this round.
- Round 2 (score 90, runs 6–8). Changes:
  - Logo glyph redrawn as a short top-left stub with a large thick loop (stroke 3.3, loop 10×9 centre-line). Gradient set from --hex (#6597fb top, #1133d2 bottom). Still deltaE 10.1, because the white loop covers more area than the clip's.
  - Nav links: 10.4 px Inter 400, colour #2e2e2e, moved 2 px left. They were 11.2 px at 450, which rendered as 500. The checker now reports "matches".
  - Plan titles: 17 px Inter 470 (variable axis loaded), down from 18.5 px/500. The clip's cap height is 11.5 px and the Performance title is about 78 px wide. The Performance title moved up 2 px.
  - Dotted dividers: 1 px dots on a 4.5 px pitch (#dedede light, #232323 dark), replacing 2 px dashes on a 4 px pitch.
- Round 1 (score 89, 4 moments). Worst elements: the "Contact sales" sheen (after run 4 I re-set it from --hex as #5a at the top, falling to #373737 by mid-height and #333 at the bottom; not re-checked), the logo (original drawing, deltaE 4.6), and nav-link glyph shapes (Inter stands in for the site's grotesk, about 2 px narrower per word).
- Sign up blue: deltaE 3.8 since round 4, with the gradient from #1e5dff to #0047ff. It was 9.5 when the pill was a flat #0147fe.
- Prices: Space Grotesk 35 px. Its zeros are plain, so I draw the slash with a pseudo-element. The clip's own slashed zero is thinner and more upright.
- A few Performance glyphs still differ in silhouette: smoke testing (clip: filled cloud; mine: check-ring), MSI/PKG (clip: laptop; mine: box), app store (clip: storefront; mine: laptop), and both analytics glyphs. All are flat grey, 14 px.
- Nothing sampled and no photo-class regions: the logo and all feature glyphs are original SVG drawings. No patches or placeholders.

## Pattern
**Icon cut-outs follow the surface.** One set of SVG symbols serves both light and dark panels when every cut-out is filled with `style="fill:var(--cut)"`. Each panel sets `--cut` on the `<use>` host, and the custom property inherits into the use shadow tree. A plain `fill="#fff"` leaves white holes on the dark card. In run 3, a document-level `symbol [fill="#fff"]` rule produced no visible cut-outs; the inline style did. Check the dark variant of any reused glyph set by zooming on it.
