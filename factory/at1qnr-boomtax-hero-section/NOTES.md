# Boomtax Hero Section: notes

## Timeline
I measured the red PDF tile's leading edge in x (earlier `--track --class red` runs, rechecked at column 400 this pass): 300@0.17, 320@0.40, 340@1.30, 370@1.67, 385@1.93, 400@2.73, 415@2.90, 430@3.07. The slope is 0.567 px of y per px of x, and the tile pitch is 54 px in x.

Belt offset d (px of x, y = 0.567·d) over one 3.7 s clip period:
- 0.00–0.45 s: 0 → 33, ease-out (end of a push that started before t=0)
- 0.45–1.30 s: 33 → 50, linear creep
- 1.30–1.80 s: 50 → 88, ease-in-out push
- 1.80–2.45 s: 88 → 96, linear near-hold (1.9 → 2.4 s moves 6 px, c39)
- 2.45–3.25 s: 96 → 150, ease-in-out push (2.4 → 2.95 s moves about 39 px)
- 3.25–3.70 s: 150 → 162, linear, flowing into the next period's push
- Each period advances exactly 3 pitches (162 px). The keyframes are one 7.4 s animation, two identical 3.7 s halves, starting at t=0 and running infinitely. 7.4 s is used because the six icon colours need 6 pitches before the picture repeats. The rhythm is 3.7 s periodic; the colour order repeats at 7.4 s, so there is no seam at either.
- The output belt uses the same keyframes. A green copy of the output tiles (lime body, green icon square) is clipped to the mouth opening. The white/blue tiles are drawn again over it, clipped below the opening's floor line. A tile turns green while inside the mouth and comes out blue with a check.
- Everything else is still: text, nav, buttons, logos, stations and the machine body. Under prefers-reduced-motion the belts pause.

## Differences
- Round 2: the checker scores 83 (stills 84, mid-motion 83). The machine moving part is in step. The input belt is 2–6 px off in x at most moments. I raised the whole input belt 6 px to sit on the clip's line, so the PDF tile is at about (370,561) at 1.9 s.
- Round 2 illustration fixes, all measured from 4x zooms:
  - The belt side is 8 px and light (#ececee), with tiles 4.5 px thick on a #dfe1e3 rim. The round-1 belts were 12 px grey slabs.
  - The machine is block(528,674) with an 84×112 top face and 52 px tall faces. Its left face is darker (#e5e6e8).
  - The mouth is an unoutlined lime gradient (#e9f86c → #cdf22e) with a white left reveal. A blurred halo spills onto the belt; the hard lime frame is gone.
  - The badge "b" is weight 700 with a 7 px radius, and the green marks are now arrow glyphs.
  - Output check icons are 80% of their old size, with a thinner check.
- Stations, round 2:
  - The mail base is 66×67, 18 px thick. It has a 26×20 grey envelope with an X fold and a 55×33 screen with two green squares.
  - The upload base is 68×63, 20 px thick. It has a 1.4× bolt and a screen with a green ring and "100%".
  - The check tablet has a grey side edge, a thin green ring, a longer dotted line and a soft ground shadow.
  - The paper stack had 12 sheets and a blue ZIP icon (14 sheets in round 3).
- Round 3 (checker 84, stills 84, mid-motion 84; was 83). These fix the six criteria the judge failed:
  - c25: belt tiles have a crisp #b8bcc1 1.1 px outline, rx 5, and a 5 px #dcdfe2 side. Icons are 1.4× (were 1.75×), so the white tile rim shows round each icon.
  - c28: the badge marks are short flat green arrows (9 px shaft, 2 px stroke), counter-transformed out of the iso plane, inside the existing soft pills. They replace the diagonal chevrons.
  - c29/c41: the clip's opening is pale lime at 2.4 s (x=660: back wall #d5ea96, floor #ebfba6). At 2.95 s, with the green tile inside, it is full lime (#c2f038 along y=705). So the lime comes from the tile, not from the opening. The opening is now a pale #d2e3a6 → #eef9c4 gradient. Each green mouth tile carries a 42 px lime field (#c3f033, 4.5 px blur) that rides with the belt. The spill past the floor and left jamb is lowered to .55/.35. The tile in the mouth is saturated #05d43c on a #d2f64a rim, matching the clip's #00d83b/#c9f43f at 2.95 s.
  - c30: output icons are blue forms with a dark folded corner. The tick is counter-transformed out of the iso plane, so it reads as an upright ✓ and not a flat L.
  - c35: the paper stack has 14 sheets on a 3 px pitch. Each sheet side is #bec1c2 with a #a9adb0 edge, from the 1.9 s column at x=330 (#bdc0c1 / #b6b8ba).
  - Remaining gaps:
    - At 2.95 s my lime is softer and less saturated than the clip's #c2f038 across the opening.
    - The clip shows a white inner left wall and a lintel notch inside the opening; mine does not.
    - The clip's badge marks are a little shorter than mine.
    - The output ticks are slightly bolder than the clip's.
- Static parts:
  - The check tablet still reads deltaE 8.9: the clip's screen gradient is lighter at the top-left. The paper stack is deltaE 6.7.
  - The wires follow the clip's routes only roughly (mail zigzag, machine → down-left past the upload station).
- The headline and wordmark use Libre Baskerville in place of the site's serif, so the letterforms differ (checker difference about 30). The headline's position and centring match the c11 crop; the judge misread the scaled panels. The nav is 13.2 px #737a7e Inter.
- The logos are original SVG/text marks in #dcdee1, not traced.
- Nothing was sampled and there are no placeholders. The clip has no photo-class region.

## Pattern
**Loop length vs colour period.** A conveyor with a fixed beat and a repeating content sequence has two periods: the time rhythm and the content period. If the clip's period carries the belt k pitches and the content repeats every n items, the seamless loop is lcm-based: (n / gcd(n, k)) clip periods. Write that as one animation whose halves repeat the same timing keyframes, so every moment inside the clip still matches. A short loop with a jump of k pitches swaps the icons visibly at the seam. To show a colour change "inside" a machine, layer a recoloured copy of the moving group clipped to the opening. Then redraw the normal group clipped to the region in front of the face.
