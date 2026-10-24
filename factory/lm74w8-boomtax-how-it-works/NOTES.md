# Boomtax How It Works: rebuild notes

Nothing was sampled. The three isometric illustrations, the cursor and the marquee are original inline SVG and CSS. They were drawn from the 2s frame (kf1) and from 4x zooms of each column. This entry has no photo-class region.

## Timeline (clip seconds, ?demo=1, one 2.73s loop, linear)
- Header, buttons, hairlines, column labels and the column-1 documents never move.
- Column 1 marquee: the top-left corner stays at (27,218). The size goes 4x4 at 0.05s, 16x16 at 0.13s, 46x62 at 0.5s, 85x120 at 1.0s and 88x124 at 1.38s. It holds at that size to the end.
- Column 1 cursor:
  - Rides the marquee's bottom-right corner until 1.38s (114,341).
  - Drifts down-right, and its fill empties between 1.6s and 1.85s.
  - Becomes a hollow grey (#9a9ea3) triangle at 1.85 to 1.95s, as the clip shows at 2s. Its tip sits at about (146,387).
  - Fades out between 2.1s and 2.4s.
- Column 2 green pulse, envelope to puck: a soft pale-green (#8ee8a4) stretch on the wire, which runs (526,302) → (528,318) → (551,313) → (579,327) → (607,303). It is centred near x 560 to 595 at 0.13s and has left the wire by 0.5s.
- Column 2 green pulse, puck to stack: appears at 2.2s, is mid-wire (≈640 to 690, y 290 to 315) at 2.5s, and is near the stack at 2.73s.
- Column 3 blue pulse: the wire runs tag (928,281) → (928,343) → (991,377) → (1036,355) → port (1066,350). The head is 28% along at 0.13s, 64% at 0.5s, 90% at 1.38s and at the port at 2.0s. It is gone by 2.4s.
- Column 3 tag: rotates about its hook (928,281). It is at 0° until 2.1s, -5° at 2.35s and +3° at 2.55s, and back to 0° at 2.73s. The ring stays put.

### Round 2 changes (run 17)
- Pulses are longer to match the rubric's stretches: p1 is 40% of its wire (≈45px, x 555 to 600 at 0.13s), p2 is 34% (≈50px) and p3 is 34% (≈55px). Each pulse has a pale 2.6px core plus a script-made halo copy (6px, 35% opacity, 2.5px blur) driven by the same keyframes, so the stretch fades out at both ends.
- Tag sway: 0° until 2.05s, -8° about the hook at 2.5s, -3° at 2.62s and 0° at 2.73s, so 2s and 2.5s differ visibly. The ring stays put.
- Marquee: the border is now 1.5px #55b2ea, with hollow round 6px handles (white fill, blue ring), as the 0.5s zoom shows. Cursor outline is #4a4f56 and it has a larger soft shadow.
- Type: the headline (0.45px) and the titles (0.3px) are thinned with a background-coloured `-webkit-text-stroke` over Libre Baskerville. This keeps the measured widths. Titles moved down 2px. "Book a Demo" is now IBM Plex Sans 600 #101318.
- Column 1: the check ring is pale green (#9fe8b5) and the check is #5fd385. Edges are softer (#cdcfd2) and there are blurred shadows under both doc cards.

### Round 3 changes (runs 19 to 20)
- c08: "Try Boomtax Free" drops from IBM Plex Sans 500 to 400 at 13.4px with +0.15px tracking, in #f2faff. The 4x zoom at 2s now matches the clip's thinner, slightly pale label.
- c27: the marquee handles are 5px filled squares now, not 6px hollow circles. Each has a 1px #4fa9de edge and a #bfe0f5 fill, centred on the corners, matching the 4x zoom at 2s.
- The timeline did not change.
- Motion read, run 20: the render stays still in 4 of 6 spans, down from 5 of 7. The remaining spans are 0.5 to 1s, 1 to 1.38s, 1.38 to 2s and 2.25 to 2.5s. In each, the clip changes 1.4 to 4.3% and the render 0.1 to 0.2%. Pixel score is 78 to 79.

## Differences
- **Motion read, run 17: no longer STATIC.** It now reads "the render stays still in 5 of 7 spans". The 0.13 to 0.5s and 2 to 2.25s spans now register. The other five spans read 0.1 to 0.2% in the render against 1.4 to 4.3% in the clip, and that gap is mostly the recording's shake (see below).
- Headline: the checker still reports it 2x4px off. The clip's own tracked document drifts 0 to 6px between moments, so this was left alone.
- Text-stroke thinning is a workaround. If the judge still reads the serif as heavy, use a face with a real light weight, measured to the same line width.
- **Round 1 read (kept for context): the checker read STATIC. This is measured; it is not a missing animation.**
  - All 8 animations run and seek. In run 11 the render changed 0.3% of the frame from 0.13s to 0.5s.
  - The clip changes 0.9 to 4.3% per span, and most of that is recording jitter. `--track 180 --class dark` puts the headline's top edge at 78 to 81 px from frame to frame, unrelated to any event. `diff/0.5-1.png` outlines every static edge in white: the headline, the buttons and all three illustrations.
  - The design's real motion is small: a 1px marquee, a 13x19 cursor and three thin glows.
- **Clearing the flag would need ~0.3% plus ~15% of the clip's change in every span.** That is ~1800 or more changed pixels per span. Two ways to get there, both rejected:
  - Fake jitter would break c41 and c42.
  - A 4px saturated pulse (tried in run 11) cleared span 0 to 0.13s but did not match the clip's thin pale glow (c35). I reverted it to 2.2px pale green.
- Headline: Libre Baskerville 44px, within ~2 to 4px of the clip. Line 1 is about 2% narrower (≈291 against 297px).
- Titles are Libre Baskerville 15.8px and subtitles IBM Plex Sans 13.7px. Their widths were matched by eye, within ~3%.
- Illustrations: the parts are simpler than the clip's.
  - Tiles have sharp corners where the clip's are rounded.
  - The column-3 tile glyphs are simplified.
  - The ring's rim is thinner than the clip's 3D band.
- The hollow cursor triangle is slightly less rotated than the clip's.
- Interaction: the drag is drawn inside the illustration. The clip shows no hover or click on a real control, so the page has no pointer-driven marquee and `--drive` was not run.

## Pattern
**Know what a frame-change meter counts before chasing it.** A "does the render move where the clip moves" check that counts changed pixels also counts the recording's own sub-pixel shake. On a near-white page full of fine line art, a 1 to 3px jitter lights up every edge and reads as 2 to 4% change, while the design's real motion is a 1px marquee and a few thin glows that cover a tenth of that. Confirm which it is first: track the edge of something that should not move (the headline), and read one diff for white outlines on static parts. When the clip's change is shake, match the real moving parts at their measured size and document the gap. Do not inflate strokes or add motion to reach the number, because the vision judge scores the crops, not the meter.
