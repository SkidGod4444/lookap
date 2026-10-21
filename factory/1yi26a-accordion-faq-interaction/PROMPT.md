Rebuild the lookap entry "Accordion FAQ Interaction" by Damir Sokolovsky as one self-contained HTML file at factory/1yi26a-accordion-faq-interaction/index.html.

What you have
- factory/1yi26a-accordion-faq-interaction/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- The designer's clip at its keyframes (frame 1434 x 1080, 15.4s):
  - kf1 at 1.45s: public/drafts/oork06q/kf1.jpg
  - kf2 at 4.2s: public/drafts/oork06q/kf2.jpg
  - kf3 at 4.95s: public/drafts/oork06q/kf3.jpg
  - kf4 at 7.25s: public/drafts/oork06q/kf4.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 1yi26a-accordion-faq-interaction`:
    --sheet a,b              a contact sheet of that span at 10 fps (36 frames), written to factory/1yi26a-accordion-faq-interaction/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --col x --t t1,t2        light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --track x --from a --to b  the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 1yi26a-accordion-faq-interaction`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and diffs against the clip: the keyframes and, with the clip on disk, the middle of every measured phase, where things are mid-flight. It prints a 0..100 score per moment with the boxes and regions that differ most, and writes factory/1yi26a-accordion-faq-interaction/side.png (designer left, yours right, one row per moment, in time order). Read side.png after every run; your eyes judge what the numbers cannot. --at t1,t2 adds moments of your own.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1434 x 1080 px, background #e5e1d9. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes you looked at. The draft boxes are a first pass: trust your eyes over them. Fills from the palette, exact hex. Match proportion and hierarchy first, then colour, then motion.
- Motion as CSS animations that start at load: animation-delay for when a move starts, duration and distance from draft.phases and draft.motion, so the state at t seconds matches the keyframe at t. No JS timers for the timeline. JS only for what CSS cannot express, and then through element.animate so the checker can seek it. Respect prefers-reduced-motion.
- Materials are part of the design: rims, bevels, inner highlights, the lip under a key, the ring around a button, a strap's stitching. Zoom into the frames (crop with --col/--row numbers in mind, or Read a keyframe) and draw what is there. A texture that is not drawable (marble, wood, a photo) may be sampled from the clip as a small JPEG data URI, cropped where no UI covers it; say so in NOTES.md.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 450 lines.

Loop
1. Read the sheets for the whole clip. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing) from --track, and the layout from --col and the keyframes. Then build.
2. Run the checker, read side.png. Fix the three largest differences, motion first. Run the checker again. Stop at a score of 90 or above, or after 3 runs of the checker.
3. Write factory/1yi26a-accordion-faq-interaction/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured),: "Differences" (what still differs, with numbers) and "Pattern" (one thing you learned that applies beyond this entry, such as how a surface is lit, how a thing enters or settles, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/1yi26a-accordion-faq-interaction/. Do not run anything other than the probe and the checker.