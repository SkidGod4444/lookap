Rebuild the lookap entry "Boomtax CTA and Footer" by lookap as one self-contained HTML file at factory/1dyli6-boomtax-cta-and-footer/index.html.

What you have
- factory/1dyli6-boomtax-cta-and-footer/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/1dyli6-boomtax-cta-and-footer/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A static light-grey (#fbfbfb) closing section 1252x606 in three horizontal bands. Top band (y 0-76) is empty apart from a faint field of vertical hairline stripes spanning x≈115-1140, closed by a 1px light-grey rule at y≈76. Middle CTA band (y 76-365): on the left a two-line near-black serif headline "Ready to / Get Started?" (~46px, x 117) above two square-cornered 40px buttons, a solid blue (#0097fb) "Try Boomtax Free" and a white, thinly bordered "Book a Demo". The right two-thirds hold an isometric line illustration (x≈455-1077, y≈128-325): five white extruded badge tiles (HIPAA card, round AICPA SOC 2 puck, a long CERTIFIED bar in the centre, COMODO card, IRS card, PCI DSS card) with soft grey sides and small round port dots, all joined by thin 1px grey stepped/zig-zag wires. Bottom footer band (y 365-606) sits under another rule; its side margins (x 0-115 and 1135-1252) are filled with the same vertical hairline stripes. Footer content: serif "Boomtax" wordmark ("tax" heavier) with "© 2025. BoomTax - All rights reserved." under it, then four link columns (Product, Forms, Support, Tools) with serif headings at y≈424 and grey sans links on a 28px rhythm; the Tools column runs off the bottom edge. The only motion: short blue light pulses (about 20-60px long) run along the grey connector wires between badges all through the clip, several at once on different wires. The wire turns blue where a pulse passes and goes grey again after it. Layout, text, badges and buttons never move. Frame-wide faint edge flicker in the difference views is video compression, not motion.
- The designer's clip at its keyframes (frame 1252 x 606, 3.53s):
  - kf1 at 1.6s: public/drafts/btcta/kf1.jpg
  - kf2 at 3s: public/drafts/btcta/kf2.jpg
  - kf3 at 3.4s: public/drafts/btcta/kf3.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 1dyli6-boomtax-cta-and-footer`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/1dyli6-boomtax-cta-and-footer/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/1dyli6-boomtax-cta-and-footer/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/1dyli6-boomtax-cta-and-footer/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/1dyli6-boomtax-cta-and-footer/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/1dyli6-boomtax-cta-and-footer/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 1dyli6-boomtax-cta-and-footer`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/1dyli6-boomtax-cta-and-footer/side.png (designer left, yours right, one row per moment) and factory/1dyli6-boomtax-cta-and-footer/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, page background] Background is a flat near-white light grey (~#fbfbfb), no gradient (look at 1.6s)
  c02 [position, top rule] A full-width 1px light grey horizontal rule sits at y≈76 (look at 1.6s)
  c03 [position, footer rule] A second full-width 1px light grey rule sits at y≈365 separating CTA band from footer (look at 1.6s)
  c04 [present, top stripe field] The top band (y 0-76) shows faint vertical hairline stripes spanning roughly x 115-1140, with plain background left of x 115 (look at 1.6s)
  c05 [style, top stripe field] Stripes are very faint thin vertical lines (barely darker than the background), not solid bars or a dark pattern (look at 1.6s)
  c06 [present, footer stripe margins] Footer side margins (x 0-115 and x 1135-1252, y 366-606) are filled with the same faint vertical stripes while the footer content area between them is plain (look at 1.6s)
  c07 [text, headline] Headline reads exactly 'Ready to' on line 1 and 'Get Started?' on line 2 (look at 1.6s)
  c08 [style, headline] Headline is a near-black serif face at ~46px cap-to-descender, regular weight (look at 1.6s)
  c09 [position, headline] Headline left edge at x≈117, first line top ≈148, second line baseline ≈232 (look at 1.6s)
  c10 [position, primary button] Blue button box about x 116-248, y 254-294 (132x40), left-aligned with the headline (look at 1.6s)
  c11 [style, primary button] Primary button fill is a solid saturated blue ~#0097fb with square or near-square (≤3px) corners (look at 1.6s)
  c12 [text, primary button] Primary button label reads 'Try Boomtax Free' in white sans ~14px (look at 1.6s)
  c13 [position, secondary button] Secondary button sits right of the primary with ~9px gap, about x 257-361, same 40px height (look at 1.6s)
  c14 [style, secondary button] Secondary button is white with a very faint 1px grey border, square corners (look at 1.6s)
  c15 [text, secondary button] Secondary button reads 'Book a Demo' in dark near-black sans (look at 1.6s)
  c16 [position, badge illustration] Illustration occupies about x 455-1077, y 128-325, right of the CTA text (look at 1.6s)
  c17 [present, badge illustration] Exactly six badge objects are visible: HIPAA card, round SOC 2 puck, CERTIFIED bar, COMODO card, IRS card, PCI DSS card (look at 1.6s)
  c18 [style, badge illustration] Badges are drawn in isometric projection as white extruded slabs with light grey shaded side faces and thin grey outlines, no heavy drop shadows (look at 1.6s)
  c19 [position, HIPAA card] HIPAA card top-left of the illustration at about x 507-659, y 130-225 (look at 1.6s)
  c20 [imagery, HIPAA card] HIPAA card shows a blue outlined pill logo with padlock icon and 'HIPAA COMPLIANT', an original drawing with the same blue colour and silhouette (look at 1.6s)
  c21 [imagery, SOC 2 puck] SOC 2 badge is a round cylindrical puck (not a slab) with a blue and black ring seal reading 'AICPA SOC 2' (look at 1.6s)
  c22 [text, CERTIFIED bar] Centre bar carries the word 'CERTIFIED' in dark serif type along its top face, angled up to the right (look at 1.6s)
  c23 [style, CERTIFIED bar] CERTIFIED bar is a long tall extruded block with small round port dots on its end faces (look at 1.6s)
  c24 [imagery, COMODO card] Top-right card shows a red padlock mark and red 'COMODO' word (look at 1.6s)
  c25 [imagery, IRS card] Lower-middle card shows a black IRS logo (eagle with horizontal lines and 'IRS') (look at 1.6s)
  c26 [imagery, PCI DSS card] Right card shows a dark green 'PCI' mark with green check and 'DSS COMPLIANT' (look at 1.6s)
  c27 [style, connector wires] Badges are linked by thin ~1px grey lines that run in stepped zig-zag paths between small round port dots (look at 1.6s)
  c28 [style, connector wires] Wires are plain hairlines: no arrows, no dashes, no thick tubes (look at 1.6s)
  c29 [present, blue wire pulses] At least two short blue segments are visible on different grey wires at the same moment (look at 2.1s)
  c30 [style, blue wire pulses] A pulse is the wire itself turning blue over a short stretch (~20-60px), same 1px width and soft fading ends, not a dot, glow blob or thick bar (look at 2.1s)
  c31 [motion, blue wire pulses] Blue segments are on different wires/positions between 1.6s and 2.1s (e.g. on the IRS-PCI wire near x 895-945 at 1.6s and on the SOC2-CERTIFIED and IRS left wires near x 625-770 at 2.1s) (compare 1.6s with 2.1s)
  c32 [motion, blue wire pulses] Pulses travel along the wire paths (following their bends) rather than fading in and out in place (compare 2.5s with 3s)
  c33 [motion, blue wire pulses] Between 3.0s and 3.4s the pulse on the COMODO wire (near x 790-845, y 185-200) has shifted position along the wire (compare 3s with 3.4s)
  c34 [motion, blue wire pulses] Pulses run continuously across the whole clip: some wire carries blue at 0.5s, 1s, 2.1s, 2.5s, 3s and 3.4s (compare 0.5s with 3.4s)
  c35 [motion, blue wire pulses] After a pulse passes, the wire behind it returns to plain grey (no permanent blue trail builds up) (compare 1s with 3s)
  c36 [motion, badge illustration] The badge tiles themselves do not move, scale or change between 1.6s and 3.4s (compare 1.6s with 3.4s)
  c37 [motion, page layout] Headline, buttons and footer text stay fixed for the whole clip; only the wire pulses change (compare 0.5s with 3.4s)
  c38 [text, Boomtax wordmark] Footer wordmark reads 'Boomtax' in near-black serif, with 'tax' set heavier than 'Boom' (look at 1.6s)
  c39 [position, Boomtax wordmark] Wordmark left edge at x≈145, vertical centre ≈427 (look at 1.6s)
  c40 [text, copyright] Under the wordmark reads exactly '© 2025. BoomTax - All rights reserved.' in mid-grey sans ~14px (look at 1.6s)
  c41 [present, footer columns] Exactly four link columns with headings 'Product', 'Forms', 'Support', 'Tools' in that order left to right (look at 1.6s)
  c42 [position, footer columns] Column headings start at x≈459, 581, 744 and 871 on a shared line at y≈424 (look at 1.6s)
  c43 [style, footer columns] Column headings are near-black serif ~18px; links beneath are lighter grey sans ~14px (look at 1.6s)
  c44 [text, Product column] Product links read 'Home', 'Features', 'Pricing', 'Login' (look at 1.6s)
  c45 [text, Forms column] Forms links read 'ACA Forms', '1099 Forms', 'W-2 Forms', 'Pay Data Reporting' (look at 1.6s)
  c46 [text, Support column] Support links read 'Tax News', 'Knowledgebase', 'Chat', 'Contact Us' (look at 1.6s)
  c47 [text, Tools column] Tools links read 'Do I need to file ACA?', 'Do I need to file CA Pay Data Reports?', 'ACA Code Series 1', 'ACA Code Series 2', 'Employee vs Contractor', 'Do I need to file a BOI Report' (look at 1.6s)
  c48 [position, footer columns] Link rows are spaced ~28px apart starting at y≈456 (456, 484, 512, 540, ...) (look at 1.6s)
  c49 [position, Tools column] The sixth Tools link sits at y≈596 and is cut off by the bottom frame edge (look at 1.6s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - HIPAA badge [507,130,152,95] is structured: isometric white slab with blue 'HIPAA COMPLIANT' pill logo and padlock. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - SOC 2 puck [457,230,115,85] is structured: round isometric puck with blue/black AICPA SOC 2 seal. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - CERTIFIED bar [636,172,140,118] is structured: long extruded block lettered 'CERTIFIED' with port dots. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - COMODO badge [798,133,152,95] is structured: white slab with red padlock 'COMODO SSL CERTIFICATE' logo. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - IRS badge [748,236,118,88] is structured: white slab with black IRS eagle logo. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - PCI DSS badge [924,205,152,105] is structured: white slab with green PCI DSS COMPLIANT logo. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - connector wires + pulses [560,180,390,145] is css: 1px grey stepped wires with short blue pulses travelling along them. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - hairline stripe fields [0,0,1252,606] is css: faint vertical hairline stripes in the top band and footer side margins. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - Boomtax wordmark [145,412,128,30] is structured: serif wordmark, 'tax' bolder. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1252 x 606 px, background #fbfbfb. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${n} * var(--u)), never ${n}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

What earlier rebuilds got wrong (each failed the judge on real entries; check every one before you call a round done)
- Glows and washes flat, mis-centred or the wrong strength. A radial glow or colour wash has a centre, a peak colour and a falloff. Agents draw an even tint across the whole element. Find where it is strongest, sample the peak and two points on the way out, and build the gradient from those stops. Halftone and dot fields: match dot size, spacing and where they fade.
- Text the right words but the wrong width. A substituted or wrongly weighted font sets the same words 5 to 10 percent wider or narrower. Measure the pixel width of one full line in the clip and adjust font-size, weight and letter-spacing until your line matches it within 2 percent. Script and handwritten faces need the right family, not the nearest script.
- Motion the right kind but the wrong distance or speed. Agents get what moves right and how far wrong: a slide of 88 px built as 19, a rise twice as fast. Track every moving element and read its start, end and timing from the clip. A move is right when its position matches at three moments, not when it looks similar.
- Library outline icons where the clip has its own glyphs. Agents reach for an outline icon set. The clip's icons are often filled, chunky or glossy, and of a different shape. Match fill against outline, the weight and the silhouette; draw the SVG path from the zoomed frame instead of picking the nearest named icon.
- Secondary text set too light. Subtitles, captions and body copy end up a lighter grey than the clip's. Anti-aliasing makes an averaged sample look lighter than the ink: take the darkest pixels inside the glyph stems, not the average of the text box.
- Strokes and small marks drawn too thin or too small. Rings, spinners, chevrons, ticks, dashes, dots and outlines come out thinner and smaller than the clip's almost every time: an agent's default is a 1.5 px line icon. Measure the stroke width and the mark's outer size in source pixels and use those numbers. A spinner is usually a thick ring on a faint track, not a thin open arc.
- Positions and spacing off by tens of pixels. Parts land 20 to 40 px from where the clip has them, and repeated parts get uneven spacing. Read every box from the clip, not by eye: the brief's boxes are a first pass, so confirm each against a frame. Repeated parts (rings, rows, cards) share one pitch; measure it once and step by it.
- Shapes simplified and small parts dropped. A bubble's tail, an antenna, the gaps in staggered bars, a curved bulge built as a straight wedge, a sliver of an avatar: agents simplify the outline and drop small parts. Before drawing any shape, zoom on it and list its parts; check each part is in your render.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/1dyli6-boomtax-cta-and-footer/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/1dyli6-boomtax-cta-and-footer/. Do not run anything other than the probe and the checker.