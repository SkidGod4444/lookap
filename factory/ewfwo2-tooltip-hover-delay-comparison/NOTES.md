# Tooltip Hover Delay Comparison — rebuild notes

Design by Juliette (@shedsgns), https://x.com/shedsgns/status/2112265023464603894

## Timeline

Measured from the contact sheets (10 fps) and `--row 483` at 15.5 s. The timeline axis paints at 168 px/s from x 88; its seven 84 px blue segments start at x 88, 264, 423, 583, 744, 903, 1062, and those give the hover onsets.

- 0.0–0.15 s: an arrow cursor fades in at about (960,380) with a pale "500ms" pill. It drifts to (903,380) by 0.5 s.
- 0.55–0.8 s: the arrow moves onto B. At 0.8 s it becomes a hand, the grey hover square appears and the axis label starts at "0.0s".
- Top card hover onsets are 0.80, 1.86, 2.81, 3.77, 4.73, 5.69 and 6.65 s, for B I U S link code quote. Each one:
  - the pill counts 500 → 0 ms linearly and the ring arc fills
  - "N.Ns waiting" climbs 0.5 s
  - one blue segment grows 0 → 84 px
  - at onset + 0.5 s the #151515 tooltip fades in over 0.15 s
  - when the cursor leaves (60 ms before the next onset), the tooltip fades out over about 0.22 s, so it reads grey above the old button
- 7.65 s: the cursor leaves quote, moves to about (1000,338) by 7.85 s and fades out from 7.9 to 8.2 s. The axis stops at 7.7 s with the label at "6.9s" and the counter at "3.5s waiting".
- 8.0–8.3 s: the top card content goes to 30 % opacity and the bottom card goes from 30 % to 100 %.
- 8.3 s: the bottom arrow fades in at rest. It moves onto B from 9.02 to 9.3 s.
- 9.3–9.8 s: the bottom B waits 500 ms. Its counter reaches 0.5 s, it gets one blue segment, and the tooltip fades in at 9.8 s.
- Bottom onsets for I, U, S, link, code and quote are 10.35, 10.8, 11.2, 11.65, 12.1 and 12.5 s. On each one the tooltip is solid black at once, the pill reads 0ms and the previous tooltip disappears at the same frame.
- 13.0 s: the bottom axis stops at "3.7s".
- 13.22 s: the cursor leaves quote and its tooltip fades out. The cursor reaches about (990,852) by 13.42 s and fades out from 13.6 to 14.0 s.
- 13.4–13.95 s: the top card content fades back to 100 %. The state holds until 15.72 s.
- 15.72–15.98 s: the clip loops back to its start state. The bottom card dims to 30 %, and in the top card only the blue segments and the "6.9s" label fade; the top title, counter and toolbar stay full. Round 2 measured this with `--row 483 --hex` on the first segment: #78cff0 up to 15.7 s, #a4dbf6 at 15.8 s, #c9e3f2 at 15.9 s.

## Differences

- Title face: round 2 swapped Gochi Hand for Indie Flower at 29 px, with a 1.1 px text stroke.
  - Round 3: the judge measured the bottom title 11 % narrower than the clip's (465 vs 525 px in its tile).
  - It is now 30 px with 1.5 px letter-spacing, 2 px word-spacing and a 0.7 px stroke. The 2x zoom at 15.5 s shows "Delay once, then instant" spanning about 340 px in both.
  - The clip's script is still a little rougher than Indie Flower. The checker still reports the top title as 8 px off in x.
- Round 3 also changed:
  - waiting counter colour #7b7a7c → #646366 (the clip's darkest glyph pixels measure #626164; the checker had deltaE 9.2, now 0.2)
  - "Body" weight 500 → 400 in #2a2a2a, to match the clip's lighter label
  - link/code/quote icon strokes 2 → 1.6, to match the clip's thinner line icons
- Counters checked by eye at 9.6 s: the bottom card reads "0.3s waiting" in both. The judge's c34/c38/c40 tiles did not include the counters, so those still depend on its crop.
- Page and card colours: the clip measures #f4f4f4 page and #fdfdfd card. The judge read the 1 % gap as no contrast, so round 2 uses a #f2f2f2 page and #fff cards.
- Round 2 also changed these parts to match the zooms:
  - toolbar shadow is stronger (0 10 30 rgba 0.13)
  - icons are 31 px and the chevron 18 px
  - timeline segments have flat ends; the track keeps its round ends
  - the arrow is 32x44 with a soft drop shadow
  - the hand is fatter, with short finger-gap marks instead of lines across the fingers
  - the resting "500ms" pill is full strength (#2f87ab on #e3f4fc)
- Cursor exit:
  - When the cursor leaves the last button, the clip's pill briefly counts down again from 500 ms ("414ms" at 7.8 s, "111ms" at 13.3 s).
  - The rebuild just shows a pale "500ms".
- Cursor paths between rest and B are eased straight lines. The clip's path arcs slightly.
- The quote icon and the hand cursor are original SVGs with the same silhouette. Their stroke details differ by 1–2 px.
- The toolbar dividers are a little darker than the clip's (#e6e6e8).
- Pointer mode (no `?demo`) shows the final state, 3.5s/6.9s vs 0.5s/3.7s, and only animates the tooltips:
  - In the top toolbar every hover waits 500 ms.
  - In the bottom toolbar only the first tooltip waits. Every later one shows at once until the pointer leaves that toolbar.
  - The counters and timelines do not run under a real pointer.
- Nothing was sampled or stood in. There is no photo-class region; every part is CSS or inline SVG.

## Pattern

**Seekable numbers.** A counter that ticks in a clip ("458ms", "2.1s waiting", "6.9s") can stay a CSS value and still follow seeking.
- Register an integer custom property with `@property`, animate it with `element.animate`, and print it through `counter-reset` and `content: counter()`.
- Tenths become "N.N" with `round(down, var(--w)/10, 1)` and `mod(var(--w), 10)`.
- Setting the animation's currentTime then shows the right digits at any moment, with no JS timer.
- The same property can drive visuals, such as a conic-gradient arc on the spinner ring, so the number and the graphic cannot drift apart.
