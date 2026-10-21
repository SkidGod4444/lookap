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
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/1yi26a-accordion-faq-interaction/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at 3x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/1yi26a-accordion-faq-interaction/zoom/
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/1yi26a-accordion-faq-interaction/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 1yi26a-accordion-faq-interaction`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and diffs against the clip: the keyframes and, with the clip on disk, the middle of every measured phase, where things are mid-flight. It prints a 0..100 score per moment with the boxes and regions that differ most, and writes factory/1yi26a-accordion-faq-interaction/side.png (designer left, yours right, one row per moment, in time order). --at t1,t2 adds moments of your own; --quick scores only the keyframes and your --at moments. The score is a floor, not the goal: it is a mean pixel difference, so it cannot tell a 3 px black border from a 1 px grey edge, and a grid of buttons one pixel off costs more than a missing shadow. The zoom crops are the judge.

How to look (this is where rebuilds go wrong)
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule (a flex column centred in the viewport, real heights) rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout. Both kinds can exist in one clip.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers. A row that looks "bordered" from afar is usually a 1 px light edge over a dark gap.
- Materials are part of the design: rims, bevels, inner highlights, the lip under a key, the ring around a button, a strap's stitching, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing, and it must start anywhere a person would grab: a press on a key or a button inside a draggable body must not stop the drag from beginning (play the note, let the event bubble). Test with --drive and Read the screenshots: the pressed state, the dragged state, the release.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1434 x 1080 px, background #e5e1d9. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass: trust your eyes over them. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, a photo) may be taken from the clip as a small JPEG data URI patch, cropped where nothing sits on it, and tiled or stretched by you. Never paste a whole block with its chrome, edges, caps or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets for the whole clip. Track the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing) from --track, and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment and the edge of each surface. Fix what the crops show, layout first, then materials, then motion. Run the checker again. Stop when the crops match, at a score of 90 or above, or after 3 runs of the checker.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/1yi26a-accordion-faq-interaction/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers) and "Pattern" (one thing you learned that applies beyond this entry, such as how a surface is lit, how a thing enters or settles, or which motions reflow the page, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/1yi26a-accordion-faq-interaction/. Do not run anything other than the probe and the checker.