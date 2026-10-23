Rebuild the lookap entry "FlyingPress Bento Feature Grid" by Ashik as one self-contained HTML file at factory/1ipk9s-flyingpress-bento-feature-grid/index.html.

What you have
- factory/1ipk9s-flyingpress-bento-feature-grid/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/1ipk9s-flyingpress-bento-feature-grid/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A light, centred feature section on a near-white #f2f2f4 page. At top centre is a small white pill eyebrow, "Why FlyingPress" (y≈67–97). Below it is a large near-black headline, "Real-time WordPress optimization" (≈48px, tight tracking, y≈112–160), and a one-line grey subtitle (y≈184). Under these sits a 3×2 bento grid of white cards, each 360×382 with ≈20px radius and 15px gutters (columns x=45/420/795, rows y=234/631). The upper part of each card is an illustration on a soft peach-to-orange wash, some with a faint dotted texture. Each card ends with a 20px dark title and two lines of 14px grey body text at the bottom left. The whole thing runs on a 6 s loop with 2 s beats:
(1) "Easy to Use": a FlyingPress plugin card. It shows "Active" with an orange "✓ Optimized" button and three green-checked chips until ≈2.3s. It then flips to "Inactive" / "Optimize my site" with empty-circle chips. A cursor glides onto the button at ≈3.9s and clicks it at ≈4.4s; the label blurs, and by ≈5s it is back to Active.
(2) "Fewer Settings": three toggle pills (Page Caching, Image Optimization, Critical CSS). They switch off and on, collapse into a single stacked "All optimizations" pill at ≈2.5–4.3s, then fan back out with all three on.
(3) "Core Web Vitals": three metric pills (CLS, LCP, INP) with ring gauges and Good/Poor/Needs-work badges. The middle pill is enlarged. Every ≈2s (at 0.4, 2.45, 4.4, 6.4) the list scrolls up one pill, and the ring values count and recolour.
(4) "All in One": a large white arch cut into the orange wash. Faint app-icon tiles sit behind it and fade in and out, with a glossy orange FlyingPress app icon at the bottom of the funnel.
(5) "Great Support": an orange user avatar centred in concentric peach rings, with three small white icon bubbles (?, headset, cursor) orbiting it clockwise.
(6) "Compatibility": a glossy FlyingPress icon in the middle row between a cloud tile and a "+" tile. The top row of logo tiles (W, Kinsta, grid logo) slides left and the bottom row (Elementor, cloud, +) slides right as a continuous marquee.
The header and the card frames never move.
- The designer's clip at its keyframes (frame 1200 x 1080, 11.98s):
  - kf1 at 1.4s: public/drafts/ndnejto/kf1.jpg
  - kf2 at 3.45s: public/drafts/ndnejto/kf2.jpg
  - kf3 at 5.4s: public/drafts/ndnejto/kf3.jpg
  - kf4 at 7.4s: public/drafts/ndnejto/kf4.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts 1ipk9s-flyingpress-bento-feature-grid`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/1ipk9s-flyingpress-bento-feature-grid/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/1ipk9s-flyingpress-bento-feature-grid/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/1ipk9s-flyingpress-bento-feature-grid/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/1ipk9s-flyingpress-bento-feature-grid/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/1ipk9s-flyingpress-bento-feature-grid/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts 1ipk9s-flyingpress-bento-feature-grid`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/1ipk9s-flyingpress-bento-feature-grid/side.png (designer left, yours right, one row per moment) and factory/1ipk9s-flyingpress-bento-feature-grid/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, page background] Page background is a flat very light grey (≈#f2f2f4), slightly darker than the white cards (look at 1.4s)
  c02 [text, eyebrow pill] A white pill centred at x≈600, y≈82 reads 'Why FlyingPress' with a small sun-like icon to its left (look at 1.4s)
  c03 [text, headline] Headline reads exactly 'Real-time WordPress optimization' (look at 1.4s)
  c04 [style, headline] Headline is ≈48px tall type, near-black, semibold, tightly tracked, centred on x=600 (look at 1.4s)
  c05 [text, subtitle] Subtitle reads 'FlyingPress optimizes your site with real-visitor Core Web Vitals, the same data Google uses to rank it.' in mid-grey on one line at y≈184 (look at 1.4s)
  c06 [position, grid] Six cards in a 3×2 grid: columns start at x≈45, 420, 795, rows at y≈234 and 631; each card ≈360×382 with ≈15px gaps (look at 1.4s)
  c07 [style, cards] Cards are white with ≈20px corner radius and no visible border (look at 1.4s)
  c08 [text, card titles] Card titles read, left-to-right then down: 'Easy to Use', 'Fewer Settings to Configure', 'Optimize for Core Web Vitals', 'All in One Solution', 'Great Support', 'Compatibility' (look at 1.4s)
  c09 [text, card body text] Easy to Use body reads 'Click once and FlyingPress applies caching, image and code optimizations for you.' in grey on two lines (look at 1.4s)
  c10 [text, card body text] Core Web Vitals body reads 'Every setting targets LCP, INP and CLS, the three metrics Google uses to judge page experience.' (look at 1.4s)
  c11 [text, card body text] Compatibility body reads 'Compatible with all major WordPress hosting providers, themes & plugins.' (look at 1.4s)
  c12 [style, card Easy to Use] Top of the Easy to Use card has a soft peach-to-orange gradient wash fading to white by y≈480 (look at 1.4s)
  c13 [present, plugin widget card] A white shadowed panel shows an orange app icon, 'FlyingPress' bold and 'Speed optimization' grey beneath (look at 1.4s)
  c14 [text, status badge] Badge at top right of the widget reads 'Active' in green with a green dot on pale green (look at 1.4s)
  c15 [text, orange button] Full-width orange gradient button reads '✓ Optimized' in white (look at 1.4s)
  c16 [style, chips] Three chips 'Caching', 'Images', 'CSS & JS' each show a filled green check circle (look at 1.4s)
  c17 [motion, status badge] Between 1.4s and 2.45s the widget switches to 'Inactive' (grey dot), button text 'Optimize my site', chips show empty grey circles (compare 1.4s with 2.45s)
  c18 [motion, mouse cursor] Black arrow cursor moves from ≈(349,425) at 3.45s onto the button ≈(303,388) by 3.95s (compare 3.45s with 3.95s)
  c19 [motion, orange button] At ≈4.4s the button is pressed (slightly inset, label blurred) and by 5.4s it reads '✓ Optimized' with badge 'Active' again (compare 4.4s with 5.4s)
  c20 [style, card Fewer Settings] Fewer Settings card top has an orange gradient strongest at top-centre with a fine dotted dither texture (look at 1.4s)
  c21 [position, toggle pills] Three white toggle pills stacked at y≈309, 380, 451; the middle one is shifted left by ≈29px relative to the others (look at 1.4s)
  c22 [text, toggle pills] Pill labels read 'Page Caching', 'Image Optimization', 'Critical CSS', each with a small grey icon before it (look at 1.4s)
  c23 [style, toggle pills] Page Caching toggle is orange (on) while Image Optimization and Critical CSS toggles are light grey (off) (look at 1.4s)
  c24 [motion, toggle pills] Between 1.4s and 1.9s the Page Caching toggle turns from orange to grey; all three are off at 1.9s (compare 1.4s with 1.9s)
  c25 [motion, toggle pills] At 3.45s the three pills have collapsed into one pill at y≈380 reading 'All optimizations' with two stacked pill edges peeking below it (compare 1.9s with 3.45s)
  c26 [motion, toggle pills] The 'All optimizations' toggle goes from grey at 3.45s to orange at 3.95s (compare 3.45s with 3.95s)
  c27 [motion, toggle pills] By 5.4s the stack has fanned back out into three pills with all three toggles orange (compare 4.4s with 5.4s)
  c28 [style, card Core Web Vitals] CWV card has an orange wash along its left edge with dotted texture, white elsewhere (look at 1.4s)
  c29 [present, metric pills] Exactly three metric pills are visible, stacked at y≈305, 395, 485, the middle one shifted ≈29px left (look at 1.4s)
  c30 [text, metric pill top] Top pill reads '0.02', 'CLS', 'Cumulative Layout Shift', badge 'Good' (green) (look at 1.4s)
  c31 [text, metric pill middle] Middle pill reads '1.5s', 'LCP', 'Largest Contentful Paint', badge 'Poor' in red on pale pink (look at 1.4s)
  c32 [text, metric pill bottom] Bottom pill reads '380ms', 'INP', 'Interaction to Next Paint', badge 'Needs work' in amber, all at reduced opacity (look at 1.4s)
  c33 [style, metric gauges] Each metric number sits inside a circular ring gauge ≈52px whose arc is green (good), red (poor) or amber (needs work) (look at 1.4s)
  c34 [motion, metric pill middle] LCP ring value changes from '1.5s' with 'Poor' at 1.4s to '1.2s' with green 'Good' at 1.9s (compare 1.4s with 1.9s)
  c35 [motion, metric pills] The pill list scrolls up one slot between 1.9s and 3.45s: LCP is now top, INP middle, CLS bottom (compare 1.9s with 3.45s)
  c36 [motion, metric pills] Mid-transition at 2.45s only two pills are visible near y≈326 and 416, the outgoing one fading above (look at 2.45s)
  c37 [motion, metric pills] Next scroll by 5.4s: INP top ('48ms' Good), CLS middle ('0.05' Poor), LCP bottom ('4.2s' Poor) (compare 3.45s with 5.4s)
  c38 [style, card All in One] All in One card shows a large white arch shape rising from the bottom corners, leaving an orange-washed funnel in the centre (look at 1.4s)
  c39 [present, faded app-icon tiles] Behind the arch sit faint rounded app-icon tiles with grey glyphs (e.g. 'A', gear, document, code brackets) at low contrast (look at 1.4s)
  c40 [imagery, FlyingPress app icon] A glossy orange rounded-square icon ≈75px with a white stylised 'F' made of swooshes and a soft orange glow beneath, at ≈(215,842) (look at 1.4s)
  c41 [motion, faded app-icon tiles] Some background tiles fade in or out between 1.4s and 1.9s while the arch and orange icon stay still (compare 1.4s with 1.9s)
  c42 [style, card Great Support] Great Support card shows concentric soft peach circles centred at ≈(600,778) (look at 1.4s)
  c43 [imagery, support avatar] Centre is a ≈74px glossy orange circle with a white person glyph and an orange drop shadow (look at 1.4s)
  c44 [present, orbit bubbles] Exactly three small white circular bubbles surround the avatar: an orange '?' icon, an orange headset, an orange cursor arrow (look at 1.4s)
  c45 [motion, orbit bubbles] The three bubbles rotate clockwise around the avatar: '?' moves from top ≈(637,666) at 1.4s to lower-right ≈(702,833) at 1.9s (compare 1.4s with 1.9s)
  c46 [motion, support avatar] The centre avatar does not move while the bubbles orbit (compare 1.4s with 1.9s)
  c47 [imagery, compat centre icon] Middle row centre is a glossy orange FlyingPress icon ≈75px at ≈(975,777), flanked by a cloud tile left and a '+' tile right (look at 1.4s)
  c48 [style, compat logo tiles] Surrounding tiles are pale, near-transparent rounded squares with grey logos (W circle, 'Kinsta' wordmark, Elementor E) (look at 1.4s)
  c49 [motion, compat top row] The top row of tiles slides left continuously: the W tile moves from x≈997 at 1.4s to ≈975 at 1.9s (compare 1.4s with 1.9s)
  c50 [motion, compat bottom row] The bottom row of tiles slides right continuously: the Elementor tile moves from x≈913 at 1.4s to ≈975 at 1.9s (compare 1.4s with 1.9s)
  c51 [motion, compat middle row] The middle row (cloud, orange icon, +) does not move between 1.4s and 1.9s (compare 1.4s with 1.9s)
  c52 [motion, header] Header (pill, headline, subtitle) and all six card outlines stay perfectly still between 1.4s and 3.45s (compare 1.4s with 3.45s)
  c53 [motion, loop] The top-row card states at 7.4s match 1.4s (Active, Page Caching only on, CLS/LCP/INP order): the cycle repeats every ≈6s (compare 1.4s with 7.4s)
  c54 [style, card body text] Card body text is ≈14–15px mid-grey, clearly lighter than the near-black titles (look at 1.4s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - FlyingPress app icon (widget, All in One, Compatibility) [178,805,75,75] is structured: glossy orange rounded-square app icon with a white stylised F made of two swooshes; a small version at (92,297,34,34) and another at (938,740,75,75). Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - support avatar [563,741,74,74] is css: orange gradient sphere with white person glyph and orange glow, inside concentric peach rings. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - orbit icon bubbles [470,640,265,255] is structured: white circles with orange ?, headset and cursor glyphs. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - faded app-icon tiles [60,665,320,130] is structured: pale rounded tiles with grey glyphs (A, gear, document, code, link, hourglass, check). Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - compatibility logo tiles [795,650,360,245] is structured: pale tiles with host/builder logos: W circle, Kinsta wordmark, grid logo, cloud with speed lines, Elementor E, plus. Rule: draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels
  - card gradient washes with dotted texture [420,234,360,260] is css: peach-to-orange radial/linear gradients with a fine dot dither pattern at the top of the cards. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - CWV ring gauges [810,272,100,250] is css: circular progress rings in green, red or amber around metric numbers. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1200 x 1080 px, background #f9f7f6. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${n} * var(--u)), never ${n}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above (this entry is licensed: the picture itself may be sampled). Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/1ipk9s-flyingpress-bento-feature-grid/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/1ipk9s-flyingpress-bento-feature-grid/. Do not run anything other than the probe and the checker.