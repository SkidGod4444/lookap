# Accordion FAQ Interaction, rebuild notes

Two passes: the factory's first build (score 69 on stills, 47 on mid-motion moments), then a hand pass from the clip at 60 fps.

## Timeline (measured)

- 0.00 to 0.37 closed: rows 11 px at a 13 px pitch, text hidden, the body centred on y 578.
- 0.37 to 0.73 the rows open top to bottom, 50 ms apart, 160 ms each, 6% over and back. Row 1 is full before row 5 starts.
- 2.05 to 2.33 pulled: the bottom edge moves 120 px down (inner gaps +23, top +8, bottom +11), the top edge stays; held to 2.50.
- 2.50 to 2.82 released: snaps through rest to rows of 27 px, then 1.7 at 3.00, 0.99 at 3.23, 1.05 at 3.40, rest by 3.60. The snap and the spring-back are ease-out, the settle ease-in-out.
- 3.80 to 4.05 row 3 opens by 32 px and the body grows 16 px each way; row 2 at 4.45; row 4 at 5.25. The chord chip "E minor 7" shows 5.40 to 6.60.
- 9.15, 9.60, 10.05 rows close in the reverse order.
- 13.23 to 13.50 pulled again, held to 13.83, then 13.83 to 14.20 closed in one even S-curve, all rows together, top edge fixed; held to 14.80; reopens to 1.22 by 15.03, rest by 15.25.

## Differences

- The checker scores 59 over 19 moments (stills 65, mid-motion 57). Most of what remains is material: the marble is two sampled patches, so veins repeat; the keys' bevels and the button domes are gradients, not renders.
- The cursor and its hover states are not drawn. The keyboard hover at 10.6 to 12.3 s is not reproduced.
- The spring's small wobble after 3.0 s is approximated with three keyframes.

## Pattern

**Keyframes hide the choreography.** A still is a moment when nothing moves, so matching every still proves nothing about the motion between them. Trace an edge per frame (the red body's top and bottom here) and the timeline reads straight off it: which parts move, in what order, how far, and whether the curve is a snap (ease-out), a settle (ease-in-out) or a cascade (one element after another). Build the timeline from those numbers first and the stills fall into place.

**One bellows value, three anchors.** A single --b (0 closed, 1 rest, 2 pulled) drives row height, border weight, gap and fold size, so every part of the instrument breathes together. What changes between gestures is only the anchor: the intro and the row openings grow around the centre (translateY(-50%)), the pulls pin the top edge. A separate 0/1 property switches the anchor, and the position is computed from --b rather than keyframed by hand.
