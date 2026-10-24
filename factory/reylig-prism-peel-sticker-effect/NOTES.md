# Prism Peel Sticker Effect: rebuild notes

Credit: sucodee, https://x.com/sucodeee/status/2104873657885438135. Nothing was sampled from the clip and nothing is stood in. The stickers, backing, grid and effects are all drawn in SVG and CSS.

## Timeline (round 3; re-read from the 10 fps sheets, the judge crops and zooms at 1.93, 4.55, 4.97, 5.4, 6.1, 8.5, 9, 11 and 12.4 s)
The peel is a fold. C is the grabbed tip, `a` is the direction from C to the pointer, and `f` is the distance from C to the fold line.
- 0–1.6 s: the X lies flat. The Prism fringe follows the cursor (528,465 at 0.9 s, 450,300 at 1.4 s).
- 1.6–2.2 s: peel from the TL tip (345,262). `f` goes 0 → 40 (1.7) → 210 (1.8) → 340 at 46° (1.93) → 500 (2.0) → 660 (2.2). At 1.93 s the clip keeps the whole "/" stroke flat (TR arm and BL arm). In the clip only the "\" stroke curls.
- 2.2–2.9 s: hold. Only the backing flap shows, at the bottom-right.
- 2.9–3.2 s: springs back, `f` 660 → 560 (3.0) → 380 (3.08) → 60 (3.2). A curl of about 40 px stays at the TL tip until 4.45 s.
- 4.48–5.42 s: peel from the TR tip (920,262). `f` goes 50 (4.55, a visible corner flap with its shadow) → 110 (4.7) → 220 (4.8) → 370 at 135° (4.9) → 405 (5.0) → 465 at 155° (5.42). At 4.97 s the 135° fold reproduces the clip's state: the TL tip is still black, the TR arm is mirrored onto the BL arm, and the BR leg stays stuck.
- 5.42–5.8 s: falls back to a band near the TR arm (`f` about 120).
- 5.86–6.2 s: peel from the BR tip, a 232–235°, `f` 110 → 265 (6.1). The flap rolls up over the centre, and its wordmarks read mirrored.
- 6.22–6.9 s: the top is folded down over the lower half (TR, a 82°, `f` 300).
- 6.9–7.3 s: release, `f` 300 → 44. A TR curl at 120° with `f` 44 holds until 8.6 s, then lies flat by 8.85 s. At 8.5 s the clip shows a lifted tip about 50 px across, and at 9 s it is flat. Round 4 raised this from `f` 32 at 135°, which was too small to see in a crop, so c32 failed.
- 9.7 s: the X is swapped for the G (a step).
- 10.85–11.0 s: Prism → Ripple, with the ripple centred at (740,508), the top-middle of the crossbar. 11.45–11.6 s: Ripple → Halftone.
- 13.85–16.3 s: the G is peeled from its right edge (930,505), `f` up to 380, then springs back to a residual curl of about 60 px.

## Round 3 changes
- Title: 29.8 px Inter 600 (was 32.5 px). "3 Prism" now spans about 105 px; the clip's run at y 80 spans x 24–129.
- Stuck pieces: a straight fold cannot keep both the "/" stroke (1.75–1.98 s) and the BR leg (4.88–5.6 s) flat, but the clip's curved fold does. During those windows, a flat copy of the art, clipped to that stroke's polygon, is shown: under the flap for "/", and over it for the BR leg.
- Backing: a second, un-mirrored wordmark layer (`--r`) is shown during the BR peel, so the 6.1 s flap reads mirrored, as in the clip.
- Ripple: the centre moved from (660,505) to (740,508) and the radius from 240 to 300 px. The displacement map is blurred by 4 px at scale 6. The faint crests now cover the whole die-cut, including the white border, as in the clip. In pointer mode the map and the crests follow the cursor.
- Halftone: dots on a 45° lattice with a 13.6 px row pitch (9.6 px diagonal), dot radius 4.75 px, softened by a 0.7 px blur. It was a 12 px square grid.
- TR corner flap at 4.55 s: `f` 30 → 50, so the lifted tip casts a shadow on the canvas.

## Differences
- The clip's peel is a WebGL mesh with a curved fold. Mine is one straight fold, plus the two stuck-piece overlays. At 4.97 s the top edge of the stuck BR leg is a straight cut at about y 600; the clip's leg ends in a rounded notch at about y 630. At 1.93 s my flap is about 60 px smaller than the clip's, so the lower "\" leg shows black where the clip has backing over it.
- At 6.1 s the clip's flap is a tall, narrow sheet over x 630–740. Mine is wider (x 550–780).
- The ripple displaces only the G art, not the white border, so the red arm's border edge does not wobble. The blue top edge scallops slightly along its whole width; the clip has one bump at the centre.
- The halftone dots are a fixed size and a little lighter than the clip's, which darken toward the bottom-right.
- No cursor is drawn.
- At 8.5 s the clip's TR curl is a soft roll along the top border that stays off the black stroke. Mine is a straight triangular fold that covers about 20 px of the black corner (zoom 780,240,180,150).

## Pattern
**A fold that spares a part needs a curved line, or a stuck copy.** A real peel with a curl radius bends its fold line around the strokes that stay stuck. A straight perpendicular-bisector fold cannot leave both the far arm and the near tip flat while it lifts the middle. If the rebuild has to stay a cheap CSS fold, keep the fold and add a flat copy of the stuck part, clipped to that part's polygon. Show the copy only while that part should be stuck. Put it under the flap when the flap passes over it in the clip, and over the flap when the flap tucks behind it. Check each stuck part against the frame. Do not trust the geometry: work out the projection of each part onto the drag direction and compare it with `f` before choosing the keyframes.
