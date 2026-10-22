Rebuild the lookap entry "Painterly Finance App Onboarding" by Moiz Arshi as one self-contained HTML file at factory/i61wwn-painterly-finance-app-onboarding/index.html.

What you have
- factory/i61wwn-painterly-finance-app-onboarding/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- factory/i61wwn-painterly-finance-app-onboarding/rubric.json: the checklist this rebuild is judged against, written from the clip. Its summary: A single portrait phone screen (315x685, about 36px corner radius) sits centred on a near-white #fdfdfd canvas. A classical oil-painting landscape fills the whole screen: pale beige-green sky, a tall dark-green tree on the right with a red-brown trunk, a lilac hill, and yellow-green foliage at the bottom. Over the painting sit large concentric glass lens rings. They are centred low on the screen behind the spinner at about (812,650) and are about 104px apart. Each ring refracts and smears the painting at its bright rim, and the rings run off the left and right edges of the screen. In the lower third is a frosted, translucent rounded card (277x158, radius about 16). Its top-centre carries a small, slightly lighter translucent disc (about 68px) holding a static white 9-spoke spinner with a dark centre dot. Below it are three centred lines of small white body copy. At the bottom, 16px above the screen edge, is a white pill button reading "Get Started" in dark medium type. Only one thing moves: the lens rings ripple outward from the centre continuously and evenly. A ring's top edge rises at about 50px/s along the centre column (382 to 357 between 5.95s and 6.45s), so a new ring spawns about every 2s, and the look repeats about every 12s (6.45s ≈ 18.5s). The painting itself, the card, the spinner, the text, the button and the phone frame all stay perfectly still.
- The designer's clip at its keyframes (frame 1628 x 1080, 24.18s):
  - kf1 at 5.95s: public/drafts/8sxtm9v/kf1.jpg
  - kf2 at 18s: public/drafts/8sxtm9v/kf2.jpg
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through `bun scripts/probe.ts i61wwn-painterly-finance-app-onboarding`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to factory/i61wwn-painterly-finance-app-onboarding/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to factory/i61wwn-painterly-finance-app-onboarding/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to factory/i61wwn-painterly-finance-app-onboarding/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to factory/i61wwn-painterly-finance-app-onboarding/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to factory/i61wwn-painterly-finance-app-onboarding/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: `bun --conditions=react-server scripts/check-build.ts i61wwn-painterly-finance-app-onboarding`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes factory/i61wwn-painterly-finance-app-onboarding/side.png (designer left, yours right, one row per moment) and factory/i61wwn-painterly-finance-app-onboarding/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
  c01 [style, page background] The canvas around the phone is flat near-white (about #fdfdfd) with no gradient, pattern or shadow (look at 5.95s)
  c02 [present, phone screen] A single portrait phone screen is visible, centred horizontally in the frame (look at 5.95s)
  c03 [position, phone screen] The screen spans about x 655–970 and y 199–883 (about 315x685 px) (look at 5.95s)
  c04 [style, phone screen] All four screen corners are rounded with a radius of about 36px, and there is no device bezel, border or drop shadow (look at 5.95s)
  c05 [present, painting backdrop] A painterly landscape with visible brush/canvas texture fills the entire screen edge to edge (look at 5.95s)
  c06 [style, painting backdrop] The top third of the screen is a pale beige/sage sky tone (about #b4ab8b to #a9a88a) (look at 5.95s)
  c07 [style, painting backdrop] A tall dark green (about #1c2724) tree mass occupies the right side of the screen from about y 290 to y 800 (look at 5.95s)
  c08 [style, painting backdrop] The bottom strip of the screen (y ~800–883) is saturated green foliage with yellow-green patches at the lower left (look at 5.95s)
  c09 [imagery, painting backdrop] The painting is either a licensed texture or a placeholder covering the same full-screen box with the same dominant colours (beige sky top, dark green right, lilac/yellow-green lower left, green bottom); the clip's pixels are not copied (look at 5.95s)
  c10 [present, glass lens rings] At least 3 concentric circular arcs cross the screen, each showing the painting refracted and displaced at a bright rim rather than as a drawn outline (look at 5.95s)
  c11 [position, glass lens rings] The rings share a centre near the spinner at about (812,650), and their top edges cross the centre column near y 278, 383 and 487 (look at 5.95s)
  c12 [position, glass lens rings] Neighbouring rings are spaced about 104px apart radially (look at 5.95s)
  c13 [style, glass lens rings] The rings are wider than the screen: their arcs run off both the left and right screen edges and are clipped by the rounded screen (look at 5.95s)
  c14 [imagery, glass lens rings] The ring material is glass: inside each band the painting is shifted and magnified, with a light highlight along the rim (e.g. the tree edge jumps sideways where it crosses a ring) (look at 5.95s)
  c15 [motion, glass lens rings] The rings expand outward: the ring top edge in column x=812 moves up from about y 382 to about y 357 (about 25px) between the two moments (compare 5.95s with 6.45s)
  c16 [motion, glass lens rings] The expansion is steady and linear at about 50px/s with no pause, easing or stop between the two moments (compare 5.5s with 7.5s)
  c17 [motion, glass lens rings] New rings keep spawning from the centre throughout the clip, so the pattern at 6.45s looks the same as at 18.5s (a loop of about 12s) (compare 6.45s with 18.5s)
  c18 [motion, painting backdrop] Outside the ring rims the underlying painting does not pan, zoom or change: the beige sky at the very top of the screen stays the same (compare 5.95s with 6.45s)
  c19 [present, frosted text card] A translucent frosted rectangle sits in the lower third of the screen, with the painting visible through it (look at 5.95s)
  c20 [position, frosted text card] The card spans about x 674–951 and y 648–806, inset about 19px from each side of the screen (look at 5.95s)
  c21 [style, frosted text card] The card has rounded corners of about 16px and no visible border line (look at 5.95s)
  c22 [style, frosted text card] The card lightens the painting behind it slightly (a whitish veil of low opacity) without hiding the painting's shapes (look at 5.95s)
  c23 [present, spinner halo disc] A circular translucent lighter disc about 68px across sits behind the spinner (look at 5.95s)
  c24 [position, spinner halo disc] The disc is centred at about (812,650), straddling the card's top edge, with about half of it above the card (look at 5.95s)
  c25 [present, spinner] A white radial spinner icon is centred in the halo disc (look at 5.95s)
  c26 [style, spinner] The spinner has exactly 9 white rectangular spokes radiating from the centre (look at 5.95s)
  c27 [style, spinner] The spinner centre is a dark grey filled dot about 8px across, ringed by the spokes (look at 5.95s)
  c28 [position, spinner] The spinner spans about 45px wide, centred at about (812,650) (look at 5.95s)
  c29 [motion, spinner] The spinner does not rotate: its spokes are in the same orientation at both moments (compare 3s with 3.3s)
  c30 [text, body copy] The card text reads exactly "Take control of your finances with budgets that fit your needs and help you reach your goals faster." (look at 5.95s)
  c31 [text, body copy] The copy breaks into exactly 3 centred lines: "Take control of your finances with" / "budgets that fit your needs and help" / "you reach your goals faster." (look at 5.95s)
  c32 [style, body copy] The copy is white or near-white, regular weight, about 13px, sans-serif, at high but slightly soft brightness (look at 5.95s)
  c33 [position, body copy] The text lines' baselines sit at about y 712, 731 and 750 (line pitch ~19px), horizontally centred on x ≈ 812 (look at 5.95s)
  c34 [present, Get Started button] A solid white pill button sits near the bottom of the screen (look at 5.95s)
  c35 [position, Get Started button] The button spans about x 674–951 and y 824–867, about 16px above the screen bottom edge (look at 5.95s)
  c36 [style, Get Started button] The button is fully rounded (semicircular ends) and pure opaque white with no border or visible shadow (look at 5.95s)
  c37 [text, button label] The button label reads exactly "Get Started" (look at 5.95s)
  c38 [style, button label] The label is near-black, medium weight, about 13px, centred in the pill (look at 5.95s)
  c39 [motion, frosted text card] The card, its text and the button stay in place with no shift, fade or scale between the two moments (only the painting refracted through them changes) (compare 5.95s with 18s)
  c40 [motion, phone screen] The phone screen's outline and position do not change across the clip (compare 0.5s with 18s)

Imagery (what the clip shows that is not plain UI, and the rule for each):
  - painting backdrop [655,199,315,685] is photo: Impressionist oil landscape: pale beige-sage sky, tall dark-green tree on the right with a red-brown trunk, lilac distant hill at left, yellow-green bushes lower-left, deep green grass at the bottom; visible canvas weave. Rule: do not copy the clip's pixels. Stand it in with `--placeholder x,y,w,h --t t --as name` (a coarse colour grid of the region: same box, same colour layout, no detail), blur or grain it to the clip's softness, put data-imagery="not reproduced: <what the clip shows>" on that element, and draw everything that sits on it yourself. --patch refuses anything bigger than a texture tile without a licence file
  - glass lens rings [655,199,315,685] is css: Concentric refracting glass rings (~104px spacing) centred near (812,650) that displace and magnify the painting, with a light rim highlight; they expand outward continuously. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - frosted text card [674,648,277,158] is css: Translucent frosted glass panel, radius ~16, lightly whitened. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - spinner halo disc [778,616,68,68] is css: Small translucent circular glass disc behind the spinner. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)
  - spinner [790,628,45,44] is css: White 9-spoke radial spinner with a dark grey centre dot. Rule: draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a lens or glass drawn as a stroked outline; type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of 1628 x 1080 px, background #fdfdfd. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A texture, never the whole picture: a photograph, painting or screenshot is a photo-class region and follows its rule above. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write factory/i61wwn-painterly-finance-app-onboarding/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside factory/i61wwn-painterly-finance-app-onboarding/. Do not run anything other than the probe and the checker.