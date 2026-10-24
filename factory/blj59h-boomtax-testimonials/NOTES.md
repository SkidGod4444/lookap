# Boomtax Testimonials — rebuild notes

## Timeline

Round 1 measured this with --diff (0.5→1.25), --row/--col hex at 0.7–1.4 s and zooms of the rule's ends. Round 2 re-sampled the rule at y 205/206 with --col hex at x 125, 180, 260, 350, 420, 600, 850, 940, 1000, 1060 and 1125, at 0.7, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2 and 1.25 s, plus a full --row 205 hex at 1.0 s.

- 0–1.5 s: the heading, quotes, signatures, frame lines, dividers and pinstripes hold still. The diff shows only codec shimmer on glyph edges.
- 0.2–0.95 s: the heading rule (y 205, 1 px) runs x 117–1135 and touches both frame lines.
- 1.0 s: the rule shows two breaks, at x 321–383 and x 955–1087. The rest is still drawn, both ends included.
- 1.05 s: only x ≈400–955 is drawn. Both ends and the left third are gone.
- 1.1 s: x ≈400–1120 is drawn. The left part is still missing and the right end stays off.
- 1.15 s onward: x 128–1120 is drawn, which leaves gaps of about 12 px and 15 px at the frame lines.
- How it is built: eight 1 px segments. Each one switches opacity with step-end keyframes on one shared 1.5 s timeline. The switch points sit halfway between samples: 0.975, 1.025, 1.075 and 1.125 s. Under reduced motion the rule shows its final state.
- There is no pointer interaction, so there was nothing to --drive.

## Differences

- Heading (round 3): Crimson Pro at weight 360, 54.5/45.5 px, letter-spacing −0.3 px, top 60 px, left −1 px. Rounds 1–2 used Libre Caslon Text, which scored 85 on pixels. But at 4x it was visibly heavier and had a smaller x-height than the clip's light Garamond-style face. Crimson Pro matches the x-height, weight and line widths by eye (line 1 ≈395 px wide in both). Pixel score is 84 and the checker still says "different drawing" (difference 30–40), because the clip's glyphs are not the same font.
  - Tried EB Garamond 500, then 400 at 54.5 px: x-height too small, score 81.
  - Tried Crimson Pro 400 at 52 px: about 5 % too narrow and too heavy.
- Heading (round 4): the judge said 360 was too bold and had too little thick/thin contrast (c04). Changes: weight 310, letter-spacing +0.2 px, top 62 px.
  - At 4x, the stems and hairlines now match the clip's weight.
  - Line 1 now sits with no offset (difference 25). Line 2 still asks for −4 px in x, because Crimson Pro sets "Happy Customers." about 4 px wider.
  - Pixel score is 84–85 at both keyframes.
  - Tried weight 290: a touch too light. Tried top 58: worse, difference 40–55.
- Signatures (round 4): the judge said they were too bold and too dark (c31). Changes: weight 300, letter-spacing +0.15 px.
  - Name colour is now #2a2a2a and the state #2e2e2e. The clip's stems sample #464646 at their darkest across 1–2 px.
  - At 4x, the weight now matches the clip's.
- Quotes: IBM Plex Sans 14.5 px, −0.25 px tracking, #676767. The checker matches all three.
- Signatures (round 3): Crimson Pro 380, 19.8 px name and a 15.4 px state, top 376.5 px, shifted 3 px right. Difference fell from ≈20 to 18–19, and no element is reported as misplaced.
- Heading rule (round 3): 1 px #e5e5e5 with a #f1f1f1 row under it. The round-2 version (2 px #f1f1f1) matched the clip's hex but was too faint for the judge to follow in a 20 px strip. It is still touching both frame lines at 0.2 s, with ≈12 px gaps at 1.25 s (zoom checked).
- Frame lines (round 3): 2 px #e3e3e3, a step darker than the clip's #ededed (hex at y 300, x 115–116 and x 1135). The judge could not see them at #ebebeb. Other hairlines: 1 px #e9e9e9.
- Pinstripes: drawn as repeating-linear-gradients, not sampled. Pitch is 6.18 px top-left, 6.06 px top-right and 6.55 px in the band.
- The checker's motion line still says STATIC. The render's change is a few 1 px segments, which is under its threshold. The clip's 1–1.5 % frame change is mostly codec shimmer. A 4x zoom confirms the breaks are in the render at 1.0 s and the 128–1120 span at 1.25 s.
- Nothing is sampled or stood in: there is no photo-class region.

## Pattern

**Read a hairline's motion point by point, not as one move.** A 1 px rule that seems to "retract" may in fact flicker through segments: whole pieces drop out for a frame or two and come back shorter. A smooth interpolation then passes the stills and fails the mid-frames. To find out which it is, sample one column per ~100 px of the line at every 50 ms through the change and write a table of which spans are drawn. If the table shows holes away from the ends, build the line from segments with step-end opacity on one shared timeline. Do not animate left/right.
