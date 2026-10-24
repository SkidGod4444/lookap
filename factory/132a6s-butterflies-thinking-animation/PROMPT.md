Rebuild the lookap entry "Butterflies Thinking Animation" by sucodee as one self-contained HTML file at factory/132a6s-butterflies-thinking-animation/index.html.

What you have
- factory/132a6s-butterflies-thinking-animation/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/132a6s-butterflies-thinking-animation/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A near-white (#fdfdfd) 1160x720 canvas with one huge black line of type, "Thinking..." in a neutral grotesque sans (Inter/SF-like, regular-medium weight, cap height ~120px), spanning x 218-934, baseline ~y405, with the g descender to ~y435. Top-right sits a small pill button "GIF" with a download-arrow icon (box ~1055,18,86,44), white fill, 1px very light grey border, fully rounded. The text and button never move. The motion is a looping swarm of small flat-illustrated butterflies (~15-35px), each with two-tone wings (upper and lower wings in different saturated colours: purple, pink, orange, yellow, teal, mint, sky blue), a white highlight dot on each wing lobe, a thin dark body and two antennae. A cycle runs ~4.3s and plays twice (0.3-3.15s and 4.7-7.6s): butterflies enter from the left of the word, flock onto the letters left to right until the glyphs are densely covered (peak ~1.0-1.7s and ~5.3-6.0s, with "Thinking" heavily covered and the dots partly), then lift off and drift up and to the right, fading and blurring as they recede (distant ones are translucent and soft), leaving the screen empty by ~3.2s and ~7.6s. Between swarms (3.2-4.65s) the frame holds plain text only; the butterflies flap (wings change silhouette frame to frame) and sit on top of the type.
- The designer's clip at its keyframes (frame 1160 x 720, 8.6s):
  - kf1 at 0.15s: public/drafts/iomvi9i/kf1.jpg
  - kf2 at 3.95s: public/drafts/iomvi9i/kf2.jpg
  - kf3 at 8.1s: public/drafts/iomvi9i/kf3.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 132a6s-butterflies-thinking-animation`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/132a6s-butterflies-thinking-animation/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/132a6s-butterflies-thinking-animation/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/132a6s-butterflies-thinking-animation/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/132a6s-butterflies-thinking-animation/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/132a6s-butterflies-thinking-animation/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 132a6s-butterflies-thinking-animation`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/132a6s-butterflies-thinking-animation/side.png (designer left, yours right, one row per moment) and factory/132a6s-butterflies-thinking-animation/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, Background] Background is a flat near-white (#fdfdfd-ish) with no gradient, texture or vignette (look at 3.95s)
  c02 [text, Headline 'Thinking...'] Headline reads exactly 'Thinking...' (capital T, three periods) (look at 3.95s)
  c03 [style, Headline 'Thinking...'] Headline is solid near-black (#090909) on white, no outline or shadow (look at 3.95s)
  c04 [style, Headline 'Thinking...'] Headline is a neutral geometric/grotesque sans at regular-to-medium weight (not bold, not serif); stem width ~20px (look at 3.95s)
  c05 [position, Headline 'Thinking...'] Headline spans x ~218 to ~934 with the T's top at y ~283 (look at 3.95s)
  c06 [position, Headline 'Thinking...'] Baseline sits at y ~405 and the g descender reaches y ~435 (look at 3.95s)
  c07 [position, Headline 'Thinking...'] Headline is horizontally near centre of the frame (centre x ~576) and its vertical centre slightly above the frame middle (~y350) (look at 3.95s)
  c08 [style, Headline 'Thinking...'] The three trailing dots are filled circles ~22px across, evenly spaced ~37px apart, sitting on the baseline (look at 3.95s)
  c09 [motion, Headline 'Thinking...'] Headline does not move, scale or change colour between the two moments (compare 0.15s with 3.95s)
  c10 [present, GIF download pill] A small pill button sits in the top-right corner (look at 3.95s)
  c11 [position, GIF download pill] Pill box is ~[1055,18,86,44], ~20px from top and right edges (look at 3.95s)
  c12 [style, GIF download pill] Pill is white with a 1px very light grey border and fully rounded ends, no shadow (look at 3.95s)
  c13 [text, GIF download pill] Pill label reads 'GIF' in dark grey sans ~15px, to the right of the icon (look at 3.95s)
  c14 [imagery, Download icon] Icon is a thin down arrow landing on a short horizontal bar, drawn in dark stroke (look at 3.95s)
  c15 [present, Butterfly swarm] At rest between swarms the frame shows only text and pill, no butterflies (look at 3.95s)
  c16 [present, Butterfly swarm] Near the start only 1-3 butterflies are visible, near the left half of the word (look at 0.15s)
  c17 [position, Butterfly swarm] Early in the cycle butterflies cluster at the left of the word (over 'Th', x ~200-450) while the right of the word is clear (look at 0.5s)
  c18 [motion, Butterfly swarm] The swarm spreads left to right across the word: at 0.5s it covers 'Th', by 1.0s it reaches the 'g' (compare 0.5s with 1s)
  c19 [present, Butterfly swarm] At peak, dozens (50+) of butterflies sit densely on the letter shapes so the word reads as patterned with butterflies (look at 1.72s)
  c20 [position, Butterfly swarm] At peak the butterflies concentrate on the glyph strokes (following the letter shapes), not as a random cloud over the whole frame (look at 1.72s)
  c21 [style, Butterfly swarm] Butterflies are drawn on top of the black type (they occlude it) (look at 1s)
  c22 [motion, Butterfly swarm] Butterflies lift off the left letters first and drift up and to the right: at 2.5s the left of the word is clear while a flock rises above 'king' (compare 1.72s with 2.5s)
  c23 [position, Butterfly swarm] Departing butterflies fly toward the upper right (y < 250, x 400-950) (look at 2.5s)
  c24 [motion, Butterfly swarm] By ~3.2s every butterfly is gone and the frame holds plain text until ~4.65s (compare 3.2s with 4.45s)
  c25 [motion, Butterfly swarm] The swarm cycle repeats: a second swarm builds on the word from ~4.7s, peaks ~6s and departs up-right by ~7.6s (compare 4.45s with 5.97s)
  c26 [present, Butterfly swarm] Late in the second cycle only a few butterflies remain upper-right (e.g. one purple near x820,y105) (look at 8.1s)
  c27 [imagery, Single butterfly (sample)] Each butterfly is a flat cartoon illustration: four rounded wing lobes, thin dark body, two antennae (structured, not photo) (look at 1s)
  c28 [style, Single butterfly (sample)] Upper and lower wings of one butterfly are different colours (e.g. pink over orange, purple over blue) (look at 1s)
  c29 [style, Single butterfly (sample)] Each wing lobe carries a small white highlight dot (look at 1s)
  c30 [style, Butterfly swarm] Palette of wings includes purple, pink, orange, yellow, teal/mint and sky blue, all saturated (look at 1.72s)
  c31 [style, Butterfly swarm] Wings have no dark outline stroke; shapes are flat fills with soft rounded edges (look at 1s)
  c32 [style, Butterfly swarm] Butterflies vary in size, roughly 15px to 35px across (look at 0.65s)
  c33 [style, Butterfly swarm] Some butterflies away from the word are translucent and blurred (depth fade), others crisp (look at 0.65s)
  c34 [motion, Butterfly swarm] Butterflies flap: a butterfly's wing silhouette changes (open vs folded) between nearby moments (compare 0.65s with 1s)
  c35 [motion, Butterfly swarm] Butterflies fade in/out with opacity at entry and exit rather than popping (compare 2.5s with 3.2s)
  c36 [style, Butterfly swarm] Butterflies are rotated at varied angles (not all upright) (look at 1s)
  c37 [motion, GIF download pill] Pill does not move or change during the swarm (compare 0.15s with 1.72s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - Butterfly swarm [200,250,760,200] is structured: dozens of flat cartoon butterflies with two-tone wings (purple, pink, orange, yellow, teal, sky blue), white wing highlight dots, dark bodies and antennae, sitting on the letters of 'Thinking...'. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - Download icon [1076,33,13,14] is structured: down arrow onto a baseline bar. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1160 x 720 px, background #fdfdfd. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${n} * var(--u)), never ${n}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

What earlier rebuilds got wrong (each failed the judge on real entries; check every one before you call a round done)
- Glows and washes flat, mis-centred or the wrong strength. A radial glow or colour wash has a centre, a peak colour and a falloff. Agents draw an even tint across the whole element. Find where it is strongest, sample the peak and two points on the way out, and build the gradient from those stops. Halftone and dot fields: match dot size, spacing and where they fade.
- Text the right words but the wrong width. A substituted or wrongly weighted font sets the same words 5 to 10 percent wider or narrower. Measure the pixel width of one full line in the clip and adjust font-size, weight and letter-spacing until your line matches it within 2 percent. Script and handwritten faces need the right family, not the nearest script.
- Motion the right kind but the wrong distance or speed. Agents get what moves right and how far wrong: a slide of 88 px built as 19, a rise twice as fast. Track every moving element and read its start, end and timing from the clip. A move is right when its position matches at three moments, not when it looks similar.
- Library outline icons where the clip has its own glyphs. Agents reach for an outline icon set. The clip's icons are often filled, chunky or glossy, and of a different shape. Match fill against outline, the weight and the silhouette; draw the SVG path from the zoomed frame instead of picking the nearest named icon.
- Blur used to fake texture or glass. A painting, canvas, grain or foliage is not a blurred gradient, and glass is not a stroked outline. Painted or photographic imagery comes from the clip itself (sampled, under the imagery rule) or is drawn with real texture. Glass shows the background displaced and magnified inside the shape, with a bright rim.
- Strokes and small marks drawn too thin or too small. Rings, spinners, chevrons, ticks, dashes, dots and outlines come out thinner and smaller than the clip's almost every time: an agent's default is a 1.5 px line icon. Measure the stroke width and the mark's outer size in source pixels and use those numbers. A spinner is usually a thick ring on a faint track, not a thin open arc.
- Positions and spacing off by tens of pixels. Parts land 20 to 40 px from where the clip has them, and repeated parts get uneven spacing. Read every box from the clip, not by eye: the brief's boxes are a first pass, so confirm each against a frame. Repeated parts (rings, rows, cards) share one pitch; measure it once and step by it.
- Shapes simplified and small parts dropped. A bubble's tail, an antenna, the gaps in staggered bars, a curved bulge built as a straight wedge, a sliver of an avatar: agents simplify the outline and drop small parts. Before drawing any shape, zoom on it and list its parts; check each part is in your render.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/132a6s-butterflies-thinking-animation/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/132a6s-butterflies-thinking-animation/. Do not run anything other than the probe and the checker.