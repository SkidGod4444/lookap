# Minimal Tooltip Thinking Mode — rebuild notes

Credit: rico (@_heyrico), https://x.com/_heyrico/status/2112212712306749537

## Timeline

Read from 10 fps contact sheets (6–27.6 s) and diffs at 3.6/4.9, 13.5/17, 20.5/24, 26/28.5. All motion is blur+fade in place; nothing slides except the thinking text scroll and the header roll.

- 0.3–0.7 s: pill blur-fades in (10 px blur, 3 px settle). Never moves again.
- 1.4–1.7 s: header ring spinner + shimmering "Start thinking..." appear; counter 1s at 1.6, 2s 3.0, 3s 4.3, 4s 5.5, 5s 6.2, then Ns at N+1.1 s (8s at 9.3, 27s at 28.5).
- 1.6–5.35 s: reasoning streams at ~22.5 words/s, each word 0.45 s from blur 6 px / opacity 0. Line height 44, paragraph gap 42, list rows 45 with 10 px above and below.
- 4.05–5.65 s: text scrolls up 0 → 124 px (4.9 s) → 250 px, under a top fade mask (40 % → 100 % over 70 px).
- 6.1–6.85 s: thinking block blurs out in place (14 px). Header roll (round 2, from zooms at 6.35/6.55/6.8): "Start thinking..." is still sharp at 6.35 s and rolls up 22 px while blurring out by 6.6 s. "Working" rises 22 px from below between 6.4 and 6.9 s, still about 4 px blurred at 6.55. The spinner fades from 6.4 s and the grey chevron comes in at 6.55–6.8. The counter slides 367 → 274 between 6.36 and 6.8 s (≈315 at 6.55).
- Rows are 63 px apart from y 283: Done thinking 7.0 s; Reading 7.9 s; subtask card 8.4 s (rows 8.6, 8.7); row 1 check 10.0; row 2 check 11.0; card blurs out + Reading→Read 12.0.
- Start searching 13.1 s; count 3 → 46 from 13.7 to 15.6; chips 13.7, 13.8, 14.0, 14.2, "20+ more" 14.45; Searched 16.3.
- Delegating 17.7; card 18.3 (rows 18.45/18.55); Scanned 19.65; Mapped 20.65; card out + dot 21.6.
- Preparing the report 22.7; file card 23.15; skeleton lines 23.3/24.5/25.3/26.0; blue cursor wanders 23.2–27.3; card out 27.3; Report is ready 27.4. Finished working: the disc blur-fades in linearly over 28.05–28.65 s (check legible at 28.5). The label takes 28.05–29.05 s (still soft, ~3 px blur, at 28.5).
- Pill text (round 3, --row 150 --hex at 2.4 s): the clip's glyphs span x 636–951 (315 px), so Inter is set at 31 px, not 28. At 28 px it was only 293 px wide.
- Glyphs measured with --hex in round 2, ring re-measured in round 3. Ring spinner: 22 px outer (y 272–294), dark core about 3 px (#454545), with a short light gap (#ccc) on one side. It is now drawn with a 3.3 px stroke: a #383838 arc over ~280°, then a fade through #8a8a8a into a #dcdcdc gap over ~80°. The round-2 ring had a 4 px stroke and a 120° gradient tail, and it read too heavy. It sits on a #fdfdfd disc 4 px wider than itself, so the rail never shows through. Done dot: 13 px #d9d9d9. Chevron: 17 px wide, 2.6 px stroke #666. Shopify bag: 25×28 with the S at 1.55×. Cursor: ~20 px arrow, no outline.
- Rail at x 115 grows/shrinks with the bottom of the newest step (heights in the script).

## Differences

- Round 2 fixed the spinner, chevron, done dot, Shopify bag, cursor size, header roll timing and the Finished working blur (c08 c18 c19 c22 c25 c27 c40 c43 c44). Each one now matches the clip in zooms at 2.4, 6.55, 9.3, 20.5, 24 and 28.5 s. The spinner's centre sits about 1 px right of the clip's.
- Round 3 fixed c05 (pill text: 324 px wide vs the clip's 325 px at 2.4 s) and c08 (thinner ring with a short gap). In the clip, the pill text starts at x 636, about 5 px left of centred. Ours is centred.
- Round-3 checker: kf2 rose from 93 to 94 and kf4 from 90 to 91. The full run before the last tweak: 0.7 s 97, 2.4 s 93, 9.3 s 90, 20.5 s 81.
- Round-2 checker run: 89 (stills 92). The lowest moments (20.5 s: 81, 24 s / 28.5 s / 4.9 s: 84) come from antialiasing and the shimmer band's phase. The shimmer runs on a fixed 2 s loop, not at the clip's exact phase.
- Inter is about 1 px off in glyph widths, so chip text and row objects end up to 3 px from the clip. Object text (#525252, 500) may still be a shade darker than the clip.
- The cursor path in the file preview is approximate: eight keyframes read from the sheets, not tracked.
- The Shopify bag, favicons (acedesign, LinkedIn, X, Google), gem avatar, doc icon and cursor are original inline SVGs. Nothing was sampled or used as a placeholder, and there is no photo-class region.
- The clip has no pointer interaction, so the page has none and --drive was not used. Without ?demo the page plays the same sequence once at load. With reduced motion it shows the final transcript.

## Pattern

**Agent logs are fixed-pitch timelines.** A streaming agent transcript looks fluid, but it is built on a strict row grid (63 px here) with attachments (cards, chip groups, file previews) hung beneath the active row. Each state change is a cross-fade of two whole row variants, not an in-place text edit. "Reading → Read" and "Preparing → Report is ready" each blur out one complete row and blur in the next, which also covers the change in label width. If you build each variant as its own absolutely placed row and give every element one animation on the clip's absolute timeline, the sequence becomes seekable and easy to tune. The vertical rail is just one bar whose height follows the bottom of the newest attachment.
