# ToDesktop's Bento Grid — notes

Credit: ToDesktop, https://www.todesktop.com/

## Timeline (measured from sheets, zooms at 0 / 0.5 / 0.6 / 1 / 1.2 / 2.75 / 3.25 s, checker diffs)

All four illustrations run at once from 0s; nav, cards, titles, dividers and body never move.

- Code signing: digits (14×8, 30.3 px pitch, x 348–742, y 147–359) flicker continuously, 0.9–2.5 s per cycle; ~22% of cells swap 0↔1 every 2.2–4.2 s. Pen fades in 0.15–0.5 s and lands its tip at the baseline's left (≈533,237). 0.5–2.5 s: the tip follows the squiggle left to right (linear) while the stroke draws behind it; it ends at ≈573,244 and holds.
- Chart: at 0 s only bar 1 and a pale placeholder square. Bars 2/3/4 grow from the baseline (y 308) at 0.08 / 0.23 / 0.43 s, 0.42 s each, so all four are up by 0.85 s. OS pill fades and rises 6 px, 1.25–1.55 s. Bar 2's raised capsule appears 1.4–1.65 s and its orange/blue/charcoal fill 1.45–1.65 s.
- Laptop: closed base at y≈790 until 0.56 s; the lid swings up (rotateX -90° → 0°, bottom hinge) 0.56–1.22 s. Tiles pop up (scale 0.6 → 1, from 30 px lower, overshoot) at 2.20 / 2.28 / 2.36 s over 0.3 s, then float on a 2.0 s loop. Values read from the clip at 2.75 s and 3.25 s (round 2): the Apple tile goes from about −3° to 0° and moves +5 px right; the Linux tile moves about 5 px left and 4 px down; the Windows tile moves only 1–3 px. Rest tilts: Apple −4°, Windows 1°, Linux 4°.
- Gauge needle (degrees clockwise from 12 o'clock): 0 s 60, 0.5 s 30, 1 s −45, 1.5 s −80, 2.75 s −92, 3.0 s −60, 3.25 s 0, 3.8 s 10, 4.2 s −60, 4.5 s −100, 5.0 s −85, 5.52 s −35. Ease-in-out between keys, looping every 5.52 s. The blue arc runs from −135° to the needle.
- Latency labels: 20 “NNMS” labels. Each one fades in and out while drifting 30–80 px sideways over 0.9–1.8 s, so the set visibly changes between 2.75 s and 3.25 s as it does in the clip. About 65% are blurred by 1–3 px and 45% start smeared (scaleX 1.4). Colour is #bdbdbd at weight 400.

## Differences

- Round 2 checker score is 89 (stills 88). The checker reports motion everywhere the clip moves. The last edit (label smear 1.8 → 1.4) was made after the final checker run and is not re-checked.
- Round 2 type fixes:
  - Body copy is now 15 px Inter 400, #6c6c6c, antialiased. Line 2 measures about 390 px against the clip's 395 px. At 16 px it was 427 px and read too heavy.
  - Nav pills use Inter 500 with grayscale antialiasing. Subpixel rendering made the earlier 500 look bold. The Log in outline is #ececec.
- Logo (round 4, redrawn): the round-3 file still carried the boxy square-cornered b, and the judge failed it. The mark is now the clip's bubbly b, all strokes 5.8 to 6.2 units wide with round caps and round joins. A crossbar pill runs from x 6.4 to 14 at y 9.3, past both sides of the stem at x 10.4. The stem drops into a bowl from x 10.4 to 27.6 and y 14.6 to 27.8, with 4.2-unit corner radii. The stroke is lavender #dce3ff with a white highlight down the crossbar and stem, and a translucent dark blue window sits inside the bowl. In the 4x zoom at 2.75s the silhouette matches. The clip's crossbar is about 1 px chunkier and its lavender is a little greyer.
- Pen: tip at about 568,242, angle −25°, length 140 px, diameter 26 px, grey barrel (#f6f6f6 → #b4b4b8). It has a long cone tip and a large soft shadow falling down-left. The clip's pen also has a printed wordmark on the barrel and a distinct darker cap cylinder; mine has neither.
- Digits: base colour #a6a6a6. 30% of cells are full strength and the rest are at 60%. Row fade runs .85 → .08. The clip's glyphs are slightly thinner.
- Signature: an original squiggle of the same size and grey (#5e5e5e). Its letterforms are not the clip's.
- Rosette: an original 12-scallop SVG. The ring is a darker orange line instead of the clip's bevelled rim.
- Gauge: the bezel, the dark ring and the face are flat gradients. The clip shows more specular highlight on the bezel.
- Labels: the positions follow the 2.75 s frame, but each label's drift path is invented. They do not trace the clip's exact streaks.
- Photo-class region: the laptop wallpaper was sampled from the clip at 1.2 s, region 449,697 188×86, as `--patch-wall` (0.8 KB). It is stretched to fill the screen. Nothing was used as a stand-in.
- Bar 4 also takes the colour highlight late in the clip (~4.5 s). I did not rebuild that.

## Pattern

**A loop has to be visibly different at the two moments the judge compares.** A float with a 3 px amplitude that starts just before the first moment moves less than 1 px between 2.75 s and 3.25 s, and the judge reads it as frozen. Read the moving part's position and tilt at both comparison moments in the clip. Then place keyframe offsets so the loop passes through those values at those times. Check the amplitude in pixels at the comparison moments, not over the whole cycle.

**Subpixel antialiasing makes the same weight look heavier.** Text rendered with the default (subpixel) smoothing read one weight bolder than the clip's at 16 px. `-webkit-font-smoothing: antialiased` at the clip's own weight matched it, so it did not need a lighter weight.

**Easing belongs on the keyframe, not the timeline.** A multi-keyframe Web Animation with `easing` in its options eases the whole iteration, not each segment. Every keyframe's timestamp then drifts, by up to half a second near the middle of a 5.5 s loop. Here the gauge needle read 1 o'clock at 1 s instead of 11. For a measured swing, set `easing: 'linear'` on the animation and put `easing: 'ease-in-out'` on each keyframe, so the angle lands exactly at the measured times.
