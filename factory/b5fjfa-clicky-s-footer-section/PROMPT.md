Rebuild the lookap entry "Clicky's Footer Section" by Clicky as one self-contained HTML file at factory/b5fjfa-clicky-s-footer-section/index.html.

What you have
- factory/b5fjfa-clicky-s-footer-section/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/b5fjfa-clicky-s-footer-section/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A light footer on a flat #f3f3f3 page. Four text columns start at y≈394: "product", "resources", "connect" and "disclaimer", with left edges at x≈291, 696, 1101 and 1505 (a 405 px pitch). Headings are near-black and links are mid-grey, in a ~22 px sans with a 52 px row pitch. Under the columns, the lowercase pixel wordmark "heyclicky" spans x 289–1867, y 664–969. Every pixel of it is a small light-blue macOS folder icon, about 56×46 px, each with a darker tab at its top left. A macOS trash can sits at the far left (x≈81) and one larger blue folder at the far right (x≈1910); both are vertically level with the wordmark's top row. "© Humansongs, Inc. 2026" is small grey type centred at the bottom (y≈1042). A soft grey blurred shadow hangs off the top edge at the centre. Motion has two parts. (1) Hover, from 0 to 4.5 s and again from 6.4 to 8.5 s: as the cursor passes over the wordmark, the folders under and near it open. Each front panel tilts forward and a white paper sheet shows above it. They close again within about 0.2 s once the cursor leaves. At 2.3 s the whole first "l" stack is open; at 7.5 s the folders of "e" and the top of "y" are open. (2) Clicking the big right-hand folder at about 4.6 s opens a macOS QuickTime-style window titled "yc-demoday.mov". The window grows from a smaller box on the right (≈926,219,764,461 at 4.67 s) to its full size, centred at 582,62,994,600, by 5.08 s. Its video area fades from translucent white through dark grey to black. Meanwhile the page behind dims to mid-grey and blurs. Around 6.2–6.35 s the window fades out and the backdrop clears back to #f3f3f3, with no blur.
- The designer's clip at its keyframes (frame 2158 x 1080, 8.58s):
  - kf1 at 2.3s: public/drafts/0pilkhe/kf1.jpg
  - kf2 at 5.7s: public/drafts/0pilkhe/kf2.jpg
  - kf3 at 7.5s: public/drafts/0pilkhe/kf3.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts b5fjfa-clicky-s-footer-section`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/b5fjfa-clicky-s-footer-section/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/b5fjfa-clicky-s-footer-section/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/b5fjfa-clicky-s-footer-section/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/b5fjfa-clicky-s-footer-section/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/b5fjfa-clicky-s-footer-section/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts b5fjfa-clicky-s-footer-section`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/b5fjfa-clicky-s-footer-section/side.png (designer left, yours right, one row per moment) and factory/b5fjfa-clicky-s-footer-section/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, page background] Page background is flat light grey ≈#f3f3f3 with no gradient (look at 2.3s)
  c02 [present, columns] Exactly 4 text columns sit above the wordmark (look at 2.3s)
  c03 [position, columns] Column left edges at x≈291, 696, 1101 and 1505 (±10px), all headings on one baseline at y≈394 (look at 2.3s)
  c04 [text, heading product] Headings read exactly 'product', 'resources', 'connect', 'disclaimer', all lowercase (look at 2.3s)
  c05 [style, heading product] Headings are near-black, clearly darker than the grey links beneath them (look at 2.3s)
  c06 [text, product links] Product column lists 'features', 'pricing', 'changelog', 'try it' in that order (look at 2.3s)
  c07 [text, resources links] Resources column lists 'trust', 'privacy', 'referrals', 'support' (look at 2.3s)
  c08 [text, connect links] Connect column lists 'instagram', 'x (twitter)', 'linkedin', 'youtube' (look at 2.3s)
  c09 [position, product links] Link rows are ≈52px apart, centred at y≈446, 497, 549, 601 (look at 2.3s)
  c10 [text, disclaimer body] Disclaimer reads '*heyclicky only sees your screen / when you press the hotkey - / screenshots are never stored*' on 3 lines (look at 2.3s)
  c11 [style, product links] Link and disclaimer text is mid-grey (≈#555–#666), regular weight, ~22px sans (look at 2.3s)
  c12 [present, heyclicky folder wordmark] A lowercase wordmark 'heyclicky' (9 letters) spans under the columns (look at 2.3s)
  c13 [position, heyclicky folder wordmark] Wordmark runs from x≈289 to x≈1867, top y≈664, baseline y≈905, descenders of both y's down to y≈969 (look at 7.5s)
  c14 [imagery, heyclicky folder wordmark] Each letter pixel is a small macOS-style folder icon, not a flat square or a brick (look at 7.5s)
  c15 [style, single folder tile] Folder body is light sky blue ≈#6dcff6, with a darker blue tab at the top-left and a lighter top edge (look at 2.3s)
  c16 [position, single folder tile] Folder tiles are ≈56×46px; the i-dot is one tile at ≈(1208,666) with a visible gap above the i stem (look at 7.5s)
  c17 [style, single folder tile] Folders overlap slightly and carry a soft bottom shadow, with no dark outline strokes (look at 7.5s)
  c18 [style, heyclicky folder wordmark] Letter strokes are one folder wide; the 'l' and 'k' are tall columns about 5 folders high above the baseline (look at 7.5s)
  c19 [present, trash can] A macOS-style silver trash can with colourful papers poking out sits at the far left, ≈(81,682,81,97) (look at 2.3s)
  c20 [imagery, trash can] The trash reads as metallic grey with a vertical sheen, not a flat grey shape (look at 2.3s)
  c21 [present, large folder] A larger blue folder ≈99×81px sits at the far right, ≈(1910,658), level with the wordmark top (look at 2.3s)
  c22 [text, copyright] Bottom line reads '© Humansongs, Inc. 2026' in small grey type, centred at x≈1079, y≈1042 (look at 2.3s)
  c23 [present, top-centre blurred shadow] A soft blurred grey shadow hangs from the top edge around x 940–1230 (look at 2.3s)
  c24 [motion, single folder tile] Folders under the cursor open: the front panel tilts forward (wider at top) and a white paper sheet shows above it (look at 2.3s)
  c25 [style, single folder tile] The revealed papers are white to pale grey, sitting behind the tilted front, not a blue outline (look at 2.3s)
  c26 [motion, heyclicky folder wordmark] At 2.3s the whole first 'l' stack is open; by 2.8s it has closed and folders further along the word are open instead (compare 2.3s with 2.8s)
  c27 [motion, heyclicky folder wordmark] At 7.5s folders in the 'e' and the top of the first 'y' (x≈520–790) are open, while the 'l' stack is closed (look at 7.5s)
  c28 [motion, heyclicky folder wordmark] Folder positions do not shift between rest frames: opening a folder tilts it in place, and the wordmark outline stays fixed (compare 0.5s with 8s)
  c29 [motion, columns] Text columns and copyright stay still across the hover period (compare 0.5s with 4s)
  c30 [motion, dim backdrop] After the big folder is clicked (~4.6s) the whole page dims to mid-grey (compare 2.3s with 5.08s)
  c31 [style, dim backdrop] With the window open, the page behind is blurred (link text unreadable), not just darkened (look at 5.7s)
  c32 [present, video window] A macOS window titled 'yc-demoday.mov' is open at the centre-top (look at 5.7s)
  c33 [position, video window] Window spans ≈x 582–1576, y 62–662, centred horizontally on the frame (look at 5.7s)
  c34 [style, video window] The light-grey title bar is ≈42px tall, with rounded top corners and a soft drop shadow round the window (look at 5.7s)
  c35 [style, traffic lights] Three dots at the top-left of the title bar, red, yellow and green from left to right (look at 5.7s)
  c36 [text, window title] Title text reads 'yc-demoday.mov' in grey, centred in the title bar (look at 5.7s)
  c37 [style, video area] Video area is solid black, filling the window below the title bar with a thin light border (look at 5.7s)
  c38 [text, video title text] Video shows 'HeyClicky' in large white type with 'Farza Majeed' beneath it, 'Majeed' in orange-red (look at 5.7s)
  c39 [imagery, speaker inset] Right-side inset ≈279×209px at (1284,274) shows a speaker photo on a pale blue background (the clip's footage or a same-size placeholder in those colours) (look at 5.7s)
  c40 [present, speaker icon] A white speaker/volume icon sits at the video's bottom-right, ≈(1527,615) (look at 5.7s)
  c41 [motion, video window] The window grows out from the right: at 4.67s it is a smaller translucent white box ≈(926,219,764,461) and reaches full size at (582,62) by 5.08s (compare 4.67s with 5.08s)
  c42 [style, video window] While opening, the window is semi-transparent: the page text shows faintly through it (look at 4.67s)
  c43 [motion, video area] Video area darkens from dark grey at 5.08s to solid black by 5.7s (compare 5.08s with 5.7s)
  c44 [motion, video window] The window fades out between ~6.2s and 6.35s; at 6.28s it is only a faint ghost and the page is readable again (compare 5.7s with 6.28s)
  c45 [motion, dim backdrop] By 7.5s the backdrop is fully gone: the page is back to #f3f3f3 with no blur and no window (compare 6.28s with 7.5s)
  c46 [style, cursor] Cursor becomes a pointing hand while over the big right folder (look at 4.67s)
  c47 [style, dim backdrop] The dim is an even grey wash over the whole frame, with no vignette and no coloured tint (look at 5.7s)
  c48 [style, heyclicky folder wordmark] Under the dim, the wordmark folders read as muted steel-blue, darker than at rest (look at 5.7s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - folder tile [1208,666,56,46] is structured: macOS Finder-style light-blue folder: darker tab at the top-left, lighter front panel, soft shadow; it opens to show a white sheet on hover. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - heyclicky wordmark [289,664,1578,305] is structured: lowercase 'heyclicky' laid out on a pixel grid of folder tiles. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - trash can [81,682,81,97] is structured: macOS silver mesh trash can with colourful crumpled papers. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - large folder [1910,658,99,81] is structured: larger macOS blue folder icon. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - top shadow [939,0,291,49] is css: blurred grey shadow at the top edge. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - video frame [588,104,982,551] is photo: YC demo day slide: black background, white 'HeyClicky', 'Farza Majeed' subtitle. Rule: licensed: take it from the clip with --patch at a moment when nothing moving covers it (a tile to repeat, or the whole region as one patch; keep it under 120 KB and crop out any UI, text or controls, which you draw), then name what was sampled and from which frame in the header comment and NOTES.md. When something moving passes over it, sample from the frame where it is clear, or several frames stitched
  - speaker inset [1284,274,279,209] is photo: a man in a dark sweater at a podium with a laptop, orange objects, pale blue backdrop. Rule: licensed: take it from the clip with --patch at a moment when nothing moving covers it (a tile to repeat, or the whole region as one patch; keep it under 120 KB and crop out any UI, text or controls, which you draw), then name what was sampled and from which frame in the header comment and NOTES.md. When something moving passes over it, sample from the frame where it is clear, or several frames stitched

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 2158 x 1080 px, background #f3f3f3. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${n} * var(--u)), never ${n}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
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
4. Write factory/b5fjfa-clicky-s-footer-section/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/b5fjfa-clicky-s-footer-section/. Do not run anything other than the probe and the checker.