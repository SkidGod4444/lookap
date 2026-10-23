Rebuild the lookap entry "Playful Feedback Toggle Buttons" by Nitish Khagwal as one self-contained HTML file at factory/16febh-playful-feedback-toggle-buttons/index.html.

What you have
- factory/16febh-playful-feedback-toggle-buttons/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/16febh-playful-feedback-toggle-buttons/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A light-gray canvas (#f1f1f1) holds one centred pair of feedback buttons. Together they look like a pill split in two by a 12 px gap: the left half (thumbs-up) runs x 174–354 and the right half (thumbs-down) runs x 366–546, both y 294–426. Each half is 180×132. Its outer end is a full semicircle (radius ~66) and its inner corners are only slightly rounded (~8 px). The fill is an off-white #f7f7f7 with a hairline gray border and a soft drop shadow underneath. Each half holds a solid black glyph about 60 px across. The thumbs-up points up and right; the thumbs-down is its mirror. A black macOS-style arrow cursor with a white outline acts out four clicks:
1. **Like on, ~0.45s.** The left half shrinks to about 0.9 scale. From 0.65s to 0.95s the glyph turns dark green, grows to about 2× and leaps up out of the button, its top reaching y≈203. Meanwhile a mint radial glow fills the button.
2. **Glyph lands, 1.0–1.25s.** The glyph drops back, turns bright green (#0dbc39) and settles on the glow.
3. **Like off, ~1.85s.** The button shrinks again. The glyph darkens to deep green, then black, and the glow fades. The button is neutral by 2.35s.
4. **Dislike on, ~2.95s.** The cursor moves to the right half and clicks. The button shrinks, and from 3.05s to 3.35s the glyph goes dark red, then bright red (#e5173f). It wobbles in place (it does not fly), and a pink radial glow fills the button.
5. **Dislike off, ~4.15s.** A second click darkens the red glyph back to black and clears the glow. Everything is neutral by 4.6s.

The only moving parts are the cursor, the press scale, the glyph colour, scale and position, and the glow.
- The designer's clip at its keyframes (frame 720 x 720, 4.83s):
  - kf1 at 1.8s: public/drafts/y181w1c/kf1.jpg
  - kf2 at 2.35s: public/drafts/y181w1c/kf2.jpg
  - kf3 at 2.9s: public/drafts/y181w1c/kf3.jpg
  - kf4 at 3.55s: public/drafts/y181w1c/kf4.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 16febh-playful-feedback-toggle-buttons`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/16febh-playful-feedback-toggle-buttons/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/16febh-playful-feedback-toggle-buttons/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/16febh-playful-feedback-toggle-buttons/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/16febh-playful-feedback-toggle-buttons/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/16febh-playful-feedback-toggle-buttons/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 16febh-playful-feedback-toggle-buttons`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/16febh-playful-feedback-toggle-buttons/side.png (designer left, yours right, one row per moment) and factory/16febh-playful-feedback-toggle-buttons/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, canvas background] The background is a flat light gray (~#f1f1f1) with no gradient or texture (look at 0.17s)
  c02 [present, like button (left half)] Exactly two separate button halves sit side by side, centred in the frame (look at 0.17s)
  c03 [position, like button (left half)] The left button spans about x 174–354, y 294–426 (≈180×132) (look at 0.17s)
  c04 [position, dislike button (right half)] The right button spans about x 366–546, y 294–426 (≈180×132) (look at 0.17s)
  c05 [position, like button (left half)] A gap of about 12 px separates the two buttons at x≈354–366 (look at 0.17s)
  c06 [style, like button (left half)] The left button's left end is a full semicircle (radius ≈66) and its right corners are only slightly rounded (≈8 px) (look at 0.17s)
  c07 [style, dislike button (right half)] The right button mirrors this: its right end is a full semicircle and its left corners are only slightly rounded (look at 0.17s)
  c08 [style, like button (left half)] At rest, the button fill is off-white (#f7f7f7), slightly lighter than the background, with a thin light-gray outline (look at 0.17s)
  c09 [style, button drop shadow] A soft, diffuse gray shadow falls just below the bottom edge of both buttons (look at 0.17s)
  c10 [present, thumbs-up glyph] A solid black thumbs-up glyph about 60 px wide is centred in the left button near (270,353) (look at 0.17s)
  c11 [imagery, thumbs-up glyph] The thumbs-up is a filled silhouette (not an outline) with a separate rounded cuff on its left, divided from the hand by a light gap (look at 0.17s)
  c12 [present, thumbs-down glyph] A solid black thumbs-down glyph is centred in the right button near (450,366), with its thumb pointing down-left and its cuff on the right (look at 0.17s)
  c13 [present, mouse cursor] A black arrow cursor with a white outline is visible below the buttons near (395,545) (look at 0.17s)
  c14 [motion, mouse cursor] The cursor travels from below the buttons (≈395,545) up onto the lower-right of the like button (≈325,400) (compare 0.17s with 0.5s)
  c15 [motion, like button (left half)] When clicked, the like button shrinks to about 0.9 scale (≈x 185–344, y 302–418) while the dislike button stays full size (compare 0.17s with 0.5s)
  c16 [motion, thumbs-up glyph] Between 0.65s and 0.95s the thumbs-up leaps upward out of the button, its top rising from y≈325 to y≈203 (compare 0.5s with 0.95s)
  c17 [motion, thumbs-up glyph] While airborne, the thumbs-up grows to about twice its size (≈90–115 px tall vs ≈60 at rest) (compare 0.5s with 0.75s)
  c18 [style, thumbs-up glyph] At the top of its leap, the thumbs-up is dark forest green (~#0d5c1f), not black (look at 0.75s)
  c19 [position, thumbs-up glyph] At its peak, the enlarged thumbs-up overflows above the button's top edge (y 294) and is not clipped by it (look at 0.75s)
  c20 [style, green glow (like active)] The like button fills with a soft mint radial glow, strongest near the glyph and fading toward the button edges (look at 1.52s)
  c21 [motion, thumbs-up glyph] Between 1.0s and 1.25s the thumbs-up drops back down and settles at its rest spot (top ≈325) (compare 0.95s with 1.3s)
  c22 [style, thumbs-up glyph] After landing, the thumbs-up is bright green (~#0dbc39) at rest size (look at 1.52s)
  c23 [style, dislike button (right half)] While like is active, the dislike button stays off-white with a black glyph (look at 1.52s)
  c24 [motion, like button (left half)] A second click on the like button (≈1.85s) shrinks it again, and the glyph becomes dark green (compare 1.8s with 2.08s)
  c25 [motion, green glow (like active)] After the second click the green glow fades out and the thumbs-up goes back to black at rest size (compare 2.08s with 2.35s)
  c26 [motion, thumbs-up glyph] Turning like off does NOT launch the glyph upward; it stays inside the button (compare 1.8s with 2.35s)
  c27 [motion, mouse cursor] The cursor moves from the lower right (≈550,515) to the lower-left of the dislike button (≈410,410) (compare 2.35s with 2.9s)
  c28 [motion, dislike button (right half)] When clicked (≈2.95s), the dislike button briefly shrinks to about 0.9 scale (compare 2.63s with 2.95s)
  c29 [style, thumbs-down glyph] Mid-transition, the thumbs-down is dark crimson (~#8a1028) (look at 3.2s)
  c30 [motion, thumbs-down glyph] During activation the thumbs-down wobbles in place (shifts ≈18 px left and slightly down, then back) but never leaves the button (compare 2.9s with 3.2s)
  c31 [style, thumbs-down glyph] Once active, the thumbs-down is bright red (~#e5173f) at rest size and position (look at 3.55s)
  c32 [style, pink glow (dislike active)] The dislike button fills with a soft pink radial glow centred on the glyph (look at 3.55s)
  c33 [style, thumbs-up glyph] While dislike is active, the thumbs-up is plain black and its button has no green glow (look at 3.55s)
  c34 [position, mouse cursor] The cursor rests off to the lower right, near (598,485) (look at 3.55s)
  c35 [motion, pink glow (dislike active)] A second click on dislike (≈4.15s) darkens the glyph to near-black red and the pink glow fades; by 4.6s the button is neutral again (compare 3.55s with 4.6s)
  c36 [motion, like button (left half)] The buttons themselves never change position across the clip; only the press scale changes (compare 0.17s with 3.55s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - thumbs-up glyph [240,323,60,61] is structured: Solid filled thumbs-up hand with a separate cuff on the left (SF-Symbols style), black at rest. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - thumbs-down glyph [420,336,60,60] is structured: Solid filled thumbs-down hand with a separate cuff on the right, black at rest. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - green glow [190,300,160,120] is css: Mint radial gradient glow inside the like button when active. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - pink glow [370,300,170,120] is css: Pink radial gradient glow inside the dislike button when active. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - mouse cursor [378,515,38,60] is structured: Black arrow pointer with white outline and slight shadow. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 720 x 720 px, background #f1f1f1. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/16febh-playful-feedback-toggle-buttons/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/16febh-playful-feedback-toggle-buttons/. Do not run anything other than the probe and the checker.