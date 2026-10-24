Rebuild the lookap entry "GPU Pods Card Animation" by Rah Man Designer as one self-contained HTML file at factory/b0jj7f-gpu-pods-card-animation/index.html.

What you have
- factory/b0jj7f-gpu-pods-card-animation/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/b0jj7f-gpu-pods-card-animation/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A centred 1080×1080 light composition: a #eeeeee backdrop with a faint 3×3 grid of hairlines (x≈234/847, y≈234/847). It holds one off-white card (#f9f9f9, ~16px radius, soft white rim and very soft shadow) at [293,286,494,509]. Inside the card's top is an inset illustration panel [302,295,476,291] with a barely visible 1px border. It shows a skeuomorphic grey GPU: a brushed-silver rounded board [370,382,237,100] with two dark 7-blade fans in grey rings, four dark corner screws, and white heatsink fin strips peeking above and below. A row of tiny tick dots runs above it, and a long soft drop shadow falls toward the lower right. A short black cable runs from the right side into a small square port plate with four screws and a dark round socket. Below, left-aligned at x=321, sit the black semibold title "GPU Pods", two lines of mid-grey body copy, and a dark near-black gradient "Deploy Pod" button (~8px radius, white label, soft drop shadow). Motion: at 0s the panel is empty. From ~0.1s to 0.3s a pale, flat, low-contrast GPU fades in with its tick rows. Around 0.3–0.5s a pale port plate and cable appear to the right. From ~0.5s to 1.0s the drawing gains depth: fans darken, screws, fins and shadow appear, the cable turns black, and the plate settles ~5px left to x≈645. From then to 7.8s the only motion is both fans spinning continuously. Card, text and button never move.
- The designer's clip at its keyframes (frame 1080 x 1080, 7.8s):
  - kf1 at 3.9s: public/drafts/owtsr84/kf1.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts b0jj7f-gpu-pods-card-animation`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/b0jj7f-gpu-pods-card-animation/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/b0jj7f-gpu-pods-card-animation/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/b0jj7f-gpu-pods-card-animation/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/b0jj7f-gpu-pods-card-animation/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/b0jj7f-gpu-pods-card-animation/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts b0jj7f-gpu-pods-card-animation`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/b0jj7f-gpu-pods-card-animation/side.png (designer left, yours right, one row per moment) and factory/b0jj7f-gpu-pods-card-animation/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, Backdrop] Background is a flat light grey (~#eeeeee), not white (look at 3.9s)
  c02 [present, Grid hairlines] Faint thin grid lines cross the backdrop at about x=234, x=847, y=234 and y=847 (look at 3.9s)
  c03 [position, Card] Card spans about x 293–787, y 286–795 and is centred in the frame (look at 3.9s)
  c04 [style, Card] Card is off-white (~#f9f9f9), slightly lighter than the backdrop, with rounded corners ~16px (look at 3.9s)
  c05 [style, Card] Card edge reads as a soft white rim and diffuse shadow, with no dark or hard outline stroke (look at 3.9s)
  c06 [position, Illustration panel] Inset panel occupies the card's top about x 302–778, y 295–586, ending ~24px above the title (look at 3.9s)
  c07 [style, Illustration panel] Panel boundary is a barely visible 1px light-grey line with rounded corners, same fill as the card (look at 3.9s)
  c08 [position, GPU board] GPU board rectangle spans about x 370–607, y 382–482 inside the panel (look at 3.9s)
  c09 [style, GPU board] Board is a silver metal face with a light-to-darker grey gradient, a thin grey edge and ~10px radius, not a flat single colour (look at 3.9s)
  c10 [present, Fans] Exactly two round fans sit side by side on the board, centres near (437,431) and (540,431) (look at 3.9s)
  c11 [style, Left fan] Each fan has a light grey outer ring, dark grey curved blades and a light hub with a ring around a pale centre (look at 3.9s)
  c12 [imagery, Left fan] Fan shows about 7 curved, swept blades (6–8), not straight spokes (look at 3.9s)
  c13 [present, Board screws] Four dark round screws sit at the board's four corners (look at 3.9s)
  c14 [present, Heatsink fins top] A white fin strip shows above the board's top edge, topped by a row of tiny tick dots near y≈364 (look at 3.9s)
  c15 [present, Heatsink fins bottom] A white segmented fin strip shows under the board's bottom edge, about y 482–498 (look at 3.9s)
  c16 [style, GPU drop shadow] A soft blurred grey shadow falls to the lower right of the GPU, extending to about x 650, y 530; no hard-edged shadow shape (look at 3.9s)
  c17 [style, Cable] A short black cable with a collar joins the board's right edge to the port plate at about y 431 (look at 3.9s)
  c18 [position, Port plate] Port plate is a small rounded white square at about x 645–710, y 399–465 (look at 3.9s)
  c19 [style, Port plate] Port plate has four small grey screws at its corners and a dark round socket in its centre (look at 3.9s)
  c20 [text, Title] Title reads exactly "GPU Pods" (look at 3.9s)
  c21 [style, Title] Title is near-black, semibold, about 26px, left edge at x≈321 (look at 3.9s)
  c22 [text, Body copy] Body reads "Deploy a dedicated GPU environment for AI" on line 1 and "development, testing, and model fine-tuning." on line 2 (look at 3.9s)
  c23 [style, Body copy] Body text is mid-grey (~#8c8c8c), clearly lighter than the title, about 17px with ~27px line spacing (look at 3.9s)
  c24 [position, Deploy Pod button] Button spans about x 321–448, y 720–766, left-aligned with the title (look at 3.9s)
  c25 [style, Deploy Pod button] Button fill is near-black with a subtle top-lighter vertical gradient and ~8px corner radius (look at 3.9s)
  c26 [text, Deploy Pod button] Button label reads "Deploy Pod" in white, ~16px, centred (look at 3.9s)
  c27 [style, Deploy Pod button] Button casts a soft grey drop shadow below it (look at 3.9s)
  c28 [present, Illustration panel] At the very start the illustration panel is empty: no GPU, cable or plate visible (look at 0s)
  c29 [present, Card] Card, title, body and button are already fully visible at 0s (no entrance for the text block) (look at 0s)
  c30 [motion, GPU board] Between 0s and 0.3s a pale, low-contrast flat GPU (board, two light-grey fans, tick rows above and below) appears in the panel (compare 0s with 0.3s)
  c31 [style, GPU board] At 0.25s the GPU is still flat and pale: no screws, no shadow, light grey fans (look at 0.25s)
  c32 [motion, Port plate] The port plate and a grey cable are absent at 0.25s and present (still pale) by 0.5s, plate at about x 650–715 (compare 0.25s with 0.5s)
  c33 [motion, GPU board] Between 0.5s and 1.0s the GPU gains depth: fans darken, corner screws, heatsink fins and the lower-right drop shadow appear (compare 0.5s with 1s)
  c34 [motion, Cable] Between 0.5s and 1.0s the cable turns from mid grey to black and the port plate settles ~5px left (to x≈645) (compare 0.5s with 1s)
  c35 [motion, GPU board] The GPU illustration has finished building by ~1.0s and looks the same at 1.0s and 2.5s apart from the fans (compare 1s with 2.5s)
  c36 [motion, Left fan] The left fan's blades rotate between 3.9s and 4.4s while the fan ring stays in place (compare 3.9s with 4.4s)
  c37 [motion, Right fan] The right fan's blades rotate between 3.9s and 4.4s (compare 3.9s with 4.4s)
  c38 [motion, Fans] Fans are still spinning near the end of the clip (blade positions differ between 7.0s and 7.5s) (compare 7s with 7.5s)
  c39 [motion, GPU board] After 1s the board, screws, cable and plate do not move; only fan blades change between 3.9s and 4.4s (compare 3.9s with 4.4s)
  c40 [motion, Card] Card, title, body copy and button do not move or change across the whole clip (compare 1s with 7.5s)
  c41 [imagery, GPU board] GPU is drawn as a clean skeuomorphic vector (gradients, soft shadow), not a photo, and matches the clip's silhouette: board, 2 fans, fins, cable, plate (look at 3.9s)
  c42 [style, GPU board] Whole illustration stays greyscale: no colour hues anywhere (look at 3.9s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - GPU illustration [370,362,340,170] is css: skeuomorphic silver GPU board with two dark 7-blade fans, corner screws, white heatsink fins, soft drop shadow, black cable into a square port plate with socket. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - Fan [398,393,78,78] is css: round fan: grey ring, dark curved blades, light hub; spins continuously. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - Port plate [645,399,65,66] is css: white rounded square plate with 4 screws and a dark socket. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1080 x 1080 px, background #f0f0f0. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${n} * var(--u)), never ${n}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

What earlier rebuilds got wrong (each failed the judge on real entries; check every one before you call a round done)
- Glows and washes flat, mis-centred or the wrong strength. A radial glow or colour wash has a centre, a peak colour and a falloff. Agents draw an even tint across the whole element. Find where it is strongest, sample the peak and two points on the way out, and build the gradient from those stops. Halftone and dot fields: match dot size, spacing and where they fade.
- Text the right words but the wrong width. A substituted or wrongly weighted font sets the same words 5 to 10 percent wider or narrower. Measure the pixel width of one full line in the clip and adjust font-size, weight and letter-spacing until your line matches it within 2 percent. Script and handwritten faces need the right family, not the nearest script.
- Motion the right kind but the wrong distance or speed. Agents get what moves right and how far wrong: a slide of 88 px built as 19, a rise twice as fast. Track every moving element and read its start, end and timing from the clip. A move is right when its position matches at three moments, not when it looks similar.
- Blur used to fake texture or glass. A painting, canvas, grain or foliage is not a blurred gradient, and glass is not a stroked outline. Painted or photographic imagery comes from the clip itself (sampled, under the imagery rule) or is drawn with real texture. Glass shows the background displaced and magnified inside the shape, with a bright rim.
- Secondary text set too light. Subtitles, captions and body copy end up a lighter grey than the clip's. Anti-aliasing makes an averaged sample look lighter than the ink: take the darkest pixels inside the glyph stems, not the average of the text box.
- Strokes and small marks drawn too thin or too small. Rings, spinners, chevrons, ticks, dashes, dots and outlines come out thinner and smaller than the clip's almost every time: an agent's default is a 1.5 px line icon. Measure the stroke width and the mark's outer size in source pixels and use those numbers. A spinner is usually a thick ring on a faint track, not a thin open arc.
- Positions and spacing off by tens of pixels. Parts land 20 to 40 px from where the clip has them, and repeated parts get uneven spacing. Read every box from the clip, not by eye: the brief's boxes are a first pass, so confirm each against a frame. Repeated parts (rings, rows, cards) share one pitch; measure it once and step by it.
- Shapes simplified and small parts dropped. A bubble's tail, an antenna, the gaps in staggered bars, a curved bulge built as a straight wedge, a sliver of an avatar: agents simplify the outline and drop small parts. Before drawing any shape, zoom on it and list its parts; check each part is in your render.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/b0jj7f-gpu-pods-card-animation/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/b0jj7f-gpu-pods-card-animation/. Do not run anything other than the probe and the checker.