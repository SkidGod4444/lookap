# GPU Pods Card Animation — rebuild notes

Design: Rah Man Designer (@UiRahMan92), https://x.com/UiRahMan92/status/2106682089039139085.
Everything is drawn (CSS + inline SVG). Nothing sampled from the clip, no placeholders.

## Timeline (measured from the 0–1.2 s contact sheet, 0.25/0.5/0.75/3.9 s zooms and --hex at x=437)

- 0.00 s: card, title, body, button fully visible; illustration panel empty.
- 0.10 → 0.30 s: flat pale GPU (board outline, two light-grey fans, tick rows above y≈362 and below y≈490–505) fades in from a blur (opacity 0→1, blur 6→0 px).
- 0.28 → 0.53 s: board takes its silver gradient and grey edge; fan discs and blades darken (clip at 0.5 s already shows dark fans, no screws).
- 0.25 → 0.50 s: port plate (x 650–715, y 399–465), mid-grey cable, collar and grey socket fade in (round 2: start moved from 0.30 to 0.25 s; the checker saw the clip change in 0.25–0.30 s).
- 0.50 → 1.00 s: corner screws, plate-screw slots, heatsink fin strips (y 365–382 / 476–498), cast shadow fade in; cable, collar and socket go black; plate group settles 5 px left to x≈645 (ease-out). Pale lower ticks fade out under the fins.
- 0 → 7.8 s: blades + hub of both fans rotate continuously, linear, one turn per 1.6 s (right fan phase-offset 0.4 s). Fan rings, board, plate never move after 1 s.
- Card/text/button are static for the whole clip.

Layout and materials (round 2, from --hex at 3.9 s):
- Board [370,382,237,100] r10: diagonal gradient top-left #f8 → #df centre → #c3 → #a6 bottom-right (samples: (400,390) #f5, (400,470) #e5, (488,390) #e3, (488,470) #d1, (580,476) #b8); 1.2 px #9a edge, white inner rim.
- Fans centred (437,431) and (540,431): ring r34–40 #a0, dark well #222226, 7 broad swept blades each filling 49° of a 51.4° sector (thin #18 seams), per-blade gradient #82 leading edge → #33 trailing edge, plus a darkening toward the hub; hub = grey ring r8.5–12.5 (#86, dark outline) round a pale #d7 centre.
- Cast shadow: the board+fins silhouette stepped 2 px down-right 20 times at 2.3% black each, blurred 2.4 px. Measured in clip: flat #de at y=520 from x 413 (45° left edge from the fins' corner) to 607, fading to card #f9 by x 650; #c6 band right of the board at x=630, y 415–485; #83 contact shadow right under the fins.
- Cable: collar 15×20 at x 607–622 / y 421–441, cable 12.5 px thick centred y 431, vertical gradient #4c → #08, straight into the socket centre with a round cap; socket r13 at (677.5,431).
- Body copy: Geist 300, #8c8c8c, 17/27 px; button label Geist 300 16 px (were 400: the judge read both as too heavy).
- Grid: 2 px hairlines matching the clip's profile (#e7 then #e9–#eb on #ee); vertical starts at x=233, top horizontal at y=233 (round 3: --row 150 / --col 150 show the dark pixel at 233 on both axes).

Round 3 fixes (judge failed c12, c14, c27):
- Fan blades (c12): the 0.9 px dark stroke on each blade and the strong lit/dark split made each blade read as two, so the judge counted ~9 thin blades. Now each blade fills 46° of the 51.4° sector, sweeps 22° from hub (r13) to rim (r34), has no stroke, and has a softer gradient (#78 → #5d → #47). The dark well shows through the 5° gaps as the seams. Zoom at 3.9 s shows 7 chunky blades.
- Top fins and ticks (c14): the ticks were 1.4×4 px dashes in #bd. They are now round dots, r1.2, #cf, centred y 363.5, pitch 15.7 (clip --row 363: 2–3 px dots, pitch ~15.7). The strip now starts at y 367 (was 365), has 7 px rounded top corners, fill #e5 (clip #e3–#e6 at y 374), and faint seams every 40 px.
- Button shadow (c27): the clip's --col 400 under the button runs #cb at y 767, #e7 at 785 and back to #ee by 793, and it is wider than the button (#ea from x 330 to 431 at y 785). It is now three layers: 0 2/3 @.2, 0 8/10 @.1, 0 16/26 spread 2 @.12.

Round 4 fixes (judge failed c11, c12; unsure on c02):
- Measured --row 431 --hex 395,440 at 3.9 s through the left fan: ring r35–40 flat #9e–#a4, #7d step at r35, dark line #27 at r34; blade #62 → peak #71 at r28 → #3a at r16; hub dark edge #27 at r13–14, grey ring #50 → #7f → #ad over r12–9, pale #d7 centre inside r8.
- Blades (c12): the round 3 blades filled 46° with only 5° seams, so the gaps read as thin dark lines and the judge counted ~9 thin blades. Now each blade fills 42° (16.5° at the rim is less after the taper), sweeps 15° from hub to rim with gently bowed edges, and the dark well shows as 7 wedges. Shading runs across each blade: lit leading edge #7a → #6c → #4a → #33 trailing edge (userSpaceOnUse gradient inside the blade's own coordinates, so it rotates with each copy). A 0.45 px blur softens the edges. The radial darkening toward the hub is stronger (45% black at r14).
- Ring and hub (c11): the ring is now flat #a0 (was #b4 with a #9c line), with the #7d step and #20 line at its inner edge. The hub is a r13.5 disc with a 1.4 px #27 edge and a radial gradient #42 → #6c → #85 → #a6, around a pale #d7 centre of r8.2 (was a paler #86 ring of r12.5).
- Grid (c02): it already matched the clip (#e7 at x/y 233). It is now one step darker (#e5/#e9) so it is easier to see. The judge's crop for c02 sits inside the card, so no grid change fixes that crop.

## Differences

- Title and button label are Geist (Google Fonts); the clip's face is close but not identical. The checker still flags Title (diff 18) and button (diff 14) as "different drawing". Body copy and label weight now match the zoom by eye.
- Fan blades (round 4): 7 fat blades with dark wedges. The clip's blades still meet more closely at the rim, and its gaps are darkest near the hub. Its blades also have a grainier JPEG texture that the clean vector does not have.
- The grid hairlines are #e5/#e9, a little darker than the clip's #e7/#eb.
- The checker still says "varies" for the #dcdcdc fin box at 2.5 s and 4.4 s (−12 px). Those moments are after the build, and only the fan blades move then, so this looks like blade phase falling inside the box rather than a timing error.
- The checker's quick run (3.9 / 4.4 s) said STATIC. The fans turn 112.5° in 0.5 s, which is only 9.6° past one blade pitch, so the two moments look almost the same. The full run in round 3 did not say STATIC.
- Bottom fins: the clip's lower fin strip has rounded bottom corners and tiny dark tick dots under it; mine has a 4 px radius and the ticks sit behind the strip.
- Pale state (0.25 s): the clip board sits ~4 px lower than its final place; mine does not move.
- No pointer interaction is shown in the clip; the button has simple hover/press states only. No --drive run.

## Pattern

**A cast shadow is a swept silhouette, not a blurred blob.** A long product shadow in a skeuomorphic drawing has a sharp edge where it leaves the object and a soft far edge, and it is darkest next to the object. Stepping the object's silhouette 2 px at a time along the light direction, each copy at a few percent black, builds that shape and falloff in one group. A light blur (2–3 px) then hides the steps without washing out the near edge. One big Gaussian blur on a polygon spreads the shadow evenly in every direction and loses the direction the eye reads first. Measure the far edge (here x 650, y 535) and the flat tone (#de on #f9) with --row and --col, then set the step count and per-copy opacity from them.
