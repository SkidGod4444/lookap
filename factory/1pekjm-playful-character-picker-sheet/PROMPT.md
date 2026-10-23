Rebuild the lookap entry "Playful Character Picker Sheet" by Harshit as one self-contained HTML file at factory/1pekjm-playful-character-picker-sheet/index.html.

What you have
- factory/1pekjm-playful-character-picker-sheet/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/1pekjm-playful-character-picker-sheet/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A single illustrated object centred on a flat near-white (#f6f6f9) canvas with a small grey home-indicator pill at bottom centre (954-1006, 1060-1070): a paper-towel/receipt roll drawn in thick royal-blue (#2826c8) outline, with a 3D box bracket on its left (672-748, 412-556) and a small tab on its right (1272-1288, 450-526). The roll's top is a cylinder (thick curved side strokes down to ~y 640) and below it straight paper hangs to a zig-zag torn bottom edge. On the paper sit list rows separated by lavender dashed lines: a 126 px rounded-square avatar with a 5 px blue border and flat-colour character illustration, a bold blue sans name (Daniel, Alex...), and on the chosen row a blue outlined check circle at the right. Collapsed state (rest 0.9-3.45 s): roll 758-1262 x 316-790, two rows, Daniel then Alex with a check. Motion: 0.15-0.85 s the paper prints down from the roll, overshooting its bottom edge to ~860 at 0.5 s and settling back to ~785, while rows ride down with it. A cursor comes in from bottom-left and clicks Alex. 3.5-4.45 s the whole roll shrinks to a narrow tall receipt (832-1160 x, top 118) that unrolls off the bottom of the frame, now listing Mia, Marcus, Leo, Emma, Daniel, Alex at a ~152 px row pitch with 80 px avatars. The hovered row (Emma) gets a pale lavender (#e8e9f8) band. 5.35-7.0 s the list scrolls inside the paper to show Ethan, Oliver, James at the top, then scrolls back so Lucas and Noah show below Alex. At ~8.05 s clicking Emma moves the check to Emma and tears the receipt along a zig-zag line just under Emma's row. 8.1-9.55 s the lower piece (Daniel, Alex, Lucas, Noah) drops out of the bottom of the frame while the upper part retracts back into the wide collapsed roll, which then rests (9.7-10.65 s) showing Leo then Emma with the check. 10.7-11.65 s it expands again into the narrow receipt, which now ends at Emma (check) with a torn edge, listing Oliver, James, Mia, Marcus, Leo, Emma.
- The designer's clip at its keyframes (frame 1964 x 1080, 12.7s):
  - kf1 at 2.2s: public/drafts/0xix829/kf1.jpg
  - kf2 at 5.1s: public/drafts/0xix829/kf2.jpg
  - kf3 at 7.6s: public/drafts/0xix829/kf3.jpg
  - kf4 at 10.2s: public/drafts/0xix829/kf4.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 1pekjm-playful-character-picker-sheet`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/1pekjm-playful-character-picker-sheet/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/1pekjm-playful-character-picker-sheet/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/1pekjm-playful-character-picker-sheet/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/1pekjm-playful-character-picker-sheet/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/1pekjm-playful-character-picker-sheet/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 1pekjm-playful-character-picker-sheet`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/1pekjm-playful-character-picker-sheet/side.png (designer left, yours right, one row per moment) and factory/1pekjm-playful-character-picker-sheet/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, canvas background] Background is a flat very light grey-lilac (~#f6f6f9) with no gradient, texture, or shadow (look at 2.2s)
  c02 [present, home indicator pill] A small grey rounded pill ~52x10 px sits centred at the bottom edge (x≈954-1006, y≈1060) (look at 2.2s)
  c03 [position, roll body outline (collapsed)] Collapsed roll spans roughly x 758-1262 and y 316-790, horizontally centred near x 1010 (look at 2.2s)
  c04 [style, roll body outline (collapsed)] Roll is drawn with a thick (~8-12px) saturated royal-blue (#2826c8) outline, paper fill near-white (look at 2.2s)
  c05 [style, roll body outline (collapsed)] Upper part of the sides bulge outward like a cylinder (thicker curved strokes) down to ~y 640, then straight paper continues below (look at 2.2s)
  c06 [style, torn bottom edge (collapsed)] Bottom edge of the paper is an irregular zig-zag torn line, not straight or rounded (look at 2.2s)
  c07 [present, left box bracket] A 3D box-shaped bracket drawn in blue outline (front face with an inner tall rectangle, visible top and side faces) attaches to the roll's left side at x≈672-748, y≈412-556 (look at 2.2s)
  c08 [present, right tab] A small narrow outlined tab (~16x76 px) sticks out of the roll's right side at x≈1272-1288, y≈450-526 (look at 2.2s)
  c09 [text, Daniel label] Upper row reads exactly "Daniel" in bold blue sans, ~38px cap-to-baseline, left edge at x≈955 (look at 2.2s)
  c10 [text, Alex label] Lower row reads exactly "Alex" in the same bold blue, left edge at x≈955, y centre ≈674 (look at 2.2s)
  c11 [style, Daniel avatar] Avatar is a rounded square (~126px, ~22px radius) with a ~5px blue border (look at 2.2s)
  c12 [imagery, Daniel avatar] Daniel avatar is an original flat drawing of a man in a red shirt on a lime-green (#c4fe43) background, not copied pixels (look at 2.2s)
  c13 [imagery, Alex avatar] Alex avatar is an original flat drawing of a dark-haired man with glasses, white collar and dark tie on a violet (#a18bf9) background (look at 2.2s)
  c14 [style, check circle] Alex row has a blue outlined circle (~52px) with a blue tick inside, unfilled, right-aligned at x≈1172-1224 (look at 2.2s)
  c15 [present, check circle] Only one row (Alex) shows a check; Daniel row has none (look at 2.2s)
  c16 [style, dashed divider] Rows are separated by horizontal lavender dashed lines (~2px, ~12px dashes) spanning the paper width, at y≈349 and y≈561 (look at 2.2s)
  c17 [present, roll body outline (collapsed)] A sliver of a third row's avatar (coral, Emma) is cut off at the top edge of the roll, implying content continues upward into the roll (look at 0.5s)
  c18 [motion, torn bottom edge (collapsed)] During the intro the paper extends downward: bottom edge is at y≈860 at 0.5s and settles back up to y≈785 by 1.0s (overshoot ~75px then return) (compare 0.5s with 1s)
  c19 [motion, Daniel avatar] Rows ride down with the paper during the intro: Daniel avatar top is at y≈440 at 0.5s and y≈380 at 1.0s (compare 0.5s with 1s)
  c20 [motion, roll body outline (collapsed)] Nothing moves between 1.0s and 2.2s except the cursor; roll, rows and check stay put (compare 1s with 2.2s)
  c21 [motion, cursor] Cursor moves from bottom-left of the roll (≈680,810 at 2.2s) up onto the Alex label by 2.7s and turns into a hand pointer (compare 2.2s with 2.7s)
  c22 [style, cursor] Over a row the cursor is a white pointing-hand with black outline, ~40px (look at 5.1s)
  c23 [motion, expanded receipt (narrow)] Between 3.5s and 4.45s the roll narrows from ~504px to ~320px wide and its top rises from y≈316 to y≈120 while the paper lengthens down past the frame bottom (compare 2.2s with 5.5s)
  c24 [position, expanded receipt (narrow)] Expanded receipt spans x≈835-1158 with top at y≈118; the bracket sits at x≈780-830, y≈187-276 (look at 5.1s)
  c25 [text, expanded receipt (narrow)] Expanded list at 5.1s reads top to bottom: "Mia", "Marcus", "Leo", "Emma", "Daniel", "Alex" (look at 5.1s)
  c26 [position, expanded receipt (narrow)] Rows in the expanded state are spaced at ~152px pitch (name centres ≈159, 306, 459, 611, 763, 914) (look at 5.1s)
  c27 [style, other avatars] In the expanded state avatars shrink to ~80px rounded squares with the same blue border, left edge at x≈863 (look at 5.1s)
  c28 [position, expanded receipt (narrow)] At 5.1s the receipt's torn bottom edge is visible at y≈985 with Alex (check) as the last row (look at 5.1s)
  c29 [style, hover row band] The hovered Emma row is filled with a pale lavender (#e8e9f8) band spanning the full paper width between its two dividers (look at 5.1s)
  c30 [present, hover row band] Rows not under the cursor have no lavender fill (look at 5.1s)
  c31 [imagery, other avatars] Each name has its own distinct original flat character avatar: Mia (coral bg, dark hair), Marcus (coral bg, blue hoodie), Leo (blue bg, red cap), Emma (coral bg, blonde girl) (look at 5.1s)
  c32 [motion, expanded receipt (narrow)] Between 5.5s and 6.38s the list scrolls inside the receipt: content moves down so new rows "Ethan", "Oliver", "James" appear at the top while the receipt outline stays fixed (compare 5.5s with 6.38s)
  c33 [text, expanded receipt (narrow)] At 6.38s list reads top to bottom: "Ethan", "Oliver", "James", "Mia", "Marcus", "Leo", "Emma" (look at 6.38s)
  c34 [text, expanded receipt (narrow)] At 7.6s list reads: "Marcus", "Leo", "Emma", "Daniel", "Alex", "Lucas", "Noah" (Lucas and Noah follow Alex) (look at 7.6s)
  c35 [imagery, other avatars] Lucas avatar is a man in red on a green background; Noah avatar is a boy with green cap on a purple/pink background; both original flat drawings (look at 7.6s)
  c36 [motion, check circle] Clicking Emma (~8.0s) puts the check circle on the Emma row at x≈1100-1132 and Alex no longer has it (compare 7.6s with 8.1s)
  c37 [present, tear line] At 8.1s a blue zig-zag tear line cuts across the receipt directly under the Emma row (y≈505-520) (look at 8.1s)
  c38 [motion, falling torn piece] After the tear the lower piece (Daniel, Alex, Lucas, Noah) slides down out of frame; by 8.82s only its torn top edge shows at y≈1030-1080 (compare 8.1s with 8.82s)
  c39 [motion, roll body outline (collapsed)] Between 8.1s and 9.7s the upper part retracts into the wide collapsed roll and returns to centre (x≈758-1262, y≈316-790) (compare 8.82s with 10.2s)
  c40 [text, roll body outline (collapsed)] At rest at 10.2s the collapsed roll shows "Leo" on top and "Emma" below with the check circle on Emma (look at 10.2s)
  c41 [motion, roll body outline (collapsed)] Between 10.2s and 10.7s the collapsed roll does not change size or position (only the cursor moves) (compare 10.2s with 10.7s)
  c42 [motion, expanded receipt (narrow)] Between 10.7s and 11.65s the roll expands again into the narrow tall receipt with top near y≈120 (compare 10.2s with 12.5s)
  c43 [text, expanded receipt (narrow)] Final expanded list reads "Oliver", "James", "Mia", "Marcus", "Leo", "Emma" and ends at Emma (check) with a torn bottom edge; Daniel/Alex/Lucas/Noah are gone (look at 12.5s)
  c44 [motion, left box bracket] The left bracket and right tab travel with the roll top: they move from y≈412-556 (collapsed) to y≈187-276 (expanded) and scale down with it (compare 2.2s with 5.1s)
  c45 [style, canvas background] No drop shadows anywhere: roll, avatars and band are flat outline-and-fill drawing (look at 5.1s)
  c46 [style, Daniel label] Name text colour is the same royal blue as the outlines (~#2826c8), not black (look at 2.2s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - Daniel avatar [802,383,126,117] is structured: flat cartoon man, short dark hair, red shirt, lime-green background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Alex avatar [803,612,126,124] is structured: flat cartoon man in profile with glasses, white collar, dark tie, brown jacket, violet background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Mia avatar [863,135,80,60] is structured: woman with long dark hair, white top, coral background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Marcus avatar [863,266,80,80] is structured: man with dark quiff in blue hoodie, coral background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Leo avatar [863,419,80,80] is structured: smiling boy with red cap, blue background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Emma avatar [863,571,80,80] is structured: smiling blonde girl, coral background. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Ethan/Oliver/James avatars [865,125,80,355] is structured: Ethan: man on purple; Oliver: man with glasses and green shirt on cyan; James: yellow-skinned man in suit on indigo. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Lucas/Noah avatars [865,850,80,220] is structured: Lucas: man in red on green; Noah: boy with green cap on pink-purple. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - roll and holder drawing [672,316,616,476] is css: blue-outlined paper roll with cylinder top, zig-zag torn bottom, 3D box bracket and side tab. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1964 x 1080 px, background #f6f6f9. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/1pekjm-playful-character-picker-sheet/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/1pekjm-playful-character-picker-sheet/. Do not run anything other than the probe and the checker.