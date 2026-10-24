# Boomtax Forms Grid: notes

Everything is drawn in CSS and inline SVG. Nothing was sampled and nothing stands in for a photo.

## Timeline (measured; T = 3.17 s, loops)
- Card field: one rigid field, linear, never stops. Speed (41.8, 20.6) px/s down-right along the 2:1 diagonal, from the rubric's 1099-MISC track (527,455) at 0.8 s → (598,490) at 2.5 s. Zooms at 0.8 s and 2.5 s put my 1099-MISC within 2 px of the clip's.
  - 0–0.55 s: the field replays the 2.25–2.8 s stretch, so the 0.25 s frame equals the 2.5 s frame. In the clip this span is a splice: `--diff 0.1,0.45` shows only the band above y≈333 changing (a wipe) while the lower cards hold. A rest here was the "static span" the last pass failed on, so the drift keeps going.
  - 0.55 s: jump back up-left by 94 px (the clip's seam, `--diff 0.45,0.7`).
  - 0.55–2.5 s: linear glide, 81.5 × 40 px.
  - 2.5–2.9 s: ease-out, only +5.5 px. A zoom at 2.9 s put the first linear build's 1099-MISC 12 px ahead of the clip, so the clip slows as the puck stops.
  - 2.9–3.17 s: a slow creep of +2 px. `--diff 2.85,3.1` still shows the field moving.
  - 3.17 → 0: the field jumps back 18 px. The clip is not seamless at its own wrap either: the puck reads 284–287 at 3.1 s and 311 at 0.0 s.
  - Checker runs 39–41 score the ease-out. At 2.9 s, 1099-MISC sits about 5 px off the clip (zoom 540,440,200,120). The direction is ambiguous: the card corner reads right and up, the label reads left and up.
  - Round 3: the clip at 0 s shows its end-of-loop state, not the start of a glide. A zoom at 0 s put my 1099-MISC 13 px left and 9 px up of the clip's. The 0 % keyframe is now (82.5, 41.5), close to the 100 % value (86.5, 42). The field eases back to the 0.25 s state (79, 38.2) at 7.89 %, then glides on. The wrap jump drops from 18 px to 4 px, the 0 s offset falls to about 1 px in x and 7 px in y, and the main lit blob tracks 0,0 at 0 s (run 41).
- The clip has no pointer interaction, so `--drive` was not run.
- Puck (`--track 626 --class dark`, lower edge): y 311–312 from 0 to 0.55 s, then linear 311 → 284 from 0.6 to 2.9 s (≈11.7 px/s), then 284–287 until 3.17 s. Built as 0 → −27 px over 0.6–2.9 s, linear.
- Heading: top edge 91–92 for the whole clip, so it never moves. The pinstripes and the glow are fixed in the frame too. Cards turn green inside the fixed lit mask as they pass.
- Without `?demo` the page holds the 0.25 s state; reduced motion turns the animations off.

## Layout (carried from earlier passes)
- Lattice: step A = (84,42) down-right and step C = (−85,90) down-left. The plane is `scaleY(.5) rotate(-45deg)`. Cards are 158×74 local units with a 7 px radius, and the slab side is 6 px on screen.
- Glow down column 626 at 0.25 s: #aee876 at y 350, #cff4b2 at 400, #d5f3c4 at 440, #e6f5e5 at 530, background by 632.
- This pass:
  - Edge fade: a 500×300 ellipse at (626,440) (opaque to 25 %, .5 at 55 %, .14 at 80 %), combined with a top ramp (205→330) and a bottom ramp (545→650, down to .2).
  - Lit-card mask shrunk to 165×175 at (622,385). Card deltaE went 10.6 → 1.1, and the lit cards 4.2 → 1.1.

## Round 2 (judge fixes: c24, c29)
- c24: added a `.rim` copy of the field between the base and lit layers. Its cards have a pale face (#f7fdf3), a green rim (#93e46a) and green side slabs, masked by a 240×175 ellipse at (605,420). The clip's outer lit cards (California Pay Data, 1099-MISC, 1094-C/1095-C) now have green rims, and W-2 and 1099-DIV stay grey. Zoom 440,330,410,270 @0.25 s confirms it.
- c29: measured the cap at 0.25 s: x 594–658, y 276–312, blue #0097fa. Its wall runs 313–321 (#d8e0eb, foot #b8b8b8) and the ring is rx 21, ry 12. The cap wall went from 12 px to 6.5 px with a dark foot, and the cap fill is now #0097fa instead of the cyan #08a2ea.
- Check mark: colour #45f760 and stroke 3.6. Its deltaE went 12.1 → 0.6.
- c41 (pinstripes): the clip's row hex shows a 6 px pitch, ~#ebebeb on #fbfbfb, which already matches. The judge's crop held no margin, so nothing changed.
- Checker runs 35–37: score 86 (it was 87 in round 1, a 1-point drop from the wider green zone). Motion is unchanged.

## Round 3 (judge fixes: c24, c29; the file restarted from the round-1 best, which has no `.rim` layer)
- c24: lit cards now use face #d8f4c7, a 2 px rim #6cd636, and green side slabs. The lit mask was widened from 165×175 at (622,385) to 205×175 at (620,405), with stops 1 → .9 (35 %) → .62 (62 %) → .32 (85 %) → 0. 1094-B and 1099-HC under the puck are the most saturated. California Pay Data, 1099-MISC, 1094-C/1095-C and W-2 are pale mint and still have green rims. Cards further out stay white. A first try that kept the mask fully opaque out to 60 % made every lit card equally saturated and cost the score a point (85).
- c29/puck, from `--col 626 --hex 255,360` at 0.25 s: the top ellipse spans y 267–341 (ry 37, was 34), x 561–692. The blue cap is y 276–311 (rx 31.5, ry 18.5). The cap wall is 313–320, #d4dcdf, with a #b8b8b8 foot, so the wall is now 8 px (was 12). The cap rim stroke is #3989c6. The puck wall bottom is now near-flat at y≈347, as in the clip, where the cylinder's foot is cut off.
- c41: the pinstripes are unchanged. Row 100 at 0.25 s gives #ebebeb lines on a 6 px pitch over #fbfbfb, which matches.
- Motion is unchanged. Checker run 40 scores 86 (85 → 86 after the mask retune).

## Differences
- Puck body is still flagged as wrong colour (deltaE 9.1, run 41). The clip's top reads #fcfafb, which mine matches. The flag most likely comes from the wall shading and the cut-off foot inside the box.
- c41: the judge's crop showed no margin, so nothing could be judged. The stripes match the clip (#ebebeb on a 6 px pitch), and they were left as they are because c04 needs them faint.
- Checker run 41: 86 over 8 moments. The trackers still report "wrong timing", but the offsets are now 0 to −6 px at 0, 0.25, 0.8, 1, 1.75 and 2.5 s for the main lit blob. The −6,−6 at 2.9 s is the largest that remains.
- Round 1 checker: 87 over 7 moments (it was 86). The page moves wherever the clip moves, with no static span.
- The checker's colour-blob trackers report offsets of −12…+12 px. These bounce rather than grow, and they are blob noise, not drift: the 1099-MISC zooms match within 2 px.
- Labels around the edges differ from the clip. At the lower left (x 150–330, y 400–560) the clip shows 1099-R / 1099-HC, where mine shows 1099-NEC / 1099-K about 35 px off. The lattice's C step or the row stagger is slightly wrong away from the centre.
- At 0.8 s the card right of 1099-MISC's upper neighbour reads W-2 in mine and 1094-B in the clip.
- The clip's 0–0.55 s wipe (the upper band re-labelling) is not reproduced. The field just keeps drifting.
- Puck (after round 2): the cap deltaE is 3.2. The check mark's colour now matches, but its shape is still flagged (difference 17).
- Heading: the checker flags texture (difference 18–21). The line widths match within about 1 %.
- Photo-class regions: none.

## Pattern
**Splice spans are not rests.** A looping clip often hides its seam in a short span where only part of the frame changes, such as a wipe across the top band while the rest holds. Diffing that span shows a moving region, so a rebuild that parks the whole scene there reads as static to anyone comparing motion. Measure the steady speed in the clean part of the loop, then let the motion run through the splice span at that same speed. Put the jump at the clip's seam. Choose the splice-span offset so the rest moment equals a moment in the clean span, which keeps both the stills and the trajectories in step.
