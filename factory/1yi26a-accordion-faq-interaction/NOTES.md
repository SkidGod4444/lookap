# Accordion FAQ Interaction, rebuild notes

Three passes: the factory's first build (score 69 on stills, 47 on mid-motion moments), a hand pass from the clip at 60 fps, then a materials and layout pass from zoomed crops and pixel dumps of the clip. The page is interactive (click rows, hover and play keys, drag the bellows down to pull or up to squeeze, release to spring); with ?demo=1 it replays the clip's sequence for the checker.

## Timeline (measured)

- 0.00 to 0.37 closed: rows 11 px at a 13 px pitch, text hidden. The title sits at y 312 here and 181 at rest: the whole column is centred in the viewport, so the intro re-centres it.
- 0.37 to 0.73 the rows open top to bottom, 50 ms apart, 160 ms each, 6% over and back. Row 1 is full before row 5 starts.
- 2.05 to 2.33 pulled: the bottom edge moves 120 px down (gaps +25, top +8, bottom +11), the top edge stays and the title moves 2 px: a pull is a transform, not layout; held to 2.50.
- 2.50 to 2.82 released: snaps through rest to rows of 27 px, then 1.7 at 3.00, 0.99 at 3.23, 1.05 at 3.40, rest by 3.60. The snap and the spring-back are ease-out, the settle ease-in-out.
- 3.80 to 4.05 row 3 opens by 32 px and the title moves up 16 px (layout, re-centred); row 2 at 4.45; row 4 at 5.25. The chord chip "E minor 7" shows 5.40 to 6.60.
- 9.15, 9.60, 10.05 rows close in the reverse order.
- 13.23 to 13.50 pulled again, held to 13.83, then 13.83 to 14.20 closed in one even S-curve, all rows together, top edge fixed; held to 14.80; reopens to 1.22 by 15.03, rest by 15.25.

## Differences

- The checker scores 62 over 18 moments (stills 65, mid-motion 61; the rest frame 71). The red marble is two small patches sampled from the clip's rest frame where nothing sits on it (x 362 to 520 and 915 to 1078, y 753 to 859), stretched under each block's ends; rims, caps, keys, buttons, folds and strap are drawn from measured colours: rows are 1 px #d6d5d1 edged over a 7 px #3b3a36 gap (not bordered), the pulled gap is a brown valley darkest at its crease, the shut gap is a 2 px #bab9b7 line, black keys run 334 to 411 on 2 px stems, white keys sit at #e4e1e2 under a shaded lip.
- The keyboard block is 21 px taller in the closed intro frame and sits 10 px higher mid-spring; neither is reproduced.
- The cursor and its hover states are not drawn. The keyboard hover at 10.6 to 12.3 s is not reproduced.
- The spring's small wobble after 3.0 s is approximated with three keyframes.

## Pattern

**Keyframes hide the choreography.** A still is a moment when nothing moves, so matching every still proves nothing about the motion between them. Trace an edge per frame (the red body's top and bottom here) and the timeline reads straight off it: which parts move, in what order, how far, and whether the curve is a snap (ease-out), a settle (ease-in-out) or a cascade (one element after another). Build the timeline from those numbers first and the stills fall into place.

**Two kinds of motion, read from the title.** Track something that should not move. The title drops 131 px when the rows are shut on load and 16 px per opened row, but 2 px on a pull: the page is one column centred in the viewport, so the intro and the row openings are layout (real height), while pulls and squeezes are transforms with the top edge pinned. Build it the same way: heights for what reflows, translateY plus a clip-path cut for what does not, and one 0/1 property that says which mode the bellows are in. The side-by-side with the heading in it catches this; a crop of the instrument alone never would.

**One bellows value.** A single --b (0 closed, 1 rest, 2 pulled) drives row offset, cut, gap colour and fold size, so every part of the instrument breathes together, in the demo timeline and under the pointer alike.
