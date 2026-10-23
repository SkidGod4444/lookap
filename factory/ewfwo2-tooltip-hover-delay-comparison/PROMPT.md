Rebuild the lookap entry "Tooltip Hover Delay Comparison" by Juliette as one self-contained HTML file at factory/ewfwo2-tooltip-hover-delay-comparison/index.html.

What you have
- factory/ewfwo2-tooltip-hover-delay-comparison/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/ewfwo2-tooltip-hover-delay-comparison/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A light, quiet comparison demo on a #f4f4f4 page: two identical white cards stacked (top [48,48,1344,480], bottom [48,552,1344,480], ~40px corner radius). Each card has a handwritten-script title at top-left ("Delay on every hover" in magenta, "Delay once, then instant" in mint green), a grey "N.Ns waiting" counter at top-right, a centred floating white formatting toolbar (691x78, ~18px radius, soft drop shadow) holding Body▾ | B I U S | link code quote | a coloured dot (magenta on top, mint on bottom), and a full-width 10px grey timeline track near the card bottom. Only one card is active at a time; the other sits at ~30% opacity. 0–7.8s the top card runs: an arrow cursor enters, turns into a pointing hand, and hovers B, I, U, S, link, code, quote left to right (~0.9s per button). Each hover shows a light-grey hover square, a small blue spinner ring plus a light-blue pill counting down "500ms"→"0ms" beside the cursor, then a near-black tooltip ("Bold ⌘B", "Italic ⌘I", …) fades in above the button; the previous tooltip lingers grey as it fades out. The waiting counter climbs 0.5s per button to 3.5s and the timeline paints one ~83px blue segment per wait, leaving seven segments and a "6.9s" label that rides the timeline's end. At ~7.8s the top card dims and the bottom card wakes: the same sweep happens, but only the first hover (B) waits 500ms; every later tooltip appears instantly in solid black with "0ms". Its counter stops at 0.5s and its timeline holds one blue segment with the label ending at "3.7s". Around 13.4–14.2s the top card fades back to full, so the clip ends holding both cards side by side: 3.5s/6.9s vs 0.5s/3.7s.
- The designer's clip at its keyframes (frame 1440 x 1080, 15.98s):
  - kf1 at 1.9s: public/drafts/7jsg6r2/kf1.jpg
  - kf2 at 4.3s: public/drafts/7jsg6r2/kf2.jpg
  - kf3 at 6.3s: public/drafts/7jsg6r2/kf3.jpg
  - kf4 at 9.1s: public/drafts/7jsg6r2/kf4.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts ewfwo2-tooltip-hover-delay-comparison`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/ewfwo2-tooltip-hover-delay-comparison/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/ewfwo2-tooltip-hover-delay-comparison/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/ewfwo2-tooltip-hover-delay-comparison/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/ewfwo2-tooltip-hover-delay-comparison/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/ewfwo2-tooltip-hover-delay-comparison/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts ewfwo2-tooltip-hover-delay-comparison`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/ewfwo2-tooltip-hover-delay-comparison/side.png (designer left, yours right, one row per moment) and factory/ewfwo2-tooltip-hover-delay-comparison/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, page background] The area around the cards is flat light grey (~#f4f4f4), slightly darker than the white cards (look at 15.5s)
  c02 [present, cards] There are exactly two white cards stacked one above the other, each about 1344x480 px (look at 15.5s)
  c03 [position, top card] The top card spans about x 48–1392, y 48–528, and the bottom card about y 552–1032, with a ~24px gap between them (look at 15.5s)
  c04 [style, top card] The card corners are large and rounded, radius about 40px (look at 15.5s)
  c05 [text, top title] The top card's title reads exactly 'Delay on every hover' in a handwritten script font (look at 15.5s)
  c06 [style, top title] The top title is magenta/pink (~#d02f9e) (look at 15.5s)
  c07 [text, bottom title] The bottom card's title reads exactly 'Delay once, then instant' in the same handwritten script (look at 15.5s)
  c08 [style, bottom title] The bottom title is mint green (~#4fd6a6) (look at 15.5s)
  c09 [text, top waiting counter] The top-right text reads '3.5s waiting', right-aligned to x≈1352, in mid grey regular sans ~22px (look at 15.5s)
  c10 [text, bottom waiting counter] The bottom card's top-right text reads '0.5s waiting' (look at 15.5s)
  c11 [position, top toolbar] The toolbar is centred horizontally in the card at about x 374–1065, y 229–307 (bottom card's at y 733–811) (look at 15.5s)
  c12 [style, top toolbar] The toolbar is white with ~18px rounded corners and a soft, wide grey drop shadow below it (not a hard border) (look at 15.5s)
  c13 [present, toolbar contents] Left to right the toolbar holds: 'Body' with a down chevron, B, I, U, S, a chain link, '< >', a quote/list icon, and a filled colour dot (look at 15.5s)
  c14 [present, toolbar dividers] Three thin light-grey vertical dividers split the toolbar: after Body, after S, and before the colour dot (look at 15.5s)
  c15 [style, colour dot] The top toolbar's dot is solid magenta and the bottom toolbar's dot is solid mint green, each ~24px (look at 15.5s)
  c16 [position, top timeline] A thin (~10px) rounded light-grey track runs across the card at y≈483, from x 88 to 1352 (look at 15.5s)
  c17 [present, top timeline segments] The top timeline shows exactly 7 separate sky-blue segments, each ~83px long, with grey gaps between (look at 15.5s)
  c18 [text, top timeline label] The top timeline ends with the black label '6.9s' near x 1255–1292 (look at 15.5s)
  c19 [present, bottom timeline segments] The bottom timeline shows exactly 1 sky-blue segment at its left end (x≈88–171) (look at 15.5s)
  c20 [text, bottom timeline label] The bottom timeline's label reads '3.7s' at about x 725–765 (look at 15.5s)
  c21 [style, bottom card] While the top card runs, the bottom card's title, counter, toolbar icons and dot are faded to about 30% (pale mint title, light grey icons) (look at 1.9s)
  c22 [style, tooltip] A settled tooltip is a near-black (~#151515) rounded rectangle (~10px radius, ~44px tall) with white text (look at 1.4s)
  c23 [text, tooltip] The tooltip over B reads 'Bold ⌘B' (look at 1.4s)
  c24 [position, tooltip] The tooltip is horizontally centred over the hovered button with its bottom ~12px above the toolbar's top edge (look at 1.4s)
  c25 [style, button hover square] The hovered button sits on a light-grey rounded square (~64x62, ~12px radius) (look at 1.4s)
  c26 [style, cursor] Over a button the cursor is a white pointing-hand with black outline; while travelling it is a black arrow (look at 1.9s)
  c27 [style, delay ms pill] Below-right of the cursor sits a thin sky-blue spinner ring followed by a light-blue rounded pill with teal-blue text (look at 1.9s)
  c28 [text, delay ms pill] The pill reads '458ms' and the ring shows a partial arc (counting down) (look at 1.9s)
  c29 [text, delay ms pill] Once the delay is over the pill reads '0ms' next to a solid sky-blue ring (look at 2.4s)
  c30 [motion, tooltip] After the cursor moves from B to I, the old 'Bold ⌘B' tooltip stays visible in grey (fading) and is replaced by a grey, fading-in 'Italic ⌘I' tooltip above I (compare 1.9s with 2.4s)
  c31 [text, top tooltip sequence] The strikethrough tooltip reads 'Strikethrough ⌘⇧X' (look at 4.8s)
  c32 [text, top tooltip sequence] The quote tooltip reads 'Quote ⌘⇧9' and is solid black (look at 7.6s)
  c33 [motion, cursor] The hand cursor steps left to right across the buttons one per ~0.9s: on I at 2.4s, on the link at 4.8s, on the quote icon at 6.8s (compare 2.4s with 6.8s)
  c34 [motion, top waiting counter] The top counter climbs in 0.5s steps as each delay completes: '0.5s waiting' at 1.9s, '1.0s' at 2.4s, '2.1s' at 4.8s, '3.2s' at 6.8s (compare 1.9s with 6.8s)
  c35 [motion, top timeline segments] The top timeline grows from 2 blue blocks plus a label '1.6s' to 4 full blocks plus a stub and label '4.0s' as the sweep proceeds (compare 2.4s with 4.8s)
  c36 [motion, timeline time label] The black time label rides just after the painted end of the timeline, moving right as time passes (e.g. ~x 285 at 1.9s, ~x 1100 at 6.8s) (compare 1.9s with 6.8s)
  c37 [motion, cards] Around 7.8s the active panel switches: the top card fades to ~30% and the bottom card's title, counter, toolbar and dot turn full strength (compare 7.6s with 9.1s)
  c38 [motion, bottom card] In the bottom card the first hover (B) shows a counting spinner '194ms' and the counter rises to '0.3s waiting' with a short blue timeline stub '0.3s' (look at 9.6s)
  c39 [motion, bottom tooltips] In the bottom card, later hovers (U onwards) show a solid black tooltip immediately with the pill at '0ms', with no counting delay and no grey fade-in (compare 11.4s with 12.6s)
  c40 [motion, bottom waiting counter] The bottom counter stays at '0.5s waiting' from the second hover to the end while its timeline adds no new blue segments (compare 11s with 15.5s)
  c41 [motion, top card] Between ~13.4s and ~14.2s the dimmed top card fades back to full strength, so at the end both cards show at full colour (compare 13.4s with 14.2s)
  c42 [motion, overall] The final state (both cards, no cursor, no tooltip) holds still from ~14.2s to the end (compare 14.5s with 15.9s)
  c43 [motion, cursor] At the start an arrow cursor rests in empty space at ~(903,380) with a pale '500ms' pill below it, before moving onto B (compare 0.5s with 1.4s)
  c44 [style, format icons] B is bold, I is a slanted bar, U is underlined, S has a strike line, all dark ~#1a1a1a at ~22px in the active toolbar (look at 15.5s)
  c45 [imagery, link / code / quote icons] The link, code and quote icons are thin-stroke line icons with the same silhouettes (chain loops, '< >', staggered lines) (look at 15.5s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - toolbar icons (B I U S link code quote, chevron) [395,250,570,36] is structured: thin-stroke formatting glyph icons in dark grey. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - cursor arrow / pointing hand [590,280,34,46] is structured: macOS-style black arrow and white pointing hand cursor. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - toolbar shadow [360,220,720,110] is css: soft wide drop shadow under the white rounded toolbar. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - delay spinner ring [625,339,24,24] is css: thin sky-blue ring with a rotating arc while counting. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1440 x 1080 px, background #fdfdfd. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/ewfwo2-tooltip-hover-delay-comparison/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/ewfwo2-tooltip-hover-delay-comparison/. Do not run anything other than the probe and the checker.